"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, QrCode, RefreshCcw, ScanLine } from "lucide-react";

import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { extractReceiptToken, formatCurrency } from "@/lib/utils";
import type { PaymentStatusResponse } from "@/lib/types";

export function PaymentModal({
  open,
  onOpenChange,
  total,
  isProcessing,
  error,
  qrisPayment,
  paymentStatus,
  onCashSubmit,
  onQrisSubmit,
  onRefreshStatus,
  onStartNewOrder,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  isProcessing: boolean;
  error: string | null;
  qrisPayment: {
    qrString: string | null;
    gatewayReference: string | null;
  } | null;
  paymentStatus: {
    data: PaymentStatusResponse | null;
    isLoading: boolean;
    error: string | null;
    expiresInMs: number | null;
  };
  onCashSubmit: (amountReceived: number) => Promise<void>;
  onQrisSubmit: () => Promise<void>;
  onRefreshStatus: () => Promise<void>;
  onStartNewOrder: () => void;
}) {
  const [amountReceived, setAmountReceived] = useState(total);

  useEffect(() => {
    if (!open) {
      setAmountReceived(total);
      return;
    }
  }, [open, total]);

  const change = useMemo(() => Math.max(amountReceived - total, 0), [amountReceived, total]);
  const secondsLeft = Math.max(Math.floor((paymentStatus.expiresInMs ?? 0) / 1000), 0);
  const countdown = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;
  const payment = paymentStatus.data?.payment;
  const order = paymentStatus.data?.order;
  const isPaid = payment?.status === "PAID" || order?.paymentStatus === "PAID";
  const receiptToken = extractReceiptToken(paymentStatus.data?.receiptUrl || order?.receiptToken || null);
  const effectiveError = error || paymentStatus.error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        {isPaid ? (
          <div className="grid gap-6 md:grid-cols-[1.3fr_0.7fr]">
            <div className="rounded-[28px] bg-gradient-to-br from-white to-cream-100 p-8">
              <div className="flex items-center gap-3 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
                <div>
                  <DialogTitle className="text-3xl font-semibold text-coffee-900">Payment Successful</DialogTitle>
                  <DialogDescription className="mt-1 text-base text-coffee-700/70">
                    Order has been paid and digital receipt is ready for customer access.
                  </DialogDescription>
                </div>
              </div>
              <div className="mt-8 flex gap-3">
                <Button onClick={onStartNewOrder}>New Order</Button>
                {receiptToken ? (
                  <Link href={`/receipt/${receiptToken}`}>
                    <Button variant="secondary">View Receipt</Button>
                  </Link>
                ) : null}
              </div>
            </div>
            <div className="rounded-[28px] bg-coffee-900 p-8 text-white">
              <p className="text-sm uppercase tracking-[0.18em] text-white/60">Receipt QR</p>
              <div className="mt-5 rounded-[24px] bg-white p-5 text-coffee-900">
                <div className="grid aspect-square place-items-center rounded-[20px] border-2 border-dashed border-coffee-300 bg-cream-50">
                  <QrCode className="h-24 w-24" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <DialogTitle className="text-3xl font-semibold text-coffee-900">Checkout Payment</DialogTitle>
            <DialogDescription className="mt-1 text-coffee-700/70">
              Choose payment method, review totals, and finish the current order.
            </DialogDescription>
            {effectiveError ? (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{effectiveError}</div>
            ) : null}
            <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-[28px] bg-coffee-900 p-6 text-white">
                <p className="text-sm uppercase tracking-[0.18em] text-white/60">Amount Due</p>
                <p className="mt-3 text-4xl font-semibold">{formatCurrency(total)}</p>
                <div className="mt-8 rounded-[24px] bg-white/10 p-4 text-sm text-white/80">
                  <p>Invoice: {order?.invoiceNumber ?? "Creating draft order..."}</p>
                  <p className="mt-2">Cashier: {order?.cashier?.name ?? "Active cashier"}</p>
                </div>
              </div>
              <div>
                <Tabs defaultValue="cash">
                  <TabsList>
                    <TabsTrigger value="cash">Cash</TabsTrigger>
                    <TabsTrigger value="qris">QRIS</TabsTrigger>
                  </TabsList>
                  <TabsContent value="cash">
                    <div className="space-y-5 rounded-[28px] border border-coffee-100 bg-white p-6">
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
                        {isProcessing ? "Completing Payment..." : "Complete Payment"}
                      </Button>
                    </div>
                  </TabsContent>
                  <TabsContent value="qris">
                    <div className="space-y-5 rounded-[28px] border border-coffee-100 bg-white p-6">
                      <div className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
                        <div className="grid aspect-square place-items-center rounded-[28px] border-2 border-dashed border-coffee-300 bg-cream-50">
                          {qrisPayment?.qrString ? (
                            <div className="space-y-4 px-6 text-center">
                              <QrCode className="mx-auto h-24 w-24 text-coffee-700" />
                              <p className="line-clamp-4 text-xs text-coffee-700/60">{qrisPayment.qrString}</p>
                            </div>
                          ) : (
                            <ScanLine className="h-24 w-24 text-coffee-700" />
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="rounded-2xl bg-cream-50 px-4 py-3 text-sm text-coffee-700">
                            <div className="flex items-center justify-between gap-3">
                              <span>Payment status</span>
                              <StatusBadge value={(payment?.status || "pending").toLowerCase()} />
                            </div>
                          </div>
                          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            {qrisPayment?.gatewayReference
                              ? "Waiting for customer to complete QRIS scan. Status will update automatically while polling."
                              : "Create QRIS payment to show mock QR string and start status polling."}
                          </div>
                          <div className="rounded-2xl bg-cream-50 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-coffee-700/50">Expires In</p>
                            <p className="mt-2 text-3xl font-semibold text-coffee-900">{countdown}</p>
                          </div>
                          <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => void onRefreshStatus()} disabled={!qrisPayment?.gatewayReference || paymentStatus.isLoading}>
                              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh Status
                            </Button>
                            <Button className="flex-1" onClick={() => void onQrisSubmit()} disabled={isProcessing || Boolean(qrisPayment?.gatewayReference)}>
                              {qrisPayment?.gatewayReference ? "QRIS Created" : isProcessing ? "Creating QRIS..." : "Create QRIS"}
                            </Button>
                          </div>
                          {qrisPayment?.gatewayReference ? (
                            <p className="text-xs text-coffee-700/50">Reference: {qrisPayment.gatewayReference}</p>
                          ) : null}
                        </div>
                      </div>
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
