import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["tests/**"],
    setupFiles: ["./vitest.setup.ts"],
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
