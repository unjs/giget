import { existsSync } from "node:fs";
import { rm, mkdir, writeFile, rmdir } from "node:fs/promises";
import { expect, it, describe, beforeAll, afterAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate, copyTemplate } from "../src";

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
});

describe("copyTemplate (file protocol)", () => {
  const tmpDir = resolve(__dirname, ".tmp/copied");
  const srcDir = resolve(__dirname, "fixtures/my-template");

  beforeAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    await mkdir(srcDir, { recursive: true });
    await writeFile(resolve(srcDir, "foo.txt"), "bar");
  });
  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true });
    await rmdir(srcDir, { recursive: true });
  });

  it("copy a local directory", async () => {
    const destDir = resolve(tmpDir, "copied");
    const { dir } = await copyTemplate(`file:${srcDir}`, { dir: destDir });
    expect(existsSync(resolve(dir, "foo.txt"))).toBe(true);
  });

  it("do not clone to exisiting dir", async () => {
    const destDir = resolve(tmpDir, "existing");
    await mkdir(destDir, { recursive: true });
    await writeFile(resolve(destDir, "test.txt"), "test");
    await expect(
      copyTemplate(`file:${srcDir}`, { dir: destDir }),
    ).rejects.toThrow("already exists");
  });
});
