---
name: forms
description: Form implementation guide using react-hook-form + Zod + @repo/ui field components. Use when building any form, adding form fields, handling validation, or wiring submit logic in the frontend.
---

# Forms Guide

## Stack

- `react-hook-form` — form state management
- `zod` — schema validation
- `@repo/ui/components/field` — field layout components
- `@repo/ui/general/LoadingButton` — submit button

Never manage form state manually. Never use the old `Form`/`FormField`/`FormItem`/`FormControl`/`FormLabel`/`FormMessage` components — `@repo/ui/components/form` no longer exists.

---

## Validation Schema

Zod schemas live in `src/validations/<feature>.validation.ts` and export from `src/validations/index.ts`.

```ts
// validations/users.validation.ts
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
```

---

## Basic Form Pattern

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field, FieldLabel, FieldDescription, FieldError } from '@repo/ui/components/field';
import { Input } from '@repo/ui/components/input';
import { LoadingButton } from '@repo/ui/general/LoadingButton';
import { RequiredStar } from '@repo/ui/general/RequiredStar';
import { updateProfileSchema, type UpdateProfileInput } from '@/validations';

export function ProfileForm() {
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = form.handleSubmit((data) => {
    // call mutation here
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Controller
        name="name"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Name <RequiredStar />
            </FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="email"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>
              Email <RequiredStar />
            </FieldLabel>
            <Input {...field} id={field.name} type="email" aria-invalid={fieldState.invalid} />
            <FieldDescription>We'll never share your email.</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <LoadingButton type="submit" loading={form.formState.isSubmitting}>
        Save
      </LoadingButton>
    </form>
  );
}
```

---

## Rules

- Always use `Controller` + `Field`/`FieldLabel`/`FieldError` — never use uncontrolled inputs with `register` and separate error divs.
- Always set `data-invalid={fieldState.invalid}` on `<Field>` and `aria-invalid={fieldState.invalid}` on the input.
- Show validation errors with `<FieldError errors={[fieldState.error]} />` — **never** in a toast.
- Use `LoadingButton` for submit — never disable manually or show a separate spinner.
- Use `RequiredStar` on labels for required fields.
- Optional hint text → `<FieldDescription>`.

---

## Field Components Reference

All from `@repo/ui/components/field`:

| Component | Purpose |
|---|---|
| `Field` | Wrapper div; accepts `data-invalid`, `orientation` |
| `FieldLabel` | Styled label (wraps `Label`) |
| `FieldTitle` | Non-`<label>` heading for a field |
| `FieldDescription` | Helper/hint text below the input |
| `FieldError` | Validation error display; pass `errors={[fieldState.error]}` |
| `FieldGroup` | Groups multiple `Field` items |
| `FieldSet` | Groups with `<fieldset>` semantics |
| `FieldLegend` | Legend for a `FieldSet` |
| `FieldContent` | Flexible content slot inside a field |
| `FieldSeparator` | Visual divider between fields |
