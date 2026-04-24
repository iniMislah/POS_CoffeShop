"use client";

import { useState } from "react";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

export default function InventoryPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const { ingredients, isLoading, error, stockIn, adjustStock } = useInventory(token);
  const [action, setAction] = useState<"stock-in" | "adjustment" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");

  const selectedIngredient = ingredients.find((item) => item.id === selectedId) ?? null;

  const openAction = (type: "stock-in" | "adjustment", id: string) => {
    setAction(type);
    setSelectedId(id);
    setQty("");
    setNote("");
  };

  const handleSubmit = async () => {
    if (!selectedIngredient || !qty) {
      return;
    }

    try {
      if (action === "stock-in") {
        await stockIn(selectedIngredient.id, Number(qty), note);
        pushToast({ type: "success", title: "Stock added", description: `${selectedIngredient.name} updated.` });
      } else if (action === "adjustment") {
        await adjustStock(selectedIngredient.id, Number(qty), note);
        pushToast({ type: "success", title: "Stock adjusted", description: `${selectedIngredient.name} adjusted.` });
      }

      setAction(null);
      setSelectedId(null);
    } catch (submitError) {
      pushToast({
        type: "error",
        title: "Inventory action failed",
        description: submitError instanceof Error ? submitError.message : "Unable to update stock.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Inventory" subtitle="Live ingredient inventory with stock in, adjustment, and low stock signals from the database." />
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <DataTable
        columns={[
          { key: "name", header: "Name", render: (row) => row.name },
          { key: "unit", header: "Unit", render: (row) => row.unit },
          { key: "stock", header: "Stock", render: (row) => Number(row.currentStock).toLocaleString("id-ID") },
          { key: "minimum", header: "Minimum Stock", render: (row) => Number(row.minimumStock).toLocaleString("id-ID") },
          { key: "cost", header: "Cost / Unit", render: (row) => formatCurrency(Number(row.costPerUnit)) },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge value={Number(row.currentStock) <= Number(row.minimumStock) ? "low" : "healthy"} />
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openAction("stock-in", row.id)}>Stock In</Button>
                <Button variant="secondary" size="sm" onClick={() => openAction("adjustment", row.id)}>Adjustment</Button>
              </div>
            ),
          },
        ]}
        data={ingredients}
        className={isLoading ? "opacity-70" : ""}
      />

      <Dialog open={Boolean(action)} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent>
          <DialogTitle className="text-2xl font-semibold text-coffee-900">{action === "stock-in" ? "Stock In" : "Stock Adjustment"}</DialogTitle>
          <DialogDescription className="text-coffee-700/70">{selectedIngredient?.name ?? "-"}</DialogDescription>
          <div className="space-y-4">
            <Input
              type="number"
              placeholder={action === "stock-in" ? "Qty to add" : "New current stock"}
              value={qty}
              onChange={(event) => setQty(event.target.value)}
            />
            <Input placeholder="Note" value={note} onChange={(event) => setNote(event.target.value)} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setAction(null)}>Cancel</Button>
              <Button onClick={() => void handleSubmit()}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
