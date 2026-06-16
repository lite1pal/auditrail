import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseEnvFile, parseWithSchema } from "../src/index.js";
import { loadEnvFiles } from "../src/index.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("config helpers", () => {
  it("parses dotenv-style key values", () => {
    expect(
      parseEnvFile("PLAIN=value\nDOUBLE=\"quoted\"\nSINGLE='quoted'\n# skip\n")
    ).toEqual({
      PLAIN: "value",
      DOUBLE: "quoted",
      SINGLE: "quoted"
    });
  });

  it("validates env values with the provided schema", () => {
    const schema = z.object({
      PORT: z.coerce.number().int().positive()
    });

    expect(parseWithSchema(schema, { PORT: "4000" })).toEqual({
      PORT: 4000
    });
  });

  it("lets process env override file env values", () => {
    const root = join(tmpdir(), `config-env-${Date.now()}`);

    mkdirSync(root, {
      recursive: true
    });
    writeFileSync(join(root, ".env"), "RATE_LIMIT_MAX=100\n");

    expect(loadEnvFiles(root, [".env"], { RATE_LIMIT_MAX: "1" })).toMatchObject({
      RATE_LIMIT_MAX: "1"
    });
  });
});
