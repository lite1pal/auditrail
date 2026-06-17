import { describe, expect, it } from "vitest";

import {
  decodeAuditEventCursor,
  encodeAuditEventCursor
} from "../cursor.js";

describe("audit event cursor helpers", () => {
  it("encodes and decodes cursors", () => {
    const encoded = encodeAuditEventCursor({
      createdAt: "2026-06-16T12:05:00.000Z",
      id: "ad3cb991-c41f-44e6-ad5b-c79bc3dd5359"
    });

    expect(decodeAuditEventCursor(encoded)).toEqual({
      createdAt: "2026-06-16T12:05:00.000Z",
      id: "ad3cb991-c41f-44e6-ad5b-c79bc3dd5359"
    });
  });

  it("rejects structurally invalid cursor payloads", () => {
    const encoded = Buffer.from(
      JSON.stringify({
        createdAt: "not-a-date",
        id: 123
      })
    ).toString("base64url");

    expect(() => decodeAuditEventCursor(encoded)).toThrow("invalid cursor");
  });
});
