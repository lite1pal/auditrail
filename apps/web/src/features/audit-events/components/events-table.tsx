"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { useMemo } from "react";

import { DataTable } from "../../../components/ui/data-table";
import type { EventListQuery } from "../domain/query";
import { toEventListHref } from "../domain/query";
import type { AuditEventRow } from "../domain/types";

interface EventsTableProps {
  hasMore: boolean;
  loading?: boolean;
  nextCursor: string | null;
  query: EventListQuery;
  rows: AuditEventRow[];
}

export function EventsTable({
  hasMore,
  loading,
  nextCursor,
  query,
  rows
}: EventsTableProps) {
  const columns = useMemo<Array<ColumnDef<AuditEventRow>>>(
    () => [
      { accessorKey: "createdAt", header: "Created" },
      { accessorKey: "event", header: "Event" },
      { accessorKey: "actor", header: "Actor" },
      { accessorKey: "target", header: "Target" },
      { accessorKey: "metadata", header: "Metadata" }
    ],
    []
  );

  return (
    <section className="events-section">
      <DataTable
        columns={columns}
        emptyLabel="No audit events match these filters."
        loading={loading}
        rows={rows}
      />
      {hasMore && nextCursor ? (
        <Link className="pagination-link" href={toEventListHref(query, nextCursor)}>
          Next page
        </Link>
      ) : null}
    </section>
  );
}
