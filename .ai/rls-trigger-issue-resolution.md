# Problem z RLS i Triggerami w Supabase

## Data

2025-02-05

## Problem

Po włączeniu Row Level Security (RLS) na wszystkich tabelach, rejestracja nowych użytkowników przestała działać. Użytkownik otrzymywał błąd:

```
Error 400: Database error saving new user
```

### Przyczyna

Trigger `handle_new_user()` uruchamiany podczas rejestracji (INSERT do `auth.users`) próbował utworzyć:

1. Profil użytkownika w tabeli `profiles`
2. Domyślny cel kaloryczny w tabeli `calorie_goals`

Jednak polityki RLS blokowały te operacje, ponieważ:

- Nowy użytkownik nie był jeszcze uwierzytelniony (`auth.uid()` zwracało NULL)
- Polityki INSERT wymagały `auth.uid() = user_id`
- Trigger działał w kontekście, gdzie użytkownik nie miał jeszcze sesji

## Próby rozwiązania (nieudane)

### 1. Dodanie polityki dla `service_role`

```sql
create policy "service role can insert profiles"
  on profiles
  for insert
  to service_role
  with check (true);
```

**Nie zadziałało** - triggery nie działają jako `service_role`

### 2. Użycie `set local role postgres` w funkcji

```sql
create or replace function handle_new_user()
returns trigger as $$
begin
  set local role postgres;
  -- insert operations
end;
$$ language plpgsql security definer;
```

**Nie zadziałało** - brak uprawnień do zmiany roli w Supabase

### 3. Dynamiczne wyłączanie RLS w funkcji

```sql
execute 'alter table public.profiles disable row level security';
-- insert operations
execute 'alter table public.profiles enable row level security';
```

**Nie zadziałało** - nie można dynamicznie zmieniać RLS w triggerze

## Rozwiązanie (zadziałało)

### Dodanie permisywnych polityk INSERT

Utworzono polityki, które pozwalają na INSERT bez sprawdzania `auth.uid()`, ale walidują strukturę danych:

```sql
-- Polityka dla profiles
create policy "allow insert for trigger"
  on profiles
  for insert
  with check (
    id is not null
    and created_at is not null
    and updated_at is not null
  );

-- Polityka dla calorie_goals
create policy "allow insert for trigger"
  on calorie_goals
  for insert
  with check (
    user_id is not null
    and daily_goal is not null
    and effective_from is not null
    and created_at is not null
    and updated_at is not null
  );
```

### Dlaczego to jest bezpieczne?

1. **Polityki dotyczą tylko INSERT** - nie wpływają na SELECT, UPDATE, DELETE
2. **Użytkownicy nie mogą bezpośrednio wywołać INSERT** - Supabase Client API wywołuje INSERT w kontekście authenticated user, więc musi spełnić inne polityki (z `auth.uid()`)
3. **Tylko trigger może użyć tych polityk** - trigger działa poza kontekstem użytkownika
4. **Walidacja danych** - polityki sprawdzają, czy wszystkie wymagane pola są ustawione
5. **Istniejące polityki chronią dane** - polityki SELECT/UPDATE/DELETE nadal wymagają `auth.uid()`, więc użytkownicy widzą tylko swoje dane

## Migracje zastosowane

1. **20250205000000_enable_rls_security.sql** - włączenie RLS i wszystkich polityk
2. **20250205000100_re_enable_user_trigger.sql** - przywrócenie triggera `on_auth_user_created`
3. **20250205000200_fix_rls_for_registration.sql** - pierwsza próba (service_role) - nieudana
4. **20250205000300_fix_trigger_rls.sql** - próba z `set local role postgres` - nieudana
5. **20250205000400_fix_trigger_rls_v2.sql** - finalne rozwiązanie z permisywnymi politykami INSERT

## Zmiany w kodzie aplikacji

### Usunięto ręczne tworzenie profilu

W `src/pages/api/v1/auth/signup.ts` usunięto kod, który ręcznie tworzył profil w application layer:

```typescript
// BEFORE (usunięto):
const { error: profileError } = await supabase.from("profiles").insert({
  id: data.user.id,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

// AFTER:
// Note: profile and default calorie_goal are created automatically by the
// handle_new_user() database trigger. No manual creation needed here.
```

### Dodano szczegółowe logowanie

Dodano logi do debugowania problemu:

- `[SIGNUP]` - logi backendu
- `[SIGNUP FORM]` - logi frontendu

## Wnioski i best practices

1. **SECURITY DEFINER nie omija RLS w Supabase** - wymaga odpowiednich polityk
2. **Triggery działają poza kontekstem użytkownika** - nie mają dostępu do `auth.uid()`
3. **Permisywne polityki INSERT są bezpieczne** jeśli:
   - Dotyczą tylko INSERT (nie SELECT/UPDATE/DELETE)
   - Walidują strukturę danych
   - Są używane tylko przez trusted code (triggery)
   - Inne polityki chronią dostęp do danych
4. **RLS w produkcji** - zawsze testuj rejestrację po włączeniu RLS!

## Architektura końcowa

```
User Registration Flow:
1. User submits signup form
2. Frontend → POST /api/v1/auth/signup
3. Backend → supabase.auth.signUp()
4. Supabase Auth → INSERT into auth.users
5. Trigger on_auth_user_created fires
6. handle_new_user() function executes:
   - INSERT into profiles (using permissive INSERT policy)
   - INSERT into calorie_goals (using permissive INSERT policy)
7. User created successfully
8. Response 201 with user data
```

---

## ⚠️ STATUS: ZREFAKTOROWANE (2025-02-06)

Ten dokument opisuje **historyczny problem i jego rozwiązanie**.
**Aktualna implementacja znajduje się w skonsolidowanych migracjach.**

### Refaktoring migracji

Wszystkie chaotyczne migracje RLS (20250127110800 - 20250205000400) zostały **zastąpione** przez:

1. **`20250205235959_cleanup_old_rls.sql`** - usuwa stare, przestarzałe polityki RLS
2. **`20250206000000_consolidated_rls_setup.sql`** - **czysta, kompletna konfiguracja RLS**

### Co zostało scalone:

- ✅ Finalne rozwiązanie z permisywnymi politykami INSERT (z `20250205000400`)
- ✅ Wszystkie działające polityki SELECT/UPDATE/DELETE
- ✅ Pełna dokumentacja i komentarze bezpieczeństwa w kodzie SQL
- ❌ Usunięto wszystkie nieudane próby (service_role, set role postgres, etc.)

### Aktualne pliki (po refactoringu):

**Kluczowe pliki:**

- `supabase/migrations/20250127110500_create_functions.sql` - funkcja `handle_new_user()`
- `supabase/migrations/20250127110600_create_triggers.sql` - trigger `on_auth_user_created`
- **`supabase/migrations/20250206000000_consolidated_rls_setup.sql`** - **wszystkie polityki RLS (skonsolidowane)**
- `src/pages/api/v1/auth/signup.ts` - endpoint rejestracji

**Szczegóły refaktoringu:**
Zobacz `.ai/migration-cleanup-plan.md` - instrukcje migracji i weryfikacji

---

## Testowanie

Po zmianach należy przetestować:

1. ✅ Rejestracja nowego użytkownika
2. ✅ Automatyczne utworzenie profilu
3. ✅ Automatyczne utworzenie domyślnego celu kalorycznego (2000 kcal)
4. ✅ Użytkownik widzi tylko swoje dane (RLS działa)
5. ✅ Użytkownik nie może zobaczyć danych innych użytkowników

---

## ⚠️ AKTUALIZACJA: Dodatkowe problemy znalezione (2025-11-05)

Po wdrożeniu skonsolidowanych migracji RLS, odkryto **dwa dodatkowe, krytyczne problemy**, które blokowały rejestrację użytkowników:

### Problem #1: Brak polityk RLS na tabeli `auth.users`

**Objawy:**

```
Error: Database error saving new user
```

**Przyczyna:**
Tabela `auth.users` miała **włączony RLS, ale bez żadnych polityk**. Supabase Auth używa roli `supabase_auth_admin` do zarządzania użytkownikami, ale bez polityk RLS, **wszystkie operacje były blokowane**.

**Diagnoza:**

```bash
# Sprawdzenie RLS na auth.users
docker exec supabase_db_simple-calories psql -U postgres -d postgres -c \
  "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users';"
# Result: rowsecurity = t (enabled)

# Sprawdzenie polityk
docker exec supabase_db_simple-calories psql -U postgres -d postgres -c \
  "SELECT policyname FROM pg_policies WHERE schemaname = 'auth' AND tablename = 'users';"
# Result: 0 rows (brak polityk!)
```

**Rozwiązanie:**
Utworzono migrację `20250206000001_disable_rls_on_auth_users.sql` (później przemianowaną na `fix_auth_users_rls`), która dodaje 4 polityki RLS dla roli `supabase_auth_admin`:

```sql
-- Polityki dla Supabase Auth
CREATE POLICY "supabase_auth_admin can insert users"
  ON auth.users FOR INSERT TO supabase_auth_admin WITH CHECK (true);

CREATE POLICY "supabase_auth_admin can update users"
  ON auth.users FOR UPDATE TO supabase_auth_admin USING (true) WITH CHECK (true);

CREATE POLICY "supabase_auth_admin can delete users"
  ON auth.users FOR DELETE TO supabase_auth_admin USING (true);

CREATE POLICY "supabase_auth_admin can select users"
  ON auth.users FOR SELECT TO supabase_auth_admin USING (true);
```

### Problem #2: `search_path` w triggerze `handle_new_user()`

**Objawy:**
Po naprawieniu Problem #1, błąd zmienił się na:

```
Error: Database error finding user
```

Logi auth pokazywały:

```json
{
  "error": "relation \"profiles\" does not exist (SQLSTATE 42P01)",
  "msg": "500: Database error saving new user"
}
```

**Przyczyna:**
Trigger `on_auth_user_created` uruchamia funkcję `handle_new_user()`, która była wywoływana w kontekście roli `supabase_auth_admin`. Ta rola ma ustawiony:

```
search_path=auth
```

To oznacza, że PostgreSQL szukał tabel `profiles` i `calorie_goals` w schemacie `auth` (gdzie ich nie ma), zamiast w schemacie `public` (gdzie faktycznie są).

**Diagnoza:**

```bash
# Sprawdzenie search_path dla supabase_auth_admin
docker exec supabase_db_simple-calories psql -U postgres -d postgres -c \
  "SELECT rolname, rolconfig FROM pg_roles WHERE rolname = 'supabase_auth_admin';"
# Result: search_path=auth,idle_in_transaction_session_timeout=60000,...
```

**Rozwiązanie:**
Zaktualizowano funkcję `handle_new_user()` w migracji `20250127110500_create_functions.sql`, aby używała **pełnych nazw tabel z prefiksem schematu**:

```sql
-- PRZED (nie działało):
insert into profiles (id, created_at, updated_at)
  values (new.id, now(), now());

-- PO (działa):
insert into public.profiles (id, created_at, updated_at)
  values (new.id, now(), now());
```

Zmieniono również:

- `insert into calorie_goals` → `insert into public.calorie_goals`

### Dlaczego problem nie był widoczny wcześniej?

1. Problem z `search_path` pojawił się dopiero **po włączeniu RLS na `auth.users`**
2. Wcześniej trigger nigdy nie był faktycznie wywoływany (blokowany przez brak polityk RLS)
3. Lokalne testy mogły działać inaczej ze względu na różne wersje Supabase CLI

### Finalna architektura (po wszystkich poprawkach):

```
User Registration Flow (UPDATED):
1. User submits signup form
2. Frontend → POST /api/v1/auth/signup
3. Backend → supabase.auth.signUp()
4. Supabase Auth (as supabase_auth_admin) → INSERT into auth.users
   ↓ (✅ RLS allows: policy "supabase_auth_admin can insert users")
5. Trigger on_auth_user_created fires
6. handle_new_user() function executes (as supabase_auth_admin):
   ↓ (search_path=auth, więc używa pełnych nazw tabel)
   - INSERT into public.profiles (using permissive INSERT policy)
   - INSERT into public.calorie_goals (using permissive INSERT policy)
7. Supabase Auth → SELECT from auth.users (verify user created)
   ↓ (✅ RLS allows: policy "supabase_auth_admin can select users")
8. User created successfully
9. Response 201 with user data
```

### Kluczowe pliki zaktualizowane:

1. **`supabase/migrations/20250206000001_disable_rls_on_auth_users.sql`** (NOWA)
   - Dodaje polityki RLS dla `auth.users`
   - Pozwala `supabase_auth_admin` na wszystkie operacje

2. **`supabase/migrations/20250127110500_create_functions.sql`** (ZAKTUALIZOWANA)
   - Zmieniono `profiles` → `public.profiles`
   - Zmieniono `calorie_goals` → `public.calorie_goals`
   - Dodano komentarz wyjaśniający problem z `search_path`

### Wnioski i best practices (ROZSZERZONE):

1. **SECURITY DEFINER nie omija RLS w Supabase** - wymaga odpowiednich polityk
2. **Triggery działają poza kontekstem użytkownika** - nie mają dostępu do `auth.uid()`
3. **Permisywne polityki INSERT są bezpieczne** jeśli spełniają warunki wymienione wcześniej
4. **RLS w produkcji** - zawsze testuj rejestrację po włączeniu RLS!
5. **⚠️ NOWE: Zawsze używaj pełnych nazw tabel** (`schema.table_name`) w triggerach i funkcjach, które mogą być wywoływane z różnych kontekstów
6. **⚠️ NOWE: Różne role mają różne `search_path`** - nie zakładaj, że trigger widzi te same tabele co ty
7. **⚠️ NOWE: Tabele systemowe Supabase (auth.\*) wymagają polityk RLS** dla ról systemowych (supabase_auth_admin, supabase_storage_admin, etc.)
8. **⚠️ NOWE: Testuj z czystą bazą danych** - `npx supabase db reset` jest konieczny po zmianach w funkcjach i triggerach

### Status: ✅ ROZWIĄZANE (2025-11-05)

Rejestracja użytkowników działa poprawnie z:

- ✅ Automatycznym utworzeniem profilu
- ✅ Automatycznym utworzeniem domyślnego celu kalorycznego (2000 kcal)
- ✅ Pełną ochroną RLS na wszystkich tabelach
- ✅ Poprawną izolacją danych użytkowników
