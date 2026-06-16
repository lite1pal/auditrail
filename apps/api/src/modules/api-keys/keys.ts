import { createHash } from "node:crypto";

export interface ParsedApiKey {
  prefix: string;
  hash: string;
}

export function parseApiKey(rawApiKey: string, pepper: string): ParsedApiKey {
  const apiKey = rawApiKey.trim();
  const [prefix] = apiKey.split("_", 1);

  return {
    prefix,
    hash: hashApiKey(apiKey, pepper)
  };
}

export function hashApiKey(apiKey: string, pepper: string): string {
  return createHash("sha256").update(`${pepper}:${apiKey}`).digest("hex");
}
