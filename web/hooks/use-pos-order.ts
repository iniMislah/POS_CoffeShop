"use client";

import { useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Modifier, Order, Product, ProductVariant, PaymentStatusResponse } from "@/lib/types";

export type PosCartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  variant?: ProductVariant | null;
  modifiers: Modifier[];
};

type CheckoutResult = {
  order: Order;
  payment?: PaymentStatusResponse["payment"];
  receiptUrl?: string | null;
  qrString?: string | null;
  expiredAt?: string | null;
  gatewayReference?: string | null;
};

const TAX_RATE = 0.1;
const SERVICE_RATE = 0.05;

export function usePosOrder(token: string | null) {
  const [items, setItems] = useState<PosCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.qty * item.price, 0),
    [items],
  );
  const taxAmount = subtotal * TAX_RATE;
  const serviceAmount = subtotal * SERVICE_RATE;
  const totalAmount = subtotal + taxAmount + serviceAmount;

  const addToCart = (product: Product) => {
    const variant = product.variants[0] ?? null;
    const selectedModifiers = product.modifiers.slice(0, 1);
    const price =
      Number(product.basePrice) +
      Number(variant?.priceDelta ?? 0) +
      selectedModifiers.reduce((sum, modifier) => sum + Number(modifier.price), 0);

    setItems((current) => {
      const existing = current.find(
        (item) =>
          item.productId === product.id &&
          item.variant?.id === variant?.id &&
          item.modifiers.map((modifier) => modifier.id).join(",") === selectedModifiers.map((modifier) => modifier.id).join(","),
      );

      if (existing) {
        return current.map((item) => (item.id === existing.id ? { ...item, qty: item.qty + 1 } : item));
      }

      return [
        ...current,
        {
          id: `${product.id}-${current.length + 1}`,
          productId: product.id,
          name: product.name,
          price,
          qty: 1,
          note: "",
          variant,
          modifiers: selectedModifiers,
        },
      ];
    });
  };

  const increaseQty = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item)));
  };

  const decreaseQty = (id: string) => {
    setItems((current) =>
      current
        .map((item) => (item.id === id ? { ...item, qty: item.qty - 1 } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const clearCart = () => {
    setItems([]);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const createAndCheckoutOrder = async (paymentMethod: "cash" | "qris", amountReceived?: number): Promise<CheckoutResult> => {
    if (!token) {
      throw new Error("Missing auth token");
    }

    if (items.length === 0) {
      throw new Error("Cart is empty");
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const order = await apiClient.post<Order>("/orders", {}, token);

      for (const item of items) {
        await apiClient.post<Order>(
          `/orders/${order.id}/items`,
          {
            productId: item.productId,
            variantId: item.variant?.id ?? null,
            modifierIds: item.modifiers.map((modifier) => modifier.id),
            qty: item.qty,
            notes: item.note || null,
          },
          token,
        );
      }

      const checkedOutOrder = await apiClient.post<Order>(
        `/orders/${order.id}/checkout`,
        {
          taxAmount,
          serviceAmount,
        },
        token,
      );

      setLatestOrder(checkedOutOrder);

      if (paymentMethod === "cash") {
        const result = await apiClient.post<{
          transaction: PaymentStatusResponse["payment"];
          order: Order;
          receiptUrl: string;
        }>(
          `/payments/orders/${checkedOutOrder.id}/cash`,
          {
            amountReceived,
          },
          token,
        );

        setLatestOrder(result.order);
        setSuccessMessage("Cash payment completed");

        return {
          order: result.order,
          payment: result.transaction,
          receiptUrl: result.receiptUrl,
        };
      }

      const qrisResult = await apiClient.post<{
        transaction: PaymentStatusResponse["payment"];
        qrString: string;
        gatewayReference: string;
        expiredAt: string;
      }>(`/payments/orders/${checkedOutOrder.id}/qris`, {}, token);

      setSuccessMessage("QRIS payment created");

      return {
        order: checkedOutOrder,
        payment: qrisResult.transaction,
        qrString: qrisResult.qrString,
        expiredAt: qrisResult.expiredAt,
        gatewayReference: qrisResult.gatewayReference,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Order processing failed";
      setSubmitError(message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    subtotal,
    taxAmount,
    serviceAmount,
    totalAmount,
    isSubmitting,
    submitError,
    successMessage,
    latestOrder,
    addToCart,
    increaseQty,
    decreaseQty,
    clearCart,
    createAndCheckoutOrder,
  };
}
