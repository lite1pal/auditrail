import { z } from "zod";

export const eventListQuerySchema = z
  .object({
    actor: z.string().trim().min(1).optional(),
    cursor: z.string().min(1).optional(),
    event: z.string().trim().min(1).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    target: z.string().trim().min(1).optional(),
    to: z.string().datetime({ offset: true }).optional()
  })
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    error: "from_must_be_before_or_equal_to_to",
    path: ["from"]
  });

export type EventListQuery = z.infer<typeof eventListQuerySchema>;

export function parseEventSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): EventListQuery {
  return eventListQuerySchema.parse(flattenSearchParams(searchParams));
}

export function toApiEventListQuery(query: EventListQuery) {
  return {
    actor: query.actor,
    cursor: query.cursor,
    event: query.event,
    from: query.from,
    limit: query.limit,
    target: query.target,
    to: query.to
  };
}

function flattenSearchParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  return Object.fromEntries(
    Object.entries(searchParams).map(([key, value]) => [
      key,
      Array.isArray(value) ? value[0] : value
    ])
  );
}
