-- Add safer stock-out semantics while keeping existing data readable.
ALTER TYPE "StockMovementType" ADD VALUE IF NOT EXISTS 'STOCK_OUT';

ALTER TABLE "ingredients"
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "stockDeductedAt" TIMESTAMP(3);

ALTER TABLE "recipes"
  DROP CONSTRAINT IF EXISTS "recipes_productId_key";

ALTER TABLE "recipes"
  ADD COLUMN IF NOT EXISTS "variantId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "recipes_variantId_key"
  ON "recipes"("variantId");

CREATE INDEX IF NOT EXISTS "recipes_productId_idx"
  ON "recipes"("productId");

ALTER TABLE "recipes"
  ADD CONSTRAINT "recipes_variantId_fkey"
  FOREIGN KEY ("variantId") REFERENCES "product_variants"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
