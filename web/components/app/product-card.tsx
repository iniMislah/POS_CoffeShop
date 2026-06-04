import Image from "next/image";
import { Plus } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  onAdd,
  disabled,
}: {
  product: Product;
  onAdd?: (product: Product) => void;
  disabled?: boolean;
}) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden border-[#E8D8C3]/75 bg-white p-0 transition duration-200 hover:-translate-y-0.5 hover:shadow-panel">
      <div className="relative h-40 overflow-hidden">
        <Image
          src={product.imageUrl || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"}
          alt={product.name}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#5A4032]/48 via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
          <span className="rounded-full border border-white/70 bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5A4032]">
            {product.category?.name ?? "Menu"}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
              product.isAvailable ? "bg-white/90 text-[#5A4032]" : "bg-white/90 text-rose-700"
            }`}
          >
            {product.isAvailable ? "Ready" : "Sold Out"}
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="text-xl font-semibold text-white">{product.name}</h3>
        </div>
      </div>
      <CardContent className="flex flex-1 flex-col pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-[#5A4032]/62">Harga</p>
            <p className="mt-1 text-2xl font-semibold text-[#5A4032]">{formatCurrency(Number(product.basePrice))}</p>
          </div>
          <div className="flex min-w-[86px] flex-col items-center rounded-2xl border border-[#E8D8C3] bg-[#FDFBF7] px-3 py-2 text-center">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#5A4032]/52">Varian</p>
            <p className="mt-1 text-sm font-semibold leading-none text-[#5A4032]">{product.variants.length}</p>
          </div>
        </div>
        <div className="mt-4 flex min-h-[72px] flex-wrap content-start gap-2">
          {product.variants.slice(0, 3).map((variant) => (
            <span key={variant.id} className="rounded-full border border-[#E8D8C3] bg-[#FDFBF7] px-3 py-1 text-xs font-medium text-[#5A4032]">
              {variant.name}
            </span>
          ))}
          {product.modifiers.slice(0, 2).map((modifier) => (
            <span key={modifier.id} className="rounded-full border border-[#E8D8C3]/80 bg-white px-3 py-1 text-xs font-medium text-[#5A4032]">
              + {modifier.name}
            </span>
          ))}
        </div>
        <Button
          className="mt-auto w-full"
          variant={product.isAvailable ? "default" : "secondary"}
          disabled={!product.isAvailable || disabled}
          onClick={() => onAdd?.(product)}
        >
          <Plus className="mr-2 h-4 w-4" />
          {product.isAvailable ? (disabled ? "Processing..." : "Add to Cart") : "Sold Out"}
        </Button>
      </CardContent>
    </Card>
  );
}
