import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { expect, it, describe, beforeAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate } from "../src";

describe("downloadTemplate", () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, ".tmp"), { recursive: true, force: true });
  });

  it("clone unjs/template", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned");
    const { dir } = await downloadTemplate("gh:unjs/template", {
      dir: destinationDirectory,
      preferOffline: true,
    });
    expect(await existsSync(resolve(dir, "package.json")));
  });

  it("do not clone to exisiting dir", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/exisiting");
    await mkdir(destinationDirectory).catch(() => {});
    await writeFile(resolve(destinationDirectory, "test.txt"), "test");
    await expect(
      downloadTemplate("gh:unjs/template", { dir: destinationDirectory }),
    ).rejects.toThrow("already exists");
  });

  it("when direct no exits provider, throw Error", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned");
    expect(
      downloadTemplate("unjs/template", {
        dir: destinationDirectory,
        preferOffline: true,
        registry: false,
        provider: "no-exist-provider",
      }),
    ).rejects.toThrow("Unsupported provider: no-exist-provider");
  });

  it("when direct no exits template, throw Error", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned");
    expect(
      downloadTemplate("unjs/template", {
        dir: destinationDirectory,
        preferOffline: true,
        provider: "http",
      }),
    ).rejects.toThrow("Failed to download template from http: Invalid URL");
  });
});
