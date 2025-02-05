import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { promisify } from "node:util";
import type { Agent } from "node:http";
import { join, relative, resolve } from "pathe";
import { fetch } from "node-fetch-native/proxy";
import type { GitInfo } from "./types";
import { simpleGit as git } from "simple-git"
import { create } from "tar"

export async function createTempDir() {
  return mkdtemp(join(tmpdir(), 'giget-'))
}

export async function cloneAndArchive(url: string, filePath: string, opts: { version?: string }) {
  // Make temp working directory
  const tempDir = await createTempDir()

  if (opts.version) {
    // If we know it is a branch, we can use --branch=<branch>.
    // Otherwise, we need to clone the entire history, then check out the ref.
    const branch = opts.version.startsWith('!') && opts.version.slice(1)
    await git().clone(url, tempDir, {
      ...(branch && {
        '--branch': branch,
        // Need to pass null for simple-git option with no value
        // eslint-disable-next-line unicorn/no-null
        '--single-branch': null
      }),
    })

    // If it is not a branch, we need to checkout to the specific version
    if (!branch) {
      await git({ baseDir: tempDir }).checkout(opts.version)
    }
  } else {
    // If we do not have version, we can speed up via --depth=1.
    await git().clone(url, tempDir, { '--depth': 1 })
  }

  // Remove .git
  await rm(join(tempDir, '.git'), { force: true, recursive: true })

  // Create tar
  await create({
    file: filePath,
    cwd: tempDir,
  }, ['.'])
}

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
  return process.env.XDG_CACHE_HOME
    ? resolve(process.env.XDG_CACHE_HOME, "giget")
    : resolve(homedir(), ".cache/giget");
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
