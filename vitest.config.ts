import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: {
    environment: "node",
    pool: "threads",
    maxWorkers: 1,
    fileParallelism: false,
    include: ["lib/**/*.test.ts", "mocks/**/*.test.ts"],
  },
});
