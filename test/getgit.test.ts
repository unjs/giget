import { existsSync } from "node:fs";
import { rm, mkdir, writeFile } from "node:fs/promises";
import { expect, it, describe, beforeAll } from "vitest";
import { resolve } from "pathe";
import { downloadTemplate } from "../src";

describe("downloadTemplate", () => {
  const tests = [
    { input: "gh:unjs/template" },
    { input: "codeberg:unjs/template" },
  ];

  beforeAll(async () => {
    await rm(resolve(__dirname, ".tmp"), { recursive: true, force: true });
  });

  for (const test of tests) {
    it(`clone ${test.input}`, async () => {
      const destinationDirectory = resolve(
        __dirname,
        ".tmp/cloned",
        test.input.split(":")[0],
      );
      const { dir } = await downloadTemplate(test.input, {
        dir: destinationDirectory,
        preferOffline: true,
      });
      expect(existsSync(resolve(dir, "package.json")));
    });
  }

  it("do not clone to existing dir", async () => {
    const destinationDirectory = resolve(__dirname, ".tmp/existing");
    await mkdir(destinationDirectory).catch(() => {});
    await writeFile(resolve(destinationDirectory, "test.txt"), "test");
    await expect(
      downloadTemplate("gh:unjs/template", { dir: destinationDirectory }),
    ).rejects.toThrow("already exists");
  });
});
