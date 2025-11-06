# Plan czyszczenia migracji RLS

## ✅ STATUS: ZAKOŃCZONE (2025-02-06)

Wszystkie stare migracje zostały usunięte. Ten dokument służy tylko jako dokumentacja historyczna.

## Data

2025-02-06

## Cel

Zastąpienie 10 chaotycznych migracji RLS jedną, czystą, konsolidującą migracją.

## Migracje do usunięcia

Poniższe migracje są przestarzałe i zostaną zastąpione przez `20250206000000_consolidated_rls_setup.sql`:

### 1. Oryginalne migracje RLS (zachować!)

- ✅ `20250127110500_create_functions.sql` - **ZACHOWAĆ** (funkcja handle_new_user)
- ✅ `20250127110600_create_triggers.sql` - **ZACHOWAĆ** (trigger on_auth_user_created)

### 2. Chaotyczne migracje RLS (usunąć!)

- ❌ `20250127110800_setup_rls_policies.sql` - pierwsze włączenie RLS (zastąpione przez consolidated)
- ❌ `20250127111000_disable_rls_policies.sql` - wyłączenie polityk (dev workaround)
- ❌ `20250127111100_disable_rls.sql` - całkowite wyłączenie RLS (dev workaround)
- ❌ `20250129120000_temp_disable_trigger.sql` - wyłączenie triggera (tymczasowe)
- ❌ `20250204120000_update_profile_trigger.sql` - zmiana architektury (niepotrzebna)
- ❌ `20250205000000_enable_rls_security.sql` - ponowne włączenie RLS (duplikat)
- ❌ `20250205000100_re_enable_user_trigger.sql` - przywrócenie triggera (duplikat)
- ❌ `20250205000200_fix_rls_for_registration.sql` - próba #1 (service_role - nieudana)
- ❌ `20250205000300_fix_trigger_rls.sql` - próba #2 (set role postgres - nieudana)
- ❌ `20250205000400_fix_trigger_rls_v2.sql` - finalne rozwiązanie (scalone do consolidated)

## Nowa konsolidująca migracja

✅ `20250206000000_consolidated_rls_setup.sql` - czysta, skonsolidowana konfiguracja RLS

### Co zawiera:

1. Włączenie RLS na wszystkich tabelach
2. Polityki SELECT/UPDATE/DELETE wymagające `auth.uid()` (izolacja danych)
3. Permisywne polityki INSERT dla `profiles` i `calorie_goals` (dla triggera)
4. Pełna dokumentacja i komentarze
5. Notatki bezpieczeństwa

## Instrukcje migracji

### Opcja A: Świeża baza danych (ZALECANE)

Jeśli jesteś w fazie development i możesz zresetować bazę:

```bash
# 1. Usuń stare migracje
rm supabase/migrations/20250127110800_setup_rls_policies.sql
rm supabase/migrations/20250127111000_disable_rls_policies.sql
rm supabase/migrations/20250127111100_disable_rls.sql
rm supabase/migrations/20250129120000_temp_disable_trigger.sql
rm supabase/migrations/20250204120000_update_profile_trigger.sql
rm supabase/migrations/20250205000000_enable_rls_security.sql
rm supabase/migrations/20250205000100_re_enable_user_trigger.sql
rm supabase/migrations/20250205000200_fix_rls_for_registration.sql
rm supabase/migrations/20250205000300_fix_trigger_rls.sql
rm supabase/migrations/20250205000400_fix_trigger_rls_v2.sql

# 2. Przenieś do archiwum (opcjonalnie, dla historii)
mkdir -p .ai/archive/old-rls-migrations
git mv supabase/migrations/2025012711*.sql .ai/archive/old-rls-migrations/
git mv supabase/migrations/2025012912*.sql .ai/archive/old-rls-migrations/
git mv supabase/migrations/2025020412*.sql .ai/archive/old-rls-migrations/
git mv supabase/migrations/2025020500*.sql .ai/archive/old-rls-migrations/

# 3. Zresetuj bazę i zaaplikuj migracje od nowa
npx supabase db reset

# 4. Przetestuj rejestrację
npm run dev
# Zarejestruj nowego użytkownika i sprawdź czy:
# - Użytkownik został utworzony
# - Profil został automatycznie utworzony
# - Domyślny cel kaloryczny (2000 kcal) został utworzony
# - Użytkownik widzi tylko swoje dane
```

### Opcja B: Produkcja lub baza z danymi (OSTROŻNIE)

Jeśli masz już dane produkcyjne i nie możesz zresetować bazy:

```bash
# 1. Utwórz backup
npx supabase db dump -f backup-before-rls-cleanup.sql

# 2. Utwórz migrację cleanup, która najpierw usuwa stare polityki
# (ta migracja jest już przygotowana jako 20250206000001_cleanup_old_rls.sql)

# 3. Zaaplikuj nowe migracje
npx supabase db push

# 4. Przetestuj dokładnie na staging przed produkcją!
```

## Weryfikacja po migracji

Uruchom następujące testy:

### 1. Rejestracja nowego użytkownika

```sql
-- Sprawdź czy profil został utworzony automatycznie
SELECT * FROM profiles WHERE id = '<new_user_id>';

-- Sprawdź czy domyślny cel kaloryczny został utworzony
SELECT * FROM calorie_goals WHERE user_id = '<new_user_id>';
```

### 2. Izolacja danych (RLS działa)

```sql
-- Zaloguj się jako user_1
SELECT * FROM meals; -- powinien widzieć tylko swoje posiłki

-- Spróbuj uzyskać dostęp do danych user_2 (powinno zwrócić 0 wyników)
SELECT * FROM meals WHERE user_id = '<user_2_id>';
```

### 3. CRUD operations

```sql
-- INSERT (authenticated user może dodać swój posiłek)
INSERT INTO meals (user_id, ...) VALUES (auth.uid(), ...);

-- UPDATE (authenticated user może zaktualizować swój posiłek)
UPDATE meals SET ... WHERE id = '<own_meal_id>';

-- DELETE (authenticated user może usunąć swój posiłek)
DELETE FROM meals WHERE id = '<own_meal_id>';

-- SELECT (authenticated user widzi tylko swoje dane)
SELECT * FROM meals;
```

## Stan końcowy

Po migracji struktura folderów `supabase/migrations` będzie wyglądać następująco:

```
supabase/migrations/
├── 20250127110000_create_enums.sql
├── 20250127110100_create_profiles.sql
├── 20250127110200_create_calorie_goals.sql
├── 20250127110300_create_meals.sql
├── 20250127110350_create_ai_generations.sql
├── 20250127110400_create_error_logs.sql
├── 20250127110500_create_functions.sql
├── 20250127110600_create_triggers.sql
├── 20250127110700_create_views.sql
├── 20250206000000_consolidated_rls_setup.sql  ← NOWA migracja
└── (stare migracje RLS usunięte lub w archiwum)
```

## Notatki

- ✅ Nowa migracja jest czysta, dobrze udokumentowana i zawiera tylko działające rozwiązanie
- ✅ Usunięto wszystkie nieudane próby (service_role, set role postgres)
- ✅ Zachowano tylko finalną, działającą konfigurację (permisywne INSERT policies)
- ✅ Wszystkie security concerns są udokumentowane w komentarzach
- ✅ Architektura jest prosta: trigger + permisywne INSERT + strict SELECT/UPDATE/DELETE

## Dodatkowe zasoby

- [Supabase RLS docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Dokumentacja problemu: `.ai/rls-trigger-issue-resolution.md`
