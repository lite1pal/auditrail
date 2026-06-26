import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const repoRoot = fileURLToPath(new URL("../..", import.meta.url));
const webRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@auditrail\/domain\/audit-events$/,
        replacement: path.join(repoRoot, "packages/domain/src/audit-events/index.ts")
      },
      {
        find: /^@auditrail\/domain$/,
        replacement: path.join(repoRoot, "packages/domain/src/index.ts")
      },
      {
        find: "@",
        replacement: webRoot
      },
      {
        find: "server-only",
        replacement: path.join(webRoot, "src/test/server-only.ts")
      }
    ]
  },
  test: {
    coverage: {
      provider: "v8",
      thresholds: {
        branches: 85,
        functions: 90,
        lines: 90,
        statements: 90
      }
    },
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"]
  }
});
