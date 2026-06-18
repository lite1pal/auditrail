import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "dist/**",
      "src/**/__tests__/**/*.integration.test.ts"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/server.ts",
        "src/validate-env.ts",
        "src/plugins/**",
        "src/modules/api-keys/repo.ts",
        "src/modules/audit-events/postgres-repo.ts",
      ],
      thresholds: {
        branches: 90,
        functions: 90,
        lines: 90,
        statements: 90,
      },
    },
  },
});
