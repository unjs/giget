import { expect, it, describe } from "vitest";
import { parseGitURI, parseTarURI } from "../src/_utils";

describe("parseGitURI", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const tests = [
    { input: "org/repo", output: {} },
    { input: "org/repo#ref", output: { ref: "ref" } },
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

describe("parseTarURI", () => {
  const tests = [
    {
      input: "https://my-registry.com/storage/my-repo/v1.0.0/tar.gz#name=foo",
      output: {
        url: "https://my-registry.com/storage/my-repo/v1.0.0/tar.gz",
        name: "foo",
        version: "",
      },
    },
    {
      input: "http://my-registry.com/storage/my-repo/v2.0.0/tar.gz#foo",
      output: {
        url: "http://my-registry.com/storage/my-repo/v2.0.0/tar.gz",
        name: "foo",
        version: "",
      },
    },
    {
      input:
        "https://my-registry.com/storage/my-repo/v3.0.0/tar.gz#bar#version=3",
      output: {
        url: "https://my-registry.com/storage/my-repo/v3.0.0/tar.gz",
        name: "bar",
        version: "3",
      },
    },
    {
      input:
        "https://my-registry.com/storage/my-repo/v4.0.0/tar.gz#bar#badparam",
      output: {
        url: "https://my-registry.com/storage/my-repo/v4.0.0/tar.gz",
        name: "bar",
        version: "",
      },
    },
    {
      input:
        "https://my-registry.com/storage/my-repo/v5.0.0/tar.gz?somequery=someparam",
      output: {
        url: "https://my-registry.com/storage/my-repo/v5.0.0/tar.gz",
        name: "",
        version: "",
      },
    },
  ];

  for (const test of tests) {
    it(test.input, () => {
      expect(parseTarURI(test.input)).toMatchObject(test.output);
    });
  }

  const invalidUrl = "//no-protocol.com";
  it(invalidUrl, () => {
    expect(() => parseTarURI(invalidUrl)).toThrowError(
      `Failed to parse tar url: ${invalidUrl}`
    );
  });
});
