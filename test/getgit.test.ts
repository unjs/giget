import { existsSync, globSync } from "node:fs";
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

  it("clone unjs/template using custom provider that returns stream", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned-custom");
    const { dir } = await downloadTemplate("custom:unjs/template", {
      dir: destinationDirectory,
      preferOffline: true,
      providers: {
        custom: async (input) => {
          return {
            name: input.replaceAll("/", "-"),
            tar: async () => {
              const response = await fetch(
                `https://api.github.com/repos/${input}/tarball`,
              );
              return response.body!;
            },
          };
        },
      },
    });
    expect(await existsSync(resolve(dir, "package.json")));
  });

  it("clone unjs/template using git provider", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned-with-git");
    const { dir } = await downloadTemplate("git:unjs/template", {
      dir: destinationDirectory,
      preferOffline: true,
    });
    expect(existsSync(resolve(dir, "package.json"))).toBe(true);
    expect(existsSync(resolve(dir, ".git"))).toBe(false);
  });

  it("clone unjs/template#e24616c using git provider (specific commit)", async () => {
    const destinationDirectory = resolve(
      __dirname,
      ".tmp/cloned-with-git-e24616c",
    );
    const { dir } = await downloadTemplate("git:unjs/template#e24616c", {
      dir: destinationDirectory,
      preferOffline: true,
    });

    expect(globSync("**/*", { cwd: dir }).sort()).toMatchSnapshot();
  });

  it("clone nuxt/starter#v3 using git provider (specific branch)", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/nuxt-starter-v3");
    const { dir } = await downloadTemplate("git:nuxt/starter#v3", {
      dir: destinationDirectory,
      preferOffline: true,
    });

    expect(existsSync(resolve(dir, "nuxt.config.ts"))).toBe(true);
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
