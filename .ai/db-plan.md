# Database Schema - Szybkie Kalorie MVP

## 1. Tables with Columns, Data Types, and Constraints

### 1.0. users

This table is managed by Supabase Auth.

- id: UUID Primary Key
- email: VARCHAR(255) NOT NULL UNIQUE
- encrypted_passord: VARCHAR NOT NULL
- created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
- confirmed_at TIMESTAMPTZ

### 1.1. profiles

Tabela profili użytkowników - most między autentykacją Supabase a logiką aplikacji.

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Columns:**

- `id` - UUID, PRIMARY KEY, FOREIGN KEY → auth.users(id) ON DELETE CASCADE
- `created_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()
- `updated_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Constraints:**

- PRIMARY KEY na `id`
- FOREIGN KEY do `auth.users(id)` z CASCADE DELETE
- NOT NULL na wszystkich kolumnach

---

### 1.2. calorie_goals

Tabela historii celów kalorycznych użytkownika.

```sql
CREATE TABLE calorie_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL CHECK (daily_goal > 0 AND daily_goal <= 10000),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_effective_date UNIQUE(user_id, effective_from)
);
```

**Columns:**

- `id` - UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- `user_id` - UUID, NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE
- `daily_goal` - INTEGER, NOT NULL, CHECK (0 < daily_goal <= 10000)
- `effective_from` - DATE, NOT NULL (zawsze CURRENT_DATE + 1 przy tworzeniu)
- `created_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()
- `updated_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Constraints:**

- PRIMARY KEY na `id`
- FOREIGN KEY do `profiles(id)` z CASCADE DELETE
- UNIQUE constraint na `(user_id, effective_from)`
- CHECK constraint: `daily_goal > 0 AND daily_goal <= 10000`
- NOT NULL na wszystkich kolumnach

**Business Logic:**

- `effective_from` zawsze ustawiany przez aplikację na CURRENT_DATE + 1
- Wielokrotne zmiany w tym samym dniu: `ON CONFLICT (user_id, effective_from) DO UPDATE`

---

### 1.3. meals

Tabela posiłków użytkownika.

```sql
-- ENUM types
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');
CREATE TYPE input_method_type AS ENUM ('ai', 'manual', 'ai-edited');

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0 AND calories <= 10000),
  protein DECIMAL(6,2) CHECK (protein >= 0 AND protein <= 1000),
  carbs DECIMAL(6,2) CHECK (carbs >= 0 AND carbs <= 1000),
  fats DECIMAL(6,2) CHECK (fats >= 0 AND fats <= 1000),
  category meal_category,
  input_method input_method_type NOT NULL,
  meal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Columns:**

- `id` - UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- `user_id` - UUID, NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE
- `description` - VARCHAR(500), NOT NULL (finalna nazwa/opis posiłku, może być edytowana)
- `calories` - INTEGER, NOT NULL, CHECK (0 < calories <= 10000)
- `protein` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `carbs` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `fats` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `category` - meal_category ENUM, NULLABLE ('breakfast', 'lunch', 'dinner', 'snack', 'other')
- `input_method` - input_method_type ENUM, NOT NULL ('ai', 'manual', 'ai-edited')
- `meal_timestamp` - TIMESTAMPTZ, NOT NULL
- `created_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()
- `updated_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Constraints:**

- PRIMARY KEY na `id`
- FOREIGN KEY do `profiles(id)` z CASCADE DELETE
- CHECK constraint: `calories > 0 AND calories <= 10000`
- CHECK constraints na makroskładnikach: `>= 0 AND <= 1000`
- NOT NULL na: id, user_id, description, calories, input_method, meal_timestamp, created_at, updated_at

**Business Logic:**

- Aplikacja waliduje: NIE pozwalać na meal_timestamp w przyszłości
- Hard delete (brak soft delete)
- `input_method = 'ai'` - zaakceptowane bez edycji
- `input_method = 'ai-edited'` - użytkownik zmodyfikował propozycję AI
- `input_method = 'manual'` - ręczne wprowadzenie
- **ZMIANA:** ai_assumptions i ai_generation_duration przeniesione do tabeli ai_generations

---

### 1.4. ai_generations

Tabela historii generowań AI dla posiłków użytkownika.

```sql
-- ENUM type for AI generation status
CREATE TYPE ai_generation_status AS ENUM ('pending', 'completed', 'failed');

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Input data
  prompt TEXT NOT NULL,

  -- AI-generated values
  generated_calories INTEGER CHECK (generated_calories > 0 AND generated_calories <= 10000),
  generated_protein DECIMAL(6,2) CHECK (generated_protein >= 0 AND generated_protein <= 1000),
  generated_carbs DECIMAL(6,2) CHECK (generated_carbs >= 0 AND generated_carbs <= 1000),
  generated_fats DECIMAL(6,2) CHECK (generated_fats >= 0 AND generated_fats <= 1000),
  assumptions TEXT,

  -- Generation metadata
  model_used VARCHAR(100),
  generation_duration INTEGER,
  status ai_generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Columns:**

- `id` - UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- `meal_id` - UUID, NULLABLE, FOREIGN KEY → meals(id) ON DELETE CASCADE (NULL until user accepts)
- `user_id` - UUID, NOT NULL, FOREIGN KEY → profiles(id) ON DELETE CASCADE
- `prompt` - TEXT, NOT NULL (oryginalny opis od użytkownika)
- `generated_calories` - INTEGER, NULLABLE, CHECK (0 < generated_calories <= 10000)
- `generated_protein` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `generated_carbs` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `generated_fats` - DECIMAL(6,2), NULLABLE, CHECK (>= 0 AND <= 1000)
- `assumptions` - TEXT, NULLABLE (założenia AI, np. "duża miska = 450ml")
- `model_used` - VARCHAR(100), NULLABLE (np. 'gpt-4', 'claude-3-sonnet')
- `generation_duration` - INTEGER, NULLABLE (czas w ms)
- `status` - ai_generation_status ENUM, NOT NULL, DEFAULT 'pending' ('pending', 'completed', 'failed')
- `error_message` - TEXT, NULLABLE (jeśli status = 'failed')
- `created_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Constraints:**

- PRIMARY KEY na `id`
- FOREIGN KEY do `meals(id)` z CASCADE DELETE (nullable)
- FOREIGN KEY do `profiles(id)` z CASCADE DELETE
- CHECK constraints na generated values (takie same jak w meals)
- NOT NULL na: id, user_id, prompt, status, created_at

**Business Logic:**

- Wpis tworzony **od razu po wywołaniu AI** (przed akceptacją użytkownika)
- `meal_id = NULL` początkowo, UPDATE po akceptacji przez użytkownika
- `status = 'pending'` podczas generowania, 'completed' po sukcesie, 'failed' po błędzie
- Historia pełna - wszystkie wywołania AI są zapisywane
- Przy wyświetlaniu: pobierz najnowszy wpis dla meal_id (`ORDER BY created_at DESC LIMIT 1`)

---

### 1.5. error_logs

Tabela logów błędów aplikacji i AI.

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

**Columns:**

- `id` - UUID, PRIMARY KEY, DEFAULT gen_random_uuid()
- `user_id` - UUID, NULLABLE, FOREIGN KEY → profiles(id) ON DELETE SET NULL
- `error_type` - VARCHAR(100), NOT NULL (np. 'ai_analysis_failed', 'validation_error')
- `error_message` - TEXT, NOT NULL
- `error_details` - JSONB, NULLABLE (stack trace, request payload)
- `context` - JSONB, NULLABLE (dodatkowe dane kontekstowe)
- `created_at` - TIMESTAMPTZ, NOT NULL, DEFAULT NOW()

**Constraints:**

- PRIMARY KEY na `id`
- FOREIGN KEY do `profiles(id)` z SET NULL (zachowanie logów po usunięciu użytkownika)
- NOT NULL na: id, error_type, error_message, created_at

**Business Logic:**

- Automatyczne czyszczenie logów starszych niż 90 dni (PostgreSQL cron)
- Dostęp tylko dla adminów (brak RLS policies dla użytkowników)

---

## 2. Relationships Between Tables

### Entity Relationship Diagram

```
auth.users (Supabase built-in)
    │
    │ 1:1 (ON DELETE CASCADE)
    ↓
profiles
    │
    ├─── 1:N (ON DELETE CASCADE) ──→ meals
    │                                   │
    │                                   │ 1:N (ON DELETE CASCADE)
    │                                   ↓
    │                              ai_generations (meal_id nullable)
    │
    ├─── 1:N (ON DELETE CASCADE) ──→ ai_generations (user_id)
    │
    ├─── 1:N (ON DELETE CASCADE) ──→ calorie_goals
    │
    └─── 1:N (ON DELETE SET NULL) ──→ error_logs
```

### Detailed Relationships

1. **auth.users → profiles** (1:1)
   - Type: One-to-One
   - Foreign Key: `profiles.id` → `auth.users.id`
   - Delete Rule: CASCADE (usunięcie użytkownika usuwa profil)
   - Created by: Trigger `handle_new_user()` przy rejestracji

2. **profiles → meals** (1:N)
   - Type: One-to-Many
   - Foreign Key: `meals.user_id` → `profiles.id`
   - Delete Rule: CASCADE (usunięcie profilu usuwa wszystkie posiłki)

3. **meals → ai_generations** (1:N)
   - Type: One-to-Many
   - Foreign Key: `ai_generations.meal_id` → `meals.id` (NULLABLE)
   - Delete Rule: CASCADE (usunięcie posiłku usuwa powiązane generowania AI)
   - Note: meal_id może być NULL dla generowań AI niezaakceptowanych przez użytkownika

4. **profiles → ai_generations** (1:N)
   - Type: One-to-Many
   - Foreign Key: `ai_generations.user_id` → `profiles.id`
   - Delete Rule: CASCADE (usunięcie profilu usuwa wszystkie generowania AI)

5. **profiles → calorie_goals** (1:N)
   - Type: One-to-Many
   - Foreign Key: `calorie_goals.user_id` → `profiles.id`
   - Delete Rule: CASCADE (usunięcie profilu usuwa historię celów)

6. **profiles → error_logs** (1:N)
   - Type: One-to-Many (nullable)
   - Foreign Key: `error_logs.user_id` → `profiles.id`
   - Delete Rule: SET NULL (zachowanie logów, anonimizacja user_id)

---

## 3. Indexes

### 3.1. Primary Key Indexes (automatic)

```sql
-- Automatycznie tworzone dla PRIMARY KEY
-- profiles(id)
-- calorie_goals(id)
-- meals(id)
-- ai_generations(id)
-- error_logs(id)
```

### 3.2. Foreign Key Indexes

```sql
-- Indeksy dla foreign keys
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_ai_generations_meal_id ON ai_generations(meal_id);
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_calorie_goals_user_id ON calorie_goals(user_id);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);
```

### 3.3. Performance Indexes

```sql
-- Optymalizacja zapytań dashboardu i widoku dnia
CREATE INDEX idx_meals_user_timestamp ON meals(user_id, meal_timestamp DESC);

-- Szybkie pobieranie najnowszego generowania AI dla posiłku
CREATE INDEX idx_ai_generations_meal_created ON ai_generations(meal_id, created_at DESC);

-- Pobieranie historii generowań użytkownika
CREATE INDEX idx_ai_generations_user_created ON ai_generations(user_id, created_at DESC);

-- Szybkie pobieranie aktualnego celu kalorycznego
CREATE INDEX idx_calorie_goals_user_date ON calorie_goals(user_id, effective_from DESC);

-- Przeglądanie i czyszczenie logów
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_created ON error_logs(user_id, created_at DESC);
```

**Index Strategy:**

- Compound indexes dla często używanych zapytań (user_id + timestamp/date)
- DESC ordering dla chronologicznego sortowania (najnowsze wpisy pierwsze)
- meal_id + created_at DESC dla pobierania najnowszego generowania AI
- Brak functional indexes (niepotrzebne dla MVP)
- Brak partial indexes (niepotrzebne dla MVP)

---

## 4. PostgreSQL Functions and Triggers

### 4.1. Function: get_current_calorie_goal

Pobiera aktualny cel kaloryczny użytkownika na podstawie daty.

```sql
CREATE OR REPLACE FUNCTION get_current_calorie_goal(
  user_uuid UUID,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  goal INTEGER;
BEGIN
  SELECT daily_goal INTO goal
  FROM calorie_goals
  WHERE user_id = user_uuid
    AND effective_from <= target_date
  ORDER BY effective_from DESC
  LIMIT 1;

  -- Fallback na domyślną wartość jeśli brak wpisu
  RETURN COALESCE(goal, 2000);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Properties:**

- `STABLE` - funkcja nie modyfikuje danych, optymalizacja query planner
- `SECURITY DEFINER` - wykonuje się z prawami twórcy (omija RLS dla internal logic)
- Fallback na 2000 kcal jeśli brak celu dla użytkownika

---

### 4.2. Function: get_latest_ai_generation

Pobiera najnowsze generowanie AI dla posiłku.

```sql
CREATE OR REPLACE FUNCTION get_latest_ai_generation(meal_uuid UUID)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  generated_calories INTEGER,
  generated_protein DECIMAL(6,2),
  generated_carbs DECIMAL(6,2),
  generated_fats DECIMAL(6,2),
  assumptions TEXT,
  model_used VARCHAR(100),
  generation_duration INTEGER,
  status ai_generation_status,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.id,
    ag.prompt,
    ag.generated_calories,
    ag.generated_protein,
    ag.generated_carbs,
    ag.generated_fats,
    ag.assumptions,
    ag.model_used,
    ag.generation_duration,
    ag.status,
    ag.created_at
  FROM ai_generations ag
  WHERE ag.meal_id = meal_uuid
  ORDER BY ag.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

**Properties:**

- Zwraca najnowsze generowanie AI dla danego posiłku
- Używane przy wyświetlaniu szczegółów posiłku z historią AI

---

### 4.3. Trigger Function: update_updated_at_column

Automatyczna aktualizacja kolumny `updated_at` przy UPDATE.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Applied to tables:**

```sql
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calorie_goals_updated_at
  BEFORE UPDATE ON calorie_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 4.4. Trigger Function: handle_new_user

Automatyczne tworzenie profilu i domyślnego celu przy rejestracji użytkownika.

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Tworzenie profilu użytkownika
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  -- Tworzenie domyślnego celu kalorycznego (2000 kcal od dzisiaj)
  INSERT INTO calorie_goals (user_id, daily_goal, effective_from, created_at, updated_at)
  VALUES (NEW.id, 2000, CURRENT_DATE, NOW(), NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Business Logic:**

- Automatyczne tworzenie przy INSERT na `auth.users`
- Domyślny cel: 2000 kcal
- `effective_from = CURRENT_DATE` (wyjątek - tylko dla pierwszego celu przy rejestracji)
- Wykonuje się w jednej transakcji (atomicznie)

---

## 5. PostgreSQL Views

### 5.1. View: daily_progress

Agregacja dziennego postępu użytkownika.

```sql
CREATE VIEW daily_progress AS
SELECT
  DATE(meal_timestamp) as date,
  user_id,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fats) as total_fats,
  get_current_calorie_goal(user_id, DATE(meal_timestamp)) as calorie_goal,
  ROUND(SUM(calories) * 100.0 / get_current_calorie_goal(user_id, DATE(meal_timestamp)), 1) as percentage
FROM meals
GROUP BY DATE(meal_timestamp), user_id;
```

**Columns:**

- `date` - DATE (dzień)
- `user_id` - UUID
- `total_calories` - suma kalorii z danego dnia
- `total_protein` - suma białka (nullable)
- `total_carbs` - suma węglowodanów (nullable)
- `total_fats` - suma tłuszczy (nullable)
- `calorie_goal` - cel kaloryczny na dany dzień (z historii celów)
- `percentage` - procent realizacji celu (zaokrąglony do 1 miejsca)

**Properties:**

- Zwykły VIEW (nie materialized)
- RLS automatycznie filtruje po `user_id = auth.uid()`
- UTC date grouping (frontend konwertuje do lokalnego czasu)
- Używa funkcji `get_current_calorie_goal()` dla każdego dnia

**Usage:**

```sql
-- Dashboard: lista dni użytkownika
SELECT * FROM daily_progress
WHERE user_id = auth.uid()
ORDER BY date DESC
LIMIT 30;

-- Szczegóły konkretnego dnia
SELECT * FROM daily_progress
WHERE user_id = auth.uid()
  AND date = '2025-01-27';
```

---

### 5.2. View: meals_with_latest_ai

Posiłki z najnowszym generowaniem AI.

```sql
CREATE VIEW meals_with_latest_ai AS
SELECT
  m.*,
  ag.id as ai_generation_id,
  ag.prompt as ai_prompt,
  ag.assumptions as ai_assumptions,
  ag.model_used as ai_model_used,
  ag.generation_duration as ai_generation_duration
FROM meals m
LEFT JOIN LATERAL (
  SELECT * FROM ai_generations
  WHERE meal_id = m.id
  ORDER BY created_at DESC
  LIMIT 1
) ag ON true;
```

**Usage:**

```sql
-- Pobranie posiłku z najnowszym generowaniem AI
SELECT * FROM meals_with_latest_ai
WHERE id = $1;
```

---

## 6. Row Level Security (RLS) Policies

### 6.1. profiles

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi tylko swój profil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- UPDATE: Użytkownik może aktualizować tylko swój profil
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- INSERT/DELETE: Zarządzane przez triggery, nie przez użytkownika
```

---

### 6.2. meals

```sql
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi tylko swoje posiłki
CREATE POLICY "Users can view own meals"
ON meals FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Użytkownik może dodawać tylko swoje posiłki
CREATE POLICY "Users can insert own meals"
ON meals FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Użytkownik może edytować tylko swoje posiłki
CREATE POLICY "Users can update own meals"
ON meals FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Użytkownik może usuwać tylko swoje posiłki
CREATE POLICY "Users can delete own meals"
ON meals FOR DELETE
USING (user_id = auth.uid());
```

---

### 6.3. ai_generations

```sql
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi tylko swoje generowania AI
CREATE POLICY "Users can view own ai generations"
ON ai_generations FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Użytkownik może dodawać tylko swoje generowania AI
CREATE POLICY "Users can insert own ai generations"
ON ai_generations FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Użytkownik może aktualizować tylko swoje generowania AI
-- (np. UPDATE meal_id po akceptacji)
CREATE POLICY "Users can update own ai generations"
ON ai_generations FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Użytkownik może usuwać tylko swoje generowania AI
CREATE POLICY "Users can delete own ai generations"
ON ai_generations FOR DELETE
USING (user_id = auth.uid());
```

---

### 6.4. calorie_goals

```sql
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;

-- SELECT: Użytkownik widzi tylko swoje cele
CREATE POLICY "Users can view own goals"
ON calorie_goals FOR SELECT
USING (user_id = auth.uid());

-- INSERT: Użytkownik może dodawać tylko swoje cele
CREATE POLICY "Users can insert own goals"
ON calorie_goals FOR INSERT
WITH CHECK (user_id = auth.uid());

-- UPDATE: Użytkownik może aktualizować tylko swoje cele
CREATE POLICY "Users can update own goals"
ON calorie_goals FOR UPDATE
USING (user_id = auth.uid());

-- DELETE: Użytkownik może usuwać tylko swoje cele
CREATE POLICY "Users can delete own goals"
ON calorie_goals FOR DELETE
USING (user_id = auth.uid());
```

---

### 6.5. error_logs

```sql
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Brak policies dla zwykłych użytkowników
-- Dostęp tylko dla adminów przez Supabase Dashboard/SQL
-- Użytkownicy nie powinni widzieć logów błędów (informacje techniczne)
```

---

### 6.6. Views

```sql
-- daily_progress: RLS automatycznie egzekwowane przez underlying table (meals)
-- meals_with_latest_ai: RLS automatycznie egzekwowane przez underlying tables
-- Użytkownik widzi tylko swoje dni/posiłki w views
-- Nie wymaga osobnych policies
```

---

## 7. Additional Notes and Design Decisions

### 7.1. Authentication & Authorization

- **Supabase Auth** zarządza użytkownikami w `auth.users`
- **RLS policies** zapewniają 100% izolację danych między użytkownikami
- **Restrictive by default** - brak dostępu bez explicit policy
- **auth.uid()** - funkcja Supabase zwracająca ID zalogowanego użytkownika

### 7.2. Calorie Goals History

- **Historyzacja celów** - każda zmiana jako nowy rekord
- **effective_from** - cel obowiązuje od dnia następnego (CURRENT_DATE + 1)
- **Wyjątek**: Domyślny cel przy rejestracji ma `effective_from = CURRENT_DATE`
- **ON CONFLICT UPDATE** - wielokrotne zmiany w tym samym dniu

### 7.3. Meals Data Model (UPDATED)

- **description** - finalna nazwa/opis posiłku (może być edytowana)
- **Makroskładniki nullable** - tylko kalorie są wymagane
- **input_method tracking** - niezbędne dla metryk AI z PRD
- **ai_assumptions USUNIĘTE** - przeniesione do ai_generations
- **ai_generation_duration USUNIĘTE** - przeniesione do ai_generations
- **Hard delete** - brak soft delete dla MVP

### 7.4. AI Generations Model (NEW)

- **Historia pełna** - wszystkie wywołania AI zapisywane
- **meal_id nullable** - NULL przed akceptacją, UPDATE po akceptacji
- **Status tracking** - 'pending', 'completed', 'failed'
- **Metadata** - model, duration, error_message dla debugowania
- **Relacja z meals** - 1:N (jeden meal może mieć wiele generowań)
- **Użycie** - pobierz najnowsze: `ORDER BY created_at DESC LIMIT 1`

### 7.5. AI Metrics (PRD Requirements - UPDATED)

- **Metryka Zaufania**: `COUNT(input_method = 'ai') / COUNT(input_method IN ('ai', 'ai-edited'))`
- **Metryka Użyteczności**: `COUNT(input_method IN ('ai', 'ai-edited')) / COUNT(*)`
- **Nowe metryki z ai_generations**:
  - Liczba regeneracji na meal (ile razy użytkownik kliknął "Generuj ponownie")
  - Średni czas generowania (avg(generation_duration))
  - Success rate (COUNT(status='completed') / COUNT(\*))
  - Najpopularniejsze modele (GROUP BY model_used)
  - Różnica między generated values a finalnymi wartościami w meals (czy użytkownik edytuje)

### 7.6. Performance Considerations

- **Compound indexes** - (user_id, timestamp/date DESC)
- **AI generations index** - (meal_id, created_at DESC) dla najnowszego
- **No partitioning** - niepotrzebne dla MVP
- **No materialized views** - zwykły VIEW wystarczy
- **Function optimization** - STABLE SECURITY DEFINER
- **LATERAL join** w view dla efektywnego pobierania najnowszego AI

### 7.7. Data Integrity

- **CHECK constraints** - realistyczne zakresy wartości
- **UNIQUE constraints** - zapobieganie duplikatom
- **CASCADE DELETE** - automatyczne czyszczenie powiązanych danych
- **NOT NULL** - wymuszenie wymaganych pól
- **Nullable meal_id** - wspiera flow: generate → accept → link to meal

### 7.8. GDPR Compliance

- **CASCADE DELETE** - automatyczne usuwanie danych użytkownika
- **ai_generations CASCADE** - historia AI usuwana z użytkownikiem
- **SET NULL dla error_logs** - anonimizacja logów
- **90-day retention** - automatyczne czyszczenie error_logs
- **RLS** - pełna izolacja danych

### 7.9. Timezone Handling

- **TIMESTAMPTZ** - przechowywanie w UTC
- **Frontend konwersja** - wyświetlanie w lokalnym czasie użytkownika
- **VIEW date grouping** - UTC (akceptowalne dla MVP)
- **Future**: możliwość dodania user_timezone do profiles

### 7.10. Migration Strategy

1. Create ENUM types (meal_category, input_method_type, ai_generation_status)
2. Create tables (profiles, calorie_goals, meals, ai_generations, error_logs)
3. Create functions (get_current_calorie_goal, get_latest_ai_generation, update_updated_at_column, handle_new_user)
4. Create triggers
5. Create views (daily_progress, meals_with_latest_ai)
6. Setup RLS policies
7. Create indexes

### 7.11. Known Limitations (MVP)

- **No optimistic locking** - last write wins
- **No timezone preferences** - UTC date grouping
- **No rate limiting** - implementować w Edge Functions
- **No soft delete** - hard delete tylko
- **No concurrent edit protection** - monitorować czy występuje problem

### 7.12. Future Enhancements (poza MVP)

- Tabela `meal_favorites` - ulubione posiłki
- Tabela `weight_history` - śledzenie wagi
- Tabela `user_preferences` - preferencje użytkownika (jednostki, timezone)
- Materialized view dla `daily_progress`
- Partycjonowanie tabeli `meals` i `ai_generations` po dacie
- Funkcja `get_weekly_summary()` / `get_monthly_summary()`
- AI comparison analytics - porównanie modeli AI
- AI learning feedback - czy użytkownik zaakceptował bez edycji

---

## 8. Complete Schema SQL

### 8.1. Full Schema Creation Script

```sql
-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');
CREATE TYPE input_method_type AS ENUM ('ai', 'manual', 'ai-edited');
CREATE TYPE ai_generation_status AS ENUM ('pending', 'completed', 'failed');

-- ============================================
-- TABLES
-- ============================================

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Calorie Goals
CREATE TABLE calorie_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_goal INTEGER NOT NULL CHECK (daily_goal > 0 AND daily_goal <= 10000),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT unique_user_effective_date UNIQUE(user_id, effective_from)
);

-- Meals
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description VARCHAR(500) NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0 AND calories <= 10000),
  protein DECIMAL(6,2) CHECK (protein >= 0 AND protein <= 1000),
  carbs DECIMAL(6,2) CHECK (carbs >= 0 AND carbs <= 1000),
  fats DECIMAL(6,2) CHECK (fats >= 0 AND fats <= 1000),
  category meal_category,
  input_method input_method_type NOT NULL,
  meal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- AI Generations
CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_calories INTEGER CHECK (generated_calories > 0 AND generated_calories <= 10000),
  generated_protein DECIMAL(6,2) CHECK (generated_protein >= 0 AND generated_protein <= 1000),
  generated_carbs DECIMAL(6,2) CHECK (generated_carbs >= 0 AND generated_carbs <= 1000),
  generated_fats DECIMAL(6,2) CHECK (generated_fats >= 0 AND generated_fats <= 1000),
  assumptions TEXT,
  model_used VARCHAR(100),
  generation_duration INTEGER,
  status ai_generation_status NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Error Logs
CREATE TABLE error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  error_type VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

-- Foreign keys
CREATE INDEX idx_meals_user_id ON meals(user_id);
CREATE INDEX idx_ai_generations_meal_id ON ai_generations(meal_id);
CREATE INDEX idx_ai_generations_user_id ON ai_generations(user_id);
CREATE INDEX idx_calorie_goals_user_id ON calorie_goals(user_id);
CREATE INDEX idx_error_logs_user_id ON error_logs(user_id);

-- Performance indexes
CREATE INDEX idx_meals_user_timestamp ON meals(user_id, meal_timestamp DESC);
CREATE INDEX idx_ai_generations_meal_created ON ai_generations(meal_id, created_at DESC);
CREATE INDEX idx_ai_generations_user_created ON ai_generations(user_id, created_at DESC);
CREATE INDEX idx_calorie_goals_user_date ON calorie_goals(user_id, effective_from DESC);
CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_created ON error_logs(user_id, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get current calorie goal
CREATE OR REPLACE FUNCTION get_current_calorie_goal(
  user_uuid UUID,
  target_date DATE DEFAULT CURRENT_DATE
) RETURNS INTEGER AS $$
DECLARE
  goal INTEGER;
BEGIN
  SELECT daily_goal INTO goal
  FROM calorie_goals
  WHERE user_id = user_uuid AND effective_from <= target_date
  ORDER BY effective_from DESC LIMIT 1;

  RETURN COALESCE(goal, 2000);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get latest AI generation for a meal
CREATE OR REPLACE FUNCTION get_latest_ai_generation(meal_uuid UUID)
RETURNS TABLE (
  id UUID,
  prompt TEXT,
  generated_calories INTEGER,
  generated_protein DECIMAL(6,2),
  generated_carbs DECIMAL(6,2),
  generated_fats DECIMAL(6,2),
  assumptions TEXT,
  model_used VARCHAR(100),
  generation_duration INTEGER,
  status ai_generation_status,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ag.id,
    ag.prompt,
    ag.generated_calories,
    ag.generated_protein,
    ag.generated_carbs,
    ag.generated_fats,
    ag.assumptions,
    ag.model_used,
    ag.generation_duration,
    ag.status,
    ag.created_at
  FROM ai_generations ag
  WHERE ag.meal_id = meal_uuid
  ORDER BY ag.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  INSERT INTO calorie_goals (user_id, daily_goal, effective_from, created_at, updated_at)
  VALUES (NEW.id, 2000, CURRENT_DATE, NOW(), NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON meals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calorie_goals_updated_at
  BEFORE UPDATE ON calorie_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Daily progress view
CREATE VIEW daily_progress AS
SELECT
  DATE(meal_timestamp) as date,
  user_id,
  SUM(calories) as total_calories,
  SUM(protein) as total_protein,
  SUM(carbs) as total_carbs,
  SUM(fats) as total_fats,
  get_current_calorie_goal(user_id, DATE(meal_timestamp)) as calorie_goal,
  ROUND(SUM(calories) * 100.0 / get_current_calorie_goal(user_id, DATE(meal_timestamp)), 1) as percentage
FROM meals
GROUP BY DATE(meal_timestamp), user_id;

-- Meals with latest AI generation
CREATE VIEW meals_with_latest_ai AS
SELECT
  m.*,
  ag.id as ai_generation_id,
  ag.prompt as ai_prompt,
  ag.assumptions as ai_assumptions,
  ag.model_used as ai_model_used,
  ag.generation_duration as ai_generation_duration
FROM meals m
LEFT JOIN LATERAL (
  SELECT * FROM ai_generations
  WHERE meal_id = m.id
  ORDER BY created_at DESC
  LIMIT 1
) ag ON true;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- Meals
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
ON meals FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meals"
ON meals FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meals"
ON meals FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meals"
ON meals FOR DELETE
USING (user_id = auth.uid());

-- AI Generations
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai generations"
ON ai_generations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai generations"
ON ai_generations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai generations"
ON ai_generations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai generations"
ON ai_generations FOR DELETE
USING (user_id = auth.uid());

-- Calorie Goals
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals"
ON calorie_goals FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals"
ON calorie_goals FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals"
ON calorie_goals FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals"
ON calorie_goals FOR DELETE
USING (user_id = auth.uid());

-- Error Logs
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
-- No policies for regular users - admin access only
```

---

## Summary

Ten zaktualizowany schemat bazy danych PostgreSQL dla MVP "Szybkie Kalorie" zapewnia:

✅ **Pełną izolację danych** użytkowników przez RLS
✅ **Historyzację celów kalorycznych** bez wpływu na przeszłe dni
✅ **Pełną historię generowań AI** z możliwością analizy
✅ **Tracking źródła danych** dla metryk AI z PRD
✅ **Skalowalność** przez właściwe indeksy i relacje
✅ **Integralność danych** przez constraints i foreign keys
✅ **GDPR compliance** przez CASCADE DELETE i SET NULL
✅ **Automatyzację** przez triggery i funkcje
✅ **Wydajność** przez compound indexes i STABLE functions
✅ **Rozszerzone metryki AI** - regeneracje, modele, edycje użytkownika

**Kluczowe zmiany:**

- ➕ Nowa tabela `ai_generations` z pełną historią
- ➕ Nowy ENUM `ai_generation_status`
- ➕ Nowa funkcja `get_latest_ai_generation()`
- ➕ Nowy VIEW `meals_with_latest_ai`
- ➖ Usunięte kolumny z `meals`: `ai_assumptions`, `ai_generation_duration`
- 🔄 Rozszerzone możliwości metryk i analiz AI

Schemat jest gotowy do implementacji jako migracje Supabase.
