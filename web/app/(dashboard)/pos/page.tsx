"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CartPanel } from "@/components/app/cart-panel";
import { CustomerSelector } from "@/components/app/customer-selector";
import { PaymentModal } from "@/components/app/payment-modal";
import { ProductCard } from "@/components/app/product-card";
import { ProductOptionModal } from "@/components/app/product-option-modal";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { usePaymentStatus } from "@/hooks/use-payment-status";
import { usePosOrder } from "@/hooks/use-pos-order";
import { useProducts } from "@/hooks/use-products";
import { apiClient } from "@/lib/api-client";
import type { Customer, PaymentStatusResponse, PosProduct, Product, ReceiptQrResponse } from "@/lib/types";
import { extractReceiptToken, formatCurrency } from "@/lib/utils";

type StockAlert = {
  id: string;
  name: string;
  currentStock: number | string;
  minimumStock: number | string;
  unit: string;
  status: "LOW" | "OUT_OF_STOCK";
};

const normalizePosProduct = (product: Product): PosProduct => ({
  ...product,
  basePrice: Number(product.basePrice),
  variants: product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    priceDelta: Number(variant.priceDelta),
  })),
  modifiers: product.modifiers.map((modifier) => ({
    id: modifier.id,
    name: modifier.name,
    price: Number(modifier.price),
  })),
});

export default function PosPage() {
  const { token } = useAuth();
  const { products, isLoading, error, refetch } = useProducts(token);
  const {
    items,
    subtotal,
    totalAmount,
    isSubmitting,
    submitError,
    successMessage,
    addToCart,
    increaseQty,
    decreaseQty,
    removeItem,
    updateItemNote,
    clearCart,
    createAndCheckoutOrder,
  } = usePosOrder(token);

  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [qrisState, setQrisState] = useState<{ orderId: string | null }>({
    orderId: null,
  });
  const [paymentSeed, setPaymentSeed] = useState<PaymentStatusResponse | null>(null);
  const [receiptQrData, setReceiptQrData] = useState<ReceiptQrResponse | null>(null);
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<PosProduct | null>(null);
  const [isLoadingProductOptions, setIsLoadingProductOptions] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  const paymentStatus = usePaymentStatus({
    token,
    orderId: qrisState.orderId,
    enabled: checkoutOpen && Boolean(qrisState.orderId),
    initialData: paymentSeed,
  });

  const categories = useMemo(() => ["All", ...new Set(products.map((product) => product.category?.name ?? "Uncategorized"))], [products]);

  useEffect(() => {
    if (!token) {
      setStockAlerts([]);
      return;
    }

    let cancelled = false;

    const fetchStockAlerts = async () => {
      try {
        const alerts = await apiClient.get<StockAlert[]>("/inventory/alerts", token);
        if (!cancelled) {
          setStockAlerts(alerts);
        }
      } catch {
        if (!cancelled) {
          setStockAlerts([]);
        }
      }
    };

    void fetchStockAlerts();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const categoryName = product.category?.name ?? "Uncategorized";
      const matchesCategory = activeCategory === "All" || categoryName === activeCategory;
      const matchesSearch = [product.name, categoryName].join(" ").toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const handleProductAdd = async (product: Product) => {
    try {
      setIsLoadingProductOptions(true);
      const latestProduct = normalizePosProduct(token ? await apiClient.get<Product>(`/products/${product.id}`, token) : product);
      const hasOptions = latestProduct.variants.length > 0 || latestProduct.modifiers.length > 0;

      if (!hasOptions) {
        addToCart({ product: latestProduct });
        return;
      }

      setSelectedProduct(latestProduct);
      setOptionModalOpen(true);
    } catch {
      const normalizedProduct = normalizePosProduct(product);
      const hasOptions = normalizedProduct.variants.length > 0 || normalizedProduct.modifiers.length > 0;

      if (!hasOptions) {
        addToCart({ product: normalizedProduct });
        return;
      }

      setSelectedProduct(normalizedProduct);
      setOptionModalOpen(true);
    } finally {
      setIsLoadingProductOptions(false);
    }
  };

  const handleConfirmProductOptions = (selection: {
    variant: PosProduct["variants"][number] | null;
    modifiers: PosProduct["modifiers"];
  }) => {
    if (!selectedProduct) {
      return;
    }

    addToCart({
      product: selectedProduct,
      variant: selection.variant,
      modifiers: selection.modifiers,
    });
    setOptionModalOpen(false);
    setSelectedProduct(null);
  };

  const handleCashSubmit = async (amountReceived: number) => {
    try {
      const result = await createAndCheckoutOrder({
        paymentMethod: "cash",
        amountReceived,
        customer: selectedCustomer,
      });
      setPaymentSeed({
        order: result.order,
        payment: result.payment ?? null,
        receiptUrl: result.receiptUrl ?? null,
      });
      setQrisState({
        orderId: result.order.id,
      });
      setReceiptQrData(null);
    } catch {
      return;
    }
  };

  const handleQrisSubmit = async (gatewayReference: string) => {
    try {
      const result = await createAndCheckoutOrder({
        paymentMethod: "qris",
        gatewayReference,
        customer: selectedCustomer,
      });
      setPaymentSeed({
        order: result.order,
        payment: result.payment ?? null,
        receiptUrl: result.receiptUrl ?? null,
      });
      setQrisState({
        orderId: result.order.id,
      });
      setReceiptQrData(null);
    } catch {
      return;
    }
  };

  const handleNewOrder = () => {
    clearCart();
    setPaymentSeed(null);
    setQrisState({
      orderId: null,
    });
    setReceiptQrData(null);
    setSelectedCustomer(null);
    setCheckoutOpen(false);
  };

  const receiptToken = extractReceiptToken(paymentStatus.receiptUrl);

  useEffect(() => {
    const orderId = paymentStatus.data?.order?.id;
    const isPaid = paymentStatus.data?.order?.paymentStatus === "PAID";

    if (!token || !orderId || !isPaid) {
      return;
    }

    let cancelled = false;

    const fetchReceiptQr = async () => {
      try {
        const result = await apiClient.get<ReceiptQrResponse>(`/orders/${orderId}/receipt-qr`, token);
        if (!cancelled) {
          setReceiptQrData(result);
        }
      } catch {
        if (!cancelled) {
          setReceiptQrData(null);
        }
      }
    };

    void fetchReceiptQr();

    return () => {
      cancelled = true;
    };
  }, [paymentStatus.data?.order?.id, paymentStatus.data?.order?.paymentStatus, token]);

  return (
    <div className="space-y-6">
      <Topbar title="POS / Cashier" subtitle="Pilih menu dengan cepat, edit cart dengan nyaman, lalu lanjutkan ke pembayaran tanpa gangguan visual yang tidak perlu." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Card className="rounded-[20px] bg-white sm:rounded-[26px]">
          <CardContent className="p-4 sm:px-6 sm:pb-6 sm:pt-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5A4032]/45 sm:text-xs sm:tracking-[0.18em]">Menu tampil</p>
            <p className="mt-2 text-2xl font-semibold leading-tight text-[#5A4032] sm:mt-3 sm:text-3xl">{products.length}</p>
            <p className="mt-1.5 text-xs leading-snug text-[#5A4032]/68 sm:mt-2 sm:text-sm">Produk aktif dari database</p>
          </CardContent>
        </Card>
        <Card className="rounded-[20px] bg-white sm:rounded-[26px]">
          <CardContent className="p-4 sm:px-6 sm:pb-6 sm:pt-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5A4032]/45 sm:text-xs sm:tracking-[0.18em]">Item di cart</p>
            <p className="mt-2 text-2xl font-semibold leading-tight text-[#5A4032] sm:mt-3 sm:text-3xl">{items.reduce((sum, item) => sum + item.qty, 0)}</p>
            <p className="mt-1.5 text-xs leading-snug text-[#5A4032]/68 sm:mt-2 sm:text-sm">Siap dihitung ke checkout</p>
          </CardContent>
        </Card>
        <Card className="rounded-[20px] bg-white sm:rounded-[26px]">
          <CardContent className="p-4 sm:px-6 sm:pb-6 sm:pt-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5A4032]/45 sm:text-xs sm:tracking-[0.18em]">Subtotal</p>
            <p className="mt-2 truncate text-2xl font-semibold leading-tight text-[#5A4032] sm:mt-3 sm:text-3xl">{formatCurrency(subtotal)}</p>
            <p className="mt-1.5 text-xs leading-snug text-[#5A4032]/68 sm:mt-2 sm:text-sm">Nilai item sebelum service charge</p>
          </CardContent>
        </Card>
        <Card className="rounded-[20px] border-[#E8D8C3] bg-[#5A4032] text-white sm:rounded-[26px]">
          <CardContent className="p-4 sm:px-6 sm:pb-6 sm:pt-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-white/55 sm:text-xs sm:tracking-[0.18em]">Total bayar</p>
            <p className="mt-2 truncate text-2xl font-semibold leading-tight sm:mt-3 sm:text-3xl">{formatCurrency(totalAmount)}</p>
            <p className="mt-1.5 text-xs leading-snug text-white/70 sm:mt-2 sm:text-sm">Tanpa pajak dan service charge</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 rounded-[20px] bg-white lg:col-span-1 sm:rounded-[26px]">
          <CardContent className="p-4 sm:px-6 sm:pb-6 sm:pt-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#5A4032]/45 sm:text-xs sm:tracking-[0.18em]">Stock alert</p>
            <p className="mt-2 text-2xl font-semibold leading-tight text-[#5A4032] sm:mt-3 sm:text-3xl">{stockAlerts.length}</p>
            <p className="mt-1.5 truncate text-xs leading-snug text-[#5A4032]/68 sm:mt-2 sm:text-sm">
              {stockAlerts[0]
                ? `${stockAlerts[0].name}: ${Number(stockAlerts[0].currentStock).toLocaleString("id-ID")} ${stockAlerts[0].unit}`
                : "Tidak ada stok menipis"}
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_420px]">
        <div className="space-y-5">
          <Card className="bg-white">
            <CardContent className="space-y-5 pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/45">Filter menu</p>
                  <h3 className="mt-2 text-2xl font-semibold text-[#5A4032]">Produk untuk kasir</h3>
                </div>
                <div className="relative w-full lg:w-[320px]">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A4032]/45" />
                  <Input
                    placeholder="Cari nama menu atau kategori..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="bg-[#FDFBF7] pl-10"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === category
                        ? "bg-[#5A4032] text-white"
                        : "border border-[#E8D8C3] bg-[#FDFBF7] text-[#5A4032] hover:bg-white"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[320px] animate-pulse rounded-[24px] border border-[#E8D8C3]/60 bg-[#FDFBF7]" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="flex flex-col items-start gap-4 pt-6">
                <p className="text-sm text-rose-700">{error}</p>
                <Button variant="secondary" onClick={() => void refetch()}>Muat ulang produk</Button>
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="space-y-2 pt-6">
                <p className="text-lg font-semibold text-[#5A4032]">Produk tidak ditemukan</p>
                <p className="text-sm text-[#5A4032]/68">Coba keyword lain atau ganti kategori.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} disabled={isSubmitting || isLoadingProductOptions} onAdd={handleProductAdd} />
              ))}
            </div>
          )}
        </div>

        <CartPanel
          items={items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.productName,
            qty: item.qty,
            price: item.unitPrice,
            note: item.note,
            variantName: item.variantName ?? null,
            modifiers: item.modifiers.map((modifier) => ({
              ...modifier,
              price: modifier.price,
            })),
          }))}
          onIncrease={increaseQty}
          onDecrease={decreaseQty}
          onRemove={removeItem}
          onNoteChange={updateItemNote}
          onCheckout={() => setCheckoutOpen(true)}
          isCheckoutDisabled={isSubmitting}
          topContent={
            <CustomerSelector
              token={token}
              selectedCustomerId={selectedCustomer?.id ?? null}
              onSelectCustomer={setSelectedCustomer}
            />
          }
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
        paymentStatus={paymentStatus}
        receiptQrData={receiptQrData}
        customerName={selectedCustomer?.name ?? "Walk-in Customer"}
        onCashSubmit={handleCashSubmit}
        onQrisSubmit={handleQrisSubmit}
        onStartNewOrder={handleNewOrder}
      />

      <ProductOptionModal
        open={optionModalOpen}
        product={selectedProduct}
        onOpenChange={(open) => {
          setOptionModalOpen(open);
          if (!open) {
            setSelectedProduct(null);
          }
        }}
        onConfirm={handleConfirmProductOptions}
      />

      {receiptToken ? (
        <div className="flex justify-end">
          <Link href={`/receipt/${receiptToken}`}>
            <Button variant="outline">Buka receipt terakhir</Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
