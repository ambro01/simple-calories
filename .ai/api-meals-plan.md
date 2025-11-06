# API Endpoint Implementation Plan: Meals

## 1. Przegląd punktu końcowego

API Meals zapewnia pełne operacje CRUD (Create, Read, Update, Delete) dla posiłków użytkownika w aplikacji Szybkie Kalorie. Endpointy umożliwiają:

- **Pobieranie listy posiłków** z zaawansowanym filtrowaniem (data, zakres dat, kategoria) i paginacją
- **Pobieranie szczegółów pojedynczego posiłku** z opcjonalnymi informacjami o generowaniu AI
- **Tworzenie nowych posiłków** zarówno ręcznie, jak i z wykorzystaniem AI
- **Aktualizację istniejących posiłków** z automatyczną zmianą `input_method` na `ai-edited` przy edycji wartości AI
- **Usuwanie posiłków** (hard delete)

Wszystkie endpointy wymagają autentykacji użytkownika i stosują Row Level Security (RLS) przez Supabase, co zapewnia pełną izolację danych między użytkownikami.

**Kluczowe funkcjonalności biznesowe:**

- Walidacja makroskładników z ostrzeżeniami (obliczenie kalorii: 4*protein + 4*carbs + 9\*fats)
- Tracking źródła danych (`input_method`: ai, manual, ai-edited) dla metryk AI
- Opcjonalne dołączanie informacji o generowaniu AI dla posiłków
- Blokada timestamps w przyszłości (meal_timestamp nie może być > NOW())

---

## 2. Szczegóły żądania

### 2.1. GET /api/v1/meals

**Metoda HTTP:** GET
**Struktura URL:** `/api/v1/meals`
**Autentykacja:** Required (JWT token w MVP: DEFAULT_USER_ID)

**Query Parameters:**

| Parametr    | Typ                 | Wymagany | Domyślna | Opis                                                          |
| ----------- | ------------------- | -------- | -------- | ------------------------------------------------------------- |
| `date`      | string (YYYY-MM-DD) | Nie      | -        | Filtruj po konkretnej dacie                                   |
| `date_from` | string (YYYY-MM-DD) | Nie      | -        | Początek zakresu dat                                          |
| `date_to`   | string (YYYY-MM-DD) | Nie      | -        | Koniec zakresu dat                                            |
| `category`  | enum                | Nie      | -        | Filtruj po kategorii (breakfast, lunch, dinner, snack, other) |
| `limit`     | number              | Nie      | 50       | Liczba rekordów (max: 100)                                    |
| `offset`    | number              | Nie      | 0        | Liczba rekordów do pominięcia (min: 0)                        |
| `sort`      | enum                | Nie      | desc     | Kolejność sortowania: asc, desc                               |

**Logika filtrowania:**

- Jeśli podano `date`, ignoruj `date_from` i `date_to` (filtruj tylko po konkretnej dacie)
- Jeśli podano `date_from` i/lub `date_to`, użyj zakresu dat
- Sortowanie zawsze po `meal_timestamp`

---

### 2.2. GET /api/v1/meals/:id

**Metoda HTTP:** GET
**Struktura URL:** `/api/v1/meals/:id`
**Autentykacja:** Required

**URL Parameters:**

- `id` (UUID, required) - Identyfikator posiłku

---

### 2.3. POST /api/v1/meals

**Metoda HTTP:** POST
**Struktura URL:** `/api/v1/meals`
**Autentykacja:** Required
**Content-Type:** application/json

**Request Body (AI-generated meal):**

```json
{
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "ai_generation_id": "uuid",
  "meal_timestamp": "2025-01-27T08:30:00Z"
}
```

**Request Body (Manual meal):**

```json
{
  "description": "Kurczak z ryżem",
  "calories": 650,
  "protein": 45.0,
  "carbs": 70.0,
  "fats": 15.0,
  "category": "lunch",
  "input_method": "manual",
  "meal_timestamp": "2025-01-27T13:00:00Z"
}
```

**Walidacja:**

- `description`: required, string, trim, min 1, max 500
- `calories`: required, integer, 1-10000
- `protein`: optional, number, 0-1000, max 2 decimal places
- `carbs`: optional, number, 0-1000, max 2 decimal places
- `fats`: optional, number, 0-1000, max 2 decimal places
- `category`: optional, enum [breakfast, lunch, dinner, snack, other]
- `input_method`: required, enum [ai, manual, ai-edited]
- `ai_generation_id`: required if input_method = 'ai', UUID, must exist in database
- `meal_timestamp`: required, ISO 8601 timestamp, cannot be in future

---

### 2.4. PATCH /api/v1/meals/:id

**Metoda HTTP:** PATCH
**Struktura URL:** `/api/v1/meals/:id`
**Autentykacja:** Required
**Content-Type:** application/json

**URL Parameters:**

- `id` (UUID, required) - Identyfikator posiłku

**Request Body (partial update):**

```json
{
  "description": "Jajka sadzone z chlebem (updated)",
  "calories": 450,
  "protein": 20.0,
  "category": "breakfast"
}
```

**Logika biznesowa:**

- Wszystkie pola opcjonalne (partial update)
- Jeśli użytkownik edytuje wartości z `input_method='ai'`, automatycznie zmień na `ai-edited`
- Walidacja taka sama jak przy POST, ale wszystkie pola opcjonalne

---

### 2.5. DELETE /api/v1/meals/:id

**Metoda HTTP:** DELETE
**Struktura URL:** `/api/v1/meals/:id`
**Autentykacja:** Required

**URL Parameters:**

- `id` (UUID, required) - Identyfikator posiłku

---

## 3. Wykorzystywane typy

### 3.1. Typy DTO (z `src/types.ts`)

**Request DTOs:**

- `CreateMealRequestDTO` - union type dla tworzenia posiłku
  - `CreateAIMealRequestDTO` - dla AI-generated
  - `CreateManualMealRequestDTO` - dla manual
- `UpdateMealRequestDTO` - dla aktualizacji (wszystkie pola opcjonalne)

**Response DTOs:**

- `MealResponseDTO` - pojedynczy posiłek z opcjonalnymi informacjami AI
- `MealsListResponseDTO` - lista posiłków z paginacją
- `CreateMealResponseDTO` - odpowiedź przy tworzeniu (z warnings)
- `UpdateMealResponseDTO` - odpowiedź przy aktualizacji (z warnings)
- `MealAIGenerationInfoDTO` - zagnieżdżone informacje o generowaniu AI
- `MealWarningDTO` - struktura ostrzeżeń
- `ErrorResponseDTO` - standardowa odpowiedź błędu
- `ValidationErrorDetailsDTO` - szczegóły walidacji
- `PaginationMetaDTO` - metadane paginacji

**Enums:**

- `MealCategory` - enum kategorii posiłków
- `InputMethodType` - enum metod wprowadzania

### 3.2. Typy bazodanowe (z `src/db/database.types.ts`)

- `Tables<"meals">` - struktura tabeli meals
- `Tables<"ai_generations">` - struktura tabeli ai_generations
- `Enums<"meal_category">` - enum kategorii
- `Enums<"input_method_type">` - enum metod wprowadzania

### 3.3. Schematy walidacji Zod

Należy utworzyć nowy plik `src/lib/validation/meal.schemas.ts`:

```typescript
export const MealCategorySchema = z.enum(["breakfast", "lunch", "dinner", "snack", "other"]);
export const InputMethodSchema = z.enum(["ai", "manual", "ai-edited"]);

export const CreateAIMealSchema = z.object({
  description: z.string().trim().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
  protein: z.number().min(0).max(1000).nullable().optional(),
  carbs: z.number().min(0).max(1000).nullable().optional(),
  fats: z.number().min(0).max(1000).nullable().optional(),
  category: MealCategorySchema.nullable().optional(),
  input_method: z.literal("ai"),
  ai_generation_id: z.string().uuid(),
  meal_timestamp: z.string().datetime(),
});

export const CreateManualMealSchema = z.object({
  description: z.string().trim().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
  protein: z.number().min(0).max(1000).nullable().optional(),
  carbs: z.number().min(0).max(1000).nullable().optional(),
  fats: z.number().min(0).max(1000).nullable().optional(),
  category: MealCategorySchema.nullable().optional(),
  input_method: z.literal("manual"),
  meal_timestamp: z.string().datetime(),
});

export const CreateMealSchema = z.discriminatedUnion("input_method", [CreateAIMealSchema, CreateManualMealSchema]);

export const UpdateMealSchema = z.object({
  description: z.string().trim().min(1).max(500).optional(),
  calories: z.number().int().min(1).max(10000).optional(),
  protein: z.number().min(0).max(1000).nullable().optional(),
  carbs: z.number().min(0).max(1000).nullable().optional(),
  fats: z.number().min(0).max(1000).nullable().optional(),
  category: MealCategorySchema.nullable().optional(),
  meal_timestamp: z.string().datetime().optional(),
  input_method: InputMethodSchema.optional(),
});

export const GetMealsQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  date_to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category: MealCategorySchema.optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
  sort: z.enum(["asc", "desc"]).default("desc"),
});
```

---

## 4. Szczegóły odpowiedzi

### 4.1. GET /api/v1/meals

**Success (200 OK):**

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "Jajka sadzone z chlebem",
      "calories": 420,
      "protein": 18.5,
      "carbs": 25.0,
      "fats": 28.0,
      "category": "breakfast",
      "input_method": "ai",
      "meal_timestamp": "2025-01-27T08:30:00Z",
      "created_at": "2025-01-27T08:35:00Z",
      "updated_at": "2025-01-27T08:35:00Z",
      "ai_generation": {
        "id": "uuid",
        "prompt": "dwa jajka sadzone na maśle i kromka chleba",
        "assumptions": "Założono: 2 jajka średniej wielkości...",
        "model_used": "gpt-4",
        "generation_duration": 1234
      }
    }
  ],
  "pagination": {
    "total": 120,
    "limit": 50,
    "offset": 0
  }
}
```

**Error (400 Bad Request):**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid query parameters",
  "details": {
    "date": "Invalid date format. Expected YYYY-MM-DD",
    "limit": "Must be between 1 and 100"
  }
}
```

---

### 4.2. GET /api/v1/meals/:id

**Success (200 OK):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T08:35:00Z",
  "ai_generation": {
    "id": "uuid",
    "prompt": "dwa jajka sadzone na maśle i kromka chleba",
    "assumptions": "Założono: 2 jajka średniej wielkości...",
    "model_used": "gpt-4",
    "generation_duration": 1234
  }
}
```

**Error (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "Meal not found"
}
```

---

### 4.3. POST /api/v1/meals

**Success (201 Created):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T08:35:00Z",
  "warnings": []
}
```

**Success with Warning (201 Created):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Kurczak z ryżem",
  "calories": 650,
  "protein": 45.0,
  "carbs": 70.0,
  "fats": 15.0,
  "category": "lunch",
  "input_method": "manual",
  "meal_timestamp": "2025-01-27T13:00:00Z",
  "created_at": "2025-01-27T13:05:00Z",
  "updated_at": "2025-01-27T13:05:00Z",
  "warnings": [
    {
      "field": "macronutrients",
      "message": "The calculated calories from macronutrients (540 kcal) differs by more than 5% from the provided calories (650 kcal). Please verify your input."
    }
  ]
}
```

**Error (400 Bad Request):**

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid meal data",
  "details": {
    "calories": "Must be between 1 and 10000",
    "meal_timestamp": "Cannot be in the future"
  }
}
```

**Error (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "AI generation not found"
}
```

---

### 4.4. PATCH /api/v1/meals/:id

**Success (200 OK):**

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "Jajka sadzone z chlebem (updated)",
  "calories": 450,
  "protein": 20.0,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai-edited",
  "meal_timestamp": "2025-01-27T08:30:00Z",
  "created_at": "2025-01-27T08:35:00Z",
  "updated_at": "2025-01-27T10:15:00Z",
  "warnings": []
}
```

**Error (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "Meal not found"
}
```

---

### 4.5. DELETE /api/v1/meals/:id

**Success (204 No Content):**
Brak treści odpowiedzi.

**Error (404 Not Found):**

```json
{
  "error": "NOT_FOUND",
  "message": "Meal not found"
}
```

---

## 5. Przepływ danych

### 5.1. GET /api/v1/meals - Lista posiłków

```
1. Endpoint (src/pages/api/v1/meals/index.ts)
   └─> Parse query parameters (date, date_from, date_to, category, limit, offset, sort)
   └─> Validate with Zod (GetMealsQuerySchema)
   └─> Get userId (DEFAULT_USER_ID for MVP)

2. MealsService.getMeals(userId, filters)
   └─> Build Supabase query with filters:
       - user_id = userId (RLS ensures isolation)
       - Apply date filter (single date OR date range)
       - Apply category filter (if provided)
       - Order by meal_timestamp (asc/desc)
       - Apply pagination (range)
   └─> LEFT JOIN with ai_generations (LATERAL join for latest)
   └─> Return meals array + total count

3. Format response
   └─> Map meals to MealResponseDTO (with ai_generation if exists)
   └─> Build MealsListResponseDTO with pagination
   └─> Return 200 OK
```

**Database queries:**

```sql
-- Count query
SELECT COUNT(*) FROM meals
WHERE user_id = $userId
  AND (optional date/category filters)

-- Data query (using view meals_with_latest_ai or manual JOIN)
SELECT m.*,
       ag.id as ai_generation_id,
       ag.prompt,
       ag.assumptions,
       ag.model_used,
       ag.generation_duration
FROM meals m
LEFT JOIN LATERAL (
  SELECT * FROM ai_generations
  WHERE meal_id = m.id
  ORDER BY created_at DESC
  LIMIT 1
) ag ON true
WHERE m.user_id = $userId
  AND (optional filters)
ORDER BY m.meal_timestamp DESC
LIMIT $limit OFFSET $offset
```

---

### 5.2. GET /api/v1/meals/:id - Pojedynczy posiłek

```
1. Endpoint (src/pages/api/v1/meals/[id].ts)
   └─> Parse meal ID from URL params
   └─> Validate UUID format
   └─> Get userId (DEFAULT_USER_ID for MVP)

2. MealsService.getMealById(mealId, userId)
   └─> Query meals table with:
       - id = mealId
       - user_id = userId (RLS + manual check)
   └─> LEFT JOIN with ai_generations (latest)
   └─> Return meal or null

3. Handle response
   └─> If null: return 404 Not Found
   └─> If found: format as MealResponseDTO and return 200 OK
```

---

### 5.3. POST /api/v1/meals - Tworzenie posiłku

```
1. Endpoint (src/pages/api/v1/meals/index.ts - POST handler)
   └─> Parse request body (JSON)
   └─> Validate with Zod (CreateMealSchema - discriminated union)
   └─> Get userId (DEFAULT_USER_ID for MVP)

2. Validate business rules
   └─> Check meal_timestamp is not in future
   └─> If input_method='ai': verify ai_generation_id exists

3. MealsService.createMeal(userId, mealData)
   └─> Calculate macronutrient warnings
       - If protein, carbs, fats provided:
         calculatedCalories = 4*protein + 4*carbs + 9*fats
         difference = |calories - calculatedCalories| / calories * 100
         if difference > 5%: add warning

   └─> Insert into meals table:
       - user_id (from auth)
       - description, calories, protein, carbs, fats, category
       - input_method
       - meal_timestamp
       - created_at, updated_at (auto)

   └─> If input_method='ai': UPDATE ai_generations
       SET meal_id = new_meal_id WHERE id = ai_generation_id

   └─> Return meal + warnings

4. Format response
   └─> Return CreateMealResponseDTO (meal + warnings array)
   └─> Status: 201 Created
```

**Business rule - ai_generation_id validation:**

```typescript
if (input_method === 'ai') {
  const aiGeneration = await supabase
    .from('ai_generations')
    .select('id, status, user_id')
    .eq('id', ai_generation_id)
    .eq('user_id', userId)
    .single();

  if (!aiGeneration) {
    return 404 Not Found: "AI generation not found"
  }

  if (aiGeneration.status !== 'completed') {
    return 400 Bad Request: "AI generation must be completed"
  }
}
```

**Macronutrient warning logic:**

```typescript
function validateMacronutrients(
  calories: number,
  protein?: number | null,
  carbs?: number | null,
  fats?: number | null
): MealWarningDTO[] {
  const warnings: MealWarningDTO[] = [];

  if (protein !== null && carbs !== null && fats !== null) {
    const calculatedCalories = 4 * protein + 4 * carbs + 9 * fats;
    const difference = Math.abs(calories - calculatedCalories);
    const percentage = (difference / calories) * 100;

    if (percentage > 5) {
      warnings.push({
        field: "macronutrients",
        message: `The calculated calories from macronutrients (${Math.round(calculatedCalories)} kcal) differs by more than 5% from the provided calories (${calories} kcal). Please verify your input.`,
      });
    }
  }

  return warnings;
}
```

---

### 5.4. PATCH /api/v1/meals/:id - Aktualizacja posiłku

```
1. Endpoint (src/pages/api/v1/meals/[id].ts - PATCH handler)
   └─> Parse meal ID from URL params
   └─> Parse request body (JSON)
   └─> Validate with Zod (UpdateMealSchema)
   └─> Get userId (DEFAULT_USER_ID for MVP)

2. Fetch existing meal
   └─> MealsService.getMealById(mealId, userId)
   └─> If not found: return 404

3. Determine input_method change
   └─> If current input_method='ai' AND any value changed (except category):
       → Set input_method='ai-edited'

4. MealsService.updateMeal(mealId, userId, updateData)
   └─> Merge updateData with automatic input_method change
   └─> Calculate macronutrient warnings (using new values)
   └─> UPDATE meals table
   └─> Return updated meal + warnings

5. Format response
   └─> Return UpdateMealResponseDTO (meal + warnings array)
   └─> Status: 200 OK
```

**Auto input_method change logic:**

```typescript
function shouldChangeToAIEdited(currentMeal: Tables<"meals">, updateData: UpdateMealRequestDTO): boolean {
  // Only change if current is 'ai'
  if (currentMeal.input_method !== "ai") {
    return false;
  }

  // Check if any nutritional value changed
  const nutritionalFields = ["calories", "protein", "carbs", "fats", "description"];

  for (const field of nutritionalFields) {
    if (field in updateData && updateData[field] !== currentMeal[field]) {
      return true;
    }
  }

  return false;
}
```

---

### 5.5. DELETE /api/v1/meals/:id - Usuwanie posiłku

```
1. Endpoint (src/pages/api/v1/meals/[id].ts - DELETE handler)
   └─> Parse meal ID from URL params
   └─> Validate UUID format
   └─> Get userId (DEFAULT_USER_ID for MVP)

2. MealsService.deleteMeal(mealId, userId)
   └─> DELETE FROM meals WHERE id = mealId AND user_id = userId
   └─> Check affected rows
   └─> If 0 rows: meal not found or unauthorized
   └─> Return success boolean

3. Handle response
   └─> If not deleted: return 404 Not Found
   └─> If deleted: return 204 No Content
```

**CASCADE behavior:**

- Usunięcie meal automatycznie ustawia `meal_id = NULL` w powiązanych `ai_generations` (NOT CASCADE DELETE)
- Zgodnie z db-plan.md, relacja jest `ON DELETE CASCADE` dla `ai_generations.meal_id → meals.id`

---

## 6. Względy bezpieczeństwa

### 6.1. Autentykacja i autoryzacja

**Current state (MVP):**

- Używamy `DEFAULT_USER_ID` z `supabaseClient`
- Brak JWT authentication (TODO)

**Future state (Production):**

```typescript
// Replace DEFAULT_USER_ID with:
const session = context.locals.supabase.auth.getSession();
if (!session) {
  return new Response(
    JSON.stringify({
      error: "UNAUTHORIZED",
      message: "Authentication required",
    }),
    {
      status: 401,
      headers: { "Content-Type": "application/json" },
    }
  );
}
const userId = session.user.id;
```

**Row Level Security (RLS):**

- Wszystkie zapytania do tabeli `meals` automatycznie filtrowane przez RLS
- RLS policy: `user_id = auth.uid()`
- Dodatkowa walidacja w service layer dla pewności

---

### 6.2. Walidacja danych wejściowych

**Ochrona przed injection:**

- Wszystkie inputy walidowane przez Zod schemas
- Supabase SDK używa parametryzowanych zapytań
- Brak raw SQL w application code

**Walidacja formatów:**

- UUID validation dla IDs
- ISO 8601 datetime validation
- YYYY-MM-DD date format dla filtrów
- Enum validation dla category i input_method

**Walidacja zakresów:**

- `limit`: min 1, max 100
- `offset`: min 0
- `calories`: 1-10000
- `protein/carbs/fats`: 0-1000

**Sanityzacja:**

- `description`: trim whitespace, max 500 chars
- Wszystkie string inputs: trim

---

### 6.3. Zapobieganie Mass Assignment

**Chronione pola:**

- `id` - generowany przez bazę (UUID)
- `user_id` - pobierany z auth.uid(), NIE z requestu
- `created_at` - auto timestamp
- `updated_at` - auto trigger

**Mechanizm ochrony:**

```typescript
// NIGDY nie przekazuj user_id z body:
const body = await request.json();
// ❌ WRONG:
// const { user_id, ...mealData } = body;

// ✅ CORRECT:
const mealData = CreateMealSchema.parse(body); // Schema nie zawiera user_id
const userId = DEFAULT_USER_ID; // lub z JWT

await supabase.from("meals").insert({
  ...mealData,
  user_id: userId, // Zawsze z auth
});
```

---

### 6.4. Ochrona przed CSRF/XSS

**CORS:**

- Skonfigurowany w Astro middleware
- Allowed origins: frontend domain only (production)

**XSS Prevention:**

- `description` field: walidacja max length
- Frontend: użycie `textContent` zamiast `innerHTML`
- Supabase: automatyczne escaping w queries

---

### 6.5. Rate Limiting

**Nie wymagany dla MVP**, ale dla produkcji:

```typescript
import { mealsRateLimiter } from "../../../lib/services/rate-limit.service";

// POST /api/v1/meals: 20 requests/min
// GET /api/v1/meals: 60 requests/min
// PATCH/DELETE: 30 requests/min
```

---

### 6.6. Bezpieczeństwo timestamps

**Walidacja meal_timestamp:**

```typescript
function validateMealTimestamp(timestamp: string): boolean {
  const mealDate = new Date(timestamp);
  const now = new Date();

  if (mealDate > now) {
    throw new ValidationError("meal_timestamp cannot be in the future");
  }

  // Optional: prevent too old timestamps (e.g., > 1 year)
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);

  if (mealDate < oneYearAgo) {
    throw new ValidationError("meal_timestamp cannot be older than 1 year");
  }

  return true;
}
```

---

## 7. Obsługa błędów

### 7.1. Kody statusu HTTP

| Kod | Znaczenie             | Kiedy używać                                                      |
| --- | --------------------- | ----------------------------------------------------------------- |
| 200 | OK                    | Successful GET, PATCH                                             |
| 201 | Created               | Successful POST                                                   |
| 204 | No Content            | Successful DELETE                                                 |
| 400 | Bad Request           | Validation errors, invalid query params, business rule violations |
| 401 | Unauthorized          | Missing or invalid JWT token                                      |
| 404 | Not Found             | Meal not found, AI generation not found                           |
| 500 | Internal Server Error | Unexpected errors, database failures                              |

---

### 7.2. Scenariusze błędów

#### GET /api/v1/meals

| Scenariusz          | Status | Error Code            | Message                                                                  |
| ------------------- | ------ | --------------------- | ------------------------------------------------------------------------ |
| Invalid date format | 400    | VALIDATION_ERROR      | Invalid date format. Expected YYYY-MM-DD                                 |
| Invalid category    | 400    | VALIDATION_ERROR      | Invalid category. Must be one of: breakfast, lunch, dinner, snack, other |
| Limit out of range  | 400    | VALIDATION_ERROR      | Limit must be between 1 and 100                                          |
| Negative offset     | 400    | VALIDATION_ERROR      | Offset must be non-negative                                              |
| Database error      | 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred                                             |

---

#### GET /api/v1/meals/:id

| Scenariusz          | Status | Error Code            | Message                                                 |
| ------------------- | ------ | --------------------- | ------------------------------------------------------- |
| Invalid UUID format | 400    | VALIDATION_ERROR      | Invalid meal ID format                                  |
| Meal not found      | 404    | NOT_FOUND             | Meal not found                                          |
| Unauthorized access | 404    | NOT_FOUND             | Meal not found (RLS prevents seeing other users' meals) |
| Database error      | 500    | INTERNAL_SERVER_ERROR | An unexpected error occurred                            |

---

#### POST /api/v1/meals

| Scenariusz                              | Status | Error Code            | Message                                                |
| --------------------------------------- | ------ | --------------------- | ------------------------------------------------------ |
| Missing required field                  | 400    | VALIDATION_ERROR      | {field} is required                                    |
| Invalid field type                      | 400    | VALIDATION_ERROR      | {field} must be a {type}                               |
| Out of range value                      | 400    | VALIDATION_ERROR      | {field} must be between {min} and {max}                |
| meal_timestamp in future                | 400    | VALIDATION_ERROR      | meal_timestamp cannot be in the future                 |
| AI generation not found                 | 404    | NOT_FOUND             | AI generation not found                                |
| AI generation not completed             | 400    | VALIDATION_ERROR      | AI generation must be completed before creating a meal |
| AI generation belongs to different user | 404    | NOT_FOUND             | AI generation not found (RLS)                          |
| Database error                          | 500    | INTERNAL_SERVER_ERROR | Failed to create meal                                  |

---

#### PATCH /api/v1/meals/:id

| Scenariusz               | Status | Error Code            | Message                                |
| ------------------------ | ------ | --------------------- | -------------------------------------- |
| Invalid UUID format      | 400    | VALIDATION_ERROR      | Invalid meal ID format                 |
| Validation errors        | 400    | VALIDATION_ERROR      | Invalid update data                    |
| meal_timestamp in future | 400    | VALIDATION_ERROR      | meal_timestamp cannot be in the future |
| Meal not found           | 404    | NOT_FOUND             | Meal not found                         |
| Database error           | 500    | INTERNAL_SERVER_ERROR | Failed to update meal                  |

---

#### DELETE /api/v1/meals/:id

| Scenariusz          | Status | Error Code            | Message                |
| ------------------- | ------ | --------------------- | ---------------------- |
| Invalid UUID format | 400    | VALIDATION_ERROR      | Invalid meal ID format |
| Meal not found      | 404    | NOT_FOUND             | Meal not found         |
| Database error      | 500    | INTERNAL_SERVER_ERROR | Failed to delete meal  |

---

### 7.3. Error logging

**Logować do tabeli `error_logs` (przez `logError` helper):**

✅ **Logować:**

- Database connection errors (500)
- Unexpected exceptions (500)
- AI generation verification failures (gdy ai_generation_id istnieje ale ma nieprawidłowy status)
- Supabase RPC errors

❌ **Nie logować:**

- 400 Validation errors (user errors)
- 401 Unauthorized (expected)
- 404 Not Found (expected)

**Przykład:**

```typescript
catch (error) {
  console.error('Unexpected error in POST /api/v1/meals:', error);

  // Log to database
  await logError(supabase, {
    user_id: userId,
    error_type: 'meal_creation_error',
    error_message: error instanceof Error ? error.message : String(error),
    error_details: error instanceof Error ? { stack: error.stack } : undefined,
    context: {
      endpoint: 'POST /api/v1/meals',
      input_method: validatedData.input_method
    }
  });

  return new Response(JSON.stringify({
    error: "INTERNAL_SERVER_ERROR",
    message: "Failed to create meal"
  }), { status: 500 });
}
```

---

## 8. Wydajność

### 8.1. Optymalizacja zapytań

**Wykorzystanie istniejących indeksów:**

```sql
-- Z db-plan.md:
idx_meals_user_id ON meals(user_id)
idx_meals_user_timestamp ON meals(user_id, meal_timestamp DESC)
idx_ai_generations_meal_id ON ai_generations(meal_id)
idx_ai_generations_meal_created ON ai_generations(meal_id, created_at DESC)
```

**Query patterns:**

- GET /api/v1/meals: używa `idx_meals_user_timestamp` dla sortowania
- GET /api/v1/meals/:id: używa Primary Key + `idx_meals_user_id`
- LEFT JOIN z ai_generations: używa `idx_ai_generations_meal_created`

---

### 8.2. Paginacja

**Best practices:**

- Default limit: 50 (reasonable)
- Max limit: 100 (prevent large responses)
- Always count total with `count: 'exact'`
- Use `range(offset, offset + limit - 1)` for consistent pagination

**Performance note:**

- COUNT query może być kosztowny dla dużych zbiorów danych
- Future optimization: cache count lub użyj approximate count

---

### 8.3. Wykorzystanie VIEW

**Option 1: Use existing VIEW `meals_with_latest_ai`**

```typescript
// Advantage: Simplified query
const { data } = await supabase
  .from("meals_with_latest_ai")
  .select("*")
  .eq("user_id", userId)
  .order("meal_timestamp", { ascending: false })
  .range(offset, offset + limit - 1);
```

**Option 2: Manual LEFT JOIN LATERAL**

```typescript
// Advantage: More control, can select specific fields
const { data } = await supabase
  .from("meals")
  .select(
    `
    *,
    ai_generation:ai_generations(
      id, prompt, assumptions, model_used, generation_duration
    )
  `
  )
  .eq("user_id", userId)
  .order("meal_timestamp", { ascending: false })
  .range(offset, offset + limit - 1);
```

**Recommendation:** Use VIEW dla uproszczenia, ale bądź świadomy, że VIEW zwraca wszystkie kolumny.

---

### 8.4. N+1 Query Prevention

**Problem:** Pobieranie ai_generation dla każdego meal osobno

**Solution:** Zawsze używaj LEFT JOIN lub VIEW, NIGDY pętli:

```typescript
// ❌ BAD: N+1 queries
for (const meal of meals) {
  const aiGen = await supabase
    .from("ai_generations")
    .select("*")
    .eq("meal_id", meal.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
}

// ✅ GOOD: Single query with JOIN
const { data } = await supabase.from("meals_with_latest_ai").select("*");
```

---

### 8.5. Response size optimization

**Selective field selection:**

```typescript
// Future optimization: allow client to specify fields
// Example: ?fields=id,description,calories,meal_timestamp

const fields = parseFieldsParam(url.searchParams.get("fields"));
const selectQuery = fields || "*";

const { data } = await supabase.from("meals").select(selectQuery);
```

---

## 9. Etapy wdrożenia

### Step 1: Przygotowanie walidacji

**Task 1.1:** Utworzyć `src/lib/validation/meal.schemas.ts`

- [ ] Zdefiniować `MealCategorySchema` enum
- [ ] Zdefiniować `InputMethodSchema` enum
- [ ] Zdefiniować `CreateAIMealSchema`
- [ ] Zdefiniować `CreateManualMealSchema`
- [ ] Zdefiniować `CreateMealSchema` (discriminated union)
- [ ] Zdefiniować `UpdateMealSchema`
- [ ] Zdefiniować `GetMealsQuerySchema`
- [ ] Dodać niestandardową walidację dla `meal_timestamp` (nie w przyszłości)
- [ ] Dodać testy jednostkowe dla schemas

**Zależności:** brak
**Oczekiwany rezultat:** Plik z kompletnymi Zod schemas gotowymi do użycia

---

### Step 2: Implementacja MealsService

**Task 2.1:** Utworzyć `src/lib/services/meals.service.ts`

**Metody do implementacji:**

```typescript
export class MealsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  // [ ] getMeals(userId, filters)
  async getMeals(userId: string, filters: GetMealsFilters): Promise<MealResponseDTO[]>;

  // [ ] countMeals(userId, filters)
  async countMeals(userId: string, filters: GetMealsFilters): Promise<number>;

  // [ ] getMealById(mealId, userId)
  async getMealById(mealId: string, userId: string): Promise<MealResponseDTO | null>;

  // [ ] createMeal(userId, mealData)
  async createMeal(userId: string, mealData: CreateMealRequestDTO): Promise<CreateMealResult>;

  // [ ] updateMeal(mealId, userId, updateData)
  async updateMeal(
    mealId: string,
    userId: string,
    updateData: UpdateMealRequestDTO,
    currentMeal: Tables<"meals">
  ): Promise<UpdateMealResult>;

  // [ ] deleteMeal(mealId, userId)
  async deleteMeal(mealId: string, userId: string): Promise<boolean>;

  // [ ] validateAIGeneration(aiGenerationId, userId)
  private async validateAIGeneration(
    aiGenerationId: string,
    userId: string
  ): Promise<{ valid: boolean; error?: string }>;

  // [ ] formatMealWithAIGeneration(meal)
  private formatMealWithAIGeneration(meal: any): MealResponseDTO;
}
```

**Task 2.2:** Utworzyć `src/lib/helpers/macronutrient-validator.ts`

- [ ] Funkcja `validateMacronutrients(calories, protein, carbs, fats)`
- [ ] Zwraca `MealWarningDTO[]`
- [ ] Logika: oblicz kalorie (4p + 4c + 9f), sprawdź czy różnica > 5%
- [ ] Testy jednostkowe

**Zależności:** Step 1
**Oczekiwany rezultat:** Kompletny serwis z logiką biznesową i testami

---

### Step 3: Implementacja GET /api/v1/meals

**Task 3.1:** Utworzyć `src/pages/api/v1/meals/index.ts`

**GET handler:**

- [ ] Parse query parameters z URL
- [ ] Validate z `GetMealsQuerySchema`
- [ ] Handle Zod validation errors (400)
- [ ] Get userId (DEFAULT_USER_ID)
- [ ] Call `MealsService.getMeals()` i `countMeals()`
- [ ] Build `MealsListResponseDTO`
- [ ] Return 200 OK
- [ ] Handle unexpected errors (500) + error logging

**Zależności:** Step 1, Step 2
**Oczekiwany rezultat:** Działający endpoint GET z filtrowaniem i paginacją

---

### Step 4: Implementacja GET /api/v1/meals/:id

**Task 4.1:** Utworzyć `src/pages/api/v1/meals/[id].ts`

**GET handler:**

- [ ] Parse meal ID z `context.params.id`
- [ ] Validate UUID format
- [ ] Get userId (DEFAULT_USER_ID)
- [ ] Call `MealsService.getMealById()`
- [ ] If null: return 404 Not Found
- [ ] If found: return 200 OK z `MealResponseDTO`
- [ ] Handle unexpected errors (500) + error logging

**Zależności:** Step 2
**Oczekiwany rezultat:** Działający endpoint GET dla pojedynczego meal

---

### Step 5: Implementacja POST /api/v1/meals

**Task 5.1:** Dodać POST handler do `src/pages/api/v1/meals/index.ts`

**POST handler:**

- [ ] Parse request body (JSON)
- [ ] Validate z `CreateMealSchema`
- [ ] Handle Zod validation errors (400)
- [ ] Get userId (DEFAULT_USER_ID)
- [ ] Validate meal_timestamp (nie w przyszłości)
- [ ] If input_method='ai': validate ai_generation_id
  - [ ] Check existence
  - [ ] Check ownership (user_id)
  - [ ] Check status='completed'
  - [ ] Return 404 if not found
  - [ ] Return 400 if not completed
- [ ] Call `MealsService.createMeal()`
- [ ] Return 201 Created z `CreateMealResponseDTO` (with warnings)
- [ ] Handle errors:
  - [ ] 404 for AI generation not found
  - [ ] 500 for database errors + error logging

**Zależności:** Step 2
**Oczekiwany rezultat:** Działający endpoint POST z walidacją makroskładników

---

### Step 6: Implementacja PATCH /api/v1/meals/:id

**Task 6.1:** Dodać PATCH handler do `src/pages/api/v1/meals/[id].ts`

**PATCH handler:**

- [ ] Parse meal ID z URL params
- [ ] Parse request body (JSON)
- [ ] Validate z `UpdateMealSchema`
- [ ] Handle Zod validation errors (400)
- [ ] Get userId (DEFAULT_USER_ID)
- [ ] Fetch current meal z `MealsService.getMealById()`
- [ ] If not found: return 404
- [ ] Determine if input_method should change to 'ai-edited'
  - [ ] Implement `shouldChangeToAIEdited()` helper
  - [ ] Auto-merge input_method='ai-edited' if needed
- [ ] Call `MealsService.updateMeal()`
- [ ] Return 200 OK z `UpdateMealResponseDTO` (with warnings)
- [ ] Handle unexpected errors (500) + error logging

**Zależności:** Step 2
**Oczekiwany rezultat:** Działający endpoint PATCH z auto-zmianą input_method

---

### Step 7: Implementacja DELETE /api/v1/meals/:id

**Task 7.1:** Dodać DELETE handler do `src/pages/api/v1/meals/[id].ts`

**DELETE handler:**

- [ ] Parse meal ID z URL params
- [ ] Validate UUID format
- [ ] Get userId (DEFAULT_USER_ID)
- [ ] Call `MealsService.deleteMeal()`
- [ ] If deleted: return 204 No Content
- [ ] If not found: return 404 Not Found
- [ ] Handle unexpected errors (500) + error logging

**Zależności:** Step 2
**Oczekiwany rezultat:** Działający endpoint DELETE

---

### Step 8: Testy integracyjne

**Task 8.1:** Utworzyć `src/tests/api/meals.test.ts`

**Test scenarios:**

- [ ] GET /api/v1/meals - list meals with pagination
- [ ] GET /api/v1/meals - filter by date
- [ ] GET /api/v1/meals - filter by date range
- [ ] GET /api/v1/meals - filter by category
- [ ] GET /api/v1/meals - invalid query params (400)
- [ ] GET /api/v1/meals/:id - retrieve meal
- [ ] GET /api/v1/meals/:id - meal not found (404)
- [ ] POST /api/v1/meals - create AI meal
- [ ] POST /api/v1/meals - create manual meal
- [ ] POST /api/v1/meals - create with macronutrient warning
- [ ] POST /api/v1/meals - validation errors (400)
- [ ] POST /api/v1/meals - AI generation not found (404)
- [ ] POST /api/v1/meals - meal_timestamp in future (400)
- [ ] PATCH /api/v1/meals/:id - update meal
- [ ] PATCH /api/v1/meals/:id - auto change to ai-edited
- [ ] PATCH /api/v1/meals/:id - meal not found (404)
- [ ] DELETE /api/v1/meals/:id - delete meal
- [ ] DELETE /api/v1/meals/:id - meal not found (404)

**Zależności:** Step 3-7
**Oczekiwany rezultat:** Comprehensive test suite z coverage > 80%

---

### Step 9: Dokumentacja API

**Task 9.1:** Zaktualizować `.ai/api-plan.md`

- [ ] Verify wszystkie przykłady request/response są poprawne
- [ ] Add any missing edge cases
- [ ] Update error codes if needed

**Task 9.2:** Utworzyć przykłady użycia (optional)

- [ ] Curl examples
- [ ] JavaScript/TypeScript fetch examples
- [ ] Postman collection (optional)

**Zależności:** Step 8
**Oczekiwany rezultat:** Aktualna dokumentacja API

---

### Step 10: Code review i polish

**Task 10.1:** Code review checklist

- [ ] All Zod schemas are correct
- [ ] Error handling is consistent
- [ ] Error logging for 500 errors only
- [ ] No N+1 queries
- [ ] RLS is enforced
- [ ] user_id comes from auth, not from request body
- [ ] Wszystkie timestamps są w UTC
- [ ] Response types match DTOs z `src/types.ts`
- [ ] Macronutrient warning logic is correct
- [ ] AI generation validation is complete
- [ ] input_method auto-change to 'ai-edited' works
- [ ] Pagination is correct (range calculation)
- [ ] Date filters work correctly (single date vs range)

**Task 10.2:** Performance review

- [ ] Check query plans (EXPLAIN ANALYZE)
- [ ] Verify indexes are used
- [ ] Measure response times
- [ ] Optimize if needed

**Task 10.3:** Security review

- [ ] Verify RLS policies are active
- [ ] Test unauthorized access (different user trying to access meals)
- [ ] Test SQL injection attempts (should be blocked by Supabase SDK)
- [ ] Test XSS in description field
- [ ] Verify meal_timestamp validation

**Zależności:** Step 8
**Oczekiwany rezultat:** Production-ready code

---

## 10. Checklist końcowy

### Files to create:

- [ ] `src/lib/validation/meal.schemas.ts`
- [ ] `src/lib/services/meals.service.ts`
- [ ] `src/lib/helpers/macronutrient-validator.ts`
- [ ] `src/pages/api/v1/meals/index.ts` (GET, POST)
- [ ] `src/pages/api/v1/meals/[id].ts` (GET, PATCH, DELETE)
- [ ] `src/tests/api/meals.test.ts`

### Files to update:

- [ ] `.ai/api-plan.md` (verify and update if needed)

### Verification:

- [ ] All endpoints return correct status codes
- [ ] All validation rules are enforced
- [ ] Macronutrient warnings work correctly
- [ ] AI generation validation works
- [ ] input_method auto-change works
- [ ] Pagination works correctly
- [ ] Date filtering works (single + range)
- [ ] Error logging for 500 errors only
- [ ] RLS is enforced
- [ ] Tests pass
- [ ] Documentation is up to date

---

## 11. Potential issues and solutions

### Issue 1: VIEW vs Manual JOIN performance

**Problem:** Nie wiadomo, czy używać `meals_with_latest_ai` VIEW czy manual JOIN.

**Solution:**

1. Start z VIEW dla uproszczenia
2. Measure performance
3. Jeśli VIEW jest wolny, przełącz na manual LEFT JOIN LATERAL z selekcją konkretnych kolumn

---

### Issue 2: COUNT query performance

**Problem:** `COUNT(*)` może być wolny dla dużych tabel.

**Solution:**

1. For MVP: użyj `count: 'exact'`
2. For production: rozważ:
   - Cached count (aktualizowany co 5 min)
   - Approximate count (`count: 'planned'`)
   - Remove total count from pagination (tylko next/prev links)

---

### Issue 3: Timezone handling

**Problem:** Filtrowanie po dacie z różnymi timezone.

**Current approach:**

- Wszystkie timestamps w UTC
- Frontend konwertuje do local timezone

**Future improvement:**

- Dodać `user_timezone` do profiles
- Konwertować daty w query: `DATE(meal_timestamp AT TIME ZONE user_timezone)`

---

### Issue 4: ai_generation_id validation timing

**Problem:** Sprawdzanie ai_generation_id może być kosztowne.

**Solution:**

1. Sprawdzaj tylko gdy `input_method='ai'`
2. Użyj `.single()` dla single query
3. Rozważ cache dla często używanych ai_generation_id (unlikely needed)

---

### Issue 5: meal_timestamp validation edge cases

**Problem:** Timezone differences mogą powodować false positives dla "future" validation.

**Solution:**

```typescript
// Allow small buffer (e.g., 1 minute) to account for clock skew
const now = new Date();
const mealDate = new Date(meal_timestamp);
const buffer = 60 * 1000; // 1 minute in ms

if (mealDate.getTime() > now.getTime() + buffer) {
  throw new ValidationError("meal_timestamp cannot be in the future");
}
```

---

## 12. Metryki sukcesu

Po implementacji, monitoruj:

1. **Performance metrics:**
   - Average response time: < 200ms for GET, < 300ms for POST/PATCH
   - 95th percentile: < 500ms
   - Database query time: < 100ms

2. **Error rates:**
   - 4xx errors: < 5% of total requests (mainly validation)
   - 5xx errors: < 0.1% of total requests
   - Error logs: review weekly for patterns

3. **Business metrics:**
   - % of meals with `input_method='ai'` (target: > 70%)
   - % of meals with `input_method='ai-edited'` (target: < 20%)
   - % of meals with macronutrient warnings (monitor for AI quality)
   - Average macros per meal (for nutritional insights)

4. **API usage:**
   - Most common filters (date vs date_range vs category)
   - Average pagination limit used
   - GET vs POST vs PATCH vs DELETE ratio

---

## Końcowe uwagi

Ten plan implementacji zapewnia:

✅ **Pełną funkcjonalność** zgodną ze specyfikacją API
✅ **Bezpieczeństwo** przez RLS, walidację, i proper error handling
✅ **Wydajność** przez właściwe użycie indeksów i optymalizację zapytań
✅ **Maintainability** przez separation of concerns (schemas, service, endpoints)
✅ **Testability** przez comprehensive test suite
✅ **Observability** przez error logging i metrics

Plan jest ready do wykonania krok po kroku przez zespół developerski.
