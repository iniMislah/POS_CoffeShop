import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  header: ReactNode;
  className?: string;
  headerClassName?: string;
  render: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  data,
  className,
  emptyMessage,
}: {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-[#E8D8C3]/75 bg-white p-0", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead className="bg-[#FDFBF7]">
            <tr>
              {columns.map((column) => {
                const isActionColumn = column.key === "actions";

                return (
                  <th
                    key={column.key}
                    className={cn(
                      "px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#5A4032]/58",
                      isActionColumn && "w-[300px] text-center",
                      column.headerClassName
                    )}
                  >
                    {column.header}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-12 text-center text-sm text-[#5A4032]/62"
                >
                  {emptyMessage ?? "No data available yet."}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={index}
                  className="border-t border-[#E8D8C3]/65 transition hover:bg-[#FDFBF7]"
                >
                  {columns.map((column) => {
                    const isActionColumn = column.key === "actions";

                    return (
                      <td
                        key={column.key}
                        className={cn(
                          "px-5 py-4 text-sm text-[#5A4032]",
                          isActionColumn && "w-[300px] text-center",
                          column.className
                        )}
                      >
                        {column.render(row)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
