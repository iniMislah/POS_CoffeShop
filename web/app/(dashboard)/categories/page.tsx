"use client";

import { useState } from "react";
import { FolderPlus, Pencil, Trash2 } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { type Category, useCategories } from "@/hooks/use-categories";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export default function CategoriesPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const { categories, error, isLoading, refetch } = useCategories(token);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setDraft("");
    setOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setDraft(category.name);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!token || !draft.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/categories/${editing.id}`, { name: draft.trim() }, token);
      } else {
        await apiClient.post("/categories", { name: draft.trim() }, token);
      }
      await refetch();
      setOpen(false);
      pushToast({
        type: "success",
        title: editing ? "Category updated" : "Category created",
      });
    } catch (saveError) {
      pushToast({
        type: "error",
        title: "Save failed",
        description: saveError instanceof Error ? saveError.message : "Unable to save category.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (!token) {
      return;
    }

    try {
      await apiClient.delete(`/categories/${category.id}`, token);
      await refetch();
      pushToast({ type: "success", title: "Category deleted" });
    } catch (deleteError) {
      pushToast({
        type: "error",
        title: "Delete failed",
        description: deleteError instanceof Error ? deleteError.message : "Category is still in use or cannot be deleted.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Category Management" subtitle="Maintain product grouping for cleaner POS filtering and more organized menu administration." />

      <Card className="border-[#ead8c6] bg-gradient-to-r from-[#fff8ef] to-[#f4e2c9]">
        <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-coffee-700/45">Menu taxonomy</p>
            <h3 className="mt-2 text-2xl font-semibold text-coffee-950">Category list connected to POS filters</h3>
            <p className="mt-2 text-sm text-coffee-700/70">Use categories like Coffee, Tea, Snack, and Dessert so the cashier can browse menu faster.</p>
          </div>
          <Button onClick={openCreate}>
            <FolderPlus className="mr-2 h-4 w-4" /> Add category
          </Button>
        </CardContent>
      </Card>

      {error ? (
        <Card>
          <CardContent className="pt-6 text-sm text-rose-700">{error}</CardContent>
        </Card>
      ) : null}

      <DataTable
  columns={[
    {
      key: "name",
      header: "Category",
      render: (row) => row.name,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="mx-auto grid w-[250px] grid-cols-2 items-center gap-4">
          <div className="flex justify-center">
            <Button variant="outline" size="sm" onClick={() => openEdit(row)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          <div className="flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleDelete(row)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      ),
    },
  ]}
  data={categories}
  className={isLoading ? "opacity-70" : ""}
  emptyMessage="No categories yet. Create a category to use it as a filter on the POS page."
/>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="text-3xl font-semibold text-coffee-950">{editing ? "Edit category" : "Create category"}</DialogTitle>
          <DialogDescription className="text-coffee-700/70">This category will be available immediately for menu assignment and POS filtering.</DialogDescription>
          <div className="space-y-4">
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Category name" />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => void handleSave()} disabled={isSaving || !draft.trim()}>
                {isSaving ? "Saving..." : "Save category"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
