import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export function registerApiErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error, _request, reply) => {
    if (isFastifyValidationError(error)) {
      const validationContext = error.validationContext;
      const errorCode =
        validationContext === "body"
          ? "invalid_event_payload"
          : "invalid_event_query";

      return reply.code(400).send({
        error: errorCode,
        issues: error.validation.map((issue) => ({
          path: getFastifyIssuePath(issue),
          message: issue.message ?? "Invalid input",
          code: issue.keyword
        }))
      });
    }

    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "invalid_event_query",
        issues: error.issues.map((issue) => ({
          path: issue.path,
          message: issue.message,
          code: issue.code
        }))
      });
    }

    app.log.error(error);
    reply.send(error);
  });
}

function isFastifyValidationError(
  error: unknown
): error is {
  validation: Array<{
    instancePath?: string;
    schemaPath?: string;
    keyword: string;
    params?: Record<string, unknown>;
    message?: string;
  }>;
  validationContext?: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "validation" in error &&
    Array.isArray(error.validation)
  );
}

function getFastifyIssuePath(issue: {
  instancePath?: string;
  params?: Record<string, unknown>;
}) {
  if (issue.instancePath && issue.instancePath.length > 0) {
    return issue.instancePath
      .split("/")
      .filter((segment) => segment.length > 0)
      .map((segment) => {
        const asNumber = Number(segment);

        return Number.isNaN(asNumber) ? segment : asNumber;
      });
  }

  if (typeof issue.params?.missingProperty === "string") {
    return [issue.params.missingProperty];
  }

  return [];
}
