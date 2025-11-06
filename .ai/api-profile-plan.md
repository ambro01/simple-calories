# API Endpoint Implementation Plan: Profile Management

## 1. Przegląd punktu końcowego

Endpointy zarządzania profilem użytkownika umożliwiają odczyt i aktualizację profilu zalogowanego użytkownika. Profil jest automatycznie tworzony przy rejestracji przez trigger `handle_new_user()` i służy jako most między systemem uwierzytelniania Supabase a logiką aplikacji.

**Endpointy:**

- `GET /api/v1/profile` - pobiera profil zalogowanego użytkownika
- `PATCH /api/v1/profile` - aktualizuje profil zalogowanego użytkownika (obecnie bez edytowalnych pól, przygotowane na przyszłe rozszerzenia)

**Kluczowe cechy:**

- Operacje wykonywane wyłącznie na profilu zalogowanego użytkownika (identyfikacja przez `auth.uid()`)
- Pełna izolacja danych przez Row Level Security (RLS)
- Automatyczna aktualizacja `updated_at` przez trigger bazodanowy

## 2. Szczegóły żądania

### GET /api/v1/profile

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/v1/profile`
- **Parametry:**
  - Wymagane: brak (userId pobierany z `auth.uid()`)
  - Opcjonalne: brak
- **Request Body:** brak
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)

### PATCH /api/v1/profile

- **Metoda HTTP:** PATCH
- **Struktura URL:** `/api/v1/profile`
- **Parametry:**
  - Wymagane: brak (userId pobierany z `auth.uid()`)
  - Opcjonalne: brak
- **Request Body:**
  ```json
  {
    // Obecnie pusty obiekt, przygotowany na przyszłe pola (np. display_name, preferences)
  }
  ```
- **Headers:**
  - `Authorization: Bearer <access_token>` (wymagany)
  - `Content-Type: application/json` (wymagany)

## 3. Wykorzystywane typy

### Typy z src/types.ts:

```typescript
// Response dla GET i PATCH
export type ProfileResponseDTO = Tables<"profiles">;

// Request body dla PATCH
export type UpdateProfileRequestDTO = Record<string, never>;

// Błędy
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: ValidationErrorDetailsDTO;
}
```

### Typy bazodanowe (z database.types.ts):

```typescript
Tables<"profiles"> = {
  id: string; // UUID
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}
```

## 4. Szczegóły odpowiedzi

### GET /api/v1/profile

**Status 200 - Success:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-27T10:00:00.000Z",
  "updated_at": "2025-01-27T10:00:00.000Z"
}
```

**Status 401 - Unauthorized:**

```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

**Status 404 - Not Found:**

```json
{
  "error": "Not Found",
  "message": "Profile not found"
}
```

**Status 500 - Internal Server Error:**

```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### PATCH /api/v1/profile

**Status 200 - Success:**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-01-27T10:00:00.000Z",
  "updated_at": "2025-01-27T12:30:00.000Z"
}
```

**Status 400 - Bad Request:**

```json
{
  "error": "Bad Request",
  "message": "Invalid request body",
  "details": {
    "field_name": "Error description"
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

## 5. Przepływ danych

### GET /api/v1/profile

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. GET handler → ProfileService.getProfile(supabase, userId)
   ↓
4. Service wykonuje: supabase.from('profiles').select('*').eq('id', userId).single()
   ↓
5. RLS Policy "Users can view own profile" filtruje dane
   ↓
6. Response 200 z ProfileResponseDTO
```

### PATCH /api/v1/profile

```
1. Request → Astro Middleware
   ↓
2. Middleware weryfikuje sesję Supabase
   ↓
3. PATCH handler waliduje body przez Zod schema
   ↓
4. Handler → ProfileService.updateProfile(supabase, userId, data)
   ↓
5. Service wykonuje: supabase.from('profiles').update(data).eq('id', userId).select().single()
   ↓
6. RLS Policy "Users can update own profile" filtruje zapytanie
   ↓
7. Trigger "update_profiles_updated_at" automatycznie ustawia updated_at
   ↓
8. Response 200 z zaktualizowanym ProfileResponseDTO
```

### Interakcje z bazą danych:

- **Tabela:** `profiles`
- **RLS Policies:**
  - `Users can view own profile` - SELECT WHERE id = auth.uid()
  - `Users can update own profile` - UPDATE WHERE id = auth.uid()
- **Trigger:** `update_profiles_updated_at` - automatyczna aktualizacja updated_at przy UPDATE

## 6. Względy bezpieczeństwa

### Uwierzytelnianie:

- **Supabase Auth:** middleware sprawdza ważność tokenu JWT
- **Session Management:** `context.locals.supabase.auth.getUser()` pobiera sesję
- **Token w headerze:** `Authorization: Bearer <access_token>`

### Autoryzacja:

- **RLS Policies:** automatyczna filtracja zapytań po `auth.uid()`
- **Brak parametrów userId:** ID użytkownika ZAWSZE pobierane z sesji, nigdy z parametrów
- **Izolacja danych:** użytkownik widzi/modyfikuje tylko swój profil

### Walidacja danych:

- **Zod schemas:** walidacja request body w PATCH
- **Type safety:** TypeScript zapewnia bezpieczeństwo typów
- **SQL Injection:** Supabase SDK automatycznie chroni przed SQL injection

### Najlepsze praktyki:

- Używać `context.locals.supabase` zamiast bezpośredniego importu klienta
- Nigdy nie polegać na userId z parametrów URL lub body
- Zawsze sprawdzać wynik `getUser()` przed dostępem do zasobów
- Logować próby nieautoryzowanego dostępu (opcjonalnie)

## 7. Obsługa błędów

### Scenariusze błędów:

| Kod | Scenariusz                         | Obsługa                                | Logowanie                     |
| --- | ---------------------------------- | -------------------------------------- | ----------------------------- |
| 400 | Nieprawidłowy request body (PATCH) | Walidacja Zod, zwróć szczegóły błędów  | Nie                           |
| 401 | Brak tokenu auth                   | Middleware zwraca 401                  | Nie                           |
| 401 | Nieprawidłowy token                | `getUser()` zwraca błąd                | Nie                           |
| 404 | Profil nie istnieje                | Service zwraca null                    | Tak (nie powinno się zdarzyć) |
| 500 | Błąd bazy danych                   | Try-catch w service, log do error_logs | Tak                           |
| 500 | Nieoczekiwany błąd aplikacji       | Global error handler                   | Tak                           |

### Struktura obsługi błędów:

```typescript
// W endpoincie
try {
  const profile = await ProfileService.getProfile(supabase, userId);

  if (!profile) {
    return new Response(
      JSON.stringify({
        error: "Not Found",
        message: "Profile not found",
      }),
      { status: 404 }
    );
  }

  return new Response(JSON.stringify(profile), { status: 200 });
} catch (error) {
  // Log do error_logs dla błędów 500
  await logError(supabase, {
    user_id: userId,
    error_type: "profile_fetch_error",
    error_message: error.message,
    context: { endpoint: "GET /api/v1/profile" },
  });

  return new Response(
    JSON.stringify({
      error: "Internal Server Error",
      message: "An unexpected error occurred",
    }),
    { status: 500 }
  );
}
```

### Logowanie błędów do error_logs:

Błędy wymagające logowania (500):

- Błędy połączenia z bazą danych
- Błędy Supabase SDK (nieoczekiwane)
- Profil nie istnieje (404) - teoretycznie niemożliwe, logować dla debugowania

Błędy niewymagające logowania:

- 401 Unauthorized - normalna sytuacja (brak/nieprawidłowy token)
- 400 Bad Request - błąd walidacji po stronie użytkownika

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

1. **Single Query:**
   - Używać `.single()` dla zapytań zwracających jeden rekord
   - Zmniejsza overhead serializacji/deserializacji

2. **RLS Performance:**
   - RLS policies są indeksowane (PRIMARY KEY na id)
   - Zapytania filtrowane na poziomie bazy danych (wydajne)

3. **Minimal Data Transfer:**
   - Profil ma tylko 3 pola (id, created_at, updated_at)
   - Brak konieczności paginacji czy ograniczania pól

4. **Caching (przyszłość):**
   - Rozważyć cache dla `GET /api/v1/profile` (Redis, in-memory)
   - Invalidacja cache przy PATCH

### Potencjalne wąskie gardła:

- **Brak:** profil jest prosty, zapytania są szybkie (PK lookup)
- **Przyszłość:** jeśli dodamy relacje (user preferences, settings), rozważyć:
  - Selective field fetching
  - Eager loading relacji
  - Denormalizacja niektórych danych

## 9. Etapy wdrożenia

### Krok 1: Utworzenie serwisu Profile Service

**Plik:** `src/lib/services/profile.service.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";
import type { ProfileResponseDTO, UpdateProfileRequestDTO } from "@/types";

export class ProfileService {
  static async getProfile(supabase: SupabaseClient, userId: string): Promise<ProfileResponseDTO | null> {
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();

    if (error) throw error;
    return data;
  }

  static async updateProfile(
    supabase: SupabaseClient,
    userId: string,
    updates: UpdateProfileRequestDTO
  ): Promise<ProfileResponseDTO> {
    const { data, error } = await supabase.from("profiles").update(updates).eq("id", userId).select().single();

    if (error) throw error;
    return data;
  }
}
```

### Krok 2: Utworzenie Zod schemas dla walidacji

**Plik:** `src/lib/validators/profile.validators.ts`

```typescript
import { z } from "zod";

// PATCH /api/v1/profile
export const updateProfileSchema = z
  .object({
    // Obecnie pusty, przygotowany na przyszłe pola
  })
  .strict(); // strict() zapewnia, że nie ma nieznanych pól
```

### Krok 3: Implementacja GET /api/v1/profile

**Plik:** `src/pages/api/v1/profile.ts`

```typescript
import type { APIRoute } from "astro";
import { ProfileService } from "@/lib/services/profile.service";
import type { ProfileResponseDTO, ErrorResponseDTO } from "@/types";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // 1. Sprawdzenie uwierzytelnienia
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        } as ErrorResponseDTO),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Pobranie profilu
    const profile = await ProfileService.getProfile(locals.supabase, user.id);

    if (!profile) {
      // Teoretycznie niemożliwe (profil tworzony przy rejestracji)
      // Log dla debugowania
      return new Response(
        JSON.stringify({
          error: "Not Found",
          message: "Profile not found",
        } as ErrorResponseDTO),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Zwróć profil
    return new Response(JSON.stringify(profile as ProfileResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching profile:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Krok 4: Implementacja PATCH /api/v1/profile

**W tym samym pliku:** `src/pages/api/v1/profile.ts`

```typescript
import { updateProfileSchema } from "@/lib/validators/profile.validators";

export const PATCH: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Sprawdzenie uwierzytelnienia
    const {
      data: { user },
      error: authError,
    } = await locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          message: "Authentication required",
        } as ErrorResponseDTO),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Parsowanie i walidacja body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON body",
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const validation = updateProfileSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        } as ErrorResponseDTO),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 3. Aktualizacja profilu
    const updatedProfile = await ProfileService.updateProfile(locals.supabase, user.id, validation.data);

    // 4. Zwróć zaktualizowany profil
    return new Response(JSON.stringify(updatedProfile as ProfileResponseDTO), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating profile:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      } as ErrorResponseDTO),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

### Krok 5: Utworzenie helper function do logowania błędów

**Plik:** `src/lib/helpers/error-logger.ts`

```typescript
import type { SupabaseClient } from "@/db/supabase.client";

interface ErrorLogParams {
  user_id?: string;
  error_type: string;
  error_message: string;
  error_details?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export async function logError(supabase: SupabaseClient, params: ErrorLogParams): Promise<void> {
  try {
    await supabase.from("error_logs").insert({
      user_id: params.user_id || null,
      error_type: params.error_type,
      error_message: params.error_message,
      error_details: params.error_details || null,
      context: params.context || null,
    });
  } catch (logError) {
    // Jeśli logowanie nie powiodło się, tylko console.error
    console.error("Failed to log error to database:", logError);
  }
}
```

### Krok 6: Testowanie endpointów

**Test GET /api/v1/profile:**

```bash
# Success case
curl -X GET http://localhost:4321/api/v1/profile \
  -H "Authorization: Bearer <valid_token>"

# Unauthorized case
curl -X GET http://localhost:4321/api/v1/profile
```

**Test PATCH /api/v1/profile:**

```bash
# Success case (obecnie pusty body)
curl -X PATCH http://localhost:4321/api/v1/profile \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{}'

# Bad request (nieznane pole)
curl -X PATCH http://localhost:4321/api/v1/profile \
  -H "Authorization: Bearer <valid_token>" \
  -H "Content-Type: application/json" \
  -d '{"unknown_field": "value"}'
```

### Krok 7: Dokumentacja i code review

1. Sprawdzić czy wszystkie typy są poprawnie zaimportowane
2. Zweryfikować czy RLS policies działają poprawnie (test w Supabase Dashboard)
3. Przetestować edge cases (brak profilu, multiple requests)
4. Code review - sprawdzić zgodność z coding guidelines
5. Zaktualizować dokumentację API jeśli coś się zmieniło

### Krok 8: Deployment checklist

- [ ] Wszystkie testy przechodzą
- [ ] Linter nie zgłasza błędów
- [ ] TypeScript kompiluje się bez błędów
- [ ] RLS policies są włączone i działają
- [ ] Trigger `update_profiles_updated_at` działa poprawnie
- [ ] Error logging działa
- [ ] Dokumentacja jest aktualna

---

**Uwagi końcowe:**

- Endpointy są proste i gotowe na przyszłe rozszerzenia (np. dodanie pól display_name, preferences)
- Gdy pojawią się nowe pola, wystarczy zaktualizować `UpdateProfileRequestDTO` i `updateProfileSchema`
- RLS zapewnia bezpieczeństwo na poziomie bazy danych
- Implementacja zgodna z wytycznymi Astro (prerender=false, uppercase HTTP methods)
