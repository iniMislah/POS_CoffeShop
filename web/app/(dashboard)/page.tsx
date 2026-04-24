"use client";

import { useMemo } from "react";

import { SummaryCard } from "@/components/app/summary-card";
import { Topbar } from "@/components/app/topbar";
import { DataTable } from "@/components/app/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useInventory } from "@/hooks/use-inventory";
import { usePayments } from "@/hooks/use-payments";
import { useTransactions } from "@/hooks/use-transactions";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const { token } = useAuth();
  const today = new Date().toISOString().slice(0, 10);
  const { transactions } = useTransactions(token, { date: today, paymentMethod: "all", status: "all" });
  const { ingredients } = useInventory(token);
  const { payments } = usePayments(token);

  const dashboardMetrics = useMemo(() => {
    const totalSales = transactions.filter((item) => item.paymentStatus === "PAID").reduce((sum, item) => sum + Number(item.totalAmount), 0);
    const pendingPayments = payments.filter((item) => item.status === "PENDING").length;
    const lowStock = ingredients.filter((item) => Number(item.currentStock) <= Number(item.minimumStock)).length;

    return [
      { title: "Total Sales Today", value: formatCurrency(totalSales), hint: "Based on paid orders today", trend: "Live" },
      { title: "Total Orders", value: String(transactions.length), hint: "Orders created today", trend: "Live" },
      { title: "Pending Payments", value: String(pendingPayments), hint: "Awaiting cash/QRIS completion", trend: "Live" },
      { title: "Low Stock", value: String(lowStock), hint: "Ingredients below minimum stock", trend: "Live" },
    ];
  }, [ingredients, payments, transactions]);

  const topSellingMenus = useMemo(() => {
    const map = new Map<string, { name: string; sold: number; revenue: number }>();

    for (const order of transactions) {
      for (const item of order.orderItems) {
        const existing = map.get(item.productId) ?? {
          name: item.productNameSnapshot,
          sold: 0,
          revenue: 0,
        };

        existing.sold += item.qty;
        existing.revenue += Number(item.lineTotal);
        map.set(item.productId, existing);
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4);
  }, [transactions]);

  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" subtitle="Monitor live sales, transaction flow, and stock signals from your current database." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardMetrics.map((metric) => (
          <SummaryCard key={metric.title} {...metric} />
        ))}
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <p className="text-sm text-coffee-700/65">Visual placeholder, with cards and tables now driven by live data.</p>
          </CardHeader>
          <CardContent>
            <div className="rounded-[28px] bg-gradient-to-br from-cream-50 to-white p-6">
              <div className="flex h-[320px] items-end gap-4">
                {[42, 61, 58, 75, 80, 64, 92, 88, 97, 70, 84, 99].map((bar, index) => (
                  <div key={index} className="flex flex-1 flex-col items-center gap-3">
                    <div className="w-full rounded-t-[20px] bg-gradient-to-t from-coffee-700 to-coffee-300" style={{ height: `${bar * 2.2}px` }} />
                    <span className="text-xs text-coffee-700/55">{index + 8}:00</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topSellingMenus.length === 0 ? (
              <div className="rounded-2xl bg-cream-50 p-4 text-sm text-coffee-700/70">No sales data yet.</div>
            ) : (
              topSellingMenus.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between rounded-2xl bg-cream-50 p-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-coffee-700/45">#{index + 1}</p>
                    <p className="mt-1 font-semibold text-coffee-900">{item.name}</p>
                    <p className="text-sm text-coffee-700/60">{item.sold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-coffee-700">{formatCurrency(item.revenue)}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
      <section>
        <DataTable
          columns={[
            { key: "invoice", header: "Invoice", render: (row) => row.invoiceNumber },
            { key: "cashier", header: "Cashier", render: (row) => row.cashier?.name ?? "-" },
            { key: "date", header: "Date", render: (row) => formatDateTime(row.createdAt) },
            { key: "method", header: "Method", render: (row) => row.paymentTransactions[0]?.method ?? "-" },
            { key: "amount", header: "Amount", render: (row) => formatCurrency(Number(row.totalAmount)) },
            { key: "status", header: "Status", render: (row) => row.paymentStatus },
          ]}
          data={transactions}
        />
      </section>
    </div>
  );
}
