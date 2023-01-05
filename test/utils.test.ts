import { expect, expectTypeOf, it, describe, vi, beforeAll } from "vitest";
import { parseGitURI, cacheDirectory, debug, currentShell } from "../src/_utils";

describe("parseGitURI", () => {
  const defaults = { repo: "org/repo", subdir: "/", ref: "main" };
  const tests = [
    { input: "org/repo", output: {} },
    { input: "org/repo#ref", output: { ref: "ref" } },
    { input: "org/repo/foo/bar", output: { subdir: "/foo/bar" } }
  ];

  for (const test of tests) {
    it(test.input, () => {
      expect(parseGitURI(test.input)).toMatchObject({ ...defaults, ...test.output });
    });
  }
});

// Cache directory
describe("cacheDirectory", () => {
  const cacheDir = cacheDirectory()

  it("returns giget within string", () => {
    expect(cacheDir).toContain("giget")
  })
})

// Debug
describe("debug", () => {
  process.env.DEBUG = "1"

  beforeAll(() => {
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  it("debug has been written", () => {
    debug()
    expect(console.debug).toHaveBeenCalled()
  })

  it("debug contains message from args", () => {
    debug("This is a debug message")
    expect(console.debug).toHaveBeenCalledWith("[giget]", "This is a debug message")
  })
})

// (experimental)
describe("(experimental)", () => {
  it("return curretShell dir", () => {
    const shell = currentShell()
    expectTypeOf(shell).toBeString()
  })
})
