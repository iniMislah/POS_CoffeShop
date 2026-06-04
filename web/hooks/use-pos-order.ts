"use client";

import { useMemo, useState } from "react";

import { apiClient } from "@/lib/api-client";
import type { Customer, Order, PaymentStatusResponse, PosProduct } from "@/lib/types";

export type PosCartItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  lineTotal: number;
  qty: number;
  note?: string;
  variantId?: string | null;
  variantName?: string | null;
  modifiers: Array<{
    id: string;
    name: string;
    price: number;
  }>;
};

type CheckoutResult = {
  order: Order;
  payment?: PaymentStatusResponse["payment"];
  receiptUrl?: string | null;
};

const DEFAULT_ORDER_TAX_AMOUNT = 0;
const DEFAULT_ORDER_SERVICE_AMOUNT = 0;

export function usePosOrder(token: string | null) {
  const [items, setItems] = useState<PosCartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.lineTotal, 0),
    [items],
  );
  const taxAmount = DEFAULT_ORDER_TAX_AMOUNT;
  const serviceAmount = DEFAULT_ORDER_SERVICE_AMOUNT;
  const totalAmount = subtotal + taxAmount + serviceAmount;

  const addToCart = (input: {
    product: PosProduct;
    variant?: PosProduct["variants"][number] | null;
    modifiers?: PosProduct["modifiers"];
    note?: string;
  }) => {
    const product = input.product;
    const variant = input.variant ?? null;
    const selectedModifiers = input.modifiers ?? [];
    const selectedModifierKey = [...selectedModifiers].map((modifier) => modifier.id).sort().join(",");
    const basePrice = Number(product.basePrice);
    const selectedVariantPrice = variant ? Number(variant.priceDelta) : 0;
    const selectedModifiersPrice = selectedModifiers.reduce((sum, modifier) => sum + Number(modifier.price), 0);
    const unitPrice = basePrice + selectedVariantPrice + selectedModifiersPrice;

    setItems((current) => {
      const existing = current.find(
        (item) =>
          item.productId === product.id &&
          item.variantId === variant?.id &&
          item.modifiers.map((modifier) => modifier.id).sort().join(",") === selectedModifierKey,
      );

      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                qty: item.qty + 1,
                lineTotal: item.unitPrice * (item.qty + 1),
              }
            : item,
        );
      }

      return [
        ...current,
        {
          id: globalThis.crypto?.randomUUID?.() ?? `${product.id}-${Date.now()}-${current.length + 1}`,
          productId: product.id,
          productName: product.name,
          unitPrice,
          lineTotal: unitPrice,
          qty: 1,
          note: input.note ?? "",
          variantId: variant?.id ?? null,
          variantName: variant?.name ?? null,
          modifiers: selectedModifiers,
        },
      ];
    });
  };

  const increaseQty = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              qty: item.qty + 1,
              lineTotal: item.unitPrice * (item.qty + 1),
            }
          : item,
      ),
    );
  };

  const decreaseQty = (id: string) => {
    setItems((current) =>
      current
        .map((item) =>
          item.id === id
            ? {
                ...item,
                qty: item.qty - 1,
                lineTotal: item.unitPrice * (item.qty - 1),
              }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const updateItemNote = (id: string, note: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, note } : item)));
  };

  const clearCart = () => {
    setItems([]);
    setSubmitError(null);
    setSuccessMessage(null);
  };

  const createAndCheckoutOrder = async (input: {
    paymentMethod: "cash" | "qris";
    amountReceived?: number;
    gatewayReference?: string;
    customer?: Customer | null;
  }): Promise<CheckoutResult> => {
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
      const order = await apiClient.post<Order>("/orders", {
        customerId: input.customer?.id ?? null,
      }, token);

      for (const item of items) {
        await apiClient.post<Order>(
          `/orders/${order.id}/items`,
          {
            productId: item.productId,
            variantId: item.variantId ?? null,
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

      if (input.paymentMethod === "cash") {
        const result = await apiClient.post<{
          transaction: PaymentStatusResponse["payment"];
          order: Order;
          receiptUrl: string;
        }>(
          `/payments/orders/${checkedOutOrder.id}/cash`,
          {
            amountReceived: input.amountReceived,
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
        order: Order;
        receiptUrl: string;
      }>(`/payments/orders/${checkedOutOrder.id}/qris`, {
        gatewayReference: input.gatewayReference || undefined,
      }, token);

      setLatestOrder(qrisResult.order);
      setSuccessMessage("QRIS manual payment recorded");

      return {
        order: qrisResult.order,
        payment: qrisResult.transaction,
        receiptUrl: qrisResult.receiptUrl,
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
    removeItem,
    updateItemNote,
    clearCart,
    createAndCheckoutOrder,
  };
}
