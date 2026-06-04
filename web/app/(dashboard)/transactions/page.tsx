"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Download, QrCode } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { ReceiptCard } from "@/components/app/receipt-card";
import { ReceiptQrModal } from "@/components/app/receipt-qr-modal";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { WhatsAppReceiptButton } from "@/components/app/whatsapp-receipt-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTransactions } from "@/hooks/use-transactions";
import { apiClient } from "@/lib/api-client";
import { API_ORIGIN } from "@/lib/config";
import type { Order, ReceiptQrResponse } from "@/lib/types";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/utils";

const getDisplayTotal = (order: Order) => Number(order.subtotal) + Number(order.serviceAmount);

const getReceiptShareOrder = (order: Order) => ({
  invoiceNumber: order.invoiceNumber,
  totalAmount: getDisplayTotal(order),
  receiptToken: order.receiptToken,
  pdfUrl: order.receiptToken ? `${API_ORIGIN}/api/receipts/${order.receiptToken}/pdf` : null,
  customerPhone: order.customer?.phone,
});

export default function TransactionsPage() {
  const { token, user } = useAuth();
  const { pushToast } = useToast();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [status, setStatus] = useState("all");
  const [receiptQrOpen, setReceiptQrOpen] = useState(false);
  const [receiptQr, setReceiptQr] = useState<ReceiptQrResponse | null>(null);
  const [receiptQrError, setReceiptQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
        id: item.id,
        name: item.variantNameSnapshot ? `${item.productNameSnapshot} - ${item.variantNameSnapshot}` : item.productNameSnapshot,
        qty: item.qty,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal),
        notes: item.notes,
        modifiers: item.modifiers.map((modifier) => ({
          id: modifier.id,
          name: modifier.modifierNameSnapshot,
          price: Number(modifier.price),
        })),
      })),
      subtotal: Number(selectedOrder.subtotal),
      service: Number(selectedOrder.serviceAmount),
      total: getDisplayTotal(selectedOrder),
      paymentMethod: latestPayment?.method || "-",
      paymentStatus: selectedOrder.paymentStatus,
      cashierName: selectedOrder.cashier?.name ?? "-",
      customerName: selectedOrder.customerNameSnapshot ?? selectedOrder.customer?.name ?? "Walk-in Customer",
      amountReceived: latestPayment?.amountReceived ? Number(latestPayment.amountReceived) : null,
      changeAmount: latestPayment?.changeAmount ? Number(latestPayment.changeAmount) : null,
    };
  }, [selectedOrder]);

  const handleShowQr = async (order: Order) => {
    if (!token) {
      return;
    }

    setReceiptQrOpen(true);
    setIsQrLoading(true);
    setReceiptQrError(null);

    try {
      const result = await apiClient.get<ReceiptQrResponse>(`/orders/${order.id}/receipt-qr`, token);
      setReceiptQr(result);
    } catch (qrError) {
      setReceiptQr(null);
      setReceiptQrError(qrError instanceof Error ? qrError.message : "Unable to load receipt QR.");
    } finally {
      setIsQrLoading(false);
    }
  };

  const handleExport = async () => {
    if (!token) {
      return;
    }

    setIsExporting(true);
    const query = new URLSearchParams();
    if (date) {
      query.set("startDate", date);
      query.set("endDate", date);
    }

    try {
      const { blob, fileName } = await apiClient.download(`/reports/orders/export?${query.toString()}`, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast({ type: "success", title: "Export ready", description: `${fileName} downloaded.` });
    } catch (error) {
      pushToast({
        type: "error",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to export transactions.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Transactions" subtitle="Inspect live transaction activity, payment methods, and digital receipt access history." />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
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
        {user?.role === "ADMIN" ? (
          <Button onClick={() => void handleExport()} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" /> {isExporting ? "Exporting..." : "Export Excel"}
          </Button>
        ) : (
          <div />
        )}
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
            { key: "customer", header: "Customer", render: (row) => row.customerNameSnapshot ?? row.customer?.name ?? "Walk-in Customer" },
            { key: "cashier", header: "Cashier", render: (row) => row.cashier?.name || "-" },
            { key: "method", header: "Method", render: (row) => formatPaymentMethod(row.paymentTransactions[0]?.method || "-") },
            { key: "total", header: "Total", render: (row) => formatCurrency(getDisplayTotal(row)) },
            { key: "status", header: "Order Status", render: (row) => <StatusBadge value={row.status.toLowerCase()} /> },
            { key: "paymentStatus", header: "Payment", render: (row) => <StatusBadge value={row.paymentStatus.toLowerCase()} /> },
            {
              key: "actions",
              header: "Actions",
              render: (row) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedOrder(row)}>View Detail</Button>
                  {row.receiptToken ? (
                    <>
                      <Link href={`/receipt/${row.receiptToken}`}>
                        <Button variant="secondary" size="sm">View Receipt</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => void handleShowQr(row)}>
                        <QrCode className="mr-2 h-4 w-4" /> Show QR
                      </Button>
                      <WhatsAppReceiptButton order={getReceiptShareOrder(row)} />
                      <a href={`${API_ORIGIN}/api/receipts/${row.receiptToken}/pdf?download=true`} target="_blank" rel="noreferrer">
                        <Button size="sm">Download PDF</Button>
                      </a>
                    </>
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
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-0 bg-transparent p-0 pt-8 shadow-none">
          <DialogTitle className="mb-3 px-1 text-2xl font-semibold leading-none text-coffee-900">
            Transaction Detail
          </DialogTitle>
          {detailReceipt ? <ReceiptCard {...detailReceipt} /> : null}
          {selectedOrder?.receiptToken ? (
            <div className="flex flex-wrap justify-center gap-3">
              <WhatsAppReceiptButton size="default" order={getReceiptShareOrder(selectedOrder)} />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ReceiptQrModal
        open={receiptQrOpen}
        onOpenChange={setReceiptQrOpen}
        data={receiptQr}
        isLoading={isQrLoading}
        error={receiptQrError}
      />
    </div>
  );
}
