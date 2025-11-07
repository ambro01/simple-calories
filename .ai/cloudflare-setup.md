# Konfiguracja Cloudflare Pages - Instrukcja

## Wymagane Sekrety GitHub

Aby deployment na Cloudflare Pages działał poprawnie, należy skonfigurować następujące sekrety w repozytorium GitHub:

### Sekrety dla środowiska `production`

W GitHub: Settings → Secrets and variables → Actions → New repository secret

1. **CLOUDFLARE_API_TOKEN**
   - Opis: Token API z uprawnieniami do Cloudflare Pages
   - Jak uzyskać:
     - Zaloguj się do Cloudflare Dashboard
     - Przejdź do: Profile → API Tokens → Create Token
     - Użyj template "Edit Cloudflare Workers" lub utwórz custom token z uprawnieniami:
       - Account Settings: Read
       - Cloudflare Pages: Edit

2. **CLOUDFLARE_ACCOUNT_ID**
   - Opis: ID twojego konta Cloudflare
   - Jak uzyskać:
     - Zaloguj się do Cloudflare Dashboard
     - ID konta znajduje się w URL lub w sekcji "Account ID" w prawym panelu

3. **CLOUDFLARE_PROJECT_NAME**
   - Opis: Nazwa projektu Cloudflare Pages
   - Wartość: nazwa projektu utworzonego w Cloudflare Pages (np. `simple-calories`)

4. **SUPABASE_URL**
   - Opis: URL projektu Supabase
   - Jak uzyskać: Supabase Dashboard → Project Settings → API

5. **SUPABASE_KEY**
   - Opis: Anon/Public API Key dla Supabase
   - Jak uzyskać: Supabase Dashboard → Project Settings → API

6. **OPENROUTER_API_KEY**
   - Opis: Klucz API dla OpenRouter.ai
   - Jak uzyskać: https://openrouter.ai/keys

7. **OPENROUTER_MODEL**
   - Opis: Nazwa modelu AI do użycia
   - Przykładowa wartość: `anthropic/claude-3.5-sonnet` lub `openai/gpt-4`

## Struktura Workflow

### Pull Request Pipeline (`pull-request.yml`)
- **Trigger**: Pull request do `master`
- **Jobs**:
  1. Linting kodu
  2. Testy jednostkowe z coverage
  3. Testy E2E (Playwright)
  4. Komentarz z podsumowaniem na PR

### Master Pipeline (`master.yml`)
- **Trigger**: Push do `master`
- **Jobs**:
  1. Linting kodu
  2. Testy jednostkowe z coverage
  3. Deployment do Cloudflare Pages

## Konfiguracja Projektu

### Astro Configuration
Projekt używa adaptera `@astrojs/cloudflare` z następującą konfiguracją:

```javascript
adapter: cloudflare({
  platformProxy: {
    enabled: true,
  },
})
```

**platformProxy**: Włącza lokalne emulowanie Cloudflare Workers podczas development.

### Zmienne Środowiskowe w Cloudflare Pages

Po pierwszym deploymencie, należy dodać zmienne środowiskowe w Cloudflare Dashboard:

1. Przejdź do Cloudflare Dashboard → Pages → [Twój projekt]
2. Settings → Environment variables
3. Dodaj następujące zmienne dla środowiska **Production**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `SKIP_EMAIL_CONFIRMATION` (opcjonalnie, wartość: `false` dla produkcji)

## Build Settings w Cloudflare Pages

Jeśli konfigurujesz projekt manualnie w Cloudflare Pages:

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (root projektu)
- **Environment variables**: (patrz sekcja wyżej)

## Wsparcie dla Node.js Runtime

Adapter Cloudflare automatycznie konfiguruje:
- Node.js compatibility dla Workers
- Session storage używając Cloudflare KV (binding: `SESSION`)
- Obsługę Server-Side Rendering (SSR)

## Uwagi i Ograniczenia

1. **Sharp Image Service**: Cloudflare nie wspiera sharp w runtime. Jeśli potrzebujesz optymalizacji obrazów, użyj `imageService: "compile"` w konfiguracji Astro dla pre-renderowanych stron.

2. **Cloudflare KV**: Adapter automatycznie konfiguruje sessions z użyciem KV. Jeśli zobaczysz błąd "Invalid binding `SESSION`", musisz dodać binding w pliku wrangler.toml.

3. **Supabase Connection**: Upewnij się, że Supabase jest dostępny publicznie lub skonfiguruj odpowiednie zasady CORS.

## Testowanie Lokalne

Aby przetestować deployment lokalnie:

```bash
# Build projektu
npm run build

# Preview z Cloudflare Workers lokalnie
npx wrangler pages dev dist
```

## Troubleshooting

### Błąd: "Invalid binding `SESSION`"
**Rozwiązanie**: Utwórz plik `wrangler.toml` w root projektu:

```toml
name = "simple-calories"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "SESSION"
id = "your-kv-namespace-id"
```

### Deployment kończy się sukcesem, ale strona nie działa
**Rozwiązanie**:
1. Sprawdź czy wszystkie zmienne środowiskowe są ustawione w Cloudflare Dashboard
2. Sprawdź logi w Cloudflare Dashboard → Workers & Pages → [Projekt] → Logs
3. Upewnij się, że build kończy się bez błędów w GitHub Actions

### Testy E2E nie przechodzą w PR
**Rozwiązanie**: Upewnij się, że sekrety są dostępne w środowisku `integration`:
- GitHub Settings → Environments → integration
- Dodaj wymagane sekrety (SUPABASE_URL, SUPABASE_KEY, itp.)
