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
    { input: 'git@github.com:unjs/template.git', output: 'git@github.com:unjs/template.git' },
    // .git does not matter in git URL, but remove it from name
    { input: 'github.com:unjs/template', output: 'git@github.com:unjs/template' },
    // Provide git@ user if not provided
    { input: 'github.com:unjs/template', output: 'git@github.com:unjs/template' },
    // Add github.com as host
    { input: 'github:unjs/template', output: 'git@github.com:unjs/template' },
    { input: 'gh:unjs/template', output: 'git@github.com:unjs/template' },
    { input: 'unjs/template', output: 'git@github.com:unjs/template' },
    // Add gitlab.com as host
    { input: 'gitlab:unjs/template', output: 'git@gitlab.com:unjs/template' },
    // Add version ref if provided
    { input: 'unjs/template#abcd1234', output: 'git@github.com:unjs/template', version: 'abcd1234' },
  ]

  for (const { input, output, version } of tests) {
    it(input, () => {
      expect(parseGitCloneURI(input)).toEqual({
        uri: output,
        version,
      })
    })
  }

  describe('GIGET_GIT_*', () => {
    beforeEach(() => {
      delete process.env.GIGET_GIT_USERNAME
      delete process.env.GIGET_GIT_PASSWORD
      delete process.env.GIGET_GIT_HOST
    })

    test('Use GIGET_GIT_USERNAME instead of git if provided', async () => {
      process.env.GIGET_GIT_USERNAME = 'custom-git-user'

      const input = 'github.com:unjs/template'
      const output = 'custom-git-user@github.com:unjs/template'

      expect(parseGitCloneURI(input)).toEqual({ uri: output })
    })

    test('Use GIGET_GIT_PASSWORD if provided', async () => {
      process.env.GIGET_GIT_USERNAME = 'custom-git-user'
      process.env.GIGET_GIT_PASSWORD = 'custom-git-password'

      const input = 'github.com:unjs/template'
      const output = 'custom-git-user:custom-git-password@github.com:unjs/template'

      expect(parseGitCloneURI(input)).toEqual({ uri: output })
    })

    test('Use GIGET_GIT_HOST instead of github.com if host is not provided', async () => {
      process.env.GIGET_GIT_HOST = 'git.mycompany.com'

      const input = 'unjs/template'
      const output = 'git@git.mycompany.com:unjs/template'

      expect(parseGitCloneURI(input)).toEqual({ uri: output })
    })
  })
})
