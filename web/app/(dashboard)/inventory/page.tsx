"use client";

import { useMemo, useState } from "react";
import { PackagePlus, PencilLine, Plus, Trash2 } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { type Ingredient, useInventory } from "@/hooks/use-inventory";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";

type InventoryFormState = {
  name: string;
  unit: string;
  currentStock: string;
  minimumStock: string;
  costPerUnit: string;
  note: string;
};

const emptyForm: InventoryFormState = {
  name: "",
  unit: "",
  currentStock: "",
  minimumStock: "",
  costPerUnit: "",
  note: "",
};

const getInventoryValidationError = (form: InventoryFormState) => {
  if (!form.name.trim()) {
    return "Ingredient name is required.";
  }

  if (!form.unit.trim()) {
    return "Unit is required.";
  }

  if (form.currentStock === "" || Number(form.currentStock) < 0) {
    return "Current stock must be 0 or more.";
  }

  if (form.minimumStock === "" || Number(form.minimumStock) < 0) {
    return "Minimum stock must be 0 or more.";
  }

  if (form.costPerUnit === "" || Number(form.costPerUnit) < 0) {
    return "Cost per unit must be 0 or more.";
  }

  return null;
};

export default function InventoryPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const {
    ingredients,
    isLoading,
    error,
    createIngredient,
    updateIngredient,
    deleteIngredient,
    stockIn,
    adjustStock,
  } = useInventory(token);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [form, setForm] = useState<InventoryFormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<"stock-in" | "adjustment">("stock-in");
  const [movementQty, setMovementQty] = useState("");
  const [movementNote, setMovementNote] = useState("");

  const preparedRows = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        ...ingredient,
        stockStatus:
          Number(ingredient.currentStock) <= 0
            ? "Out of Stock"
            : Number(ingredient.currentStock) <= Number(ingredient.minimumStock)
              ? "Low Stock"
              : "Safe",
      })),
    [ingredients],
  );

  const openCreate = () => {
    setEditorMode("create");
    setSelectedIngredient(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (ingredient: Ingredient) => {
    setEditorMode("edit");
    setSelectedIngredient(ingredient);
    setForm({
      name: ingredient.name,
      unit: ingredient.unit,
      currentStock: String(Number(ingredient.currentStock)),
      minimumStock: String(Number(ingredient.minimumStock)),
      costPerUnit: String(Number(ingredient.costPerUnit)),
      note: "",
    });
    setEditorOpen(true);
  };

  const openMovement = (type: "stock-in" | "adjustment", ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setMovementType(type);
    setMovementQty("");
    setMovementNote("");
    setMovementOpen(true);
  };

  const openDelete = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setDeleteOpen(true);
  };

  const handleSaveIngredient = async () => {
    const validationError = getInventoryValidationError(form);
    if (validationError) {
      pushToast({
        type: "error",
        title: "Validation failed",
        description: validationError,
      });
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        currentStock: Number(form.currentStock),
        minimumStock: Number(form.minimumStock),
        costPerUnit: Number(form.costPerUnit),
      };

      if (editorMode === "create") {
        await createIngredient({
          ...payload,
          note: form.note.trim() || undefined,
        });
        pushToast({
          type: "success",
          title: "Inventory added",
          description: `${payload.name} saved to inventory.`,
        });
      } else if (selectedIngredient) {
        await updateIngredient(selectedIngredient.id, payload);
        pushToast({
          type: "success",
          title: "Inventory updated",
          description: `${payload.name} updated successfully.`,
        });
      }

      setEditorOpen(false);
      setSelectedIngredient(null);
      setForm(emptyForm);
    } catch (submitError) {
      pushToast({
        type: "error",
        title: "Save failed",
        description: submitError instanceof Error ? submitError.message : "Unable to save inventory item.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteIngredient = async () => {
    if (!selectedIngredient) {
      return;
    }

    setIsSaving(true);

    try {
      const result = await deleteIngredient(selectedIngredient.id);
      pushToast({
        type: "success",
        title: result.mode === "soft-delete" ? "Ingredient archived" : "Ingredient deleted",
        description:
          result.mode === "soft-delete"
            ? `${selectedIngredient.name} disembunyikan dari inventory agar histori recipe dan stock movement tetap aman.`
            : `${selectedIngredient.name} removed from inventory.`,
      });
      setDeleteOpen(false);
      setSelectedIngredient(null);
    } catch (deleteError) {
      pushToast({
        type: "error",
        title: "Delete failed",
        description: deleteError instanceof Error ? deleteError.message : "Unable to delete ingredient.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitMovement = async () => {
    if (!selectedIngredient || movementQty === "") {
      return;
    }

    const parsedQty = Number(movementQty);
    const invalidQty =
      Number.isNaN(parsedQty) ||
      parsedQty < 0 ||
      (movementType === "stock-in" && parsedQty <= 0);

    if (invalidQty) {
      pushToast({
        type: "error",
        title: "Validation failed",
        description:
          movementType === "stock-in"
            ? "Qty to add must be more than 0."
            : "New current stock must be 0 or more.",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (movementType === "stock-in") {
        await stockIn(selectedIngredient.id, parsedQty, movementNote.trim() || undefined);
        pushToast({
          type: "success",
          title: "Stock added",
          description: `${selectedIngredient.name} updated.`,
        });
      } else {
        await adjustStock(selectedIngredient.id, parsedQty, movementNote.trim() || undefined);
        pushToast({
          type: "success",
          title: "Stock adjusted",
          description: `${selectedIngredient.name} adjusted.`,
        });
      }

      setMovementOpen(false);
      setSelectedIngredient(null);
      setMovementQty("");
      setMovementNote("");
    } catch (submitError) {
      pushToast({
        type: "error",
        title: "Inventory action failed",
        description: submitError instanceof Error ? submitError.message : "Unable to update stock.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Inventory" subtitle="Kelola ingredient dari database, tambah stock masuk, dan pantau low stock dalam tampilan yang lebih rapi." />

      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Add Inventory
        </Button>
      </div>

      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <DataTable
        columns={[
          { key: "name", header: "Ingredient Name", render: (row) => row.name },
          { key: "stock", header: "Current Stock", render: (row) => Number(row.currentStock).toLocaleString("id-ID") },
          { key: "unit", header: "Unit", render: (row) => row.unit },
          { key: "minimum", header: "Minimum Stock", render: (row) => Number(row.minimumStock).toLocaleString("id-ID") },
          { key: "cost", header: "Cost per Unit", render: (row) => formatCurrency(Number(row.costPerUnit)) },
          { key: "status", header: "Stock Status", render: (row) => <StatusBadge value={row.stockStatus} /> },
          {
            key: "actions",
            header: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openMovement("stock-in", row)}>
                  <PackagePlus className="mr-2 h-4 w-4" /> Stock In
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openMovement("adjustment", row)}>
                  Adjustment
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
                  <PencilLine className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openDelete(row)}>
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </div>
            ),
          },
        ]}
        data={preparedRows}
        className={isLoading ? "opacity-70" : ""}
        emptyMessage="Belum ada ingredient di inventory. Tambahkan inventory baru untuk mulai memantau stok."
      />

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-3xl font-semibold text-coffee-900">
            {editorMode === "create" ? "Add Inventory" : "Edit Inventory"}
          </DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            Simpan ingredient langsung ke database inventory yang sudah dipakai sistem.
          </DialogDescription>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Ingredient Name</label>
              <Input
                value={form.name}
                placeholder="Contoh: Arabica Beans"
                className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Unit</label>
              <Input
                value={form.unit}
                placeholder="gram / ml / pcs"
                className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
                onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Current Stock</label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.currentStock}
                placeholder="0"
                className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
                onChange={(event) => setForm((current) => ({ ...current, currentStock: event.target.value }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Minimum Stock</label>
              <Input
                type="number"
                min="0"
                step="0.001"
                value={form.minimumStock}
                placeholder="0"
                className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
                onChange={(event) => setForm((current) => ({ ...current, minimumStock: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Cost per Unit</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPerUnit}
                placeholder="0"
                className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
                onChange={(event) => setForm((current) => ({ ...current, costPerUnit: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Notes (Optional)</label>
              <Textarea
                value={form.note}
                placeholder="Catatan stok awal, supplier, atau alasan penyesuaian awal..."
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="min-h-[120px] resize-none rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
              />
              <p className="mt-2 text-xs text-coffee-700/55">
                Saat membuat ingredient baru dengan stok awal lebih dari 0, catatan ini akan ikut disimpan pada stock movement `STOCK_IN`.
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveIngredient()} disabled={isSaving}>
              {isSaving ? "Saving..." : editorMode === "create" ? "Save Inventory" : "Update Inventory"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
        <DialogContent className="max-w-2xl border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-3xl font-semibold text-coffee-900">
            {movementType === "stock-in" ? "Stock In" : "Stock Adjustment"}
          </DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            {selectedIngredient?.name ?? "-"}
          </DialogDescription>
          <div className="mt-6 space-y-4">
            <div className="rounded-[24px] border border-[#ead9c7] bg-[#fcf7f0] px-5 py-4">
              <p className="text-xs uppercase tracking-[0.18em] text-coffee-700/50">Current Stock</p>
              <p className="mt-2 text-2xl font-semibold text-coffee-950">
                {selectedIngredient ? Number(selectedIngredient.currentStock).toLocaleString("id-ID") : "0"} {selectedIngredient?.unit ?? ""}
              </p>
            </div>
            <Input
              type="number"
              min="0"
              step="0.001"
              placeholder={movementType === "stock-in" ? "Qty to add" : "New current stock"}
              value={movementQty}
              className="h-12 rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
              onChange={(event) => setMovementQty(event.target.value)}
            />
            <Textarea
              placeholder="Tambahkan catatan stock movement..."
              value={movementNote}
              onChange={(event) => setMovementNote(event.target.value)}
              className="min-h-[110px] resize-none rounded-[20px] border-coffee-300/35 bg-[#fffdfa] shadow-[0_10px_26px_rgba(58,35,22,0.06)] focus:ring-4 focus:ring-coffee-200/45"
            />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setMovementOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleSubmitMovement()} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Movement"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-xl border-[#ead9c7] bg-[#fffdf9]">
          <DialogTitle className="text-3xl font-semibold text-coffee-900">Delete Ingredient</DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            Hapus ingredient <span className="font-semibold text-coffee-900">{selectedIngredient?.name ?? "-"}</span> dari inventory.
          </DialogDescription>
          <div className="mt-6 rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            Ingredient yang sudah dipakai recipe atau stock movement bisa ditolak backend agar histori tetap aman.
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleDeleteIngredient()} disabled={isSaving}>
              {isSaving ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
