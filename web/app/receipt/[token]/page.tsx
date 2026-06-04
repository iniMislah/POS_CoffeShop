"use client";

import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import { ReceiptCard } from "@/components/app/receipt-card";
import { WhatsAppReceiptButton } from "@/components/app/whatsapp-receipt-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useReceipt } from "@/hooks/use-receipt";

export default function PublicReceiptPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const receiptToken = Array.isArray(params.token) ? params.token[0] : params.token || "";
  const { receipt, isLoading, error, refetch } = useReceipt(receiptToken);
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/pos");
  };

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
          <div className="space-y-5">
            <ReceiptCard
              storeName="Kopi Kita Signature"
              invoiceNumber={receipt.invoiceNumber}
              date={receipt.paidAt || receipt.createdAt}
              cashierName={receipt.cashier?.name}
              customerName={receipt.customerName}
              items={receipt.items.map((item) => ({
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
              }))}
              subtotal={Number(receipt.subtotal)}
              service={Number(receipt.serviceAmount)}
              total={Number(receipt.totalAmount)}
              paymentMethod={receipt.payment?.method ?? "-"}
              paymentStatus={receipt.payment?.status ?? receipt.paymentStatus}
              amountReceived={receipt.payment?.amountReceived ? Number(receipt.payment.amountReceived) : null}
              changeAmount={receipt.payment?.changeAmount ? Number(receipt.payment.changeAmount) : null}
            />
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={handleBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <WhatsAppReceiptButton
                size="default"
                order={{
                  invoiceNumber: receipt.invoiceNumber,
                  totalAmount: receipt.totalAmount,
                  receiptToken,
                  receiptUrl: receipt.receiptUrl,
                  pdfUrl: receipt.pdfUrl,
                }}
              />
              <a href={`${receipt.pdfUrl}?download=true`} target="_blank" rel="noreferrer">
                <Button>Download PDF</Button>
              </a>
            </div>
          </div>
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
