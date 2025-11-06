# Szybkie Kalorie

Aplikacja internetowa (MVP) do uproszczonego liczenia kalorii i makroskładników z wykorzystaniem sztucznej inteligencji

## 📋 Spis treści

- [Problem biznesowy i cel aplikacji](#-problem-biznesowy-i-cel-aplikacji)
- [Założenia architektoniczne](#️-założenia-architektoniczne)
- [Stos technologiczny](#️-stos-technologiczny)
- [Struktura projektu](#-struktura-projektu)
- [Rozpoczęcie pracy](#-rozpoczęcie-pracy)
- [Testowanie aplikacji](#-testowanie-aplikacji)
- [Konwencje kodowania](#️-konwencje-kodowania)
- [Metryki sukcesu MVP](#-metryki-sukcesu-mvp)

## 🎯 Problem biznesowy i cel aplikacji

### Problem

Istniejące aplikacje do liczenia kalorii są **czasochłonne i skomplikowane**. Proces ręcznego wyszukiwania produktów, ważenia składników i wprowadzania szczegółowych danych zniechęca użytkowników do systematycznego monitorowania diety. Ta bariera sprawia, że wiele osób rezygnuje z kontrolowania swojego odżywiania, mimo chęci świadomego zarządzania dietą i masą ciała.

Typowy scenariusz w konkurencyjnych aplikacjach:

1. Otwórz aplikację
2. Wyszukaj "jajka" → wyświetla się 50+ wyników
3. Wybierz konkretny wariant
4. Wprowadź gramaturę
5. Powtórz dla "chleba" → kolejne 50+ wyników
6. **Czas: 3-5 minut na jeden posiłek**

### Rozwiązanie

**"Szybkie Kalorie"** eliminuje tę barierę poprzez wykorzystanie AI do automatycznego szacowania wartości odżywczych na podstawie prostego opisu tekstowego posiłku.

Nowy scenariusz:

1. Otwórz aplikację
2. Wpisz: "2 jajka sadzone z kromką chleba"
3. Kliknij "Generuj z AI"
4. AI zwraca: **420 kcal** + makroskładniki
5. Zatwierdź
6. **Czas: 10-15 sekund**

### Grupa docelowa

Osoby aktywne i świadome żywieniowo, które:

- ✅ Cenią sobie czas i prostotę
- ✅ Chcą kontrolować swoją dietę bez zbędnej złożoności
- ✅ Szukają narzędzia "wystarczająco dokładnego" zamiast perfekcyjnie precyzyjnego
- ✅ Preferują szybkość działania nad szczegółowe analizy

## 🏗️ Założenia architektoniczne

### Wzorzec architektoniczny

Aplikacja oparta jest na **architekturze warstwowej (layered architecture)** z wyraźnym podziałem odpowiedzialności:

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

### Kluczowe decyzje architektoniczne

#### 1. **Mobile First, Progressive Enhancement**

- Aplikacja projektowana najpierw dla urządzeń mobilnych
- Stopniowe dodawanie funkcjonalności dla większych ekranów
- RWD (Responsive Web Design) jako fundament

#### 2. **AI-First Interface**

```
Dodaj posiłek
┌────────────────────────┐
│ [AI] │ Ręcznie          │  ← AI jako domyślna zakładka
├────────────────────────┤
│ Opisz swój posiłek...  │
│                        │
└────────────────────────┘
```

- Tryb AI jako domyślny sposób dodawania posiłków
- Tryb manualny jako alternatywa (fallback)
- Użytkownik może przełączać się między trybami

#### 3. **Server-Side Rendering (SSR) z wyspami interaktywności**

- **Astro** renderuje strony po stronie serwera → szybsze ładowanie
- **React** używany selektywnie tylko dla komponentów interaktywnych
- Minimalna ilość JavaScript wysyłana do przeglądarki

Przykład:

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

#### 4. **Backend as a Service (BaaS)**

- **Supabase** zarządza:
  - Bazą danych PostgreSQL
  - Autentykacją użytkowników
  - Row Level Security (RLS) policies
- Minimalizacja własnego kodu backendowego
- Szybsze wdrożenie MVP

#### 5. **Statyczne typowanie end-to-end**

```typescript
// 1. Typy generowane z bazy danych
export type Database = {
  /* ... */
};

// 2. Typy w serwisach
class MealsService {
  constructor(private supabase: SupabaseClient) {}
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

#### 6. **Separation of Concerns**

- **API routes** (`src/pages/api/`) - tylko routing i delegacja do serwisów
- **Services** (`src/lib/services/`) - logika biznesowa, walidacja
- **Components** - tylko prezentacja i interakcja UI
- **Hooks** - reużywalna logika stanu i efektów

## 🛠️ Stos technologiczny

### Frontend

| Technologia                                       | Wersja | Rola                                                                    |
| ------------------------------------------------- | ------ | ----------------------------------------------------------------------- |
| **[Astro](https://astro.build/)**                 | 5.x    | Framework do budowy szybkich aplikacji webowych z minimalnym JavaScript |
| **[React](https://react.dev/)**                   | 19.x   | Biblioteka UI dla komponentów interaktywnych                            |
| **[TypeScript](https://www.typescriptlang.org/)** | 5.x    | Statyczne typowanie kodu i lepsze wsparcie IDE                          |
| **[Tailwind CSS](https://tailwindcss.com/)**      | 4.x    | Utility-first CSS framework dla wygodnego stylowania                    |
| **[Shadcn/ui](https://ui.shadcn.com/)**           | -      | Biblioteka dostępnych komponentów React (podstawa UI)                   |

**Dlaczego Astro?**

- ⚡ Renderowanie server-side → szybkie ładowanie
- 📦 Minimalna ilość JavaScript → lepsza wydajność
- 🏝️ Islands Architecture → React tylko tam gdzie potrzeba

**Dlaczego React 19?**

- 🎣 Hooks dla zarządzania stanem
- 🔄 Automatyczne batching updates
- 📊 Dojrzały ekosystem bibliotek

### Backend

| Technologia                           | Rola                                                 |
| ------------------------------------- | ---------------------------------------------------- |
| **[Supabase](https://supabase.com/)** | Kompleksowe rozwiązanie Backend-as-a-Service         |
| ↳ PostgreSQL                          | Baza danych z pełnym SQL                             |
| ↳ Supabase Auth                       | Autentykacja użytkowników (email/hasło, reset hasła) |
| ↳ Row Level Security                  | Automatyczna izolacja danych między użytkownikami    |
| ↳ SDK                                 | Klient JavaScript/TypeScript                         |

**Dlaczego Supabase?**

- ✅ Open-source (możliwość self-hostingu)
- ✅ Wbudowana autentykacja
- ✅ RLS policies = bezpieczeństwo out-of-the-box
- ✅ Automatycznie generowane typy TypeScript
- ✅ Darmowy tier wystarczający dla MVP

### AI

| Technologia                                 | Rola                |
| ------------------------------------------- | ------------------- |
| **[OpenRouter.ai](https://openrouter.ai/)** | Agregator modeli AI |

**Dlaczego OpenRouter?**

- 🤖 Dostęp do wielu modeli: OpenAI, Anthropic, Google, Meta
- 💰 Elastyczny wybór modelu według ceny i jakości
- 🔒 Limity finansowe na klucze API
- 📊 Unified API dla różnych providerów

**Przykładowe modele:**

- `openai/gpt-3.5-turbo` - tani, szybki
- `openai/gpt-4` - droższy, dokładniejszy
- `anthropic/claude-3-haiku` - dobry balans

### DevOps i Tooling

| Narzędzie               | Rola                       |
| ----------------------- | -------------------------- |
| **GitHub Actions**      | CI/CD pipelines            |
| **DigitalOcean**        | Hosting aplikacji (Docker) |
| **Prettier**            | Formatowanie kodu          |
| **TypeScript Compiler** | Sprawdzanie typów          |

## 📁 Struktura projektu

```
simple-calories/
│
├── .ai/                          # 📚 Dokumentacja produktu
│   ├── prd.md                    # Product Requirements Document
│   └── tech-stack.md             # Opis stosu technologicznego
│
├── .cursor/rules/                # 📖 Reguły kodowania dla AI
│   ├── frontend.mdc              # Wzorce frontend (React, hooks)
│   ├── backend.mdc               # Wzorce backend (API, serwisy)
│   ├── astro.mdc                 # Wzorce Astro
│   ├── react.mdc                 # Best practices React
│   └── shared.mdc                # Wspólne zasady (TS, formatowanie)
│
├── src/
│   │
│   ├── pages/                    # 📄 Strony Astro i API endpoints
│   │   ├── index.astro           # → Dashboard (lista dni)
│   │   ├── settings.astro        # → Ustawienia użytkownika
│   │   ├── day/
│   │   │   └── [date].astro      # → Szczegóły dnia (lista posiłków)
│   │   │
│   │   └── api/v1/               # 🔌 REST API
│   │       ├── meals/
│   │       │   ├── index.ts      # GET /meals, POST /meals
│   │       │   └── [id].ts       # GET/PATCH/DELETE /meals/:id
│   │       ├── ai-generations/
│   │       │   ├── index.ts      # POST /ai-generations (generuj AI)
│   │       │   └── [id].ts       # GET /ai-generations/:id
│   │       ├── daily-progress/
│   │       │   ├── index.ts      # GET /daily-progress (lista dni)
│   │       │   └── [date].ts     # GET /daily-progress/:date
│   │       └── calorie-goals/
│   │           ├── index.ts      # GET/POST /calorie-goals
│   │           ├── current.ts    # GET /calorie-goals/current
│   │           └── [id].ts       # PATCH/DELETE /calorie-goals/:id
│   │
│   ├── components/               # ⚛️ Komponenty React
│   │   │
│   │   ├── ui/                   # Komponenty bazowe (Shadcn/ui)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── alert.tsx
│   │   │   └── ...
│   │   │
│   │   ├── dashboard/            # 📊 Dashboard (ekran główny)
│   │   │   ├── Dashboard.tsx     # Główny kontener
│   │   │   ├── DayCard.tsx       # Karta dnia (data + kalorie)
│   │   │   ├── FAB.tsx           # Floating Action Button
│   │   │   └── ...
│   │   │
│   │   ├── day-details/          # 📅 Widok dnia
│   │   │   ├── DayDetails.tsx    # Kontener szczegółów
│   │   │   ├── MealCard.tsx      # Karta posiłku
│   │   │   └── ...
│   │   │
│   │   ├── add-meal/             # ➕ Modal dodawania posiłku
│   │   │   ├── MealModal.tsx     # Dialog główny
│   │   │   ├── MealForm.tsx      # Formularz
│   │   │   ├── ai-mode/          # Tryb AI
│   │   │   │   ├── AIMode.tsx
│   │   │   │   └── AIResult.tsx
│   │   │   ├── manual-mode/      # Tryb manualny
│   │   │   │   ├── ManualMode.tsx
│   │   │   │   └── MacroInputs.tsx
│   │   │   └── common-fields/    # Wspólne pola
│   │   │       ├── CategorySelector.tsx
│   │   │       └── CommonFields.tsx
│   │   │
│   │   ├── settings/             # ⚙️ Ustawienia
│   │   │   ├── Settings.tsx
│   │   │   ├── EditCalorieGoalDialog.tsx
│   │   │   └── ...
│   │   │
│   │   └── shared/               # 🔄 Komponenty współdzielone
│   │       ├── CalorieProgressBar.tsx
│   │       └── InfiniteScrollTrigger.tsx
│   │
│   ├── lib/
│   │   │
│   │   ├── services/             # 💼 Warstwa logiki biznesowej
│   │   │   ├── meals.service.ts              # CRUD posiłków
│   │   │   ├── ai-generation.service.ts      # Generowanie AI
│   │   │   ├── daily-progress.service.ts     # Postępy dzienne
│   │   │   ├── calorie-goal.service.ts       # Cele kaloryczne
│   │   │   ├── rate-limit.service.ts         # Rate limiting
│   │   │   └── openrouter/                   # Integracja OpenRouter
│   │   │       ├── openrouter.service.ts     # Główny serwis
│   │   │       ├── adapter.ts                # Adapter kompatybilny z mock
│   │   │       ├── config.ts                 # Konfiguracja
│   │   │       ├── errors.ts                 # Obsługa błędów
│   │   │       └── schemas.ts                # Schematy odpowiedzi
│   │   │
│   │   ├── validation/           # ✅ Schematy walidacji (Zod)
│   │   │   ├── meal.schemas.ts
│   │   │   ├── ai-generation.schemas.ts
│   │   │   └── daily-progress.schemas.ts
│   │   │
│   │   ├── helpers/              # 🔧 Funkcje pomocnicze
│   │   │   ├── macronutrient-validator.ts
│   │   │   ├── date-formatter.ts
│   │   │   ├── error-logger.ts
│   │   │   └── ...
│   │   │
│   │   └── constants/            # 📌 Stałe aplikacji
│   │       └── meal-form.constants.ts
│   │
│   ├── db/                       # 🗄️ Warstwa dostępu do danych
│   │   ├── database.types.ts     # Typy generowane z Supabase
│   │   └── supabase.client.ts    # Klient Supabase + typy
│   │
│   ├── hooks/                    # 🎣 Custom React hooks
│   │   ├── useAddMealForm.ts     # Logika formularza dodawania
│   │   ├── useDashboard.ts       # Logika dashboardu
│   │   ├── useDayDetails.ts      # Logika widoku dnia
│   │   ├── useSettings.ts        # Logika ustawień
│   │   └── ...
│   │
│   ├── layouts/                  # 🎨 Layout'y Astro
│   │   └── Layout.astro          # Główny layout
│   │
│   ├── middleware/               # 🛡️ Middleware Astro
│   │   └── index.ts              # Konfiguracja Supabase w context
│   │
│   ├── types/                    # 📐 Definicje typów TypeScript
│   │   ├── types.ts              # Główne typy aplikacji
│   │   ├── add-meal.types.ts
│   │   ├── dashboard.types.ts
│   │   └── ...
│   │
│   └── env.d.ts                  # Definicje zmiennych środowiskowych
│
├── public/                       # 📦 Pliki statyczne (obrazy, fonty)
├── astro.config.mjs              # ⚙️ Konfiguracja Astro
├── tailwind.config.mjs           # 🎨 Konfiguracja Tailwind
├── tsconfig.json                 # 📘 Konfiguracja TypeScript
└── package.json                  # 📦 Zależności i skrypty
```

### Przepływ danych - Przykład: Dodawanie posiłku przez AI

```
1. USER                          2. COMPONENT                  3. API                          4. SERVICE                      5. DATABASE
┌──────────┐                     ┌──────────────┐             ┌────────────────┐             ┌────────────────────┐         ┌────────────┐
│          │                     │              │             │                │             │                    │         │            │
│  Wpisuje │ ─────────────────> │  AIMode.tsx  │             │                │             │                    │         │            │
│  "2 jajka│                     │              │             │                │             │                    │         │            │
│  z chlebem"                    │   [Generuj]  │             │                │             │                    │         │            │
│          │                     │              │             │                │             │                    │         │            │
└──────────┘                     └──────┬───────┘             └────────────────┘             └────────────────────┘         └────────────┘
                                        │
                                        │ fetch('/api/v1/ai-generations', {
                                        │   method: 'POST',
                                        │   body: { prompt: "2 jajka z chlebem" }
                                        │ })
                                        │
                                        ↓
                                ┌───────────────────┐
                                │ POST /api/v1/     │
                                │ ai-generations    │ ─────────────────────────────────────────────> AIGenerationService
                                │                   │                                                 .createAIGeneration()
                                │ 1. Walidacja Zod  │                                                       │
                                │ 2. Rate limit     │                                                       │
                                │ 3. Wywołanie      │                                                       ↓
                                │    serwisu        │                                              ┌──────────────────────┐
                                └───────────────────┘                                              │ 1. Insert pending    │
                                        ↑                                                          │    record            │
                                        │                                                          │                      │
                                        │ 201 Created                                              │ 2. Call OpenRouter   │
                                        │ { calories: 420, ... }                                   │    API               │
                                        │                                                          │                      │
                                        └──────────────────────────────────────────────────────────│ 3. Update record     │
                                                                                                   │    with results      │
                                                                                                   └──────────┬───────────┘
                                                                                                              │
                                                                                                              ↓
                                                                                                   ┌──────────────────────┐
                                                                                                   │ ai_generations table │
                                                                                                   │                      │
                                                                                                   │ id: uuid             │
                                                                                                   │ prompt: "2 jajka..." │
                                                                                                   │ calories: 420        │
                                                                                                   │ protein: 18.5        │
                                                                                                   │ ...                  │
                                                                                                   └──────────────────────┘
```

## 🚀 Rozpoczęcie pracy

### Wymagania wstępne

- **Node.js** 18+ (zalecane: użyj `.nvmrc` z projektu)
- **npm** (instalowany wraz z Node.js)
- **Konto Supabase** (darmowy tier wystarczy dla MVP)
- **Klucz API OpenRouter** (opcjonalnie dla funkcji AI)

### Instalacja

#### 1. Klonowanie repozytorium

```bash
git clone <repository-url>
cd simple-calories
```

#### 2. Użycie odpowiedniej wersji Node.js

```bash
nvm use  # Użyje wersji z pliku .nvmrc
```

#### 3. Instalacja zależności

```bash
npm install
```

#### 4. Konfiguracja zmiennych środowiskowych

Utwórz plik `.env` w katalogu głównym projektu:

```env
# ========================================
# Supabase Configuration
# ========================================
# Znajdź w: Supabase Dashboard → Project Settings → API

SUPABASE_URL=https://twojprojekt.supabase.co
SUPABASE_KEY=twoj_supabase_anon_key

# ========================================
# OpenRouter AI Configuration
# ========================================
# Znajdź w: https://openrouter.ai/keys

OPENROUTER_API_KEY=sk-or-v1-xxx...
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_TIMEOUT=30000

# ========================================
# Development (MVP bez autentykacji)
# ========================================
# UUID testowego użytkownika z tabeli profiles
DEFAULT_USER_ID=00000000-0000-0000-0000-000000000000
```

#### 5. Konfiguracja bazy danych Supabase

**Opcja A: Ręczna konfiguracja**

Utwórz następujące tabele w Supabase SQL Editor:

```sql
-- Tabela profili użytkowników
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela celów kalorycznych
CREATE TABLE calorie_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL CHECK (daily_goal > 0),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, effective_from)
);

-- Tabela generacji AI
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  generated_calories INTEGER,
  generated_protein NUMERIC(6,2),
  generated_carbs NUMERIC(6,2),
  generated_fats NUMERIC(6,2),
  assumptions TEXT,
  error_message TEXT,
  model_used TEXT,
  generation_duration INTEGER,
  meal_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela posiłków
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0),
  protein NUMERIC(6,2),
  carbs NUMERIC(6,2),
  fats NUMERIC(6,2),
  category TEXT CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack', 'other')),
  input_method TEXT NOT NULL CHECK (input_method IN ('manual', 'ai', 'ai-edited')),
  meal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- Przykładowe policies (dostosuj do swoich potrzeb)
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own meals" ON meals
  FOR ALL USING (auth.uid() = user_id);
```

**Opcja B: Supabase CLI** (w przygotowaniu)

#### 6. Utworzenie testowego użytkownika

Dla MVP bez autentykacji, utwórz testowego użytkownika:

```sql
INSERT INTO profiles (id, email)
VALUES ('00000000-0000-0000-0000-000000000000', 'test@example.com');

INSERT INTO calorie_goals (user_id, daily_goal, effective_from)
VALUES ('00000000-0000-0000-0000-000000000000', 2000, CURRENT_DATE);
```

Skopiuj UUID do `.env` jako `DEFAULT_USER_ID`.

#### 7. Uruchomienie aplikacji

```bash
npm run dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

### Dostępne skrypty NPM

| Skrypt            | Opis                                              |
| ----------------- | ------------------------------------------------- |
| `npm run dev`     | Uruchomienie serwera deweloperskiego z hot reload |
| `npm run build`   | Zbudowanie aplikacji produkcyjnej                 |
| `npm run preview` | Podgląd zbudowanej aplikacji lokalnie             |
| `npm run astro`   | Uruchomienie CLI Astro                            |

## 🧪 Testowanie aplikacji

### 1. Sprawdzenie stylu kodu

#### Weryfikacja formatowania Prettier

```bash
npx prettier --check "src/**/*.{ts,tsx,astro}"
```

#### Automatyczne formatowanie

```bash
npx prettier --write "src/**/*.{ts,tsx,astro}"
```

### 2. Sprawdzenie typów TypeScript

```bash
npx tsc --noEmit
```

Sprawdza poprawność typów bez generowania plików wyjściowych.

### 3. Build test

```bash
npm run build
```

Kompilacja aplikacji do wersji produkcyjnej. Jeśli build przechodzi bez błędów, aplikacja jest gotowa do wdrożenia.

### 4. Testowanie manualne - Scenariusze E2E

#### Scenariusz 1: Dashboard i nawigacja

1. Otwórz `http://localhost:3000`
2. ✅ Sprawdź czy wyświetla się lista dni
3. ✅ Sprawdź czy każdy dzień pokazuje: datę, kalorie/cel, wskaźnik koloru
4. ✅ Kliknij na dzień → powinieneś zobaczyć listę posiłków

#### Scenariusz 2: Dodawanie posiłku przez AI

1. Kliknij FAB (przycisk "+" w prawym dolnym rogu) LUB przycisk "Dodaj posiłek"
2. Modal powinien się otworzyć w trybie **AI** (domyślnie)
3. ✅ Wpisz opis: `"200g kurczaka z grilla z ryżem"`
4. ✅ Kliknij "Generuj z AI"
5. ✅ Sprawdź czy AI zwróciło:
   - Kalorie (np. 650 kcal)
   - Makroskładniki (białko, węglowodany, tłuszcze)
   - Założenia (np. "Założono 200g piersi z kurczaka...")
6. ✅ Opcjonalnie wybierz kategorię: "Obiad"
7. ✅ Kliknij "Dodaj posiłek"
8. ✅ Sprawdź czy posiłek pojawił się na liście

#### Scenariusz 3: AI - Niejednoznaczny opis

1. Otwórz modal dodawania posiłku
2. ✅ Wpisz zbyt ogólny opis: `"obiad"`
3. ✅ Kliknij "Generuj z AI"
4. ✅ AI powinno zwrócić błąd z prośbą o doprecyzowanie
5. ✅ Sprawdź dostępność przycisków:
   - "Generuj ponownie" (powinien być nieaktywny do czasu zmiany tekstu)
   - "Wprowadzę dane ręcznie" (przełącza na tryb manualny)

#### Scenariusz 4: Dodawanie posiłku manualnie

1. Otwórz modal dodawania posiłku
2. ✅ Przełącz się na zakładkę **"Ręcznie"**
3. ✅ Wprowadź dane:
   - Opis: "Domowa pizza"
   - Kalorie: 850
   - Białko: 35 (opcjonalnie)
   - Węglowodany: 95 (opcjonalnie)
   - Tłuszcze: 35 (opcjonalnie)
4. ✅ Jeśli suma kalorii z makroskładników różni się o >5%, sprawdź czy pojawia się **ostrzeżenie**
   - Przykład: 35×4 + 95×4 + 35×9 = 835 kcal (różni się od 850)
   - Powinno wyświetlić: _"Kalorie z makroskładników (835) różnią się od podanych (850)"_
5. ✅ Zapisz posiłek (mimo ostrzeżenia)

#### Scenariusz 5: Edycja posiłku

1. W widoku dnia kliknij na wcześniej dodany posiłek
2. ✅ Modal edycji powinien się otworzyć z wypełnionymi danymi
3. ✅ Zmień opis: "Domowa pizza (mała)"
4. ✅ Zmień kalorie: 650
5. ✅ Kliknij "Zapisz zmiany"
6. ✅ Sprawdź czy zmiany są widoczne na liście posiłków
7. ✅ Sprawdź czy suma dnia została zaktualizowana

#### Scenariusz 6: Usuwanie posiłku

1. W widoku dnia znajdź ikonę **kosza** przy posiłku
2. ✅ Kliknij ikonę
3. ✅ Powinno pojawić się okno potwierdzenia
4. ✅ Kliknij "Usuń"
5. ✅ Sprawdź czy posiłek zniknął z listy
6. ✅ Sprawdź czy suma dnia została zaktualizowana

#### Scenariusz 7: Zarządzanie celem kalorycznym

1. Przejdź do `/settings`
2. ✅ Sprawdź czy wyświetla się aktualny cel (np. 2000 kcal)
3. ✅ Kliknij "Edytuj cel"
4. ✅ Wprowadź nową wartość: 2200
5. ✅ Zapisz zmiany
6. ✅ Wróć na dashboard
7. ✅ Sprawdź czy nowy cel (2200) jest widoczny przy dzisiejszym dniu

#### Scenariusz 8: Wskaźniki kolorów na dashboardzie

Dodaj posiłki do testowania statusów:

**Test 1: Poniżej celu (kolor szary)**

- Cel: 2000 kcal
- Dodaj: 1500 kcal
- ✅ Karta dnia powinna być **szara**

**Test 2: W ramach celu (kolor zielony)**

- Cel: 2000 kcal
- Dodaj: 2050 kcal (w zakresie ±100 kcal)
- ✅ Karta dnia powinna być **zielona**

**Test 3: Powyżej celu (kolor pomarańczowy)**

- Cel: 2000 kcal
- Dodaj: 2300 kcal (>100 kcal powyżej)
- ✅ Karta dnia powinna być **pomarańczowa**

### 5. Testowanie responsywności (RWD)

Otwórz DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M)

#### Mobilne (375px - iPhone SE)

- ✅ Wszystkie elementy są czytelne
- ✅ FAB jest widoczny i kliknięty
- ✅ Modal zajmuje pełną szerokość ekranu
- ✅ Tekst nie wychodzi poza ekran

#### Tablet (768px - iPad)

- ✅ Layout dostosowuje się do szerokości
- ✅ Karty dni mogą być wyświetlane w 2 kolumnach (opcjonalnie)

#### Desktop (1280px+)

- ✅ Zawartość nie przekracza max-width
- ✅ Wszystkie interakcje działają

## 🏛️ Konwencje kodowania

Projekt stosuje **ścisłe reguły kodowania** zdefiniowane w katalogu `.cursor/rules/`:

| Plik           | Zakres                                                   |
| -------------- | -------------------------------------------------------- |
| `backend.mdc`  | Wzorce dla API endpoints, serwisów, walidacji Zod        |
| `frontend.mdc` | Struktura komponentów React, hooks, zarządzanie stanem   |
| `astro.mdc`    | Wzorce dla stron i layoutów Astro                        |
| `react.mdc`    | Best practices dla komponentów React                     |
| `shared.mdc`   | Wspólne zasady: TypeScript, formatowanie, obsługa błędów |

### Kluczowe zasady

#### 1. Backend: Używaj `locals.supabase` zamiast importu

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

#### 2. Typy: Importuj z `src/db/supabase.client.ts`

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

#### 3. Obsługa błędów: Early returns

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

#### 4. Walidacja: Zawsze używaj Zod

✅ **Dobrze:**

```typescript
import { z } from "zod";

const CreateMealSchema = z.object({
  description: z.string().min(1).max(500),
  calories: z.number().int().min(1).max(10000),
  protein: z.number().min(0).max(1000).optional(),
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

#### 5. TypeScript: Strict mode ON

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

## 📊 Metryki sukcesu MVP

MVP zostanie uznane za sukces, jeśli osiągnie następujące cele:

### 1. Metryka Zaufania do AI (cel: **75%**)

```
(Liczba podsumowań AI zaakceptowanych bez edycji)
─────────────────────────────────────────────────── ≥ 75%
(Liczba wszystkich podsumowań wygenerowanych przez AI)
```

**Co to oznacza?**

- Jeśli AI wygeneruje 100 oszacowań kalorii
- Co najmniej 75 z nich powinno być zaakceptowanych BEZ ręcznych poprawek
- To pokazuje, że użytkownicy **ufają** dokładności AI

**Jak mierzymy?**

```sql
SELECT
  COUNT(CASE WHEN ai.id NOT IN (
    SELECT ai_generation_id FROM meals WHERE input_method = 'ai-edited'
  ) THEN 1 END) * 100.0 / COUNT(*) as trust_percentage
FROM ai_generations ai
WHERE ai.status = 'completed';
```

### 2. Metryka Użyteczności AI (cel: **75%**)

```
(Liczba wpisów zainicjowanych przez AI)
───────────────────────────────────────── ≥ 75%
(Liczba wszystkich wpisów - AI + manualne)
```

**Co to oznacza?**

- Jeśli użytkownicy dodadzą 100 posiłków
- Co najmniej 75 powinno być zainicjowanych przez tryb AI
- To pokazuje, że AI-first interface jest **preferowany** nad manualny

**Jak mierzymy?**

```sql
SELECT
  COUNT(CASE WHEN input_method IN ('ai', 'ai-edited') THEN 1 END) * 100.0
  / COUNT(*) as ai_usage_percentage
FROM meals;
```

### Dlaczego te metryki są kluczowe?

Te metryki weryfikują **główną hipotezę biznesową**:

> **AI-first interface znacząco obniża barierę wejścia do liczenia kalorii**

Jeśli metryki **nie** zostaną osiągnięte:

- < 75% zaufania → AI nie jest wystarczająco dokładne
- < 75% użycia → Użytkownicy nadal preferują tryb manualny
- **Wniosek:** Hipoteza biznesowa jest fałszywa, trzeba zmienić strategię

## 🔐 Bezpieczeństwo

### Row Level Security (RLS)

Każda tabela w Supabase ma włączony RLS, który zapewnia:

- ✅ Użytkownik widzi **tylko swoje** dane
- ✅ Nie może odczytać ani zmodyfikować danych innych użytkowników
- ✅ Automatyczna weryfikacja na poziomie bazy danych

Przykład policy:

```sql
CREATE POLICY "Users can only view their own meals"
ON meals FOR SELECT
USING (auth.uid() = user_id);
```

### Rate Limiting

- Endpoint `/api/v1/ai-generations` ma limit: **10 requestów/minutę** na użytkownika
- Implementacja in-memory (sliding window)
- Zwraca `429 Too Many Requests` przy przekroczeniu

### Walidacja danych

- ✅ Wszystkie endpointy API używają walidacji **Zod**
- ✅ Walidacja typów na poziomie TypeScript (compile-time)
- ✅ Walidacja constraints w bazie danych (runtime)

### Secrets management

- ✅ Wszystkie klucze API w zmiennych środowiskowych (`.env`)
- ✅ `.env` dodany do `.gitignore`
- ✅ Brak hardcoded secrets w kodzie

## 📝 Licencja

Projekt prywatny - wszystkie prawa zastrzeżone.

## 👥 Kontakt

Projekt stworzony dla nauki i celów portfolio.

---

**Status projektu:** 🚧 MVP w fazie development
**Ostatnia aktualizacja:** 2025-01-27
