# Plan Testów - Simple Calories

## 1. Wprowadzenie i cele testowania

### 1.1. Cel dokumentu

Niniejszy plan testów definiuje strategię, zakres oraz procedury testowania aplikacji Simple Calories - systemu do śledzenia kalorii i makroskładników z wykorzystaniem sztucznej inteligencji.

### 1.2. Cele testowania

- Zapewnienie poprawnego działania funkcji krytycznych (dodawanie posiłków, generowanie AI, autentykacja)
- Weryfikacja integralności danych w bazie PostgreSQL
- Walidacja integracji z zewnętrznym API (OpenRouter.ai)
- Potwierdzenie bezpieczeństwa i autoryzacji dostępu do danych użytkowników
- Sprawdzenie wydajności i skalowalności aplikacji
- Weryfikacja dostępności (accessibility) interfejsu użytkownika
- Zapewnienie jakości przed wdrożeniem na produkcję

### 1.3. Zakres dokumentu

Plan obejmuje aplikację webową zbudowaną w stosie: Astro 5, React 19, TypeScript 5, Supabase (PostgreSQL + Auth), OpenRouter.ai, z deploymentem na DigitalOcean.

---

## 2. Zakres testów

### 2.1. Funkcjonalności w zakresie testów

**Moduł zarządzania posiłkami:**

- Dodawanie posiłków (tryb manualny i AI)
- Edycja istniejących posiłków
- Usuwanie posiłków
- Przeglądanie listy posiłków z filtrowaniem (data, kategoria)
- Walidacja makroskładników (protein, carbs, fats vs calories)
- Automatyczna zmiana input_method przy edycji posiłków AI

**Moduł generowania AI:**

- Generowanie posiłków na podstawie promptu użytkownika
- Walidacja promptu (długość, format)
- Parsowanie odpowiedzi JSON z modelu AI
- Obsługa błędów API (timeout, rate limit, quota exceeded)
- Rate limiting dla zapytań AI
- Retry logic z exponential backoff

**Moduł celów kalorycznych:**

- Tworzenie celu kalorycznego
- Edycja istniejącego celu
- Pobieranie aktualnego celu (effective_from logic)
- Pobieranie celu na konkretną datę
- Walidacja wartości (zakres 500-10000 kcal)

**Moduł postępu dziennego:**

- Agregacja dziennych statystyk (suma kalorii, makroskładników)
- Obliczanie postępu względem celu
- Filtrowanie po zakresie dat
- Paginacja wyników

**Moduł autentykacji:**

- Rejestracja nowego użytkownika (z potwierdzeniem email lub bez - SKIP_EMAIL_CONFIRMATION)
- Logowanie użytkownika
- Wylogowanie
- Reset hasła (forgot password flow)
- Zmiana hasła (authenticated user)
- Automatyczne tworzenie profilu przy rejestracji (trigger)

**Moduł profilu:**

- Wyświetlanie danych profilu
- Edycja danych profilu

**Dashboard i widoki:**

- Dashboard z listą dni
- Infinite scroll loading
- Szczegóły dnia z listą posiłków
- Responsywny design (mobile, tablet, desktop)
- Dark/light mode

### 2.2. Funkcjonalności poza zakresem testów

- Migracja danych z innych systemów
- Integracja z urządzeniami wearable
- Eksport danych do formatów zewnętrznych (CSV, PDF)
- Funkcje administracyjne (nie zaimplementowane w MVP)
- Real-time collaboration features

### 2.3. Typy danych testowych

- Użytkownicy testowi (various profiles)
- Posiłki z różnymi kategoriami (breakfast, lunch, dinner, snack, other)
- Posiłki z kompletami i brakami makroskładników
- Cele kaloryczne w różnych zakresach
- Daty testowe (aktualne, historyczne, edge cases like 00:00, 23:59:59)
- Prompty AI (krótkie, długie, w języku polskim)

---

## 3. Typy testów do przeprowadzenia

### 3.1. Testy jednostkowe (Unit Tests)

**Cel:** Testowanie pojedynczych funkcji, komponentów i modułów w izolacji

**Narzędzia:**

- Vitest (test runner dla Vite/Astro)
- React Testing Library (komponenty React)
- Jest (jeśli potrzeba)

**Zakres:**

**Serwisy:**

- `MealsService`: wszystkie metody (getMeals, createMeal, updateMeal, deleteMeal, validateAIGeneration)
- `AIGenerationService`: generowanie, walidacja, parsowanie JSON
- `CalorieGoalService`: CRUD operations, effective_from logic
- `DailyProgressService`: agregacje, obliczenia
- `OpenRouterService`: chat completion, retry logic, error handling
- `RateLimitService`: counting, throttling

**Validators & Helpers:**

- `macronutrient-validator`: validateMacronutrients, shouldChangeToAIEdited - edge cases
- `calorie-goal.validators`: walidacja zakresów
- `date-formatter`: formatowanie dat
- `meal-form.utils`: utility functions

**Zod Schemas:**

- Każdy schema (meal.schemas, ai-generation.schemas, etc.) - valid/invalid inputs
- Edge cases: min/max values, required/optional fields, type coercion

**React Hooks:**

- `useAddMealForm`: state transitions, loading states, error handling
- `useCalorieGoalForm`: form validation, submission
- `useDayDetails`: data fetching, filtering
- `useInfiniteScroll`: pagination logic, loading more

**Komponenty React (z mockami):**

- Każdy komponent UI z shadcn/ui (Button, Dialog, Input, etc.)
- Custom komponenty (AddMealModal, MealCard, DayCard, etc.)
- Props validation, rendering states, event handlers

**Coverage target:** minimum 80% code coverage dla unit tests

### 3.2. Testy integracyjne (Integration Tests)

**Cel:** Testowanie interakcji między modułami, serwisami i bazą danych

**Narzędzia:**

- Vitest + Supabase Local (Docker)
- Supertest (HTTP testing)

**Zakres:**

**API Endpoints:**

- `GET /api/v1/meals` - filtrowanie, paginacja, sorting
- `POST /api/v1/meals` - tworzenie manual i AI meals
- `PATCH /api/v1/meals/[id]` - edycja z automatic input_method change
- `DELETE /api/v1/meals/[id]` - cascade behavior
- `POST /api/v1/ai-generations` - integracja z OpenRouter (mockowana)
- `GET /api/v1/calorie-goals/current` - effective_from logic
- `GET /api/v1/daily-progress` - agregacje z wielu tabel
- `POST /api/v1/auth/signup` - trigger tworzenia profilu
- `POST /api/v1/auth/login` - session management
- Wszystkie endpointy: walidacja Zod, error responses, status codes

**Database Layer:**

- Migracje Supabase: wykonanie wszystkich migracji na czystej bazie
- Triggers: create_profile_for_user, updated_at triggers
- Functions: jeśli istnieją custom functions
- Views: meals_with_latest_ai - poprawność złączeń
- Foreign keys i constraints: cascade deletes, not null enforcement
- Transakcje: rollback scenarios

**Service Integration:**

- MealsService + Supabase: real database queries
- AIGenerationService + OpenRouterService: mockowana integracja
- CalorieGoalService + DailyProgressService: obliczenia cross-table

**Authentication & Authorization:**

- Middleware: requireAuth - authorized/unauthorized scenarios
- Session management: token expiry, refresh
- RLS policies (gdy włączone): select/insert/update/delete na własnych danych

### 3.3. Testy End-to-End (E2E Tests)

**Cel:** Testowanie pełnych przepływów użytkownika w przeglądarce

**Narzędzia:**

- Playwright (zalecane dla Astro)
- Alternatywa: Cypress

**Zakres:**

**Scenariusze krytyczne:**

1. **Rejestracja i pierwsze logowanie:**
   - Użytkownik rejestruje się nowym kontem
   - Potwierdza email (jeśli SKIP_EMAIL_CONFIRMATION=false)
   - Loguje się
   - Widzi pusty dashboard
   - Ustawia cel kaloryczny

2. **Dodanie posiłku manualnie:**
   - Użytkownik klika FAB "Dodaj posiłek"
   - Wybiera tryb manualny
   - Wypełnia opis, kalorie, makroskładniki, kategorię
   - Zapisuje posiłek
   - Widzi posiłek na dashboardzie
   - Sprawdza czy postęp dzienny się zaktualizował

3. **Generowanie posiłku przez AI:**
   - Użytkownik klika FAB "Dodaj posiłek"
   - Wybiera tryb AI
   - Wpisuje prompt (np. "Jajecznica z 3 jajek i chlebem")
   - Klika "Generuj"
   - Widzi loader z etapami
   - Widzi wygenerowany wynik
   - Akceptuje wynik
   - Widzi posiłek na dashboardzie z oznaczeniem "AI"

4. **Edycja posiłku AI (input_method change):**
   - Użytkownik otwiera posiłek wygenerowany przez AI
   - Edytuje kalorie
   - Zapisuje
   - Sprawdza czy input_method zmienił się na "ai-edited"

5. **Usunięcie posiłku:**
   - Użytkownik otwiera posiłek
   - Klika "Usuń"
   - Potwierdza w dialogu
   - Sprawdza czy posiłek zniknął z listy

6. **Przeglądanie historii i filtrowanie:**
   - Użytkownik scrolluje dashboard (infinite scroll)
   - Klika na dzień w przeszłości
   - Widzi szczegóły dnia z posiłkami
   - Filtruje po kategorii (np. tylko breakfast)

7. **Zmiana celu kalorycznego:**
   - Użytkownik otwiera Settings
   - Zmienia cel z 2000 na 2500 kcal
   - Zapisuje
   - Sprawdza czy postęp na dashboardzie się zaktualizował

8. **Reset hasła:**
   - Użytkownik klika "Zapomniałem hasła"
   - Wpisuje email
   - Otrzymuje email z linkiem (w dev environment sprawdzamy Supabase inbucket)
   - Klika link
   - Ustawia nowe hasło
   - Loguje się nowym hasłem

9. **Responsive design:**
   - Wszystkie powyższe scenariusze na mobile (375px)
   - Wszystkie powyższe scenariusze na tablet (768px)
   - Wszystkie powyższe scenariusze na desktop (1920px)

10. **Dark mode:**
    - Użytkownik przełącza na dark mode
    - Sprawdza czy wszystkie widoki są czytelne
    - Odświeża stronę - ustawienie persisted

**Scenariusze błędów:**

- Próba dodania posiłku z przyszłą datą (validation error)
- Próba wygenerowania AI z pustym promptem
- Timeout podczas generowania AI (mock slow response)
- Próba dostępu do cudzego posiłku (authorization error)
- Sesja expired podczas korzystania z app

### 3.4. Testy wydajnościowe (Performance Tests)

**Cel:** Weryfikacja wydajności i skalowalności

**Narzędzia:**

- k6 (load testing)
- Lighthouse (frontend performance)

**Zakres:**

**Load Testing:**

- 100 concurrent users dodających posiłki
- 500 concurrent users przeglądających dashboard
- 50 concurrent AI generations (rate limiting behavior)
- Spike testing: nagły wzrost do 1000 users
- Soak testing: 100 users przez 30 minut

**Metryki:**

- Response time < 200ms dla GET endpoints
- Response time < 500ms dla POST endpoints
- Response time < 3s dla AI generation
- Throughput: min 100 requests/sec
- Error rate < 1%
- Database connection pool utilization < 80%

**Frontend Performance:**

- Lighthouse score > 90 dla wszystkich kluczowych stron
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Total Bundle Size < 200KB (gzipped)

### 3.5. Testy bezpieczeństwa (Security Tests)

**Cel:** Wykrycie podatności i luk bezpieczeństwa

**Narzędzia:**

- OWASP ZAP (automated scanning)
- Burp Suite (manual testing)
- npm audit (dependency vulnerabilities)

**Zakres:**

**Authentication & Authorization:**

- Próba dostępu do protected endpoints bez tokenu
- Próba dostępu do cudzych danych (meal_id innego usera)
- Token manipulation (zmiana user_id w JWT)
- Session fixation attacks
- Brute force login attempts (rate limiting)

**Input Validation:**

- SQL injection w query parameters
- XSS w meal description, prompt
- NoSQL injection (jeśli applicable)
- Path traversal
- Command injection

**API Security:**

- CORS configuration
- CSRF protection
- Rate limiting dla wszystkich endpoints
- Request size limits
- Proper HTTP headers (Content-Security-Policy, X-Frame-Options, etc.)

**Data Protection:**

- Sensitive data exposure w response
- Password hashing (bcrypt)
- API key exposure (OpenRouter)
- Environment variables security

**Dependencies:**

- npm audit dla known vulnerabilities
- Outdated packages with security issues

### 3.6. Testy dostępności (Accessibility Tests)

**Cel:** Zapewnienie dostępności dla użytkowników z niepełnosprawnościami

**Narzędzia:**

- axe-core (automated a11y testing)
- WAVE (browser extension)
- Screen reader testing (NVDA, JAWS)
- Keyboard navigation testing

**Zakres:**

**WCAG 2.1 Level AA Compliance:**

- Perceivable: alt texts, contrast ratios (min 4.5:1), captions
- Operable: keyboard navigation, focus management, no keyboard traps
- Understandable: clear labels, error messages, consistent navigation
- Robust: valid HTML, ARIA attributes, semantic markup

**Komponenty krytyczne:**

- Formularze (Add Meal, Settings)
- Dialogi (modals, alerts)
- Nawigacja (dashboard, day details)
- Interactive components (buttons, inputs, segmented control)

**Keyboard navigation:**

- Tab order logiczny
- Escape zamyka dialogi
- Enter submituje formularze
- Arrow keys w segmented control

**Screen reader:**

- Announce meal added/deleted
- Announce AI generation progress
- Announce validation errors
- Announce daily progress updates

### 3.7. Testy regresji wizualnej (Visual Regression Tests)

**Cel:** Wykrycie niezamierzonych zmian wizualnych

**Narzędzia:**

- Percy (visual testing platform)
- Alternatywa: Chromatic, BackstopJS

**Zakres:**

- Wszystkie główne widoki (Dashboard, Day Details, Settings, Auth)
- Wszystkie komponenty UI w Storybook (jeśli zaimplementowane)
- Różne stany (empty state, loading, error, success)
- Różne viewporty (mobile, tablet, desktop)
- Dark mode vs light mode

---

## 4. Scenariusze testowe dla kluczowych funkcjonalności

### 4.1. Zarządzanie posiłkami

#### TC-MEAL-001: Dodanie posiłku ręcznie (happy path)

- **Kroki:**
  1. Użytkownik zalogowany klika FAB "Dodaj posiłek"
  2. Wybiera tryb "Manual"
  3. Wypełnia: description="Kurczak z ryżem", calories=650, protein=45, carbs=70, fats=15, category="lunch"
  4. Klika "Zapisz"
- **Oczekiwany rezultat:**
  - Status 201 Created
  - Posiłek pojawia się na dashboardzie
  - input_method = "manual"
  - daily_progress zaktualizowany

#### TC-MEAL-002: Dodanie posiłku z niespójnymi makroskładnikami

- **Kroki:**
  1. Wypełnia: calories=650, protein=45, carbs=70, fats=15
  2. Kalkulacja: (45*4 + 70*4 + 15\*9) = 595 kcal
  3. Różnica: (650-595)/650 = 8.46% > 5%
- **Oczekiwany rezultat:**
  - Status 201 Created (posiłek utworzony)
  - Response zawiera warnings array z komunikatem o niespójności

#### TC-MEAL-003: Dodanie posiłku z przyszłą datą

- **Kroki:**
  1. Wypełnia meal_timestamp = jutrzejsza data
  2. Klika "Zapisz"
- **Oczekiwany rezultat:**
  - Status 400 Bad Request
  - Error: "Meal timestamp cannot be in the future"

#### TC-MEAL-004: Edycja posiłku AI (automatic input_method change)

- **Kroki:**
  1. Posiłek z input_method="ai" istnieje
  2. Użytkownik edytuje calories z 420 na 450
  3. Klika "Zapisz"
- **Oczekiwany rezultat:**
  - Status 200 OK
  - input_method zmienił się na "ai-edited"
  - Pozostałe pola bez zmian

#### TC-MEAL-005: Usunięcie posiłku (cascade behavior)

- **Kroki:**
  1. Posiłek z powiązanym ai_generation istnieje
  2. Użytkownik usuwa posiłek
- **Oczekiwany rezultat:**
  - Status 204 No Content
  - Posiłek usunięty z tabeli meals
  - ai_generations.meal_id = NULL (nie usunięty record AI)

#### TC-MEAL-006: Listowanie posiłków z filtrowaniem po dacie

- **Kroki:**
  1. GET /api/v1/meals?date=2025-02-04
- **Oczekiwany rezultat:**
  - Zwrócone tylko posiłki z meal_timestamp 2025-02-04 00:00:00 - 23:59:59.999
  - Pagination metadata (total, limit, offset)

#### TC-MEAL-007: Próba edycji cudzego posiłku

- **Kroki:**
  1. User A tworzy posiłek (meal_id=X)
  2. User B próbuje: PATCH /api/v1/meals/X
- **Oczekiwany rezultat:**
  - Status 404 Not Found (nie 403, żeby nie ujawniać istnienia)

### 4.2. Generowanie AI

#### TC-AI-001: Generowanie posiłku przez AI (happy path)

- **Kroki:**
  1. POST /api/v1/ai-generations
  2. Body: { "prompt": "Jajecznica z 3 jajek i 2 kromki chleba" }
- **Oczekiwany rezultat:**
  - Status 201 Created
  - Response: { id, status="completed", generated_calories, generated_protein, ... }
  - OpenRouter API wywołane 1 raz
  - Odpowiedź JSON sparsowana poprawnie

#### TC-AI-002: Generowanie z pustym promptem

- **Kroki:**
  1. POST /api/v1/ai-generations
  2. Body: { "prompt": "" }
- **Oczekiwany rezultat:**
  - Status 400 Bad Request
  - Error: Validation error (Zod)

#### TC-AI-003: Generowanie z promptem za długim (>500 znaków)

- **Kroki:**
  1. prompt = 501 znaków
- **Oczekiwany rezultat:**
  - Status 400 Bad Request
  - Error: "Prompt too long"

#### TC-AI-004: OpenRouter API timeout

- **Kroki:**
  1. Mock OpenRouter slow response (>30s)
  2. POST /api/v1/ai-generations
- **Oczekiwany rezultat:**
  - Retry 3 razy (exponential backoff)
  - Po 3 próbach: Status 500
  - ai_generation record: status="failed", error_message zapisany

#### TC-AI-005: OpenRouter API rate limit (429)

- **Kroki:**
  1. Mock OpenRouter response: 429 Too Many Requests
- **Oczekiwany rezultat:**
  - Retry z exponential backoff
  - Jeśli nadal 429: Status 429 do klienta
  - Error message: "Rate limit exceeded, try again later"

#### TC-AI-006: OpenRouter API quota exceeded

- **Kroki:**
  1. Mock OpenRouter response: 402 Payment Required
- **Oczekiwany rezultat:**
  - NIE retry (to nie jest transient error)
  - Status 402 do klienta
  - Error message: "AI quota exceeded"

#### TC-AI-007: OpenRouter zwraca invalid JSON

- **Kroki:**
  1. Mock odpowiedź z malformed JSON
- **Oczekiwany rezultat:**
  - Status 500
  - ParseError thrown
  - ai_generation: status="failed"

#### TC-AI-008: Rate limiting po stronie aplikacji

- **Kroki:**
  1. Użytkownik wysyła 10 requestów AI w ciągu 1 minuty
- **Oczekiwany rezultat:**
  - Pierwsze 5 przechodzi (limit: 5/minute)
  - 6-10: Status 429 Too Many Requests

#### TC-AI-009: Tworzenie meal z nieistniejącym ai_generation_id

- **Kroki:**
  1. POST /api/v1/meals
  2. Body: { ..., "input_method": "ai", "ai_generation_id": "non-existent-uuid" }
- **Oczekiwany rezultat:**
  - Status 404 Not Found
  - Error: "AI generation not found"

#### TC-AI-010: Tworzenie meal z AI generation status="pending"

- **Kroki:**
  1. ai_generation.status = "pending" (nie "completed")
  2. Próba utworzenia meal z tym ai_generation_id
- **Oczekiwany rezultat:**
  - Status 400 Bad Request
  - Error: "AI generation must be completed before creating a meal"

### 4.3. Cele kaloryczne

#### TC-GOAL-001: Tworzenie pierwszego celu

- **Kroki:**
  1. POST /api/v1/calorie-goals
  2. Body: { "daily_goal": 2000, "effective_from": "2025-02-01" }
- **Oczekiwany rezultat:**
  - Status 201 Created
  - Record w tabeli calorie_goals

#### TC-GOAL-002: Tworzenie drugiego celu (overlapping dates)

- **Kroki:**
  1. Cel 1: daily_goal=2000, effective_from="2025-02-01"
  2. Cel 2: daily_goal=2500, effective_from="2025-02-10"
  3. GET /api/v1/calorie-goals/current na 2025-02-05
- **Oczekiwany rezultat:**
  - Zwraca Cel 1 (2000 kcal)
  4. GET /api/v1/calorie-goals/current na 2025-02-15

- **Oczekiwany rezultat:**
  - Zwraca Cel 2 (2500 kcal)

#### TC-GOAL-003: Edycja celu (PATCH)

- **Kroki:**
  1. PATCH /api/v1/calorie-goals/[id]
  2. Body: { "daily_goal": 2200 }
- **Oczekiwany rezultat:**
  - Status 200 OK
  - daily_goal zaktualizowany

#### TC-GOAL-004: Walidacja wartości poza zakresem

- **Kroki:**
  1. POST /api/v1/calorie-goals
  2. Body: { "daily_goal": 300 } (min: 500)
- **Oczekiwany rezultat:**
  - Status 400 Bad Request
  - Error: "Daily goal must be between 500 and 10000"

#### TC-GOAL-005: Pobieranie celu by-date

- **Kroki:**
  1. GET /api/v1/calorie-goals/by-date?date=2025-02-20
- **Oczekiwany rezultat:**
  - Zwraca cel obowiązujący na tę datę (effective_from <= 2025-02-20)

### 4.4. Postęp dzienny

#### TC-PROGRESS-001: Obliczanie dziennego postępu

- **Kroki:**
  1. Użytkownik ma cel: 2000 kcal
  2. Dodaje 3 posiłki: 400 + 600 + 500 = 1500 kcal
  3. GET /api/v1/daily-progress/[date]
- **Oczekiwany rezultat:**
  - total_calories: 1500
  - calorie_goal: 2000
  - calories_remaining: 500
  - progress_percentage: 75%
  - total_protein/carbs/fats: suma z meals

#### TC-PROGRESS-002: Przekroczenie celu

- **Kroki:**
  1. Cel: 2000 kcal
  2. Posiłki: 2500 kcal total
  3. GET /api/v1/daily-progress/[date]
- **Oczekiwany rezultat:**
  - calories_remaining: -500 (nadwyżka)
  - progress_percentage: 125%
  - Status może być "over" (jeśli zaimplementowane)

#### TC-PROGRESS-003: Brak celu kalorycznego

- **Kroki:**
  1. Użytkownik nie ustawił celu
  2. Ma posiłki: 1500 kcal
  3. GET /api/v1/daily-progress/[date]
- **Oczekiwany rezultat:**
  - total_calories: 1500
  - calorie_goal: null
  - calories_remaining: null
  - progress_percentage: null

#### TC-PROGRESS-004: Filtrowanie po zakresie dat

- **Kroki:**
  1. GET /api/v1/daily-progress?date_from=2025-02-01&date_to=2025-02-07
- **Oczekiwany rezultat:**
  - Array z 7 rekordami (jeden per dzień)
  - Każdy z total_calories, progress dla tego dnia

### 4.5. Autentykacja

#### TC-AUTH-001: Rejestracja (z email confirmation)

- **Kroki:**
  1. POST /api/v1/auth/signup
  2. Body: { "email": "test@example.com", "password": "SecurePass123!" }
  3. SKIP_EMAIL_CONFIRMATION=false
- **Oczekiwany rezultat:**
  - Status 200 OK
  - Supabase wysyła email confirmation
  - User musi kliknąć link przed zalogowaniem
  - Trigger tworzy rekord w profiles

#### TC-AUTH-002: Rejestracja (bez email confirmation)

- **Kroki:**
  1. SKIP_EMAIL_CONFIRMATION=true
  2. POST /api/v1/auth/signup
- **Oczekiwany rezultat:**
  - Status 200 OK
  - Użytkownik może się zalogować od razu
  - Profile utworzony

#### TC-AUTH-003: Logowanie (happy path)

- **Kroki:**
  1. POST /api/v1/auth/login
  2. Body: { "email": "test@example.com", "password": "SecurePass123!" }
- **Oczekiwany rezultat:**
  - Status 200 OK
  - Response: { access_token, refresh_token, user }
  - Session cookie ustawiony

#### TC-AUTH-004: Logowanie (złe hasło)

- **Kroki:**
  1. POST /api/v1/auth/login
  2. Body: { "email": "test@example.com", "password": "wrongpassword" }
- **Oczekiwany rezultat:**
  - Status 401 Unauthorized
  - Error: "Invalid credentials"

#### TC-AUTH-005: Wylogowanie

- **Kroki:**
  1. POST /api/v1/auth/logout (z valid token)
- **Oczekiwany rezultat:**
  - Status 200 OK
  - Session invalidated
  - Kolejne requesty z tym tokenem: 401

#### TC-AUTH-006: Reset hasła (forgot password flow)

- **Kroki:**
  1. POST /auth/forgot-password
  2. Body: { "email": "test@example.com" }
  3. Użytkownik klika link w emailu
  4. POST /auth/reset-password
  5. Body: { "token": "...", "password": "NewPass123!" }
- **Oczekiwany rezultat:**
  - Email wysłany
  - Po kliknięciu linku: redirect do reset-password page
  - Nowe hasło ustawione
  - Użytkownik może się zalogować nowym hasłem

#### TC-AUTH-007: Zmiana hasła (authenticated user)

- **Kroki:**
  1. PATCH /api/v1/profile/password
  2. Body: { "current_password": "OldPass123!", "new_password": "NewPass456!" }
  3. User zalogowany
- **Oczekiwany rezultat:**
  - Status 200 OK
  - Hasło zmienione
  - Użytkownik pozostaje zalogowany

#### TC-AUTH-008: Dostęp do protected endpoint bez tokenu

- **Kroki:**
  1. GET /api/v1/meals (bez Authorization header)
- **Oczekiwany rezultat:**
  - Status 401 Unauthorized
  - Error: "Authentication required"

#### TC-AUTH-009: Token expired

- **Kroki:**
  1. Token wygasł (po 1h default)
  2. GET /api/v1/meals
- **Oczekiwany rezultat:**
  - Status 401 Unauthorized
  - Frontend powinien odświeżyć token (refresh_token)

#### TC-AUTH-010: Profile creation trigger

- **Kroki:**
  1. Nowy user rejestruje się
  2. Sprawdź tabelę profiles
- **Oczekiwany rezultat:**
  - Automatycznie utworzony rekord w profiles
  - profiles.id = auth.users.id
  - profiles.email = auth.users.email

---

## 5. Środowisko testowe

### 5.1. Środowiska

**Development (Local):**

- Astro dev server (localhost:3000)
- Supabase Local (Docker) - baza PostgreSQL + Auth
- OpenRouter mock service (src/lib/services/openrouter/openrouter-mock.service.ts)
- Environment: development

**Staging:**

- Astro production build na DigitalOcean
- Supabase Staging Project (cloud)
- OpenRouter test API key (limited quota)
- Environment: staging
- URL: https://staging.simple-calories.com (example)

**Production:**

- Astro production build na DigitalOcean
- Supabase Production Project (cloud)
- OpenRouter production API key
- Environment: production
- URL: https://simple-calories.com (example)

### 5.2. Konfiguracja środowiska testowego

**Zmienne środowiskowe (.env):**

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= (tylko backend)

# OpenRouter
OPENROUTER_API_KEY=

# Auth
SKIP_EMAIL_CONFIRMATION=true (dla testów)

# Environment
NODE_ENV=test
```

**Baza danych testowa:**

- Supabase Local uruchamiany przed testami: `supabase start`
- Migracje wykonywane automatycznie: `supabase db push`
- Reset bazy przed każdym testem suite: `supabase db reset`
- Seed data: fixtures w `tests/fixtures/`

**Docker Compose (dla CI/CD):**

```yaml
services:
  postgres:
    image: supabase/postgres:latest
  astro:
    build: .
    ports: "3000:3000"
```

### 5.3. Dane testowe

**Test users:**

- user1@test.com / TestPass123!
- user2@test.com / TestPass123!
- admin@test.com / AdminPass123! (jeśli role admin)

**Seed meals:**

- 100 meals dla user1 (różne daty, kategorie)
- 50 meals dla user2
- Mix input_method: manual (60%), ai (30%), ai-edited (10%)

**Seed AI generations:**

- 50 completed
- 10 failed
- 5 pending

**Seed calorie goals:**

- user1: 2000 kcal effective_from 2025-01-01
- user1: 2500 kcal effective_from 2025-02-01 (test overlapping)
- user2: 1800 kcal

---

## 6. Narzędzia do testowania

### 6.1. Test Frameworks & Libraries

| Narzędzie                   | Wersja  | Zastosowanie                  |
| --------------------------- | ------- | ----------------------------- |
| Vitest                      | ^2.0.0  | Unit tests, Integration tests |
| React Testing Library       | ^16.0.0 | React components testing      |
| Playwright                  | ^1.48.0 | E2E tests                     |
| Supertest                   | ^7.0.0  | HTTP API testing              |
| @testing-library/user-event | ^14.5.0 | User interactions simulation  |

### 6.2. Mocking & Fixtures

| Narzędzie                  | Zastosowanie                        |
| -------------------------- | ----------------------------------- |
| vitest mock functions      | Mockowanie serwisów, API calls      |
| MSW (Mock Service Worker)  | Mockowanie HTTP requests            |
| openrouter-mock.service.ts | Mock OpenRouter API                 |
| Supabase Local             | Real database dla integration tests |

### 6.3. Code Quality & Coverage

| Narzędzie            | Zastosowanie                   |
| -------------------- | ------------------------------ |
| ESLint               | Linting (już w projekcie)      |
| Prettier             | Formatowanie (już w projekcie) |
| Vitest Coverage (c8) | Code coverage                  |
| TypeScript Compiler  | Type checking                  |

### 6.4. CI/CD & Automation

| Narzędzie      | Zastosowanie                           |
| -------------- | -------------------------------------- |
| GitHub Actions | Pipeline CI/CD (już w projekcie)       |
| Husky          | Pre-commit hooks (już w projekcie)     |
| lint-staged    | Linting staged files (już w projekcie) |

### 6.5. Performance & Security

| Narzędzie     | Zastosowanie               |
| ------------- | -------------------------- |
| k6            | Load testing               |
| Lighthouse CI | Frontend performance       |
| OWASP ZAP     | Security scanning          |
| npm audit     | Dependency vulnerabilities |

### 6.6. Accessibility

| Narzędzie            | Zastosowanie              |
| -------------------- | ------------------------- |
| axe-core             | Automated a11y testing    |
| @axe-core/playwright | Integration z Playwright  |
| pa11y                | Command-line a11y testing |

### 6.7. Visual Regression

| Narzędzie              | Zastosowanie              |
| ---------------------- | ------------------------- |
| Percy                  | Visual testing (zalecane) |
| Playwright Screenshots | Baseline screenshots      |

---

## 7. Harmonogram testów

### 7.1. Fazy testowania

**Faza 1: Setup & Unit Tests (Tydzień 1-2)**

- Konfiguracja środowiska testowego
- Setup Vitest, RTL, Playwright
- Pisanie unit tests dla serwisów
- Pisanie unit tests dla validators/helpers
- Pisanie unit tests dla Zod schemas
- Pisanie unit tests dla React hooks
- Target: 80% code coverage

**Faza 2: Integration Tests (Tydzień 3)**

- Setup Supabase Local
- Testy API endpoints (wszystkie routes)
- Testy database layer (migracje, triggers, views)
- Testy service integration
- Testy authentication & authorization

**Faza 3: E2E Tests (Tydzień 4)**

- Setup Playwright
- Pisanie E2E scenarios (10 głównych flow)
- Testy responsive design
- Testy error scenarios
- Smoke tests dla staging/production

**Faza 4: Non-Functional Tests (Tydzień 5)**

- Performance tests (k6)
- Security tests (OWASP ZAP, npm audit)
- Accessibility tests (axe-core)
- Visual regression tests (Percy)
- Load testing

**Faza 5: Regression & Bug Fixing (Tydzień 6)**

- Regression testing po bug fixes
- Re-testing failed tests
- Final smoke test
- Dokumentacja wyników

### 7.2. Harmonogram w kontekście CI/CD

**Pre-commit (Husky):**

- ESLint
- Prettier
- Type checking

**Pull Request (GitHub Actions):**

- Unit tests (all)
- Integration tests (all)
- Code coverage check (min 80%)
- Build verification

**Merge to develop branch:**

- Full test suite (unit + integration + E2E)
- Deploy to staging
- Smoke tests on staging

**Merge to main branch:**

- Full test suite
- Performance tests
- Security tests
- Deploy to production
- Smoke tests on production

**Nightly builds:**

- Full regression suite
- Visual regression tests
- Load tests

---

## 8. Kryteria akceptacji testów

### 8.1. Kryteria wyjścia (Exit Criteria)

Testy uznajemy za zakończone pomyślnie, gdy:

1. **Code Coverage:**
   - Unit tests: minimum 80% line coverage
   - Critical paths (meals, AI, auth): minimum 90% coverage
   - Branch coverage: minimum 75%

2. **Test Pass Rate:**
   - Unit tests: 100% pass rate
   - Integration tests: 100% pass rate
   - E2E tests: 95% pass rate (5% może być flaky, require re-run)

3. **Performance:**
   - Wszystkie GET endpoints < 200ms (95th percentile)
   - Wszystkie POST/PATCH endpoints < 500ms
   - AI generation < 5s (median)
   - Lighthouse score > 90 dla wszystkich stron

4. **Security:**
   - Zero critical vulnerabilities (npm audit)
   - Zero high vulnerabilities (OWASP ZAP)
   - Wszystkie authentication/authorization tests pass

5. **Accessibility:**
   - Zero critical a11y issues (axe-core)
   - Zero issues dla WCAG 2.1 Level A
   - Maximum 5 warnings dla Level AA

6. **Bugs:**
   - Zero P0 (critical) bugs open
   - Zero P1 (high) bugs open
   - Maximum 5 P2 (medium) bugs open
   - P3 (low) bugs mogą pozostać jako backlog

### 8.2. Definicje priorytetów błędów

**P0 - Critical:**

- Aplikacja nie startuje
- Nie można się zalogować/zarejestrować
- Utrata danych użytkownika
- Security breach

**P1 - High:**

- Kluczowa funkcja nie działa (np. dodawanie posiłków)
- AI generation zawsze failuje
- Błędne obliczenia dziennego postępu
- Authorization bypass

**P2 - Medium:**

- Funkcja działa ale z błędami (np. validation nie zawsze poprawna)
- UI issues (layout broken, poor UX)
- Performance degradation

**P3 - Low:**

- Kosmetyczne issues
- Minor UX improvements
- Nice-to-have features

### 8.3. Metryki sukcesu

**Quantitative:**

- Defect Detection Rate (DDR): minimum 90% defects wykrytych w testach (nie przez users)
- Test Execution Efficiency: < 30 minut dla full test suite
- Mean Time To Detect (MTTD): < 24h od wprowadzenia defectu
- Test Automation Coverage: minimum 70% testów zautomatyzowanych

**Qualitative:**

- User acceptance testing (UAT) pass
- Stakeholder approval
- No blockers for production release

---

## 9. Role i odpowiedzialności w procesie testowania

### 9.1. Role

**QA Engineer (Lead):**

- Projektowanie strategii testów
- Tworzenie planu testów
- Nadzór nad wykonaniem testów
- Zarządzanie defektami
- Raportowanie do stakeholders

**QA Engineers (2-3 osoby):**

- Pisanie test cases
- Wykonywanie testów manualnych
- Pisanie testów automatycznych
- Reprodukcja i weryfikacja bugów
- Regression testing

**Developers:**

- Pisanie unit tests dla własnego kodu
- Fixing defects
- Code reviews z perspektywą testability
- Wsparcie QA w zrozumieniu funkcjonalności

**DevOps Engineer:**

- Setup środowisk testowych
- Konfiguracja CI/CD pipeline
- Monitoring performance w testach
- Infrastructure dla load testing

**Product Owner:**

- Definiowanie acceptance criteria
- Priorytetyzacja bugów
- User acceptance testing (UAT)
- Final approval dla release

### 9.2. RACI Matrix

| Aktywność         | QA Lead | QA Eng | Dev | DevOps | PO  |
| ----------------- | ------- | ------ | --- | ------ | --- |
| Plan testów       | R/A     | C      | C   | I      | A   |
| Unit tests        | I       | I      | R/A | I      | I   |
| Integration tests | A       | R      | C   | C      | I   |
| E2E tests         | A       | R      | C   | I      | I   |
| Performance tests | A       | R      | I   | C      | I   |
| Security tests    | A       | R      | C   | C      | I   |
| Defect management | R/A     | C      | R   | I      | A   |
| CI/CD setup       | C       | I      | C   | R/A    | I   |
| UAT               | C       | C      | I   | I      | R/A |
| Release decision  | C       | C      | C   | C      | R/A |

**Legenda:** R - Responsible, A - Accountable, C - Consulted, I - Informed

---

## 10. Procedury raportowania błędów

### 10.1. Proces zgłaszania defektu

1. **Wykrycie defektu** przez QA Engineer
2. **Reprodukcja** - upewnienie się, że defekt jest powtarzalny
3. **Utworzenie ticket** w systemie (GitHub Issues)
4. **Wypełnienie template** (poniżej)
5. **Przypisanie priorytetu** (P0-P3) i severity
6. **Assignment** do właściwego developera
7. **Notification** do QA Lead i PO (dla P0/P1)

### 10.2. Template zgłoszenia defektu (GitHub Issue)

```markdown
## Opis defektu

[Krótki opis problemu]

## Priorytet & Severity

- Priorytet: P1 (Critical/High/Medium/Low)
- Severity: High (Blocker/High/Medium/Low)

## Środowisko

- Environment: Development/Staging/Production
- Browser: Chrome 120 (jeśli applicable)
- OS: Windows 11 / macOS 14 / etc.
- Device: Desktop / Mobile (iPhone 15) / etc.

## Kroki reprodukcji

1. Zaloguj się jako user@test.com
2. Kliknij "Dodaj posiłek"
3. Wybierz tryb AI
4. Wpisz prompt "Test"
5. Kliknij "Generuj"

## Oczekiwany rezultat

AI generation powinno się wykonać i zwrócić wynik

## Aktualny rezultat

Aplikacja wyświetla błąd "Network Error"

## Logi / Screenshots

[Załącz screenshot, console logs, network trace]

## Dodatkowe informacje

- Błąd występuje tylko dla promptów krótszych niż 10 znaków
- W console: "OpenRouterError: Invalid prompt length"

## Related Test Case

TC-AI-003

## Assigned to

@developer-username
```

### 10.3. Cykl życia defektu

```
New → In Progress → Ready for Test → Closed
  ↓         ↓              ↓
Duplicate  Won't Fix    Reopened
```

**Statusy:**

- **New:** Defekt zgłoszony, oczekuje na przypisanie
- **In Progress:** Developer pracuje nad fixem
- **Ready for Test:** Fix zdeployowany, oczekuje weryfikacji QA
- **Closed:** QA zweryfikował fix, defekt zamknięty
- **Reopened:** Defekt nadal występuje po fix
- **Duplicate:** Duplikat innego ticketa
- **Won't Fix:** Uznany jako not a bug / won't fix

### 10.4. SLA dla defektów

| Priorytet     | Time to Acknowledge | Time to Fix | Time to Verify |
| ------------- | ------------------- | ----------- | -------------- |
| P0 - Critical | 1h                  | 4h          | 2h             |
| P1 - High     | 4h                  | 24h         | 8h             |
| P2 - Medium   | 24h                 | 5 dni       | 2 dni          |
| P3 - Low      | 48h                 | Backlog     | Backlog        |

### 10.5. Raportowanie do stakeholders

**Daily Standup (dla QA):**

- Liczba testów wykonanych wczoraj
- Liczba nowych defektów
- Blockers

**Tygodniowy raport testów:**

- Test execution status (% completed)
- Pass/Fail/Blocked rate
- Defect metrics (new, fixed, open by priority)
- Coverage metrics
- Risks & issues

**End-of-Phase raport:**

- Podsumowanie fazy testów
- Wszystkie metryki (coverage, pass rate, defects)
- Exit criteria status
- Rekomendacja (Go/No-Go dla release)

**Format raportów:**

- Confluence/Notion document
- Dashboard (Grafana/Kibana dla metryk CI/CD)
- Slack notifications dla critical issues

---

## 11. Ryzyka i mitigation strategies

### 11.1. Ryzyka testowe

| Ryzyko                                    | Prawdopodobieństwo | Wpływ  | Mitigation                                                                    |
| ----------------------------------------- | ------------------ | ------ | ----------------------------------------------------------------------------- |
| OpenRouter API unavailable podczas testów | Medium             | High   | Używać mock service w unit/integration tests; E2E tests na staging z fallback |
| Flaky E2E tests (timing issues)           | High               | Medium | Implementować smart waits w Playwright; retry logic dla flaky tests           |
| Insufficient test data                    | Medium             | Medium | Automated seed scripts; fixtures dla każdego test case                        |
| CI/CD pipeline too slow                   | Medium             | Medium | Równoległe wykonywanie testów; selective test runs dla PRs                    |
| Database state pollution                  | High               | High   | Reset bazy przed każdym test suite; izolacja transakcji                       |
| Missing test coverage w critical paths    | Low                | High   | Mandatory coverage checks w CI; code review z perspektywą testability         |
| Resource constraints (QA team size)       | Medium             | Medium | Priorytetyzacja testów (risk-based); automation dla repetitive tests          |
| Late requirement changes                  | Medium             | High   | Agile approach; continuous testing; regression automation                     |

### 11.2. Strategie mitigation

**OpenRouter API unavailability:**

- Mock OpenRouterService w 90% testów
- Dedykowany test API key dla staging (z niskim quota)
- Contract testing - sprawdzanie tylko schema responses
- Fallback do cache w przypadku API failure (jeśli zaimplementowane)

**Flaky E2E tests:**

- Playwright auto-wait mechanisms
- Explicit waits dla API responses (`page.waitForResponse`)
- Retry failed tests (max 2 razy)
- Segregacja tests: stable suite (run always) vs flaky suite (run nightly)

**Insufficient test data:**

- `tests/fixtures/seed.ts` - automated seeding
- Factory functions dla generowania test data
- Realistic data (faker.js dla names, emails, descriptions)
- Separate fixtures dla każdego test scenario

**CI/CD pipeline performance:**

- Parallel execution: vitest workers, playwright sharding
- Selective runs: unit tests dla każdego PR, full suite dla merge
- Caching: dependencies, build artifacts
- Cloud CI runners (GitHub Actions premium dla private repo)

**Database state pollution:**

- `beforeEach(() => resetDatabase())` w integration tests
- Transactional tests: rollback po każdym test case
- Isolated Supabase projects dla każdego branch (staging-feature-X)
- Docker containers dla local testing (pełna izolacja)

---

## 12. Załączniki

### 12.1. Przydatne linki

- **Dokumentacja projektu:** (link do README.md, CONTRIBUTING.md)
- **Supabase Dashboard:** (link)
- **OpenRouter Dashboard:** (link)
- **GitHub Repository:** https://github.com/[your-org]/simple-calories
- **CI/CD Pipeline:** (GitHub Actions tab)
- **Test Coverage Report:** (link po deploy np. Codecov)
- **Bug Tracking:** GitHub Issues
- **Test Management:** (jeśli używane narzędzie jak TestRail)

### 12.2. Dokumenty referencyjne

- PRD (Product Requirements Document)
- API Documentation (jeśli swagger/openapi)
- Database Schema (database.types.ts)
- Supabase Migrations (supabase/migrations/)
- Tech Stack Documentation (.ai/tech-stack.md)

### 12.3. Kontakty

- **QA Lead:** [email]
- **Tech Lead / Dev Lead:** [email]
- **DevOps Engineer:** [email]
- **Product Owner:** [email]
- **Slack Channels:** #simple-calories-qa, #simple-calories-dev

### 12.4. Glosariusz

| Termin         | Definicja                                           |
| -------------- | --------------------------------------------------- |
| Meal           | Posiłek użytkownika z informacjami nutricyjnymi     |
| AI Generation  | Proces generowania posiłku przez model AI           |
| Input Method   | Sposób wprowadzenia posiłku: manual, ai, ai-edited  |
| Macronutrients | Makroskładniki: protein, carbs, fats                |
| Calorie Goal   | Cel kaloryczny użytkownika na dzień                 |
| Daily Progress | Dzienny postęp vs cel kaloryczny                    |
| RLS            | Row Level Security w PostgreSQL                     |
| Supabase       | Backend-as-a-Service (PostgreSQL + Auth + Storage)  |
| OpenRouter     | API gateway dla modeli AI (OpenAI, Anthropic, etc.) |
| SSR            | Server-Side Rendering                               |
| Astro Islands  | Architektura partial hydration w Astro              |

---

## Podsumowanie

Plan testów dla aplikacji Simple Calories obejmuje kompleksowe podejście do zapewnienia jakości, od testów jednostkowych przez integracyjne, E2E, wydajnościowe, bezpieczeństwa, aż po accessibility. Kluczowe obszary ryzyka (integracja OpenRouter, walidacja makroskładników, autentykacja, integralność bazy danych) zostały zidentyfikowane i będą testowane priorytetowo.

Strategia testowania uwzględnia specyfikę stosu technologicznego (Astro + React, Supabase, OpenRouter) i zapewnia automatyzację 70%+ testów w pipeline CI/CD. Harmonogram 6-tygodniowy pozwala na iteracyjne budowanie coverage i reagowanie na feedback.

Kryteria wyjścia (80% coverage, 100% pass rate dla unit/integration, performance metrics, zero critical bugs) gwarantują wysoki poziom jakości przed każdym release'em.

**Data stworzenia planu:** 2025-02-04
**Wersja:** 1.0
**Status:** Draft - do review z zespołem
