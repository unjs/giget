import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { expect, it, describe, beforeAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate } from "../src";
import { createGitProvider } from "../src/providers";

// Disable cache by PREFER_OFFLINE=false vitest
const preferOffline = process.env.PREFER_OFFLINE !== "false";

describe("downloadTemplate", () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, ".tmp"), { recursive: true, force: true });
  });

  it("clone unjs/template", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned");
    const { dir } = await downloadTemplate("gh:unjs/template", {
      dir: destinationDirectory,
      preferOffline,
    });
    expect(await existsSync(resolve(dir, "package.json")));
  });

  it("clone unjs/template using custom provider that returns stream", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/cloned-custom");
    const { dir } = await downloadTemplate("custom:unjs/template", {
      dir: destinationDirectory,
      preferOffline,
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
      preferOffline,
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
      preferOffline,
    });

    // The initial version of unjs/template still has .eslintrc
    expect(existsSync(resolve(dir, ".eslintrc"))).toBe(true);
  });

  it("clone nuxt/starter#v3 using git provider (specific branch)", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/nuxt-starter-v3");
    const { dir } = await downloadTemplate("git:nuxt/starter#v3", {
      dir: destinationDirectory,
      preferOffline,
    });

    expect(existsSync(resolve(dir, "nuxt.config.ts"))).toBe(true);
  });

  it("clone nuxt/starter#v3:public subdir (specific subdir)", async () => {
    const destinationDirectory = resolve(
      __dirname,
      ".tmp/nuxt3-starter-v3-public",
    );
    const { dir } = await downloadTemplate("git:nuxt/starter#v3:public", {
      dir: destinationDirectory,
      preferOffline,
    });
    expect(existsSync(resolve(dir, "favicon.ico"))).toBe(true);
  });

  it("clone unjs/template#:src (default branch, specific subdir)", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/unjs-template-src");
    const { dir } = await downloadTemplate("git:unjs/template#:src", {
      dir: destinationDirectory,
      preferOffline,
    });
    expect(existsSync(resolve(dir, "index.ts"))).toBe(true);
  });

  it("show error when the git command is not available", async () => {
    const destinationDirectory = resolve(
      __dirname,
      ".tmp/error-invalid-git-repo",
    );

    await expect(
      downloadTemplate("gut:unjs/template", {
        dir: destinationDirectory,
        preferOffline,
        providers: {
          gut: createGitProvider({ gitCmd: "gut" }),
        },
      }),
    ).rejects.toThrow("gut is required to download git repositories. Make sure gut is installed and available in your PATH.");
  });

  it("show error when the git repository is invalid", async () => {
    const destinationDirectory = resolve(
      __dirname,
      ".tmp/error-invalid-git-repo",
    );

    await expect(
      downloadTemplate("git:unjs/templete", {
        dir: destinationDirectory,
        preferOffline,
      }),
    ).rejects.toThrow("Failed to clone git repository from git@github.com:unjs/templete. Make sure the repository exists and the provided version is correct.");
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
