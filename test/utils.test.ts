import { expect, it, test, describe, beforeEach } from "vitest";
import { parseGitCloneURI, parseGitURI } from "../src/_utils";

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
    {
      input: "git@github.com:unjs/template.git",
      output: {
        uri: "git@github.com:unjs/template.git",
        name: "github.com-unjs-template",
      },
    },
    // .git does not matter in git URL, but remove it from name
    {
      input: "github.com:unjs/template",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
      },
    },
    // Provide git@ user if not provided
    {
      input: "github.com:unjs/template",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
      },
    },
    // Add github.com as host
    {
      input: "github:unjs/template",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
      },
    },
    {
      input: "gh:unjs/template",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
      },
    },
    {
      input: "unjs/template",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
      },
    },
    // Add gitlab.com as host
    {
      input: "gitlab:unjs/template",
      output: {
        uri: "git@gitlab.com:unjs/template",
        name: "gitlab.com-unjs-template",
      },
    },
    // Add version ref if provided
    {
      input: "unjs/template#abcd1234",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
        version: "abcd1234",
      },
    },
    // Add subdir if provided
    {
      input: "unjs/template#abcd1234:/my/subdir",
      output: {
        uri: "git@github.com:unjs/template",
        name: "github.com-unjs-template",
        version: "abcd1234",
        subdir: "/my/subdir",
      },
    },
  ];

  for (const { input, output } of tests) {
    it(input, () => {
      expect(parseGitCloneURI(input)).toEqual(output);
    });
  }

  describe("GIGET_GIT_*", () => {
    beforeEach(() => {
      delete process.env.GIGET_GIT_USERNAME;
      delete process.env.GIGET_GIT_PASSWORD;
      delete process.env.GIGET_GIT_HOST;
    });

    test("Use GIGET_GIT_USERNAME instead of git if provided", async () => {
      process.env.GIGET_GIT_USERNAME = "custom-git-user";

      const input = "github.com:unjs/template";
      const output = "custom-git-user@github.com:unjs/template";

      expect(parseGitCloneURI(input)).toEqual({
        uri: output,
        name: "github.com-unjs-template",
      });
    });

    test("Use GIGET_GIT_PASSWORD if provided", async () => {
      process.env.GIGET_GIT_USERNAME = "custom-git-user";
      process.env.GIGET_GIT_PASSWORD = "custom-git-password";

      const input = "github.com:unjs/template";
      const output =
        "custom-git-user:custom-git-password@github.com:unjs/template";

      expect(parseGitCloneURI(input)).toEqual({
        uri: output,
        name: "github.com-unjs-template",
      });
    });

    test("Use GIGET_GIT_HOST instead of github.com if host is not provided", async () => {
      process.env.GIGET_GIT_HOST = "git.mycompany.com";

      const input = "unjs/template";
      const output = "git@git.mycompany.com:unjs/template";

      expect(parseGitCloneURI(input)).toEqual({
        uri: output,
        name: "git.mycompany.com-unjs-template",
      });
    });
  });

  describe("local git path", () => {
    test("relative path", async () => {
      const input = "./local/repo";

      expect(parseGitCloneURI(input, { cwd: "/cwd" })).toEqual({
        uri: "/cwd/local/repo",
        name: "cwd-local-repo",
      });
    });

    test("absolute path", async () => {
      const input = "/absolute/local/repo";

      expect(parseGitCloneURI(input, { cwd: "/cwd" })).toEqual({
        uri: "/absolute/local/repo",
        name: "absolute-local-repo",
      });
    });

    test("should still support version and hash", async () => {
      const input = "/absolute/local/repo#abcd1234:/my/subdir";

      expect(parseGitCloneURI(input, { cwd: "/cwd" })).toEqual({
        uri: "/absolute/local/repo",
        name: "absolute-local-repo",
        version: "abcd1234",
        subdir: "/my/subdir",
      });
    });
  });

  describe("https git url", () => {
    test("allow using https git URL if provided", () => {
      expect(parseGitCloneURI("https://github.com/unjs/template.git")).toEqual({
        uri: "https://github.com/unjs/template.git",
        name: "github.com-unjs-template",
      });
    });

    test("add version if provided", () => {
      expect(
        parseGitCloneURI("https://github.com/unjs/template.git#abcd1234"),
      ).toEqual({
        uri: "https://github.com/unjs/template.git",
        name: "github.com-unjs-template",
        version: "abcd1234",
      });
    });

    test("add path if provided", () => {
      expect(
        parseGitCloneURI("https://github.com/unjs/template.git#:/my/subdir"),
      ).toEqual({
        uri: "https://github.com/unjs/template.git",
        name: "github.com-unjs-template",
        subdir: "/my/subdir",
      });
    });

    test("add version and path if provided", () => {
      expect(
        parseGitCloneURI(
          "https://github.com/unjs/template.git#abcd1234:/my/subdir",
        ),
      ).toEqual({
        uri: "https://github.com/unjs/template.git",
        name: "github.com-unjs-template",
        version: "abcd1234",
        subdir: "/my/subdir",
      });
    });
  });
});
