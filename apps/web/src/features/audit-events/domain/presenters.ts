import type { EventListResponse, EventListViewModel } from "./types";

export function toEventListViewModel(
  response: EventListResponse
): EventListViewModel {
  return {
    hasMore: response.pageInfo.hasMore,
    nextCursor: response.pageInfo.nextCursor,
    rows: response.events.map((event) => ({
      actor: event.actor ?? "Unknown",
      createdAt: formatIsoDate(event.createdAt),
      event: event.event,
      id: event.id,
      metadata: JSON.stringify(event.metadata),
      target: event.target ?? "Unknown"
    }))
  };
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
