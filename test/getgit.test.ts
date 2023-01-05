import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { expect, it, describe, beforeAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate, registryProvider } from "../src";

describe("downloadTemplate", () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, ".tmp"), { recursive: true, force: true });
  });

  const themes = registryProvider("https://raw.githubusercontent.com/unjs/giget/main/templates")

  it("clone unjs/template", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned");
    const { dir } = await downloadTemplate("gh:unjs/template", { dir: destinationDirectory, preferOffline: true });
    expect(existsSync(resolve(dir, "package.json")));
  });

  it("clone online unjs/templates/unjs.json custom registry", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/registry/unjs");
    const { dir } = await downloadTemplate('themes:unjs', { dir: destinationDirectory, providers: { themes } })
    expect(existsSync(resolve(dir, "package.json")));
  })

  it("clone from unjs/templates/nuxt.json custom registry", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/registry/nuxt");
    const { dir } = await downloadTemplate('themes:nuxt', { dir: destinationDirectory, preferOffline: true, providers: { themes } })
    expect(existsSync(resolve(dir, "package.json")));
  })

  it("clone from unjs/templates registry with error", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/registry");
    await downloadTemplate('themes:test', { dir: destinationDirectory, preferOffline: true, providers: { themes } }).catch((error) => {
      expect(error.message).toContain("Failed to download template from themes")
    })
  })

  it("do not clone to existing dir", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/existing");
    await mkdir(destinationDirectory).catch(() => {});
    await writeFile(resolve(destinationDirectory, "test.txt"), "test");
    await expect(downloadTemplate("gh:unjs/template", { dir: destinationDirectory })).rejects.toThrow("already exists");
  });
});
