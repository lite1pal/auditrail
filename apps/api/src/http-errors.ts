import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export interface ApiErrorHandlerOptions {
  nodeEnv?: "development" | "test" | "production";
}

export function registerApiErrorHandler(
  app: FastifyInstance,
  options: ApiErrorHandlerOptions = {}
) {
  const nodeEnv = options.nodeEnv ?? normalizeNodeEnv(process.env.NODE_ENV);
  const exposeInternalMessage = nodeEnv !== "production";

  app.setErrorHandler((error, request, reply) => {
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

    if (isRateLimitError(error)) {
      request.requestCompletedErrorCode = error.code ?? "FST_ERR_RATE_LIMIT";

      return reply.code(error.statusCode).send({
        statusCode: error.statusCode,
        code: error.code ?? "FST_ERR_RATE_LIMIT",
        error: error.error ?? "Too Many Requests",
        message: error.message
      });
    }

    request.requestCompletedErrorCode = "internal_server_error";
    request.log.error(
      {
        errorCode: "internal_server_error",
        errorName: getErrorName(error),
        method: request.method,
        requestId: request.id,
        route: request.routeOptions.url,
        ...(error instanceof Error
          ? {}
          : {
              thrownValueType: getThrownValueType(error)
            })
      },
      "unhandled_request_error"
    );

    return reply.code(500).send({
      error: "internal_server_error",
      ...(exposeInternalMessage
        ? {
            message: getDevelopmentErrorMessage(error)
          }
        : {})
    });
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

function isRateLimitError(
  error: unknown
): error is {
  code?: string;
  error?: string;
  message: string;
  statusCode: 429;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 429 &&
    "message" in error &&
    typeof error.message === "string" &&
    (error.message.includes("Rate limit exceeded") ||
      ("code" in error && error.code === "FST_ERR_RATE_LIMIT"))
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

function normalizeNodeEnv(nodeEnv: string | undefined) {
  if (nodeEnv === "production" || nodeEnv === "test") {
    return nodeEnv;
  }

  return "development";
}

function getDevelopmentErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unexpected error";
}

function getErrorName(error: unknown) {
  if (error instanceof Error && error.name.length > 0) {
    return error.name;
  }

  return "NonErrorThrown";
}

function getThrownValueType(error: unknown) {
  if (error === null) {
    return "null";
  }

  if (Array.isArray(error)) {
    return "array";
  }

  return typeof error;
}
