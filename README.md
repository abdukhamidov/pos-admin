Mini CRM + POS (Monorepo)

Stack: Next.js (App Router), React 18, TypeScript, Tailwind, shadcn/ui, Prisma (PostgreSQL). Auth via signed cookie (Credentials). RBAC: ADMIN, SELLER. TZ: Asia/Tashkent. Currency: UZS.

Structure

mini-crm/
- apps/
  - admin/ (port 3000)
  - pos/ (port 4000)
- packages/
  - db/ (Prisma schema + client + seed)
  - ui/ (shared UI components)
  - auth/ (cookie/JWT helpers)
  - utils/ (date/tz helpers)
- docker-compose.yml
- .env.example

Quick Start

1) Copy env: cp .env.example .env
2) Install deps: npm install
3) Migrate/seed DB: npm run db:migrate && npm run db:seed
4) Dev servers:
   - Admin: npm run dev:admin (http://localhost:3000)
   - POS:   npm run dev:pos   (http://localhost:4000)

Docker

- docker compose up --build

Default Users (seed)

- admin / admin123  (ADMIN)
- seller / seller123 (SELLER)

Entity Diagram (Prisma)

- User(id, username unique, passwordHash, name, role, createdAt, updatedAt)
- Category(id, name unique, description?, createdAt, updatedAt)
- Product(id, name, sku? unique, price int, stock int, isActive bool, categoryId, createdAt, updatedAt)
- Shift(id, sellerId→User, startedAt, endedAt?, openingNote?, closingNote?, openingCash?, closingCash?)
- Sale(id, day YYYY-MM-DD, number int(uniq per day), sellerId→User, shiftId?, status OPEN|CANCELLED|COMPLETED, total int, createdAt, closedAt?)
- SaleItem(id, saleId→Sale, productId→Product, nameSnapshot, price, qty, subtotal)
- AuditLog(id, userId?, action, meta JSON, createdAt)

Key Rules

- Complete sale decrements Product.stock by qty.
- SaleItem stores nameSnapshot and price for historical accuracy.
- SELLER cannot mutate admin resources; ADMIN full access.
- Pages protected via middleware; cookie is httpOnly, SameSite=Lax.

API (selected)

- Admin:
  - GET /api/admin/stats/today
  - CRUD /api/admin/categories, /products, /users
  - GET /api/admin/reports/sales, /reports/shifts, /revenue-by-day
  - GET /api/admin/products/low-stock
  - GET /api/admin/audit
- POS:
  - POST /api/pos/shifts/open, /shifts/close, GET /shifts/current
  - POST /api/pos/sales, PATCH /api/pos/sales/:id/*, POST /api/pos/sales/:id/(complete|cancel)
  - GET /api/pos/categories, /products

Scripts

- npm run db:migrate, db:seed, dev:admin, dev:pos, build:admin, build:pos

Testing (smoke)

- Jest + Playwright basic scaffolding planned. See packages later.

Security

- bcrypt (10–12 rounds) for hashes
- httpOnly cookie, SameSite=Lax
- Zod validation for inputs

