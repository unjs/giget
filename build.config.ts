import { defineBuildConfig } from "unbuild";
import { rm } from "node:fs/promises";

export default defineBuildConfig({
  rollup: {
    inlineDependencies: [
      // tar v6 dependencies
      "tar",
      "fs-minipass",
      "minipass",
      "minizlib",
      "yallist",
      "mkdirp",
      "chownr",
    ],
  },
  hooks: {
    async "build:done"() {
      await rm("dist/index.d.ts");
      await rm("dist/cli.d.ts");
      await rm("dist/cli.d.mts");
    },
  },
});
