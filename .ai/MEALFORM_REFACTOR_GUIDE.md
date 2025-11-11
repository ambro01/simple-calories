# MealForm Refactoring Guide

## 📁 Nowa Struktura Plików

### Serwisy (API Calls)
```
src/services/
├── meal.service.ts      - CRUD operations dla posiłków
├── ai.service.ts        - AI generation
├── password.service.ts  - Zmiana hasła
├── calorieGoal.service.ts - Cele kaloryczne
└── auth.service.ts      - Autentykacja
```

### Hooki pomocnicze (MealForm)
```
src/hooks/
├── useMealAI.ts         - AI generation logic (~90 linii)
├── useMealValidation.ts - Validation helpers (~120 linii)
└── useMealEdit.ts       - Edit mode logic (~90 linii)
```

### Zod Schemas
```
src/utils/validation/schemas.ts
├── manualMealSchema     - Walidacja manual mode
└── aiMealSchema         - Walidacja AI mode
```

---

## 🎯 Jak używać nowych hooków

### 1. useMealAI - AI Generation

```typescript
import { useMealAI } from "@/hooks/useMealAI";

function AIMode() {
  const {
    aiResult,       // AIGenerationResponseDTO | null
    aiLoading,      // boolean
    aiLoadingStage, // 0 | 1 | 2 (multi-stage loading)
    aiError,        // string | null
    generateAI,     // (prompt: string) => Promise<void>
    resetAI         // () => void
  } = useMealAI();

  // Generate AI result
  const handleGenerate = async () => {
    await generateAI("Jajecznica na 2 jajkach");
  };

  // Check if generation succeeded
  if (aiResult?.status === "completed") {
    console.log("Kalorie:", aiResult.generated_calories);
  }
}
```

**Funkcje:**
- `generateAI(prompt)` - generuje wynik AI, obsługuje rate limiting, multi-stage loading
- `resetAI()` - resetuje stan AI

**Stan:**
- `aiResult` - wynik generacji (null | completed | failed)
- `aiLoading` - czy trwa generowanie
- `aiLoadingStage` - etap ładowania (0-2) dla lepszego UX
- `aiError` - błąd (rate limit, network error, etc.)

---

### 2. useMealValidation - Validation Helpers

```typescript
import { useForm } from "react-hook-form";
import { useMealValidation } from "@/hooks/useMealValidation";
import { manualMealSchema } from "@/utils/validation/schemas";

function ManualMode() {
  const form = useForm<ManualMealFormData>({
    resolver: zodResolver(manualMealSchema),
  });

  const {
    macroWarning,          // MacroWarningInfo | null
    dateWarning,           // DateWarningInfo | null
    autoCalculateCalories, // () => void
    autoDetectCategory     // () => void
  } = useMealValidation(form);

  // Show macro warning
  if (macroWarning) {
    console.log(`Różnica: ${macroWarning.differencePercent * 100}%`);
    console.log(`Obliczone: ${macroWarning.calculatedCalories} kcal`);
    console.log(`Podane: ${macroWarning.providedCalories} kcal`);
  }

  // Auto-calculate calories from macros
  const handleAutoCalc = () => {
    autoCalculateCalories(); // Updates form.calories
  };

  // Auto-detect category based on time
  useEffect(() => {
    autoDetectCategory(); // Updates form.category if empty
  }, [form.watch("time")]);
}
```

**Funkcje:**
- `autoCalculateCalories()` - oblicza kalorie z makro i aktualizuje formularz
- `autoDetectCategory()` - wykrywa kategorię z czasu (jeśli pusta)

**Stan (reactive):**
- `macroWarning` - ostrzeżenie o różnicy kalorii vs makro (>10%)
- `dateWarning` - ostrzeżenie o dacie (przyszłość = blokuje, przeszłość = info)

---

### 3. useMealEdit - Edit Mode

```typescript
import { useMealEdit } from "@/hooks/useMealEdit";

function MealForm({ mealId, mode }) {
  const form = useForm<ManualMealFormData>();

  const {
    loadingMeal,      // boolean
    loadMealError,    // string | null
    loadMealForEdit   // (id, form, mode) => Promise<void>
  } = useMealEdit();

  // Load meal for editing
  useEffect(() => {
    if (mealId) {
      loadMealForEdit(mealId, form, mode)
        .catch(console.error);
    }
  }, [mealId]);

  // Show loading state
  if (loadingMeal) {
    return <LoadingOverlay />;
  }

  // Show error
  if (loadMealError) {
    return <Alert>{loadMealError}</Alert>;
  }
}
```

**Funkcje:**
- `loadMealForEdit(mealId, form, mode)` - ładuje posiłek i prepopuluje formularz

**Stan:**
- `loadingMeal` - czy trwa ładowanie
- `loadMealError` - błąd ładowania

---

## 🔧 Serwisy

### mealService

```typescript
import { mealService, ApiError } from "@/services/meal.service";

// Create meal
try {
  const meal = await mealService.createMeal({
    description: "Jajecznica",
    calories: 300,
    protein: 20,
    carbs: 10,
    fats: 18,
    category: "breakfast",
    input_method: "manual",
    meal_timestamp: "2025-01-11T08:00:00Z"
  });
} catch (error) {
  if (error instanceof ApiError) {
    // Validation errors from backend
    console.log(error.details); // { calories: "Too high" }
  }
}

// Update meal
await mealService.updateMeal("meal-id", { calories: 350 });

// Get meal
const meal = await mealService.getMealById("meal-id");

// Delete meal
await mealService.deleteMeal("meal-id");
```

### aiService

```typescript
import { aiService, RateLimitError } from "@/services/ai.service";

try {
  const result = await aiService.generateMeal("Kurczak z ryżem 300g");

  if (result.status === "completed") {
    console.log("Kalorie:", result.generated_calories);
  }
} catch (error) {
  if (error instanceof RateLimitError) {
    console.log(`Retry after: ${error.retryAfter}s`);
  }
}
```

---

## 📊 Porównanie: Przed vs Po

### Przed (useAddMealForm - 730 linii)
```typescript
// Monolityczny hook - wszystko w jednym miejscu
const form = useAddMealForm();

// Problemy:
// - 730 linii w jednym pliku
// - Mixing concerns (UI, validation, API, AI)
// - Manual state management
// - Trudne do testowania
// - Wiele re-renders
```

### Po (Rozdzielone hooki)
```typescript
// Każdy hook ma jedną odpowiedzialność
const form = useForm<ManualMealFormData>({
  resolver: zodResolver(manualMealSchema)
});

const ai = useMealAI();
const validation = useMealValidation(form);
const edit = useMealEdit();

// Benefity:
// - ~300 linii total (zamiast 730)
// - Separation of concerns
// - React Hook Form state management
// - Łatwe do testowania
// - Mniej re-renders
```

---

## 🚀 Przykład pełnej integracji (Manual Mode)

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { manualMealSchema, type ManualMealFormData } from "@/utils/validation/schemas";
import { useMealValidation } from "@/hooks/useMealValidation";
import { mealService, ApiError } from "@/services/meal.service";

function ManualMealForm() {
  const form = useForm<ManualMealFormData>({
    resolver: zodResolver(manualMealSchema),
    defaultValues: {
      description: "",
      calories: null,
      protein: null,
      carbs: null,
      fats: null,
      fiber: null,
      category: null,
      date: getCurrentDate(),
      time: getCurrentTime(),
    }
  });

  const { macroWarning, dateWarning, autoCalculateCalories } = useMealValidation(form);

  const onSubmit = async (data: ManualMealFormData) => {
    try {
      const result = await mealService.createMeal({
        ...data,
        input_method: "manual",
        meal_timestamp: `${data.date}T${data.time}:00Z`
      });

      console.log("Posiłek utworzony:", result);
    } catch (error) {
      if (error instanceof ApiError) {
        // Set form errors from API
        Object.entries(error.details).forEach(([field, message]) => {
          form.setError(field as any, { message });
        });
      }
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Input {...form.register("description")} />
      <Input type="number" {...form.register("calories")} />

      {macroWarning && (
        <MacroWarning {...macroWarning} onAutoCalc={autoCalculateCalories} />
      )}

      {dateWarning && <DateWarning {...dateWarning} />}

      <Button type="submit">Zapisz</Button>
    </form>
  );
}
```

---

## ✅ Checklist migracji MealForm

- [x] Utworzenie schemas (manualMealSchema, aiMealSchema)
- [x] Utworzenie serwisów (mealService, aiService)
- [x] Utworzenie helper hooks (useMealAI, useMealValidation, useMealEdit)
- [x] Build verification
- [ ] Migracja ManualMode na React Hook Form
- [ ] Migracja AIMode na React Hook Form + useMealAI
- [ ] Migracja MealForm na nową architekturę
- [ ] Testy jednostkowe (schemas, services)
- [ ] Testy integracyjne (hooks)
- [ ] Testy E2E (full flow)

---

## 📝 Następne kroki

1. **Migracja ManualMode** (~2h)
   - Zamienić manual state na React Hook Form
   - Użyć useMealValidation dla warnings
   - Użyć mealService dla submit

2. **Migracja AIMode** (~2h)
   - Zamienić AI state na useMealAI
   - Użyć React Hook Form dla common fields
   - Integracja z mealService

3. **Migracja MealForm** (~1h)
   - Orkiestracja wszystkich hooków
   - Mode switching logic
   - Edit mode integration z useMealEdit

4. **Testy** (~3h)
   - Unit tests dla schemas i services
   - Integration tests dla hooków
   - E2E tests dla full flow

**Szacowany czas total**: ~8 godzin

---

## 🎓 Best Practices

1. **Separation of Concerns**
   - Logika biznesowa → Serwisy
   - State management → React Hook Form
   - Validation → Zod schemas
   - Helpers → Custom hooks

2. **Error Handling**
   - API errors → ApiError class z details
   - Rate limiting → RateLimitError
   - Validation → Zod automatic
   - Network errors → try/catch w serwisach

3. **Performance**
   - React Hook Form minimalizuje re-renders
   - useMemo dla reactive calculations
   - Lazy loading dla hooków (only when needed)

4. **Testing**
   - Schemas → safeParse tests
   - Services → mock fetch, test error cases
   - Hooks → @testing-library/react-hooks
   - Components → @testing-library/react
