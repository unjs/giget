import { relative } from "node:path";
import { defineCommand, runMain } from "citty";
import { consola } from "consola";
import pkg from "../package.json" assert { type: "json" };
import { downloadTemplate } from "./giget";
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
      description: "Template name or URL",
    },
    dir: {
      type: "positional",
      description: "Directory to copy the template to",
      required: false,
    },
    auth: {
      type: "string",
      description: "Authentication token for private templates",
    },
    cwd: {
      type: "string",
      description: "Current working directory",
    },
    force: {
      type: "boolean",
      description: "Force copy even if the directory is not empty",
    },
    forceClean: {
      type: "boolean",
      description: "Force clean the directory before copying",
    },
    offline: {
      type: "boolean",
      description: "Force offline using local cache",
    },
    preferOffline: {
      type: "boolean",
      description: "Prefer offline using local cache if available",
    },
    shell: {
      type: "boolean",
      description: "Start a shell in the template directory",
    },
    verbose: {
      type: "boolean",
      description: "Enable verbose logging",
    },
  },
  run: async ({ args }) => {
    if (args.verbose) {
      process.env.DEBUG = process.env.DEBUG || "true";
    }

    const r = await downloadTemplate(args.template, {
      dir: args.dir,
      force: args.force,
      forceClean: args.forceClean,
      offline: args.offline,
      preferOffline: args.preferOffline,
      auth: args.auth,
    });

    const _from = r.name || r.url;
    const _to = relative(process.cwd(), r.dir);
    consola.log(`✨ Successfully cloned \`${_from}\` to \`${_to}\`\n`);

    if (args.shell) {
      startShell(r.dir);
    }
  },
});

runMain(mainCommand);
