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

  it("clone unjs/template using git provider", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned-with-git");
    // TODO Support ref (git:git@github.com:unjs/template.git#e24616c)
    const { dir } = await downloadTemplate("git:git@github.com:unjs/template.git", {
      dir: destinationDirectory,
      preferOffline: true,
      providers: {
        git() {
          return {
            // TODO Improve parseGitURI
            name: 'unjs-template',
            git: 'git@github.com:unjs/template.git',
            // TODO What are the default for this?
            tar: '',
          }
        }
      }
    });
    expect(existsSync(resolve(dir, "package.json"))).toBe(true);
  })

  it("do not clone to exisiting dir", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/exisiting");
    await mkdir(destinationDirectory).catch(() => {});
    await writeFile(resolve(destinationDirectory, "test.txt"), "test");
    await expect(
      downloadTemplate("gh:unjs/template", { dir: destinationDirectory }),
    ).rejects.toThrow("already exists");
  });
});
