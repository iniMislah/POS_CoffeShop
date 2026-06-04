"use client";

import { BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernSelect } from "@/components/ui/modern-select";
import type { DashboardPeriod, TopProductMetric } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const periodOptions: Array<{ value: DashboardPeriod; label: string }> = [
  { value: "today", label: "Hari Ini" },
  { value: "last-1-week", label: "1 Minggu" },
  { value: "last-1-month", label: "1 Bulan" },
  { value: "last-3-months", label: "3 Bulan" },
  { value: "all-time", label: "Total Order" },
];

function EmptyChart() {
  return (
    <div className="grid min-h-[190px] place-items-center rounded-2xl border border-dashed border-[#E8D8C3] bg-[#FDFBF7] px-4 py-8 text-center text-sm text-[#5A4032]/68">
      Belum ada transaksi pada periode ini.
    </div>
  );
}

function LoadingChart() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="h-10 animate-pulse rounded-2xl bg-[#F6F0E7]" />
      ))}
    </div>
  );
}

function ProductBarList({
  data,
  valueKey,
  formatter,
  isLoading,
}: {
  data: TopProductMetric[];
  valueKey: "quantitySold" | "revenue";
  formatter: (value: number) => string;
  isLoading: boolean;
}) {
  const max = Math.max(...data.map((item) => Number(item[valueKey])), 0);

  if (isLoading) {
    return <LoadingChart />;
  }

  if (data.length === 0) {
    return <EmptyChart />;
  }

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const value = Number(item[valueKey]);
        const width = max > 0 ? Math.max((value / max) * 100, 8) : 0;

        return (
          <div key={`${item.productId}-${item.productName}`} className="space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="min-w-0 truncate font-semibold text-[#5A4032]">{item.productName}</p>
              <p className="shrink-0 text-[#5A4032]/70">{formatter(value)}</p>
            </div>
            <div className="h-3 rounded-full bg-[#F2E6D7]">
              <div className="h-full rounded-full bg-[#7B5F4D]" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Sales trend chart removed to simplify dashboard (fewer charts)

export function SalesPerformance({
  period,
  onPeriodChange,
  topProducts,
  topRevenueProducts,
  isLoading,
  error,
  onRetry,
}: {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  topProducts: TopProductMetric[];
  topRevenueProducts: TopProductMetric[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/45">Dashboard Analytics</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#3E2C23]">Sales Performance</h2>
        </div>
        <ModernSelect
          className="md:w-56"
          value={period}
          options={periodOptions}
          onChange={(value) => onPeriodChange(value as DashboardPeriod)}
        />
      </div>

      {error ? (
        <Card className="bg-white">
          <CardContent className="flex flex-col justify-between gap-3 pt-6 md:flex-row md:items-center">
            <p className="text-sm text-rose-700">{error}</p>
            <Button variant="secondary" onClick={onRetry}>Retry</Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Top Selling Products</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#7B5F4D]" />
          </CardHeader>
          <CardContent>
            <ProductBarList data={topProducts} valueKey="quantitySold" formatter={(value) => `${value.toLocaleString("id-ID")} sold`} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Top Revenue Products</CardTitle>
            <BarChart3 className="h-5 w-5 text-[#7B5F4D]" />
          </CardHeader>
          <CardContent>
            <ProductBarList data={topRevenueProducts} valueKey="revenue" formatter={(value) => formatCurrency(value)} isLoading={isLoading} />
          </CardContent>
        </Card>

        {/* Sales Trend removed to declutter dashboard */}
      </div>
    </section>
  );
}
