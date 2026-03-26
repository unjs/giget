import { basename } from "pathe";
import type { TemplateInfo, TemplateProvider } from "./types.ts";
import { debug, parseGitURI, parseGitCloneURI, sendFetch } from "./_utils.ts";

export const http: TemplateProvider = async (input, options) => {
  if (input.endsWith(".json")) {
    return (await _httpJSON(input, options)) as TemplateInfo;
  }

  const url = new URL(input);
  let name: string = basename(url.pathname);

  try {
    const head = await sendFetch(url.href, {
      method: "HEAD",
      validateStatus: true,
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      },
    });
    const _contentType = head.headers.get("content-type") || "";
    if (_contentType.includes("application/json")) {
      return (await _httpJSON(input, options)) as TemplateInfo;
    }
    const filename = head.headers.get("content-disposition")?.match(/filename="?(.+)"?/)?.[1];
    if (filename) {
      name = filename.split(".")[0]!;
    }
  } catch (error) {
    debug(`Failed to fetch HEAD for ${url.href}:`, error);
  }

  return {
    name: `${name}-${url.href.slice(0, 8)}`,
    version: "",
    subdir: "",
    tar: url.href,
    defaultDir: name,
    headers: {
      Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  };
};

const _httpJSON: TemplateProvider = async (input, options) => {
  const result = await sendFetch(input, {
    validateStatus: true,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  });
  const info = (await result.json()) as TemplateInfo;
  if (!info.tar || !info.name) {
    throw new Error(`Invalid template info from ${input}. name or tar fields are missing!`);
  }
  return info;
};

export const github: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);

  // https://docs.github.com/en/rest/repos/contents#download-a-repository-archive-tar
  // TODO: Verify solution for github enterprise
  const githubAPIURL = process.env.GIGET_GITHUB_URL || "https://api.github.com";

  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    url: `${githubAPIURL.replace("api.github.com", "github.com")}/${
      parsed.repo
    }/tree/${parsed.ref}${parsed.subdir}`,
    tar: `${githubAPIURL}/repos/${parsed.repo}/tarball/${parsed.ref}`,
  };
};

export const gitlab: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  const gitlab = process.env.GIGET_GITLAB_URL || "https://gitlab.com";
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      // https://gitlab.com/gitlab-org/gitlab/-/commit/50c11f278d18fe1f3fb12eb595067216bb58ade2
      "sec-fetch-mode": "same-origin",
    },
    url: `${gitlab}/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `${gitlab}/${parsed.repo}/-/archive/${parsed.ref}.tar.gz`,
  };
};

export const bitbucket: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
    url: `https://bitbucket.com/${parsed.repo}/src/${parsed.ref}${parsed.subdir}`,
    tar: `https://bitbucket.org/${parsed.repo}/get/${parsed.ref}.tar.gz`,
  };
};

export const sourcehut: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
    url: `https://git.sr.ht/~${parsed.repo}/tree/${parsed.ref}/item${parsed.subdir}`,
    tar: `https://git.sr.ht/~${parsed.repo}/archive/${parsed.ref}.tar.gz`,
  };
};

export const git: TemplateProvider = (input) => {
  const parsed = parseGitCloneURI(input);

  return {
    name: parsed.name,
    version: parsed.version,
    subdir: parsed.subdir,
    tar: async () => {
      const { execFileSync } = await import("node:child_process");
      const { mkdtempSync, rmSync } = await import("node:fs");
      const { tmpdir } = await import("node:os");
      const { join } = await import("node:path");
      const { Readable } = await import("node:stream");

      const tmpDir = mkdtempSync(join(tmpdir(), "giget-git-"));
      try {
        const cloneArgs = ["clone", "--depth", "1"];
        if (parsed.version) {
          // Try branch/tag first with --depth 1
          cloneArgs.push("--branch", parsed.version);
        }
        cloneArgs.push(parsed.uri, tmpDir);

        try {
          execFileSync("git", cloneArgs, { stdio: "pipe" });
        } catch {
          // If shallow clone with --branch fails (e.g. specific commit), do full clone + checkout
          debug("Shallow clone failed, falling back to full clone...");
          execFileSync("git", ["clone", parsed.uri, tmpDir], { stdio: "pipe" });
          if (parsed.version) {
            execFileSync("git", ["checkout", parsed.version], { cwd: tmpDir, stdio: "pipe" });
          }
        }

        // Create tar archive from the cloned repo (excluding .git)
        // Entries will be prefixed with "./" which gets stripped by the extract logic
        const tarBuffer = execFileSync(
          "tar",
          ["-czf", "-", "--exclude", ".git", "-C", tmpDir, "."],
          { maxBuffer: 256 * 1024 * 1024 },
        );
        return Readable.from(tarBuffer);
      } finally {
        rmSync(tmpDir, { recursive: true, force: true });
      }
    },
  };
};

export const providers: Record<string, TemplateProvider> = {
  http,
  https: http,
  git,
  github,
  gh: github,
  gitlab,
  bitbucket,
  sourcehut,
};
