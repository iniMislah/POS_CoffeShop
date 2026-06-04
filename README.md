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

- Admin: `fatma@galehkopi.local` / `admin123#`

## Deployment Trial

### Render Postgres

Gunakan konfigurasi berikut saat membuat database di Render:

- Name: `galehkopi-pos-db`
- Database: `galehkopi_pos`
- User: kosongkan agar Render generate otomatis
- Region: `Oregon (US West)`
- PostgreSQL Version: `18`
- Instance type: `Free`
- Storage: `1 GB`
- Storage Autoscaling: `Disabled`
- High Availability: `Disabled`

Catatan: field `Database` harus persis `galehkopi_pos` tanpa spasi di depan/belakang.

### Render Backend

Setelah database dibuat, deploy backend sebagai Web Service:

- Root Directory: kosong / root repository
- Build Command: `npm install && npx prisma generate && npm run build`
- Pre-Deploy Command: `npx prisma migrate deploy`
- Start Command: `npm start`

Environment variables backend:

```env
NODE_ENV=production
DATABASE_URL=<Internal Database URL dari galehkopi-pos-db>
APP_URL=https://<render-backend-url>
WEB_APP_URL=https://<netlify-frontend-url>
RECEIPT_PUBLIC_BASE_URL=https://<netlify-frontend-url>/receipt
JWT_SECRET=<secret-minimal-16-karakter>
JWT_EXPIRES_IN=7d
PAYMENT_GATEWAY_NAME=manual
PAYMENT_WEBHOOK_SECRET=
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
```

Gunakan `Internal Database URL` dari Render untuk `DATABASE_URL` karena backend dan database berada di region Render yang sama.

### Netlify Frontend

Deploy folder `web` ke Netlify:

- Base directory: `web`
- Build command: `npm run build`
- Publish directory: `.next`

Environment variables frontend:

```env
NEXT_PUBLIC_API_BASE_URL=https://<render-backend-url>/api
NEXT_PUBLIC_APP_URL=https://<netlify-frontend-url>
```

## Dokumentasi

- Swagger UI: `GET /docs`
- Health check: `GET /health`
