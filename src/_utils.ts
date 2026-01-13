import { createWriteStream, existsSync, renameSync } from "node:fs";
import { pipeline } from "node:stream";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { promisify } from "node:util";
import type { Agent } from "node:http";
import { relative, resolve } from "pathe";
import { fetch } from "node-fetch-native/proxy";
import type { GitInfo } from "./types";

export async function download(
  url: string,
  filePath: string,
  options: { headers?: Record<string, string | undefined> } = {},
) {
  const infoPath = filePath + ".json";
  const info: { etag?: string } = JSON.parse(
    await readFile(infoPath, "utf8").catch(() => "{}"),
  );
  const headResponse = await sendFetch(url, {
    method: "HEAD",
    headers: options.headers,
  }).catch(() => undefined);
  const etag = headResponse?.headers.get("etag");
  if (info.etag === etag && existsSync(filePath)) {
    // Already downloaded
    return;
  }
  if (typeof etag === "string") {
    info.etag = etag;
  }

  const response = await sendFetch(url, { headers: options.headers });
  if (response.status >= 400) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const stream = createWriteStream(filePath);
  await promisify(pipeline)(response.body as any, stream);

  await writeFile(infoPath, JSON.stringify(info), "utf8");
}

const inputRegex =
  /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w./@-]+)?/;

export function parseGitURI(input: string): GitInfo {
  const m = input.match(inputRegex)?.groups || {};
  return <GitInfo>{
    repo: m.repo,
    subdir: m.subdir || "/",
    ref: m.ref ? m.ref.slice(1) : "main",
  };
}

export interface GitSourceParts {
  path: string;
  ref: string;
}

export function parseGitSource(
  input: string,
  defaultRef = "main",
): GitSourceParts {
  const hashIndex = input.indexOf("#");
  const path = (hashIndex === -1 ? input : input.slice(0, hashIndex)).replace(
    /^\/+|\/+$/g,
    "",
  );
  const ref =
    hashIndex === -1 ? defaultRef : input.slice(hashIndex + 1) || defaultRef;
  return { path, ref };
}

export function gitlabArchiveURL(
  gitlabBaseURL: string,
  repo: string,
  ref: string,
) {
  const project = repo.split("/").pop() || repo;
  return `${gitlabBaseURL}/${repo}/-/archive/${ref}/${project}-${ref}.tar.gz`;
}

export function gitlabTreeURL(
  gitlabBaseURL: string,
  repo: string,
  ref: string,
  subdir: string,
) {
  return `${gitlabBaseURL}/${repo}/-/tree/${ref}${subdir}`;
}

export function gitlabHeaders(
  auth?: string,
): Record<string, string | undefined> {
  return {
    authorization: auth ? `Bearer ${auth}` : undefined,
    // https://gitlab.com/gitlab-org/gitlab/-/commit/50c11f278d18fe1f3fb12eb595067216bb58ade2
    "sec-fetch-mode": "same-origin",
  };
}

export interface ResolvedGitlabTarget {
  repo: string;
  ref: string;
  subdir: string;
}

export async function resolveGitlabTarget(
  input: string,
  options: {
    gitlabBaseURL: string;
    auth?: string;
    fetch?: typeof sendFetch;
  },
): Promise<ResolvedGitlabTarget> {
  const { path, ref } = parseGitSource(input, "main");
  const parts = path.split("/").filter(Boolean);
  const fetcher = options.fetch || sendFetch;

  // Keep legacy behavior for simple `group/repo` inputs.
  if (parts.length <= 2) {
    return {
      repo: parts.join("/"),
      ref,
      subdir: "/",
    };
  }

  const headers = gitlabHeaders(options.auth);

  // Try longest repo first (subgroups), then gradually treat tail segments as subdir.
  for (let repoLen = parts.length; repoLen >= 2; repoLen--) {
    const candidateRepo = parts.slice(0, repoLen).join("/");
    const candidateSubdir = "/" + parts.slice(repoLen).join("/");
    const candidateTar = gitlabArchiveURL(
      options.gitlabBaseURL,
      candidateRepo,
      ref,
    );

    try {
      const head = await fetcher(candidateTar, {
        method: "HEAD",
        headers,
      });

      // GitLab may return 401/403 for private repos even if they exist.
      const existsOrPrivate =
        head.status < 400 || head.status === 401 || head.status === 403;

      if (existsOrPrivate) {
        return {
          repo: candidateRepo,
          ref,
          subdir: candidateSubdir === "/" ? "/" : candidateSubdir,
        };
      }
    } catch (error) {
      debug(`Failed to probe GitLab archive URL for ${candidateTar}:`, error);
    }
  }

  // If we couldn't disambiguate (often private repos returning 404), assume full path is repo.
  return {
    repo: parts.join("/"),
    ref,
    subdir: "/",
  };
}

export function debug(...args: unknown[]) {
  if (process.env.DEBUG) {
    console.debug("[giget]", ...args);
  }
}

interface InternalFetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string | undefined>;
  agent?: Agent;
  validateStatus?: boolean;
}

export async function sendFetch(
  url: string,
  options: InternalFetchOptions = {},
) {
  // https://github.com/nodejs/undici/issues/1305
  if (options.headers?.["sec-fetch-mode"]) {
    options.mode = options.headers["sec-fetch-mode"] as any;
  }

  const res = await fetch(url, {
    ...options,
    headers: normalizeHeaders(options.headers),
  }).catch((error: any) => {
    throw new Error(`Failed to download ${url}: ${error}`, { cause: error });
  });

  if (options.validateStatus && res.status >= 400) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }

  return res;
}

export function cacheDirectory() {
  const cacheDir = process.env.XDG_CACHE_HOME
    ? resolve(process.env.XDG_CACHE_HOME, "giget")
    : resolve(homedir(), ".cache/giget");

  if (process.platform === "win32") {
    const windowsCacheDir = resolve(tmpdir(), "giget");
    // Migrate cache dir to new location
    // https://github.com/unjs/giget/pull/182/
    // TODO: remove in next releases
    if (!existsSync(windowsCacheDir) && existsSync(cacheDir)) {
      try {
        renameSync(cacheDir, windowsCacheDir);
      } catch {
        // ignore
      }
    }
    return windowsCacheDir;
  }

  return cacheDir;
}

export function normalizeHeaders(
  headers: Record<string, string | undefined> = {},
) {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!value) {
      continue;
    }
    normalized[key.toLowerCase()] = value;
  }
  return normalized;
}

// -- Experimental --

export function currentShell() {
  if (process.env.SHELL) {
    return process.env.SHELL;
  }
  if (process.platform === "win32") {
    return "cmd.exe";
  }
  return "/bin/bash";
}

export function startShell(cwd: string) {
  cwd = resolve(cwd);
  const shell = currentShell();
  console.info(
    `(experimental) Opening shell in ${relative(process.cwd(), cwd)}...`,
  );
  spawnSync(shell, [], {
    cwd,
    shell: true,
    stdio: "inherit",
  });
}
