import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { expect, it, describe, beforeAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate } from "../src";
import { createGitProvider } from "../src/providers";

// Disable cache by PREFER_OFFLINE=false vitest
const preferOffline = process.env.PREFER_OFFLINE !== "false";

// Use a larger timeout for tests that perform slow git clone that needs to
// clone the entire git history.
const GIT_SLOW_TEST_TIMEOUT = 10_000;

describe("downloadTemplate", () => {
  beforeAll(async () => {
    await rm(resolve(__dirname, ".tmp"), { recursive: true, force: true });
    process.env.GIGET_GIT_ALLOW_LOCAL = "true";
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

  describe("git provider", () => {
    // Currently we only tests git over HTTPS instead of the regular git over
    // SSH protocol, because we would have to add SSHin Github Actions.

    it("clone unjs/template using git provider", async () => {
      const destinationDirectory = resolve(__dirname, ".tmp/cloned-with-git");
      const { dir } = await downloadTemplate(
        "git:https://github.com/unjs/template.git",
        {
          dir: destinationDirectory,
          preferOffline,
        },
      );
      expect(existsSync(resolve(dir, "package.json"))).toBe(true);
      expect(existsSync(resolve(dir, ".git"))).toBe(false);
    });

    it(
      "clone unjs/template#e24616c using git provider (specific commit)",
      { timeout: GIT_SLOW_TEST_TIMEOUT },
      async () => {
        const destinationDirectory = resolve(
          __dirname,
          ".tmp/cloned-with-git-e24616c",
        );
        const { dir } = await downloadTemplate(
          "git:https://github.com/unjs/template#e24616c",
          {
            dir: destinationDirectory,
            preferOffline,
          },
        );

        // The initial version of unjs/template still has .eslintrc
        expect(existsSync(resolve(dir, ".eslintrc"))).toBe(true);
      },
    );

    it(
      "clone nuxt/starter#v3 using git provider (specific branch)",
      { timeout: GIT_SLOW_TEST_TIMEOUT },
      async () => {
        const destinationDirectory = resolve(__dirname, ".tmp/nuxt-starter-v3");
        const { dir } = await downloadTemplate(
          "git:https://github.com/nuxt/starter#v3",
          {
            dir: destinationDirectory,
            preferOffline,
          },
        );

        expect(existsSync(resolve(dir, "nuxt.config.ts"))).toBe(true);
      },
    );

    it(
      "clone nuxt/starter#v3:public subdir (specific subdir)",
      { timeout: GIT_SLOW_TEST_TIMEOUT },
      async () => {
        const destinationDirectory = resolve(
          __dirname,
          ".tmp/nuxt3-starter-v3-public",
        );
        const { dir } = await downloadTemplate(
          "git:https://github.com/nuxt/starter#v3:public",
          {
            dir: destinationDirectory,
            preferOffline,
          },
        );
        expect(existsSync(resolve(dir, "favicon.ico"))).toBe(true);
      },
    );

    it("clone unjs/template#:src (default branch, specific subdir)", async () => {
      const destinationDirectory = resolve(__dirname, ".tmp/unjs-template-src");
      const { dir } = await downloadTemplate(
        "git:https://github.com/unjs/template#:src",
        {
          dir: destinationDirectory,
          preferOffline,
        },
      );
      expect(existsSync(resolve(dir, "index.ts"))).toBe(true);
    });

    describe("local git repo", () => {
      it("clone from local repository", async () => {
        const destinationDirectory = resolve(__dirname, ".tmp/giget");
        const { dir } = await downloadTemplate("git:.", {
          dir: destinationDirectory,
          preferOffline,
        });
        expect(existsSync(resolve(dir, "src/giget.ts"))).toBe(true);
      });

      it("clone from local repository (with version and subdir)", async () => {
        const destinationDirectory = resolve(
          __dirname,
          ".tmp/giget-version-subdir",
        );
        const { dir } = await downloadTemplate("git:.#9d04ea77:src", {
          dir: destinationDirectory,
          preferOffline,
        });
        expect(existsSync(resolve(dir, "giget.ts"))).toBe(true);
      });

      it("show error when cloning from local repository but GIGET_GIT_ALLOW_LOCAL is not true", async () => {
        delete process.env.GIGET_GIT_ALLOW_LOCAL;

        const destinationDirectory = resolve(
          __dirname,
          ".tmp/giget-local-disabled",
        );
        await expect(
          downloadTemplate("git:.", {
            dir: destinationDirectory,
            preferOffline,
          }),
        ).rejects.toThrow("Cloning from local path is not allowed");
      });
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
      ).rejects.toThrow(
        "gut is required to download git repositories. Make sure gut is installed and available in your PATH.",
      );
    });
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
    ).rejects.toThrow(
      "Failed to clone git repository from git@github.com:unjs/templete. Make sure the repository exists and the provided version is correct.",
    );
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
