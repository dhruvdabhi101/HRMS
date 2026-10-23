---
name: frontend
description: Frontend conventions for apps/web — file structure, component rules, UI/UX standards, shadcn usage, Base UI render props, and shared packages. Use when writing any Next.js frontend code, creating components, services, hooks, queries, types, utils, constants, or contexts in apps/web.
---

# Frontend Conventions

## File Structure

All code in `apps/web/src/` must follow this layout:

```
src/
├── app/              # Next.js App Router pages only
├── components/       # Feature-grouped components (see below)
├── hooks/            # Custom React hooks — e.g. use-users.ts
├── services/         # API service functions — e.g. users.service.ts
├── queries/          # TanStack Query hooks — e.g. users.query.ts
├── types/            # TypeScript types — e.g. users.types.ts
├── validations/      # Zod schemas — e.g. users.validation.ts
├── utils/            # Utility functions — e.g. users.utils.ts
├── constants/        # Constants — e.g. users.constants.ts
├── contexts/         # React contexts — e.g. users.context.tsx
├── config/           # Env/app config — config/index.ts
└── lib/              # Third-party wrappers (api-client, etc.)
```

### Index exports

Every folder above (`types/`, `validations/`, `queries/`, `services/`, `utils/`, `hooks/`, `constants/`, `contexts/`) **must** have an `index.ts` that re-exports everything:

```ts
// types/index.ts
export * from './users.types';
export * from './products.types';
```

### Components folder

Group components by feature. Never put components at the root of `components/`:

```
components/
├── profile/
│   ├── UserInfoForm.tsx
│   └── SessionsList.tsx
├── dashboard/
│   └── StatsCard.tsx
└── sidebar/
    └── SidebarInset.tsx
```

Each feature folder may have its own sub-components. Keep page-level composition in the `app/` layer.

### Shared across apps

If a type, enum, util, or constant is needed in both `apps/web` and `apps/server`, put it in `packages/shared` (`@repo/shared`), not in either app.

DB-related things live in `packages/db` (`@repo/db`) — **never import `@repo/db` in the frontend**.

---

## Component Splitting

Split by concern:
- **Page** (`app/`) — composes sections, may call hooks
- **Section** (`components/<feature>/`) — a logical region (e.g. `ProfileHeader`)
- **UI** — purely presentational, no hooks or side effects

A file over ~100 lines is a candidate to split.

---

## UI Components — Priority Order

1. **`@repo/ui/general/`** — project-specific composite components (check first)
2. **`@repo/ui/components/`** — shadcn primitives
3. Build new only if nothing fits

Available general components (import from `@repo/ui/general/<Name>`):

| Component | Use for |
|---|---|
| `CustomTable` | Data tables with sorting, pagination, empty/loading states |
| `CustomAlertDialog` | Confirm/cancel dialogs |
| `LoadingButton` | Async action buttons with spinner |
| `LoadingScreen` | Full-page loading |
| `UserAvatar` | User avatar with initials fallback |
| `AvatarGroup` | Multiple stacked avatars |
| `PageContainer` | Page wrapper with consistent padding |
| `AlertMessage` | Inline error/warning/info/success |
| `ColorBadge` | Semantic status badges |
| `AccessDenied` | 403 empty state |
| `RequiredStar` | Required field indicator |

---

## shadcn Components

- Prioritize shadcn components from `@repo/ui/components/` before building custom ones.
- This project uses **Base UI** (not Radix UI) internally. There is no `asChild` prop.
- When you need render-prop / slot composition that would use `asChild` in Radix, use the **render prop pattern** instead:

```tsx
// ❌ Radix asChild pattern (not available)
<Button asChild><Link href="/foo">Go</Link></Button>

// ✅ Render prop / composition pattern
<Button render={<Link href="/foo" />}>Go</Button>
// or just wrap directly if the component supports it
```

---

## State Handling

Every async UI must handle loading, empty, and error states explicitly:

- Loading in place → `Skeleton`
- Full-page load → `LoadingScreen`
- Inline error/warning → `AlertMessage`
- Empty data → `Empty` from `@repo/ui/components/empty`

---

## Style Principles

- Use Tailwind utilities only. No inline styles.
- `text-muted-foreground` for secondary text.
- Prefer subtle transitions; avoid heavy animations.
- Consistent spacing and clear visual hierarchy.

---

## Config

All env variables and app config go in `src/config/index.ts`. Never read `process.env` scattered across files.

```ts
// config/index.ts
export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL!,
};
```
