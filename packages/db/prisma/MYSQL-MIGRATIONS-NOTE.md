Migration note (MySQL)

- The project switched Prisma datasource to MySQL.
- If you previously used PostgreSQL migrations in this folder, they won’t apply to MySQL.
- For development, reset and recreate migrations against MySQL:
  1) Start DB: `docker compose up -d db`
  2) Reset: `npx prisma migrate reset --force`
  3) Generate: `npx prisma generate`
  4) Seed: `npm run db:seed`

Optionally recreate an initial migration: `npx prisma migrate dev --name init`.
