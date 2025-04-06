import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      reporter: ["text", "clover", "json"],
      include: ["src/**/*.{ts,js}", "!src/cli.ts", "!src/types.ts"],
    },
    env: {
      DEBUG: "DEBUG",
    },
  },
});
