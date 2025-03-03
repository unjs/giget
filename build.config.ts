import { defineBuildConfig } from "unbuild";
import { rm } from "node:fs/promises";
import { transform } from "esbuild";

const tarDeps = [
  "tar",
  "fs-minipass",
  "minipass",
  "minizlib",
  "yallist",
  "mkdirp",
  "chownr",
];

export default defineBuildConfig({
  rollup: {
    inlineDependencies: [...tarDeps],
  },

  hooks: {
    "rollup:options"(ctx, opts) {
      opts.plugins.push({
        name: "selective-minify",
        async transform(code, id) {
          if (tarDeps.some((dep) => id.includes(`node_modules/${dep}/`))) {
            const res = await transform(code, { minify: true });
            return res.code;
          }
        },
      });
    },
    async "build:done"() {
      await rm("dist/index.d.ts");
      await rm("dist/cli.d.ts");
      await rm("dist/cli.d.mts");
    },
  },
});
