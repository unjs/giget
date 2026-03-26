import { execFile as execFileCb } from "node:child_process";
import { mkdtemp, rm as rmAsync, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { promisify } from "node:util";
import type { TemplateProvider } from "./types.ts";
import { debug, parseGitCloneURI } from "./_utils.ts";

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
        const { stdout } = await execFile(
          "tar",
          ["-czf", "-", "--exclude", ".git", "-C", tarDir, "."],
          { maxBuffer: 256 * 1024 * 1024, encoding: "buffer" },
        );
        return Readable.from(stdout);
      } finally {
        await rmAsync(tmpDir, { recursive: true, force: true });
      }
    },
  };
};
