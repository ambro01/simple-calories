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

### 1. Fix dla React 19 + Cloudflare Pages (MessageChannel error)

React 19 używa `MessageChannel` API, które domyślnie nie jest dostępne w Cloudflare Workers. Rozwiązanie: użyj edge-compatible wersji React DOM server.

Zaktualizowano `astro.config.mjs` aby używał `react-dom/server.edge`:

```javascript
vite: {
  plugins: [tailwindcss()],
  resolve: process.env.CF_PAGES
    ? {
        alias: {
          "react-dom/server": "react-dom/server.edge",
        },
      }
    : {},
}
```

**Alternatywnie**, można ustawić compatibility date na `2025-08-15` lub później w Cloudflare Dashboard (Settings → Functions → Compatibility Date), co włącza `MessageChannel` globalnie.

### 2. Użycie `process.env` jako fallback

Zmieniono `src/db/supabase.client.ts` aby używał `process.env` jako fallback:

```typescript
const supabaseUrl = import.meta.env.SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.SUPABASE_KEY || process.env.SUPABASE_KEY || "";
```

**Uwaga**: `process.env` w Cloudflare Pages działa tylko gdy ustawiona jest compatibility flag `nodejs_compat` w Dashboard (patrz sekcja Konfiguracja poniżej).

### 3. Ustawienie `CF_PAGES=true` w workflow

Dodano zmienną `CF_PAGES=true` w GitHub Actions workflow, aby upewnić się, że build używa adaptera Cloudflare:

```yaml
env:
  CF_PAGES: true
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
  # ... inne zmienne
```

## Konfiguracja

### 1. Plik wrangler.toml (KLUCZOWY!)

Utworzono plik `wrangler.toml` w root projektu, który automatycznie konfiguruje Cloudflare Pages:

```toml
name = "simple-calories"
compatibility_flags = [ "nodejs_compat", "disable_nodejs_process_v2" ]
compatibility_date = "2025-10-14"
pages_build_output_dir = "dist"
```

**Co daje ten plik:**
- `nodejs_compat` - włącza Node.js compatibility (w tym `process.env`)
- `disable_nodejs_process_v2` - wyłącza nową wersję process API dla stabilności
- `compatibility_date` - określa wersję Cloudflare Workers runtime
- `pages_build_output_dir` - wskazuje folder z buildem

**Ważne**: Dzięki temu plikowi nie musisz ręcznie ustawiać compatibility flags w Cloudflare Dashboard!

### 2. Konfiguracja zmiennych środowiskowych

Zmienne **muszą** być skonfigurowane w dwóch miejscach:

#### a) GitHub Actions Secrets (dla buildu)
- Settings → Secrets and variables → Actions
- Dodaj: `SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`

#### b) Cloudflare Pages Environment Variables (dla runtime)
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
