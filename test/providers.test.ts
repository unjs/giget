import { github, gitlab, bitbucket, sourcehut } from "../src/providers";
import { describe, expect, it, vi, beforeEach } from "vitest";

describe("providers", () => {
  describe("http", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      vi.resetModules();
    });

    it("when fetch fail, throw Error", async () => {
      const consoleSpy = vi.spyOn(console, "debug");
      const { http } = await import("../src/providers");

      await http("file://example.com", {});

      expect(consoleSpy).toHaveBeenCalledOnce();
    });

    it("http input endWith json and undefined tar, throw Error", async () => {
      vi.doMock("../src/_utils", () => {
        return {
          sendFetch: vi.fn().mockResolvedValueOnce({
            json: vi.fn().mockResolvedValueOnce({}),
          }),
        };
      });

      const { http } = await import("../src/providers");
      expect(http("test.json", {})).rejects.toThrow(
        "Invalid template info from test.json. name or tar fields are missing!",
      );
    });

    it("when content-type is application/json, return expected _httpJSON resolved value", async () => {
      vi.doMock("../src/_utils", () => {
        return {
          sendFetch: vi
            .fn()
            .mockResolvedValue({
              headers: {
                get: vi.fn().mockReturnValue("application/json"),
              },
            })
            .mockResolvedValue({
              json: vi.fn().mockResolvedValue({
                name: "test",
                tar: "test.tar",
              }),
            }),
        };
      });
      const { http } = await import("../src/providers");

      const actual = await http("test.json", {});

      expect(actual?.name).toBe("test");
      expect(actual?.tar).toBe("test.tar");
    });

    it("when content-type is not application/json, return expected value", async () => {
      vi.doMock("../src/_utils", () => {
        return {
          sendFetch: vi.fn().mockResolvedValue({
            headers: {
              get: vi
                .fn()
                .mockReturnValue("application/octet-stream")
                .mockReturnValue("filename=test.tar"),
            },
          }),
        };
      });
      const { http } = await import("../src/providers");

      const actual = await http("http://example.com", { auth: "token" });

      expect(actual?.name).toBe("test-http://e");
      expect(actual?.version).toBe("");
      expect(actual?.subdir).toBe("");
      expect(actual?.tar).toBe("http://example.com/");
      expect(actual?.defaultDir).toBe("test");
      expect(actual?.headers?.Authorization).toBe("Bearer token");
    });
  });

  describe("github", () => {
    it("github returns expected value", () => {
      const input = "unjs/giget#main";
      const expected = {
        name: "unjs-giget",
        tar: "https://api.github.com/repos/unjs/giget/tarball/main",
        version: "main",
        subdir: "/",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: undefined,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        url: "https://github.com/unjs/giget/tree/main/",
      };

      const actual = github(input, {});

      expect(actual).toEqual(expected);
    });
  });

  describe("gitlab", () => {
    it("gitlab returns expected value", () => {
      const input = "unjs/giget#main";
      const expected = {
        name: "unjs-giget",
        tar: "https://gitlab.com/unjs/giget/-/archive/main.tar.gz",
        version: "main",
        subdir: "/",
        headers: {
          authorization: undefined,
          "sec-fetch-mode": "same-origin",
        },
        url: "https://gitlab.com/unjs/giget/tree/main/",
      };

      const actual = gitlab(input, {});

      expect(actual).toEqual(expected);
    });
  });

  describe("bitbucket", () => {
    it("bitbucket returns expected value", () => {
      const input = "unjs/giget#main";
      const expected = {
        name: "unjs-giget",
        tar: "https://bitbucket.org/unjs/giget/get/main.tar.gz",
        version: "main",
        subdir: "/",
        headers: {
          authorization: undefined,
        },
        url: "https://bitbucket.com/unjs/giget/src/main/",
      };

      const actual = bitbucket(input, {});

      expect(actual).toEqual(expected);
    });
  });

  describe("sourcehut", () => {
    it("sourcehut returns expected value", () => {
      const input = "unjs/giget#main";
      const expected = {
        name: "unjs-giget",
        tar: "https://git.sr.ht/~unjs/giget/archive/main.tar.gz",
        version: "main",
        subdir: "/",
        headers: {
          authorization: undefined,
        },
        url: "https://git.sr.ht/~unjs/giget/tree/main/item/",
      };

      const actual = sourcehut(input, {});

      expect(actual).toEqual(expected);
    });
  });
});
