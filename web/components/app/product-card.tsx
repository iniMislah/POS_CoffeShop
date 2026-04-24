import Image from "next/image";

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
    <Card className="overflow-hidden p-0">
      <div className="relative h-36">
        <Image src={product.imageUrl || "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80"} alt={product.name} fill className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent p-4">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-coffee-900">{product.category?.name ?? "Menu"}</span>
        </div>
      </div>
      <CardContent className="space-y-4 pt-5">
        <div>
          <h3 className="text-base font-semibold text-coffee-900">{product.name}</h3>
          <p className="mt-1 text-sm text-coffee-700/65">{formatCurrency(Number(product.basePrice))}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {product.variants.slice(0, 2).map((variant) => (
            <span key={variant.id} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-coffee-700">
              {variant.name}
            </span>
          ))}
        </div>
        <Button className="w-full" variant={product.isAvailable ? "default" : "secondary"} disabled={!product.isAvailable || disabled} onClick={() => onAdd?.(product)}>
          {product.isAvailable ? (disabled ? "Processing..." : "Add to Cart") : "Sold Out"}
        </Button>
      </CardContent>
    </Card>
  );
}
