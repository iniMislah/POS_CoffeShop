"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { DataTable } from "@/components/app/data-table";
import { ReceiptCard } from "@/components/app/receipt-card";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useTransactions } from "@/hooks/use-transactions";
import type { Order } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function TransactionsPage() {
  const { token } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [status, setStatus] = useState("all");

  const { transactions, isLoading, error, refetch } = useTransactions(token, {
    date,
    paymentMethod,
    status,
  });

  const detailReceipt = useMemo(() => {
    if (!selectedOrder) {
      return null;
    }

    const latestPayment = selectedOrder.paymentTransactions[0];

    return {
      storeName: "Kopi Kita Signature",
      invoiceNumber: selectedOrder.invoiceNumber,
      date: selectedOrder.paidAt || selectedOrder.createdAt,
      items: selectedOrder.orderItems.map((item) => ({
        name: item.variantNameSnapshot ? `${item.productNameSnapshot} - ${item.variantNameSnapshot}` : item.productNameSnapshot,
        qty: item.qty,
        price: Number(item.unitPrice),
      })),
      subtotal: Number(selectedOrder.subtotal),
      tax: Number(selectedOrder.taxAmount),
      service: Number(selectedOrder.serviceAmount),
      total: Number(selectedOrder.totalAmount),
      paymentMethod: latestPayment?.method || "-",
      status: selectedOrder.paymentStatus,
    };
  }, [selectedOrder]);

  return (
    <div className="space-y-6">
      <Topbar title="Transactions" subtitle="Inspect live transaction activity, payment methods, and digital receipt access history." />
      <div className="grid gap-4 md:grid-cols-3">
        <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
          <option value="all">All Payment Methods</option>
          <option value="cash">Cash</option>
          <option value="qris">QRIS</option>
        </Select>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending_payment">Pending Payment</option>
          <option value="paid">Paid</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-[24px] bg-white/60 shadow-soft" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 pt-6">
            <p className="text-sm text-rose-700">{error}</p>
            <Button variant="secondary" onClick={() => void refetch()}>Retry</Button>
          </CardContent>
        </Card>
      ) : transactions.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-lg font-semibold text-coffee-900">No transactions yet</p>
            <p className="text-sm text-coffee-700/70">Completed orders will appear here for receipt review and cashier audit.</p>
          </CardContent>
        </Card>
      ) : (
        <DataTable
          columns={[
            { key: "invoice", header: "Invoice", render: (row) => row.invoiceNumber },
            { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) },
            { key: "cashier", header: "Cashier", render: (row) => row.cashier?.name || "-" },
            { key: "method", header: "Method", render: (row) => row.paymentTransactions[0]?.method || "-" },
            { key: "total", header: "Total", render: (row) => formatCurrency(Number(row.totalAmount)) },
            { key: "status", header: "Order Status", render: (row) => <StatusBadge value={row.status.toLowerCase()} /> },
            { key: "paymentStatus", header: "Payment", render: (row) => <StatusBadge value={row.paymentStatus.toLowerCase()} /> },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(row)}>View Detail</Button>
                  {row.receiptToken ? (
                    <Link href={`/receipt/${row.receiptToken}`}>
                      <Button variant="secondary" size="sm">View Receipt</Button>
                    </Link>
                  ) : (
                    <Button variant="secondary" size="sm" disabled>
                      No Receipt
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
          data={transactions}
        />
      )}

      <Dialog open={Boolean(selectedOrder)} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="text-2xl font-semibold text-coffee-900">Transaction Detail</DialogTitle>
          {detailReceipt ? <ReceiptCard {...detailReceipt} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
