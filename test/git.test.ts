import { expect, it, describe } from "vitest";
import { parseGitCloneURI } from "../src/git.ts";

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
    { input: "bitbucket:org/repo", uri: "git@bitbucket.org:org/repo" },
    { input: "bitbucket:org/repo/sub/dir", uri: "git@bitbucket.org:org/repo", subdir: "sub/dir" },
    { input: "sourcehut:org/repo", uri: "git@git.sr.ht:org/repo" },
    { input: "sourcehut:org/repo/sub/dir", uri: "git@git.sr.ht:org/repo", subdir: "sub/dir" },

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
