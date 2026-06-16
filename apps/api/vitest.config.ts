import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage",
      include: ["src/**/*.ts"],
      exclude: ["src/server.ts", "src/validate-env.ts"],
      thresholds: {
        branches: 95,
        functions: 95,
        lines: 95,
        statements: 95
      }
    }
  }
});
