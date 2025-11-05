# E2E Tests - Quick Start Guide

## 🎯 Cel

Ten przewodnik pomoże Ci szybko uruchomić testy E2E dla scenariusza **TC-MEAL-001: Add Meal (Manual)**.

## ⚡ Szybki Start (5 minut)

### 1. Zainstaluj zależności

```bash
npm install
npx playwright install chromium
```

### 2. Sprawdź konfigurację `.env.test`

Upewnij się, że plik `.env.test` zawiera:

```env
SUPABASE_URL
SUPABASE_KEY
E2E_USERNAME
E2E_PASSWORD
E2E_USERNAME_ID
```

### 3. Uruchom dev server (w osobnym terminalu)

```bash
npm run dev
```

Poczekaj aż aplikacja wystartuje na `http://localhost:3000

### 4. Uruchom testy E2E

```bash
npm run test:e2e
```

### 5. Zobacz raport

```bash
npx playwright show-report
```

---

## 🎮 Interaktywne testowanie

### Tryb UI (zalecany dla developmentu)

```bash
npm run test:e2e:ui
```

**Zalety:**
- Wizualna lista testów
- Krok po kroku (step-by-step)
- Time travel debugging
- Watch mode

### Tryb Debug

```bash
npm run test:e2e:debug
```

**Zalety:**
- Breakpointy w kodzie
- Pause/Resume
- Inspect selectors

### Codegen (generowanie testów)

```bash
npm run test:e2e:codegen
```

**Note:** Generuje testy dla `http://localhost:3000

**Zalety:**
- Nagrywaj interakcje jako kod
- Szybkie tworzenie nowych testów

---

## 📝 Uruchom konkretny test

### Tylko TC-MEAL-001 (basic)

```bash
npx playwright test e2e/meals/add-meal.spec.ts
```

### Tylko advanced scenarios

```bash
npx playwright test e2e/meals/add-meal-advanced.spec.ts
```

### Konkretny test case

```bash
npx playwright test -g "should add meal manually and verify in DB"
```

---

## 🔍 Weryfikacja środowiska

### Test 1: Sprawdź połączenie z Supabase

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.test' });

const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
client.from('meals').select('count').then(res => {
  console.log('✅ Supabase connection OK');
}).catch(err => {
  console.error('❌ Supabase connection failed:', err.message);
});
"
```

### Test 2: Sprawdź dostępność aplikacji

```bash
curl http://localhost:3000
```

Powinno zwrócić HTML strony.

### Test 3: Test logowania

```bash
npx playwright test e2e/meals/add-meal.spec.ts -g "should add meal manually" --headed
```

Powinieneś zobaczyć:
1. Przeglądarka się otwiera
2. Auto-login do konta e2e@test.pl
3. Otwarcie modala "Dodaj posiłek"
4. Wypełnienie formularza
5. Potwierdzenie dodania

---

## 🐛 Troubleshooting

### Problem: "Timeout waiting for element"

**Rozwiązanie:**
1. Upewnij się, że dev server działa (`npm run dev`)
2. Sprawdź czy port 4321 jest dostępny
3. Uruchom test z `--headed` żeby zobaczyć co się dzieje

### Problem: "Supabase connection failed"

**Rozwiązanie:**
1. Sprawdź `.env.test` (poprawne credentials)
2. Sprawdź połączenie internetowe
3. Zweryfikuj czy test user istnieje w bazie

### Problem: "Login failed"

**Rozwiązanie:**
1. Sprawdź hasło w `.env.test` (E2E_PASSWORD)
2. Sprawdź czy user `e2e@test.pl` istnieje w Supabase Auth
3. Sprawdź czy user ma potwierdzony email

### Problem: "Test fails: meal not found in DB"

**Rozwiązanie:**
1. Sprawdź RLS policies (czy test user ma dostęp)
2. Sprawdź czy cleanup działa poprawnie
3. Uruchom test pojedynczo (bez parallel)

### Problem: "Cannot find module"

**Rozwiązanie:**
```bash
npm install
npx playwright install
```

---

## 📊 Oczekiwane wyniki

### ✅ Wszystkie testy przechodzą

```
Running 18 tests using 1 worker

✓ TC-MEAL-001: Add Meal (Manual) > should add meal manually and verify in DB (5s)
✓ TC-MEAL-001: Add Meal (Manual) > should add meal with minimal data (3s)
✓ TC-MEAL-001: Add Meal (Manual) > should add meal with category selection (3s)
...

18 passed (1m 30s)
```

### ⚠️ Niektóre testy failują

Sprawdź:
1. Czy dev server działa
2. Czy baza testowa jest dostępna
3. Czy test user ma poprawne uprawnienia

---

## 🎯 Następne kroki

Po uruchomieniu TC-MEAL-001, możesz:

1. ✅ Dodać testy dla TC-MEAL-004 (Edit Meal)
2. ✅ Dodać testy dla TC-MEAL-005 (Delete Meal)
3. ✅ Dodać testy dla TC-AI-001 (AI Generation)
4. ✅ Dodać testy dla TC-PROGRESS-001 (Daily Progress)

Zobacz: [e2e-test-candidates.md](../.ai/e2e-test-candidates.md)

---

## 📚 Dokumentacja

- **README:** [e2e/README.md](README.md) - pełna dokumentacja
- **Test Plan:** [.ai/test-plan.md](../.ai/test-plan.md) - ogólny plan testów
- **E2E Candidates:** [.ai/e2e-test-candidates.md](../.ai/e2e-test-candidates.md) - kandydaci do testów E2E
- **Playwright Docs:** https://playwright.dev

---

**Potrzebujesz pomocy?** Sprawdź [README.md](README.md) lub debugging section powyżej.
