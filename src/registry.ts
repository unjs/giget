import type { TemplateInfo, TemplateProvider } from "./types.ts";
import { debug, sendFetch } from "./_utils.ts";

// const DEFAULT_REGISTRY = 'https://cdn.jsdelivr.net/gh/unjs/giget/templates'
const DEFAULT_REGISTRY = "https://raw.githubusercontent.com/unjs/giget/main/templates";

export const registryProvider = (
  registryEndpoint: string = DEFAULT_REGISTRY,
  options: { auth?: string } = {},
): TemplateProvider => {
  return (async (input) => {
    const start = Date.now();
    const registryURL = `${registryEndpoint}/${input}.json`;

    const result = await sendFetch(registryURL, {
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      },
    });
    if (result.status >= 400) {
      throw new Error(
        `Failed to download ${input} template info from ${registryURL}: ${result.status} ${result.statusText}`,
      );
    }
    const info = (await result.json()) as TemplateInfo;
    if (!info.tar || !info.name) {
      throw new Error(`Invalid template info from ${registryURL}. name or tar fields are missing!`);
    }
    debug(`Fetched ${input} template info from ${registryURL} in ${Date.now() - start}ms`);
    return info;
  }) satisfies TemplateProvider;
};
