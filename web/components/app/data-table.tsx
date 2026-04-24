import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  className,
}: {
  columns: Column<T>[];
  data: T[];
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden p-0", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-cream-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-coffee-700/60">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-t border-coffee-100/60">
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-5 py-4 text-sm text-coffee-900", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
