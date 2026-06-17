import { describe, expect, it } from "vitest";

import { hashApiKey, parseApiKey } from "../keys.js";

describe("api key helpers", () => {
  it("parses key prefixes and hashes keys with a pepper", () => {
    expect(parseApiKey("atl_test_secret", "pepper")).toEqual({
      prefix: "atl",
      hash: hashApiKey("atl_test_secret", "pepper")
    });
  });
});
