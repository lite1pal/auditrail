import { describe, expect, it } from "vitest";

import { toEventListViewModel } from "../domain/presenters";

describe("toEventListViewModel", () => {
  it("maps API events to table rows", () => {
    const result = toEventListViewModel({
      events: [
        {
          actor: "actor-1",
          createdAt: "2026-01-01T00:00:00.000Z",
          event: "user.created",
          id: "event-1",
          metadata: { source: "test" },
          target: "user-1"
        }
      ],
      pageInfo: {
        hasMore: false,
        nextCursor: null
      }
    });

    expect(result.hasMore).toBe(false);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.event).toBe("user.created");
  });
});
