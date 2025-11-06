# API Endpoint Implementation Plan: Daily Progress

## 1. Przegląd punktów końcowych

### GET /api/v1/daily-progress

Zwraca listę dziennych postępów użytkownika z paginacją. Każdy rekord zawiera sumę kalorii i makroskładników z danego dnia, cel kaloryczny, procent realizacji oraz status.

### GET /api/v1/daily-progress/:date

Zwraca postęp użytkownika dla konkretnego dnia. Jeśli użytkownik nie ma żadnych posiłków w danym dniu, zwraca "zero progress" z aktualnym celem kalorycznym (zamiast 404).

## 2. Szczegóły żądania

### GET /api/v1/daily-progress

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/daily-progress`

**Authentication:** Required (Bearer token w nagłówku Authorization)

**Query Parameters:**

- **Opcjonalne:**
  - `date_from` (string, format: YYYY-MM-DD) - data początkowa filtrowania
  - `date_to` (string, format: YYYY-MM-DD) - data końcowa filtrowania
  - `limit` (number, default: 30, range: 1-100) - liczba rekordów do zwrócenia
  - `offset` (number, default: 0, min: 0) - liczba rekordów do pominięcia

**Request Body:** Brak

**Walidacja:**

- Format daty musi być YYYY-MM-DD
- `date_from` musi być <= `date_to`
- `limit` musi być w zakresie 1-100
- `offset` musi być >= 0

### GET /api/v1/daily-progress/:date

**Metoda HTTP:** GET

**Struktura URL:** `/api/v1/daily-progress/:date`

**Authentication:** Required (Bearer token w nagłówku Authorization)

**URL Parameters:**

- **Wymagane:**
  - `date` (string, format: YYYY-MM-DD) - data dla której pobieramy postęp

**Request Body:** Brak

**Walidacja:**

- Format daty musi być YYYY-MM-DD
- Data nie może być w przyszłości (> CURRENT_DATE)

## 3. Wykorzystywane typy

### Istniejące typy (src/types.ts):

```typescript
// Response types - już zdefiniowane
DailyProgressResponseDTO;
DailyProgressListResponseDTO;
DailyProgressStatus;
PaginationMetaDTO;
ErrorResponseDTO;
```

### Nowe typy do utworzenia:

**W src/lib/services/daily-progress.service.ts:**

```typescript
// Query parameters dla getDailyProgressList
interface GetDailyProgressListParams {
  userId: string;
  dateFrom?: string;
  dateTo?: string;
  limit: number;
  offset: number;
}

// Result z view daily_progress (raw z bazy)
interface DailyProgressViewRow {
  date: string;
  user_id: string;
  total_calories: number | null;
  total_protein: number | null;
  total_carbs: number | null;
  total_fats: number | null;
  calorie_goal: number;
  percentage: number | null;
}
```

### Zod Schemas do utworzenia:

**W src/pages/api/v1/daily-progress/index.ts:**

```typescript
const dailyProgressListQuerySchema = z
  .object({
    date_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    date_to: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      if (data.date_from && data.date_to) {
        return new Date(data.date_from) <= new Date(data.date_to);
      }
      return true;
    },
    { message: "date_from must be less than or equal to date_to" }
  );
```

**W src/pages/api/v1/daily-progress/[date].ts:**

```typescript
const dailyProgressDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine(
    (date) => {
      const requestDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return requestDate <= today;
    },
    { message: "Date cannot be in the future" }
  );
```

## 4. Szczegóły odpowiedzi

### GET /api/v1/daily-progress

**Response 200 (Success):**

```json
{
  "data": [
    {
      "date": "2025-01-27",
      "user_id": "uuid",
      "total_calories": 2150,
      "total_protein": 95.5,
      "total_carbs": 220.0,
      "total_fats": 75.0,
      "calorie_goal": 2500,
      "percentage": 86.0,
      "status": "under"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 30,
    "offset": 0
  }
}
```

**Response 400 (Bad Request):**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid query parameters",
  "details": {
    "date_from": "Date must be in YYYY-MM-DD format"
  }
}
```

**Response 401 (Unauthorized):**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**Response 500 (Internal Server Error):**

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

### GET /api/v1/daily-progress/:date

**Response 200 (Success - with meals):**

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 2150,
  "total_protein": 95.5,
  "total_carbs": 220.0,
  "total_fats": 75.0,
  "calorie_goal": 2500,
  "percentage": 86.0,
  "status": "under"
}
```

**Response 200 (Success - no meals, zero progress):**

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fats": 0,
  "calorie_goal": 2500,
  "percentage": 0.0,
  "status": "under"
}
```

**Response 400, 401, 500:** Jak wyżej

## 5. Przepływ danych

### GET /api/v1/daily-progress

```
1. Client Request
   ↓
2. Astro API Route (/api/v1/daily-progress/index.ts)
   ↓
3. Middleware - weryfikacja autoryzacji
   ↓
4. Walidacja query params (Zod)
   ↓
5. Pobranie user_id z context.locals.supabase.auth.getUser()
   ↓
6. DailyProgressService.getDailyProgressList()
   ↓
7. Supabase Query:
   - SELECT * FROM daily_progress
   - WHERE user_id = $user_id
   - AND date >= $date_from (jeśli podane)
   - AND date <= $date_to (jeśli podane)
   - ORDER BY date DESC
   - LIMIT $limit OFFSET $offset
   ↓
8. Supabase Query dla total:
   - SELECT COUNT(*) FROM daily_progress
   - WHERE user_id = $user_id
   - AND date filters
   ↓
9. Transformacja danych:
   - Konwersja null → 0 dla sum makroskładników
   - Obliczenie status (under/on_track/over)
   ↓
10. Response z data + pagination
```

### GET /api/v1/daily-progress/:date

```
1. Client Request
   ↓
2. Astro API Route (/api/v1/daily-progress/[date].ts)
   ↓
3. Middleware - weryfikacja autoryzacji
   ↓
4. Walidacja date param (Zod)
   ↓
5. Pobranie user_id z context.locals.supabase.auth.getUser()
   ↓
6. DailyProgressService.getDailyProgressByDate()
   ↓
7. Supabase Query:
   - SELECT * FROM daily_progress
   - WHERE user_id = $user_id AND date = $date
   ↓
8a. Jeśli wynik istnieje:
    - Konwersja null → 0
    - Obliczenie status
    - Return progress
   ↓
8b. Jeśli brak wyniku:
    - Pobranie calorie_goal:
      SELECT get_current_calorie_goal($user_id, $date)
    - Utworzenie zero progress object
    - Return zero progress
   ↓
9. Response
```

### Interakcje z bazą danych:

**View daily_progress** (istniejący w bazie):

- Agreguje meals po dacie i user_id
- Używa funkcji get_current_calorie_goal() dla celu
- RLS automatycznie filtruje po auth.uid()

**Funkcja get_current_calorie_goal()** (istniejąca w bazie):

- Pobiera aktualny cel kaloryczny dla użytkownika i daty
- Fallback na 2000 kcal jeśli brak wpisu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:

- **Wymagane:** Bearer token w nagłówku Authorization
- **Weryfikacja:** context.locals.supabase.auth.getUser()
- **Zwracany kod:** 401 jeśli brak tokena lub token nieprawidłowy

### Autoryzacja:

- **RLS (Row Level Security):** View daily_progress automatycznie filtruje po auth.uid()
- **Izolacja danych:** Użytkownik może zobaczyć tylko swoje dane
- **Dodatkowa weryfikacja:** W service sprawdzamy czy user_id z tokena == user_id z query

### Walidacja danych:

1. **Format daty:**
   - Regex: `/^\d{4}-\d{2}-\d{2}$/`
   - Walidacja że parsuje się do prawidłowej daty

2. **Logiczna walidacja dat:**
   - date_from <= date_to
   - date nie może być w przyszłości

3. **Walidacja numeryczna:**
   - limit: 1-100
   - offset: >= 0

4. **SQL Injection:**
   - Zabezpieczone przez Supabase parametrized queries
   - Wszystkie wartości przekazywane jako parametry, nie string interpolation

### Rate Limiting:

- **MVP:** Brak implementacji (do rozważenia w przyszłości)
- **Sugestia:** Middleware z limitem 100 requests/minute per user

### Exposure wrażliwych danych:

- **user_id w response:** Akceptowalne, użytkownik widzi tylko swój ID
- **calorie_goal:** Dane użytkownika, chronione przez RLS
- **Brak:** Nie exposujemy danych innych użytkowników

## 7. Obsługa błędów

### 400 Bad Request

**Przypadki:**

1. Nieprawidłowy format daty

   ```json
   {
     "error": "VALIDATION_ERROR",
     "message": "Invalid date format",
     "details": { "date_from": "Date must be in YYYY-MM-DD format" }
   }
   ```

2. date_from > date_to

   ```json
   {
     "error": "VALIDATION_ERROR",
     "message": "Invalid date range",
     "details": { "date_range": "date_from must be less than or equal to date_to" }
   }
   ```

3. Invalid limit/offset

   ```json
   {
     "error": "VALIDATION_ERROR",
     "message": "Invalid pagination parameters",
     "details": { "limit": "Must be between 1 and 100" }
   }
   ```

4. Data w przyszłości
   ```json
   {
     "error": "VALIDATION_ERROR",
     "message": "Invalid date",
     "details": { "date": "Date cannot be in the future" }
   }
   ```

**Logowanie:** Brak (to user error, nie server error)

### 401 Unauthorized

**Przypadki:**

1. Brak tokena autoryzacji
2. Token nieprawidłowy
3. Token wygasły

**Response:**

```json
{
  "error": "UNAUTHORIZED",
  "message": "Authentication required"
}
```

**Logowanie:** Brak (normalne zachowanie)

### 500 Internal Server Error

**Przypadki:**

1. Błąd połączenia z Supabase
2. Błąd w funkcji get_current_calorie_goal()
3. Nieoczekiwany błąd w service
4. Błąd w transformacji danych

**Response:**

```json
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected error occurred"
}
```

**Logowanie do error_logs:**

```typescript
{
  user_id: userId,
  error_type: 'daily_progress_fetch_failed',
  error_message: error.message,
  error_details: {
    stack: error.stack,
    endpoint: request.url
  },
  context: {
    method: 'GET',
    params: { date_from, date_to, limit, offset }
  }
}
```

### Strategia obsługi błędów w kodzie:

```typescript
try {
  // Business logic
} catch (error) {
  // Log to error_logs if 500
  if (!(error instanceof ValidationError)) {
    await logError(supabase, {
      user_id: userId,
      error_type: "daily_progress_fetch_failed",
      error_message: error.message,
      error_details: { stack: error.stack },
      context: { endpoint, params },
    });
  }

  // Return appropriate error response
  return new Response(JSON.stringify({ error: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

## 8. Rozważania dotyczące wydajności

### Potencjalne wąskie gardła:

1. **View daily_progress:**
   - Agreguje wszystkie meals użytkownika przy każdym query
   - **Optymalizacja:** Istniejące indeksy: `idx_meals_user_timestamp`
   - **Monitoring:** Sprawdzić EXPLAIN ANALYZE dla view

2. **COUNT(\*) query dla paginacji:**
   - Może być kosztowny dla dużej liczby rekordów
   - **Optymalizacja:** Użyć COUNT(\*) OVER() window function w jednym query
   - **Alternatywa:** Cursor-based pagination (dla przyszłości)

3. **Funkcja get_current_calorie_goal():**
   - Wywoływana dla każdego dnia w view
   - **Optymalizacja:** Funkcja oznaczona jako STABLE - query planner może ją cache'ować
   - **Index:** `idx_calorie_goals_user_date` wspiera szybkie wyszukiwanie

4. **N+1 problem:**
   - Brak - wszystko pobierane w jednym query przez view

### Strategie optymalizacji:

1. **Single query z COUNT OVER():**

   ```sql
   SELECT *, COUNT(*) OVER() as total_count
   FROM daily_progress
   WHERE user_id = $user_id AND ...
   ORDER BY date DESC
   LIMIT $limit OFFSET $offset
   ```

2. **Caching na poziomie aplikacji:**
   - MVP: Brak cache
   - Przyszłość: Redis cache dla często pobieranych dat

3. **Batch processing:**
   - Nie dotyczy - read-only endpoints

4. **Database connection pooling:**
   - Supabase zarządza automatycznie

5. **Response compression:**
   - Astro obsługuje gzip/brotli automatycznie

### Limity i guardrails:

- **Max limit:** 100 rekordów (zapobiega nadmiernym query)
- **Default limit:** 30 rekordów (rozsądny balans)
- **Date range:** Brak limitu (do rozważenia: max 1 rok?)

### Monitoring:

- **Metryki do śledzenia:**
  - Query execution time
  - View performance
  - API response time (p50, p95, p99)
  - Error rate

## 9. Kroki implementacji

### Krok 1: Utworzenie helper functions

**Lokalizacja:** `src/lib/helpers/date.ts`

**Zadania:**

- Funkcja `isValidDateFormat(date: string): boolean` - waliduje format YYYY-MM-DD
- Funkcja `isDateInFuture(date: string): boolean` - sprawdza czy data jest w przyszłości

**Test:** Unit testy dla funkcji pomocniczych

---

### Krok 2: Utworzenie service

**Lokalizacja:** `src/lib/services/daily-progress.service.ts`

**Zadania:**

1. Zdefiniować interfejsy:
   - `GetDailyProgressListParams`
   - `DailyProgressViewRow`

2. Implementować funkcje:
   - `calculateStatus(totalCalories: number, calorieGoal: number): DailyProgressStatus`
     - Logic: if totalCalories < calorieGoal - 100 → "under"
     - if totalCalories > calorieGoal + 100 → "over"
     - else → "on_track"

   - `transformViewRowToDTO(row: DailyProgressViewRow): DailyProgressResponseDTO`
     - Konwertuje null → 0 dla sums
     - Dodaje status

   - `async getDailyProgressList(supabase: SupabaseClient, params: GetDailyProgressListParams): Promise<DailyProgressListResponseDTO>`
     - Query do view daily_progress z filtrami
     - Użyj COUNT(\*) OVER() dla total
     - Transform results
     - Return { data, pagination }

   - `async getDailyProgressByDate(supabase: SupabaseClient, userId: string, date: string): Promise<DailyProgressResponseDTO>`
     - Query do view daily_progress dla konkretnej daty
     - Jeśli brak wyniku: pobierz calorie_goal i zwróć zero progress
     - Jeśli wynik: transform i zwróć

3. Implementować helper:
   - `async getZeroProgress(supabase: SupabaseClient, userId: string, date: string): Promise<DailyProgressResponseDTO>`
     - Query: SELECT get_current_calorie_goal($userId, $date)
     - Return zero progress object

**Test:** Unit testy dla calculateStatus, integration testy dla getDailyProgressList i getDailyProgressByDate

---

### Krok 3: Utworzenie error logging utility

**Lokalizacja:** `src/lib/helpers/error-logger.ts` (jeśli nie istnieje)

**Zadania:**

- Funkcja `logError(supabase: SupabaseClient, errorData: ErrorLogData): Promise<void>`
- Insert do tabeli error_logs
- Obsługa przypadku gdy insert się nie powiedzie (console.error fallback)

**Test:** Integration test z Supabase

---

### Krok 4: Implementacja GET /api/v1/daily-progress

**Lokalizacja:** `src/pages/api/v1/daily-progress/index.ts`

**Zadania:**

1. `export const prerender = false`

2. Zdefiniować Zod schema:
   - `dailyProgressListQuerySchema`

3. Implementować handler `GET`:

   ```typescript
   export async function GET(context: APIContext): Promise<Response>;
   ```

4. Flow:
   - Pobierz supabase z context.locals
   - Pobierz user z supabase.auth.getUser()
   - Jeśli brak user → 401
   - Parse i validate query params z Zod
   - Jeśli validation error → 400
   - Call service.getDailyProgressList()
   - Return 200 z data

5. Error handling:
   - try/catch
   - Log server errors
   - Return appropriate status codes

**Test:** Integration testy dla różnych scenariuszy (success, validation errors, auth errors)

---

### Krok 5: Implementacja GET /api/v1/daily-progress/:date

**Lokalizacja:** `src/pages/api/v1/daily-progress/[date].ts`

**Zadania:**

1. `export const prerender = false`

2. Zdefiniować Zod schema:
   - `dailyProgressDateSchema`

3. Implementować handler `GET`:

   ```typescript
   export async function GET(context: APIContext): Promise<Response>;
   ```

4. Flow:
   - Pobierz supabase z context.locals
   - Pobierz user z supabase.auth.getUser()
   - Jeśli brak user → 401
   - Pobierz date z context.params.date
   - Validate date z Zod
   - Jeśli validation error → 400
   - Call service.getDailyProgressByDate()
   - Return 200 z data

5. Error handling:
   - try/catch
   - Log server errors
   - Return appropriate status codes

**Test:** Integration testy (with meals, without meals, invalid date, unauthorized)

---

### Krok 6: Testy integracyjne

**Lokalizacja:** `src/__tests__/api/daily-progress.test.ts`

**Zadania:**

1. Setup test database i test user
2. Testy dla GET /api/v1/daily-progress:
   - Lista z meals (success)
   - Lista pusta (success, empty array)
   - Filtrowanie po date_from/date_to
   - Paginacja (limit/offset)
   - Invalid query params (400)
   - Unauthorized (401)

3. Testy dla GET /api/v1/daily-progress/:date:
   - Dzień z meals (success)
   - Dzień bez meals (success, zero progress)
   - Invalid date format (400)
   - Data w przyszłości (400)
   - Unauthorized (401)

4. Test security:
   - RLS enforcement (user A nie widzi danych user B)

**Test:** Uruchom pełny test suite

---

### Krok 7: Weryfikacja w bazie danych

**Zadania:**

1. Sprawdź czy view daily_progress działa poprawnie
2. Sprawdź czy funkcja get_current_calorie_goal() zwraca prawidłowe wartości
3. Sprawdź performance z EXPLAIN ANALYZE
4. Sprawdź czy RLS policies są aktywne

---

### Krok 8: Dokumentacja

**Zadania:**

1. Dodać JSDoc comments do service functions
2. Dodać przykłady użycia w komentarzach
3. Zaktualizować README z informacją o nowych endpointach
4. Utworzyć przykłady curl/fetch requests

---

### Krok 9: Code review i QA

**Zadania:**

1. Code review checklist:
   - Type safety (wszystkie typy zdefiniowane)
   - Error handling (wszystkie błędy obsłużone)
   - Security (RLS, validation, auth)
   - Performance (indeksy, query optimization)
   - Tests (coverage > 80%)

2. Manual testing:
   - Test w Postman/Insomnia
   - Test edge cases
   - Test z różnymi user accounts

---

### Krok 10: Deployment

**Zadania:**

1. Merge do głównej gałęzi
2. Deploy na staging environment
3. Smoke tests na staging
4. Deploy na production
5. Monitor error logs i performance metrics

---

## 10. Checklisty

### Pre-implementation checklist:

- [ ] View daily_progress istnieje w bazie
- [ ] Funkcja get_current_calorie_goal() istnieje w bazie
- [ ] RLS policies są aktywne
- [ ] Indeksy są utworzone
- [ ] Typy w types.ts są aktualne

### Implementation checklist:

- [ ] Helper functions utworzone i przetestowane
- [ ] Service utworzony i przetestowany
- [ ] Error logger utworzony
- [ ] GET /api/v1/daily-progress zaimplementowany
- [ ] GET /api/v1/daily-progress/:date zaimplementowany
- [ ] Testy jednostkowe napisane i przechodzą
- [ ] Testy integracyjne napisane i przechodzą
- [ ] Code review completed
- [ ] Manual testing completed

### Post-deployment checklist:

- [ ] Endpoints działają na staging
- [ ] Error logs są puste
- [ ] Response times są akceptowalne (< 500ms)
- [ ] Deployed na production
- [ ] Monitoring setup
- [ ] Dokumentacja zaktualizowana
