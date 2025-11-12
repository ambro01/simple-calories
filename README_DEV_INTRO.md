# Instrukcja wdrożeniowa dla developerów - Simple Calories

## 📚 Spis treści

1. [Wprowadzenie do projektu](#-wprowadzenie-do-projektu)
2. [Architektura aplikacji](#️-architektura-aplikacji)
3. [Stos technologiczny](#-stos-technologiczny)
4. [Struktura projektu](#-struktura-projektu)
5. [Kluczowe koncepcje](#-kluczowe-koncepcje)
6. [Jak dodać nową funkcjonalność](#-jak-dodać-nową-funkcjonalność)
7. [Konwencje kodowania](#️-konwencje-kodowania)
8. [Testowanie](#-testowanie)
9. [Debugging](#-debugging)
10. [Przydatne zasoby](#-przydatne-zasoby)

---

## 🎯 Wprowadzenie do projektu

### Czym jest Simple Calories?

**Simple Calories** to aplikacja webowa do szybkiego liczenia kalorii z wykorzystaniem AI. Głównym celem jest **usunięcie bariery wejścia** dla osób, które chcą świadomie kontrolować dietę, ale są zniechęcone czasochłonnością tradycyjnych aplikacji.

### Problem biznesowy

**Klasyczne aplikacje do liczenia kalorii są zbyt skomplikowane:**

```
Tradycyjne podejście:
1. Wyszukaj "jajka" → 50+ wyników
2. Wybierz konkretny wariant
3. Wprowadź gramaturę
4. Powtórz dla "chleba" → kolejne 50+ wyników
⏱️ Czas: 3-5 minut na jeden posiłek
```

**Nasze rozwiązanie - AI-first:**

```
Nowe podejście:
1. Wpisz: "2 jajka sadzone z kromką chleba"
2. Kliknij "Generuj z AI"
3. AI zwraca: 420 kcal + makroskładniki
4. Zatwierdź
⏱️ Czas: 10-15 sekund
```

### Kluczowe funkcjonalności

- ✨ **AI-powered estimation** - Opisz posiłek, otrzymaj kalorie
- ✏️ **Tryb manualny** - Dla użytkowników znających wartości odżywcze
- 📊 **Dashboard** - Przegląd postępów z kolorowym wskaźnikiem celu
- 🎯 **Cele kaloryczne** - Zarządzanie dziennym celem
- 📱 **Responsywność** - Mobile-first design (RWD)

---

## 🏛️ Architektura aplikacji

### Wzorzec architektoniczny

Projekt oparty jest na **architekturze warstwowej (layered architecture)** z wyraźnym podziałem odpowiedzialności:

```
┌─────────────────────────────────────────┐
│   Presentation Layer                    │
│   (Astro Pages + React Components)      │  ← UI, formularze, interakcje
├─────────────────────────────────────────┤
│   API Layer                              │
│   (Astro API Routes)                     │  ← REST endpoints, routing
├─────────────────────────────────────────┤
│   Service Layer                          │
│   (Business Logic Services)              │  ← Logika biznesowa, walidacja
├─────────────────────────────────────────┤
│   Data Access Layer                      │
│   (Supabase Client)                      │  ← Komunikacja z bazą danych
├─────────────────────────────────────────┤
│   External Services                      │
│   (OpenRouter AI)                        │  ← Integracje zewnętrzne
└─────────────────────────────────────────┘
```

### Przepływ danych - Przykład: Dodawanie posiłku przez AI

```
USER                    COMPONENT              API ROUTE               SERVICE                DATABASE
  │                        │                      │                       │                      │
  │  Wpisuje:              │                      │                       │                      │
  │  "2 jajka z chlebem"   │                      │                       │                      │
  │─────────────────────>  │                      │                       │                      │
  │                        │                      │                       │                      │
  │  Klika "Generuj"       │                      │                       │                      │
  │─────────────────────>  │                      │                       │                      │
  │                        │                      │                       │                      │
  │                        │  POST /api/v1/       │                       │                      │
  │                        │  ai-generations      │                       │                      │
  │                        │──────────────────────>                       │                      │
  │                        │                      │                       │                      │
  │                        │                      │  1. Walidacja Zod     │                      │
  │                        │                      │  2. Rate limiting     │                      │
  │                        │                      │──────────────────────>|                      │
  │                        │                      │                       │                      │
  │                        │                      │                       │  1. INSERT pending   │
  │                        │                      │                       │  2. Call OpenRouter  │
  │                        │                      │                       │  3. UPDATE result    │
  │                        │                      │                       │─────────────────────>|
  │                        │                      │                       │                      │
  │                        │  201 Created         │                       │                      │
  │                        │  { calories: 420 }   │                       │                      │
  │                        │<──────────────────────                       │                      │
  │                        │                      │                       │                      │
  │  Wyświetla wynik       │                      │                       │                      │
  │<─────────────────────  │                      │                       │                      │
```

### Kluczowe decyzje architektoniczne

#### 1. **Server-Side Rendering (SSR) z wyspami interaktywności**

- **Astro** renderuje strony po stronie serwera → szybsze ładowanie
- **React** używany selektywnie tylko dla komponentów interaktywnych
- Minimalna ilość JavaScript wysyłana do przeglądarki

```astro
---
// src/pages/index.astro - SSR
import Layout from "@/layouts/Layout.astro";
import { Dashboard } from "@/components/dashboard/Dashboard";
---

<Layout title="Dashboard">
  <!-- Tylko Dashboard jest interaktywny -->
  <Dashboard client:load />
</Layout>
```

#### 2. **Mobile First, Progressive Enhancement**

- Aplikacja projektowana najpierw dla urządzeń mobilnych
- Stopniowe dodawanie funkcjonalności dla większych ekranów
- RWD (Responsive Web Design) jako fundament

#### 3. **AI-First Interface**

```
┌────────────────────────┐
│ [AI] │ Ręcznie         │  ← AI jako domyślna zakładka
├────────────────────────┤
│ Opisz swój posiłek...  │
│                        │
└────────────────────────┘
```

Tryb AI jest domyślny, tryb manualny to alternatywa (fallback).

#### 4. **Backend as a Service (BaaS)**

**Supabase** zarządza:

- Bazą danych PostgreSQL
- Autentykacją użytkowników
- Row Level Security (RLS) policies

Minimalizacja własnego kodu backendowego = szybsze wdrożenie MVP.

#### 5. **Statyczne typowanie end-to-end**

```typescript
// 1. Typy generowane z bazy danych
export type Database = {
  /* ... */
};

// 2. Typy w serwisach
class MealsService {
  constructor(private supabase: SupabaseClient<Database>) {}
}

// 3. Typy w API
export const POST: APIRoute = async ({ request, locals }) => {
  const data = CreateMealSchema.parse(body); // Zod validation
};

// 4. Typy w React
interface MealCardProps {
  meal: MealResponseDTO;
}
```

---

## 🛠 Stos technologiczny

### Frontend

| Technologia                                  | Rola                                                                    | Dlaczego?                                     |
| -------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| **[Astro 5](https://astro.build/)**          | Framework do budowy szybkich aplikacji webowych                         | ⚡ SSR, 📦 minimal JS, 🏝️ Islands Architecture |
| **[React 19](https://react.dev/)**           | Biblioteka UI dla komponentów interaktywnych                            | 🎣 Hooks, 🔄 auto-batching, 📊 ekosystem       |
| **[TypeScript 5](https://typescriptlang.org)** | Statyczne typowanie kodu i lepsze wsparcie IDE                          | 🔒 Type safety, 💡 IntelliSense                |
| **[Tailwind CSS 4](https://tailwindcss.com/)** | Utility-first CSS framework                                             | 🎨 Szybkie stylowanie, 📱 RWD out-of-the-box   |
| **[Shadcn/ui](https://ui.shadcn.com/)**      | Biblioteka dostępnych komponentów React                                 | ♿ Accessibility, 🎨 customizable              |

### Backend

| Technologia                           | Rola                                          | Dlaczego?                                           |
| ------------------------------------- | --------------------------------------------- | --------------------------------------------------- |
| **[Supabase](https://supabase.com/)** | Kompleksowe rozwiązanie Backend-as-a-Service  | ✅ Open-source, 🔐 RLS, 🔑 Auth, 📊 PostgreSQL       |
| ↳ PostgreSQL                          | Baza danych                                   | 💪 Pełny SQL, 🔗 relacje, 📈 skalowalna              |
| ↳ Supabase Auth                       | Autentykacja (email/hasło, reset hasła)       | 🔒 Bezpieczna, 🚀 ready-to-use                       |
| ↳ Row Level Security                  | Automatyczna izolacja danych między users     | 🛡️ Security out-of-the-box                          |

### AI

| Technologia                                 | Rola                | Dlaczego?                                              |
| ------------------------------------------- | ------------------- | ------------------------------------------------------ |
| **[OpenRouter.ai](https://openrouter.ai/)** | Agregator modeli AI | 🤖 Wiele modeli, 💰 elastyczne ceny, 🔒 limity finansowe |

### Narzędzia deweloperskie

| Narzędzie           | Rola                   |
| ------------------  | ---------------------- |
| **Vitest**          | Testy jednostkowe      |
| **Playwright**      | Testy E2E              |
| **ESLint**          | Linting kodu           |
| **Prettier**        | Formatowanie kodu      |
| **Husky**           | Git hooks              |
| **GitHub Actions**  | CI/CD                  |
| **Cloudflare Pages**| Hosting                |

---

## 📁 Struktura projektu

### Przegląd katalogów

```
simple-calories/
│
├── .ai/                          # 📚 Dokumentacja produktu
│   ├── prd.md                    # Product Requirements Document
│   ├── tech-stack.md             # Opis stosu technologicznego
│   └── ui-specification.md       # Specyfikacja UI/UX
│
├── .cursor/rules/                # 📖 Reguły kodowania dla AI
│
├── src/
│   │
│   ├── pages/                    # 📄 Strony Astro i API endpoints
│   │   ├── index.astro           # → Dashboard (lista dni)
│   │   ├── settings.astro        # → Ustawienia
│   │   ├── day/[date].astro      # → Szczegóły dnia
│   │   │
│   │   └── api/v1/               # 🔌 REST API
│   │       ├── meals/            # Endpointy posiłków
│   │       ├── ai-generations/   # Endpointy AI
│   │       ├── daily-progress/   # Endpointy postępów
│   │       └── calorie-goals/    # Endpointy celów
│   │
│   ├── components/               # ⚛️ Komponenty React
│   │   ├── ui/                   # Shadcn/ui base components
│   │   ├── dashboard/            # 📊 Dashboard view
│   │   ├── day-details/          # 📅 Day details view
│   │   ├── add-meal/             # ➕ Add meal modal
│   │   ├── settings/             # ⚙️ Settings view
│   │   └── shared/               # 🔄 Shared components
│   │
│   ├── lib/
│   │   ├── services/             # 💼 Business logic layer
│   │   ├── validation/           # ✅ Zod schemas
│   │   ├── helpers/              # 🔧 Helper functions
│   │   └── constants/            # 📌 Constants
│   │
│   ├── db/                       # 🗄️ Database layer
│   │   ├── database.types.ts     # Typy z Supabase
│   │   └── supabase.client.ts    # Klient Supabase
│   │
│   ├── hooks/                    # 🎣 Custom React hooks
│   ├── layouts/                  # 🎨 Astro layouts
│   ├── middleware/               # 🛡️ Astro middleware
│   └── types/                    # 📐 TypeScript types
│
├── supabase/                     # 🗄️ Database setup
│   └── migrations/               # SQL migration files
│
├── e2e/                          # 🧪 Playwright E2E tests
├── public/                       # 📦 Static files
│
├── astro.config.mjs              # ⚙️ Astro config
├── tailwind.config.mjs           # 🎨 Tailwind config
├── tsconfig.json                 # 📘 TypeScript config
└── package.json                  # 📦 Dependencies
```

### Kluczowe pliki i ich rola

#### API Routes (`src/pages/api/v1/`)

```
api/v1/
├── meals/
│   ├── index.ts          # GET /meals, POST /meals
│   └── [id].ts           # GET/PATCH/DELETE /meals/:id
│
├── ai-generations/
│   ├── index.ts          # POST /ai-generations (generate)
│   └── [id].ts           # GET /ai-generations/:id
│
├── daily-progress/
│   ├── index.ts          # GET /daily-progress (list days)
│   └── [date].ts         # GET /daily-progress/:date
│
└── calorie-goals/
    ├── index.ts          # GET/POST /calorie-goals
    ├── current.ts        # GET /calorie-goals/current
    └── [id].ts           # PATCH/DELETE /calorie-goals/:id
```

**Uwaga:** API routes **NIE** zawierają logiki biznesowej - tylko routing i delegacja do serwisów.

#### Services (`src/lib/services/`)

```
services/
├── meals.service.ts              # CRUD posiłków
├── ai-generation.service.ts      # Generowanie AI
├── daily-progress.service.ts     # Postępy dzienne
├── calorie-goal.service.ts       # Cele kaloryczne
└── openrouter/                   # Integracja OpenRouter
    ├── openrouter.service.ts     # Główny serwis
    ├── adapter.ts                # Adapter
    └── schemas.ts                # Schematy odpowiedzi
```

**Rola:** Cała logika biznesowa, walidacja, orchestracja zapytań do bazy.

#### Validation (`src/lib/validation/`)

```
validation/
├── meal.schemas.ts               # Schematy Zod dla meals
├── ai-generation.schemas.ts      # Schematy Zod dla AI
└── daily-progress.schemas.ts     # Schematy Zod dla progress
```

**Rola:** Walidacja danych wejściowych za pomocą **Zod**.

#### Hooks (`src/hooks/`)

```
hooks/
├── useDashboard.ts               # Logika dashboard (infinite scroll)
├── useDayDetails.ts              # Logika widoku dnia
├── useAddMealForm.ts             # Logika formularza dodawania
└── useSettings.ts                # Logika ustawień
```

**Rola:** Zarządzanie stanem React, efekty, reużywalna logika.

---

## 💡 Kluczowe koncepcje

### 1. **Discriminated Unions (Zod)**

Używamy **discriminated unions** do walidacji danych, które mogą mieć różne struktury w zależności od jednego pola.

**Przykład: Tworzenie posiłku**

```typescript
// src/lib/validation/meal.schemas.ts

// Schema dla AI-generated meal
export const CreateAIMealSchema = z.object({
  description: z.string().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
  protein: z.number().min(0).optional(),
  // ...
  input_method: z.literal("ai"), // ← Discriminator
  ai_generation_id: z.string().uuid(), // ← WYMAGANE dla AI
  meal_timestamp: z.string().datetime(),
});

// Schema dla manual meal
export const CreateManualMealSchema = z.object({
  description: z.string().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
  // ...
  input_method: z.literal("manual"), // ← Discriminator
  // BRAK ai_generation_id
  meal_timestamp: z.string().datetime(),
});

// Discriminated union - automatycznie wybiera schema
export const CreateMealSchema = z.discriminatedUnion("input_method", [
  CreateAIMealSchema,
  CreateManualMealSchema,
]);
```

**Dlaczego?** TypeScript automatycznie zawęża typ w zależności od `input_method`.

### 2. **Service Pattern**

Każda domena ma własny serwis, który enkapsuluje logikę biznesową.

**Przykład: MealsService**

```typescript
// src/lib/services/meals.service.ts

export class MealsService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Tworzy nowy posiłek
   * 1. Waliduje AI generation (jeśli AI)
   * 2. Oblicza ostrzeżenia makroskładników
   * 3. Wstawia do bazy
   * 4. Aktualizuje ai_generations.meal_id
   */
  async createMeal(userId: string, mealData: CreateMealRequestDTO): Promise<CreateMealResult> {
    // Step 1: Validate AI generation
    if (mealData.input_method === "ai") {
      const validationResult = await this.validateAIGeneration(mealData.ai_generation_id, userId);
      if (!validationResult.valid) {
        return { success: false, error: validationResult.error, statusCode: 404 };
      }
    }

    // Step 2: Calculate macronutrient warnings
    const warnings = validateMacronutrients(mealData.calories, mealData.protein, mealData.carbs, mealData.fats);

    // Step 3: Insert meal
    const { data: meal, error } = await this.supabase.from("meals").insert({...}).select().single();

    // Step 4: Update ai_generations.meal_id
    if (mealData.input_method === "ai") {
      await this.supabase.from("ai_generations").update({ meal_id: meal.id }).eq("id", mealData.ai_generation_id);
    }

    return { success: true, data: { ...meal, warnings } };
  }
}
```

**Zalety:**

- ✅ Logika biznesowa oddzielona od API
- ✅ Reużywalność (można użyć w różnych endpoint'ach)
- ✅ Łatwe testowanie (mock Supabase client)

### 3. **Middleware dla autentykacji**

**Middleware** w Astro wykonuje się przed każdym requestem.

```typescript
// src/middleware/index.ts

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // 1. Utwórz Supabase client
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });
  locals.supabase = supabase; // ← Dostępne w API routes

  // 2. Skip auth check dla public paths
  if (PUBLIC_PATHS.includes(url.pathname)) {
    return next();
  }

  // 3. Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // User authenticated
    locals.user = { email: user.email, id: user.id }; // ← Dostępne w API routes
  } else {
    // Redirect to login
    return redirect("/auth/login");
  }

  return next();
});
```

**Kluczowe:** `locals.supabase` i `locals.user` są dostępne we wszystkich API routes.

### 4. **Custom Hooks dla zarządzania stanem**

Każdy widok ma dedykowany hook, który enkapsuluje logikę stanu.

**Przykład: useDashboard**

```typescript
// src/hooks/useDashboard.ts

export function useDashboard() {
  const [state, setState] = useState<DashboardState>({
    days: [],
    loading: true,
    error: null,
    hasMore: true,
    offset: 0,
  });

  const loadMoreDays = useCallback(async () => {
    // Fetch more days from API
    const newDays = await fetchDailyProgress(state.limit, state.offset);
    setState((prev) => ({
      ...prev,
      days: [...prev.days, ...newDays],
      offset: prev.offset + newDays.length,
      hasMore: newDays.length >= prev.limit,
    }));
  }, [state.offset]);

  // Load initial data on mount
  useEffect(() => {
    loadInitialDays();
  }, []);

  return { state, loadMoreDays, refetchAfterMealChange };
}
```

**Zalety:**

- ✅ Separacja logiki od UI
- ✅ Reużywalność
- ✅ Łatwe testowanie

### 5. **Infinite Scroll Pattern**

Używamy **Intersection Observer API** do infinite scroll.

```typescript
// src/components/shared/InfiniteScrollTrigger.tsx

export function InfiniteScrollTrigger({ onIntersect, hasMore, loading }) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onIntersect(); // Trigger load more
        }
      },
      { threshold: 1.0 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onIntersect]);

  return <div ref={observerRef} className="h-4" />;
}
```

**Użycie w Dashboard:**

```tsx
<InfiniteScrollTrigger onIntersect={loadMoreDays} hasMore={state.hasMore} loading={state.loading} />
```

### 6. **Row Level Security (RLS) w Supabase**

Każda tabela ma **RLS policies**, które automatycznie filtrują dane na poziomie bazy.

**Przykład policy:**

```sql
-- src/supabase/migrations/...consolidated_rls_setup.sql

CREATE POLICY "Users can view their own meals"
ON meals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
ON meals FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

**Efekt:** Użytkownik widzi **tylko swoje** posiłki, bez dodatkowej logiki w kodzie.

---

## 🔨 Jak dodać nową funkcjonalność

### Przykład 1: Dodawanie nowego pola do posiłku

Załóżmy, że chcemy dodać pole `fiber` (błonnik) do posiłków.

#### Krok 1: Aktualizacja migracji bazy danych

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_fiber_to_meals.sql

ALTER TABLE meals ADD COLUMN fiber NUMERIC(6,2) CHECK (fiber >= 0);
```

#### Krok 2: Aktualizacja typów Supabase

```bash
# Wygeneruj nowe typy z bazy
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/database.types.ts
```

#### Krok 3: Aktualizacja Zod schemas

```typescript
// src/lib/validation/meal.schemas.ts

export const CreateManualMealSchema = z.object({
  // ... existing fields
  fiber: z
    .number({
      invalid_type_error: "Fiber must be a number",
    })
    .min(0, "Fiber cannot be negative")
    .max(100, "Fiber cannot exceed 100")
    .nullable()
    .optional(),
});
```

#### Krok 4: Aktualizacja types

```typescript
// src/types.ts

export type MealResponseDTO = {
  // ... existing fields
  fiber: number | null;
};
```

#### Krok 5: Aktualizacja serwisu

```typescript
// src/lib/services/meals.service.ts

async createMeal(userId: string, mealData: CreateMealRequestDTO) {
  const { data: meal } = await this.supabase
    .from("meals")
    .insert({
      // ... existing fields
      fiber: mealData.fiber ?? null,
    })
    .select()
    .single();
}
```

#### Krok 6: Aktualizacja UI

```tsx
// src/components/add-meal/manual-mode/ManualMode.tsx

<div>
  <label>Błonnik (g)</label>
  <input type="number" name="fiber" />
</div>
```

### Przykład 2: Dodawanie nowego API endpoint'u

Załóżmy, że chcemy dodać endpoint do eksportu danych.

#### Krok 1: Utwórz API route

```typescript
// src/pages/api/v1/export/meals.ts

import type { APIRoute } from "astro";
import { requireAuth } from "@/lib/helpers/auth";
import { MealsService } from "@/lib/services/meals.service";

/**
 * GET /api/v1/export/meals
 * Exports all user meals as JSON
 */
export const GET: APIRoute = async ({ locals }) => {
  // Step 1: Authenticate
  const userIdOrResponse = requireAuth(locals);
  if (userIdOrResponse instanceof Response) {
    return userIdOrResponse;
  }
  const userId = userIdOrResponse;

  // Step 2: Fetch all meals
  const mealsService = new MealsService(locals.supabase);
  const meals = await mealsService.getMeals(userId, {
    limit: 10000,
    offset: 0,
    sort: "desc",
  });

  // Step 3: Return JSON
  return new Response(JSON.stringify(meals), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="meals-export.json"',
    },
  });
};
```

#### Krok 2: Dodaj button w UI

```tsx
// src/components/settings/Settings.tsx

<button
  onClick={async () => {
    const response = await fetch("/api/v1/export/meals");
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meals-export.json";
    a.click();
  }}
>
  Eksportuj dane
</button>
```

### Przykład 3: Dodawanie nowego komponentu React

Załóżmy, że chcemy dodać komponent **WeeklySummary**.

#### Krok 1: Utwórz komponent

```tsx
// src/components/dashboard/WeeklySummary.tsx

interface WeeklySummaryProps {
  weekStartDate: string;
}

export function WeeklySummary({ weekStartDate }: WeeklySummaryProps) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      const response = await fetch(`/api/v1/weekly-summary?start=${weekStartDate}`);
      const data = await response.json();
      setSummary(data);
    }
    fetchSummary();
  }, [weekStartDate]);

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="p-4 bg-card rounded-lg">
      <h3 className="text-lg font-semibold">Podsumowanie tygodnia</h3>
      <p>Średnie kalorie: {summary.avgCalories}</p>
    </div>
  );
}
```

#### Krok 2: Dodaj do strony Astro

```astro
---
// src/pages/index.astro
import Layout from "@/layouts/Layout.astro";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { WeeklySummary } from "@/components/dashboard/WeeklySummary";
---

<Layout title="Dashboard">
  <WeeklySummary weekStartDate="2025-01-20" client:load />
  <Dashboard client:load />
</Layout>
```

**Uwaga:** `client:load` oznacza, że komponent będzie hydratowany na kliencie.

---

## 🏛️ Konwencje kodowania

Projekt stosuje **ścisłe reguły** zdefiniowane w `.cursor/rules/`. Oto najważniejsze:

### 1. **Używaj `locals.supabase` zamiast importu**

❌ **Źle:**

```typescript
import { supabaseClient } from "@/db/supabase.client";

export const GET: APIRoute = async () => {
  const { data } = await supabaseClient.from("meals").select();
};
```

✅ **Dobrze:**

```typescript
export const GET: APIRoute = async ({ locals }) => {
  const { data } = await locals.supabase.from("meals").select();
};
```

**Dlaczego?** `locals.supabase` ma dostęp do cookies użytkownika (sesja).

### 2. **Importuj typy z `src/db/supabase.client.ts`**

❌ **Źle:**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

class MealsService {
  constructor(private supabase: SupabaseClient<Database>) {}
}
```

✅ **Dobrze:**

```typescript
import type { SupabaseClient } from "@/db/supabase.client";

class MealsService {
  constructor(private supabase: SupabaseClient) {}
}
```

### 3. **Obsługa błędów: Early returns**

❌ **Źle:**

```typescript
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    if (!body.prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
    }
    // ... dalsza logika
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
```

✅ **Dobrze:**

```typescript
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  // Early return dla walidacji
  if (!body.prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
  }

  try {
    // Logika biznesowa
  } catch (error) {
    return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
  }
};
```

### 4. **Walidacja: Zawsze używaj Zod**

✅ **Dobrze:**

```typescript
import { z } from "zod";

const CreateMealSchema = z.object({
  description: z.string().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  try {
    const validatedData = CreateMealSchema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "VALIDATION_ERROR",
          details: error.errors,
        }),
        { status: 400 }
      );
    }
  }
};
```

### 5. **TypeScript: Strict mode ON**

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
```

- ✅ Wszystkie zmienne muszą mieć zdefiniowany typ
- ✅ Unikaj `any` - użyj `unknown` jeśli typ jest nieznany
- ✅ Funkcje muszą mieć zdefiniowany typ zwracany

### 6. **Nazewnictwo plików**

- **Komponenty React:** `PascalCase.tsx` (np. `DayCard.tsx`)
- **Hooks:** `camelCase.ts` (np. `useDashboard.ts`)
- **Services:** `kebab-case.service.ts` (np. `meals.service.ts`)
- **Types:** `kebab-case.types.ts` (np. `dashboard.types.ts`)
- **Schemas:** `kebab-case.schemas.ts` (np. `meal.schemas.ts`)

### 7. **Dokumentacja kodu**

Używamy **JSDoc** dla funkcji i klas:

```typescript
/**
 * Creates a new meal entry
 *
 * Process:
 * 1. Validate AI generation if input_method is 'ai'
 * 2. Calculate macronutrient warnings
 * 3. Insert meal into database
 *
 * @param userId - User ID from authentication
 * @param mealData - Meal creation data (validated by Zod)
 * @returns Created meal with warnings
 */
async createMeal(userId: string, mealData: CreateMealRequestDTO): Promise<CreateMealResult> {
  // ...
}
```

---

## 🧪 Testowanie

### Rodzaje testów w projekcie

| Typ testu       | Narzędzie              | Cel                                   | Cel pokrycia |
| --------------- | ---------------------- | ------------------------------------- | ------------ |
| Unit            | Vitest                 | Funkcje pomocnicze, walidacja         | 80%+         |
| Integration     | Vitest + Testing Lib   | Komponenty React, hooki               | 70%+         |
| E2E             | Playwright             | User flows, critical paths            | Kluczowe     |

### Uruchamianie testów

```bash
# Testy jednostkowe i integracyjne
npm run test              # Run once
npm run test:watch        # Watch mode
npm run test:ui           # UI mode (Vitest UI)
npm run test:coverage     # Coverage report

# Testy E2E
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run test:e2e:debug    # Debug mode
```

### Przykład testu jednostkowego

```typescript
// src/lib/helpers/__tests__/macronutrient-validator.test.ts

import { describe, it, expect } from "vitest";
import { validateMacronutrients } from "../macronutrient-validator";

describe("validateMacronutrients", () => {
  it("should return no warnings when macros match calories within 5%", () => {
    // Protein: 25g * 4 = 100
    // Carbs: 50g * 4 = 200
    // Fats: 20g * 9 = 180
    // Total: 480 kcal
    const warnings = validateMacronutrients(500, 25, 50, 20);
    expect(warnings).toEqual([]);
  });

  it("should return warning when macros differ by more than 5%", () => {
    const warnings = validateMacronutrients(650, 25, 50, 20); // macros = 480, provided = 650
    expect(warnings).toHaveLength(1);
    expect(warnings[0].field).toBe("macronutrients");
  });
});
```

### Przykład testu komponentu React

```typescript
// src/components/ui/__tests__/button.test.tsx

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  it("should render with text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("should call onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);

    await userEvent.click(screen.getByText("Click me"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("should be disabled when disabled prop is true", () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDisabled();
  });
});
```

### Przykład testu E2E

```typescript
// e2e/add-meal.spec.ts

import { test, expect } from "@playwright/test";

test("User can add a meal using AI mode", async ({ page }) => {
  // 1. Login
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // 2. Open add meal modal
  await page.click('[aria-label="Dodaj posiłek"]');

  // 3. AI mode should be active by default
  await expect(page.locator("text=AI")).toHaveAttribute("data-active", "true");

  // 4. Enter meal description
  await page.fill('textarea[placeholder*="Opisz swój posiłek"]', "2 jajka sadzone z chlebem");

  // 5. Click generate
  await page.click('button:has-text("Generuj z AI")');

  // 6. Wait for AI result
  await expect(page.locator("text=420 kcal")).toBeVisible({ timeout: 10000 });

  // 7. Add meal
  await page.click('button:has-text("Dodaj posiłek")');

  // 8. Verify meal appears in list
  await expect(page.locator("text=2 jajka sadzone")).toBeVisible();
});
```

---

## 🐛 Debugging

### 1. **Debugging API endpoints**

Używaj `console.log` lub breakpointów w VS Code:

```typescript
// src/pages/api/v1/meals/index.ts

export const POST: APIRoute = async ({ request, locals }) => {
  const body = await request.json();

  console.log("📥 POST /api/v1/meals", body); // ← Debug log

  // ...
};
```

**Uruchom dev server z logami:**

```bash
npm run dev
```

### 2. **Debugging React komponentów**

Użyj **React DevTools** (rozszerzenie Chrome/Firefox):

- Inspekcja stanu komponentów
- Profiler dla wydajności
- Hooks debugger

**Dodatkowe logi:**

```typescript
useEffect(() => {
  console.log("🔄 Dashboard state:", state);
}, [state]);
```

### 3. **Debugging Supabase queries**

Włącz logi w Supabase client:

```typescript
// src/db/supabase.client.ts

export function createSupabaseServerInstance({ cookies, headers }) {
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    // ... existing config
    auth: {
      debug: true, // ← Enable auth debug logs
    },
  });
}
```

### 4. **Debugging bazodanowych problemów**

**Sprawdź logi w Supabase Dashboard:**

1. Otwórz [https://supabase.com](https://supabase.com)
2. Wybierz projekt
3. Idź do **Logs** → **Database**

**Testuj query bezpośrednio w SQL Editor:**

```sql
SELECT * FROM meals
WHERE user_id = 'your-user-id'
ORDER BY meal_timestamp DESC
LIMIT 10;
```

### 5. **Debugging TypeScript errors**

```bash
# Sprawdź błędy typów
npx tsc --noEmit

# Sprawdź konkretny plik
npx tsc --noEmit src/pages/api/v1/meals/index.ts
```

### 6. **Debugging buildu**

```bash
# Build z verbose logs
npm run build -- --verbose

# Preview build locally
npm run build && npm run preview
```

---

## 📚 Przydatne zasoby

### Dokumentacja technologii

- **Astro:** [https://docs.astro.build](https://docs.astro.build)
- **React:** [https://react.dev](https://react.dev)
- **TypeScript:** [https://www.typescriptlang.org/docs](https://www.typescriptlang.org/docs)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **Shadcn/ui:** [https://ui.shadcn.com](https://ui.shadcn.com)
- **Supabase:** [https://supabase.com/docs](https://supabase.com/docs)
- **Zod:** [https://zod.dev](https://zod.dev)
- **Vitest:** [https://vitest.dev](https://vitest.dev)
- **Playwright:** [https://playwright.dev](https://playwright.dev)

### Dokumentacja projektu

- **PRD:** `.ai/prd.md` - Product Requirements Document
- **Tech Stack:** `.ai/tech-stack.md` - Opis stosu technologicznego
- **UI Spec:** `.ai/ui-specification.md` - Specyfikacja UI/UX
- **README:** `README.md` - Ogólne info o projekcie
- **Testing Guide:** `TESTING.md` - Przewodnik po testowaniu

### Wzorce i przykłady

**Gdzie szukać przykładów kodu:**

- API endpoint: `src/pages/api/v1/meals/index.ts`
- Service: `src/lib/services/meals.service.ts`
- Zod schema: `src/lib/validation/meal.schemas.ts`
- React component: `src/components/dashboard/Dashboard.tsx`
- Hook: `src/hooks/useDashboard.ts`
- Test: `src/lib/helpers/__tests__/macronutrient-validator.test.ts`
- E2E test: `e2e/*.spec.ts`

### Reguły kodowania

Przeczytaj pliki w `.cursor/rules/` dla szczegółowych wzorców:

- `backend.mdc` - Wzorce backend (API, serwisy)
- `frontend.mdc` - Wzorce frontend (React, hooki)
- `astro.mdc` - Wzorce Astro
- `react.mdc` - Best practices React
- `shared.mdc` - Wspólne zasady (TS, formatowanie)

### Pomocne komendy

```bash
# Development
npm run dev                    # Start dev server

# Build
npm run build                  # Production build
npm run preview                # Preview production build

# Code quality
npm run lint                   # Check linting
npm run lint:fix               # Fix linting errors
npm run format                 # Format code with Prettier

# Testing
npm run test                   # Run unit tests
npm run test:e2e               # Run E2E tests
npm run test:coverage          # Coverage report

# Database
npx supabase db reset          # Reset local DB (requires Supabase CLI)
npx supabase gen types typescript  # Generate types from DB
```

### FAQ / Często spotykane problemy

#### Problem: "Module not found" po dodaniu nowego pliku

**Rozwiązanie:** Sprawdź, czy używasz aliasu `@/`:

```typescript
// ✅ Dobrze
import { MealsService } from "@/lib/services/meals.service";

// ❌ Źle
import { MealsService } from "../../../lib/services/meals.service";
```

#### Problem: "Type error" przy Supabase queries

**Rozwiązanie:** Wygeneruj typy ponownie:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/db/database.types.ts
```

#### Problem: RLS policy blokuje zapytanie

**Rozwiązanie:** Sprawdź w Supabase Dashboard → Authentication → Policies, czy policy jest poprawna.

#### Problem: Infinite loop w `useEffect`

**Rozwiązanie:** Sprawdź zależności w dependency array:

```typescript
// ❌ Źle - obiekt tworzy się za każdym razem
useEffect(() => {
  fetchData(filters);
}, [filters]); // filters to obiekt - zawsze nowy

// ✅ Dobrze - użyj useCallback lub poszczególnych wartości
useEffect(() => {
  fetchData(filters);
}, [filters.date, filters.limit]); // primitive values
```

---

## 🎓 Następne kroki

Po przeczytaniu tej instrukcji powinieneś:

1. ✅ Rozumieć architekturę projektu
2. ✅ Znać kluczowe koncepcje (Service Pattern, Zod, RLS)
3. ✅ Wiedzieć, jak dodać nową funkcjonalność
4. ✅ Przestrzegać konwencji kodowania
5. ✅ Umieć testować i debugować kod

**Co dalej?**

1. Przeczytaj dokumentację PRD (`.ai/prd.md`) - zrozumiesz wymagania biznesowe
2. Przejrzyj przykładowy kod w `src/pages/api/v1/meals/` - zobaczysz wzorce w praktyce
3. Uruchom aplikację lokalnie (`npm run dev`) - eksperymentuj
4. Dodaj swój pierwszy feature - najlepiej nauczysz się przez praktykę

**Potrzebujesz pomocy?**

- Zajrzyj do `README_EXT.md` dla głębszych szczegółów architektonicznych
- Przeczytaj reguły w `.cursor/rules/` dla konkretnych wzorców
- Sprawdź testy w `src/**/__tests__/` dla przykładów użycia

---

**Powodzenia w rozwoju Simple Calories! 🚀**
