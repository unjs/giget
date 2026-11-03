import { createServer, type Server } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import type { AddressInfo } from "node:net";
import { resolve } from "pathe";
import { create } from "tar";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { download } from "../src/_utils.ts";
import { downloadTemplate } from "../src/index.ts";

describe("interrupted download", () => {
  const tmpDir = resolve(tmpdir(), `giget-download-test-${process.pid}`);
  let tarball: Buffer;
  let server: Server;
  let url: string;
  let interrupt = false;
  let etag = "v1";

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    await mkdir(resolve(tmpDir, "src/template"), { recursive: true });
    await writeFile(resolve(tmpDir, "src/template/README.md"), "# template\n");
    const chunks: Buffer[] = [];
    for await (const chunk of create({ gzip: true, cwd: resolve(tmpDir, "src") }, ["template"])) {
      chunks.push(chunk as Buffer);
    }
    tarball = Buffer.concat(chunks);

    server = createServer((req, res) => {
      res.setHeader("etag", etag);
      res.setHeader("content-type", "application/gzip");
      res.setHeader("content-length", tarball.length);
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      if (interrupt) {
        // Send part of the body, then drop the connection
        res.write(tarball.subarray(0, 10), () => res.destroy());
        return;
      }
      res.end(tarball);
    });
    await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/template.tar.gz`;
  });

  afterAll(async () => {
    server?.close();
    await rm(tmpDir, { recursive: true, force: true });
  });

  it("keeps the cached file when the download fails mid-stream", async () => {
    interrupt = false;
    etag = "v1";
    const filePath = resolve(tmpDir, "cache/template.tar.gz");
    await mkdir(resolve(tmpDir, "cache"), { recursive: true });
    await download(url, filePath);
    expect(await readFile(filePath)).toEqual(tarball);

    interrupt = true;
    etag = "v2";
    await expect(download(url, filePath)).rejects.toThrow();
    expect(await readFile(filePath)).toEqual(tarball);
  });

  it("extracts the cached template when a later download fails mid-stream", async () => {
    process.env.XDG_CACHE_HOME = resolve(tmpDir, "xdg-cache");
    const providers = {
      local: () => ({ name: "template", tar: url }),
    };
    const dir = resolve(tmpDir, "out");

    interrupt = false;
    etag = "v1";
    await downloadTemplate("local:template", { providers, dir, registry: false });
    expect(existsSync(resolve(dir, "README.md"))).toBe(true);

    interrupt = true;
    etag = "v2";
    await rm(dir, { recursive: true, force: true });
    await downloadTemplate("local:template", { providers, dir, registry: false });
    expect(await readFile(resolve(dir, "README.md"), "utf8")).toBe("# template\n");
    delete process.env.XDG_CACHE_HOME;
  });
});
