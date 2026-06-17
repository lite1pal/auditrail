"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

import { DataTable } from "../../../components/ui/data-table";
import type { AuditEventRow } from "../domain/types";

interface EventsTableProps {
  loading?: boolean;
  rows: AuditEventRow[];
}

export function EventsTable({ loading, rows }: EventsTableProps) {
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
    <DataTable
      columns={columns}
      emptyLabel="No audit events match these filters."
      loading={loading}
      rows={rows}
    />
  );
}
