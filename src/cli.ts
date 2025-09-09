#!/usr/bin/env node
import { relative } from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import pkg from "../package.json" assert { type: "json" };
import { copyTemplate, downloadTemplate } from "./giget";
import { startShell } from "./_utils";

const mainCommand = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  args: {
    // TODO: Make it `-t` in the next major version
    template: {
      type: "positional",
      description:
        "Template name or a URI describing provider, repository, subdir, and branch/ref",
    },
    dir: {
      type: "positional",
      description: "A relative or absolute path where to extract the template",
      required: false,
    },
    auth: {
      type: "string",
      description:
        "Custom Authorization token to use for downloading template. (Can be overridden with `GIGET_AUTH` environment variable)",
    },
    cwd: {
      type: "string",
      description:
        "Set current working directory to resolve dirs relative to it",
    },
    force: {
      type: "boolean",
      description: "Clone to existing directory even if exists",
    },
    forceClean: {
      type: "boolean",
      description:
        "Remove any existing directory or file recursively before cloning",
    },
    offline: {
      type: "boolean",
      description: "Do not attempt to download and use cached version",
    },
    preferOffline: {
      type: "boolean",
      description: "Use cache if exists otherwise try to download",
    },
    shell: {
      type: "boolean",
      description:
        "Open a new shell with the current working directory set to the cloned directory (experimental)",
    },
    install: {
      type: "boolean",
      description: "Install dependencies after cloning",
    },
    verbose: {
      type: "boolean",
      description: "Show verbose debugging info",
    },
  },
  run: async ({ args }) => {
    if (args.verbose) {
      process.env.DEBUG = process.env.DEBUG || "true";
    }

    const r = args.template.startsWith("file:")
      ? await copyTemplate(args.template, {
          dir: args.dir,
          force: args.force,
          forceClean: args.forceClean,
          offline: args.offline,
          preferOffline: args.preferOffline,
          auth: args.auth,
          install: args.install,
        })
      : await downloadTemplate(args.template, {
          dir: args.dir,
          force: args.force,
          forceClean: args.forceClean,
          offline: args.offline,
          preferOffline: args.preferOffline,
          auth: args.auth,
          install: args.install,
        });

    const _from = r.name || r.url;
    const _to = relative(process.cwd(), r.dir) || "./";
    consola.log(`✨ Successfully cloned \`${_from}\` to \`${_to}\`\n`);

    if (args.shell) {
      startShell(r.dir);
    }
  },
});

runMain(mainCommand);
