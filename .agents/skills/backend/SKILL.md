---
name: backend
description: Backend conventions for apps/server — NestJS 11 module structure, decorators, rate limiting, Prisma usage, and DTOs. Use when writing any NestJS backend code, creating controllers, services, modules, DTOs, or guards in apps/server.
---

# Backend Conventions (NestJS 11)

## Module Structure

Each feature gets its own NestJS module folder:

```
src/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   ├── users.types.ts
│   ├── users.constants.ts
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── common/
│   ├── config.ts         # App config — the only place that reads process.env
│   └── decorators/
└── prisma/
    └── prisma.service.ts
```

---

## Route Protection

There is no authentication — every route is public. Do not add auth guards, session decorators, or auth libraries unless explicitly asked.

---

## DTOs & Validation

- Use `class-validator` + `class-transformer` decorators on DTOs.
- DTOs live in a `dto/` subfolder inside the feature module.
- Return typed response classes from controllers; use `@ApiResponse` for Swagger docs.
- Global prefix: `/api`. Swagger available at `/docs` in dev.

---

## Types & Constants

- When defining reusable types, interfaces, enums, or constants for a feature, create a dedicated module file such as `users.types.ts` or `users.constants.ts`.
- Do not place feature-specific types or constants inside services.
- If types and constants are related, they may live together in a single `*.types.ts` file.
- Keep shared app-wide types and utilities in `packages/shared` (`@repo/shared`).

---

## Prisma

- Use `PrismaService` (injected via module). Never instantiate `PrismaClient` directly.
- Schema lives in `packages/db/prisma/schema.prisma`. After changes: `pnpm db:migrate` then `pnpm db:generate`.
- Schema conventions:
  - The database is **SQLite** — no Postgres-only attributes (`@db.Uuid`, `@db.Text`, etc.)
  - `@id @default(uuid())` for primary keys
  - `@@index` for frequently filtered fields
  - `onDelete: Cascade` where parent deletion should cascade
  - Always include `createdAt` / `updatedAt`

---

## Rate Limiting

Global `ThrottlerGuard` is active (300 req / 60s default). To exempt a route:

```typescript
@SkipThrottle()
```

To override on a specific route:

```typescript
@Throttle({ default: { limit: 10, ttl: 60_000 } })
```

---

## Logging

Use `nestjs-pino`. Inject `Logger` from `@nestjs/common` — never use `console.log` in production code.

---

## Shared Code

Anything usable in both `apps/server` and `apps/web` (types, enums, utils) goes in `packages/shared` (`@repo/shared`).
