"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Bell, BookOpen, Download, ImageIcon, Plus, Trash2, UploadCloud } from "lucide-react";
import { ModernSelect } from "@/components/ui/modern-select";
import { DataTable } from "@/components/app/data-table";
import { StatusBadge } from "@/components/app/status-badge";
import { Topbar } from "@/components/app/topbar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useCategories } from "@/hooks/use-categories";
import { useInventory } from "@/hooks/use-inventory";
import { useProducts } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";
import type { Product, Recipe } from "@/lib/types";
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

type RecipeFormItem = {
  ingredientId: string;
  qtyUsed: string;
};

type FormAlert = {
  title: string;
  message: string;
};

const parseTextareaOptions = (raw: string, label: string) => {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separatorIndex = line.indexOf(":");
      const match = separatorIndex === -1 ? line.match(/^(.*\S)\s+(\d+(?:\.\d+)?)$/) : null;
      const name = separatorIndex === -1 ? match?.[1]?.trim() ?? "" : line.slice(0, separatorIndex).trim();
      const value = Number(separatorIndex === -1 ? match?.[2] : line.slice(separatorIndex + 1).trim());

      if (!name) {
        throw new Error(`${label} baris ${index + 1} belum sesuai. Gunakan format Nama Harga atau Nama:Harga, contoh: Large 23000.`);
      }

      if (!Number.isFinite(value) || value < 0) {
        throw new Error(`${label} baris ${index + 1} harus memakai harga angka 0 atau lebih, contoh: Large 23000.`);
      }

      return { name, value };
    });
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

const maxProductImageSize = 1024 * 1024;
const allowedProductImageTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const productImageAccept = ".jpg,.jpeg,.png,.webp,image/jpeg,image/jpg,image/png,image/webp";
const productImageSizeMessage = "Ukuran gambar terlalu besar. Maksimal 1 MB.";
const productImageFormatMessage = "Format gambar harus JPG, JPEG, PNG, atau WEBP.";

const getProductValidationAlert = (form: FormState): FormAlert | null => {
  const basePrice = Number(form.basePrice);

  if (!form.name.trim()) {
    return { title: "Nama produk belum diisi", message: "Isi nama produk dengan jelas, contoh: Kopi Susu Gula Aren." };
  }

  if (!form.categoryId) {
    return { title: "Kategori belum dipilih", message: "Pilih kategori produk sebelum menyimpan menu." };
  }

  if (form.basePrice === "" || !Number.isFinite(basePrice) || basePrice < 0) {
    return { title: "Harga dasar tidak valid", message: "Gunakan angka 0 atau lebih, contoh: 18000." };
  }

  return null;
};

export default function MenuManagementPage() {
  const { token } = useAuth();
  const { pushToast } = useToast();
  const { products, isLoading, error, refetch } = useProducts(token);
  const { categories } = useCategories(token);
  const { ingredients } = useInventory(token);
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formAlert, setFormAlert] = useState<FormAlert | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [recipeVariantId, setRecipeVariantId] = useState("base");
  const [recipeItems, setRecipeItems] = useState<RecipeFormItem[]>([]);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);
  const [isRecipeSaving, setIsRecipeSaving] = useState(false);

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
    setImageFile(null);
    setFormAlert(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
    setOpen(true);
  };

  const openEdit = (product: Product) => {
    const basePrice = Number(product.basePrice);
    setEditingProduct(product);
    setImageFile(null);
    setForm({
      name: product.name,
      categoryId: product.categoryId,
      basePrice: String(basePrice),
      imageUrl: product.imageUrl ?? "",
      isAvailable: String(product.isAvailable),
      variants: product.variants.map((variant) => `${variant.name}:${basePrice + Number(variant.priceDelta)}`).join("\n"),
      modifiers: product.modifiers.map((modifier) => `${modifier.name}:${Number(modifier.price)}`).join("\n"),
    });
    setFormAlert(null);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!token) {
      return;
    }

    setIsSaving(true);
    setFormAlert(null);

    try {
      const validationAlert = getProductValidationAlert(form);
      if (validationAlert) {
        setFormAlert(validationAlert);
        return;
      }

      const basePrice = Number(form.basePrice);
      const variants = parseTextareaOptions(form.variants, "Variant").map((item) => ({
        name: item.name,
        priceDelta: item.value - basePrice,
      }));
      const modifiers = parseTextareaOptions(form.modifiers, "Modifier").map((item) => ({
        name: item.name,
        price: item.value,
      }));

      const payload: {
        name: string;
        categoryId: string;
        basePrice: number;
        imageUrl?: string | null;
        isAvailable: boolean;
        variants: Array<{ name: string; priceDelta: number }>;
        modifiers: Array<{ name: string; price: number }>;
      } = {
        name: form.name,
        categoryId: form.categoryId,
        basePrice,
        isAvailable: form.isAvailable === "true",
        variants,
        modifiers,
      };

      if (!editingProduct || form.imageUrl !== (editingProduct.imageUrl ?? "")) {
        payload.imageUrl = form.imageUrl || null;
      }

      const requestBody =
        imageFile
          ? (() => {
              const formData = new FormData();
              formData.append("name", payload.name);
              formData.append("categoryId", payload.categoryId);
              formData.append("basePrice", String(payload.basePrice));
              formData.append("image", imageFile);
              formData.append("isAvailable", String(payload.isAvailable));
              formData.append("variants", JSON.stringify(payload.variants));
              formData.append("modifiers", JSON.stringify(payload.modifiers));
              return formData;
            })()
          : payload;

      if (editingProduct) {
        await apiClient.put(`/products/${editingProduct.id}`, requestBody, token);
      } else {
        await apiClient.post<Product>("/products", requestBody, token);
      }
      await refetch();

      pushToast({
        type: "success",
        title: editingProduct ? "Product updated" : "Product created",
        description: "Menu data saved successfully.",
      });

      setOpen(false);
      setEditingProduct(null);
      setImageFile(null);
      setForm(emptyForm);
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to save product.";
      setFormAlert({
        title: "Produk belum bisa disimpan",
        message,
      });
      pushToast({
        type: "error",
        title: "Save failed",
        description: message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!token) {
      return;
    }

    setIsExporting(true);

    try {
      const { blob, fileName } = await apiClient.download("/products/export", token);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(url);

      pushToast({
        type: "success",
        title: "Export ready",
        description: `${fileName} downloaded.`,
      });
    } catch (exportError) {
      pushToast({
        type: "error",
        title: "Export failed",
        description: exportError instanceof Error ? exportError.message : "Unable to export product list.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImageChange = async (file: File | null) => {
    if (!file) {
      setImageFile(null);
      setForm((current) => ({ ...current, imageUrl: "" }));
      return;
    }

    const imageValidationAlert = !allowedProductImageTypes.has(file.type)
      ? { title: "Format gambar tidak valid", message: productImageFormatMessage }
      : file.size > maxProductImageSize
        ? { title: "Ukuran gambar terlalu besar", message: productImageSizeMessage }
        : null;

    if (imageValidationAlert) {
      setImageFile(null);
      setFormAlert(imageValidationAlert);
      pushToast({
        type: "error",
        title: "Image upload failed",
        description: imageValidationAlert.message,
      });
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
      setImageFile(file);
      setFormAlert(null);
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
      const result = await apiClient.delete<{ mode: "soft-delete" | "hard-delete" }>(`/products/${product.id}`, token);
      await refetch();
      pushToast({
        type: "success",
        title: result.mode === "soft-delete" ? "Product archived" : "Product deleted",
        description:
          result.mode === "soft-delete"
            ? "Product disembunyikan dari Product Management agar riwayat transaksi tetap aman."
            : "Product removed successfully.",
      });
    } catch (deleteError) {
      pushToast({
        type: "error",
        title: "Delete failed",
        description: deleteError instanceof Error ? deleteError.message : "Unable to delete product.",
      });
    }
  };

  const loadRecipe = async (product: Product, selectedVariantId: string) => {
    if (!token) {
      return;
    }

    setIsRecipeLoading(true);

    try {
      const query = selectedVariantId === "base" ? "" : `?variantId=${encodeURIComponent(selectedVariantId)}`;
      const recipe = await apiClient.get<Recipe>(`/recipes/product/${product.id}${query}`, token);
      setRecipeItems(
        recipe.recipeItems.map((item) => ({
          ingredientId: item.ingredientId,
          qtyUsed: String(Number(item.qtyUsed)),
        })),
      );
    } catch {
      setRecipeItems([]);
    } finally {
      setIsRecipeLoading(false);
    }
  };

  const openRecipe = (product: Product) => {
    setRecipeProduct(product);
    setRecipeVariantId("base");
    setRecipeItems([]);
    setRecipeOpen(true);
    void loadRecipe(product, "base");
  };

  const handleRecipeVariantChange = (value: string) => {
    if (!recipeProduct) {
      return;
    }

    setRecipeVariantId(value);
    void loadRecipe(recipeProduct, value);
  };

  const addRecipeItem = () => {
    setRecipeItems((current) => [
      ...current,
      {
        ingredientId: ingredients.find((ingredient) => !current.some((item) => item.ingredientId === ingredient.id))?.id ?? "",
        qtyUsed: "",
      },
    ]);
  };

  const removeRecipeItem = (index: number) => {
    setRecipeItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveRecipe = async () => {
    if (!token || !recipeProduct) {
      return;
    }

    const normalizedItems = recipeItems.map((item) => ({
      ingredientId: item.ingredientId,
      qtyUsed: Number(item.qtyUsed),
    }));

    const invalidItem = normalizedItems.find(
      (item) => !item.ingredientId || !Number.isFinite(item.qtyUsed) || item.qtyUsed <= 0,
    );

    if (normalizedItems.length === 0 || invalidItem) {
      pushToast({
        type: "error",
        title: "Recipe belum valid",
        description: "Pilih ingredient dan isi quantity lebih dari 0 untuk setiap baris.",
      });
      return;
    }

    const duplicateIngredient = normalizedItems.find(
      (item, index) => normalizedItems.findIndex((candidate) => candidate.ingredientId === item.ingredientId) !== index,
    );

    if (duplicateIngredient) {
      pushToast({
        type: "error",
        title: "Recipe belum valid",
        description: "Ingredient yang sama cukup dipilih sekali per recipe.",
      });
      return;
    }

    setIsRecipeSaving(true);

    try {
      await apiClient.put(
        `/recipes/product/${recipeProduct.id}`,
        {
          variantId: recipeVariantId === "base" ? null : recipeVariantId,
          items: normalizedItems,
        },
        token,
      );

      pushToast({
        type: "success",
        title: "Recipe saved",
        description: `${recipeProduct.name} recipe updated.`,
      });

      setRecipeOpen(false);
      setRecipeProduct(null);
      setRecipeItems([]);
    } catch (recipeError) {
      pushToast({
        type: "error",
        title: "Recipe save failed",
        description: recipeError instanceof Error ? recipeError.message : "Unable to save recipe.",
      });
    } finally {
      setIsRecipeSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Topbar title="Menu Management" subtitle="Manage live menu products, variants, modifiers, and availability from the real database." />
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => void handleExport()} disabled={isExporting}>
          <Download className="mr-2 h-4 w-4" /> {isExporting ? "Exporting..." : "Export Excel"}
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-[#E8D8C3] bg-white">
            <DialogTitle className="text-3xl font-semibold text-coffee-900">{editingProduct ? "Edit Product" : "Create Product"}</DialogTitle>
            <DialogDescription className="text-coffee-700/70">
              Atur nama produk, kategori, harga, foto, varian, dan modifier dalam tampilan yang lebih rapi dan konsisten.
            </DialogDescription>
            {formAlert ? (
              <div className="mt-5 flex gap-3 rounded-[20px] border border-[#D9C6AF] bg-[#FCF4E8] px-4 py-3 text-sm text-[#5A4032]">
                <Bell className="mt-0.5 h-4 w-4 shrink-0 text-[#7A543D]" />
                <div>
                  <p className="font-semibold">{formAlert.title}</p>
                  <p className="mt-1 leading-relaxed text-[#5A4032]/75">{formAlert.message}</p>
                </div>
              </div>
            ) : null}
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Product Name</label>
                <Input
                  value={form.name}
                  placeholder="Enter product name"
                  className="h-12 rounded-[20px] bg-[#FDFBF7]"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Category</label>
                <ModernSelect
                  value={form.categoryId}
                  placeholder="Choose category"
                  options={categories.map((category) => ({
                    value: String(category.id),
                    label: category.name,
                  }))}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      categoryId: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Base Price</label>
                <Input
                  type="number"
                  value={form.basePrice}
                  placeholder="Enter base price"
                  className="h-12 rounded-[20px] bg-[#FDFBF7]"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      basePrice: event.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Product Image</label>
                <div className="rounded-[20px] border border-[#E8D8C3] bg-white p-3 shadow-[0_10px_24px_rgba(90,64,50,0.05)]">
                  <label className="flex cursor-pointer items-center justify-center gap-3 rounded-[16px] border border-dashed border-[#D9C6AF] bg-[#FDFBF7] px-4 py-4 text-sm font-medium text-[#5A4032] transition hover:border-[#C8AF93] hover:bg-white">
                    <UploadCloud className="h-4 w-4" />
                    <span>Choose image file</span>
                    <Input
                      type="file"
                      accept={productImageAccept}
                      className="hidden"
                      onChange={(event) => {
                        void handleImageChange(event.target.files?.[0] ?? null);
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>

                  {form.imageUrl ? (
                    <div className="mt-3 overflow-hidden rounded-[18px] border border-[#E8D8C3]/70 bg-[#FDFBF7] p-2">
                      <div className="relative h-32 overflow-hidden rounded-xl">
                        <Image src={form.imageUrl} alt="Product preview" fill className="object-cover" />
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 rounded-[16px] bg-[#FDFBF7] px-4 py-3 text-sm text-[#5A4032]/65">
                      <ImageIcon className="h-4 w-4" />
                      <span>No image selected yet</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Availability</label>
                <ModernSelect
                  value={form.isAvailable}
                  placeholder="Select availability"
                  options={[
                    { value: "true", label: "Available" },
                    { value: "false", label: "Sold Out" },
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isAvailable: value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Variants</label>
                <Textarea
                  value={form.variants}
                  placeholder={"Option A:22000\nOption B:25000"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      variants: event.target.value,
                    }))
                  }
                  className="min-h-[140px] resize-none rounded-[20px] bg-[#FDFBF7]"
                />
                <p className="mt-2 text-xs text-coffee-700/55">
                  Isi varian sebagai harga final opsi. Sistem akan otomatis menyimpan selisihnya terhadap base price.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-coffee-900">Modifiers / Add-ons</label>
                <Textarea
                  value={form.modifiers}
                  placeholder={"Extra Shot:5000\nOat Milk:8000\nCaramel Syrup:6000"}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      modifiers: event.target.value,
                    }))
                  }
                  className="min-h-[140px] resize-none rounded-[20px] bg-[#FDFBF7]"
                />
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
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(row)}>Edit</Button>
                <Button variant="outline" size="sm" onClick={() => openRecipe(row)}>
                  <BookOpen className="mr-2 h-4 w-4" /> Atur Recipe
                </Button>
                <Button variant="secondary" size="sm" onClick={() => void handleDelete(row)}>Delete</Button>
              </div>
            ),
          },
        ]}
        data={preparedRows}
        className={isLoading ? "opacity-70" : ""}
      />

      <Dialog open={recipeOpen} onOpenChange={setRecipeOpen}>
        <DialogContent className="max-h-[88vh] max-w-3xl overflow-y-auto border-[#E8D8C3] bg-white">
          <DialogTitle className="text-3xl font-semibold text-coffee-900">Atur Recipe</DialogTitle>
          <DialogDescription className="text-coffee-700/70">
            {recipeProduct?.name ?? "-"}
          </DialogDescription>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-coffee-900">Variant</label>
              <ModernSelect
                value={recipeVariantId}
                placeholder="Pilih variant"
                options={[
                  { value: "base", label: "Product utama" },
                  ...(recipeProduct?.variants ?? []).map((variant) => ({
                    value: variant.id,
                    label: variant.name,
                  })),
                ]}
                onChange={handleRecipeVariantChange}
              />
            </div>

            <div className="space-y-3">
              {recipeItems.map((item, index) => {
                const selectedIngredient = ingredients.find((ingredient) => ingredient.id === item.ingredientId);

                return (
                  <div key={`${item.ingredientId}-${index}`} className="grid gap-3 md:grid-cols-[1fr_140px_80px_44px]">
                    <ModernSelect
                      value={item.ingredientId}
                      placeholder="Pilih ingredient"
                      options={ingredients.map((ingredient) => ({
                        value: ingredient.id,
                        label: ingredient.name,
                      }))}
                      onChange={(value) =>
                        setRecipeItems((current) =>
                          current.map((recipeItem, itemIndex) =>
                            itemIndex === index ? { ...recipeItem, ingredientId: value } : recipeItem,
                          ),
                        )
                      }
                    />
                    <Input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.qtyUsed}
                      placeholder="Qty"
                      className="h-12 rounded-[20px] bg-[#FDFBF7]"
                      onChange={(event) =>
                        setRecipeItems((current) =>
                          current.map((recipeItem, itemIndex) =>
                            itemIndex === index ? { ...recipeItem, qtyUsed: event.target.value } : recipeItem,
                          ),
                        )
                      }
                    />
                    <div className="flex h-12 items-center rounded-[20px] border border-[#E8D8C3] bg-[#FDFBF7] px-4 text-sm font-medium text-coffee-800">
                      {selectedIngredient?.unit ?? "-"}
                    </div>
                    <Button variant="secondary" size="sm" className="h-12 w-11 px-0" onClick={() => removeRecipeItem(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {recipeItems.length === 0 ? (
                <div className="rounded-[20px] border border-dashed border-[#D9C6AF] bg-[#FDFBF7] px-4 py-5 text-sm text-coffee-700/70">
                  {isRecipeLoading ? "Loading recipe..." : "Belum ada ingredient pada recipe ini."}
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button variant="secondary" onClick={addRecipeItem} disabled={ingredients.length === 0}>
                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
              </Button>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setRecipeOpen(false)}>Cancel</Button>
                <Button onClick={() => void handleSaveRecipe()} disabled={isRecipeSaving || isRecipeLoading}>
                  {isRecipeSaving ? "Saving..." : "Save Recipe"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
