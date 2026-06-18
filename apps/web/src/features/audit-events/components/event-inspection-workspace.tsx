"use client";

import { useState } from "react";

import type { EventListQuery } from "../domain/query";
import type { AuditEventRow } from "../domain/types";
import { EventsTable } from "./events-table";

interface EventInspectionWorkspaceProps {
  hasMore: boolean;
  nextCursor: string | null;
  query: EventListQuery;
  rows: AuditEventRow[];
}

export function EventInspectionWorkspace({
  hasMore,
  nextCursor,
  query,
  rows
}: EventInspectionWorkspaceProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  return (
    <EventsTable
      hasMore={hasMore}
      nextCursor={nextCursor}
      onInspect={setSelectedEventId}
      query={query}
      rows={rows}
      selectedEventId={selectedEventId}
    />
  );
}
