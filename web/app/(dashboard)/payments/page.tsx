"use client";

import Link from "next/link";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePayments } from "@/hooks/use-payments";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function PaymentsPage() {
  const { token } = useAuth();
  const { payments, isLoading, error, refetch } = usePayments(token);

  return (
    <div className="space-y-6">
      <Topbar title="Payments" subtitle="Centralized payment transaction overview for cash and QRIS operations." />

      {error ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <p className="text-sm text-rose-700">{error}</p>
            <Button variant="secondary" onClick={() => void refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={[
          {
            key: "invoice",
            header: "Invoice",
            render: (row) => row.order.invoiceNumber,
          },
          {
            key: "method",
            header: "Method",
            render: (row) => row.method.toUpperCase(),
          },
          {
            key: "amount",
            header: "Amount",
            render: (row) => formatCurrency(Number(row.amount)),
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge value={row.status.toLowerCase()} />,
          },
          {
            key: "reference",
            header: "Gateway Reference",
            render: (row) => row.gatewayReference || "-",
          },
          {
            key: "createdAt",
            header: "Created At",
            render: (row) => formatDateTime(row.createdAt),
          },
          {
            key: "receipt",
            header: "Receipt",
            render: (row) =>
              row.order.receiptToken ? (
                <Link href={`/receipt/${row.order.receiptToken}`}>
                  <Button variant="outline" size="sm">
                    View Receipt
                  </Button>
                </Link>
              ) : (
                <span className="text-sm text-coffee-700/50">-</span>
              ),
          },
        ]}
        data={payments}
        className={isLoading ? "opacity-70" : ""}
      />
    </div>
  );
}