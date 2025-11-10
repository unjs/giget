import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
// @ts-ignore
import tarExtract from "tar/lib/extract.js";
import type { ExtractOptions } from "tar";
import { resolve, dirname, basename } from "pathe";
import { defu } from "defu";
import { installDependencies } from "nypm";
import {
  cacheDirectory,
  download,
  debug,
  normalizeHeaders,
  sendFetch,
} from "./_utils";
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
  strategy?: "skip" | "overwrite";
  files?: string[];
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

  // Raw download attempt (fast path for specific files if options.files is provided)
  if (
    template.raw &&
    Array.isArray(options.files) &&
    options.files.length > 0
  ) {
    const files = options.files;
    const cwd = resolve(options.cwd || ".");
    const destDir = resolve(cwd, options.dir || template.defaultDir);
    let allFilesDownloadedRaw = true;

    try {
      for (const filePath of files) {
        const rawUrl = template.raw(filePath.replace(/^\//, ""));
        const outPath = resolve(destDir, filePath);
        await mkdir(dirname(outPath), { recursive: true });

        if (options.strategy !== "skip" || !existsSync(outPath)) {
          const res = await sendFetch(rawUrl, {
            validateStatus: true,
            headers: normalizeHeaders({
              Authorization: options.auth
                ? `Bearer ${options.auth}`
                : undefined,
              ...template.headers,
            }),
          });

          if (res.status >= 400) {
            allFilesDownloadedRaw = false;
            debug(
              `Raw download failed for ${rawUrl} (status: ${res.status}). Falling back to tarball.`,
            );
            break; // Exit loop, will proceed to tarball logic outside this block
          }
          const buffer = Buffer.from(await res.arrayBuffer());
          await writeFile(outPath, buffer);
        }
      }

      if (allFilesDownloadedRaw) {
        return {
          ...template,
          dir: destDir,
          source: files.join(", "),
        };
      }
    } catch (error: any) {
      allFilesDownloadedRaw = false;
      debug(
        "Raw files download process failed:",
        error.message,
        "Falling back to tarball flow.",
      );
    }
  }

  // --- Tarball Download and Unified Extraction Logic ---
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
    if (!options.offline) {
      // Log only if a download was attempted and succeeded
      debug(`Downloaded ${template.tar} to ${tarPath} in ${Date.now() - s}ms`);
    }
  }

  if (!existsSync(tarPath)) {
    throw new Error(
      `Tarball not found: ${tarPath} (offline: ${options.offline})`,
    );
  }

  const cwd = resolve(options.cwd || ".");
  const extractPath = resolve(cwd, options.dir || template.defaultDir);

  if (options.forceClean) {
    await rm(extractPath, { recursive: true, force: true });
  }

  const normalizedSubdirForCheck = template.subdir
    ? template.subdir.replace(/^\/+|\/+$/g, "")
    : "";
  const isFullCloneOrRootDir =
    !normalizedSubdirForCheck || normalizedSubdirForCheck === ".";
  debug(
    `Overwrite check: template.subdir="${template.subdir}", normalizedSubdirForCheck="${normalizedSubdirForCheck}", isFullCloneOrRootDir=${isFullCloneOrRootDir}, strategy="${options.strategy}", extractPath="${extractPath}"`,
  );

  if (
    !options.force &&
    !(options.files && options.files.length > 0) &&
    isFullCloneOrRootDir &&
    existsSync(extractPath) &&
    readdirSync(extractPath).length > 0
  ) {
    if (options.strategy === "overwrite") {
      debug(
        `Destination ${extractPath} exists and is not empty, but strategy is "overwrite". Proceeding with extraction.`,
      );
    } else if (options.strategy === "skip") {
      debug(
        `Skipping extraction for ${input}: destination ${extractPath} exists, is not empty, and strategy is "skip".`,
      );
      return {
        ...template,
        dir: extractPath,
        source,
      };
    } else {
      throw new Error(
        `Destination ${extractPath} already exists and is not empty. Use --force, --strategy=overwrite to overwrite, or --strategy=skip to skip.`,
      );
    }
  }
  await mkdir(extractPath, { recursive: true });

  const s = Date.now();
  await tarExtract(<ExtractOptions>{
    file: tarPath,
    cwd: extractPath,
    onentry(entry) {
      const pathFromTar = entry.path;
      const firstSlashIndex = pathFromTar.indexOf("/");

      if (firstSlashIndex === -1) {
        entry.path = ""; // Skip this entry
        return;
      }

      const effectivePath = pathFromTar.slice(firstSlashIndex + 1);
      const normalizedSubdir = template.subdir
        ? template.subdir.replace(/^\/+|\/+$/g, "")
        : "";

      if (options.files && options.files.length > 0) {
        const normalizedFileTargets = options.files.map((p) =>
          p.replace(/^\/+|\/+$/g, ""),
        );

        const shouldExtract = normalizedFileTargets.some((normalizedTarget) => {
          if (effectivePath === normalizedTarget) return true;
          if (effectivePath.startsWith(normalizedTarget + "/")) return true;
          return false;
        });

        if (!shouldExtract) {
          entry.path = "";
          return;
        }
        entry.path = effectivePath;
      } else if (
        normalizedSubdir &&
        normalizedSubdir !== "" &&
        normalizedSubdir !== "."
      ) {
        if (effectivePath.startsWith(normalizedSubdir + "/")) {
          entry.path = effectivePath.slice(normalizedSubdir.length + 1);
        } else if (effectivePath === normalizedSubdir) {
          entry.path =
            entry.type === "Directory" ? "" : basename(effectivePath);
        } else {
          entry.path = "";
          return;
        }
      } else {
        entry.path = effectivePath;
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
    source:
      options.files && options.files.length > 0
        ? options.files.join(", ")
        : source,
    dir: extractPath,
  };
}
