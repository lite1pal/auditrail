import {
  defaultExtractionOutputPath,
  formatExtractionOutputSummary,
  generateExtractionOutput
} from "./output.js";

const argumentsMap = parseArguments(process.argv.slice(2));

try {
  const result = generateExtractionOutput({
    clean: !argumentsMap.has("--no-clean"),
    outputPath: argumentsMap.get("--output") ?? defaultExtractionOutputPath,
    repoRoot: process.cwd()
  });

  console.log(formatExtractionOutputSummary(result));
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Extraction output generation failed."
  );
  process.exit(1);
}

function parseArguments(argumentsList: readonly string[]) {
  const parsedArguments = new Map<string, string>();

  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];

    if (argument === "--no-clean") {
      parsedArguments.set(argument, "true");
      continue;
    }

    if (argument === "--output") {
      const value = argumentsList[index + 1];

      if (!value) {
        throw new Error("Missing value for '--output'.");
      }

      parsedArguments.set(argument, value);
      index += 1;
      continue;
    }

    throw new Error(`Unknown extraction argument '${argument}'.`);
  }

  return parsedArguments;
}
