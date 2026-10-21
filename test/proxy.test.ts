import * as http from "node:http";
import { createServer } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const utilsUrl = new URL("../src/_utils.ts", import.meta.url).href;

// Needs a Node.js that can enable the env proxy at runtime and run TypeScript files
const canRun =
  typeof (http as { setGlobalProxyFromEnv?: unknown }).setGlobalProxyFromEnv === "function" &&
  process.features.typescript;

describe.skipIf(!canRun)("enableProxyFromEnv", () => {
  let proxy: Server;
  let proxied: string[];
  let proxyUrl: string;

  beforeEach(async () => {
    proxied = [];
    proxy = createServer((req, res) => {
      proxied.push(`${req.method} ${req.headers.host}${req.url}`);
      res.end("from proxy");
    });
    // Node.js tunnels requests through the proxy with CONNECT, answer the request inside it
    proxy.on("connect", (req, socket) => {
      proxied.push(`CONNECT ${req.url}`);
      socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
      proxy.emit("connection", socket);
    });
    await new Promise<void>((resolve) => proxy.listen(0, "127.0.0.1", resolve));
    proxyUrl = `http://127.0.0.1:${(proxy.address() as AddressInfo).port}`;
  });

  afterEach(() => new Promise((resolve) => proxy.close(resolve)));

  // A fresh process, as the setting is global to the runtime
  async function fetchInSubprocess(enable: boolean, env: Record<string, string> = {}) {
    const code = `
      import { enableProxyFromEnv } from ${JSON.stringify(utilsUrl)};
      ${enable ? "enableProxyFromEnv();" : ""}
      const res = await fetch("http://giget-proxy-test.invalid/hello").catch(() => undefined);
      console.log(res ? await res.text() : "no response");
    `;
    // not the sync variant, that would block the proxy server running in this process
    const { stdout } = await execFileAsync(process.execPath, ["--input-type=module", "-e", code], {
      env: { PATH: process.env.PATH, HTTP_PROXY: proxyUrl, ...env },
    });
    return stdout.trim();
  }

  it("sends requests through HTTP_PROXY", async () => {
    expect(await fetchInSubprocess(true)).toBe("from proxy");
    expect(proxied).toContain("CONNECT giget-proxy-test.invalid:80");
  });

  it("does not use the proxy without it, Node.js needs NODE_USE_ENV_PROXY for that", async () => {
    expect(await fetchInSubprocess(false)).toBe("no response");
    expect(proxied).toEqual([]);
  });

  it("respects NO_PROXY", async () => {
    expect(await fetchInSubprocess(true, { NO_PROXY: "giget-proxy-test.invalid" })).toBe(
      "no response",
    );
    expect(proxied).toEqual([]);
  });
});
