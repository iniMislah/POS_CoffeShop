"use client";

import Link from "next/link";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { usePayments } from "@/hooks/use-payments";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/utils";

export default function PaymentsPage() {
  const { token } = useAuth();
  const { payments, isLoading, error, refetch } = usePayments(token);

  return (
    <div className="space-y-6">
      <Topbar title="Payments" subtitle="Monitor pembayaran cash dan QRIS manual dengan struktur yang lebih rapi dan akurat." />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#ead8c6] bg-gradient-to-br from-[#fff8ef] to-[#f3e1c7]">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/45">Gateway mode</p>
            <p className="mt-3 text-2xl font-semibold text-coffee-950">{payments[0]?.gatewayProvider?.toUpperCase() ?? "MANUAL /   CASH"}</p>
            <p className="mt-2 text-sm text-coffee-700/70"></p>
          </CardContent>
        </Card>
        <Card className="border-[#ead8c6] bg-white/80">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/45">Pending transactions</p>
            <p className="mt-3 text-2xl font-semibold text-coffee-950">{payments.filter((item) => item.status === "PENDING").length}</p>
            <p className="mt-2 text-sm text-coffee-700/70"></p>
          </CardContent>
        </Card>
        <Card className="border-[#ead8c6] bg-white/80">
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/45">Recorded volume</p>
            <p className="mt-3 text-2xl font-semibold text-coffee-950">{formatCurrency(payments.reduce((sum, item) => sum + Number(item.amount), 0))}</p>
            <p className="mt-2 text-sm text-coffee-700/70">Captured from the current transaction history in the database.</p>
          </CardContent>
        </Card>
      </div>

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
            render: (row) => formatPaymentMethod(row.method),
          },
          {
            key: "provider",
            header: "Provider",
            render: (row) => row.gatewayProvider || row.method.toLowerCase(),
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
            header: "Reference",
            render: (row) => row.transactionId || row.gatewayReference || "-",
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
        emptyMessage="Payment transactions will appear here after cashier checkout is completed."
      />
    </div>
  );
}
