"use client";

import type { ReactNode } from "react";
import { Minus, Plus, StickyNote, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/utils";

export type CartItem = {
  id: string;
  productId?: string;
  name: string;
  qty: number;
  price: number;
  modifiers: Array<{ id?: string; name?: string; modifierNameSnapshot?: string; price?: number | string }>;
  note?: string;
  variantName?: string | null;
};

export function CartPanel({
  items,
  onIncrease,
  onDecrease,
  onRemove,
  onNoteChange,
  onCheckout,
  isCheckoutDisabled,
  feedback,
  topContent,
}: {
  items: CartItem[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onRemove: (id: string) => void;
  onNoteChange: (id: string, note: string) => void;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
  feedback?: {
    type: "error" | "success" | "info";
    message: string;
  } | null;
  topContent?: ReactNode;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = 0;
  const service = 0;
  const total = subtotal + tax + service;

  return (
    <Card className="h-fit overflow-hidden border-[#E8D8C3]/75 bg-white xl:sticky xl:top-6">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#5A4032]/46">Order summary</p>
            <CardTitle className="mt-2 text-2xl">Current Cart</CardTitle>
          </div>
          <div className="rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/46">Items</p>
            <p className="mt-1 text-xl font-semibold text-[#5A4032]">{items.reduce((sum, item) => sum + item.qty, 0)}</p>
          </div>
        </div>
        <p className="text-sm text-[#5A4032]/65">Ringkas, cepat, dan siap checkout.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {topContent}
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#E8D8C3] bg-[#FDFBF7] p-6 text-center">
              <p className="text-lg font-semibold text-[#5A4032]">Cart is still empty</p>
              <p className="mt-2 text-sm text-[#5A4032]/65">Pick drinks or snacks from the menu list to start a new order.</p>
            </div>
          ) : null}
          {items.map((item) => (
            <div key={item.id} className="rounded-[20px] border border-[#E8D8C3]/75 bg-[#FDFBF7] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-[#5A4032]">{item.name}</h4>
                  <p className="mt-1 text-sm text-[#5A4032]/60">Unit price {formatCurrency(item.price)}</p>
                  {item.variantName ? <p className="mt-1 text-xs font-medium text-[#5A4032]/55">Option: {item.variantName}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 rounded-full border border-[#E8D8C3] bg-white p-1">
                    <button className="rounded-full p-2 text-[#5A4032] hover:bg-[#FDFBF7]" onClick={() => onDecrease(item.id)}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button className="rounded-full p-2 text-[#5A4032] hover:bg-[#FDFBF7]" onClick={() => onIncrease(item.id)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="rounded-full bg-rose-50 p-2 text-rose-600 transition hover:bg-rose-100" onClick={() => onRemove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5A4032]/50">Modifiers</p>
                  {item.modifiers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {item.modifiers.map((modifier) => (
                        <span key={modifier.id || modifier.modifierNameSnapshot || modifier.name} className="rounded-full border border-[#E8D8C3] bg-white px-3 py-1 text-xs text-[#5A4032]">
                          {modifier.name || modifier.modifierNameSnapshot}
                          {Number(modifier.price ?? 0) > 0 ? ` - ${formatCurrency(Number(modifier.price))}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-[#5A4032]/55">No modifiers selected</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#5A4032]/50">Line total</p>
                  <p className="mt-1 text-base font-semibold text-[#5A4032]">{formatCurrency(item.qty * item.price)}</p>
                </div>
              </div>
              <div className="mt-3">
                <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#5A4032]/55">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </label>
                <Textarea
                  value={item.note ?? ""}
                  onChange={(event) => onNoteChange(item.id, event.target.value)}
                  className="min-h-[64px] resize-none bg-white"
                  placeholder="Less sugar, extra hot, no straw..."
                />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-[20px] border border-[#E8D8C3] bg-[#FDFBF7] p-4">
          <div className="rounded-2xl border border-[#E8D8C3]/70 bg-white p-3">
            <p className="text-xs uppercase tracking-[0.16em] text-[#5A4032]/50">Subtotal</p>
            <p className="mt-2 text-lg font-semibold text-[#5A4032]">{formatCurrency(subtotal)}</p>
          </div>
          <div className="flex items-center justify-between border-t border-[#E8D8C3] pt-3 text-lg font-semibold text-[#5A4032]">
            <span>Total payment</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl px-4 py-3 text-sm ${
              feedback.type === "error"
                ? "bg-rose-50 text-rose-700"
                : feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-[#FDFBF7] text-[#5A4032]"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        <Button className="w-full" size="lg" onClick={onCheckout} disabled={isCheckoutDisabled || items.length === 0}>
          {isCheckoutDisabled ? "Processing..." : "Proceed to Payment"}
        </Button>
      </CardContent>
    </Card>
  );
}
