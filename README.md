# Heizen Master Template

A production-ready full-stack monorepo — **NestJS 11** + **Next.js 16** — with a shared UI kit, shadcn charts, and Prisma on SQLite. There is no authentication — every page and API route is public.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Monorepo** | pnpm workspaces + Turborepo v2 |
| **Backend** | NestJS 11, TypeScript 5.9 |
| **Frontend** | Next.js 16 (App Router), React 19, React Compiler |
| **Database** | SQLite + Prisma ORM (`@prisma/adapter-better-sqlite3`) |
| **Styling** | Tailwind CSS 4 + `@repo/ui` (shadcn-derived) |
| **Charts** | shadcn chart (`@repo/ui/components/chart`, Recharts) |
| **State / Data** | TanStack Query v5 |
| **Forms** | react-hook-form + Zod |
| **Logging** | nestjs-pino (pino-pretty in dev) |
| **Rate limiting** | `@nestjs/throttler` (global guard) |
| **Linting / Formatting** | Biome v2 |

---

## Monorepo Structure

```
.
├── apps/
│   ├── server/              # NestJS backend
│   └── web/                 # Next.js frontend
├── packages/
│   ├── db/                  # @repo/db — Prisma schema & generated client
│   ├── shared/              # @repo/shared — shared types, enums, utils
│   ├── ui/                  # @repo/ui — React component library
│   └── typescript-config/   # Shared tsconfig presets
├── docs/                    # Product documentation — served at /docs in the app
├── turbo.json
└── pnpm-workspace.yaml
```

`docs/` holds the product documentation written for clients and stakeholders — what the
product does, what it can and cannot do, and how its key processes work. It is served inside
the running app at `/docs`, with the sidebar generated from the folder: folders become
sections, and a new Markdown file appears on its own with no code change. The pages that ship
with the template are meant to be tailored to the product.

---

## Setup

### Prerequisites

- Node.js ≥ 20, pnpm ≥ 11.5

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create env files

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env
```

The defaults work for local development. `DATABASE_URL` points to the SQLite file at `packages/db/prisma/dev.db`, which is created on the first migration. The server reads env vars through `apps/server/src/common/config.ts`, and the web app through `apps/web/src/config/index.ts`.

### 3. Run the app

```bash
pnpm db:migrate
pnpm db:generate
pnpm db:seed
pnpm dev
```

Backend: `http://localhost:3001` · Frontend: `http://localhost:3000` · Swagger: `http://localhost:3001/docs`

### Demo data and server tests

`pnpm db:seed` creates 10,000 synthetic employees, one initial compensation history entry per employee, and five fixed demo FX rates. It uses `apps/server/.env` through the server config, with the same database as the app. Names come from seeded, country-specific Faker locales with English fallback. Fixed randomness, IDs, and dates make the generated data repeatable with the pinned Faker version; upgrading Faker may change generated names. Salaries vary by country, department, and level, with deliberate outliers; these are not real employee records or market FX quotes.

The seed runs in one transaction and requires all three application tables to be empty. A rerun exits with an error and preserves existing data; it never resets the database. For a new demo dataset, configure a separate empty database, apply migrations, then seed it. `pnpm db:deploy` applies checked-in migrations without creating new ones.

```bash
pnpm --filter server test  # business-rule and SQLite integration tests
pnpm ready                # generation, lint, and typecheck; does not run tests
```

Integration tests apply the checked-in migration SQL to temporary SQLite files and remove them afterward. They do not use the development database. Routine tests use small fixtures; the full 10,000-row seed is verified separately. Calculation and input decisions are in [docs/PRODUCT_RULES.md](docs/PRODUCT_RULES.md).

---

## Rate Limiting

All API routes are rate-limited globally via [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting). `ThrottlerGuard` is registered as an `APP_GUARD` in `apps/server/src/app.module.ts`, so every controller inherits the limit unless you opt out.

### Default limits

| Throttler | TTL | Limit |
|---|---|---|
| `default` | 60 seconds | 300 requests |

When a client exceeds the limit, the server responds with **429 Too Many Requests**.

### Exempting a route

Use `@SkipThrottle()` on a handler or controller to bypass rate limiting. The health check at `GET /api/health` is exempt so load balancers and uptime monitors are not throttled:

```typescript
import { SkipThrottle } from '@nestjs/throttler';

@Get('health')
@SkipThrottle()
healthCheck() { /* ... */ }
```

### Per-route limits

To override the default on a specific route, use `@Throttle()`:

```typescript
import { Throttle } from '@nestjs/throttler';

@Throttle({ default: { limit: 10, ttl: 60_000 } })
@Post('sensitive-action')
sensitiveAction() { /* ... */ }
```

To change the global defaults, edit `ThrottlerModule.forRoot()` in `app.module.ts`.

---

## Database & Prisma

The database is **SQLite**. The schema lives at `packages/db/prisma/schema.prisma` and is shared across the monorepo. `packages/db/prisma.config.ts` loads `apps/server/.env`, so the Prisma CLI and the server use the same `DATABASE_URL`. The Prisma client is generated into `packages/db/generated/prisma/` and used only on the backend via `PrismaService`.

### Schema conventions

- Use `@id @default(uuid())` for primary keys — no Postgres-only attributes such as `@db.Uuid`
- Add `@@index` for any field you filter by frequently
- Use `onDelete: Cascade` on foreign keys where deleting the parent should remove children
- Always include `createdAt` and `updatedAt` on application models

### After changing the schema

```bash
pnpm db:migrate    # creates a migration file and applies it (dev)
pnpm db:generate   # regenerates the Prisma client
```

---

## Frontend — Key Conventions

### Route groups

- `(main)/` — app pages, rendered inside the sidebar layout. There is no auth, so every page is public.

### HTTP calls

Never call `fetch` or `axios` directly in components. The pattern is:

```
Component → TanStack Query hook → Service → ApiClient
```

- **Services** (`src/services/`) — static classes that call `ApiClient`
- **Queries** (`src/queries/`) — TanStack Query hooks that call services
- **Components** — consume hooks only

`ApiClient` throws `Error(message)` using the server's error message, which you can catch and display directly.

### Breadcrumbs

Breadcrumbs are auto-generated from the URL path. You get this for free on every `(main)` page without any configuration.

**For dynamic segments** (e.g. `/orders/[orderId]`), the breadcrumb will show a skeleton until you register the human-readable label. Do this inside the page component once the data is loaded:

```typescript
import { useBreadcrumbLabel } from '@/hooks/use-breadcrumb-label';

// registers the label for the current dynamic segment ID
useBreadcrumbLabel(order.id, order.name);
```

The label propagates through the `BreadcrumbProvider` context and the skeleton resolves automatically. Don't register a label for static segments — they are resolved directly from the path.

### Theme

Light/dark/system theme is available globally via `next-themes`. Use the `ThemeToggle` component from `@repo/ui` anywhere in the UI. Do not manage theme state yourself.

---

## Shared Packages

### `@repo/ui`

55+ shadcn/Radix-based components plus composite components like `CustomTable` (TanStack Table wrapper), `CustomAlertDialog`, `LoadingButton`, `UserAvatar`, and `PageContainer`.

Import from the package paths directly:

```typescript
import { Button } from '@repo/ui/components/button';
import { CustomTable } from '@repo/ui/general/CustomTable';
```

### `@repo/shared`

Shared utilities usable in both apps: `getInitials`, `formatCurrency`, `deepTrim`, `enumToTitleText`, `exportAsCSV`, `downloadFile`, `getConsistentColors`, and more.

Put any type, enum, or utility that needs to cross the app boundary (e.g. a shared validation schema) here.

### `@repo/db`

Prisma client — **backend only**. Do not import this in the frontend.

---

## Development Scripts

```bash
pnpm dev          # start all apps
pnpm build        # build all apps and packages
pnpm typecheck    # TypeScript check across all packages
pnpm lint:fix     # Biome lint + auto-fix
pnpm db:migrate   # create + apply a dev migration
pnpm db:deploy    # apply migrations in production
pnpm db:studio    # Prisma Studio GUI
```

---

Built with ❤️ by [Heizen Studio](https://studio.heizen.work)
