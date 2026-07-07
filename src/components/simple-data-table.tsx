import type { ReactNode } from "react";

export interface SimpleDataTableRow {
  key: string;
  cells: ReactNode[];
  action: ReactNode;
}

export function SimpleDataTable({
  headers,
  rows,
  emptyHint,
}: {
  headers: string[];
  rows: SimpleDataTableRow[];
  emptyHint: string;
}) {
  if (!rows.length) {
    return <p className="p-10 text-center type-meta">{emptyHint}</p>;
  }

  return (
    <table className="min-w-full text-left">
      <thead className="border-b border-separator bg-surface-sunken">
        <tr>
          {headers.map((h) => (
            <th key={h} className="type-label px-4 py-3 font-medium last:text-right">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            className="border-b border-separator last:border-0 hover:bg-[var(--ads-color-background-neutral)]"
          >
            {row.cells.map((cell, i) => (
              <td key={i} className="px-4 py-3 align-middle">
                {cell}
              </td>
            ))}
            <td className="px-4 py-3 text-right align-middle">{row.action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
