import { z } from "zod";

export const auditEventSchema = z.object({
  actor: z.string().optional(),
  createdAt: z.string().datetime({ offset: true }),
  event: z.string(),
  id: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  target: z.string().optional()
});

export const eventListResponseSchema = z.object({
  events: z.array(auditEventSchema),
  pageInfo: z.object({
    hasMore: z.boolean(),
    nextCursor: z.string().nullable()
  })
});

export const eventStatsResponseSchema = z.object({
  topEventTypes: z.array(
    z.object({
      count: z.number(),
      event: z.string()
    })
  ),
  totalEvents: z.number()
});

export const eventTimeseriesResponseSchema = z.object({
  points: z.array(
    z.object({
      bucketStart: z.string().datetime({ offset: true }),
      count: z.number()
    })
  )
});
