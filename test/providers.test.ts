import { expect, it, describe } from "vitest";
import { gitlab } from "../src/providers.ts";
import type { TemplateInfo } from "../src/types.ts";

describe("gitlab provider", () => {
  const opts = { auth: "" };

  it("simple repo", () => {
    const result = gitlab("org/repo", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/org/repo/-/archive/main.tar.gz");
    expect(result.url).toBe("https://gitlab.com/org/repo/tree/main/");
    expect(result.subdir).toBe("/");
  });

  it("repo with ref", () => {
    const result = gitlab("org/repo#v1.0", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/org/repo/-/archive/v1.0.tar.gz");
    expect(result.url).toBe("https://gitlab.com/org/repo/tree/v1.0/");
  });

  it("subgroup repo", () => {
    const result = gitlab("group/subgroup/project", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/group/subgroup/project/-/archive/main.tar.gz");
    expect(result.url).toBe("https://gitlab.com/group/subgroup/project/tree/main/");
    expect(result.subdir).toBe("/");
  });

  it("deeply nested subgroup", () => {
    const result = gitlab("group/sub1/sub2/project#develop", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/group/sub1/sub2/project/-/archive/develop.tar.gz");
    expect(result.url).toBe("https://gitlab.com/group/sub1/sub2/project/tree/develop/");
  });

  it("subgroup with :: subdir", () => {
    const result = gitlab("group/subgroup/project::src/template", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/group/subgroup/project/-/archive/main.tar.gz");
    expect(result.subdir).toBe("/src/template");
    expect(result.url).toBe("https://gitlab.com/group/subgroup/project/tree/main/src/template");
  });

  it("subgroup with :: subdir and ref", () => {
    const result = gitlab("group/subgroup/project::src/template#v2.0", opts) as TemplateInfo;
    expect(result.tar).toBe("https://gitlab.com/group/subgroup/project/-/archive/v2.0.tar.gz");
    expect(result.subdir).toBe("/src/template");
    expect(result.version).toBe("v2.0");
  });

  it("respects GIGET_GITLAB_URL", () => {
    const prev = process.env.GIGET_GITLAB_URL;
    process.env.GIGET_GITLAB_URL = "https://git.example.com";
    try {
      const result = gitlab("group/subgroup/project", opts) as TemplateInfo;
      expect(result.tar).toBe(
        "https://git.example.com/group/subgroup/project/-/archive/main.tar.gz",
      );
    } finally {
      if (prev === undefined) {
        delete process.env.GIGET_GITLAB_URL;
      } else {
        process.env.GIGET_GITLAB_URL = prev;
      }
    }
  });
});
