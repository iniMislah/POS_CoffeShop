# Coffee Shop POS Backend

Backend REST API MVP untuk aplikasi kasir coffee shop menggunakan Node.js, Express, TypeScript, Prisma ORM, dan PostgreSQL.

## Fitur

- Auth JWT dengan role `ADMIN` dan `CASHIER`
- CRUD master data: users, categories, products, variants, modifiers, ingredients
- Inventory: stock in, adjustment, low stock, stock movements
- Recipes dan HPP sederhana
- Orders draft, add items, checkout, cancel
- Payments cash dan mock QRIS
- Digital receipt publik via token
- Reports dan export-ready responses
- OpenAPI docs via Swagger UI

## Struktur

```text
src/
  config/
  common/
  lib/
  middlewares/
  docs/
  modules/
    auth/
    users/
    categories/
    products/
    modifiers/
    ingredients/
    recipes/
    inventory/
    orders/
    payments/
    receipts/
    reports/
```

## Menjalankan

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Kredensial Seed

- Admin: `admin@kopikita.local` / `Admin123!`
- Cashier: `cashier@kopikita.local` / `Cashier123!`

## Dokumentasi

- Swagger UI: `GET /docs`
- Health check: `GET /health`
