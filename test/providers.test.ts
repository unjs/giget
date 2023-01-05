import { expect, it, describe } from "vitest";
import { providers } from "../src/providers";

describe("providers", () => {
  const defaultProviders = {
    gh: "gh:unjs/template",
    github: "github:unjs/template",
    bitbucket: "bitbucket:unjs/template",
    gitlab: "gitlab:unjs/template",
    sourcehut: "sourcehut:pi0/unjs-template",
  }

  const matches = [
    {
      provider: "gh, github",
      output: {
        name: 'unjs-template',
        version: 'main',
        subdir: '/',
        headers: { Authorization: undefined },
        url: 'https://github.com/unjs/template/tree/main/',
        tar: 'https://github.com/unjs/template/archive/main.tar.gz'
      },
    },
    {
      provider: "sourcehut",
      output: {
        name: 'pi0-unjs-template',
        version: 'main',
        subdir: '/',
        headers: { Authorization: undefined },
        url: 'https://git.sr.ht/~pi0/unjs-template/tree/main/item/',
        tar: 'https://git.sr.ht/~pi0/unjs-template/archive/main.tar.gz'
      },
    },
    {
      provider: "bitbucket",
      output: {
        name: 'unjs-template',
        version: 'main',
        subdir: '/',
        headers: { Authorization: undefined },
        url: 'https://bitbucket.com/unjs/template/src/main/',
        tar: 'https://bitbucket.org/unjs/template/get/main.tar.gz'
      },
    },
    {
      provider: "gitlab",
      output: {
        name: 'unjs-template',
        version: 'main',
        subdir: '/',
        headers: { Authorization: undefined },
        url: 'https://gitlab.com/unjs/template/tree/main/',
        tar: 'https://gitlab.com/unjs/template/-/archive/main.tar.gz'
      }
    }
  ]

  const findMatch = (provider: string) => matches.find(m => m.provider.includes(provider))?.output ?? {}

  for(const [provider, url] of Object.entries(defaultProviders)) {
    it(provider, () => {
      const sourceProtoRe = /^([\w-.]+):/;
      const sourceMatch = url.match(sourceProtoRe)
      const provider = sourceMatch ? sourceMatch[1] : "unknown"
      const source = url.slice(sourceMatch[0].length)
      expect(findMatch(provider)).toMatchObject(providers[provider](source, {}))
    });
  }

  it("unknown provider to throw error", () => expect(() => providers?.unknown("unknown", {})).toThrow())
});
