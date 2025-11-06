# Kandydaci do unit testów - AddMeal i związane moduły

Analiza na podstawie struktury komponentów z `components_structure.md`

---

## ⭐ PRIORYTET WYSOKI - Pure Functions (Helpers & Utils)

### 1. `src/lib/helpers/meal-form.utils.ts` ⭐⭐⭐

**Dlaczego testować:**

- Pure functions - deterministyczne, łatwe do testowania
- Kluczowa logika biznesowa - obliczenia kalorii i walidacja makroskładników
- Używane w wielu miejscach (hook, komponenty)
- Brak zależności zewnętrznych (brak API, brak DOM)
- Matematyka i logika - łatwo o błędy przy edge cases

**Funkcje do przetestowania:**

#### `calculateMacroCalories(protein, carbs, fats)`

- ✅ Przypadek: wszystkie wartości null → zwraca 0
- ✅ Przypadek: tylko białko (25g) → zwraca 100 kcal
- ✅ Przypadek: tylko węglowodany (50g) → zwraca 200 kcal
- ✅ Przypadek: tylko tłuszcze (20g) → zwraca 180 kcal
- ✅ Przypadek: wszystkie makro (25g/50g/20g) → zwraca 480 kcal
- ✅ Przypadek: wartości dziesiętne (25.5g/50.2g/20.1g) → zaokrągla prawidłowo
- ✅ Edge: ujemne wartości (nie powinny być przekazywane, ale lepiej obsłużyć)
- ✅ Edge: bardzo duże wartości (1000g każdego)

#### `calculateMacroDifference(calculated, provided)`

- ✅ Przypadek: identyczne wartości (500, 500) → zwraca 0
- ✅ Przypadek: 5% różnica (500, 525) → zwraca ~0.05
- ✅ Przypadek: 10% różnica (500, 550) → zwraca 0.10
- ✅ Edge: provided = 0 → zwraca 0 (zabezpieczenie przed dzieleniem przez 0)
- ✅ Edge: ujemna różnica (525, 500) → zwraca wartość bezwzględną
- ✅ Edge: bardzo mała różnica (0.1%) → precyzja obliczeń

#### `detectCategoryFromTime(time)`

- ✅ Przypadek: "07:30" → "breakfast"
- ✅ Przypadek: "09:59" → "breakfast"
- ✅ Przypadek: "10:00" → null (poza zakresem)
- ✅ Przypadek: "12:00" → "lunch"
- ✅ Przypadek: "14:30" → "lunch"
- ✅ Przypadek: "15:00" → null
- ✅ Przypadek: "18:00" → "dinner"
- ✅ Przypadek: "20:59" → "dinner"
- ✅ Przypadek: "21:00" → null
- ✅ Edge: "05:00" (wczesny ranek) → null
- ✅ Edge: "23:30" (późna noc) → null
- ✅ Edge: "invalid" → null (zabezpieczenie)
- ✅ Edge: "" (pusty string) → null

#### `formatPercentDifference(difference)`

- ✅ Przypadek: 0.05 → "5%"
- ✅ Przypadek: 0.15 → "15%"
- ✅ Przypadek: 0.005 → "1%" (zaokrąglenie w dół)
- ✅ Przypadek: 0.006 → "1%" (zaokrąglenie w górę)
- ✅ Edge: 0 → "0%"
- ✅ Edge: 1.0 → "100%"

#### `getCurrentDate()` i `getCurrentTime()`

- ⚠️ Trudniejsze do testowania (zależne od czasu systemowego)
- ✅ Test: weryfikacja formatu zwracanego stringa (YYYY-MM-DD, HH:MM)
- ✅ Test: mockowanie Date.now() do testowania konkretnych dat
- ✅ Test: padding zer (miesiące 1-9, dni 1-9)

#### `getDaysDifference(date1, date2)`

- ✅ Przypadek: ta sama data → 0 dni
- ✅ Przypadek: różnica 1 dzień → 1
- ✅ Przypadek: różnica 7 dni → 7
- ✅ Przypadek: różnica w różnych miesiącach → poprawna liczba dni
- ✅ Edge: data1 < date2 vs data2 < date1 → wartość bezwzględna
- ✅ Edge: różnica lat → poprawna liczba dni

---

### 2. `src/lib/validation/meal-form.validation.ts` ⭐⭐⭐

**Dlaczego testować:**

- Krytyczna logika walidacji - błędy mogą pozwolić na przesłanie złych danych
- Pure functions - łatwe do testowania
- Dużo edge cases (granice, formaty, null values)
- Używane zarówno w frontend jak i potencjalnie backend
- Komunikaty błędów muszą być spójne

**Funkcje do przetestowania:**

#### `validatePrompt(prompt)`

- ✅ Przypadek: pusty string → error "Opis posiłku jest wymagany"
- ✅ Przypadek: tylko spacje " " → error (trim)
- ✅ Przypadek: poprawny prompt (3+ znaków) → null
- ✅ Przypadek: 500 znaków (max) → null
- ✅ Przypadek: 501 znaków → error "Maksymalnie 500 znaków"
- ✅ Edge: emoji w promptcie → poprawnie liczy znaki

#### `validateDescription(description)`

- ✅ Przypadek: pusty string → error
- ✅ Przypadek: tylko spacje → error
- ✅ Przypadek: poprawny opis → null
- ✅ Przypadek: 500 znaków → null
- ✅ Przypadek: 501 znaków → error
- ✅ Edge: znaki specjalne (🍕) → poprawnie liczy

#### `validateCalories(calories)`

- ✅ Przypadek: null → error "Kalorie są wymagane"
- ✅ Przypadek: undefined → error
- ✅ Przypadek: 1 (min) → null
- ✅ Przypadek: 500 (mid) → null
- ✅ Przypadek: 10000 (max) → null
- ✅ Przypadek: 0 → error "Minimalna wartość to 1 kcal"
- ✅ Przypadek: 10001 → error "Maksymalna wartość to 10000 kcal"
- ✅ Przypadek: 500.5 (float) → error "Wartość musi być liczbą całkowitą"
- ✅ Edge: -5 (ujemne) → error
- ✅ Edge: NaN → error
- ✅ Edge: Infinity → error

#### `validateMacro(value, field)`

- ✅ Przypadek: null → null (opcjonalne)
- ✅ Przypadek: undefined → null
- ✅ Przypadek: 0 (min) → null
- ✅ Przypadek: 50.5 (float) → null (dozwolone dla makro)
- ✅ Przypadek: 1000 (max) → null
- ✅ Przypadek: -5 → error "Wartość nie może być ujemna"
- ✅ Przypadek: 1001 → error "Maksymalna wartość to 1000g"
- ✅ Edge: NaN → error "Wartość musi być liczbą"
- ✅ Edge: "25" (string) → error (type check)

#### `validateDate(date)`

- ✅ Przypadek: dzisiejsza data → null
- ✅ Przypadek: wczoraj → null
- ✅ Przypadek: 7 dni temu → null
- ✅ Przypadek: 8 dni temu → warning type "old"
- ✅ Przypadek: jutro → error type "future"
- ✅ Przypadek: za tydzień → error type "future"
- ⚠️ Wymaga mockowania getCurrentDate()

#### `validateTime(time)`

- ✅ Przypadek: "08:30" → null
- ✅ Przypadek: "00:00" → null
- ✅ Przypadek: "23:59" → null
- ✅ Przypadek: "24:00" → error (nieprawidłowy format)
- ✅ Przypadek: "8:30" → error (brak leading zero)
- ✅ Przypadek: "08:60" → error (minuty > 59)
- ✅ Przypadek: "invalid" → error
- ✅ Edge: "" → error

#### `validateAIGenerationId(id)`

- ✅ Przypadek: null → error "Brak ID generacji AI"
- ✅ Przypadek: "" → error
- ✅ Przypadek: "valid-uuid" → null
- ✅ Edge: undefined → error

---

### 3. `src/lib/helpers/macronutrient-validator.ts` ⭐⭐⭐

**Dlaczego testować:**

- Logika biznesowa - konsystencja danych żywieniowych
- Pure functions
- Używane w backend przy tworzeniu/edycji posiłków
- Wpływa na input_method tracking

**Funkcje do przetestowania:**

#### `validateMacronutrients(calories, protein, carbs, fats)`

- ✅ Przypadek: brak makro (null) → [] (brak ostrzeżeń)
- ✅ Przypadek: tylko białko → [] (nie waliduje bez pełnych danych)
- ✅ Przypadek: wszystkie makro, zgodne kalorie (420, 18.5, 25, 28) → []
- ✅ Przypadek: różnica <5% → [] (brak ostrzeżenia)
- ✅ Przypadek: różnica =5% → [] (na granicy)
- ✅ Przypadek: różnica >5% (650, 45, 70, 15) → warning
- ✅ Przypadek: różnica znacząca (500, 100, 100, 10) → warning
- ✅ Edge: kalorie = 0 → nie dzieli przez 0
- ✅ Test: treść komunikatu ostrzeżenia zawiera obie wartości kalorii

#### `shouldChangeToAIEdited(currentMeal, updateData)`

- ✅ Przypadek: input_method = "ai", zmiana calories → true
- ✅ Przypadek: input_method = "ai", zmiana description → true
- ✅ Przypadek: input_method = "ai", zmiana protein → true
- ✅ Przypadek: input_method = "ai", zmiana carbs → true
- ✅ Przypadek: input_method = "ai", zmiana fats → true
- ✅ Przypadek: input_method = "ai", zmiana tylko category → false
- ✅ Przypadek: input_method = "ai", zmiana tylko meal_timestamp → false
- ✅ Przypadek: input_method = "manual", zmiana calories → false
- ✅ Przypadek: input_method = "ai-edited", zmiana calories → false
- ✅ Przypadek: input_method = "ai", brak zmian → false
- ✅ Edge: updateData pusty {} → false

---

### 4. `src/lib/helpers/date-formatter.ts` ⭐⭐

**Dlaczego testować:**

- Pure functions (większość)
- Różne formaty dat - łatwo o błędy
- Lokalizacja (pl-PL) - trzeba sprawdzić czy działa
- Używane w wielu miejscach w UI

**Funkcje do przetestowania:**

#### `createDateFormatter().format(date, format)`

- ✅ Format "YYYY-MM-DD": new Date("2025-01-27") → "2025-01-27"
- ✅ Format "full": weryfikacja polskich nazw dni/miesięcy
- ✅ Format "short": weryfikacja skrótów
- ✅ Format "time": "08:30" format
- ✅ Edge: różne strefy czasowe
- ✅ Edge: przekazanie stringa vs Date object

#### `parseAPIDate(date)` i `toAPIFormat(date)`

- ✅ Konwersja tam i z powrotem daje tę samą datę
- ✅ Format zgodny z YYYY-MM-DD

---

### 5. `src/lib/helpers/status-colors.ts` ⭐

**Dlaczego testować:**

- Proste funkcje lookup
- Niski priorytet, ale można łatwo przetestować
- Sprawdzenie kompletności (wszystkie statusy mają kolory)

**Funkcje do przetestowania:**

#### `getStatusColor(status)`, `getStatusBgClass(status)`, etc.

- ✅ Każdy status ma zdefiniowany kolor
- ✅ Zwracana wartość nie jest null/undefined
- ✅ Test: wszystkie możliwe statusy (under, at_goal, over, no_goal)

---

## ⭐ PRIORYTET ŚREDNI - Hooks (z mockowaniem)

### 6. `src/hooks/useAddMealForm.ts` ⭐⭐

**Dlaczego testować:**

- Złożona logika biznesowa
- State management - łatwo o błędy
- Wiele interakcji między funkcjami
- Używa innych modułów (helpers, validation)

**Wyzwania:**

- Wymaga React Testing Library (renderHook)
- Mockowanie fetch API
- Testowanie efektów ubocznych (setState, setTimeout)

**Co testować:**

#### State initialization

- ✅ Initial state with initialDate
- ✅ Initial state without initialDate (uses current date)

#### Mode switching

- ✅ `switchToManual(false)` - zmienia mode, kopiuje aiPrompt do description
- ✅ `switchToManual(true)` - prepopuluje z aiResult
- ✅ `switchToAI()` - zmienia mode, kopiuje description do aiPrompt
- ✅ `setMode()` - wrapper na powyższe

#### Field updates

- ✅ `updateField("calories", 500)` - aktualizuje state
- ✅ Auto-calculate macro warning przy zmianie calories/macros
- ✅ Auto-validate date przy zmianie date
- ✅ Auto-detect category przy zmianie time
- ✅ Czyszczenie validation errors przy zmianie pól

#### AI Generation

- ✅ `generateAI()` - sukces, ustawia aiResult
- ✅ `generateAI()` - błąd walidacji promptu
- ✅ `generateAI()` - błąd API (status 500)
- ✅ `generateAI()` - rate limit (status 429)
- ✅ `acceptAIResult()` - prepopuluje formularz

#### Form validation

- ✅ `validateForm()` - AI mode bez aiResult → error
- ✅ `validateForm()` - Manual mode bez description → error
- ✅ `validateForm()` - Manual mode bez calories → error
- ✅ `validateForm()` - Future date → error
- ✅ `validateForm()` - wszystkie pola OK → true

#### Submit

- ✅ `submitMeal()` - AI mode - POST z ai_generation_id
- ✅ `submitMeal()` - Manual mode - POST z input_method: "manual"
- ✅ `submitMeal()` - Edit mode - PATCH request
- ✅ `submitMeal()` - błąd walidacji (status 400)
- ✅ `submitMeal()` - meal not found (status 404)

#### Load for edit

- ✅ `loadMealForEdit(mealId)` - sukces, parsuje timestamp
- ✅ `loadMealForEdit(mealId)` - ustawia mode based on input_method
- ✅ `loadMealForEdit(mealId)` - błąd 404

⚠️ **Uwaga:** Testy hooka są bardziej skomplikowane i czasochłonne. Warto zacząć od pure functions.

---

## ⭐ PRIORYTET NISKI - Komponenty React

### 7. React Components (UI logic tests)

**Dlaczego NIE priorytetowe:**

- UI komponenty lepiej testować przez E2E (Playwright)
- Unit testy komponentów często testują implementację, nie zachowanie
- Wymaga React Testing Library + dużo setupu
- Komponenty są głównie presentational (mała logika)

**Jeśli jednak testować:**

#### `CharacterCounter.tsx`

- ✅ Kolor zmienia się przy 90%+ usage
- ✅ Kolor zmienia się przy 98%+ usage
- ✅ Poprawnie formatuje liczby

#### `SegmentedControl.tsx`

- ✅ Wywołuje onChange przy kliknięciu
- ✅ Disabled state działa
- ✅ Poprawnie wyświetla selected state

#### `LoadingState.tsx`

- ✅ Wyświetla poprawny tekst dla stage 0, 1, 2
- ✅ Poprawna liczba kropek postępu

⚠️ **Rekomendacja:** Te testy lepiej zrobić w E2E, gdzie przetestujemy cały flow użytkownika.

---

## 🔧 PRIORYTET NISKI - Services (wymagają mocków)

### 8. `src/lib/services/*.service.ts`

**Dlaczego testować:**

- Logika biznesowa w serwisach
- Interakcje z bazą danych (Supabase)
- Rate limiting logic

**Wyzwania:**

- Wymaga mockowania Supabase client
- Wymaga mockowania transaction logic
- Integration tests > unit tests dla serwisów

**Przykłady:**

#### `rate-limit.service.ts`

- ✅ Tworzy nowy limit jeśli nie istnieje
- ✅ Zwiększa count przy kolejnych requestach
- ✅ Resetuje po upływie window_seconds
- ✅ Rzuca błąd przy przekroczeniu limitu

⚠️ **Rekomendacja:** Te testy lepiej zrobić jako integration tests z testową bazą danych.

---

## 📊 Podsumowanie priorytetów

### 🥇 ZACZYNAMY OD (Quick Wins):

1. **meal-form.utils.ts** - 8 funkcji, pure, zero dependencies
2. **meal-form.validation.ts** - 7 funkcji, pure, proste edge cases
3. **macronutrient-validator.ts** - 2 funkcje, ważna logika biznesowa
4. **date-formatter.ts** - formatowanie dat, lokalizacja

**Szacowany czas:** 4-6 godzin na pełne pokrycie z edge cases

### 🥈 NASTĘPNIE (Medium Effort):

5. **useAddMealForm hook** - complex logic, ale wysoką wartość testów
6. **status-colors.ts** - proste, ale niski ROI

**Szacowany czas:** 8-12 godzin (głównie hook)

### 🥉 OPCJONALNIE (E2E lepszy wybór):

7. React Components - CharacterCounter, SegmentedControl, LoadingState
8. Services - rate-limit, meals, ai-generation

**Szacowany czas:** 16+ godzin

---

## 🎯 Korzyści z testowania pure functions (priorytet wysoki):

1. **Szybkie wykonanie** - brak async, brak mocków, brak DOM
2. **Łatwe debugowanie** - deterministyczne wyniki
3. **Wysoka pewność** - jeśli test przechodzi, kod działa
4. **Dokumentacja** - testy są dokumentacją edge cases
5. **Refactoring safety** - można bezpiecznie zmieniać implementację
6. **Łatwe do napisania** - proste asserty (expect(fn(input)).toBe(output))

## 🚨 Dlaczego NIE testować wszystkiego:

1. **UI Components** - lepiej przez E2E, bo testujemy user behavior nie implementację
2. **Services z DB** - lepiej przez integration tests z testową bazą
3. **API Routes** - lepiej przez E2E lub API integration tests
4. **Hooki z side effects** - high maintenance cost, medium value

---

## 📝 Rekomendowany plan działania:

### Faza 1: Foundation (Tydzień 1)

```
✅ meal-form.utils.ts (wszystkie funkcje)
✅ meal-form.validation.ts (wszystkie funkcje)
✅ macronutrient-validator.ts (obie funkcje)
```

### Faza 2: Extended (Tydzień 2)

```
✅ date-formatter.ts
✅ status-colors.ts
✅ useAddMealForm (podstawowe scenariusze)
```

### Faza 3: E2E Coverage (Tydzień 3-4)

```
✅ Playwright tests dla całego flow AddMeal
✅ Testy API endpoints
✅ Integration tests dla services
```

---

## 🛠️ Setup testów (Vitest)

Już masz skonfigurowany Vitest (vitest.config.ts), więc możesz zacząć:

```typescript
// src/lib/helpers/__tests__/meal-form.utils.test.ts
import { describe, it, expect } from "vitest";
import { calculateMacroCalories } from "../meal-form.utils";

describe("calculateMacroCalories", () => {
  it("returns 0 when all values are null", () => {
    expect(calculateMacroCalories(null, null, null)).toBe(0);
  });

  it("calculates calories from protein only (25g = 100 kcal)", () => {
    expect(calculateMacroCalories(25, null, null)).toBe(100);
  });

  // ... więcej testów
});
```

---

## 📈 Metryki sukcesu:

- **Pokrycie kodu:** 80%+ dla helpers i validation
- **Pokrycie edge cases:** 100% znanych przypadków brzegowych
- **Czas wykonania:** <1s dla wszystkich unit testów
- **Maintainability:** 0 false positives, łatwe do aktualizacji

---

## ✅ Checklist przed rozpoczęciem:

- [ ] Vitest skonfigurowany i działa (`npm test`)
- [ ] Utworzony folder `src/lib/helpers/__tests__/`
- [ ] Utworzony folder `src/lib/validation/__tests__/`
- [ ] Przeczytane best practices dla Vitest
- [ ] Zdecydowane naming convention (`.test.ts` vs `.spec.ts`)

---

**Ostateczna rekomendacja:**

Zacznij od **meal-form.utils.ts** i **meal-form.validation.ts** - to da Ci największy ROI przy najmniejszym wysiłku. Po tym dodaj testy dla **macronutrient-validator.ts**. Te trzy pliki to fundament logiki AddMeal i dadzą Ci ~70% pewności że core functionality działa poprawnie.

Resztę (UI, services, hooki) zostaw na E2E testy lub integration tests, gdzie przetestujesz rzeczywiste user flows zamiast implementacji.
