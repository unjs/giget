import { basename } from "pathe";
import { debug, defineProvider, sendFetch } from "../_utils";
import { TemplateInfo } from "../types";

const _httpJSON = defineProvider(async (input, options) => {
  const result = await sendFetch(input, {
    validateStatus: true,
    headers: {
      authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  });
  const info = (await result.json()) as TemplateInfo;
  if (!info.tar || !info.name) {
    throw new Error(
      `Invalid template info from ${input}. name or tar fields are missing!`,
    );
  }
  return info;
});

export default defineProvider(async (input, options) => {
  if (input.endsWith(".json")) {
    return (await _httpJSON(input, options)) as TemplateInfo;
  }

  const url = new URL(input);
  let name: string = basename(url.pathname);

  try {
    const head = await sendFetch(url.href, {
      method: "HEAD",
      validateStatus: true,
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
      },
    });
    const _contentType = head.headers.get("content-type") || "";
    if (_contentType.includes("application/json")) {
      return (await _httpJSON(input, options)) as TemplateInfo;
    }
    const filename = head.headers
      .get("content-disposition")
      ?.match(/filename="?(.+)"?/)?.[1];
    if (filename) {
      name = filename.split(".")[0];
    }
  } catch (error) {
    debug(`Failed to fetch HEAD for ${url.href}:`, error);
  }

  return {
    name: `${name}-${url.href.slice(0, 8)}`,
    version: "",
    subdir: "",
    tar: url.href,
    defaultDir: name,
    headers: {
      Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
    },
  };
});
