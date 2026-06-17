import { describe, expect, it } from "vitest";

import { createTestEnv, fixedDate } from "../index.js";

describe("testkit", () => {
  it("creates stable dates", () => {
    expect(fixedDate().toISOString()).toBe("2026-06-16T00:00:00.000Z");
  });

  it("creates API test env defaults", () => {
    expect(createTestEnv()).toMatchObject({
      NODE_ENV: "test",
      API_PORT: "4000"
    });
  });
});
