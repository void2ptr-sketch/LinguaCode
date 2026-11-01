# Swagger OpenAPI Migration Guide

## Migration strategy: hand-written → generated code, zero breaking changes

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Consumers (components, services, stores)               │
│  // import { LanguagePort } from '...'  ← unchanged     │
└────────────────────┬────────────────────────────────────┘
                     │ depends on
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Port interfaces (CardCatalogPort, AuthPort, etc.)      │
│  src/app/entities/*/lib/*-port.ts                       │  ← unchanged
└────────────────────┬────────────────────────────────────┘
                     │ implements
                     ▼
┌───────────────────────────────────┬──────────────────────┐
│  Hand-written API services        │  Generated API       │
│  src/app/entities/*/api/*.service │  src/app/app/api/    │
│  (DEPRECATED — gradually removed) │  generated/ (NEW)    │
└───────────────────────────────────┴──────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Mock interceptors (conditional via environment flags)  │
│  src/app/entities/*/api/mock/*.interceptor.ts           │
└─────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  Backend (Swagger/OpenAPI at /v3/api-docs)              │
└─────────────────────────────────────────────────────────┘
```

### Key principles

1. **Generated code goes to separate folder** (`src/app/app/api/generated/`)
2. **Port interfaces stay as the contract** — generated service implements Port
3. **Both coexist** — consumers switch gradually
4. **Mock interceptors still work** — they intercept at HTTP level regardless of service origin
5. **No breaking changes for consumers**

---

## Phase 0: Setup (DONE ✅)

```bash
npm i -D orval
# scripts added: generate:api, generate:api:local
# configs added: orval.config.ts, orval.config.local.ts
```

## Phase 1: First entity — LanguageApiService

LanguageApiService is the simplest — no Port interface, no DTO adapters.

### Step 1: Generate types

Ensure backend is running at `localhost:8080`, then:

```bash
npm run generate:api
```

This downloads the OpenAPI spec and generates:

- `src/app/app/api/generated/tags/language/` — service methods
- `src/app/app/api/generated/models/` — TypeScript types

### Step 2: Wrap generated service to match existing pattern

Create a thin wrapper that implements the existing `LanguagePort` (if any) or just replaces the old service:

```ts
// src/app/entities/language-pair/api/language-api.generated.ts
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { getLanguagesService } from 'app/app/api/generated';
import { buildApiUrl } from 'app/shared/api/api-url';
import type { LanguageDto } from './language-dto.types';

/**
 * Generated API wrapper for Language entity.
 * Wraps orval-generated service to match the existing pattern:
 * - Promise<T> return types
 * - buildApiUrl prefix handling
 * - Local DTO types (not generated OpenAPI types)
 */
@Injectable({ providedIn: 'root' })
export class LanguageApiService {
  private readonly generated = inject(getLanguagesService as any);

  getAllActive(): Promise<LanguageDto[]> {
    return firstValueFrom(this.generated.list({})).then((response: any) => {
      // Map generated types to local DTOs
      return response.map((item: any) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        active: item.active,
      }));
    });
  }

  // ... other methods
}
```

### Step 3: Switch consumers

In `LanguageService`, replace the import:

```ts
// BEFORE
import { LanguageApiService } from './api/language-api.service';

// AFTER
import { LanguageApiService } from './api/language-api.generated';
```

### Step 4: Verify

```bash
npm run test:ci
# Smoke tests should still pass
```

### Step 5: Delete old service

Once all consumers are switched:

```bash
rm src/app/entities/language-pair/api/language-api.service.ts
# Delete or rename old methods
```

---

## Phase 2: Complex entities (Auth, Cards, Courses...)

For entities with Port interfaces:

```ts
// Generated service from orval
class GeneratedAuthApiService { ... }

// Port interface (UNCHANGED)
interface AuthPort {
  login(credentials: LoginCredentials): Promise<AuthSession>;
}

// Wrapper that implements Port using generated service
@Injectable({ providedIn: 'root' })
export class AuthApiService implements AuthPort {
  private readonly generated = inject(GeneratedAuthApiService);

  login(credentials: LoginCredentials): Promise<AuthSession> {
    return firstValueFrom(
      this.generated.authLogin({ authLoginRequest: credentials })
    ).then(response => mapToAuthSession(response.data));
  }
}
```

**The wrapper handles:**

1. Converting orval params to/from local types
2. Unwrapping `ApiResponse<T>` to just `T`
3. Mapping generated model types to local DTO types
4. Converting Observable → Promise

---

## Phase 3: Mock interceptors

Mock interceptors work at the HTTP level — they don't care if the request comes from hand-written or generated service.

**Two approaches:**

### A. Keep current mock interceptors (easiest)

No changes needed — interceptors match on URL + method.

### B. Switch to orval mock mode (for pure local dev)

```ts
// orval.config.ts
input: {
  override: {
    mock: {
      type: 'msw',
      useExamples: false,
    },
  },
}
```

Then use `@orval/mock` with `express-mock` for local mocking.

---

## Commands

```bash
# Generate from running backend
npm run generate:api

# Generate from local file (backend doesn't need to be running)
npm run generate:api:local

# Lint + build after generation
npm run lint && npm run build:prod && npm run test:ci
```

---

## Common patterns for wrappers

### GET with query params

```ts
search(params: CardSearchParams): Promise<Card[]> {
  return firstValueFrom(
    this.generated.getCardsSearch({
      query: {
        query: params.query,
        page: params.page,
        size: params.size,
      },
    })
  ).then(r => r.data.map(toCard));
}
```

### POST with body

```ts
create(card: CardCreatePayload): Promise<Card> {
  return firstValueFrom(
    this.generated.postCards({
      cardsCreateRequest: mapToCreateRequest(card),
    })
  ).then(r => toCard(r.data));
}
```

### DELETE

```ts
delete(id: number): Promise<void> {
  return firstValueFrom(
    this.generated.deleteCardsId({ id })
  ).then(() => undefined);
}
```

### PUT with file upload

```ts
exportScorm(courseId: string): Promise<Blob> {
  return firstValueFrom(
    this.generated.getScormExportCoursesCourseId(
      { courseId },
      { responseType: 'blob' as any }
    )
  ).then(r => r);
}
```

---

## Migration checklist per entity

- [ ] Generated code is valid (`npm run generate:api`)
- [ ] Wrapper service created (implements Port, maps types)
- [ ] Consumers switched to new wrapper
- [ ] Tests pass
- [ ] Old hand-written service deleted
- [ ] Old mock interceptor reviewed (keep or remove)
