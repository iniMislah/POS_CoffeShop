"use client";

import { Minus, Plus, StickyNote } from "lucide-react";

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
  modifiers: Array<{ id?: string; name?: string; modifierNameSnapshot?: string }>;
  note?: string;
  variantName?: string | null;
};

export function CartPanel({
  items,
  onIncrease,
  onDecrease,
  onCheckout,
  isCheckoutDisabled,
  feedback,
}: {
  items: CartItem[];
  onIncrease: (id: string) => void;
  onDecrease: (id: string) => void;
  onCheckout: () => void;
  isCheckoutDisabled?: boolean;
  feedback?: {
    type: "error" | "success" | "info";
    message: string;
  } | null;
}) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * 0.1;
  const service = subtotal * 0.05;
  const total = subtotal + tax + service;

  return (
    <Card className="sticky top-6 h-fit bg-[#fffaf4]">
      <CardHeader>
        <CardTitle className="text-2xl">Current Cart</CardTitle>
        <p className="text-sm text-coffee-700/65">Quick note, modifiers, and instant checkout flow.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-coffee-200/50 bg-white p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-coffee-900">{item.name}</h4>
                  <p className="text-sm text-coffee-700/60">{formatCurrency(item.price)}</p>
                  {item.variantName ? <p className="text-xs text-coffee-700/45">{item.variantName}</p> : null}
                </div>
                <div className="flex items-center gap-2 rounded-full bg-cream-50 p-1">
                  <button className="rounded-full p-2 text-coffee-700 hover:bg-white" onClick={() => onDecrease(item.id)}>
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button className="rounded-full p-2 text-coffee-700 hover:bg-white" onClick={() => onIncrease(item.id)}>
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.modifiers.map((modifier) => (
                  <span key={modifier.id || modifier.modifierNameSnapshot || modifier.name} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-coffee-700">
                    {modifier.name || modifier.modifierNameSnapshot}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-coffee-700/55">
                  <StickyNote className="h-3.5 w-3.5" /> Notes
                </label>
                <Textarea defaultValue={item.note} className="min-h-[72px] resize-none bg-cream-50" />
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between text-sm text-coffee-700/70">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-coffee-700/70">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-coffee-700/70">
            <span>Service</span>
            <span>{formatCurrency(service)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-coffee-100 pt-3 text-base font-semibold text-coffee-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {feedback ? (
          <div className={`rounded-2xl px-4 py-3 text-sm ${
            feedback.type === "error"
              ? "bg-rose-50 text-rose-700"
              : feedback.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-cream-50 text-coffee-700"
          }`}>
            {feedback.message}
          </div>
        ) : null}

        <Button className="w-full" size="lg" onClick={onCheckout} disabled={isCheckoutDisabled || items.length === 0}>
          {isCheckoutDisabled ? "Processing..." : "Proceed to Checkout"}
        </Button>
      </CardContent>
    </Card>
  );
}
