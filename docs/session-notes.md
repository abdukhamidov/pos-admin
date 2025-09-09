# Сессия: Mini CRM + POS — заметки (актуальные)

## Обновления склада (2025-09-02)
- Добавлен пункт бокового меню Admin: `Остатки` (`/inventory`).
- Реализованы API:
  - `POST /api/admin/inventory/receipt` — приёмка, инкремент остатков по складу с логом движений.
  - `POST /api/admin/inventory/adjust` — корректировка (+/-) с причинами и проверкой на отрицательные остатки.
- Добавлена модель Prisma `StockMove` и перечисление `StockMoveType` для аудита движений.
- Страницы Admin:
  - `/inventory/receipt` — выбор склада, поиск товаров, строки приёмки с количеством и примечанием.
  - `/inventory/adjust` — выбор склада/товара, ввод delta (+/-), причина, примечание.
- Все операции защищены ролью `ADMIN`, валидированы через Zod и выполняются в транзакции.

## Отчёты: Поступления (2025-09-02)
- Новый отчёт в Admin: `/reports/receipts` — список приёмок (движения типа `RECEIPT`).
- Фильтры: даты (с/по), склад, поиск по товару/SKU.
- API: `GET /api/admin/reports/receipts` с параметрами `from`, `to`, `warehouseId`, `query` и др.

## UI: Уведомления (2025-09-02)
- Добавлен компонент тостов в UI-пакет: `@mini/ui` → `Toaster`, `toast.success|error|info|warning`.
- Подключено в админке: `apps/admin/app/layout.tsx` рендерит `<Toaster />` глобально.
- Заменены alert() на тосты на страницах склада: `/inventory/receipt`, `/inventory/adjust`.
- Как использовать:
  - `import { toast } from '@mini/ui'`
  - `toast.success({ title: 'Сохранено', description: 'Данные обновлены' })`

### Важное (troubleshooting)
- Если при приёмке/корректировке появляется 500 и в логах `TypeError: Cannot read properties of undefined (reading 'create')` в месте `stockMove.create`, значит Prisma-клиент не обновлён после добавления модели `StockMove`.
  - Выполнить: `npm run db:migrate && npm run db:generate` (или `npx prisma migrate dev` и `npx prisma generate`).
  - Эндпоинты теперь работают «best-effort»: лог движения не критичен и не ломает приёмку, но после генерации аудит будет писаться полноценно.

Проект: монорепозиторий с админ‑панелью и POS на Next.js + Prisma (MySQL).
- Аутентификация: cookie‑сессии (JWT через `jose`), httpOnly, SameSite=Lax.
- Роли: ADMIN/SELLER (RBAC в middleware обоих приложений).
- Часовой пояс: Asia/Tashkent. Валюта: UZS.

## Стек и структура
- Next.js 14 (App Router), React 18, TypeScript, Tailwind, shadcn‑совместимые UI.
- Prisma 5 + MySQL.
- Монорепо:
  - `apps/admin` — админка (:3000)
  - `apps/pos` — POS (:4000)
  - `packages/db` — Prisma schema + клиент + сид
  - `packages/ui` — общий UI (кнопки, input, card и т.д.)
  - `packages/auth` — cookie/JWT helpers (`SESSION_COOKIE`, sign/verify)
  - `packages/utils` — хелперы (TZ, формат ключа дня и пр.)

## Дефолтные пользователи (seed)
- `admin / admin123` — ADMIN
- `seller / seller123` — SELLER (привязан к филиалу `Main`)

## Быстрый старт (локально)
1) Node 18+ и npm 8+.
2) Установить зависимости: `npm install`
3) Окружение:
   - Корень: `.env` (для Prisma CLI, содержит `DATABASE_URL`, `SESSION_SECRET`)
   - Admin: `apps/admin/.env.local`
   - POS: `apps/pos/.env.local`
4) Поднять БД и инициализировать:
   - Docker (рекомендуется): `docker compose up -d db`
   - Затем: `npm run db:generate && npm run db:migrate && npm run db:seed`
5) Запуск dev‑серверов:
   - Админка: `npm run dev:admin` → http://localhost:3000
   - POS: `npm run dev:pos` → http://localhost:4000

## Скрипты (root)
- `dev:admin` / `dev:pos` — dev сервера
- `db:generate` — Prisma client generate
- `db:migrate` — миграции (dev)
- `db:seed` — сид данных
- `build:admin` / `build:pos` — сборка

## Модель данных (актуальная)
Реализована поддержка филиалов и складов с раздельными остатками товаров.

Основные сущности (см. `packages/db/prisma/schema.prisma`):
- `Branch` — филиал (уникальное имя)
- `Warehouse` — склад в филиале, флаг `isDefault` (склад по умолчанию)
- `Inventory` — остаток товара на складе (`productId + warehouseId` — уникально)
- `User` — `role`, опционально `branchId` (для SELLER обязателен)
- `Shift` — смена привязана к `branchId`
- `Sale` — привязана к `branchId`; уникальность чека по `@@unique([branchId, day, number])`
- `Product` — больше НЕ содержит `stock`; остатки — только в `Inventory`
- `SaleItem` — снимок `nameSnapshot`, `price`, `qty`, `subtotal`

Особенности:
- POS показывает и списывает остатки со склада по умолчанию филиала продавца.
- Нумерация чеков — по филиалу и дню.
- Завершение чека транзакционно уменьшает `Inventory` соответствующего склада.

## Админка (UI и функции)
Обновлённый минималистичный интерфейс:
- Общий каркас: левый сайдбар + верхняя панель (поиск, выход). `apps/admin/components/AdminShell.tsx`
- Разделы: Дашборд, Филиалы, Склады, Категории, Товары, Пользователи, Отчёты.
- Везде доступны быстрые действия: Добавить, Редактировать, Удалить.

Страницы:
- Товары — карточная сетка, поиск по названию, действия.
  - При добавлении товара выбирается склад и стартовый остаток — пишется в `Inventory`.
- Категории — компактные карточки с действиями.
- Пользователи — фильтр по роли, карточки. Для SELLER требуется привязка к филиалу.
- Филиалы — список, добавить/переименовать/удалить (запрет удаления при зависимостях).
- Склады — список, добавить, пометить «по умолчанию» в филиале, удалить (запрет при наличии остатков).
- Выход — `POST /api/logout` очищает cookie.

Технические правки:
- Серверные `fetch` на страницах используют абсолютный URL + прокидывают cookie (исправлено `ERR_INVALID_URL`).

## POS (функции)
- Логин → открытие смены (требуется филиал у продавца).
- Каталог — остатки берутся из склада по умолчанию филиала.
- Открытие чека → добавление позиций (проверка остатков в `Inventory`).
- Завершение чека — транзакция: списание из `Inventory`, закрытие продажи и привязка к смене.

## Эндпоинты (основные)
Админ:
- Категории: `GET/POST /api/admin/categories`, `PATCH/DELETE /api/admin/categories/[id]`
- Товары: `GET/POST /api/admin/products`, `PATCH/DELETE /api/admin/products/[id]`, `GET /api/admin/products/low-stock`
- Пользователи: `GET/POST /api/admin/users`, `PATCH/DELETE /api/admin/users/[id]`
- Филиалы: `GET/POST /api/admin/branches`, `PATCH/DELETE /api/admin/branches/[id]`
- Склады: `GET/POST /api/admin/warehouses`, `PATCH/DELETE /api/admin/warehouses/[id]`
- Статистика/отчёты/аудит — см. соответствующие роуты в `apps/admin/app/api/admin/*`

POS:
- Логин: `POST /api/login`
- Смены: `POST /api/pos/shifts/open|close`, `GET /api/pos/shifts/current`
- Чеки: `POST /api/pos/sales`, `PATCH /api/pos/sales/:id/(add-item|update-item|remove-item)`, `POST /api/pos/sales/:id/(complete|cancel)`
- Каталог: `GET /api/pos/categories`, `GET /api/pos/products`

## Миграция со старой схемы (где был `Product.stock`)
Вариант 1 (рекомендуется для dev): «reset»
```
npm run db:migrate   # если падает — пропустите
npx prisma migrate reset --force
npx prisma generate
npx prisma db seed
```

Вариант 2 (сохранить данные, вручную править SQL миграции)
1) Сгенерировать файл миграции без применения:
```
npx prisma migrate dev --create-only
```
2) В файле миграции (SQL) последовательно:
   - Создать дефолтные филиал и склад и запомнить их id (`br_default`, `wh_default`).
   - Добавить столбцы `branchId` как NULLable, заполнить значениями (`br_default`), затем сделать NOT NULL:
```
alter table "Shift" add column "branchId" text;
update "Shift" set "branchId"='br_default' where "branchId" is null;
alter table "Shift" alter column "branchId" set not null;

alter table "Sale" add column "branchId" text;
update "Sale" set "branchId"='br_default' where "branchId" is null;
alter table "Sale" alter column "branchId" set not null;
```
   - Переложить остатки из `Product.stock` в `Inventory` (до удаления колонки у `Product`):
```
insert into "Inventory"(id,"productId","warehouseId","qty")
select gen_random_uuid(), p.id, 'wh_default', coalesce(p.stock,0) from "Product" p;
```
   - Далее выполнить оставшиеся шаги миграции (удаление `Product.stock`, создание связей/индексов).
3) Применить миграцию и пересоздать клиент:
```
npx prisma migrate dev
npx prisma generate
```

## Частые проблемы и решения
- Unknown field `inventory` при `include` — клиент Prisma не обновлён: выполните `npm run db:migrate && npm run db:generate` (либо `npx prisma generate --clear-cache`).
- EPERM при `prisma generate` в OneDrive (Windows): остановить dev‑процессы, удалить `node_modules\.prisma`, снова `npm run db:generate`. Надёжное решение — перенести проект из OneDrive в обычную папку (`C:\\dev\\mini-crm`).
- `ERR_INVALID_URL` в серверном fetch — исправлено: страницы админки собирают абсолютный URL и прокидывают cookie.

## Сделано в этой сессии (changelog)
- Редизайн Admin/POS (shell, карточки, кнопки действий, поиск, модалки «Добавить»).
- CRUD‑действия для Категорий, Товаров, Пользователей (добавить/редактировать/удалить).
- Добавлены разделы и API для Филиалов/Складов; выбор склада при добавлении товара.
- Введена модель `Branch/Warehouse/Inventory`; продажа и смены привязаны к филиалу, списание из `Inventory`.
- Исправлены ошибки: относительные URL в RSC, idempotent remove‑item (P2025), null‑safe рендер в POS.

## Roadmap (дальше по желанию)
- Экран «Инвентарь»: приход/списание/перемещение между складами, журнал движений.
- Модалки редактирования (вместо prompt), валидация через Zod и UI‑формы.
- Пагинация/фильтры/экспорт в списках.
- Отчёты по филиалам/складам, графики.
## Что сделано (2025-09-02)
- POS: фильтр категорий, поиск по товарам, сетка карточек, добавление в корзину, индикация отсутствия на складе.
- Корзина: изменение количества, удаление позиций, очистка корзины, подсчет итоговой суммы.
- Оплата: диалог оплаты с методами cash/card/mixed, автоподстановка суммы, завершение продажи через API, состояние успеха.
- Смены: получение текущей смены, открытие/закрытие через API, отображение статуса в шапке, ввод начального/конечного остатка.
- История продаж: загрузка последних чеков с суммой, продавцом и составом; управление глубиной выборки.
- API-интеграции: /api/pos/categories, /api/pos/products, /api/pos/sales (создание, добавление позиции, завершение), /api/pos/shifts/*.
- Утилиты: форматирование денег и дат (Intl.NumberFormat, 	oLocaleString).
- UI: компоненты на базе shadcn (Button, Card, Dialog, Select, ScrollArea, Separator), адаптивная вёрстка.

\n## MySQL: переход и настройка
- База данных: MySQL 8 (Docker-сервис `db`).
- Строка подключения (`DATABASE_URL`):
  - локально: `mysql://root:password@localhost:3306/mini_crm`
  - в Docker: `mysql://root:password@db:3306/mini_crm`
- Prisma провайдер переключён на MySQL: см. `packages/db/prisma/schema.prisma` (datasource `provider = "mysql"`).
- Инициализация базы с нуля:
  - Запустить БД: `docker compose up -d db`
  - Сгенерировать клиент: `npm run db:generate`
  - Применить миграции (dev): `npm run db:migrate`
  - Засеять данные: `npm run db:seed`
- Если ранее были миграции под PostgreSQL — выполните сброс dev-окружения:
  - `npx prisma migrate reset --force`
  - `npx prisma generate`
  - `npm run db:seed`
