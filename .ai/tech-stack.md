Frontend - Astro z React dla komponentów interaktywnych:

- Astro 5 pozwala na tworzenie szybkich, wydajnych stron i aplikacji z minimalną ilością JavaScript
- React 19 zapewni interaktywność tam, gdzie jest potrzebna
- TypeScript 5 dla statycznego typowania kodu i lepszego wsparcia IDE
- Tailwind 4 pozwala na wygodne stylowanie aplikacji
- Shadcn/ui zapewnia bibliotekę dostępnych komponentów React, na których oprzemy UI

Backend - Supabase jako kompleksowe rozwiązanie backendowe:

- Zapewnia bazę danych PostgreSQL
- Zapewnia SDK w wielu językach, które posłużą jako Backend-as-a-Service
- Jest rozwiązaniem open source, które można hostować lokalnie lub na własnym serwerze
- Posiada wbudowaną autentykację użytkowników

AI - Komunikacja z modelami przez usługę Openrouter.ai:

- Dostęp do szerokiej gamy modeli (OpenAI, Anthropic, Google i wiele innych), które pozwolą nam znaleźć rozwiązanie zapewniające wysoką efektywność i niskie koszta
- Pozwala na ustawianie limitów finansowych na klucze API

Testing - Kompleksowa strategia testowania:

Testy jednostkowe i integracyjne:

- Vitest jako szybki test runner zbudowany dla Vite
  - Kompatybilny z API Jest, co ułatwia migrację i znajomość narzędzia
  - Hot Module Replacement (HMR) dla testów, co przyspiesza development
  - Wsparcie dla code coverage z c8
- React Testing Library do testowania komponentów React
  - Podejście user-centric (testowanie z perspektywy użytkownika)
  - Doskonała integracja z Vitest
  - Wsparcie dla testowania hooków i komponentów

Testy end-to-end:

- Playwright do kompleksowych testów E2E
  - Testowanie na wielu przeglądarkach (Chromium, Firefox, WebKit)
  - Auto-wait i mechanizmy retry dla stabilnych testów
  - Wbudowane narzędzia do debugowania
  - Testy accessibility z integracją axe-core
  - Możliwość testowania API endpoints
  - Wsparcie dla różnych rozdzielczości (mobile, tablet, desktop)

Cele testowania:

- Minimum 80% pokrycia kodu dla testów jednostkowych
- Priorytety: logika biznesowa (kalorie, cele dietetyczne), komponenty z danymi, API endpoints
- Strategia: unit tests dla utils/helpers, integration tests dla komponentów React, E2E dla głównych user flows

CI/CD i Hosting:

- Github Actions do tworzenia pipeline'ów CI/CD
  - Workflow pull-request.yml: linting, testy jednostkowe, testy E2E
  - Workflow master.yml: linting, testy jednostkowe, deployment do Cloudflare Pages
- Cloudflare Pages jako hosting aplikacji Astro
  - Adapter @astrojs/cloudflare skonfigurowany z platformProxy
  - Automatyczny deployment po merge do branch master
