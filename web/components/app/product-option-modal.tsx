"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PosProduct } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

type ProductOptionModalProps = {
  open: boolean;
  product: PosProduct | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (selection: {
    variant: PosProduct["variants"][number] | null;
    modifiers: PosProduct["modifiers"];
  }) => void;
};

export function ProductOptionModal({
  open,
  product,
  onOpenChange,
  onConfirm,
}: ProductOptionModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);
  const [modifierDropdownOpen, setModifierDropdownOpen] = useState(false);

  const variantDropdownRef = useRef<HTMLDivElement | null>(null);
  const modifierDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open || !product) {
      return;
    }

    setSelectedVariantId(null);
    setSelectedModifierIds([]);
    setVariantDropdownOpen(false);
    setModifierDropdownOpen(false);
  }, [open, product]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;

      if (
        variantDropdownRef.current &&
        !variantDropdownRef.current.contains(target)
      ) {
        setVariantDropdownOpen(false);
      }

      if (
        modifierDropdownRef.current &&
        !modifierDropdownRef.current.contains(target)
      ) {
        setModifierDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  const selectedVariant = useMemo(
    () =>
      product?.variants.find((variant) => variant.id === selectedVariantId) ?? null,
    [product, selectedVariantId]
  );

  const selectedModifiers = useMemo(
    () =>
      product?.modifiers.filter((modifier) =>
        selectedModifierIds.includes(modifier.id)
      ) ?? [],
    [product, selectedModifierIds]
  );

  const finalPrice = useMemo(() => {
    if (!product) {
      return 0;
    }

    const basePrice = Number(product.basePrice);
    const selectedVariantPrice = selectedVariant
      ? Number(selectedVariant.priceDelta)
      : 0;
    const selectedModifiersPrice = selectedModifiers.reduce(
      (sum, modifier) => sum + Number(modifier.price),
      0
    );

    return basePrice + selectedVariantPrice + selectedModifiersPrice;
  }, [product, selectedModifiers, selectedVariant]);

  if (!product) {
    return null;
  }

  const hasVariants = product.variants.length > 0;
  const hasModifiers = product.modifiers.length > 0;

  const variantSummaryLabel = selectedVariant
    ? `${selectedVariant.name} — ${formatCurrency(
        Number(product.basePrice) + Number(selectedVariant.priceDelta)
      )}`
    : `Original — ${formatCurrency(Number(product.basePrice))}`;

  const modifierSummaryLabel =
    selectedModifiers.length === 0
      ? "Tanpa modifier"
      : selectedModifiers.length === 1
      ? selectedModifiers[0].name
      : `${selectedModifiers[0].name} + ${selectedModifiers.length - 1} modifier`;

  const handleToggleModifier = (modifierId: string) => {
    setSelectedModifierIds((current) =>
      current.includes(modifierId)
        ? current.filter((id) => id !== modifierId)
        : [...current, modifierId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] max-w-2xl flex-col overflow-hidden border-[#E8D8C3]/80 bg-white p-0 shadow-[0_28px_68px_rgba(90,64,50,0.14)]">
        <div className="shrink-0 border-b border-[#E8D8C3]/70 bg-[#FDFBF7] px-8 py-6">
          <p className="text-xs uppercase tracking-[0.24em] text-[#5A4032]/48">
            Customize Order
          </p>
          <DialogTitle className="mt-3 text-3xl font-semibold">
            {product.name}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-xl text-sm text-[#5A4032]/70">
            Pilih opsi dan add-ons yang sudah dibuat dari Menu Management.
            Harga langsung menyesuaikan secara otomatis.
          </DialogDescription>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 rounded-[28px] border border-[#E8D8C3] bg-[#FDFBF7] px-5 py-4 shadow-[0_14px_28px_rgba(90,64,50,0.06)]">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#5A4032]/48">
                  Base Price
                </p>
                <p className="mt-2 text-lg font-semibold text-[#5A4032]">
                  {formatCurrency(Number(product.basePrice))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.22em] text-[#5A4032]/48">
                  Final Unit Price
                </p>
                <p className="mt-2 text-2xl font-semibold text-[#5A4032]">
                  {formatCurrency(finalPrice)}
                </p>
              </div>
            </div>

            {hasVariants ? (
              <section className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#5A4032]/48">
                    Product Option
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#5A4032]">
                    Pilih variant
                  </h3>
                </div>

                <div className="relative" ref={variantDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setVariantDropdownOpen((current) => !current)
                    }
                    className="flex min-h-[58px] w-full items-center justify-between gap-4 rounded-[22px] border border-[#E8D8C3] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(90,64,50,0.05)] transition hover:bg-[#FDFBF7]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/46">
                        Variant
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#5A4032]">
                        {variantSummaryLabel}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-[#5A4032]/60 transition-transform",
                        variantDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {variantDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-[#E8D8C3] bg-white p-2 shadow-[0_24px_54px_rgba(90,64,50,0.12)]">
                      <div className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVariantId(null);
                            setVariantDropdownOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between gap-4 rounded-[18px] px-4 py-3 text-left transition",
                            selectedVariantId === null
                              ? "bg-[#FDFBF7] text-[#5A4032]"
                              : "text-[#5A4032]/82 hover:bg-[#FDFBF7]"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold">Original</p>
                            <p className="mt-1 text-sm text-[#5A4032]/68">
                              {formatCurrency(Number(product.basePrice))}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                              selectedVariantId === null
                                ? "border-[#5A4032] bg-[#5A4032] text-white"
                                : "border-[#D9C6AF] bg-white text-transparent"
                            )}
                          >
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        </button>

                        {product.variants.map((variant) => {
                          const optionPrice =
                            Number(product.basePrice) +
                            Number(variant.priceDelta);
                          const isSelected = selectedVariantId === variant.id;

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(variant.id);
                                setVariantDropdownOpen(false);
                              }}
                              className={cn(
                                "flex w-full items-center justify-between gap-4 rounded-[18px] px-4 py-3 text-left transition",
                                isSelected
                                  ? "bg-[#FDFBF7] text-[#5A4032]"
                                  : "text-[#5A4032]/82 hover:bg-[#FDFBF7]"
                              )}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold">{variant.name}</p>
                                <p className="mt-1 text-sm text-[#5A4032]/68">
                                  {formatCurrency(optionPrice)}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                  isSelected
                                    ? "border-[#5A4032] bg-[#5A4032] text-white"
                                    : "border-[#D9C6AF] bg-white text-transparent"
                                )}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {hasModifiers ? (
              <section className="space-y-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-[#5A4032]/48">
                    Add-ons
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-[#5A4032]">
                    Pilih modifier
                  </h3>
                  <p className="mt-1 text-sm text-[#5A4032]/62">
                    Modifier opsional. Biarkan kosong jika tidak diperlukan.
                  </p>
                </div>

                <div className="relative" ref={modifierDropdownRef}>
                  <button
                    type="button"
                    onClick={() =>
                      setModifierDropdownOpen((current) => !current)
                    }
                    className="flex min-h-[58px] w-full items-center justify-between gap-4 rounded-[22px] border border-[#E8D8C3] bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(90,64,50,0.05)] transition hover:bg-[#FDFBF7]"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-[0.18em] text-[#5A4032]/46">
                        Modifier
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#5A4032]">
                        {modifierSummaryLabel}
                      </p>
                    </div>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-[#5A4032]/60 transition-transform",
                        modifierDropdownOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {modifierDropdownOpen ? (
                    <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 overflow-hidden rounded-[22px] border border-[#E8D8C3] bg-white p-2 shadow-[0_24px_54px_rgba(90,64,50,0.12)]">
                      <div className="max-h-[280px] space-y-1 overflow-y-auto pr-1">
                        {product.modifiers.map((modifier) => {
                          const isSelected = selectedModifierIds.includes(
                            modifier.id
                          );
                          const modifierPrice = Number(modifier.price);

                          return (
                            <button
                              key={modifier.id}
                              type="button"
                              onClick={() => handleToggleModifier(modifier.id)}
                              className={cn(
                                "flex w-full items-center justify-between gap-4 rounded-[18px] px-4 py-3 text-left transition",
                                isSelected
                                  ? "bg-[#FDFBF7] text-[#5A4032]"
                                  : "text-[#5A4032]/82 hover:bg-[#FDFBF7]"
                              )}
                            >
                              <div className="min-w-0">
                                <p className="font-semibold">{modifier.name}</p>
                                <p className="mt-1 text-sm text-[#5A4032]/68">
                                  {modifierPrice > 0
                                    ? formatCurrency(modifierPrice)
                                    : "Included"}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                                  isSelected
                                    ? "border-[#5A4032] bg-[#5A4032] text-white"
                                    : "border-[#D9C6AF] bg-white text-transparent"
                                )}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className="sticky bottom-0 shrink-0 border-t border-[#E8D8C3]/70 bg-white px-8 py-5">
          <div className="flex flex-col gap-4 rounded-[28px] border border-[#E8D8C3] bg-[#FDFBF7] p-5 shadow-[0_14px_28px_rgba(90,64,50,0.06)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-[#E8D8C3] bg-white p-3 text-[#5A4032]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#5A4032]">
                  Ringkasan pilihan
                </p>
                <p className="mt-1 text-sm text-[#5A4032]/68">
                  {selectedVariant ? `${selectedVariant.name}` : "Original"}
                  {selectedModifiers.length > 0
                    ? `, ${selectedModifiers
                        .map((modifier) => modifier.name)
                        .join(", ")}`
                    : ", tanpa modifier"}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Batal
              </Button>
              <Button
                onClick={() =>
                  onConfirm({
                    variant: selectedVariant,
                    modifiers: selectedModifiers,
                  })
                }
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
