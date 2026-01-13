import { describe, expect, it, vi } from "vitest";

type MockResponse = {
  status: number;
  headers: Headers;
};

vi.mock("../src/_utils", async () => {
  const actual = await vi.importActual<any>("../src/_utils");

  const sendFetch = vi.fn(async (url: string): Promise<MockResponse> => {
    // --- Probe responses (GitLab archive endpoint) ---

    // Case 1: subgroup repo (3 segments) should be treated as repo, not subdir
    if (
      url ===
      "https://gitlab.com/organization/application/some-application/-/archive/main/some-application-main.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }

    // The legacy (incorrect) split candidate should fail
    if (
      url ===
      "https://gitlab.com/organization/application/-/archive/main/application-main.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }

    // Case 2: regular repo with subpath should be treated as repo + subdir
    if (
      url ===
      "https://gitlab.com/unjs/template/-/archive/dev/template-dev.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }
    if (
      url ===
      "https://gitlab.com/unjs/template/test/-/archive/dev/test-dev.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }

    // Case 3: defaults to main when no #ref
    if (
      url ===
      "https://gitlab.com/unjs/template/-/archive/main/template-main.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }

    // Case 4: empty # should also default to main
    if (
      url ===
      "https://gitlab.com/unjs/template/-/archive/main/template-main.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }

    // Case 5: deep subgroup (many segments) should be treated as repo
    if (
      url ===
      "https://gitlab.com/org/a/b/c/repo/-/archive/v1.2.3/repo-v1.2.3.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }
    // Make sure shorter candidates fail so we pick the longest repo.
    if (
      url === "https://gitlab.com/org/a/b/c/-/archive/v1.2.3/c-v1.2.3.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }

    // Case 6: subdir with multiple segments
    if (
      url ===
      "https://gitlab.com/unjs/template/-/archive/feature/awesome/template-feature/awesome.tar.gz"
    ) {
      return { status: 200, headers: new Headers() };
    }
    // Longest candidate (treating foo/bar as part of repo) must fail to force subdir behavior
    if (
      url ===
      "https://gitlab.com/unjs/template/foo/bar/-/archive/feature/awesome/bar-feature/awesome.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }

    // Case 7: private repo returns 401/403 but should still count as "exists"
    if (
      url ===
      "https://gitlab.com/private/org/repo/-/archive/main/repo-main.tar.gz"
    ) {
      return { status: 401, headers: new Headers() };
    }

    // Case 8: if everything probes as 404, we fall back to assuming full path is repo
    if (
      url ===
      "https://gitlab.com/unknown/group/repo/-/archive/main/repo-main.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }
    if (
      url ===
      "https://gitlab.com/unknown/group/-/archive/main/group-main.tar.gz"
    ) {
      return { status: 404, headers: new Headers() };
    }

    return { status: 404, headers: new Headers() };
  });

  return { ...actual, sendFetch };
});

describe("gitlab provider (subgroups + subpath)", () => {
  it("supports GitLab subgroups by probing archive URL", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab(
      "organization/application/some-application#main",
      {
        auth: "token",
      },
    );
    expect(info).toMatchObject({
      name: "organization-application-some-application",
      version: "main",
      subdir: "/",
      url: "https://gitlab.com/organization/application/some-application/-/tree/main/",
      tar: "https://gitlab.com/organization/application/some-application/-/archive/main/some-application-main.tar.gz",
    });
  });

  it("keeps supporting subpath by finding the shorter repo candidate", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("unjs/template/test#dev", { auth: "token" });
    expect(info).toMatchObject({
      name: "unjs-template",
      version: "dev",
      subdir: "/test",
      url: "https://gitlab.com/unjs/template/-/tree/dev/test",
      tar: "https://gitlab.com/unjs/template/-/archive/dev/template-dev.tar.gz",
    });
  });

  it("defaults to main when no #ref is provided", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("unjs/template", { auth: "token" });
    expect(info).toMatchObject({
      name: "unjs-template",
      version: "main",
      subdir: "/",
      url: "https://gitlab.com/unjs/template/-/tree/main/",
      tar: "https://gitlab.com/unjs/template/-/archive/main/template-main.tar.gz",
    });
  });

  it("treats empty # as main", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("unjs/template#", { auth: "token" });
    expect(info).toMatchObject({
      version: "main",
      tar: "https://gitlab.com/unjs/template/-/archive/main/template-main.tar.gz",
    });
  });

  it("supports deep subgroups with explicit ref", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("org/a/b/c/repo#v1.2.3", { auth: "token" });
    expect(info).toMatchObject({
      name: "org-a-b-c-repo",
      version: "v1.2.3",
      subdir: "/",
      url: "https://gitlab.com/org/a/b/c/repo/-/tree/v1.2.3/",
      tar: "https://gitlab.com/org/a/b/c/repo/-/archive/v1.2.3/repo-v1.2.3.tar.gz",
    });
  });

  it("supports multi-segment subdir", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("unjs/template/foo/bar#feature/awesome", {
      auth: "token",
    });
    expect(info).toMatchObject({
      name: "unjs-template",
      version: "feature/awesome",
      subdir: "/foo/bar",
      url: "https://gitlab.com/unjs/template/-/tree/feature/awesome/foo/bar",
      tar: "https://gitlab.com/unjs/template/-/archive/feature/awesome/template-feature/awesome.tar.gz",
    });
  });

  it("treats 401/403 as 'exists' while probing (private repo)", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("private/org/repo#main", { auth: "token" });
    expect(info).toMatchObject({
      name: "private-org-repo",
      version: "main",
      subdir: "/",
      tar: "https://gitlab.com/private/org/repo/-/archive/main/repo-main.tar.gz",
    });
  });

  it("falls back to treating full path as repo if probes all fail (404)", async () => {
    const { gitlab } = await import("../src/providers");
    const info = await gitlab("unknown/group/repo#main", { auth: "token" });
    expect(info).toMatchObject({
      name: "unknown-group-repo",
      version: "main",
      subdir: "/",
      url: "https://gitlab.com/unknown/group/repo/-/tree/main/",
      tar: "https://gitlab.com/unknown/group/repo/-/archive/main/repo-main.tar.gz",
    });
  });
});
