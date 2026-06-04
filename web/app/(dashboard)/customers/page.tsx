"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useCustomers } from "@/hooks/use-customers";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { Customer } from "@/lib/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function CustomersPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const [query, setQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({ name: "", phone: "" });
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { customers, isLoading, error, refetch } = useCustomers(token, query);

  useEffect(() => {
    if (!selectedCustomer || !token) {
      return;
    }

    let cancelled = false;
    const fetchDetail = async () => {
      const detail = await apiClient.get<Customer>(`/customers/${selectedCustomer.id}`, token);
      if (!cancelled) {
        setSelectedCustomer(detail);
      }
    };

    void fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedCustomer?.id, token]);

  const summary = useMemo(() => {
    return {
      totalCustomers: customers.length,
      totalSpend: customers.reduce((sum, customer) => sum + Number(customer.totalSpend ?? 0), 0),
    };
  }, [customers]);

  const handleExport = async () => {
    if (!token) {
      return;
    }

    setIsExporting(true);
    try {
      const { blob, fileName } = await apiClient.download("/customers/export", token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const openEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditOpen(true);
    setIsDetailOpen(false);
    setEditDraft({ name: customer.name, phone: customer.phone ?? "" });
  };

  const openDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailOpen(true);
    setIsEditOpen(false);
  };

  const handleSaveCustomer = async () => {
    if (!token || !selectedCustomer || !editDraft.name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.patch(`/customers/${selectedCustomer.id}`, {
        name: editDraft.name.trim(),
        phone: editDraft.phone.trim() || null,
      }, token);
      pushToast({ type: "success", title: "Customer updated" });
      setIsEditOpen(false);
      setSelectedCustomer(null);
      await refetch();
    } catch (saveError) {
      pushToast({
        type: "error",
        title: "Update failed",
        description: saveError instanceof Error ? saveError.message : "Unable to update customer.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Customers" subtitle="Kelola customer loyal, lihat riwayat belanja, dan siapkan dasar CRM coffee shop." />

       <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer by name or phone" />
        <Card className="border-[#ead9c7] bg-white/86">
          <CardContent className="flex h-full items-center gap-6 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-coffee-700/45">Customers</p>
              <p className="mt-1 text-2xl font-semibold text-coffee-950">{summary.totalCustomers}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-coffee-700/45">Tracked spend</p>
              <p className="mt-1 text-2xl font-semibold text-coffee-950">{formatCurrency(summary.totalSpend)}</p>
            </div>
          </CardContent>
        </Card>
        <Button onClick={() => void handleExport()} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" /> {isExporting ? "Exporting..." : "Export Customer"}
        </Button>
      </div>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <DataTable
        columns={[
          { key: "name", header: "Customer", render: (row) => row.name },
          { key: "transactions", header: "Transactions", render: (row) => String(row.totalTransactions ?? 0) },
          { key: "spend", header: "Total Spend", render: (row) => formatCurrency(Number(row.totalSpend ?? 0)) },
          { key: "favorite", header: "Favorite Product", render: (row) => row.favoriteProduct ?? "-" },
          { key: "last", header: "Last Transaction", render: (row) => row.lastTransaction ? formatDateTime(row.lastTransaction) : "-" },
          {
            key: "actions",
            header: "Action",
            render: (row) => (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => openDetail(row)}>
                  View Detail
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                  Edit
                </Button>
              </div>
            ),
          },
        ]}
        data={customers}
        className={isLoading ? "opacity-70" : ""}
        emptyMessage="Belum ada customer tersimpan."
      />

      <Dialog open={isDetailOpen} onOpenChange={(open) => {
        if (!open) {
          setSelectedCustomer(null);
          setIsDetailOpen(false);
        }
      }}>
        <DialogContent className="max-w-4xl border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-2xl font-semibold text-coffee-900">{selectedCustomer?.name}</DialogTitle>
          {selectedCustomer ? (
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-4 rounded-[24px] bg-[#fcf7f0] p-5">
                <p className="text-sm text-coffee-700/70">Total Transactions: <span className="font-semibold text-coffee-900">{selectedCustomer.totalTransactions ?? 0}</span></p>
                <p className="text-sm text-coffee-700/70">Total Spend: <span className="font-semibold text-coffee-900">{formatCurrency(Number(selectedCustomer.totalSpend ?? 0))}</span></p>
                <p className="text-sm text-coffee-700/70">Average Transaction: <span className="font-semibold text-coffee-900">{formatCurrency(Number(selectedCustomer.averageTransactionValue ?? 0))}</span></p>
                <p className="text-sm text-coffee-700/70">Last Transaction: <span className="font-semibold text-coffee-900">{selectedCustomer.lastTransaction ? formatDateTime(selectedCustomer.lastTransaction) : "-"}</span></p>
                <p className="text-sm text-coffee-700/70">Favorite Product: <span className="font-semibold text-coffee-900">{selectedCustomer.favoriteProduct ?? "-"}</span></p>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold text-coffee-900">Recent Orders</p>
                {(selectedCustomer.recentOrders ?? []).length === 0 ? (
                  <div className="rounded-[20px] bg-[#fcf7f0] p-4 text-sm text-coffee-700/70">Belum ada order untuk customer ini.</div>
                ) : (
                  (selectedCustomer.recentOrders ?? []).map((order) => (
                    <div key={order.id} className="rounded-[20px] border border-coffee-100 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-coffee-950">{order.invoiceNumber}</p>
                          <p className="mt-1 text-sm text-coffee-700/65">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <p className="font-semibold text-coffee-900">{formatCurrency(Number(order.totalAmount))}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditOpen(false);
          setSelectedCustomer(null);
        }
      }}>
        <DialogContent className="max-w-lg border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-2xl font-semibold text-coffee-900">Edit Customer</DialogTitle>
          {selectedCustomer ? (
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-coffee-700">Customer Name</label>
                <Input value={editDraft.name} onChange={(event) => setEditDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Customer name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-coffee-700">Phone Number</label>
                <Input value={editDraft.phone} onChange={(event) => setEditDraft((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone number" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => void handleSaveCustomer()} disabled={isSaving || !editDraft.name.trim()}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
