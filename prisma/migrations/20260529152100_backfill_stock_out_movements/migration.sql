UPDATE "stock_movements"
SET "type" = 'STOCK_OUT'
WHERE "type" = 'SALE_DEDUCTION';
