"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

type FormState = {
  name: string;
  categoryId: string;
  basePrice: string;
  imageUrl: string;
  isAvailable: string;
  variants: string;
  modifiers: string;
};

const emptyForm: FormState = {
  name: "",
  categoryId: "",
  basePrice: "",
  imageUrl: "",
  isAvailable: "true",
  variants: "",
  modifiers: "",
};

export default function MenuManagementPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const { products, isLoading, error, refetch } = useProducts(token);
  const { categories } = useCategories(token);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const preparedRows = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        categoryLabel: product.category?.name ?? "-",
        variantLabel: product.variants.map((variant) => variant.name).join(", "),
        modifierLabel: product.modifiers.map((modifier) => modifier.name).join(", "),
      })),
    [products],
  );

  const openCreate = () => {
    setEditingProduct(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      basePrice: String(Number(product.basePrice)),
      imageUrl: product.imageUrl ?? "",
      isAvailable: String(product.isAvailable),
      variants: product.variants.map((variant) => `${variant.name}:${Number(variant.priceDelta)}`).join("\n"),
      modifiers: product.modifiers.map((modifier) => `${modifier.name}:${Number(modifier.price)}`).join("\n"),
    });
    setOpen(true);
  };

  const syncVariants = async (productId: string, current: Product["variants"], raw: string) => {
    const parsed = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, delta = "0"] = line.split(":");
        return { name: name.trim(), priceDelta: Number(delta.trim() || 0) };
      });

    for (const existing of current) {
      const next = parsed.find((item) => item.name === existing.name);
      if (!next) {
        await apiClient.delete(`/products/variants/${existing.id}`, token);
      }
    }

    for (const item of parsed) {
      const existing = current.find((variant) => variant.name === item.name);
      if (existing) {
        await apiClient.put(`/products/variants/${existing.id}`, item, token);
      } else {
        await apiClient.post(`/products/${productId}/variants`, item, token);
      }
    }
  };

  const syncModifiers = async (productId: string, current: Product["modifiers"], raw: string) => {
    const parsed = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, price = "0"] = line.split(":");
        return { name: name.trim(), price: Number(price.trim() || 0) };
      });

    for (const existing of current) {
      const next = parsed.find((item) => item.name === existing.name);
      if (!next) {
        await apiClient.delete(`/modifiers/${existing.id}`, token);
      }
    }

    for (const item of parsed) {
      const existing = current.find((modifier) => modifier.name === item.name);
      if (existing) {
        await apiClient.put(`/modifiers/${existing.id}`, { productId, ...item }, token);
      } else {
        await apiClient.post("/modifiers", { productId, ...item }, token);
      }
    }
  };

  const handleSave = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: form.name,
        categoryId: form.categoryId,
        basePrice: Number(form.basePrice),
        imageUrl: form.imageUrl || null,
        isAvailable: form.isAvailable === "true",
      };

      let productId = editingProduct?.id ?? "";
      let currentProduct = editingProduct;

      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, payload, token);
      } else {
        const created = await apiClient.post<Product>("/products", payload, token);
        productId = created.id;
        currentProduct = created;
      }

      await syncVariants(productId, currentProduct?.variants ?? [], form.variants);
      await syncModifiers(productId, currentProduct?.modifiers ?? [], form.modifiers);
      await refetch();

      pushToast({
        type: "success",
        title: editingProduct ? "Product updated" : "Product created",
        description: "Menu data saved successfully.",
      });

      setOpen(false);
      setEditingProduct(null);
      setForm(emptyForm);
    } catch (saveError) {
      pushToast({
        type: "error",
        title: "Save failed",
        description: saveError instanceof Error ? saveError.message : "Unable to save product.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setForm((current) => ({ ...current, imageUrl: "" }));
      return;
    }

    const toDataUrl = () =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Unable to read image file."));
        reader.readAsDataURL(file);
      });

    try {
      const imageUrl = await toDataUrl();
      setForm((current) => ({ ...current, imageUrl }));
    } catch (fileError) {
      pushToast({
        type: "error",
        title: "Image upload failed",
        description: fileError instanceof Error ? fileError.message : "Unable to process selected image.",
      });
    }
  };

  const handleDelete = async (product: Product) => {
    if (!token) {
      return;
    }

    try {
      await apiClient.delete(`/products/${product.id}`, token);
      await refetch();
      pushToast({
        type: "success",
        title: "Product deleted",
      });
    } catch (deleteError) {
      pushToast({
        type: "error",
        title: "Delete failed",
        description: deleteError instanceof Error ? deleteError.message : "Unable to delete product.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Menu Management" subtitle="Manage live menu products, variants, modifiers, and availability from the real database." />
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="text-3xl font-semibold text-coffee-900">{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription className="text-coffee-700/70">Format variants/modifiers per line with `Name:Price`.</DialogDescription>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Product Name</label>
                <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Category</label>
                <Select value={form.categoryId} onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Base Price</label>
                <Input type="number" value={form.basePrice} onChange={(event) => setForm((current) => ({ ...current, basePrice: event.target.value }))} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Product Image</label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
                />
                {form.imageUrl ? (
                  <div className="mt-3 overflow-hidden rounded-2xl border border-coffee-200/60 bg-cream-50 p-2">
                    <div className="relative h-32 overflow-hidden rounded-xl">
                      <Image src={form.imageUrl} alt="Product preview" fill className="object-cover" />
                    </div>
                  </div>
                ) : null}
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Availability</label>
                <Select value={form.isAvailable} onChange={(event) => setForm((current) => ({ ...current, isAvailable: event.target.value }))}>
                  <option value="true">Available</option>
                  <option value="false">Sold Out</option>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Variants</label>
                <Textarea value={form.variants} onChange={(event) => setForm((current) => ({ ...current, variants: event.target.value }))} className="min-h-[120px]" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Modifiers / Add-ons</label>
                <Textarea value={form.modifiers} onChange={(event) => setForm((current) => ({ ...current, modifiers: event.target.value }))} className="min-h-[120px]" />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => void handleSave()} disabled={isSaving}>{isSaving ? "Saving..." : "Save Product"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <DataTable
        columns={[
          { key: "name", header: "Product", render: (row) => row.name },
          { key: "category", header: "Category", render: (row) => row.categoryLabel },
          { key: "price", header: "Base Price", render: (row) => formatCurrency(Number(row.basePrice)) },
          { key: "variants", header: "Variants", render: (row) => row.variantLabel || "-" },
          { key: "modifiers", header: "Modifiers", render: (row) => row.modifierLabel || "-" },
          { key: "status", header: "Status", render: (row) => <StatusBadge value={row.isAvailable ? "available" : "sold out"} /> },
          {
            key: "action",
            header: "Action",
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                <Button variant="secondary" size="sm" onClick={() => void handleDelete(row)}>Delete</Button>
              </div>
            ),
          },
        ]}
        data={preparedRows}
        className={isLoading ? "opacity-70" : ""}
      />
    </div>
  );
}
