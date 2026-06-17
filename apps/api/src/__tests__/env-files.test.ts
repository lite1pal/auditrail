import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadEnvFiles } from "../env-files.js";

describe("env file loading", () => {
  it("loads root and app env files with app values taking precedence", () => {
    const root = join(tmpdir(), `auditrail-env-${Date.now()}`);
    const app = join(root, "apps", "api");

    mkdirSync(app, {
      recursive: true
    });
    writeFileSync(join(root, ".env"), "API_PORT=4000\nDATABASE_URL='postgres://root'\n");
    writeFileSync(join(app, ".env"), 'API_PORT=4002\nREDIS_URL="redis://app"\n');

    expect(loadEnvFiles(app)).toMatchObject({
      API_PORT: "4002",
      DATABASE_URL: "postgres://root",
      REDIS_URL: "redis://app"
    });
  });

  it("ignores missing env files", () => {
    const root = join(tmpdir(), `auditrail-env-missing-${Date.now()}`);

    mkdirSync(root, {
      recursive: true
    });

    expect(loadEnvFiles(root)).toMatchObject(process.env);
  });

  it("parses keys without values as empty strings", () => {
    const root = join(tmpdir(), `auditrail-env-empty-${Date.now()}`);
    const app = join(root, "apps", "api");

    mkdirSync(app, {
      recursive: true
    });
    writeFileSync(join(root, ".env"), "EMPTY\nPLAIN=value\n");

    expect(loadEnvFiles(app)).toMatchObject({
      EMPTY: "",
      PLAIN: "value"
    });
  });
});
