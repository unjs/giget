import { expect, it, describe, vi } from "vitest";
import { parseGitURI, currentShell, startShell } from "../src/_utils";

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

describe("currentShell", () => {
  it("returns the current shell", () => {
    process.env.SHELL = "/bin/bash";
    expect(currentShell()).toBe("/bin/bash");
    delete process.env.SHELL;
  });

  it("returns the default shell if SHELL is not set", () => {
    process.env.SHELL = "";
    expect(currentShell()).toBe("/bin/bash");
    delete process.env.SHELL;
  });
});

describe("startShell", () => {
  it("returns the current shell", async () => {
    const spawnSyncMock = await vi.hoisted(async () => {
      await import("node:child_process");
      return vi.fn();
    });
    vi.mock(import("node:child_process"), async (importOriginal) => {
      const actual = await importOriginal();
      return {
        ...actual,
        spawnSync: spawnSyncMock,
      };
    });
    process.env.SHELL = "/bin/bash";
    startShell("/tmp");
    expect(spawnSyncMock).toHaveBeenCalledWith("/bin/bash", [], {
      shell: true,
      cwd: "/tmp",
      stdio: "inherit",
    });
    delete process.env.SHELL;
  });
});
