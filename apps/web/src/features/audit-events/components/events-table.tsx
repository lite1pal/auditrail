"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { Button } from "@/src/components/ui/button";
import { DataTable } from "@/src/components/ui/data-table";
import { PaginationLink } from "@/src/components/ui/pagination-link";
import type {
  EventListQuery,
  EventListWorkspaceQuery
} from "@/src/features/audit-events/domain/query";
import { toEventListHref } from "@/src/features/audit-events/domain/query";
import type { AuditEventRow } from "@/src/features/audit-events/domain/types";
import { getAuditEventsCopy } from "@/src/features/audit-events/product/audit-product-copy";

interface EventsTableProps {
  hasMore: boolean;
  loading?: boolean;
  nextCursor: string | null;
  onInspect?: (eventId: string) => void;
  query: EventListQuery;
  rows: AuditEventRow[];
  selectedEventId?: string | null;
  workspace?: EventListWorkspaceQuery;
}

export function EventsTable({
  hasMore,
  loading,
  nextCursor,
  onInspect,
  query,
  rows,
  selectedEventId,
  workspace
}: EventsTableProps) {
  const copy = getAuditEventsCopy();
  const columns = useMemo<Array<ColumnDef<AuditEventRow>>>(
    () => {
      const baseColumns: Array<ColumnDef<AuditEventRow>> = [
        { accessorKey: "createdAt", header: copy.tableHeaders.created },
        { accessorKey: "event", header: copy.tableHeaders.event },
        { accessorKey: "actor", header: copy.tableHeaders.actor },
        { accessorKey: "target", header: copy.tableHeaders.target },
        { accessorKey: "metadata", header: copy.tableHeaders.metadata }
      ];

      if (!onInspect) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          cell: ({ row }) => {
            const selected = row.original.id === selectedEventId;

            return (
              <Button
                aria-pressed={selected}
                onClick={() => onInspect(row.original.id)}
                size="sm"
                type="button"
                variant={selected ? "secondary" : "ghost"}
              >
                {selected ? copy.inspectingActionLabel : copy.inspectActionLabel}
              </Button>
            );
          },
          header: copy.tableHeaders.inspect,
          id: "inspect"
        }
      ];
    },
    [copy, onInspect, selectedEventId]
  );

  return (
    <section className="grid gap-4">
      <DataTable
        columns={columns}
        emptyLabel={copy.tableEmptyLabel}
        loading={loading}
        rows={rows}
      />
      {hasMore && nextCursor ? (
        <PaginationLink href={toEventListHref(query, nextCursor, workspace)}>
          {copy.nextPageLabel}
        </PaginationLink>
      ) : null}
    </section>
  );
}
