import { basename } from "pathe";
import type { TemplateInfo, TemplateProvider } from "./types";
import { debug, parseGitURI, sendFetch } from "./_utils";

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

export const git: TemplateProvider = (input) => {
  let _git = input.replace(/#.*$/, '')

  const host = /^(.+?:)/.exec(_git)?.at(1)
  if (host) {
    switch (host) {
      case 'github:':
      case 'gh:': {
        _git = _git.replace(host, 'github.com:')
        break
      }
      case 'gitlab:': {
        _git = _git.replace(host, 'gitlab.com:')
        break
      }
    }
  } else {
    _git = `${process.env.GIGET_GIT_HOST || 'github.com'}:${_git}`
  }

  if (!_git.includes('@')) {
    const username = process.env.GIGET_GIT_USERNAME || 'git'
    const password = process.env.GIGET_GIT_PASSWORD

    _git = `${password ? `${username}:${password}` : username}@${_git}`
  }

  const name = _git
    .replace(/^.+@/, '')
    .replace(/(\.git)?(#.*)?$/, '')
    .replaceAll(/[:/]/g, '-')

  const version = /#(.+)$/.exec(input)?.at(1)

  return {
    name,
    git: _git,
    version,
    tar: ''
  };
}

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
