import { describe, expect, it } from "vitest";

import { parseEventSearchParams } from "../domain/query";

describe("parseEventSearchParams", () => {
  it("applies API-aligned defaults", () => {
    expect(parseEventSearchParams({})).toEqual({
      limit: 25
    });
  });

  it("rejects inverted date ranges", () => {
    expect(() =>
      parseEventSearchParams({
        from: "2026-01-02T00:00:00.000Z",
        to: "2026-01-01T00:00:00.000Z"
      })
    ).toThrow();
  });
});
