import { basename } from "pathe";
import type { TemplateInfo, TemplateProvider } from "./types";
import { debug, parseGitCloneURI, parseGitURI, sendFetch } from "./_utils";
import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { create } from "tar";
import { execFile, type ExecFileException } from "node:child_process";

type TemplateProviderFactory<Opts> = (opts: Opts) => TemplateProvider;

export const http: TemplateProvider = async (input, options) => {
  if (input.endsWith(".json")) {
    return (await _httpJSON(input, options)) as TemplateInfo;
  }

  const url = new URL(input);
  let name: string = basename(url.pathname);

  try {
    const head = await sendFetch(url.href, {
      method: "HEAD",
      validateStatus: true,
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      },
    });
    const _contentType = head.headers.get("content-type") || "";
    if (_contentType.includes("application/json")) {
      return (await _httpJSON(input, options)) as TemplateInfo;
    }
    const filename = head.headers
      .get("content-disposition")
      ?.match(/filename="?(.+)"?/)?.[1];
    if (filename) {
      name = filename.split(".")[0];
    }
  } catch (error) {
    debug(`Failed to fetch HEAD for ${url.href}:`, error);
  }

  return {
    name: `${name}-${url.href.slice(0, 8)}`,
    version: "",
    subdir: "",
    tar: url.href,
    defaultDir: name,
    headers: {
      Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  };
};

const _httpJSON: TemplateProvider = async (input, options) => {
  const result = await sendFetch(input, {
    validateStatus: true,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  });
  const info = (await result.json()) as TemplateInfo;
  if (!info.tar || !info.name) {
    throw new Error(
      `Invalid template info from ${input}. name or tar fields are missing!`,
    );
  }
  return info;
};

export const github: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);

  // https://docs.github.com/en/rest/repos/contents#download-a-repository-archive-tar
  // TODO: Verify solution for github enterprise
  const githubAPIURL = process.env.GIGET_GITHUB_URL || "https://api.github.com";

  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    url: `${githubAPIURL.replace("api.github.com", "github.com")}/${
      parsed.repo
    }/tree/${parsed.ref}${parsed.subdir}`,
    tar: `${githubAPIURL}/repos/${parsed.repo}/tarball/${parsed.ref}`,
  };
};

export const gitlab: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  const gitlab = process.env.GIGET_GITLAB_URL || "https://gitlab.com";
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      // https://gitlab.com/gitlab-org/gitlab/-/commit/50c11f278d18fe1f3fb12eb595067216bb58ade2
      "sec-fetch-mode": "same-origin",
    },
    url: `${gitlab}/${parsed.repo}/tree/${parsed.ref}${parsed.subdir}`,
    tar: `${gitlab}/${parsed.repo}/-/archive/${parsed.ref}.tar.gz`,
  };
};

export const bitbucket: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
    url: `https://bitbucket.com/${parsed.repo}/src/${parsed.ref}${parsed.subdir}`,
    tar: `https://bitbucket.org/${parsed.repo}/get/${parsed.ref}.tar.gz`,
  };
};

export const sourcehut: TemplateProvider = (input, options) => {
  const parsed = parseGitURI(input);
  return {
    name: parsed.repo.replace("/", "-"),
    version: parsed.ref,
    subdir: parsed.subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
    url: `https://git.sr.ht/~${parsed.repo}/tree/${parsed.ref}/item${parsed.subdir}`,
    tar: `https://git.sr.ht/~${parsed.repo}/archive/${parsed.ref}.tar.gz`,
  };
};

export const createGitProvider: TemplateProviderFactory<{ gitCmd?: string }> = (
  opts,
) => {
  const gitCmd = opts.gitCmd ?? "git";

  return (input) => {
    const { uri: gitUri, name, version, subdir } = parseGitCloneURI(input);

    if (gitUri.startsWith('/') && process.env.GIGET_GIT_ALLOW_LOCAL !== 'true') {
      throw new Error('Cloning from local path is not allowed');
    }

    return {
      name,
      version,
      subdir,
      tar: async () => {
        // Make temp working directory
        const tempDir = await mkdtemp(join(tmpdir(), "giget-"));

        const $git = async (args: string[], opts: { cwd?: string } = {}) => {
          return new Promise<{ stdout: string; stderr: string }>(
            (resolve, reject) => {
              execFile(
                gitCmd,
                args,
                { cwd: opts.cwd },
                (error, stdout, stderr) => {
                  if (error) {
                    return reject(error);
                  }

                  resolve({ stdout, stderr });
                },
              );
            },
          );
        };

        try {
          // If we do not have version, we can speed up via --depth=1.
          // Otherwise, we need to clone the entire history, then check out the ref.
          if (version) {
            // Use git ls-remote to check if the specified version is a branch:
            //
            //   git ls-remote git@github.com/nuxt/starter foo => empty string
            //
            // This is just an optimization so we can use --branch when cloning.
            // so we err on the side of caution if the command fails.
            const isBranch = await (async () => {
              try {
                const { stdout: output } = await $git([
                  "ls-remote",
                  gitUri,
                  version,
                ]);
                return Boolean(output);
              } catch {
                return false;
              }
            })();

            if (isBranch) {
              await $git([
                "clone",
                gitUri,
                tempDir,
                "--branch",
                version,
                "--single-branch",
              ]);
            } else {
              await $git(["clone", gitUri, tempDir]);
              await $git(["checkout", version], { cwd: tempDir });
            }
          } else {
            await $git(["clone", gitUri, tempDir, "--depth=1"]);
          }
        } catch (error) {
          // ENOENT is either command does not exist or cwd not available.
          // But we are working with temporary directory here, so ENOENT will
          // be definitely command does not exist.
          if ((error as ExecFileException).code === "ENOENT") {
            throw new Error(
              `${gitCmd} is required to download git repositories. Make sure ${gitCmd} is installed and available in your PATH.`,
            );
          }

          throw new Error(
            `Failed to clone git repository from ${gitUri}${version ? `(ref: ${version})` : ""}. Make sure the repository exists and the provided version is correct.`,
          );
        }

        // Create tar
        return create(
          {
            cwd: tempDir,
            filter: (path) => {
              // Example paths:
              // .
              // ./README.md
              // ./.src
              // ./src/index.ts
              return !path.startsWith("./.git");
            },
          },
          ["."],
        );
      },
    };
  };
};

export const git: TemplateProvider = createGitProvider({});

export const providers: Record<string, TemplateProvider> = {
  http,
  https: http,
  git,
  github,
  gh: github,
  gitlab,
  bitbucket,
  sourcehut,
};
