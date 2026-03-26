import { defineBuildConfig } from "obuild/config";
import { minifySync } from "rolldown/experimental";
import type { Plugin } from "rolldown";

export default defineBuildConfig({
  entries: [{ type: "bundle", input: ["src/index.ts", "src/cli.ts"] }],
  hooks: {
    rolldownConfig: (config) => {
      config.plugins ??= [];
      (config.plugins as Plugin[]).push({
        name: "min-libs",
        renderChunk(code, chunk) {
          if (chunk.fileName.startsWith("_chunks/libs/")) {
            return minifySync(chunk.fileName, code, {});
          }
        },
      });
    },
  },
});
