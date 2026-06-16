import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { z } from "zod";

export type EnvSource = NodeJS.ProcessEnv | Record<string, string | undefined>;

export function parseWithSchema<TSchema extends z.ZodType>(
  schema: TSchema,
  env: EnvSource
): z.infer<TSchema> {
  return schema.parse(env);
}

export function loadEnvFiles(
  cwd: string,
  relativeFiles: string[],
  baseEnv: EnvSource = process.env
): NodeJS.ProcessEnv {
  const env = { ...baseEnv };

  for (const relativeFile of relativeFiles) {
    const file = resolve(cwd, relativeFile);

    if (!existsSync(file)) {
      continue;
    }

    Object.assign(env, parseEnvFile(readFileSync(file, "utf8")));
  }

  return env;
}

export function parseEnvFile(source: string): Record<string, string> {
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
