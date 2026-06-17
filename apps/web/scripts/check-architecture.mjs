import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const failures = [];

for (const file of walk(root)) {
  const path = relative(root, file);
  const source = readFileSync(file, "utf8");

  if (/app\/.*\/route\.(ts|tsx|js|jsx)$/.test(path) || path.startsWith("pages/api/")) {
    failures.push(`Next.js API route handlers are forbidden: ${path}`);
  }

  if (/src\/features\/.*\/components\/.*\.tsx$/.test(path)) {
    const lineCount = source.split("\n").length;

    if (lineCount > 120) {
      failures.push(`Component exceeds 120 lines (${lineCount}): ${path}`);
    }

    if (importsFeatureBoundary(source, ["api", "server", "services", "state"])) {
      failures.push(
        `Feature components cannot import api/server/services/state modules: ${path}`
      );
    }
  }

  if (isClientFile(source) && importsServerOnlyBoundary(source)) {
    failures.push(`Client file imports a server-only module: ${path}`);
  }
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    if (entry === ".next" || entry === "node_modules") {
      return [];
    }

    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function isClientFile(source) {
  return /^\s*["']use client["'];/.test(source);
}

function importsFeatureBoundary(source, segments) {
  return getImportSpecifiers(source).some((specifier) =>
    segments.some((segment) => specifier.includes(`/${segment}/`))
  );
}

function importsServerOnlyBoundary(source) {
  return getImportSpecifiers(source).some(
    (specifier) =>
      specifier === "server-only" ||
      specifier.includes("/server/") ||
      specifier.includes("server-api-client")
  );
}

function getImportSpecifiers(source) {
  return [...source.matchAll(/import(?: type)?[^"']*["']([^"']+)["']/g)].map(
    (match) => match[1]
  );
}
