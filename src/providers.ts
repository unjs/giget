import { basename } from "pathe";
import type { TemplateInfo, TemplateProvider } from "./types.ts";
import { debug, parseGitURI, sendFetch } from "./_utils.ts";
import { git } from "./git.ts";

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
    const filename = head.headers.get("content-disposition")?.match(/filename="?(.+)"?/)?.[1];
    if (filename) {
      name = filename.split(".")[0]!;
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
    throw new Error(`Invalid template info from ${input}. name or tar fields are missing!`);
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
  const parsed = parseGitURI(input, { expandRepo: true });
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

// Tangled (https://tangled.org) is an AT Protocol-based git forge. Owners are
// either domains (e.g. `alice.tangled.org`) or DIDs (e.g. `did:plc:abc123`, `did:web:example.org`).
//
// Accepted input format: `{owner}/{repo}[/{subdir}][#{ref}]`
//   - `alice.example.org/my-repo`
//   - `did:plc:abc123/my-repo#dev`
//
// Self-hosted instances are supported via the `GIGET_TANGLED_URL` env var.
export const tangled: TemplateProvider = (input, options) => {
  const tangledURL = process.env.GIGET_TANGLED_URL || "https://tangled.org";

  // DIDs (e.g. did:plc:abc123) contain colons that parseGitURI can't handle,
  // so we parse the input ourselves.
  const [pathPart = "", refPart] = input.split("#");
  const ref = refPart || "main";
  const slashIndex = pathPart.indexOf("/");
  if (slashIndex === -1) {
    throw new Error(`Invalid Tangled URI: ${input}`);
  }

  const owner = pathPart.slice(0, slashIndex);
  if (!owner.startsWith("did:") && !owner.includes(".")) {
    throw new Error(
      `Invalid Tangled owner "${owner}": must be a domain (e.g. alice.tangled.org) or a DID (e.g. did:plc:abc123, did:web:example.org)`,
    );
  }
  const rest = pathPart.slice(slashIndex + 1);
  const restParts = rest.split("/");
  const repo = restParts[0]!;
  if (!repo) {
    throw new Error(`Invalid Tangled URI: missing repository name in "${input}"`);
  }
  const subdir = restParts.length > 1 ? "/" + restParts.slice(1).join("/") : "/";

  return {
    name: `${owner}-${repo}`.replace(/[:./]/g, "-"),
    version: ref,
    subdir,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
    url: `${tangledURL}/${owner}/${repo}`,
    tar: `${tangledURL}/${owner}/${repo}/archive/${ref}`,
    stripPrefix: false,
  };
};

export const providers: Record<string, TemplateProvider> = {
  http,
  https: http,
  git,
  github,
  gh: github,
  gitlab,
  bitbucket,
  sourcehut,
  tangled,
};
