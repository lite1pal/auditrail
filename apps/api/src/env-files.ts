import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export function loadEnvFiles(cwd = process.cwd()): NodeJS.ProcessEnv {
  const env = { ...process.env };
  const files = [resolve(cwd, "../../.env"), resolve(cwd, ".env")];

  for (const file of files) {
    if (!existsSync(file)) {
      continue;
    }

    Object.assign(env, parseEnvFile(readFileSync(file, "utf8")));
  }

  return env;
}

function parseEnvFile(source: string): Record<string, string> {
  return Object.fromEntries(
    source
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"))
      .map((line) => {
        const separatorIndex = line.indexOf("=");

        if (separatorIndex === -1) {
          return [line, ""];
        }

        const key = line.slice(0, separatorIndex).trim();
        const value = line.slice(separatorIndex + 1).trim();

        return [key, stripQuotes(value)];
      })
  );
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}
