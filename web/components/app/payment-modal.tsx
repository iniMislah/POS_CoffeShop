"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, QrCode } from "lucide-react";

import { WhatsAppReceiptButton } from "@/components/app/whatsapp-receipt-button";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_ORIGIN } from "@/lib/config";
import { extractReceiptToken, formatCurrency, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils";
import type { PaymentStatusResponse, ReceiptQrResponse } from "@/lib/types";

export function PaymentModal({
  open,
  onOpenChange,
  total,
  isProcessing,
  error,
  paymentStatus,
  receiptQrData,
  customerName,
  onCashSubmit,
  onQrisSubmit,
  onStartNewOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  isProcessing: boolean;
  error: string | null;
  paymentStatus: {
    data: PaymentStatusResponse | null;
    isLoading: boolean;
    error: string | null;
  };
  receiptQrData: ReceiptQrResponse | null;
  customerName: string;
  onCashSubmit: (amountReceived: number) => Promise<void>;
  onQrisSubmit: (gatewayReference: string) => Promise<void>;
  onStartNewOrder: () => void;
}) {
  const [amountReceived, setAmountReceived] = useState(total);
  const [gatewayReference, setGatewayReference] = useState("");

  useEffect(() => {
    if (!open) {
      setAmountReceived(total);
      setGatewayReference("");
      return;
    }
  }, [open, total]);

  const change = useMemo(() => Math.max(amountReceived - total, 0), [amountReceived, total]);
  const payment = paymentStatus.data?.payment;
  const order = paymentStatus.data?.order;
  const isPaid = payment?.status === "PAID" || order?.paymentStatus === "PAID";
  const receiptToken = extractReceiptToken(paymentStatus.data?.receiptUrl || order?.receiptToken || null);
  const effectiveError = error || paymentStatus.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-4xl overflow-y-auto p-4 sm:p-6">
        {isPaid ? (
          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr] md:gap-6">
            <div className="rounded-[22px] bg-gradient-to-br from-white to-cream-100 p-4 sm:rounded-[28px] sm:p-8">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="h-6 w-6 shrink-0 sm:h-8 sm:w-8" />
                <div>
                  <DialogTitle className="text-xl font-semibold text-coffee-900 sm:text-3xl">Payment Successful</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-coffee-700/70 sm:text-base">
                    Transaksi selesai dan receipt digital siap ditunjukkan ke customer.
                  </DialogDescription>
                </div>
              </div>
              <div className="mt-4 rounded-[20px] bg-white/70 p-4 text-sm text-coffee-800 sm:mt-6 sm:rounded-[24px] sm:p-5">
                <p>Invoice: {order?.invoiceNumber ?? "-"}</p>
                <p className="mt-2">Customer: {customerName}</p>
                <p className="mt-2">Payment: {formatPaymentMethod(payment?.method ?? order?.paymentTransactions?.[0]?.method ?? "-")}</p>
                <p className="mt-2">Status: {formatPaymentStatus(order?.paymentStatus ?? payment?.status ?? "-")}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 sm:mt-8 sm:gap-3">
                <Button onClick={onStartNewOrder}>New Order</Button>
                {receiptToken ? (
                  <Link href={`/receipt/${receiptToken}`}>
                    <Button variant="secondary">View Receipt</Button>
                  </Link>
                ) : null}
                {receiptToken && order ? (
                  <WhatsAppReceiptButton
                    size="default"
                    order={{
                      invoiceNumber: order.invoiceNumber,
                      totalAmount: order.totalAmount,
                      receiptToken,
                      receiptUrl: paymentStatus.data?.receiptUrl ?? undefined,
                      pdfUrl: `${API_ORIGIN}/api/receipts/${receiptToken}/pdf`,
                      customerPhone: order.customer?.phone,
                    }}
                  />
                ) : null}
              </div>
            </div>
            <div className="rounded-[22px] bg-coffee-900 p-4 text-white sm:rounded-[28px] sm:p-8">
              <p className="text-xs uppercase tracking-[0.16em] text-white/60 sm:text-sm sm:tracking-[0.18em]">Receipt QR</p>
              <div className="mt-4 rounded-[20px] bg-white p-4 text-coffee-900 sm:mt-5 sm:rounded-[24px] sm:p-5">
                <div className="grid aspect-square place-items-center rounded-[20px] border-2 border-dashed border-coffee-300 bg-cream-50">
                  {receiptQrData?.qrCodeDataUrl ? (
                    <img src={receiptQrData.qrCodeDataUrl} alt={`Receipt QR ${receiptQrData.invoiceNumber}`} className="h-full w-full rounded-[18px] object-contain" />
                  ) : (
                    <QrCode className="h-24 w-24" />
                  )}
                </div>
              </div>
              {receiptQrData?.receiptUrl ? (
                <p className="mt-4 break-all text-xs text-white/75">{receiptQrData.receiptUrl}</p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <DialogTitle className="pr-9 text-2xl font-semibold text-coffee-900 sm:text-3xl">Checkout Payment</DialogTitle>
            <DialogDescription className="mt-1 pr-6 text-sm text-coffee-700/70">
              Pilih metode pembayaran, cek total, lalu selesaikan order.
            </DialogDescription>
            {effectiveError ? (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{effectiveError}</div>
            ) : null}
            <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr] sm:mt-6 sm:gap-6">
              <div className="rounded-[22px] bg-coffee-900 p-4 text-white sm:rounded-[28px] sm:p-6">
                <p className="text-xs uppercase tracking-[0.16em] text-white/60 sm:text-sm sm:tracking-[0.18em]">Amount Due</p>
                <p className="mt-2 text-3xl font-semibold leading-tight sm:mt-3 sm:text-4xl">{formatCurrency(total)}</p>
                <div className="mt-4 rounded-[20px] bg-white/10 p-4 text-sm text-white/80 sm:mt-8 sm:rounded-[24px]">
                  <p>Invoice: {order?.invoiceNumber ?? "Creating draft order..."}</p>
                  <p className="mt-2">Customer: {customerName}</p>
                  <p className="mt-2">Cashier: {order?.cashier?.name ?? "Active cashier"}</p>
                </div>
              </div>
              <div>
                <Tabs defaultValue="cash">
                  <TabsList>
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="qris">QRIS Manual</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cash">
                    <div className="space-y-4 rounded-[22px] border border-coffee-100 bg-white p-4 sm:space-y-5 sm:rounded-[28px] sm:p-6">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-coffee-900">Amount Received</label>
                        <Input type="number" value={amountReceived} onChange={(event) => setAmountReceived(Number(event.target.value))} />
                      </div>
                      <div className="rounded-2xl bg-cream-50 p-4">
                        <div className="flex items-center justify-between text-sm text-coffee-700/70">
                          <span>Total</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-base font-semibold text-coffee-900">
                          <span>Change</span>
                          <span>{formatCurrency(change)}</span>
                        </div>
                      </div>
                      <Button className="w-full" onClick={() => void onCashSubmit(amountReceived)} disabled={isProcessing || amountReceived < total}>
                        {isProcessing ? "Completing Payment..." : "Complete Cash Payment"}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="qris">
                    <div className="space-y-4 rounded-[22px] border border-coffee-100 bg-white p-4 sm:space-y-5 sm:rounded-[28px] sm:p-6">
                      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Pastikan pembayaran QRIS sudah masuk di aplikasi merchant sebelum menyelesaikan transaksi.
                      </div>
                      <div className="rounded-2xl bg-[#fcf7f0] p-4 text-sm text-coffee-700/70">
                        Metode ini dipakai untuk barcode fisik atau QRIS eksternal. Sistem hanya mencatat transaksi sebagai <strong>QRIS Manual</strong>, tanpa Snap token dan tanpa gateway response.
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-coffee-900">Reference (optional)</label>
                        <Input
                          value={gatewayReference}
                          onChange={(event) => setGatewayReference(event.target.value)}
                          placeholder="Contoh: ref mutasi / no. approval"
                        />
                      </div>
                      <Button className="w-full" onClick={() => void onQrisSubmit(gatewayReference)} disabled={isProcessing}>
                        {isProcessing ? "Recording Payment..." : "Confirm QRIS Manual Payment"}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
