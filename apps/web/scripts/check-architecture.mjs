import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const failures = [];

for (const file of walk(root)) {
  const path = relative(root, file);

  if (/app\/.*\/route\.(ts|tsx|js|jsx)$/.test(path) || path.startsWith("pages/api/")) {
    failures.push(`Next.js API route handlers are forbidden: ${path}`);
  }

  if (/src\/features\/.*\/components\/.*\.tsx$/.test(path)) {
    const lineCount = readFileSync(file, "utf8").split("\n").length;

    if (lineCount > 120) {
      failures.push(`Component exceeds 120 lines (${lineCount}): ${path}`);
    }
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
