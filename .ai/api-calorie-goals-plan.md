# API Endpoint Implementation Plan: Calorie Goals Management

## 1. Przegląd punktu końcowego

Endpointy zarządzania celami kalorycznymi umożliwiają użytkownikom ustawianie, przeglądanie i modyfikowanie swoich dziennych celów kalorycznych. System przechowuje pełną historię celów, co pozwala na śledzenie zmian w czasie i prawidłowe obliczanie postępów dla dat historycznych.

**Endpointy:**
- `GET /api/v1/calorie-goals` - lista wszystkich celów użytkownika (historia) z paginacją
- `GET /api/v1/calorie-goals/current` - aktualny cel kaloryczny na wybrany dzień
- `POST /api/v1/calorie-goals` - utworzenie nowego celu (obowiązuje od jutra)
- `PATCH /api/v1/calorie-goals/:id` - aktualizacja istniejącego celu
- `DELETE /api/v1/calorie-goals/:id` - usunięcie celu z historii

**Kluczowe cechy:**
- Historyzacja celów - każda zmiana to nowy rekord
- Automatyczne ustawianie `effective_from` na CURRENT_DATE + 1 przy tworzeniu
- ON CONFLICT handling dla duplikatów (user_id, effective_from)
- Fallback na 2000 kcal dla użytkowników bez ustawionego celu
- Pełna izolacja danych przez RLS policies
- Automatyczna aktualizacja `updated_at` przez trigger bazodanowy

## 2. Szczegóły żądania

### GET /api/v1/calorie-goals

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/v1/calorie-goals`
- **Parametry:**
  - Opcjonalne query params:
    - `limit` (default: 50, max: 100) - liczba rekordów do zwrócenia
    - `offset` (default: 0) - liczba rekordów do pominięcia
- **Request Body:** brak
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)

### GET /api/v1/calorie-goals/current

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/v1/calorie-goals/current`
- **Parametry:**
  - Opcjonalne query params:
    - `date` (default: today) - data w formacie YYYY-MM-DD
- **Request Body:** brak
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)

### POST /api/v1/calorie-goals

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/v1/calorie-goals`
- **Parametry:**
  - Wymagane: brak (userId pobierany z auth.uid())
- **Request Body:**
  ```json
  {
    "daily_goal": 2500
  }
  ```
  - `daily_goal` (required): integer, 1-10000
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)
  - `Content-Type: application/json` (wymagany)

**Business Logic:**
- `effective_from` automatycznie ustawiany na CURRENT_DATE + 1
- Wielokrotne wywołania w tym samym dniu dla tego samego effective_from → 409 Conflict

### PATCH /api/v1/calorie-goals/:id

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/v1/calorie-goals/:id`
- **Parametry:**
  - Wymagane URL params:
    - `id` - UUID celu kalorycznego
- **Request Body:**
  ```json
  {
    "daily_goal": 2600
  }
  ```
  - `daily_goal` (required): integer, 1-10000
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)
  - `Content-Type: application/json` (wymagany)

### DELETE /api/v1/calorie-goals/:id

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/v1/calorie-goals/:id`
- **Parametry:**
  - Wymagane URL params:
    - `id` - UUID celu kalorycznego
- **Request Body:** brak
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)

## 3. Wykorzystywane typy

### Typy z src/types.ts:

```typescript
// Response dla GET list i szczegółów
export type CalorieGoalResponseDTO = Tables<"calorie_goals">;

// Request body dla POST
export interface CreateCalorieGoalRequestDTO {
  daily_goal: number;
}

// Request body dla PATCH
export interface UpdateCalorieGoalRequestDTO {
  daily_goal: number;
}

// Response dla GET list (z paginacją)
export type CalorieGoalsListResponseDTO = PaginatedResponseDTO<CalorieGoalResponseDTO>;

// Paginacja
export interface PaginationMetaDTO {
  total: number;
  limit: number;
  offset: number;
}

// Błędy
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: ValidationErrorDetailsDTO;
}
```

### Typy bazodanowe (z database.types.ts):

```typescript
Tables<"calorie_goals"> = {
  id: string; // UUID
  user_id: string; // UUID
  daily_goal: number; // INTEGER
  effective_from: string; // DATE (format: YYYY-MM-DD)
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}
```

## 4. Szczegóły odpowiedzi

### GET /api/v1/calorie-goals

**Status 200 - Success:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "daily_goal": 2500,
      "effective_from": "2025-01-28",
      "created_at": "2025-01-27T10:00:00.000Z",
      "updated_at": "2025-01-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

**Status 401 - Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Status 500 - Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### GET /api/v1/calorie-goals/current

**Status 200 - Success:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "daily_goal": 2500,
  "effective_from": "2025-01-20",
  "created_at": "2025-01-19T10:00:00.000Z",
  "updated_at": "2025-01-19T10:00:00.000Z"
}
```

**Status 400 - Bad Request (invalid date format):**
```json
{
  "error": "Bad Request",
  "message": "Invalid date format. Expected YYYY-MM-DD"
}
```

**Status 404 - Not Found (no goal set):**
```json
{
  "error": "Not Found",
  "message": "No calorie goal found. Using default: 2000 kcal"
}
```

### POST /api/v1/calorie-goals

**Status 201 - Created:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "daily_goal": 2500,
  "effective_from": "2025-01-28",
  "created_at": "2025-01-27T10:00:00.000Z",
  "updated_at": "2025-01-27T10:00:00.000Z"
}
```

**Status 400 - Bad Request (validation):**
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "daily_goal": "Must be between 1 and 10000"
  }
}
```

**Status 409 - Conflict:**
```json
{
  "error": "Conflict",
  "message": "A calorie goal for this date already exists. Use PATCH to update."
}
```

### PATCH /api/v1/calorie-goals/:id

**Status 200 - Success:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "daily_goal": 2600,
  "effective_from": "2025-01-28",
  "created_at": "2025-01-27T10:00:00.000Z",
  "updated_at": "2025-01-27T12:00:00.000Z"
}
```

**Status 400 - Bad Request (invalid UUID):**
```json
{
  "error": "Bad Request",
  "message": "Invalid UUID format"
}
```

**Status 404 - Not Found:**
```json
{
  "error": "Not Found",
  "message": "Calorie goal not found"
}
```

### DELETE /api/v1/calorie-goals/:id

**Status 204 - No Content:**
(no response body)

**Status 404 - Not Found:**
```json
{
  "error": "Not Found",
  "message": "Calorie goal not found"
}
```

## 5. Przepływ danych

### GET /api/v1/calorie-goals (list)

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. GET handler parsuje query params (limit, offset)
   ↓
4. Handler → CalorieGoalService.listCalorieGoals(userId, limit, offset)
   ↓
5. Service wykonuje:
   - supabase.from('calorie_goals').select('*').eq('user_id', userId)
     .order('effective_from', { ascending: false })
     .range(offset, offset + limit - 1)
   - supabase.from('calorie_goals').select('*', { count: 'exact', head: true })
     .eq('user_id', userId)
   ↓
6. RLS Policy "Users can view own goals" filtruje dane
   ↓
7. Response 200 z CalorieGoalsListResponseDTO (data + pagination)
```

### GET /api/v1/calorie-goals/current

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. GET handler parsuje query param (date, default: today)
   ↓
4. Handler waliduje format daty (YYYY-MM-DD)
   ↓
5. Handler → CalorieGoalService.getCurrentCalorieGoal(userId, date)
   ↓
6. Service wykonuje:
   - supabase.from('calorie_goals').select('*')
     .eq('user_id', userId)
     .lte('effective_from', date)
     .order('effective_from', { ascending: false })
     .limit(1)
   - LUB użycie funkcji PostgreSQL: supabase.rpc('get_current_calorie_goal', { user_uuid: userId, target_date: date })
   ↓
7. RLS Policy filtruje dane
   ↓
8a. Jeśli znaleziono: Response 200 z CalorieGoalResponseDTO
8b. Jeśli brak: Response 404 z message "Using default: 2000 kcal"
```

### POST /api/v1/calorie-goals

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. POST handler parsuje request body
   ↓
4. Handler waliduje body przez Zod schema (daily_goal: 1-10000)
   ↓
5. Handler oblicza effective_from = CURRENT_DATE + 1
   ↓
6. Handler → CalorieGoalService.createCalorieGoal(userId, daily_goal)
   ↓
7. Service wykonuje:
   - supabase.from('calorie_goals').insert({
       user_id: userId,
       daily_goal: daily_goal,
       effective_from: calculated_date
     }).select().single()
   ↓
8a. Sukces → Response 201 z utworzonym celem
8b. UNIQUE constraint violation (23505) → Response 409 Conflict
```

### PATCH /api/v1/calorie-goals/:id

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. PATCH handler parsuje :id i waliduje UUID format
   ↓
4. Handler parsuje request body i waliduje przez Zod
   ↓
5. Handler → CalorieGoalService.updateCalorieGoal(userId, id, daily_goal)
   ↓
6. Service wykonuje:
   - supabase.from('calorie_goals').update({ daily_goal })
     .eq('id', id)
     .eq('user_id', userId)
     .select().single()
   ↓
7. RLS Policy "Users can update own goals" + explicit eq(user_id)
   ↓
8. Trigger "update_calorie_goals_updated_at" automatycznie ustawia updated_at
   ↓
9a. Sukces → Response 200 z zaktualizowanym celem
9b. Brak rekordu → Response 404 Not Found
```

### DELETE /api/v1/calorie-goals/:id

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. DELETE handler parsuje :id i waliduje UUID format
   ↓
4. Handler → CalorieGoalService.deleteCalorieGoal(userId, id)
   ↓
5. Service wykonuje:
   - supabase.from('calorie_goals').delete()
     .eq('id', id)
     .eq('user_id', userId)
   ↓
6. RLS Policy "Users can delete own goals" + explicit eq(user_id)
   ↓
7a. Sukces → Response 204 No Content
7b. Brak rekordu → Response 404 Not Found
```

### Interakcje z bazą danych:

- **Tabela:** `calorie_goals`
- **RLS Policies:**
  - `Users can view own goals` - SELECT WHERE user_id = auth.uid()
  - `Users can insert own goals` - INSERT WITH CHECK user_id = auth.uid()
  - `Users can update own goals` - UPDATE WHERE user_id = auth.uid()
  - `Users can delete own goals` - DELETE WHERE user_id = auth.uid()
- **Constraints:**
  - UNIQUE(user_id, effective_from) - jeden cel na dzień
  - CHECK(daily_goal > 0 AND daily_goal <= 10000)
- **Trigger:** `update_calorie_goals_updated_at` - automatyczna aktualizacja updated_at
- **Funkcja:** `get_current_calorie_goal(user_uuid, target_date)` - fallback na 2000 kcal

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:
- **Supabase Auth:** middleware sprawdza ważność tokenu JWT
- **Session Management:** `context.locals.supabase.auth.getUser()` pobiera sesję
- **Token w headerze:** `Authorization: Bearer <access_token>`

### Autoryzacja:
- **RLS Policies:** automatyczna filtracja zapytań po `auth.uid()`
- **Explicit user_id filtering:** dodatkowe `.eq('user_id', userId)` w UPDATE/DELETE
- **IDOR Protection:** użytkownik nie może modyfikować celów innych użytkowników
- **Izolacja danych:** RLS zapewnia pełną separację danych między użytkownikami

### Walidacja danych:
- **Zod schemas:**
  - `daily_goal`: integer, min 1, max 10000
  - `date`: regex /^\d{4}-\d{2}-\d{2}$/ (YYYY-MM-DD)
  - `id` (UUID): regex UUID v4 format
- **Database CHECK constraints:** daily_goal > 0 AND <= 10000
- **Type safety:** TypeScript zapewnia bezpieczeństwo typów
- **SQL Injection:** Supabase SDK automatycznie chroni

### Najlepsze praktyki:
- Używać `context.locals.supabase` zamiast bezpośredniego importu klienta
- Zawsze sprawdzać wynik `getUser()` przed dostępem do zasobów
- Walidować UUID format przed przekazaniem do bazy
- Walidować format daty przed użyciem w zapytaniach
- Logować próby konfliktów (409) dla analityki

## 7. Obsługa błędów

### Scenariusze błędów:

| Kod | Endpoint | Scenariusz | Obsługa | Logowanie |
|-----|----------|-----------|---------|-----------|
| 400 | POST, PATCH | Nieprawidłowy daily_goal | Walidacja Zod, zwróć szczegóły | Nie |
| 400 | GET current | Nieprawidłowy format daty | Walidacja Zod/regex | Nie |
| 400 | PATCH, DELETE | Nieprawidłowy format UUID | Walidacja UUID | Nie |
| 401 | Wszystkie | Brak/nieprawidłowy token | Middleware/getUser() | Nie |
| 404 | GET current | Brak celu (normalne) | Return message z defaultem | Nie |
| 404 | PATCH, DELETE | Zasób nie istnieje | Service zwraca null | Nie |
| 409 | POST | UNIQUE constraint violation | Catch PostgreSQL error 23505 | Tak (analytics) |
| 500 | Wszystkie | Błąd bazy danych | Try-catch, log do error_logs | Tak |
| 500 | Wszystkie | Nieoczekiwany błąd | Global error handler | Tak |

### Struktura obsługi błędów:

```typescript
// POST - handling UNIQUE constraint violation
try {
  const newGoal = await CalorieGoalService.createCalorieGoal(userId, daily_goal);
  return new Response(JSON.stringify(newGoal), { status: 201 });
} catch (error) {
  // PostgreSQL UNIQUE constraint violation error code
  if (error.code === '23505') {
    return new Response(JSON.stringify({
      error: "Conflict",
      message: "A calorie goal for this date already exists. Use PATCH to update."
    }), { status: 409 });
  }

  // Log unexpected errors
  await logError(supabase, {
    user_id: userId,
    error_type: 'calorie_goal_create_error',
    error_message: error.message,
    context: { endpoint: 'POST /api/v1/calorie-goals' }
  });

  return new Response(JSON.stringify({
    error: "Internal Server Error",
    message: "An unexpected error occurred"
  }), { status: 500 });
}
```

### Logowanie błędów do error_logs:

**Błędy wymagające logowania:**
- 500 - wszystkie nieoczekiwane błędy aplikacji i bazy danych
- 409 - konflikty (dla analityki - czy użytkownicy często próbują tworzyć duplikaty)

**Błędy niewymagające logowania:**
- 400 - błędy walidacji (user error)
- 401 - brak autentykacji (normalna sytuacja)
- 404 - brak zasobu (normalna sytuacja, szczególnie GET current)

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

1. **Compound Indexes:**
   - `idx_calorie_goals_user_id` - filtrowanie po user_id
   - `idx_calorie_goals_user_date` - (user_id, effective_from DESC) dla sortowania i getCurrentCalorieGoal

2. **Query Optimization:**
   - `.limit(1)` dla getCurrentCalorieGoal - tylko najnowszy rekord
   - `.range(offset, offset + limit - 1)` dla paginacji - efektywne pobieranie
   - `ORDER BY effective_from DESC` - najnowsze cele pierwsze

3. **Database Function:**
   - `get_current_calorie_goal()` - STABLE SECURITY DEFINER
   - Fallback na 2000 kcal w jednym zapytaniu (bez dodatkowego round-trip)
   - Query planner optymalizuje przez STABLE

4. **Caching (przyszłość):**
   - Rozważyć cache dla getCurrentCalorieGoal (Redis, in-memory)
   - Invalidacja cache przy POST/PATCH/DELETE celu
   - TTL: do końca dnia (cel nie zmienia się często)

5. **Pagination:**
   - Default limit: 50 (balans między UX a performance)
   - Max limit: 100 (zapobieganie przeciążeniu)
   - Count query: `{ count: 'exact', head: true }` - optymalizacja

### Potencjalne wąskie gardła:

- **Brak:** zapytania są proste (PK/FK lookups, compound index)
- **getCurrentCalorieGoal:** może być często wywoływany - rozważyć cache
- **Historia użytkownika:** rzadko przekroczy 50-100 rekordów (jeden cel miesięcznie = 12/rok)

### Monitoring:

- Śledzić czas wykonania getCurrentCalorieGoal
- Monitorować liczbę konfliktów 409 (czy UI wymaga poprawy?)
- Sprawdzać wykorzystanie indeksów (EXPLAIN ANALYZE)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu CalorieGoalService
**Plik:** `src/lib/services/calorie-goal.service.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db/database.types';
import type { CalorieGoalResponseDTO } from '../../types';

export class CalorieGoalService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * List calorie goals for a user with pagination
   * Ordered by effective_from DESC (newest first)
   */
  async listCalorieGoals(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<CalorieGoalResponseDTO[]> {
    const { data, error } = await this.supabase
      .from('calorie_goals')
      .select('*')
      .eq('user_id', userId)
      .order('effective_from', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  /**
   * Count total calorie goals for a user (for pagination)
   */
  async countCalorieGoals(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('calorie_goals')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) throw error;
    return count || 0;
  }

  /**
   * Get current calorie goal for a specific date
   * Returns the goal with the latest effective_from <= target_date
   */
  async getCurrentCalorieGoal(
    userId: string,
    targetDate: string // YYYY-MM-DD
  ): Promise<CalorieGoalResponseDTO | null> {
    const { data, error } = await this.supabase
      .from('calorie_goals')
      .select('*')
      .eq('user_id', userId)
      .lte('effective_from', targetDate)
      .order('effective_from', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // PGRST116 = Row not found (not an error, just no goal set)
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Create a new calorie goal
   * effective_from is calculated as CURRENT_DATE + 1
   *
   * @throws Error with code '23505' if goal already exists for that date
   */
  async createCalorieGoal(
    userId: string,
    dailyGoal: number
  ): Promise<CalorieGoalResponseDTO> {
    // Calculate effective_from as tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const effectiveFrom = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data, error } = await this.supabase
      .from('calorie_goals')
      .insert({
        user_id: userId,
        daily_goal: dailyGoal,
        effective_from: effectiveFrom,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update an existing calorie goal
   * Only daily_goal can be updated; effective_from is immutable
   */
  async updateCalorieGoal(
    userId: string,
    goalId: string,
    dailyGoal: number
  ): Promise<CalorieGoalResponseDTO | null> {
    const { data, error } = await this.supabase
      .from('calorie_goals')
      .update({ daily_goal: dailyGoal })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Delete a calorie goal
   * User can delete any goal from their history
   */
  async deleteCalorieGoal(
    userId: string,
    goalId: string
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('calorie_goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);

    if (error) {
      if (error.code === 'PGRST116') {
        return false; // Not found
      }
      throw error;
    }

    return true;
  }
}
```

### Krok 2: Utworzenie Zod schemas dla walidacji
**Plik:** `src/lib/validators/calorie-goal.validators.ts`

```typescript
import { z } from 'zod';

/**
 * Schema for POST /api/v1/calorie-goals request body
 * Validates daily_goal within allowed range (1-10000)
 */
export const createCalorieGoalSchema = z.object({
  daily_goal: z
    .number()
    .int('Daily goal must be an integer')
    .min(1, 'Daily goal must be at least 1')
    .max(10000, 'Daily goal cannot exceed 10000'),
});

/**
 * Schema for PATCH /api/v1/calorie-goals/:id request body
 * Same validation as create
 */
export const updateCalorieGoalSchema = z.object({
  daily_goal: z
    .number()
    .int('Daily goal must be an integer')
    .min(1, 'Daily goal must be at least 1')
    .max(10000, 'Daily goal cannot exceed 10000'),
});

/**
 * Schema for date query parameter (YYYY-MM-DD format)
 */
export const dateQueryParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .optional();

/**
 * Schema for UUID parameter validation
 */
export const uuidParamSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * Inferred TypeScript types
 */
export type CreateCalorieGoalInput = z.infer<typeof createCalorieGoalSchema>;
export type UpdateCalorieGoalInput = z.infer<typeof updateCalorieGoalSchema>;
```

### Krok 3: Implementacja GET /api/v1/calorie-goals (list)
**Plik:** `src/pages/api/v1/calorie-goals.ts`

```typescript
import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';
import { CalorieGoalService } from '../../../lib/services/calorie-goal.service';
import { createCalorieGoalSchema } from '../../../lib/validators/calorie-goal.validators';
import { logError } from '../../../lib/helpers/error-logger';
import type {
  CalorieGoalsListResponseDTO,
  ErrorResponseDTO,
  CalorieGoalResponseDTO
} from '../../../types';

export const prerender = false;

/**
 * GET handler - List calorie goals with pagination
 * Returns user's calorie goal history ordered by effective_from DESC
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse query parameters
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '50'),
      100
    );
    const offset = Math.max(
      parseInt(url.searchParams.get('offset') || '0'),
      0
    );

    // Step 3: Fetch data from service
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const [data, total] = await Promise.all([
      calorieGoalService.listCalorieGoals(userId, limit, offset),
      calorieGoalService.countCalorieGoals(userId),
    ]);

    // Step 4: Build paginated response
    const response: CalorieGoalsListResponseDTO = {
      data,
      pagination: {
        total,
        limit,
        offset,
      },
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error listing calorie goals:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'calorie_goals_list_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: { endpoint: 'GET /api/v1/calorie-goals' },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * POST handler - Create new calorie goal
 * effective_from is automatically set to CURRENT_DATE + 1
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON body',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Validate request body
    let validatedData;
    try {
      validatedData = createCalorieGoalSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        return new Response(
          JSON.stringify({
            error: 'Bad Request',
            message: 'Validation failed',
            details,
          } as ErrorResponseDTO),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Step 4: Create calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);

    try {
      const newGoal = await calorieGoalService.createCalorieGoal(
        userId,
        validatedData.daily_goal
      );

      return new Response(JSON.stringify(newGoal as CalorieGoalResponseDTO), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (createError: any) {
      // Handle UNIQUE constraint violation (goal already exists for that date)
      if (createError.code === '23505') {
        return new Response(
          JSON.stringify({
            error: 'Conflict',
            message: 'A calorie goal for this date already exists. Use PATCH to update.',
          } as ErrorResponseDTO),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw createError;
    }
  } catch (error) {
    console.error('Error creating calorie goal:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'calorie_goal_create_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: { endpoint: 'POST /api/v1/calorie-goals' },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 4: Implementacja GET /api/v1/calorie-goals/current
**Plik:** `src/pages/api/v1/calorie-goals/current.ts`

```typescript
import type { APIRoute } from 'astro';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import { CalorieGoalService } from '../../../../lib/services/calorie-goal.service';
import { dateQueryParamSchema } from '../../../../lib/validators/calorie-goal.validators';
import { logError } from '../../../../lib/helpers/error-logger';
import type { CalorieGoalResponseDTO, ErrorResponseDTO } from '../../../../types';

export const prerender = false;

/**
 * GET handler - Get current calorie goal for a specific date
 * Defaults to today if no date provided
 * Returns 404 with default message if no goal found
 */
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    // Step 1: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 2: Parse and validate date parameter
    const dateParam = url.searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Validate date format
    const dateValidation = dateQueryParamSchema.safeParse(targetDate);
    if (!dateValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid date format. Expected YYYY-MM-DD',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Fetch current goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const currentGoal = await calorieGoalService.getCurrentCalorieGoal(
      userId,
      targetDate
    );

    // Step 4: Handle not found case
    if (!currentGoal) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'No calorie goal found. Using default: 2000 kcal',
        } as ErrorResponseDTO),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Return current goal
    return new Response(
      JSON.stringify(currentGoal as CalorieGoalResponseDTO),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching current calorie goal:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'current_calorie_goal_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: { endpoint: 'GET /api/v1/calorie-goals/current' },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 5: Implementacja PATCH i DELETE /api/v1/calorie-goals/[id].ts
**Plik:** `src/pages/api/v1/calorie-goals/[id].ts`

```typescript
import type { APIRoute } from 'astro';
import { ZodError } from 'zod';
import { DEFAULT_USER_ID } from '../../../../db/supabase.client';
import { CalorieGoalService } from '../../../../lib/services/calorie-goal.service';
import {
  updateCalorieGoalSchema,
  uuidParamSchema,
} from '../../../../lib/validators/calorie-goal.validators';
import { logError } from '../../../../lib/helpers/error-logger';
import type { CalorieGoalResponseDTO, ErrorResponseDTO } from '../../../../types';

export const prerender = false;

/**
 * PATCH handler - Update existing calorie goal
 * Only daily_goal can be updated; effective_from is immutable
 */
export const PATCH: APIRoute = async ({ params, request, locals }) => {
  try {
    // Step 1: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const idValidation = uuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid UUID format',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const goalId = idValidation.data;

    // Step 3: Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid JSON body',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: Validate request body
    let validatedData;
    try {
      validatedData = updateCalorieGoalSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join('.');
          details[field] = err.message;
        });

        return new Response(
          JSON.stringify({
            error: 'Bad Request',
            message: 'Validation failed',
            details,
          } as ErrorResponseDTO),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Step 5: Update calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const updatedGoal = await calorieGoalService.updateCalorieGoal(
      userId,
      goalId,
      validatedData.daily_goal
    );

    // Step 6: Handle not found case
    if (!updatedGoal) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Calorie goal not found',
        } as ErrorResponseDTO),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 7: Return updated goal
    return new Response(
      JSON.stringify(updatedGoal as CalorieGoalResponseDTO),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating calorie goal:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'calorie_goal_update_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: 'PATCH /api/v1/calorie-goals/:id',
        goal_id: params.id,
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

/**
 * DELETE handler - Delete calorie goal
 * User can delete any goal from their history
 */
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // Step 1: Get user ID
    const userId = DEFAULT_USER_ID;

    // Step 2: Validate UUID parameter
    const idValidation = uuidParamSchema.safeParse(params.id);
    if (!idValidation.success) {
      return new Response(
        JSON.stringify({
          error: 'Bad Request',
          message: 'Invalid UUID format',
        } as ErrorResponseDTO),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const goalId = idValidation.data;

    // Step 3: Delete calorie goal
    const calorieGoalService = new CalorieGoalService(locals.supabase);
    const deleted = await calorieGoalService.deleteCalorieGoal(userId, goalId);

    // Step 4: Handle not found case
    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: 'Not Found',
          message: 'Calorie goal not found',
        } as ErrorResponseDTO),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 5: Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting calorie goal:', error);

    const userId = DEFAULT_USER_ID;
    await logError(locals.supabase, {
      user_id: userId,
      error_type: 'calorie_goal_delete_error',
      error_message: error instanceof Error ? error.message : String(error),
      error_details: error instanceof Error ? { stack: error.stack } : undefined,
      context: {
        endpoint: 'DELETE /api/v1/calorie-goals/:id',
        goal_id: params.id,
      },
    });

    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred',
      } as ErrorResponseDTO),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
```

### Krok 6: Testowanie endpointów

**Test GET /api/v1/calorie-goals (list):**
```bash
# Success case
curl -X GET http://localhost:4321/api/v1/calorie-goals

# With pagination
curl -X GET "http://localhost:4321/api/v1/calorie-goals?limit=10&offset=0"
```

**Test GET /api/v1/calorie-goals/current:**
```bash
# Success case (today)
curl -X GET http://localhost:4321/api/v1/calorie-goals/current

# Success case (specific date)
curl -X GET "http://localhost:4321/api/v1/calorie-goals/current?date=2025-01-27"

# Not found (404 with default message)
curl -X GET "http://localhost:4321/api/v1/calorie-goals/current?date=2020-01-01"
```

**Test POST /api/v1/calorie-goals:**
```bash
# Success case
curl -X POST http://localhost:4321/api/v1/calorie-goals \
  -H "Content-Type: application/json" \
  -d '{"daily_goal": 2500}'

# Validation error
curl -X POST http://localhost:4321/api/v1/calorie-goals \
  -H "Content-Type: application/json" \
  -d '{"daily_goal": 15000}'

# Conflict (run twice same day)
curl -X POST http://localhost:4321/api/v1/calorie-goals \
  -H "Content-Type: application/json" \
  -d '{"daily_goal": 2500}'
```

**Test PATCH /api/v1/calorie-goals/:id:**
```bash
# Success case (replace with actual UUID)
curl -X PATCH http://localhost:4321/api/v1/calorie-goals/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"daily_goal": 2600}'

# Not found
curl -X PATCH http://localhost:4321/api/v1/calorie-goals/00000000-0000-0000-0000-000000000000 \
  -H "Content-Type: application/json" \
  -d '{"daily_goal": 2600}'
```

**Test DELETE /api/v1/calorie-goals/:id:**
```bash
# Success case (replace with actual UUID)
curl -X DELETE http://localhost:4321/api/v1/calorie-goals/550e8400-e29b-41d4-a716-446655440000

# Not found
curl -X DELETE http://localhost:4321/api/v1/calorie-goals/00000000-0000-0000-0000-000000000000
```

### Krok 7: Weryfikacja i dokumentacja

1. Sprawdzić czy wszystkie typy są poprawnie zaimportowane
2. Zweryfikować czy RLS policies działają poprawnie (test w Supabase Dashboard)
3. Przetestować konflikt 409 (wielokrotne POST tego samego dnia)
4. Przetestować edge cases:
   - GET current dla daty w przeszłości (przed pierwszym celem)
   - GET current dla daty w przyszłości
   - DELETE celu, który jest aktualnie używany
5. Code review - sprawdzić zgodność z coding guidelines
6. Zaktualizować dokumentację API jeśli coś się zmieniło

### Krok 8: Deployment checklist

- [ ] Wszystkie testy przechodzą
- [ ] Linter nie zgłasza błędów
- [ ] TypeScript kompiluje się bez błędów
- [ ] RLS policies są włączone i działają
- [ ] Trigger `update_calorie_goals_updated_at` działa poprawnie
- [ ] UNIQUE constraint (user_id, effective_from) jest poprawnie obsługiwany (409)
- [ ] Error logging działa
- [ ] Funkcja `get_current_calorie_goal()` istnieje w bazie (opcjonalnie)
- [ ] Indeksy są utworzone (idx_calorie_goals_user_id, idx_calorie_goals_user_date)
- [ ] Dokumentacja jest aktualna

---

**Uwagi końcowe:**

- Endpointy są gotowe na rozszerzenia (np. bulk operations, analytics)
- effective_from jest immutable - jeśli użytkownik chce zmienić datę, musi DELETE + POST
- Historia celów jest pełna - użytkownik może śledzić wszystkie zmiany
- RLS + explicit user_id filtering zapewniają bezpieczeństwo
- Implementacja zgodna z wytycznymi Astro (prerender=false, uppercase HTTP methods)
- Conflict handling (409) dla UNIQUE constraint jest kluczowy dla UX
