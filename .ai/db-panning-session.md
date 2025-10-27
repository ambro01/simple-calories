# Database Planning Summary - Szybkie Kalorie MVP

## Decisions

### Autentykacja i Profile Użytkowników
1. Wykorzystać wbudowaną tabelę `auth.users` z Supabase dla autentykacji
2. Utworzyć tabelę `profiles` z relacją 1:1 do `auth.users` (foreign key do `auth.users.id`)
3. Tabela `profiles` minimalna dla MVP: `id` (UUID, PK, FK), `created_at`, `updated_at`
4. Trigger `handle_new_user()` na `auth.users` automatycznie tworzący profil i domyślny cel kaloryczny (2000 kcal) przy rejestracji
5. CASCADE DELETE na wszystkich foreign keys dla zgodności z GDPR

### Historia Celów Kalorycznych
6. Osobna tabela `calorie_goals` dla historyzacji celów
7. Struktura: `id` (UUID), `user_id` (FK), `daily_goal` (INTEGER), `effective_from` (DATE), `created_at`, `updated_at`
8. `effective_from` zawsze automatycznie ustawiany na `CURRENT_DATE + 1` (cel obowiązuje od następnego dnia)
9. Zachować `effective_from` jako oddzielną kolumnę od `created_at` dla audytu i elastyczności
10. Wielokrotne zmiany celu w tym samym dniu: logika aplikacji z `ON CONFLICT (user_id, effective_from) DO UPDATE`
11. UNIQUE constraint: `(user_id, effective_from)`
12. CHECK constraint: `daily_goal > 0 AND daily_goal <= 10000`

### Tabela Meals (Posiłki)
13. `description` VARCHAR(500) NOT NULL - opis posiłku (zamiast dwóch kolumn name i original_description)
14. `calories` INTEGER NOT NULL z CHECK `(calories > 0 AND calories <= 10000)`
15. `protein`, `carbs`, `fats` DECIMAL(6,2) NULLABLE z CHECK `(>= 0 AND <= 1000)`
16. `category` ENUM NULLABLE - wartości: 'breakfast', 'lunch', 'dinner', 'snack', 'other'
17. `input_method` ENUM NOT NULL - wartości: 'ai', 'manual', 'ai-edited'
18. `ai_assumptions` TEXT NULLABLE - przechowuje założenia AI jako zwykły tekst
19. `meal_timestamp` TIMESTAMPTZ NOT NULL
20. NIE pozwalać na dodawanie posiłków z datą przyszłą (walidacja aplikacji)
21. UUID jako primary key (gen_random_uuid())
22. Hard delete (brak soft delete dla MVP)

### Indeksy i Wydajność
23. Index na `meals`: `(user_id, meal_timestamp DESC)` - bez partial index
24. Index na `calorie_goals`: `(user_id, effective_from DESC)`
25. Brak functional index - zbyteczne dla MVP
26. Brak optimistic locking - niepotrzebne dla MVP

### Row Level Security (RLS)
27. Włączyć RLS na wszystkich tabelach użytkownika (`profiles`, `meals`, `calorie_goals`)
28. Restrictive policies (deny by default) z czytelnymi nazwami
29. Policies dla każdej tabeli: SELECT, INSERT, UPDATE, DELETE z filtrem `user_id = auth.uid()`
30. RLS na `error_logs` tylko dla adminów (brak policy dla zwykłych użytkowników)

### Funkcje PostgreSQL
31. `get_current_calorie_goal(user_uuid UUID, target_date DATE DEFAULT CURRENT_DATE)` - zwraca INTEGER
32. Funkcja z flagami: STABLE SECURITY DEFINER
33. Zwraca domyślną wartość 2000 jeśli brak celu dla użytkownika (COALESCE)
34. Brak dedykowanej funkcji `get_day_summary()` - niepotrzebne dla MVP

### Triggery
35. `handle_new_user()` - tworzenie profilu i domyślnego celu przy rejestracji
36. `update_updated_at_column()` - reużywalny trigger dla kolumny `updated_at`
37. Osobne triggery dla każdej tabeli: `update_meals_updated_at`, `update_profiles_updated_at`, `update_calorie_goals_updated_at`

### VIEW daily_progress
38. Zwykły VIEW (nie materialized view)
39. Agreguje: `date`, `user_id`, `total_calories`, `total_protein`, `total_carbs`, `total_fats`, `calorie_goal`, `percentage`
40. UTC date grouping - akceptowalne dla MVP (frontend obsługuje lokalne strefy czasowe)
41. Brak meal_count i ai_meal_count w VIEW - niepotrzebne
42. Brak dedykowanego VIEW dla ostatnich posiłków - prosty query wystarczy

### Error Logs
43. Tabela `error_logs`: `id`, `user_id` (NULLABLE, ON DELETE SET NULL), `error_type` (VARCHAR(100)), `error_message` (TEXT), `error_details` (JSONB), `context` (JSONB), `created_at`
44. Index: `(created_at DESC)`, `(user_id, created_at DESC)`
45. Automatyczne czyszczenie logów starszych niż 90 dni (PostgreSQL cron extension)
46. Dostęp tylko dla adminów przez Supabase Dashboard/SQL

### Schemat i Migracje
47. Używać domyślnego schematu `public`
48. Konwencja nazewnictwa migracji: `YYYYMMDDHHMMSS_descriptive_name.sql`
49. Kolejność migracji: tables ó functions/triggers ó RLS policies ó indexes
50. Seed data tylko dla dev/staging (brak dla production)

### Walidacja i Logika Biznesowa
51. Walidacja danych AI na poziomie aplikacji (nie w bazie)
52. Brak tabeli preferences - niepotrzebne dla MVP
53. Brak dedykowanej funkcji GDPR - CASCADE DELETE wystarczy
54. Supabase Auth w pełni obsługuje sesje (brak własnej tabeli sesji)

### Typy Danych i Constraints
55. `created_at`, `updated_at` - TIMESTAMPTZ DEFAULT NOW()
56. CHECK constraints dla realistycznych wartości kalorii i makroskładników
57. Makroskładniki jako oddzielne kolumny (nie JSONB) dla lepszej wydajności
58. Strefy czasowe: TIMESTAMPTZ w bazie, frontend konwertuje do lokalnego czasu użytkownika

---

## Matched Recommendations

### Architektura Danych
1. **Separacja auth od app logic** - Tabela `profiles` jako bridge między `auth.users` a logiką aplikacji, zgodnie z best practices Supabase
2. **Historyzacja celów kalorycznych** - Osobna tabela zapewnia audit trail i pozwala na wyświetlanie właściwych celów dla przeszłych dni
3. **Denormalizacja dla wydajności** - Makroskładniki jako osobne kolumny zamiast JSONB dla lepszej wydajności agregacji

### Bezpieczeństwo
4. **RLS restrictive by default** - Pełna izolacja danych użytkowników na poziomie bazy zgodnie z wymaganiami PRD
5. **CASCADE DELETE** - Automatyczne usuwanie powiązanych danych przy usunięciu konta (GDPR compliance)
6. **ON DELETE SET NULL dla error_logs** - Zachowanie logów systemowych przy anonimizacji user_id

### Optymalizacja
7. **Indexes na foreign keys i query patterns** - `(user_id, meal_timestamp DESC)` dla dashboardu i widoku dnia
8. **STABLE SECURITY DEFINER dla funkcji** - Optymalizacja i omijanie RLS dla internal logic
9. **Zwykły VIEW zamiast materialized** - Wystarczający dla MVP, prostszy w utrzymaniu

### Integralność Danych
10. **CHECK constraints** - Realistyczne zakresy wartości zapobiegające błędnym danym
11. **UNIQUE constraints** - Zapobieganie duplikatom celów kalorycznych dla tej samej daty
12. **NOT NULL dla kluczowych kolumn** - Wymuszenie minimalnych wymaganych danych (calories, meal_timestamp)

### Elastyczność i Rozwój
13. **UUID jako primary keys** - Bezpieczeństwo i łatwiejsze mergowanie danych w przyszłości
14. **ENUM types** - Integralność danych dla stałych wartości (kategorie, input_method)
15. **Separacja effective_from od created_at** - Możliwość przyszłego planowania celów od konkretnej daty

### DevOps i Utrzymanie
16. **Timestampowe nazwy migracji** - Chronologiczne śledzenie zmian schematu
17. **Reużywalne triggery** - DRY principle dla `update_updated_at_column()`
18. **Automatyczne czyszczenie logów** - Zarządzanie rozmiarem bazy i compliance (90 dni retention)

### Walidacja i User Experience
19. **Domyślny cel 2000 kcal** - Użytkownik może od razu zacząć korzystać z aplikacji
20. **Fallback w funkcjach** - COALESCE zapewnia resilience (zwracanie 2000 gdy brak celu)
21. **ON CONFLICT dla concurrent updates** - Bezpieczna obsługa wielokrotnych zmian celu w tym samym dniu

---

## Database Schema Overview

### Cel Projektu
Zaprojektować schemat bazy danych PostgreSQL dla MVP aplikacji "Szybkie Kalorie" - aplikacji do szybkiego śledzenia kalorii z wykorzystaniem AI. Aplikacja wykorzystuje Supabase jako backend-as-a-service, co wpływa na architekturę danych (wykorzystanie `auth.users`, RLS, triggery).

### Główne Wymagania
- **Pełna izolacja danych użytkowników** - wymagana przez PRD
- **Historia celów kalorycznych** - zmiana celu nie może wpływać na wyniki przeszłych dni
- **Zledzenie zródła danych** - wymagane dla metryk sukcesu AI (Metryka Użyteczności AI, Metryka Zaufania do AI)
- **Opcjonalność makroskładników** - tylko kalorie są obowiązkowe
- **Audytowalność** - created_at, updated_at, historia zmian celów

---

## Kluczowe Encje i Relacje

### 1. auth.users (Supabase built-in)
- Zarządza autentykacją użytkowników
- Nie modyfikujemy tej tabeli bezpośrednio

### 2. profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```
- **Relacja:** 1:1 z auth.users
- **Cel:** Bridge między autentykacją a logiką aplikacji
- **Utworzenie:** Automatyczne przez trigger przy rejestracji

### 3. calorie_goals
```sql
CREATE TABLE calorie_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  daily_goal INTEGER NOT NULL CHECK (daily_goal > 0 AND daily_goal <= 10000),
  effective_from DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, effective_from)
);

CREATE INDEX idx_calorie_goals_user_date ON calorie_goals(user_id, effective_from DESC);
```
- **Relacja:** N:1 z profiles (jeden użytkownik, wiele celów w czasie)
- **Logika:** `effective_from` zawsze CURRENT_DATE + 1 (cel od jutra)
- **Wielokrotne zmiany:** ON CONFLICT UPDATE gdy użytkownik zmienia cel kilka razy w tym samym dniu

### 4. meals
```sql
CREATE TYPE meal_category AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');
CREATE TYPE input_method_type AS ENUM ('ai', 'manual', 'ai-edited');

CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  description VARCHAR(500) NOT NULL,
  calories INTEGER NOT NULL CHECK (calories > 0 AND calories <= 10000),
  protein DECIMAL(6,2) CHECK (protein >= 0 AND protein <= 1000),
  carbs DECIMAL(6,2) CHECK (carbs >= 0 AND carbs <= 1000),
  fats DECIMAL(6,2) CHECK (fats >= 0 AND fats <= 1000),
  category meal_category,
  input_method input_method_type NOT NULL,
  ai_assumptions TEXT,
  meal_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_meals_user_timestamp ON meals(user_id, meal_timestamp DESC);
```
- **Relacja:** N:1 z profiles (jeden użytkownik, wiele posiłków)
- **Walidacja:** Aplikacja waliduje przed INSERT, baza wymusza CHECK constraints

### 5. error_logs
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

CREATE INDEX idx_error_logs_created ON error_logs(created_at DESC);
CREATE INDEX idx_error_logs_user_created ON error_logs(user_id, created_at DESC);
```
- **Relacja:** N:1 z profiles (nullable - bBędy mogą być systemowe)
- **Retention:** Automatyczne usuwanie po 90 dniach
- **Dostęp:** Tylko admini przez Supabase Dashboard

---

## Funkcje i Triggery

### Funkcja get_current_calorie_goal
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
  WHERE user_id = user_uuid AND effective_from <= target_date
  ORDER BY effective_from DESC LIMIT 1;

  RETURN COALESCE(goal, 2000);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```
- Pobiera aktualny cel dla użytkownika i daty
- Fallback 2000 jeśli brak wpisu
- Używana w VIEW daily_progress

### Trigger handle_new_user
```sql
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());

  INSERT INTO calorie_goals (user_id, daily_goal, effective_from, created_at, updated_at)
  VALUES (NEW.id, 2000, CURRENT_DATE, NOW(), NOW());

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```
- Automatycznie tworzy profil i domyślny cel przy rejestracji

### Trigger update_updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
- Reużywalny dla wszystkich tabel z updated_at

---

## VIEW daily_progress

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
- Agreguje dzienny postęp użytkownika
- RLS automatycznie filtruje po user_id
- UTC date grouping (frontend konwertuje do lokalnego czasu)

---

## Bezpieczeństwo - Row Level Security

### Profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
```

### Meals
```sql
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own meals" ON meals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meals" ON meals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own meals" ON meals
  FOR DELETE USING (user_id = auth.uid());
```

### Calorie Goals
```sql
ALTER TABLE calorie_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON calorie_goals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own goals" ON calorie_goals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own goals" ON calorie_goals
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own goals" ON calorie_goals
  FOR DELETE USING (user_id = auth.uid());
```

### Error Logs
- Brak policies dla zwykłych użytkowników
- Dostęp tylko dla adminów przez Supabase Dashboard

---

## Skalowalność i Wydajność

### Indeksy
- `meals(user_id, meal_timestamp DESC)` - optymalizacja dashboardu i widoku dnia
- `calorie_goals(user_id, effective_from DESC)` - szybkie pobieranie aktualnego celu
- Foreign key indexes (automatyczne)

### Partycjonowanie
- Nie implementowane dla MVP
- Możliwe w przyszłości dla tabeli meals po dacie

### Caching
- Supabase automatycznie cachuje wyniki
- Frontend może implementować client-side caching

### Limity
- CHECK constraints zapobiegają unrealistic values
- Walidacja aplikacji przed wysłaniem do bazy

---

## Integralność i Spójność Danych

### Constraints
- `UNIQUE(user_id, effective_from)` - zapobiega duplikatom celów
- CHECK dla kalorii i makroskładników - realistyczne zakresy
- NOT NULL dla kluczowych kolumn
- Foreign keys z CASCADE DELETE

### Transakcje
- Trigger handle_new_user w jednej transakcji (profil + domyślny cel)
- ON CONFLICT dla idempotentności aktualizacji celów

### Data Validation
- Aplikacja waliduje przed INSERT
- Baza wymusza constraints jako ostatnia linia obrony

---

## Migracje i Deployment

### Kolejność migracji
1. `20250124100000_create_types.sql` - ENUM types
2. `20250124100100_create_profiles_table.sql`
3. `20250124100200_create_calorie_goals_table.sql`
4. `20250124100300_create_meals_table.sql`
5. `20250124100400_create_error_logs_table.sql`
6. `20250124100500_create_functions.sql` - get_current_calorie_goal
7. `20250124100600_create_triggers.sql` - handle_new_user, update_updated_at
8. `20250124100700_create_views.sql` - daily_progress
9. `20250124100800_setup_rls_policies.sql`
10. `20250124100900_create_indexes.sql`

### Seed Data
- Tylko dla dev/staging
- Przykładowi użytkownicy z posiłkami
- Production: tylko struktura

---

## Metryki AI (zgodnie z PRD)

### Zledzenie przez kolumny
- `input_method = 'ai'` - wpisy zainicjowane przez AI
- `input_method = 'ai-edited'` - wpisy AI zmodyfikowane przez użytkownika
- `input_method = 'manual'` - wpisy ręczne

### Obliczanie metryk
- **Metryka Zaufania do AI:** `COUNT(input_method = 'ai') / COUNT(input_method IN ('ai', 'ai-edited'))`
- **Metryka Użyteczności AI:** `COUNT(input_method IN ('ai', 'ai-edited')) / COUNT(*)`

---

## GDPR i Privacy

### Prawo do bycia zapomnianym
- CASCADE DELETE automatycznie usuwa profiles, meals, calorie_goals
- error_logs.user_id SET NULL (anonimizacja)

### Izolacja danych
- RLS na poziomie bazy - 100% gwarancja
- Supabase automatycznie egzekwuje przez API

### Retention
- error_logs: 90 dni
- Pozostałe dane: zachowane dopóki użytkownik nie usunie konta

---

## Unresolved Issues

### 1. Onboarding Flow dla Celu Kalorycznego
**Status:** Częściowo rozwiązane

**Kontekst:** PRD wymaga aby po rejestracji użytkownik ustawił cel kaloryczny (US-004). Trigger tworzy domyślny cel 2000 kcal z `effective_from = CURRENT_DATE`.

**Pytanie:** Czy domyślny cel powinien mieć `effective_from = CURRENT_DATE` czy `CURRENT_DATE + 1`?

**Implikacja:** Jeśli użytkownik rejestruje się i od razu dodaje posiłek tego samego dnia, cel już istnieje. Ale wszystkie kolejne cele mają `effective_from = CURRENT_DATE + 1`. Potencjalna niespójność.

**Rekomendacja:** Wyjaśnić z PM/Frontend czy:
- Domyślny cel ma `effective_from = CURRENT_DATE` (wyjątek od reguły)
- Czy po onboardingu użytkownik ustawia własny cel z `effective_from = CURRENT_DATE` (nadpisując domyślny)

### 2. Edycja Daty Posiłku
**Status:** Nierozwiązane

**Kontekst:** Użytkownik nie może dodawać posiłków z przyszłą datą. Ale PRD (US-012) mówi o edycji posiłku.

**Pytanie:** Czy podczas edycji użytkownik może zmienić datę posiłku? Jeśli tak, czy obowiązuje ten sam constraint (nie przyszłe daty)?

**Implikacja:** Frontend musi zablokować zmianę daty na przyszłą, lub backend musi walidować.

**Rekomendacja:** Dodać do walidacji aplikacji check przy UPDATE meals.

### 3. Timezone Handling dla Daily Aggregations
**Status:** Akceptowalne dla MVP, ale możliwy problem

**Kontekst:** VIEW daily_progress grupuje po `DATE(meal_timestamp)` w UTC. Użytkownik w strefie UTC+2 dodający posiłek o 00:30 lokalnie (22:30 UTC poprzedniego dnia) zobaczy go w poprzednim dniu.

**Pytanie:** Czy akceptowalne dla MVP? Czy potrzebna kolumna `user_timezone` w profiles?

**Implikacja:** Może mylić użytkowników w skrajnych przypadkach (posiłki póznym wieczorem).

**Rekomendacja:** Monitorować feedback użytkowników w MVP. Jeśli problem - dodać timezone preference i refaktorować VIEW.

### 4. Rate Limiting dla AI Calls
**Status:** Poza zakresem bazy danych

**Kontekst:** Baza danych śledzi `input_method`, ale nie limituje liczby wywołaD AI.

**Pytanie:** Czy implementować rate limiting na poziomie bazy (kolumna licznik + reset timestamp)?

**Implikacja:** Potencjalne nadużycia kosztują (Openrouter.ai).

**Rekomendacja:** Najprawdopodobniej implementować na poziomie Edge Functions/API, nie bazy. Wyjaśnić z backend team.

### 5. Soft Delete dla Error Logs
**Status:** Nierozstrzygnięte

**Kontekst:** Error logs mają automatyczne czyszczenie po 90 dniach (hard delete).

**Pytanie:** Czy wystarczy hard delete, czy potrzebne archiwizowanie dla długoterminowej analizy?

**Implikacja:** Stracone dane mogą być przydatne dla pattern analysis.

**Rekomendacja:** Dla MVP hard delete wystarczy. W przyszłości można eksportować do external logging service (Sentry, CloudWatch) przed usunięciem.

### 6. Concurrent Edits na tym samym Posiłku
**Status:** swiadomie pominięte dla MVP

**Kontekst:** Brak optimistic locking. Jeśli użytkownik edytuje ten sam posiłek w dwóch oknach, ostatni zapis wygrywa (last write wins).

**Pytanie:** Czy to problem dla MVP?

**Implikacja:** Rzadki edge case, ale możliwe przypadkowe nadpisanie danych.

**Rekomendacja:** Monitorować czy się zdarza. Jeśli tak - dodać kolumnę `version` i sprawdzać w UPDATE.

---

## Diagram Relacji (ERD)

```
auth.users (Supabase)
    1:1
profiles
    1:N
    1:N meals
    1:N calorie_goals
    1:N error_logs (nullable)
```

---

## Next Steps

1. **Utworzyć migracje** - według kolejności określonej w sekcji "Migracje i Deployment"
2. **Przetestować triggery** - szczególnie handle_new_user przy rejestracji
3. **Zweryfikować RLS policies** - upewnić się że izolacja działa poprawnie
4. **Wyjaśnić nierozwiązane kwestie** - szczególnie onboarding flow i timezone handling
5. **Utworzyć seed data** - dla środowiska dev/staging
6. **Przygotować dokumentację API** - dla frontend team (endpointy Supabase)


