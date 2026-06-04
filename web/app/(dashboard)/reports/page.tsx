"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { SummaryCard } from "@/components/app/summary-card";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useReports } from "@/hooks/use-reports";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import { formatCurrency, formatDateTime, formatPaymentMethod } from "@/lib/utils";

const getDisplayTotal = (subtotal: number | string, serviceAmount: number | string) =>
  Number(subtotal) + Number(serviceAmount);

const today = new Date().toISOString().slice(0, 10);
const oneWeekAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export default function ReportsPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const [startDate, setStartDate] = useState(oneWeekAgo);
  const [endDate, setEndDate] = useState(today);
  const [isExporting, setIsExporting] = useState(false);
  const { salesSummary, transactions, productSales, paymentSummary, stockMovements, isLoading, error, refetch } = useReports(token, {
    startDate,
    endDate,
  });

  const cards = useMemo(
    () => [
      { title: "Gross Sales", value: formatCurrency(salesSummary?.grossSales ?? 0), hint: "Selected range", trend: `${salesSummary?.totalOrders ?? 0} orders` },
      { title: "Subtotal", value: formatCurrency(salesSummary?.subtotal ?? 0), hint: "Core sales amount", trend: "Live" },
      { title: "Service Amount", value: formatCurrency(salesSummary?.serviceAmount ?? 0), hint: "Service charge", trend: "Live" },
      { title: "Total Sales", value: formatCurrency(salesSummary?.totalSales ?? 0), hint: "Without tax", trend: "Live" },
    ],
    [salesSummary],
  );

  const handleExport = async () => {
    if (!token) {
      return;
    }

    setIsExporting(true);

    try {
      const query = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
      const { blob, fileName } = await apiClient.download(`/reports/sales/export${query}`, token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      pushToast({ type: "success", title: "Export ready", description: `${fileName} downloaded.` });
    } catch (exportError) {
      pushToast({
        type: "error",
        title: "Export failed",
        description: exportError instanceof Error ? exportError.message : "Unable to export report.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Reports" subtitle="Live reporting dari backend dengan export Excel yang lebih rapi, aman, dan siap dibagikan." />
      <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto_auto]">
        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        <Button variant="secondary" onClick={() => void refetch()}>Refresh</Button>
        <Button onClick={() => void handleExport()} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" /> {isExporting ? "Exporting..." : "Export Report"}
        </Button>
      </div>
      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-rose-700">{error}</CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <SummaryCard key={card.title} {...card} />
        ))}
      </div>
      <Tabs defaultValue="sales">
        <TabsList>
          <TabsTrigger value="sales">Sales Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transaction Details</TabsTrigger>
          <TabsTrigger value="products">Product Sales</TabsTrigger>
          <TabsTrigger value="payments">Payment Summary</TabsTrigger>
          <TabsTrigger value="stock">Stock Movement</TabsTrigger>
        </TabsList>
        <TabsContent value="sales">
          <Card><CardContent className="grid gap-4 pt-6 md:grid-cols-2 xl:grid-cols-4">{cards.map((card) => <SummaryCard key={card.title} {...card} />)}</CardContent></Card>
        </TabsContent>
        <TabsContent value="transactions">
          <DataTable
            columns={[
              { key: "invoice", header: "Invoice", render: (row) => row.invoiceNumber },
              { key: "customer", header: "Customer", render: (row) => row.customerNameSnapshot ?? row.customer?.name ?? "Walk-in Customer" },
              { key: "status", header: "Status", render: (row) => row.status },
              { key: "payment", header: "Payment", render: (row) => row.paymentStatus },
              { key: "createdAt", header: "Date", render: (row) => formatDateTime(row.createdAt) },
              { key: "method", header: "Method", render: (row) => formatPaymentMethod(row.paymentTransactions[0]?.method ?? "-") },
              { key: "total", header: "Total", render: (row) => formatCurrency(getDisplayTotal(row.subtotal, row.serviceAmount)) },
            ]}
            data={transactions}
            className={isLoading ? "opacity-70" : ""}
          />
        </TabsContent>
        <TabsContent value="products">
          <DataTable
            columns={[
              { key: "name", header: "Menu", render: (row) => row.productName },
              { key: "sold", header: "Sold", render: (row) => row.qty.toString() },
              { key: "revenue", header: "Revenue", render: (row) => formatCurrency(row.revenue) },
            ]}
            data={productSales}
            className={isLoading ? "opacity-70" : ""}
          />
        </TabsContent>
        <TabsContent value="payments">
          <DataTable
            columns={[
              { key: "method", header: "Method", render: (row) => row.method },
              { key: "count", header: "Count", render: (row) => row.count.toString() },
              { key: "paidCount", header: "Paid", render: (row) => row.paidCount.toString() },
              { key: "totalAmount", header: "Total", render: (row) => formatCurrency(row.totalAmount) },
            ]}
            data={paymentSummary}
            className={isLoading ? "opacity-70" : ""}
          />
        </TabsContent>
        <TabsContent value="stock">
          <DataTable
            columns={[
              { key: "name", header: "Ingredient", render: (row) => row.ingredient.name },
              { key: "type", header: "Type", render: (row) => row.type },
              { key: "qty", header: "Qty", render: (row) => String(row.qty) },
              { key: "createdAt", header: "Date", render: (row) => formatDateTime(row.createdAt) },
            ]}
            data={stockMovements}
            className={isLoading ? "opacity-70" : ""}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
