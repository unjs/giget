import { defineCommand, runMain as _runMain } from "citty";
import pkg from "../package.json" assert { type: "json" };

const mainCommand = defineCommand({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  subCommands: {
    // eslint-disable-next-line unicorn/prefer-top-level-await
    copy: import("./commands/copy").then((m) => m.default),
  },
});

export function runMain() {
  return _runMain(mainCommand);
}
