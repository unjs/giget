import { execFile as execFileCb } from "node:child_process";
import { mkdtemp, rm as rmAsync, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import { resolve } from "pathe";
import type { TemplateProvider } from "./types.ts";
import { debug } from "./_utils.ts";

const execFile = promisify(execFileCb);

export const git: TemplateProvider = (input, options) => {
  const parsed = parseGitCloneURI(input);

  return {
    name: parsed.name,
    // Include subdir in version so the cache key is unique per subdir
    version: parsed.subdir
      ? `${parsed.version || "default"}-${parsed.subdir.replaceAll("/", "-")}`
      : parsed.version,
    // subdir is handled during clone (sparse checkout) and tar creation,
    // so we don't set it here to avoid double-filtering during extraction
    tar: async ({ auth } = {}) => {
      const tmpDir = await mkdtemp(join(tmpdir(), "giget-git-"));

      const token = auth || options.auth;
      const execOpts = token
        ? { env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, timeout: 60_000 }
        : { timeout: 60_000 };
      const authArgs = token ? ["-c", `http.extraHeader=Authorization: Bearer ${token}`] : [];

      const gitExec = (...args: string[]) => execFile("git", [...authArgs, ...args], execOpts);
      const gitExecIn = (...args: string[]) => execFile("git", args, { ...execOpts, cwd: tmpDir });

      try {
        // Build shallow clone args
        const cloneArgs = ["clone", "--depth", "1"];
        if (parsed.subdir) {
          cloneArgs.push("--filter=blob:none", "--sparse");
        }
        if (parsed.version) {
          cloneArgs.push("--branch", parsed.version);
        }
        cloneArgs.push(parsed.uri, tmpDir);

        try {
          await gitExec(...cloneArgs);
        } catch {
          // If shallow clone fails (e.g. specific commit), fall back to full clone + checkout
          debug("Shallow clone failed, falling back to full clone...");
          await rmAsync(tmpDir, { recursive: true, force: true });
          await mkdir(tmpDir, { recursive: true });
          await gitExec("clone", parsed.uri, tmpDir);
          if (parsed.version) {
            await gitExecIn("checkout", parsed.version);
          }
        }

        if (parsed.subdir) {
          await gitExecIn("sparse-checkout", "set", parsed.subdir);
        }

        // Create tar archive from the cloned repo (excluding .git)
        const tarDir = parsed.subdir ? join(tmpDir, parsed.subdir) : tmpDir;
        const { create } = await import("tar");
        const stream = create(
          {
            gzip: true,
            cwd: tarDir,
            filter: (path) => !path.startsWith(".git/") && path !== ".git",
          },
          ["."],
        );
        // Buffer the tar stream before cleanup removes the tmpDir
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk as Uint8Array));
        }
        return Readable.from(Buffer.concat(chunks));
      } finally {
        await rmAsync(tmpDir, { recursive: true, force: true });
      }
    },
  };
};

export function parseGitCloneURI(input: string, opts: { cwd?: string } = {}) {
  const cwd = opts.cwd ?? process.cwd();

  let uri = input.replace(/#.*$/, "");
  let pathSubdir: string | undefined;

  if (/^[./]/.test(input)) {
    // Local URI starts with . (relative) or / (absolute).
    // We return the absolute path for the provided URI.

    uri = resolve(cwd, uri);
  } else if (/^https?:\/\//.test(uri)) {
    // Git over HTTP(S) starts with http[s]://.
    // For known hosts, extract org/repo and treat the rest as subdir.
    const httpMatch = /^(https?:\/\/[^/]+)\/([\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/(.+))?$/.exec(uri);
    if (httpMatch) {
      const [, origin, repo, rest] = httpMatch;
      uri = `${origin}/${repo}`;
      if (rest) {
        pathSubdir = rest;
      }
    }
  } else {
    // Otherwise, we assume the URI is Git over SSH.
    // We need to normalize the URI into git:[pass]@<host>:<path>.

    const host = /^(.+?:)/.exec(uri)?.at(1);
    if (host) {
      switch (host) {
        case "github:":
        case "gh:": {
          uri = uri.replace(host, "github.com:");
          break;
        }
        case "gitlab:": {
          uri = uri.replace(host, "gitlab.com:");
          break;
        }
      }
    } else {
      uri = `${process.env.GIGET_GIT_HOST || "github.com"}:${uri}`;
    }

    // For SSH URIs, extract org/repo and treat extra path segments as subdir
    // e.g. github.com:org/repo/sub/dir → github.com:org/repo + subdir=sub/dir
    const sshMatch = /^(.*?:[\w.-]+\/[\w.-]+?)(?:\.git)?(?:\/(.+))?$/.exec(uri);
    if (sshMatch) {
      const [, repoUri, rest] = sshMatch;
      uri = repoUri!;
      if (rest) {
        pathSubdir = rest;
      }
    }

    if (!uri.includes("@")) {
      const username = process.env.GIGET_GIT_USERNAME || "git";
      const password = process.env.GIGET_GIT_PASSWORD;

      uri = `${password ? `${username}:${password}` : username}@${uri}`;
    }
  }

  const name = uri
    .replace(/^https?:\/\//, "")
    // Remove username-password segment
    .replace(/^.+@/, "")
    // Remove trailing git and hash
    .replace(/(\.git)?(#.*)?$/, "")
    // Remove non-words before name
    .replace(/^\W+/, "")
    // Replace special characters with -
    .replaceAll(/[:/]/g, "-");

  const [version, hashSubdir] = /#(.+)$/.exec(input)?.at(1)?.split(":") ?? [];
  const subdir = hashSubdir || pathSubdir;

  return {
    uri,
    name,
    ...(version && { version }),
    ...(subdir && { subdir }),
  };
}
