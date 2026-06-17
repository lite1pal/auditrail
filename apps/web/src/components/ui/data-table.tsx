"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef
} from "@tanstack/react-table";

interface DataTableProps<TData> {
  columns: Array<ColumnDef<TData>>;
  emptyLabel: string;
  loading?: boolean;
  rows: TData[];
}

export function DataTable<TData>({
  columns,
  emptyLabel,
  loading,
  rows
}: DataTableProps<TData>) {
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel()
  });

  if (loading) {
    return <div className="table-state">Loading...</div>;
  }

  if (rows.length === 0) {
    return <div className="table-state">{emptyLabel}</div>;
  }

  return (
    <table className="data-table">
      <thead>
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
