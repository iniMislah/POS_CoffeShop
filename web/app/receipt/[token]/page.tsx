"use client";

import { useParams } from "next/navigation";

import { ReceiptCard } from "@/components/app/receipt-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReceipt } from "@/hooks/use-receipt";

export default function PublicReceiptPage() {
  const params = useParams<{ token: string }>();
  const receiptToken = Array.isArray(params.token) ? params.token[0] : params.token || "";
  const { receipt, isLoading, error, refetch } = useReceipt(receiptToken);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#fffdf9] via-[#fbf5eb] to-[#f4e6d5] px-4 py-12">
      <div className="w-full max-w-2xl space-y-6 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-coffee-700/45">Customer Receipt</p>
          <h1 className="mt-2 text-4xl font-semibold text-coffee-900">Payment Receipt</h1>
          <p className="mt-2 text-sm text-coffee-700/70">Public digital receipt page loaded from the Express backend by receipt token.</p>
        </div>

        {isLoading ? (
          <div className="h-[420px] animate-pulse rounded-[32px] bg-white/70 shadow-soft" />
        ) : error ? (
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="text-sm text-rose-700">{error}</p>
              <Button variant="secondary" onClick={() => void refetch()}>Retry Receipt</Button>
            </CardContent>
          </Card>
        ) : receipt ? (
          <ReceiptCard
            storeName="Kopi Kita Signature"
            invoiceNumber={receipt.invoiceNumber}
            date={receipt.paidAt || new Date().toISOString()}
            items={receipt.items.map((item) => ({
              name: item.variantNameSnapshot ? `${item.productNameSnapshot} - ${item.variantNameSnapshot}` : item.productNameSnapshot,
              qty: item.qty,
              price: Number(item.unitPrice),
            }))}
            subtotal={Number(receipt.subtotal)}
            tax={Number(receipt.taxAmount)}
            service={Number(receipt.serviceAmount)}
            total={Number(receipt.totalAmount)}
            paymentMethod={receipt.payments[0]?.method ?? "-"}
            status={receipt.payments[0]?.status ?? "PAID"}
          />
        ) : (
          <Card>
            <CardContent className="space-y-3 pt-6">
              <p className="text-lg font-semibold text-coffee-900">Receipt not available</p>
              <p className="text-sm text-coffee-700/70">Please check the token or open the latest receipt link from the cashier app.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
