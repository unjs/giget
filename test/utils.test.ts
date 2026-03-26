import { expect, it, describe } from "vitest";
import { parseGitURI } from "../src/_utils.ts";
import { parseGitCloneURI } from "../src/git.ts";

describe("parseGitURI", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const tests = [
    { input: "org/repo", output: {} },
    { input: "org/repo#ref", output: { ref: "ref" } },
    { input: "org/repo#ref-123", output: { ref: "ref-123" } },
    { input: "org/repo#ref/ABC-123", output: { ref: "ref/ABC-123" } },
    { input: "org/repo#@org/tag@1.2.3", output: { ref: "@org/tag@1.2.3" } },
    { input: "org/repo/foo/bar", output: { subdir: "/foo/bar" } },
  ];

  for (const test of tests) {
    it(test.input, () => {
      expect(parseGitURI(test.input)).toMatchObject({
        ...defaults,
        ...test.output,
      });
    });
  }
});

describe("parseGitCloneURI", () => {
  const tests = [
    // SSH shorthand
    { input: "gh:org/repo", uri: "git@github.com:org/repo", name: "github.com-org-repo" },
    { input: "gh:org/repo#v1.0", uri: "git@github.com:org/repo", version: "v1.0" },
    {
      input: "gh:org/repo#v1.0:sub/dir",
      uri: "git@github.com:org/repo",
      version: "v1.0",
      subdir: "sub/dir",
    },
    { input: "gh:org/repo/sub/dir", uri: "git@github.com:org/repo", subdir: "sub/dir" },
    {
      input: "gh:org/repo/sub/dir#v1.0",
      uri: "git@github.com:org/repo",
      version: "v1.0",
      subdir: "sub/dir",
    },
    { input: "github:org/repo/sub/dir", uri: "git@github.com:org/repo", subdir: "sub/dir" },
    { input: "gitlab:org/repo/sub/dir", uri: "git@gitlab.com:org/repo", subdir: "sub/dir" },

    // Bare org/repo (defaults to github.com)
    { input: "org/repo", uri: "git@github.com:org/repo" },
    { input: "org/repo/sub/dir", uri: "git@github.com:org/repo", subdir: "sub/dir" },

    // HTTP(S)
    { input: "https://github.com/org/repo", uri: "https://github.com/org/repo" },
    {
      input: "https://github.com/org/repo/sub/dir",
      uri: "https://github.com/org/repo",
      subdir: "sub/dir",
    },
    {
      input: "https://github.com/org/repo.git/sub/dir",
      uri: "https://github.com/org/repo",
      subdir: "sub/dir",
    },

    // Hash subdir takes priority over path subdir
    {
      input: "gh:org/repo/path-sub#v1.0:hash-sub",
      uri: "git@github.com:org/repo",
      version: "v1.0",
      subdir: "hash-sub",
    },

    // Local paths
    { input: "./local/path", opts: { cwd: "/home/user" }, uri: "/home/user/local/path" },
    { input: "/absolute/path", uri: "/absolute/path" },
  ];

  for (const test of tests) {
    it(test.input, () => {
      const result = parseGitCloneURI(test.input, test.opts);
      expect(result.uri).toBe(test.uri);
      if (test.name) {
        expect(result.name).toBe(test.name);
      }
      if (test.version) {
        expect(result.version).toBe(test.version);
      } else {
        expect(result.version).toBeUndefined();
      }
      if (test.subdir) {
        expect(result.subdir).toBe(test.subdir);
      } else {
        expect(result.subdir).toBeUndefined();
      }
    });
  }
});
