import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "**/node_modules/**",
      "./test/.tmp/**"
    ],
    coverage: {
      reporter: ["text", "clover", "json"],
    }
  }
});
