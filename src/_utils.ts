import { createWriteStream, existsSync, renameSync } from "node:fs";
import { pipeline } from "node:stream";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { promisify } from "node:util";
import type { Agent } from "node:http";
import { relative, resolve } from "pathe";
import type { GitInfo } from "./types.ts";

export async function download(
  url: string,
  filePath: string,
  options: { headers?: Record<string, string | undefined> } & FetchRetryOptions = {},
) {
  const infoPath = filePath + ".json";
  const info: { etag?: string } = JSON.parse(await readFile(infoPath, "utf8").catch(() => "{}"));
  const headResponse = await sendFetch(url, {
    method: "HEAD",
    headers: options.headers,
    retry: options.retry,
    retryDelay: options.retryDelay,
  }).catch(() => undefined);
  const etag = headResponse?.headers.get("etag");
  if (info.etag === etag && existsSync(filePath)) {
    // Already downloaded
    return;
  }
  if (typeof etag === "string") {
    info.etag = etag;
  }

  const response = await sendFetch(url, {
    headers: options.headers,
    retry: options.retry,
    retryDelay: options.retryDelay,
  });
  if (response.status >= 400) {
    throw new Error(`Failed to download ${url}: ${response.status} ${response.statusText}`);
  }

  const stream = createWriteStream(filePath);
  await promisify(pipeline)(response.body as any, stream);

  await writeFile(infoPath, JSON.stringify(info), "utf8");
}

const inputRegex = /^(?<repo>[-\w.]+\/[-\w.]+)(?<subdir>[^#]+)?(?<ref>#[-\w./@]+)?/;
const expandedInputRegex =
  /^(?<repo>[-\w.]+(?:\/[-\w.]+)+?)(?:::(?<subdir>[^#]*))?(?<ref>#[-\w./@]+)?$/;

export function parseGitURI(
  input: string,
  options?: { expandRepo?: boolean },
): Omit<GitInfo, "provider"> {
  const useExpanded = options?.expandRepo || input.includes("::");
  const m = input.match(useExpanded ? expandedInputRegex : inputRegex)?.groups || {};
  const subdir = useExpanded ? (m.subdir ? "/" + m.subdir : "/") : m.subdir || "/";
  return {
    repo: m.repo || "",
    subdir,
    ref: m.ref ? m.ref.slice(1) : "main",
  } satisfies Omit<GitInfo, "provider">;
}

export function debug(...args: unknown[]) {
  if (process.env.DEBUG) {
    console.debug("[giget]", ...args);
  }
}

export interface FetchRetryOptions {
  /**
   * How many further attempts to make when a request fails with a transient error.
   * `0` disables retrying.
   *
   * Defaults to the `GIGET_RETRY` environment variable, or 2.
   */
  retry?: number;
  /**
   * Base delay between attempts in milliseconds, doubled on each attempt. A
   * `Retry-After` response header takes precedence over it.
   *
   * Defaults to the `GIGET_RETRY_DELAY` environment variable, or 500.
   */
  retryDelay?: number;
}

interface InternalFetchOptions extends Omit<RequestInit, "headers">, FetchRetryOptions {
  headers?: Record<string, string | undefined>;
  agent?: Agent;
  validateStatus?: boolean;
}

// The set ofetch retries on, so giget and ofetch treat the same host alike.
const retryStatusCodes = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

// One wait is capped so a large -- or hostile -- `Retry-After` cannot park a build
// indefinitely. Rate-limited hosts commonly ask for a minute.
const maxRetryDelay = 60_000;

function envNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

/**
 * How long to wait before trying again.
 *
 * `Retry-After` is the server saying when it will answer, so it wins over the backoff.
 * Both forms are accepted: delta-seconds, and an HTTP date.
 */
export function retryDelayFor(
  response: Response | undefined,
  attempt: number,
  baseDelay: number,
): number {
  const after = response?.headers.get("retry-after");
  if (after) {
    const seconds = Number(after);
    const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(after) - Date.now();
    if (Number.isFinite(delay) && delay > 0) {
      return Math.min(delay, maxRetryDelay);
    }
  }

  return Math.min(baseDelay * 2 ** attempt, maxRetryDelay);
}

export async function sendFetch(url: string, options: InternalFetchOptions = {}) {
  // https://github.com/nodejs/undici/issues/1305
  if (options.headers?.["sec-fetch-mode"]) {
    options.mode = options.headers["sec-fetch-mode"] as any;
  }

  const retries = options.retry ?? envNumber("GIGET_RETRY", 2);
  const retryDelay = options.retryDelay ?? envNumber("GIGET_RETRY_DELAY", 500);

  // Only replay what is safe to replay. giget itself issues nothing but GET and HEAD,
  // and this keeps that assumption from being silently outgrown.
  const method = (options.method || "GET").toUpperCase();
  const retryable = retries > 0 && (method === "GET" || method === "HEAD");

  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    let error: unknown;

    try {
      res = await fetch(url, {
        ...options,
        headers: normalizeHeaders(options.headers),
      });
    } catch (error_: any) {
      error = error_;
    }

    const transient =
      error !== undefined || (res !== undefined && retryStatusCodes.has(res.status));
    if (!transient || !retryable || attempt >= retries) {
      if (error !== undefined) {
        throw new Error(`Failed to download ${url}: ${error}`, { cause: error });
      }
      if (options.validateStatus && res!.status >= 400) {
        throw new Error(`Failed to fetch ${url}: ${res!.status} ${res!.statusText}`);
      }
      return res!;
    }

    const delay = retryDelayFor(res, attempt, retryDelay);
    debug(
      `Retrying ${url} in ${delay}ms (${attempt + 1}/${retries}):`,
      error ?? `${res!.status} ${res!.statusText}`,
    );

    // An unread body holds the connection open.
    await res?.body?.cancel().catch(() => {});
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
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

export function normalizeHeaders(headers: Record<string, string | undefined> = {}) {
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
  console.info(`(experimental) Opening shell in ${relative(process.cwd(), cwd)}...`);
  spawnSync(shell, [], {
    cwd,
    shell: true,
    stdio: "inherit",
  });
}
