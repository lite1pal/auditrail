import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventTimeseriesChart } from "@/src/features/audit-events/components/event-timeseries-chart";

describe("EventTimeseriesChart", () => {
  it("renders a minimal chart shell and empty state when no points are available", () => {
    render(<EventTimeseriesChart points={[]} />);

    expect(screen.getByRole("heading", { name: "Event volume" })).toBeTruthy();
    expect(
      screen.getByText("Daily counts for the selected workspace and filters.")
    ).toBeTruthy();
    expect(screen.getByText("No event volume yet.")).toBeTruthy();
  });

  it("renders the chart shell for populated data", () => {
    render(
      <EventTimeseriesChart
        points={[
          {
            bucketStart: "2026-01-01T00:00:00.000Z",
            count: 12
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Event volume" })).toBeTruthy();
    expect(screen.queryByText("No event volume yet.")).toBeNull();
  });
});
