import { describe, expect, it } from "vitest";

import {
  toAcceptedResponse,
  toEventListResponse,
  toEventStatsResponse,
  toEventTimeseriesResponse
} from "../src/modules/audit-events/presenters.js";

describe("audit event presenters", () => {
  it("maps accepted event responses", () => {
    expect(
      toAcceptedResponse({
        id: "evt_1",
        eventType: "user.deleted",
        metadata: {},
        createdAt: "2026-06-16T12:00:00.000Z"
      })
    ).toEqual({
      id: "evt_1",
      event: "user.deleted",
      accepted: true
    });
  });

  it("maps paginated list responses", () => {
    expect(
      toEventListResponse(
        [
          {
            id: "evt_3",
            eventType: "role.changed",
            metadata: {},
            createdAt: "2026-06-16T12:10:00.000Z"
          },
          {
            id: "evt_2",
            eventType: "user.deleted",
            metadata: {},
            createdAt: "2026-06-16T12:05:00.000Z"
          },
          {
            id: "evt_1",
            eventType: "user.created",
            metadata: {},
            createdAt: "2026-06-16T12:00:00.000Z"
          }
        ],
        2
      )
    ).toMatchObject({
      events: [
        {
          id: "evt_3",
          event: "role.changed"
        },
        {
          id: "evt_2",
          event: "user.deleted"
        }
      ],
      pageInfo: {
        hasMore: true,
        nextCursor: expect.any(String)
      }
    });
  });

  it("passes through stats and timeseries responses", () => {
    expect(
      toEventStatsResponse({
        totalEvents: 2,
        topEventTypes: [
          {
            event: "user.deleted",
            count: 2
          }
        ]
      })
    ).toEqual({
      totalEvents: 2,
      topEventTypes: [
        {
          event: "user.deleted",
          count: 2
        }
      ]
    });

    expect(
      toEventTimeseriesResponse([
        {
          bucketStart: "2026-06-16T12:00:00.000Z",
          count: 2
        }
      ])
    ).toEqual({
      points: [
        {
          bucketStart: "2026-06-16T12:00:00.000Z",
          count: 2
        }
      ]
    });
  });
});
