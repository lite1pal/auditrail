import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AuditEventsScreen } from "@/src/features/audit-events/components/audit-events-screen";

describe("AuditEventsScreen", () => {
  it("renders the configured empty state and getting-started CTA", () => {
    render(
      <AuditEventsScreen
        initialEvents={{
          events: [],
          pageInfo: {
            hasMore: false,
            nextCursor: null
          }
        }}
        query={{ limit: 25 }}
        stats={{
          topEventTypes: [],
          totalEvents: 0
        }}
        timeseries={{
          points: []
        }}
        workspace={{
          organizationId: "org-1",
          projectId: "project-1"
        }}
      />
    );

    expect(screen.getByRole("heading", { name: "Event stream" })).toBeTruthy();
    expect(
      screen.getByText(
        "No audit events yet. Create a project key in Settings, send one test event, and come back to see the stream and metrics fill in."
      )
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Open getting started" }).getAttribute("href")
    ).toBe("/getting-started?organizationId=org-1&projectId=project-1");
  });
});
