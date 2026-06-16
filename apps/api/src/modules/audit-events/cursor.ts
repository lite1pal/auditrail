export interface AuditEventCursor {
  createdAt: string;
  id: string;
}

export function encodeAuditEventCursor(cursor: AuditEventCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function decodeAuditEventCursor(rawCursor: string): AuditEventCursor {
  let parsed: Partial<AuditEventCursor>;

  try {
    parsed = JSON.parse(
      Buffer.from(rawCursor, "base64url").toString("utf8")
    ) as Partial<AuditEventCursor>;
  } catch {
    throw new Error("invalid cursor");
  }

  if (
    typeof parsed.createdAt !== "string" ||
    typeof parsed.id !== "string" ||
    Number.isNaN(Date.parse(parsed.createdAt))
  ) {
    throw new Error("invalid cursor");
  }

  return {
    createdAt: parsed.createdAt,
    id: parsed.id
  };
}
