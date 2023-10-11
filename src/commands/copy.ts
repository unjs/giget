import { relative } from "node:path"
import { defineCommand } from "citty";
import { consola } from "consola";
import { cyan } from "colorette";
import { downloadTemplate } from "../giget";
import { startShell } from "../_utils";

export default defineCommand({
  meta: {
    name: "copy",
    description: "Copy a template",
  },
  args: {
    input: {
      type: "positional",
      description: "Template name or URL",
    },
    dir: {
      type: "positional",
      description: "Directory to copy the template to",
    },
    auth: {
      type: "string",
      description: "Authentication token for private templates"
    },
    cwd: {
      type: "string",
      description: "Current working directory"
    },
    force: {
      type: "boolean",
      description: "Force copy even if the directory is not empty"
    },
    forceClean: {
      type: "boolean",
      description: "Force clean the directory before copying"
    },
    offline: {
      type: "boolean",
      description: "Force offline using local cache"
    },
    preferOffline: {
      type: "boolean",
      description: "Prefer offline using local cache if available"
    },
    shell: {
      type: "boolean",
      description: "Start a shell in the template directory"
    },
    verbose: {
      type: "boolean",
      description: "Enable verbose logging"
    }
  },
  run: async ({ args }) => {
    if (args.verbose) {
      process.env.DEBUG = process.env.DEBUG || "true";
    }

    const r = await downloadTemplate(args.input, {
      dir: args.dir,
      force: args.force,
      forceClean: args.forceClean,
      offline: args.offline,
      preferOffline: args.preferOffline,
      auth: args.auth,
    });

      consola.log(
    `✨ Successfully cloned ${cyan(r.name || r.url)} to ${cyan(
      relative(process.cwd(), r.dir),
    )}\n`,
  );

  if (args.shell) {
    startShell(r.dir);
  }
  }
})
