---
name: react-query
description: TanStack Query v5 conventions — query hooks, mutation hooks, service layer, callbacks, and cache invalidation. Use when writing data fetching, creating query/mutation hooks, working with services, or handling loading/error/success states from API calls.
---

# TanStack Query Conventions

## Pattern

```
Component → Query/Mutation hook → Service → ApiClient
```

Never call `fetch` or `ApiClient` directly from a component. Always go through a hook.

---

## Query Hooks

Query hooks live in `src/queries/<feature>.query.ts` and export from `src/queries/index.ts`.

```ts
// queries/users.query.ts
import { useQuery } from '@tanstack/react-query';
import { UserService } from '@/services';

export const USER_KEYS = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: USER_KEYS.all,
    queryFn: () => UserService.getUsers(),
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => UserService.getUser(id),
  });
}
```

---

## Mutation Hooks

Use **sync callbacks** (`onSuccess`, `onError`, `onSettled`) — not async `.mutateAsync()`.

The query file should only contain `mutationFn`. Callbacks that are specific to a call site (e.g. showing a toast, closing a dialog, resetting a form) belong in the component:

```ts
// queries/users.query.ts — only mutationFn here
export function useUpdateUser() {
  return useMutation({
    mutationFn: (data: UpdateUserInput) => UserService.updateUser(data),
  });
}
```

```tsx
// component — callbacks go here
const updateUser = useUpdateUser();

function handleSubmit(data: UpdateUserInput) {
  updateUser.mutate(data, {
    onSuccess: () => toast.success('User updated'),
    onError: (error) => toast.error(error.message),
  });
}
```

Put callbacks in the query file only when they are truly shared across every call site (e.g. cache invalidation that must always happen):

```ts
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateUserInput) => UserService.updateUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
    },
  });
}
```

Only use `.mutateAsync()` when you must `await` the result inline (rare).

---

## Service Layer

Services live in `src/services/<feature>.service.ts` and export from `src/services/index.ts`.

Services are **static classes** that call `ApiClient`. No hooks, no state.

```ts
// services/users.service.ts
import { ApiClient } from '@/lib/api-client';
import type { User, UpdateProfileInput } from '@/types';

export class UserService {
  static getUsers() {
    return ApiClient.get<User[]>('/api/users');
  }

  static getUser(id: string) {
    return ApiClient.get<User>(`/api/users/${id}`);
  }

  static updateUser(data: UpdateProfileInput) {
    return ApiClient.patch<User>('/api/users/me', data);
  }
}
```

Then use in query hooks:

```ts
queryFn: () => UserService.getUsers(),
mutationFn: (data) => UserService.updateUser(data),
```

---

## Cache Keys

Always define query keys as a const object in the query file. Co-locate keys with the hooks that use them.

```ts
export const USER_KEYS = {
  all: ['users'] as const,
  detail: (id: string) => ['users', id] as const,
};
```

---

## Loading / Error / Empty States

Destructure and handle all states explicitly:

```tsx
const { data: users, isLoading, isError, error } = useUsers();

if (isLoading) return <Skeleton />;
if (isError) return <AlertMessage variant="error">{error.message}</AlertMessage>;
if (!users?.length) return <Empty />;
```

Never render nothing silently while loading or on error.
