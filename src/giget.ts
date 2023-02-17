import { mkdir, rm } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { extract } from "tar";
import { resolve, dirname } from "pathe";
import { defu } from "defu";
import { cacheDirectory, download, debug } from "./_utils";
import { providers } from "./providers";
import { registryProvider } from "./registry";
import type { TemplateInfo, TemplateProvider } from "./types";

export interface DownloadTemplateOptions {
  provider?: string;
  force?: boolean;
  forceClean?: boolean;
  offline?: boolean;
  preferOffline?: boolean;
  providers?: Record<string, TemplateProvider>;
  dir?: string;
  registry?: false | string;
  cwd?: string;
  auth?: string;
}

const sourceProtoRe = /^([\w-.]+):/;

export type DownloadTemplateResult = Omit<TemplateInfo, "dir" | "source"> & {
  dir: string;
  source: string;
};

export async function downloadTemplate(
  input: string,
  options: DownloadTemplateOptions = {}
): Promise<DownloadTemplateResult> {
  options = defu(
    {
      registry: process.env.GIGET_REGISTRY,
      auth: process.env.GIGET_AUTH,
    },
    options
  );

  const registry =
    options.registry !== false
      ? registryProvider(options.registry, { auth: options.auth })
      : undefined;
  let providerName: string =
    options.provider || (registryProvider ? "registry" : "github");
  let source: string = input;
  const sourceProvierMatch = input.match(sourceProtoRe);
  if (sourceProvierMatch) {
    providerName = sourceProvierMatch[1];
    source = input.slice(sourceProvierMatch[0].length);
  }

  const provider =
    options.providers?.[providerName] || providers[providerName] || registry;
  if (!provider) {
    throw new Error(`Unsupported provider: ${providerName}`);
  }
  const template = await Promise.resolve()
    .then(() => provider(source, { auth: options.auth }))
    .catch((error) => {
      throw new Error(
        `Failed to download template from ${providerName}: ${error.message}`
      );
    });

  // Sanitize name and defaultDir
  template.name = (template.name || "template").replace(/[^\da-z-]/gi, "-");
  template.defaultDir = (template.defaultDir || template.name).replace(
    /[^\da-z-]/gi,
    "-"
  );

  const cwd = resolve(options.cwd || ".");
  const extractPath = resolve(cwd, options.dir || template.defaultDir);
  if (options.forceClean) {
    await rm(extractPath, { recursive: true, force: true });
  }
  if (
    !options.force &&
    existsSync(extractPath) &&
    readdirSync(extractPath).length > 0
  ) {
    throw new Error(`Destination ${extractPath} already exists.`);
  }
  await mkdir(extractPath, { recursive: true });

  const temporaryDirectory = resolve(
    cacheDirectory(),
    options.provider,
    template.name
  );
  const tarPath = resolve(
    temporaryDirectory,
    (template.version || template.name) + ".tar.gz"
  );

  if (options.preferOffline && existsSync(tarPath)) {
    options.offline = true;
  }
  if (!options.offline) {
    await mkdir(dirname(tarPath), { recursive: true });
    const s = Date.now();
    const templateHeaders = Object.fromEntries(
      Object.entries(template.headers || {})
        .filter((entry) => entry[1])
        .map(([key, value]) => [key.toLowerCase(), value])
    );
    await download(template.tar, tarPath, {
      headers: {
        authorization: options.auth ? `Bearer ${options.auth}` : undefined,
        ...templateHeaders,
      },
    }).catch((error) => {
      if (!existsSync(tarPath)) {
        throw error;
      }
      // Accept network errors if we have a cached version
      debug("Download error. Using cached version:", error);
      options.offline = true;
    });
    debug(`Downloaded ${template.tar} to ${tarPath} in ${Date.now() - s}ms`);
  }

  if (!existsSync(tarPath)) {
    throw new Error(
      `Tarball not found: ${tarPath} (offline: ${options.offline})`
    );
  }

  const s = Date.now();
  const subdir = template.subdir?.replace(/^\//, "") || "";
  await extract({
    file: tarPath,
    cwd: extractPath,
    onentry(entry) {
      entry.path = entry.path.split("/").splice(1).join("/");
      if (subdir) {
        // eslint-disable-next-line unicorn/prefer-ternary
        if (entry.path.startsWith(subdir + "/")) {
          // Rewrite path
          entry.path = entry.path.slice(subdir.length);
        } else {
          // Skip
          entry.path = "";
        }
      }
    },
  });
  debug(`Extracted to ${extractPath} in ${Date.now() - s}ms`);

  return {
    ...template,
    source,
    dir: extractPath,
  };
}
