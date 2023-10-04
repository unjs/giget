import { createWriteStream, existsSync } from "node:fs";
import { pipeline } from "node:stream";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { promisify } from "node:util";
import type { Agent } from "node:http";
import { relative, resolve } from "pathe";
import { fetch } from "node-fetch-native";
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
  // eslint-disable-next-line unicorn/no-useless-undefined
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
  /^(?<repo>[\w.-]+\/[\w.-]+)(?<subdir>[^#]+)?(?<ref>#[\w.-]+)?/;

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

// eslint-disable-next-line no-undef
interface InternalFetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string | undefined>;
  agent?: Agent;
}

export async function sendFetch(
  url: string,
  options: InternalFetchOptions = {},
) {
  if (!options.agent) {
    const proxyEnv =
      process.env.HTTPS_PROXY ||
      process.env.https_proxy ||
      process.env.HTTP_PROXY ||
      process.env.http_proxy;
    if (proxyEnv) {
      const HttpsProxyAgent = await import("https-proxy-agent").then(
        (r) => r.HttpsProxyAgent || r.default,
      );
      options.agent = new HttpsProxyAgent(proxyEnv);
    }
  }

  return await fetch(url, {
    ...options,
    headers: normalizeHeaders(options.headers),
  });
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
