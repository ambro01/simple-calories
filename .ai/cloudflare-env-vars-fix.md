# Fix: Cloudflare Pages Environment Variables Runtime Issue

## Problem

Aplikacja wdrożona na Cloudflare Pages zwracała błąd 500:
```
Error: supabaseUrl is required.
```

## Przyczyna

W Astro z adapterm Cloudflare Pages, zmienne środowiskowe zdefiniowane jako `import.meta.env.*` są dostępne tylko podczas buildu (compile time), ale nie w runtime na serwerze Cloudflare Workers.

Kod w `src/db/supabase.client.ts` inicjalizował klienta Supabase na poziomie modułu:
```typescript
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
```

To działa lokalnie i podczas buildu, ale w runtime na Cloudflare Pages te zmienne są `undefined`.

## Rozwiązanie

### 1. Użycie `process.env` jako fallback

Zmieniono `src/db/supabase.client.ts` aby używał `process.env` jako fallback:

```typescript
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || process.env.SUPABASE_KEY || "";
```

Cloudflare Pages automatycznie przekazuje zmienne środowiskowe zdefiniowane w Dashboard przez `process.env` w runtime.

### 2. Ustawienie `CF_PAGES=true` w workflow

Dodano zmienną `CF_PAGES=true` w GitHub Actions workflow, aby upewnić się, że build używa adaptera Cloudflare:

```yaml
env:
  CF_PAGES: true
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  # ... inne zmienne
```

## Konfiguracja zmiennych w Cloudflare Dashboard

Zmienne **muszą** być skonfigurowane w dwóch miejscach:

### 1. GitHub Actions Secrets (dla buildu)
- Settings → Secrets and variables → Actions
- Dodaj: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

### 2. Cloudflare Pages Environment Variables (dla runtime)
- Cloudflare Dashboard → Pages → [projekt] → Settings → Environment variables
- Dla środowiska **Production** dodaj:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_MODEL`
  - `DEFAULT_USER_ID` (opcjonalnie)
  - `SKIP_EMAIL_CONFIRMATION=false`

## Alternatywne podejścia (nieużyte)

### Option A: Użycie `Astro.locals.runtime.env`
Można było przepisać cały kod aby używał:
```typescript
const { env } = Astro.locals.runtime;
const supabaseUrl = env.SUPABASE_URL;
```
Ale wymagałoby to zmiany we wszystkich miejscach gdzie używany jest `supabaseClient`.

### Option B: Lazy initialization
Można było zainicjalizować klienta dopiero gdy jest potrzebny:
```typescript
export function getSupabaseClient() {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
}
```

## Weryfikacja

Po wdrożeniu zmian:
1. Sprawdź logi w Cloudflare Dashboard → Pages → [projekt] → Logs
2. Upewnij się, że nie ma błędu "supabaseUrl is required"
3. Przetestuj działanie aplikacji na URL produkcyjnym

## Linki

- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
- [Cloudflare Adapter Configuration](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/configuration/build-configuration/)
