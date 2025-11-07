# Problem: "[object Object]" na Cloudflare Pages

## Kontekst
Aplikacja Astro została wdrożona na Cloudflare Pages, ale zamiast renderować strony wyświetlała tylko tekst "[object Object]".

## Symptomy
- Aplikacja buduje się poprawnie lokalnie
- Deployment na Cloudflare Pages kończy się sukcesem
- Strona wyświetla tylko "[object Object]"
- Response headers: `Content-Type: text/html`, Status: 200
- Body response: dosłownie tylko tekst "[object Object]"

## Pierwotne podejrzenia (błędne)
1. **Adapter Node.js zamiast Cloudflare** - Początkowo podejrzewaliśmy, że build używa `@astrojs/node` zamiast `@astrojs/cloudflare`
   - Problem: Zmienna `CF_PAGES=true` nie była przekazywana do kroku build w GitHub Actions
   - Rozwiązanie cząstkowe: Dodano `build:cloudflare` script z `cross-env`

2. **Struktura _worker.js** - Myśleliśmy, że problem jest w tym, że Astro generuje folder `_worker.js/` zamiast pliku
   - Okazało się że to normalne zachowanie dla Cloudflare Pages w "advanced mode"
   - Cloudflare Pages obsługuje zarówno plik `_worker.js` jak i folder `_worker.js/index.js`

## Prawdziwa przyczyna
**Konflikt compatibility flags w Cloudflare Pages**

Od **15 września 2025** Cloudflare automatycznie włącza flagę `enable_nodejs_process_v2`, która w połączeniu z `nodejs_compat` powoduje usunięcie polyfilla `node:process`. To powoduje, że Astro SSR zwraca obiekt zamiast HTML.

### Źródła
- GitHub Issue: https://github.com/withastro/astro/issues/14511
- Repro repository: https://github.com/OliverSpeir/repro-objectobject-astro-cfpages

## Rozwiązanie

### 1. Dodanie flagi `disable_nodejs_process_v2` do wrangler.toml

```toml
name = "simple-calories"
compatibility_flags = [ "nodejs_compat", "disable_nodejs_process_v2" ]
compatibility_date = "2025-11-07"
pages_build_output_dir = "dist"
```

### 2. Dodanie skryptu build:cloudflare do package.json

```json
{
  "scripts": {
    "build:cloudflare": "cross-env CF_PAGES=true astro build"
  },
  "devDependencies": {
    "cross-env": "^10.1.0"
  }
}
```

### 3. Aktualizacja GitHub Actions workflow

[.github/workflows/deploy-to-cloudflare-pages.yml](.github/workflows/deploy-to-cloudflare-pages.yml):

```yaml
- name: Build project
  run: npm run build:cloudflare
```

Usunięto niepotrzebną zmienną `CF_PAGES: true` z sekcji `env:` job.

## Zmienione pliki

1. **wrangler.toml** - Dodano `disable_nodejs_process_v2` do `compatibility_flags`
2. **package.json** - Dodano skrypt `build:cloudflare` i zależność `cross-env`
3. **.github/workflows/deploy-to-cloudflare-pages.yml** - Zmieniono `npm run build` na `npm run build:cloudflare`
4. **astro.config.mjs** - Pozostało bez zmian (używa `process.env.CF_PAGES` do wyboru adaptera)

## Dlaczego to działa

Flaga `disable_nodejs_process_v2` wyłącza problematyczny feature flag Cloudflare, który usuwa polyfill `node:process`. Dzięki temu:
- Astro SSR ma dostęp do `process` API
- Worker może poprawnie renderować strony
- Response zawiera HTML zamiast serializowanego obiektu

## Ważne uwagi

1. **Problem występuje tylko w production** - Lokalne `wrangler pages dev` działa poprawnie
2. **Data compatibility** - Problem pojawił się po 15 września 2025 dla projektów z `compatibility_date >= 2025-09-15`
3. **Astro Cloudflare adapter** - Zawsze generuje folder `_worker.js/`, co jest prawidłowe dla Cloudflare Pages
4. **Nie trzeba używać `workerEntryPoint`** - Domyślna konfiguracja adaptera jest wystarczająca

## Weryfikacja działania

Po wdrożeniu:
1. Build na GitHub Actions powinien używać `@astrojs/cloudflare` adaptera
2. W folderze `dist/` powinien być `_worker.js/` (folder) z `index.js` wewnątrz
3. Plik `dist/_routes.json` powinien zawierać routing dla SSR
4. Strona na Cloudflare Pages powinna renderować poprawnie HTML

## Dodatkowe zasoby

- Astro Cloudflare Adapter docs: https://docs.astro.build/en/guides/integrations-guide/cloudflare/
- Cloudflare Pages Functions Advanced Mode: https://developers.cloudflare.com/pages/functions/advanced-mode/
- GitHub Issue #14511: https://github.com/withastro/astro/issues/14511

## Potencjalne przyszłe problemy

1. **Aktualizacja Wrangler** - Dla Workers (nie Pages) problem został naprawiony w Wrangler 4.42.0+
2. **Usunięcie flagi** - W przyszłości Cloudflare może naprawić konflikt i flaga `disable_nodejs_process_v2` może nie być potrzebna
3. **Astro adapter update** - Przyszłe wersje `@astrojs/cloudflare` mogą automatycznie dodawać tę flagę

## Status: ✅ ROZWIĄZANE

Zmiany gotowe do commit i deploy. Aplikacja powinna działać poprawnie na Cloudflare Pages po wdrożeniu.
