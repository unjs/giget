import { mkdir, rm } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { extract } from "tar/extract";
import { resolve, dirname } from "pathe";
import { defu } from "defu";
import { installDependencies } from "nypm";
import { cacheDirectory, download, debug, normalizeHeaders } from "./_utils";
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
  install?: boolean;
  silent?: boolean;
}

const sourceProtoRe = /^([\w-.]+):/;

export type DownloadTemplateResult = Omit<TemplateInfo, "dir" | "source"> & {
  dir: string;
  source: string;
};

export async function downloadTemplate(
  input: string,
  options: DownloadTemplateOptions = {},
): Promise<DownloadTemplateResult> {
  options = defu(
    {
      registry: process.env.GIGET_REGISTRY,
      auth: process.env.GIGET_AUTH,
    },
    options,
  );

  const registry =
    options.registry === false
      ? undefined
      : registryProvider(options.registry, { auth: options.auth });

  let providerName: string =
    options.provider || (registry ? "registry" : "github");

  let source: string = input;
  const sourceProviderMatch = input.match(sourceProtoRe);
  if (sourceProviderMatch) {
    providerName = sourceProviderMatch[1]!;
    source = input.slice(sourceProviderMatch[0].length);
    if (providerName === "http" || providerName === "https") {
      source = input;
    }
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
        `Failed to download template from ${providerName}: ${error.message}`,
      );
    });

  if (!template) {
    throw new Error(`Failed to resolve template from ${providerName}`);
  }

  // Sanitize name and defaultDir
  template.name = (template.name || "template").replace(/[^\da-z-]/gi, "-");
  template.defaultDir = (template.defaultDir || template.name).replace(
    /[^\da-z-]/gi,
    "-",
  );

  // Download template source
  const temporaryDirectory = resolve(
    cacheDirectory(),
    providerName,
    template.name,
  );
  const tarPath = resolve(
    temporaryDirectory,
    (template.version || template.name) + ".tar.gz",
  );

  if (options.preferOffline && existsSync(tarPath)) {
    options.offline = true;
  }
  if (!options.offline) {
    await mkdir(dirname(tarPath), { recursive: true });
    const s = Date.now();
    await download(template.tar, tarPath, {
      headers: {
        Authorization: options.auth ? `Bearer ${options.auth}` : undefined,
        ...normalizeHeaders(template.headers),
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
      `Tarball not found: ${tarPath} (offline: ${options.offline})`,
    );
  }

  // Extract template
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

  const s = Date.now();
  const subdir = template.subdir?.replace(/^\//, "") || "";
  await extract({
    file: tarPath,
    cwd: extractPath,
    onReadEntry(entry) {
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

  if (options.install) {
    debug("Installing dependencies...");
    await installDependencies({
      cwd: extractPath,
      silent: options.silent,
    });
  }

  return {
    ...template,
    source,
    dir: extractPath,
  };
}
