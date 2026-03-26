import { expect, it, describe } from "vitest";
import { parseGitURI } from "../src/_utils.ts";

describe("parseGitURI", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const tests = [
    { input: "org/repo", output: {} },
    { input: "org/repo#ref", output: { ref: "ref" } },
    { input: "org/repo#ref-123", output: { ref: "ref-123" } },
    { input: "org/repo#ref/ABC-123", output: { ref: "ref/ABC-123" } },
    { input: "org/repo#@org/tag@1.2.3", output: { ref: "@org/tag@1.2.3" } },
    { input: "org/repo/foo/bar", output: { subdir: "/foo/bar" } },
    // hyphens in owner, repo, and ref (regression for escaped hyphen in character class)
    { input: "my-org/my-repo", output: { repo: "my-org/my-repo" } },
    {
      input: "my-org/my-repo#fix/MY-123",
      output: { repo: "my-org/my-repo", ref: "fix/MY-123" },
    },
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

describe("parseGitURI with :: subdir delimiter", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const tests = [
    // :: delimiter separates repo from subdir
    {
      input: "org/repo::src/template",
      output: { repo: "org/repo", subdir: "/src/template" },
    },
    // :: with ref
    {
      input: "org/repo::src/template#v1.0",
      output: { repo: "org/repo", subdir: "/src/template", ref: "v1.0" },
    },
    // :: with subgroups (all path segments before :: become repo)
    {
      input: "group/subgroup/project::src/template",
      output: { repo: "group/subgroup/project", subdir: "/src/template" },
    },
    {
      input: "group/subgroup/project::src/template#develop",
      output: {
        repo: "group/subgroup/project",
        subdir: "/src/template",
        ref: "develop",
      },
    },
    // :: with no subdir (just delimiter, empty)
    {
      input: "group/subgroup/project::",
      output: { repo: "group/subgroup/project", subdir: "/" },
    },
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

describe("parseGitURI with expandRepo", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const opts = { expandRepo: true };
  const tests = [
    // Basic 2-segment repo stays the same
    { input: "org/repo", output: {} },
    { input: "org/repo#ref", output: { ref: "ref" } },
    // Subgroup paths are merged into repo
    {
      input: "group/subgroup/project",
      output: { repo: "group/subgroup/project", subdir: "/" },
    },
    {
      input: "group/subgroup/project#v1.0",
      output: { repo: "group/subgroup/project", ref: "v1.0" },
    },
    // Deeply nested subgroups
    {
      input: "group/sub1/sub2/project",
      output: { repo: "group/sub1/sub2/project", subdir: "/" },
    },
    {
      input: "group/sub1/sub2/project#develop",
      output: { repo: "group/sub1/sub2/project", ref: "develop" },
    },
    // expandRepo + :: delimiter: :: takes priority for subdir
    {
      input: "group/subgroup/project::src/template#v1.0",
      output: {
        repo: "group/subgroup/project",
        subdir: "/src/template",
        ref: "v1.0",
      },
    },
  ];

  for (const test of tests) {
    it(test.input, () => {
      expect(parseGitURI(test.input, opts)).toMatchObject({
        ...defaults,
        ...test.output,
      });
    });
  }
});
