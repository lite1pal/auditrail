import type { IngestAuditEventInput } from "@auditrail/domain/audit-events";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { registerApiErrorHandler } from "../../http-errors.js";
import { registerApiSchemas, schemaIds } from "../../http-schemas.js";
import { decodeAuditEventCursor, encodeAuditEventCursor } from "./cursor.js";
import { createPostgresAuditEventRepo } from "./postgres-repo.js";
import { createInMemoryAuditEventRepo } from "./repo.js";
import {
  createAuditEventService,
  type AuditEventService
} from "./service.js";

export interface EventRoutesOptions {
  service?: AuditEventService;
}

const listEventsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(25),
    cursor: z.string().min(1).optional(),
    event: z.string().trim().min(1).optional(),
    actor: z.string().trim().min(1).optional(),
    target: z.string().trim().min(1).optional(),
    events: z.string().trim().min(1).optional(),
    actors: z.string().trim().min(1).optional(),
    targets: z.string().trim().min(1).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine(
    (query) => {
      if (!query.from || !query.to) {
        return true;
      }

      return query.from <= query.to;
    },
    {
      error: "from_must_be_before_or_equal_to_to",
      path: ["from"]
    }
  );

const summarizeEventsQuerySchema = z
  .object({
    top: z.coerce.number().int().min(1).max(20).default(5),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine(
    (query) => {
      if (!query.from || !query.to) {
        return true;
      }

      return query.from <= query.to;
    },
    {
      error: "from_must_be_before_or_equal_to_to",
      path: ["from"]
    }
  );

const timeseriesEventsQuerySchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
    bucket: z.enum(["hour", "day"]).default("hour")
  })
  .refine((query) => query.from <= query.to, {
    error: "from_must_be_before_or_equal_to_to",
    path: ["from"]
  });

export async function registerEventRoutes(
  app: FastifyInstance,
  options: EventRoutesOptions = {}
) {
  registerApiErrorHandler(app);
  registerApiSchemas(app);

  const service =
    options.service ??
    createAuditEventService(
      "db" in app
        ? createPostgresAuditEventRepo(app.db)
        : createInMemoryAuditEventRepo()
    );

  app.post(
    "/events",
    {
      schema: {
        tags: ["events"],
        summary: "Ingests an audit event",
        security: [{ bearerAuth: [] }],
        body: {
          $ref: `${schemaIds.ingestEventBody}#`
        },
        response: {
          202: {
            $ref: `${schemaIds.eventAcceptedResponse}#`
          },
          400: {
            $ref: `${schemaIds.validationErrorResponse}#`
          },
          401: {
            $ref: `${schemaIds.simpleErrorResponse}#`
          },
          429: {
            $ref: `${schemaIds.rateLimitErrorResponse}#`
          }
        }
      }
    },
    async (request, reply) => {
      const principal = request.apiKeyPrincipal ?? {
        organizationId: "00000000-0000-0000-0000-000000000000",
        projectId: "00000000-0000-0000-0000-000000000000"
      };
      const rawInput = request.body as IngestAuditEventInput;
      const input: IngestAuditEventInput = {
        ...rawInput,
        metadata: rawInput.metadata ?? {}
      };
      const event = await service.ingest(
        {
          organizationId: principal.organizationId,
          projectId: principal.projectId
        },
        input
      );

      return reply.code(202).send({
        id: event.id,
        event: event.eventType,
        accepted: true
      });
    }
  );

  app.get(
    "/events",
    {
      schema: {
        tags: ["events"],
        summary: "Lists audit events for the authenticated project",
        security: [{ bearerAuth: [] }],
        querystring: {
          $ref: `${schemaIds.listEventsQuery}#`
        },
        response: {
          200: {
            $ref: `${schemaIds.eventListResponse}#`
          },
          400: {
            $ref: `${schemaIds.validationErrorResponse}#`
          },
          401: {
            $ref: `${schemaIds.simpleErrorResponse}#`
          },
          429: {
            $ref: `${schemaIds.rateLimitErrorResponse}#`
          }
        }
      }
    },
    async (request, reply) => {
      try {
        const principal = request.apiKeyPrincipal ?? {
          organizationId: "00000000-0000-0000-0000-000000000000",
          projectId: "00000000-0000-0000-0000-000000000000"
        };
        const query = listEventsQuerySchema.parse(request.query);

        if (query.cursor) {
          decodeAuditEventCursor(query.cursor);
        }

        const events = await service.list(
          {
            organizationId: principal.organizationId,
            projectId: principal.projectId
          },
          {
            limit: query.limit + 1,
            cursor: query.cursor,
            eventTypes: mergeFilterValues(query.event, query.events),
            actorIds: mergeFilterValues(query.actor, query.actors),
            targetIds: mergeFilterValues(query.target, query.targets),
            from: query.from,
            to: query.to
          }
        );
        const hasMore = events.length > query.limit;
        const pageEvents = hasMore ? events.slice(0, query.limit) : events;
        const lastEvent = pageEvents.at(-1);

        return reply.send({
          events: pageEvents.map((event) => ({
            id: event.id,
            event: event.eventType,
            actor: event.actorId,
            target: event.targetId,
            metadata: event.metadata,
            createdAt: event.createdAt
          })),
          pageInfo: {
            hasMore,
            nextCursor:
              hasMore && lastEvent
                ? encodeAuditEventCursor({
                    createdAt: lastEvent.createdAt,
                    id: lastEvent.id
                  })
                : null
          }
        });
      } catch (error) {
        if (error instanceof Error && error.message === "invalid cursor") {
          return reply.code(400).send({
            error: "invalid_event_query",
            issues: []
          });
        }

        throw error;
      }
    }
  );

  app.get(
    "/events/stats",
    {
      schema: {
        tags: ["events"],
        summary: "Returns event summary statistics for the authenticated project",
        security: [{ bearerAuth: [] }],
        querystring: {
          $ref: `${schemaIds.summarizeEventsQuery}#`
        },
        response: {
          200: {
            $ref: `${schemaIds.eventStatsResponse}#`
          },
          400: {
            $ref: `${schemaIds.validationErrorResponse}#`
          },
          401: {
            $ref: `${schemaIds.simpleErrorResponse}#`
          },
          429: {
            $ref: `${schemaIds.rateLimitErrorResponse}#`
          }
        }
      }
    },
    async (request, reply) => {
      const principal = request.apiKeyPrincipal ?? {
        organizationId: "00000000-0000-0000-0000-000000000000",
        projectId: "00000000-0000-0000-0000-000000000000"
      };
      const query = summarizeEventsQuerySchema.parse(request.query);
      const summary = await service.summarize(
        {
          organizationId: principal.organizationId,
          projectId: principal.projectId
        },
        query
      );

      return reply.send(summary);
    }
  );

  app.get(
    "/events/timeseries",
    {
      schema: {
        tags: ["events"],
        summary: "Returns time-bucketed event counts for the authenticated project",
        security: [{ bearerAuth: [] }],
        querystring: {
          $ref: `${schemaIds.timeseriesEventsQuery}#`
        },
        response: {
          200: {
            $ref: `${schemaIds.eventTimeseriesResponse}#`
          },
          400: {
            $ref: `${schemaIds.validationErrorResponse}#`
          },
          401: {
            $ref: `${schemaIds.simpleErrorResponse}#`
          },
          429: {
            $ref: `${schemaIds.rateLimitErrorResponse}#`
          }
        }
      }
    },
    async (request, reply) => {
      const principal = request.apiKeyPrincipal ?? {
        organizationId: "00000000-0000-0000-0000-000000000000",
        projectId: "00000000-0000-0000-0000-000000000000"
      };
      const query = timeseriesEventsQuerySchema.parse(request.query);
      const points = await service.timeseries(
        {
          organizationId: principal.organizationId,
          projectId: principal.projectId
        },
        query
      );

      return reply.send({
        points
      });
    }
  );
}

function splitFilterValues(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function mergeFilterValues(
  singleValue?: string,
  multiValue?: string
): string[] | undefined {
  const values = [
    ...(singleValue ? [singleValue] : []),
    ...(splitFilterValues(multiValue) ?? [])
  ];

  if (values.length === 0) {
    return undefined;
  }

  return [...new Set(values)];
}
