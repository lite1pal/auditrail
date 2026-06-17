"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { createBrowserApiClient } from "../../../lib/api/browser-api-client";
import { createAuditEventsClient } from "../api/audit-events-client";
import { toEventListViewModel } from "../domain/presenters";
import type { EventListQuery } from "../domain/query";
import { createAuditEventsService } from "../services/audit-events-service";

export const auditEventKeys = {
  all: ["audit-events"] as const,
  list: (query: EventListQuery) => [...auditEventKeys.all, "list", query] as const
};

export function useAuditEvents(query: EventListQuery) {
  const service = useMemo(
    () => createAuditEventsService(createAuditEventsClient(createBrowserApiClient())),
    []
  );

  return useQuery({
    queryFn: () => service.list(query),
    queryKey: auditEventKeys.list(query),
    select: toEventListViewModel
  });
}
