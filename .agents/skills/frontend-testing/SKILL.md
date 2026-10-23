---
name: frontend-testing
description: Write and maintain Vitest tests for the apps/web frontend, including React components, custom hooks, forms, and coverage configuration. Use when adding or updating frontend tests, investigating coverage, or verifying frontend behavior.
---

# Frontend Testing

Use Vitest and Testing Library. Keep tests beside the source in `__tests__/` directories and import `describe`, `expect`, `it`, and `vi` from `vitest` so TypeScript can type-check them.

## Workflow

1. Read `apps/web/vitest.config.mts`, nearby tests, and the source behavior before writing tests.
2. Test observable outcomes: rendered loading, error, empty, and success states; user interactions; and calls at the public boundary.
3. Use `renderHook` for custom hooks. Mock query, router, and service boundaries rather than implementation details.
4. For forms, submit invalid and valid values, assert inline validation, pending state, success, and server errors.
5. Reset mocks between tests and use `waitFor` only for actual async updates.
6. Run `pnpm --filter web test:cov`, then `pnpm ready` after code changes.

## Coverage policy

Coverage includes all hooks, utils, and components by default. Do not narrow the include list or add broad exclusions to improve a percentage.

Only components named `*.view.tsx` are excluded. Use that suffix only for props-only, presentational JSX with no hooks, data access, router state, toasts, or workflow handlers. Behavioral components remain covered even when they delegate their business logic to hooks and utils.
