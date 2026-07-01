import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

import {
  createTodoProductSpec,
  type GeneratedProductSpec
} from "./product-spec.js";

export interface InitializedProductSpecResult {
  outputPath: string;
  product: GeneratedProductSpec;
}

export function initializeProductSpec(input: {
  description?: string;
  force?: boolean;
  outputPath?: string;
  productName: string;
  productTitle?: string;
  repoRoot: string;
  template: "todo";
}) : InitializedProductSpecResult {
  const productId = normalizeProductId(input.productName);
  const product = createTodoProductSpec({
    description: input.description,
    productId,
    productName: input.productTitle?.trim() || toTitleCase(productId)
  });
  const outputPath = resolveSafeSpecOutputPath({
    outputPath: input.outputPath ?? `specs/${productId}.product.json`,
    repoRoot: input.repoRoot
  });
  const absoluteOutputPath = resolve(input.repoRoot, outputPath);

  if (existsSync(absoluteOutputPath) && !(input.force ?? false)) {
    throw new Error(
      `Product spec output already exists at '${outputPath}'. Re-run with --force to overwrite it.`
    );
  }

  mkdirSync(dirname(absoluteOutputPath), {
    recursive: true
  });
  writeFileSync(absoluteOutputPath, `${JSON.stringify(product, null, 2)}\n`);

  return {
    outputPath,
    product
  };
}

export function formatInitializedProductSpecSummary(
  result: InitializedProductSpecResult
) {
  return [
    `Initialized product spec: ${result.product.id}`,
    "",
    `- output: ${result.outputPath}`,
    `- product: ${result.product.name}`,
    `- resources: ${result.product.resources.length}`,
    `- home route: /${result.product.id}`,
    "",
    "Next",
    `- pnpm saas install product ${result.outputPath}`
  ].join("\n");
}

function resolveSafeSpecOutputPath(input: {
  outputPath: string;
  repoRoot: string;
}) {
  const absolutePath = resolve(input.repoRoot, input.outputPath);
  const relativePath = relative(input.repoRoot, absolutePath).replace(/\\/g, "/");

  if (
    relativePath.length === 0 ||
    relativePath.startsWith("..") ||
    relativePath.includes("/../")
  ) {
    throw new Error(`Unsafe product spec output path '${input.outputPath}'.`);
  }

  return relativePath;
}

function normalizeProductId(value: string) {
  const normalized = value
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  if (!/^[a-z][a-z0-9-]*$/.test(normalized)) {
    throw new Error(
      `Unsupported product name '${value}'. Use letters, numbers, and separators so it can normalize into kebab-case.`
    );
  }

  return normalized;
}

function toTitleCase(value: string) {
  return value
    .split("-")
    .filter((segment) => segment.length > 0)
    .map((segment) => segment[0]!.toUpperCase() + segment.slice(1))
    .join(" ");
}
