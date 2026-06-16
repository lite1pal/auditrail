import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseEnvFile, parseWithSchema } from "../src/index.js";

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
});
