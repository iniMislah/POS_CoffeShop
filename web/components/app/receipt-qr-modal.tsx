"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { ReceiptQrResponse } from "@/lib/types";

export function ReceiptQrModal({
  open,
  onOpenChange,
  data,
  isLoading,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ReceiptQrResponse | null;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-[#ead9c7] bg-[#fffdf9]">
        <DialogTitle className="text-2xl font-semibold text-coffee-900">Digital Receipt QR</DialogTitle>
        <DialogDescription className="text-coffee-700/70">
          Scan QR ini untuk membuka struk digital pelanggan kapan saja.
        </DialogDescription>

        {isLoading ? (
          <div className="mt-4 h-72 animate-pulse rounded-[28px] bg-[#f6ede3]" />
        ) : error ? (
          <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : data ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-[28px] border border-coffee-100 bg-white p-5 shadow-[0_20px_40px_rgba(58,35,22,0.08)]">
              <div className="grid place-items-center rounded-[24px] bg-[#fcf7f0] p-4">
                <img src={data.qrCodeDataUrl} alt={`QR receipt ${data.invoiceNumber}`} className="h-64 w-64 rounded-2xl" />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm font-semibold text-coffee-900">{data.invoiceNumber}</p>
                <p className="mt-1 break-all text-xs text-coffee-700/65">{data.receiptUrl}</p>
              </div>
            </div>
            <div className="flex gap-3">
              {data.receiptToken ? (
                <Link href={`/receipt/${data.receiptToken}`} className="flex-1">
                  <Button className="w-full" variant="secondary">View Receipt</Button>
                </Link>
              ) : (
                <div className="flex-1">
                  <Button className="w-full" variant="secondary" disabled>View Receipt</Button>
                </div>
              )}
              <a href={data.pdfUrl} target="_blank" rel="noreferrer" className="flex-1">
                <Button className="w-full">Download PDF</Button>
              </a>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
