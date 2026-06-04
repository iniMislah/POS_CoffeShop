"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, QrCode } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { ReceiptQrModal } from "@/components/app/receipt-qr-modal";
import { SalesPerformance } from "@/components/app/sales-performance";
import { SummaryCard } from "@/components/app/summary-card";
import { Topbar } from "@/components/app/topbar";
import { WhatsAppReceiptButton } from "@/components/app/whatsapp-receipt-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useDashboardAnalytics } from "@/hooks/use-dashboard-analytics";
import { useInventory } from "@/hooks/use-inventory";
import { useRecentTransactions } from "@/hooks/use-recent-transactions";
import { apiClient } from "@/lib/api-client";
import { API_ORIGIN } from "@/lib/config";
import type { DashboardPeriod, Order, ReceiptQrResponse } from "@/lib/types";
import { formatCurrency, formatDateTime, formatPaymentMethod, formatPaymentStatus } from "@/lib/utils";

const getDisplayTotal = (order: Order) => Number(order.subtotal) + Number(order.serviceAmount);

const getReceiptShareOrder = (order: Order) => ({
  invoiceNumber: order.invoiceNumber,
  totalAmount: getDisplayTotal(order),
  receiptToken: order.receiptToken,
  receiptUrl: order.receiptToken ? undefined : null,
  pdfUrl: order.receiptToken ? `${API_ORIGIN}/api/receipts/${order.receiptToken}/pdf` : null,
  customerPhone: order.customer?.phone,
});

export default function DashboardPage() {
  const { token } = useAuth();
  const { transactions: recentTransactions } = useRecentTransactions(token, 3);
  const { ingredients } = useInventory(token);
  const [receiptQrOpen, setReceiptQrOpen] = useState(false);
  const [receiptQr, setReceiptQr] = useState<ReceiptQrResponse | null>(null);
  const [receiptQrError, setReceiptQrError] = useState<string | null>(null);
  const [isQrLoading, setIsQrLoading] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<DashboardPeriod>("today");
  const dashboardAnalytics = useDashboardAnalytics(token, analyticsPeriod);

  const dashboardMetrics = useMemo(() => {
    const summary = dashboardAnalytics.summary;

    return [
      {
        title: "Sales Today",
        value: formatCurrency(summary?.salesToday ?? 0),
        hint: "Paid orders today",
        trend: `${summary?.paidOrdersToday ?? 0} paid`,
      },
      {
        title: "Success Payment",
        value: String(summary?.successPaymentsToday ?? 0),
        hint: "Paid payments today",
        trend: "Paid",
      },
      {
        title: "Pending Payment",
        value: String(summary?.pendingPayments ?? 0),
        hint: "Need follow-up",
        trend: "Open",
      },
      {
        title: "Total Orders",
        value: String(summary?.totalOrders ?? 0),
        hint: analyticsPeriod === "all-time" ? "All recorded orders" : "Selected period",
        trend: analyticsPeriod === "today" ? "Today" : "Filtered",
      },
    ];
  }, [analyticsPeriod, dashboardAnalytics.summary]);

  const [activeLatestOrderIndex, setActiveLatestOrderIndex] = useState(0);
  const latestOrders = recentTransactions;
  const orderedLatestOrders = latestOrders.slice(0, 5);
  const lowStockItems = ingredients.filter((item) => Number(item.currentStock) <= Number(item.minimumStock)).slice(0, 5);

  const activeLatestOrder = orderedLatestOrders[activeLatestOrderIndex];

  const handlePrevLatestOrder = () => setActiveLatestOrderIndex((index) => Math.max(index - 1, 0));
  const handleNextLatestOrder = () =>
    setActiveLatestOrderIndex((index) => Math.min(index + 1, orderedLatestOrders.length - 1));

  const handleShowQr = async (order: Order) => {
    if (!token) {
      return;
    }

    setReceiptQrOpen(true);
    setIsQrLoading(true);
    setReceiptQr(null);
    setReceiptQrError(null);

    try {
      const result = await apiClient.get<ReceiptQrResponse>(`/orders/${order.id}/receipt-qr`, token);
      setReceiptQr(result);
    } catch (error) {
      setReceiptQrError(error instanceof Error ? error.message : "Unable to load receipt QR.");
    } finally {
      setIsQrLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" subtitle="Ringkasan operasional coffee shop yang lebih bersih, fokus, dan langsung ke data yang penting." />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </section>

      <SalesPerformance
        period={analyticsPeriod}
        onPeriodChange={setAnalyticsPeriod}
        topProducts={dashboardAnalytics.topProducts}
        topRevenueProducts={dashboardAnalytics.topRevenueProducts}
        isLoading={dashboardAnalytics.isLoading}
        error={dashboardAnalytics.error}
        onRetry={() => void dashboardAnalytics.refetch()}
      />

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Latest Orders</CardTitle>
                <p className="text-sm text-[#5A4032]/60">Lihat transaksi terakhir dengan tampilan kartu yang ringkas dan mudah dinavigasi.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handlePrevLatestOrder} disabled={activeLatestOrderIndex === 0}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleNextLatestOrder} disabled={activeLatestOrderIndex === orderedLatestOrders.length - 1 || orderedLatestOrders.length === 0}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-4">
            {orderedLatestOrders.length === 0 ? (
              <div className="rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] p-4 text-sm text-[#5A4032]/68">Belum ada transaksi terbaru.</div>
            ) : (
              <div className="relative min-h-[430px] overflow-hidden px-4 sm:min-h-[360px]">
                {orderedLatestOrders.map((order, index) => {
                  const position = index - activeLatestOrderIndex;
                  const isVisible = position >= 0 && position < 4;
                  const scale = 1 - Math.min(position, 3) * 0.025;
                  const translateY = position * 12;
                  const opacity = position === 0 ? 1 : 0.9;

                  return (
                    <div
                      key={order.id}
                      className="absolute left-0 right-0 rounded-[22px] border border-[#E8D8C3]/50 bg-white p-5 shadow-[0_14px_30px_rgba(90,64,50,0.06)] transition-all duration-300 ease-out"
                      style={{
                        transform: `translateY(${translateY}px) scale(${scale})`,
                        opacity: isVisible ? opacity : 0,
                        zIndex: 20 - position,
                        pointerEvents: position === 0 ? "auto" : "none",
                      }}
                    >
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#5A4032]">{order.invoiceNumber}</p>
                            <p className="mt-1 text-sm text-[#5A4032]/68 truncate">{order.customerNameSnapshot ?? order.customer?.name ?? "Walk-in Customer"}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#5A4032]/55">{formatPaymentStatus(order.paymentStatus)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-[#5A4032]">{formatCurrency(getDisplayTotal(order))}</p>
                            <p className="mt-1 text-sm text-[#5A4032]/70">{order.orderItems.length} item</p>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-2xl border border-[#E8D8C3]/70 bg-[#FEF9F2] p-3 text-sm text-[#5A4032]/70">
                            <p className="font-semibold text-[#5A4032]">Cashier</p>
                            <p>{order.cashier?.name ?? "Cashier"}</p>
                          </div>
                          <div className="rounded-2xl border border-[#E8D8C3]/70 bg-[#FEF9F2] p-3 text-sm text-[#5A4032]/70">
                            <p className="font-semibold text-[#5A4032]">Date</p>
                            <p>{formatDateTime(order.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {order.receiptToken ? (
                            <>
                              <Link href={`/receipt/${order.receiptToken}`}>
                                <Button size="sm" variant="secondary">View Receipt</Button>
                              </Link>
                              <Button size="sm" variant="outline" onClick={() => void handleShowQr(order)}>
                                <QrCode className="mr-2 h-4 w-4" /> Show QR
                              </Button>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {orderedLatestOrders.length > 0 ? (
              <div className="mt-4 flex items-center justify-between text-sm text-[#5A4032]/60 px-6">
                <span>{activeLatestOrderIndex + 1} dari {orderedLatestOrders.length} terbaru</span>
                <span>{activeLatestOrder?.customerNameSnapshot ?? activeLatestOrder?.customer?.name ?? "Walk-in Customer"}</span>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {lowStockItems.length === 0 ? (
                <div className="rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] p-4 text-sm text-[#5A4032]/68">Semua bahan masih di atas minimum stock.</div>
              ) : (
                lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#E8D8C3]/75 bg-[#FDFBF7] p-4">
                    <div>
                      <p className="font-semibold text-[#5A4032]">{item.name}</p>
                      <p className="text-sm text-[#5A4032]/68">Min. {Number(item.minimumStock).toLocaleString("id-ID")} {item.unit}</p>
                    </div>
                    <p className="text-sm font-semibold text-rose-700">{Number(item.currentStock).toLocaleString("id-ID")} {item.unit}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <DataTable
        columns={[
          { key: "invoice", header: "Invoice", render: (row) => row.invoiceNumber },
          { key: "customer", header: "Customer", render: (row) => row.customerNameSnapshot ?? row.customer?.name ?? "Walk-in Customer" },
          { key: "cashier", header: "Cashier", render: (row) => row.cashier?.name ?? "-" },
          { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) },
          { key: "method", header: "Method", render: (row) => formatPaymentMethod(row.paymentTransactions[0]?.method ?? "-") },
          { key: "amount", header: "Amount", render: (row) => formatCurrency(getDisplayTotal(row)) },
          { key: "status", header: "Status", render: (row) => row.paymentStatus },
          {
            key: "receipt",
            header: "Receipt",
            render: (row) =>
              row.receiptToken ? (
                <div className="flex gap-2">
                  <Link href={`/receipt/${row.receiptToken}`}>
                    <Button size="sm" variant="secondary">View Receipt</Button>
                  </Link>
                  <Button size="sm" variant="outline" onClick={() => void handleShowQr(row)}>
                    <QrCode className="mr-2 h-4 w-4" /> Show QR
                  </Button>
                  <WhatsAppReceiptButton order={getReceiptShareOrder(row)} />
                </div>
              ) : (
                "-"
              ),
          },
        ]}
        data={recentTransactions}
        emptyMessage="Transaksi terbaru akan muncul di tabel ini."
      />

      <ReceiptQrModal
        open={receiptQrOpen}
        onOpenChange={setReceiptQrOpen}
        data={receiptQr}
        isLoading={isQrLoading}
        error={receiptQrError}
      />
    </div>
  );
}
