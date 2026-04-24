"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { CartPanel } from "@/components/app/cart-panel";
import { PaymentModal } from "@/components/app/payment-modal";
import { ProductCard } from "@/components/app/product-card";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { usePosOrder } from "@/hooks/use-pos-order";
import { useProducts } from "@/hooks/use-products";
import type { PaymentStatusResponse } from "@/lib/types";
import { extractReceiptToken } from "@/lib/utils";

export default function PosPage() {
  const { token } = useAuth();
  const { products, isLoading, error, refetch } = useProducts(token);
  const {
    items,
    totalAmount,
    isSubmitting,
    submitError,
    successMessage,
    addToCart,
    increaseQty,
    decreaseQty,
    clearCart,
    createAndCheckoutOrder,
  } = usePosOrder(token);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [qrisState, setQrisState] = useState<{
    orderId: string | null;
    qrString: string | null;
    gatewayReference: string | null;
  }>({
    orderId: null,
    qrString: null,
    gatewayReference: null,
  });
  const [paymentSeed, setPaymentSeed] = useState<PaymentStatusResponse | null>(null);

  const paymentStatus = usePaymentStatus({
    token,
    orderId: qrisState.orderId,
    enabled: checkoutOpen && Boolean(qrisState.orderId),
    initialData: paymentSeed,
  });

  const categories = useMemo(() => {
    return ["All", ...new Set(products.map((product) => product.category?.name ?? "Uncategorized"))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryName = product.category?.name ?? "Uncategorized";
      const matchesCategory = activeCategory === "All" || categoryName === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const handleCashSubmit = async (amountReceived: number) => {
    try {
      const result = await createAndCheckoutOrder("cash", amountReceived);
      setPaymentSeed({
        order: result.order,
        payment: result.payment ?? null,
        receiptUrl: result.receiptUrl ?? null,
      });
      setQrisState({
        orderId: result.order.id,
        qrString: null,
        gatewayReference: null,
      });
    } catch {
      return;
    }
  };

  const handleQrisSubmit = async () => {
    try {
      const result = await createAndCheckoutOrder("qris");
      setPaymentSeed({
        order: result.order,
        payment: result.payment ?? null,
        receiptUrl: result.receiptUrl ?? null,
      });
      setQrisState({
        orderId: result.order.id,
        qrString: result.qrString ?? null,
        gatewayReference: result.gatewayReference ?? null,
      });
    } catch {
      return;
    }
  };

  const handleNewOrder = () => {
    clearCart();
    setPaymentSeed(null);
    setQrisState({
      orderId: null,
      qrString: null,
      gatewayReference: null,
    });
    setCheckoutOpen(false);
  };

  const receiptToken = extractReceiptToken(paymentStatus.receiptUrl);

  return (
    <div className="space-y-6">
      <Topbar title="POS / Cashier" subtitle="Fast cashier workflow connected to live products, draft orders, and payment state polling." />
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button key={category} variant={activeCategory === category ? "default" : "secondary"} onClick={() => setActiveCategory(category)}>
                    {category}
                  </Button>
                ))}
              </div>
              <div className="w-full lg:w-[320px]">
                <Input placeholder="Search coffee, pastry, signature..." value={search} onChange={(event) => setSearch(event.target.value)} />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[320px] animate-pulse rounded-[28px] bg-white/60 shadow-soft" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <p className="text-sm text-rose-700">{error}</p>
                <Button variant="secondary" onClick={() => void refetch()}>Retry Load Products</Button>
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="space-y-3 pt-6">
                <p className="text-lg font-semibold text-coffee-900">No products found</p>
                <p className="text-sm text-coffee-700/70">Try a different keyword or switch category filter.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} disabled={isSubmitting} onAdd={addToCart} />
              ))}
            </div>
          )}
        </div>

        <CartPanel
          items={items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            qty: item.qty,
            price: item.price,
            note: item.note,
            variantName: item.variant?.name ?? null,
            modifiers: item.modifiers,
          }))}
          onIncrease={increaseQty}
          onDecrease={decreaseQty}
          onCheckout={() => setCheckoutOpen(true)}
          isCheckoutDisabled={isSubmitting}
          feedback={
            submitError
              ? { type: "error", message: submitError }
              : successMessage
                ? { type: "success", message: successMessage }
                : null
          }
        />
      </div>

      <PaymentModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        total={totalAmount}
        isProcessing={isSubmitting}
        error={submitError}
        qrisPayment={qrisState}
        paymentStatus={paymentStatus}
        onCashSubmit={handleCashSubmit}
        onQrisSubmit={handleQrisSubmit}
        onRefreshStatus={async () => {
          await paymentStatus.refresh();
        }}
        onStartNewOrder={handleNewOrder}
      />

      {receiptToken ? (
        <div className="flex justify-end">
          <Link href={`/receipt/${receiptToken}`}>
            <Button variant="outline">Open Latest Receipt</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
