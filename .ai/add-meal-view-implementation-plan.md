# Plan implementacji widoku AddMeal

## 1. Przegląd

Widok **AddMeal** to modalny formularz służący do dodawania nowych posiłków do aplikacji. Stanowi kluczowy element interfejsu użytkownika, oferując dwa tryby wprowadzania danych:

- **Tryb AI** (domyślny): użytkownik opisuje posiłek w języku naturalnym, a system AI automatycznie szacuje kalorie i makroskładniki
- **Tryb Manual**: użytkownik ręcznie wprowadza wartości kaloryczne i makroskładniki

Widok wykorzystuje zaawansowane funkcje UX, takie jak:

- Multi-stage loading z wizualizacją postępu dla generacji AI
- Inteligentne prepopulowanie danych przy przełączaniu trybów
- Walidację w czasie rzeczywistym z ostrzeżeniami
- Auto-detekcję kategorii posiłku na podstawie czasu
- Responsywny design (fullscreen na mobile, dialog na desktop)

## 2. Routing widoku

Widok jest dostępny jako **modal/overlay** wywoływany programowo z innych części aplikacji (np. Dashboard, DayView).

**Sposób wywoływania**:

- Komponent `AddMealModal` przyjmuje props `isOpen: boolean` i `onClose: () => void`
- Może być zaimplementowany w głównym layoucie aplikacji lub lokalnie w komponencie rodzica
- Po zapisaniu posiłku wywołuje callback `onSuccess: (meal: CreateMealResponseDTO) => void`

**Przykład użycia**:

```tsx
const [isAddMealOpen, setIsAddMealOpen] = useState(false);

<AddMealModal
  isOpen={isAddMealOpen}
  onClose={() => setIsAddMealOpen(false)}
  onSuccess={(meal) => {
    // Odśwież listę posiłków
    toast.success("Posiłek dodany");
    setIsAddMealOpen(false);
  }}
/>;
```

## 3. Struktura komponentów

Hierarchia komponentów widoku AddMeal:

```
AddMealModal (kontener modalny)
└── MealForm (główny formularz)
    ├── SegmentedControl (przełącznik AI/Manual)
    │
    ├── AIMode (warunkowy - gdy mode === 'ai')
    │   ├── Label + Textarea (opis posiłku)
    │   ├── CharacterCounter (0/500)
    │   ├── ExampleChips (clickable przykłady)
    │   ├── Button "Oblicz kalorie"
    │   ├── LoadingState (warunkowy - gdy loading)
    │   │   ├── Spinner
    │   │   ├── ProgressDots (● ○ ○)
    │   │   └── StageText ("Analizuję opis...")
    │   └── AIResult (warunkowy - gdy result)
    │       ├── CaloriesDisplay (duża liczba)
    │       ├── MacroGrid (4 wartości makro)
    │       ├── AssumptionsText (adnotacja)
    │       └── ResultActions ([Dodaj] [Generuj ponownie] [Edytuj ręcznie])
    │
    ├── ManualMode (warunkowy - gdy mode === 'manual')
    │   ├── Label + Textarea (opis)
    │   ├── CharacterCounter (0/500)
    │   ├── Label + Input (kalorie, required)
    │   ├── MacroInputs (opcjonalne makro)
    │   │   ├── Label + Input (Białko)
    │   │   ├── Label + Input (Węglowodany)
    │   │   ├── Label + Input (Tłuszcze)
    │   │   └── Label + Input (Błonnik)
    │   └── MacroWarning (warunkowy - gdy różnica >5%)
    │       ├── Alert (żółty box)
    │       └── Button "Przelicz automatycznie"
    │
    ├── Separator (wizualna separacja)
    │
    ├── CommonFields (opcjonalne pola)
    │   ├── Label + CategorySelector (visual button group)
    │   │   ├── Button (Śniadanie) + Icon
    │   │   ├── Button (Obiad) + Icon
    │   │   ├── Button (Kolacja) + Icon
    │   │   └── Button (Przekąska) + Icon
    │   ├── Label + DatePicker (default: dzisiaj)
    │   ├── DateWarning (warunkowy)
    │   └── Label + TimePicker (default: teraz)
    │
    ├── ValidationErrors (lista błędów)
    │
    └── FormActions (footer z akcjami)
        ├── Button "Anuluj" (variant: ghost)
        └── Button "Dodaj posiłek" (variant: default, z loading state)
```

## 4. Szczegóły komponentów

### 4.1. AddMealModal

**Opis**: Główny kontener modalny opakowujący formularz. Zapewnia overlay, focus trap, escape handling i responsywność (fullscreen na mobile, dialog na desktop).

**Główne elementy**:

- `Dialog` z shadcn/ui (root)
- `DialogOverlay` (backdrop)
- `DialogContent` (kontener z zawartością)
- `MealForm` (główny formularz)

**Obsługiwane interakcje**:

- `onClose`: zamknięcie modala (kliknięcie backdrop, ESC, przycisk Anuluj)
- `onSuccess`: callback po pomyślnym zapisie posiłku

**Walidacja**: Brak (przekazuje do MealForm)

**Typy**:

- Props: `AddMealModalProps`

**Props**:

```typescript
interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
}
```

---

### 4.2. MealForm

**Opis**: Główny komponent formularza zarządzający stanem, logiką biznesową i przepływem danych między trybami. Orkiestruje wszystkie sub-komponenty i komunikację z API.

**Główne elementy**:

- `form` element (HTML form)
- `SegmentedControl` (toggle trybu)
- `AIMode` lub `ManualMode` (warunkowe renderowanie)
- `CommonFields` (wspólne pola)
- `FormActions` (przyciski)

**Obsługiwane interakcje**:

- `onModeChange`: przełączanie między AI/Manual
- `onFieldUpdate`: aktualizacja pól formularza
- `onAIGenerate`: generacja AI
- `onSubmit`: zapisanie posiłku
- `onCancel`: anulowanie i zamknięcie

**Walidacja**:

- Przed generacją AI: prompt nie pusty, max 500 znaków
- Przed submitem: wszystkie wymagane pola wypełnione, zakres wartości poprawny
- Macro vs calories: różnica >5% → warning (nie blokuje)
- Data: nie w przyszłości (blokuje), >7 dni wstecz (warning, nie blokuje)

**Typy**:

- State: `MealFormState`
- Props: `MealFormProps`

**Props**:

```typescript
interface MealFormProps {
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
}
```

---

### 4.3. SegmentedControl

**Opis**: Toggle umożliwiający przełączanie między trybem AI i Manual. Wizualnie wyróżnia aktywny tryb.

**Główne elementy**:

- 2x `Button` (AI, Manual)
- Sliding indicator (animowany background)

**Obsługiwane interakcje**:

- `onChange`: zmiana aktywnego trybu

**Walidacja**: Brak

**Typy**:

- Props: `SegmentedControlProps`

**Props**:

```typescript
interface SegmentedControlProps {
  value: MealFormMode; // 'ai' | 'manual'
  onChange: (value: MealFormMode) => void;
  disabled?: boolean;
}
```

---

### 4.4. AIMode

**Opis**: Interfejs trybu AI zawierający textarea do opisu posiłku, przyciski z przykładami, przycisk generacji oraz wyświetlanie rezultatów (loading state lub wynik AI).

**Główne elementy**:

- `Label` + `Textarea` (opis posiłku)
- `CharacterCounter` (0/500)
- `ExampleChips` (3-4 clickable chips)
- `Button` "Oblicz kalorie"
- `LoadingState` (warunkowy)
- `AIResult` (warunkowy)
- `Alert` (warunkowy - błąd AI)

**Obsługiwane interakcje**:

- `onPromptChange`: zmiana tekstu w textarea
- `onExampleClick`: wypełnienie textarea przykładem
- `onGenerate`: wywołanie generacji AI
- `onAcceptResult`: akceptacja wyniku AI i przejście do zapisu
- `onRegenerate`: ponowna generacja AI
- `onSwitchToManual`: przełączenie do trybu manual z prepopulacją

**Walidacja**:

- Prompt: required, max 500 znaków
- Przycisk "Oblicz" disabled gdy prompt pusty lub >500 znaków

**Typy**:

- Props: `AIModeProps`
- Local state: `prompt`, `aiResult`, `aiLoading`, `aiLoadingStage`, `aiError`

**Props**:

```typescript
interface AIModeProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  aiResult: AIGenerationResponseDTO | null;
  aiLoading: boolean;
  aiLoadingStage: AILoadingStage;
  aiError: string | null;
  onGenerate: () => Promise<void>;
  onAcceptResult: () => void;
  onRegenerate: () => Promise<void>;
  onSwitchToManual: () => void;
}
```

---

### 4.5. ExampleChips

**Opis**: Zestaw clickable chipów z przykładowymi opisami posiłków, które po kliknięciu wypełniają textarea.

**Główne elementy**:

- 3-4x `Button` (variant: outline, size: sm)

**Obsługiwane interakcje**:

- `onSelect`: kliknięcie chipa

**Walidacja**: Brak

**Typy**:

- Props: `ExampleChipsProps`

**Props**:

```typescript
interface ExampleChipsProps {
  examples: string[]; // np. ["Kanapka z szynką", "Kurczak z ryżem", "Jogurt z owocami"]
  onSelect: (example: string) => void;
  disabled?: boolean;
}
```

---

### 4.6. LoadingState

**Opis**: Multi-stage loading indicator wyświetlający 3 etapy generacji AI z animowanymi progress dots i tekstem etapu.

**Główne elementy**:

- `Spinner` (animowany)
- `ProgressDots` (● ○ ○ lub ○ ● ○ lub ○ ○ ●)
- `StageText` ("Analizuję opis..." / "Szacuję kalorie..." / "Obliczam makroskładniki...")

**Obsługiwane interakcje**: Brak (tylko wizualizacja)

**Walidacja**: Brak

**Typy**:

- Props: `LoadingStateProps`

**Props**:

```typescript
interface LoadingStateProps {
  stage: AILoadingStage; // 0 | 1 | 2
}
```

---

### 4.7. AIResult

**Opis**: Wyświetlenie wyniku generacji AI: kalorie (duża liczba), makroskładniki (grid 2x2), założenia AI oraz przyciski akcji.

**Główne elementy**:

- `CaloriesDisplay` (duża liczba, np. 420 kcal)
- `MacroGrid` (4 wartości: Białko, Węglowodany, Tłuszcze, Błonnik w grid 2x2)
- `AssumptionsText` (mały tekst z założeniami AI)
- `ResultActions` (3 przyciski)

**Obsługiwane interakcje**:

- `onAccept`: akceptacja wyniku
- `onRegenerate`: ponowna generacja
- `onEditManually`: przełączenie do manual z prepopulacją

**Walidacja**: Brak (tylko wyświetlanie)

**Typy**:

- Props: `AIResultProps`

**Props**:

```typescript
interface AIResultProps {
  result: AIGenerationResponseDTO;
  onAccept: () => void;
  onRegenerate: () => Promise<void>;
  onEditManually: () => void;
  regenerateLoading?: boolean;
}
```

---

### 4.8. ManualMode

**Opis**: Interfejs trybu manual z polami do ręcznego wprowadzenia opisu, kalorii i makroskładników.

**Główne elementy**:

- `Label` + `Textarea` (opis)
- `CharacterCounter` (0/500)
- `Label` + `Input` (kalorie, type: number, required)
- `MacroInputs` (4 inputy dla makro)
- `MacroWarning` (warunkowy)

**Obsługiwane interakcje**:

- `onFieldChange`: zmiana wartości pól
- `onAutoCalculate`: automatyczne przeliczenie kalorii z makro

**Walidacja**:

- Opis: required, max 500 znaków
- Kalorie: required, integer, 1-10000
- Makro (każde): optional, decimal, 0-1000
- Macro warning: |calculated - provided| / provided > 0.05

**Typy**:

- Props: `ManualModeProps`

**Props**:

```typescript
interface ManualModeProps {
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  macroWarning: MacroWarningInfo | null;
  onFieldChange: (field: string, value: any) => void;
  onAutoCalculate: () => void;
  validationErrors: FormValidationError[];
}
```

---

### 4.9. MacroInputs

**Opis**: Grupa 4 inputów dla makroskładników (Białko, Węglowodany, Tłuszcze, Błonnik) z labelami i walidacją.

**Główne elementy**:

- 4x (`Label` + `Input[type=number]`)

**Obsługiwane interakcje**:

- `onChange`: zmiana wartości makro

**Walidacja**:

- Każde pole: optional, 0-1000, decimal(6,2)

**Typy**:

- Props: `MacroInputsProps`

**Props**:

```typescript
interface MacroInputsProps {
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null;
  onChange: (field: "protein" | "carbs" | "fats" | "fiber", value: number | null) => void;
  errors?: Record<string, string>;
}
```

---

### 4.10. MacroWarning

**Opis**: Żółty alert box wyświetlany gdy suma kalorii z makroskładników różni się >5% od podanych kalorii. Zawiera komunikat i przycisk auto-przeliczenia.

**Główne elementy**:

- `Alert` (variant: warning)
- Tekst komunikatu
- `Button` "Przelicz automatycznie"

**Obsługiwane interakcje**:

- `onAutoCalculate`: automatyczne ustawienie kalorii na podstawie makro

**Walidacja**: Brak (tylko informacyjny)

**Typy**:

- Props: `MacroWarningProps`

**Props**:

```typescript
interface MacroWarningProps {
  calculatedCalories: number;
  providedCalories: number;
  differencePercent: number;
  onAutoCalculate: () => void;
}
```

---

### 4.11. CommonFields

**Opis**: Grupa opcjonalnych pól wspólnych dla obu trybów: kategoria posiłku, data i czas.

**Główne elementy**:

- `Label` + `CategorySelector`
- `Label` + `DatePicker`
- `DateWarning` (warunkowy)
- `Label` + `TimePicker`

**Obsługiwane interakcje**:

- `onCategoryChange`: zmiana kategorii
- `onDateChange`: zmiana daty
- `onTimeChange`: zmiana czasu

**Walidacja**:

- Data: nie w przyszłości (error, blokuje submit)
- Data: >7 dni wstecz (warning, nie blokuje)

**Typy**:

- Props: `CommonFieldsProps`

**Props**:

```typescript
interface CommonFieldsProps {
  category: MealCategory | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dateWarning: DateValidationWarning | null;
  onCategoryChange: (category: MealCategory | null) => void;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}
```

---

### 4.12. CategorySelector

**Opis**: Visual button group do wyboru kategorii posiłku (Śniadanie, Obiad, Kolacja, Przekąska) z ikonami.

**Główne elementy**:

- 4x `Button` (variant: outline, toggle state)
- Ikony dla każdej kategorii

**Obsługiwane interakcje**:

- `onChange`: wybór/odznaczenie kategorii

**Walidacja**: Brak

**Typy**:

- Props: `CategorySelectorProps`

**Props**:

```typescript
interface CategorySelectorProps {
  value: MealCategory | null;
  onChange: (value: MealCategory | null) => void;
}
```

---

### 4.13. FormActions

**Opis**: Footer formularza z przyciskami akcji: Anuluj i Dodaj posiłek.

**Główne elementy**:

- `Button` "Anuluj" (variant: ghost)
- `Button` "Dodaj posiłek" (variant: default, z loading spinner)

**Obsługiwane interakcje**:

- `onCancel`: anulowanie i zamknięcie modala
- `onSubmit`: zapisanie posiłku

**Walidacja**: Brak (wykonywana w MealForm przed submit)

**Typy**:

- Props: `FormActionsProps`

**Props**:

```typescript
interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitLoading: boolean;
}
```

---

### 4.14. CharacterCounter

**Opis**: Licznik znaków dla textarea (np. "245/500"). Zmienia kolor w zależności od wykorzystania.

**Główne elementy**:

- `span` z tekstem i stylowaniem

**Obsługiwane interakcje**: Brak (tylko wyświetlanie)

**Walidacja**: Brak

**Typy**:

- Props: `CharacterCounterProps`

**Props**:

```typescript
interface CharacterCounterProps {
  current: number;
  max: number;
}
```

---

## 5. Typy

### 5.1. Istniejące typy z API (z src/types.ts)

```typescript
// Typy z types.ts (już istniejące)
import type {
  CreateAIGenerationRequestDTO,
  AIGenerationResponseDTO,
  CreateAIMealRequestDTO,
  CreateManualMealRequestDTO,
  CreateMealResponseDTO,
  MealWarningDTO,
  MealCategory,
  InputMethodType,
} from "../types";
```

### 5.2. Nowe typy ViewModel

```typescript
/**
 * Tryb formularza dodawania posiłku
 */
export type MealFormMode = "ai" | "manual";

/**
 * Etap ładowania AI (0-2)
 * 0: "Analizuję opis..."
 * 1: "Szacuję kalorie..."
 * 2: "Obliczam makroskładniki..."
 */
export type AILoadingStage = 0 | 1 | 2;

/**
 * Informacje o ostrzeżeniu dotyczącym rozbieżności makroskładników
 */
export interface MacroWarningInfo {
  visible: boolean;
  calculatedCalories: number;
  providedCalories: number;
  differencePercent: number;
}

/**
 * Błąd walidacji formularza
 */
export interface FormValidationError {
  field: string;
  message: string;
}

/**
 * Ostrzeżenie dotyczące daty
 */
export interface DateValidationWarning {
  type: "future" | "old";
  message: string;
}

/**
 * Stan formularza dodawania posiłku
 * Centralna struktura danych używana przez hook useAddMealForm
 */
export interface MealFormState {
  // Tryb formularza
  mode: MealFormMode;

  // Dane formularza
  description: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  fiber: number | null; // Uwaga: API nie wspiera fiber w MVP
  category: MealCategory | null;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM

  // Stan AI
  aiPrompt: string;
  aiGenerationId: string | null;
  aiResult: AIGenerationResponseDTO | null;
  aiLoading: boolean;
  aiLoadingStage: AILoadingStage;
  aiError: string | null;

  // Stan submitu
  submitLoading: boolean;
  submitError: string | null;

  // Walidacja i ostrzeżenia
  validationErrors: FormValidationError[];
  macroWarning: MacroWarningInfo | null;
  dateWarning: DateValidationWarning | null;
}

/**
 * Rezultat generacji AI do użycia w UI
 * Zawiera dane wymagane do prepopulacji formularza
 */
export interface AIGenerationResult {
  id: string;
  prompt: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  assumptions: string | null;
  status: "completed" | "failed";
  errorMessage: string | null;
}
```

### 5.3. Typy pomocnicze

```typescript
/**
 * Mapowanie kategorii na ikony
 */
export const CATEGORY_ICONS: Record<MealCategory, string> = {
  breakfast: "🍳",
  lunch: "🍽️",
  dinner: "🍲",
  snack: "🍪",
  other: "🍴",
};

/**
 * Teksty dla etapów ładowania AI
 */
export const AI_LOADING_STAGES: Record<AILoadingStage, string> = {
  0: "Analizuję opis...",
  1: "Szacuję kalorie...",
  2: "Obliczam makroskładniki...",
};

/**
 * Przykłady opisów posiłków
 */
export const MEAL_EXAMPLES = [
  "Kanapka z szynką i serem",
  "Kurczak z ryżem i warzywami",
  "Jogurt naturalny z owocami",
  "Jajecznica z trzech jajek",
];

/**
 * Limity walidacji
 */
export const VALIDATION_LIMITS = {
  PROMPT_MAX_LENGTH: 500,
  DESCRIPTION_MAX_LENGTH: 500,
  CALORIES_MIN: 1,
  CALORIES_MAX: 10000,
  MACRO_MIN: 0,
  MACRO_MAX: 1000,
  MACRO_WARNING_THRESHOLD: 0.05, // 5%
  DATE_WARNING_DAYS: 7,
};
```

## 6. Zarządzanie stanem

### 6.1. Główny hook: useAddMealForm

Zarządzanie stanem formularza jest scentralizowane w custom hooku `useAddMealForm`. Hook ten enkapsuluje całą logikę biznesową, walidację, komunikację z API i zarządzanie stanem.

**Lokalizacja**: `src/hooks/useAddMealForm.ts`

**Odpowiedzialności**:

- Zarządzanie stanem formularza (MealFormState)
- Przełączanie między trybami AI/Manual
- Obsługa generacji AI z multi-stage loading
- Walidacja pól formularza
- Obliczanie ostrzeżeń (macro, data)
- Komunikacja z API (AI generations, meals)
- Prepopulacja danych przy przełączaniu trybów

**Struktura hooka**:

```typescript
interface UseAddMealFormReturn {
  // Stan
  state: MealFormState;

  // Akcje - zmiana trybu
  setMode: (mode: MealFormMode) => void;
  switchToManual: (prepopulate: boolean) => void;
  switchToAI: () => void;

  // Akcje - aktualizacja pól
  updateField: <K extends keyof MealFormState>(field: K, value: MealFormState[K]) => void;
  updatePrompt: (prompt: string) => void;

  // Akcje - AI
  generateAI: () => Promise<void>;
  acceptAIResult: () => void;

  // Akcje - walidacja i helpers
  calculateMacroWarning: () => void;
  validateDateField: (date: string) => void;
  autoCalculateCalories: () => void;
  autoDetectCategory: (time: string) => void;

  // Akcje - submit
  validateForm: () => boolean;
  submitMeal: () => Promise<CreateMealResponseDTO>;

  // Akcje - reset
  reset: () => void;

  // Computed values
  isAIMode: boolean;
  isManualMode: boolean;
  canSubmit: boolean;
  hasAIResult: boolean;
}

export function useAddMealForm(): UseAddMealFormReturn {
  // Stan wewnętrzny
  const [state, setState] = useState<MealFormState>(getInitialState());

  // ... implementacja funkcji

  return {
    state,
    setMode,
    switchToManual,
    switchToAI,
    updateField,
    updatePrompt,
    generateAI,
    acceptAIResult,
    calculateMacroWarning,
    validateDateField,
    autoCalculateCalories,
    autoDetectCategory,
    validateForm,
    submitMeal,
    reset,
    isAIMode: state.mode === "ai",
    isManualMode: state.mode === "manual",
    canSubmit: !state.submitLoading && state.validationErrors.length === 0,
    hasAIResult: state.aiResult !== null,
  };
}
```

### 6.2. Funkcja getInitialState

```typescript
function getInitialState(): MealFormState {
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`; // HH:MM

  return {
    mode: "ai", // Domyślnie tryb AI
    description: "",
    calories: null,
    protein: null,
    carbs: null,
    fats: null,
    fiber: null,
    category: null,
    date: dateStr,
    time: timeStr,
    aiPrompt: "",
    aiGenerationId: null,
    aiResult: null,
    aiLoading: false,
    aiLoadingStage: 0,
    aiError: null,
    submitLoading: false,
    submitError: null,
    validationErrors: [],
    macroWarning: null,
    dateWarning: null,
  };
}
```

### 6.3. Kluczowe funkcje hooka

#### generateAI()

```typescript
async function generateAI(): Promise<void> {
  // 1. Walidacja promptu
  if (!state.aiPrompt.trim() || state.aiPrompt.length > VALIDATION_LIMITS.PROMPT_MAX_LENGTH) {
    return;
  }

  // 2. Reset stanu AI
  setState((prev) => ({
    ...prev,
    aiLoading: true,
    aiLoadingStage: 0,
    aiError: null,
    aiResult: null,
  }));

  // 3. Multi-stage loading simulation
  const stageTimer1 = setTimeout(() => {
    setState((prev) => ({ ...prev, aiLoadingStage: 1 }));
  }, 1000);

  const stageTimer2 = setTimeout(() => {
    setState((prev) => ({ ...prev, aiLoadingStage: 2 }));
  }, 2000);

  try {
    // 4. API call
    const response = await fetch("/api/v1/ai-generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: state.aiPrompt }),
    });

    if (!response.ok) {
      // Obsługa błędów (429, 400, 500)
      // ...
    }

    const result: AIGenerationResponseDTO = await response.json();

    // 5. Obsługa rezultatu
    if (result.status === "failed") {
      setState((prev) => ({
        ...prev,
        aiLoading: false,
        aiError: result.error_message || "Nie udało się wygenerować oszacowania",
      }));
    } else {
      setState((prev) => ({
        ...prev,
        aiLoading: false,
        aiResult: result,
        aiGenerationId: result.id,
      }));
    }
  } catch (error) {
    setState((prev) => ({
      ...prev,
      aiLoading: false,
      aiError: "Wystąpił błąd połączenia. Spróbuj ponownie.",
    }));
  } finally {
    clearTimeout(stageTimer1);
    clearTimeout(stageTimer2);
  }
}
```

#### acceptAIResult()

```typescript
function acceptAIResult(): void {
  if (!state.aiResult) return;

  // Prepopulacja danych z AI
  setState((prev) => ({
    ...prev,
    description: prev.aiPrompt,
    calories: prev.aiResult?.generated_calories || null,
    protein: prev.aiResult?.generated_protein || null,
    carbs: prev.aiResult?.generated_carbs || null,
    fats: prev.aiResult?.generated_fats || null,
  }));

  // Obliczenie ostrzeżeń
  calculateMacroWarning();
}
```

#### switchToManual(prepopulate: boolean)

```typescript
function switchToManual(prepopulate: boolean): void {
  setState((prev) => {
    const newState: Partial<MealFormState> = {
      mode: "manual",
      aiError: null,
    };

    if (prepopulate && prev.aiResult) {
      // Prepopulacja z AI
      newState.description = prev.aiPrompt;
      newState.calories = prev.aiResult.generated_calories;
      newState.protein = prev.aiResult.generated_protein;
      newState.carbs = prev.aiResult.generated_carbs;
      newState.fats = prev.aiResult.generated_fats;
    } else {
      // Zachowaj tylko opis
      newState.description = prev.aiPrompt || prev.description;
      newState.calories = null;
      newState.protein = null;
      newState.carbs = null;
      newState.fats = null;
    }

    return { ...prev, ...newState };
  });

  calculateMacroWarning();
}
```

#### submitMeal()

```typescript
async function submitMeal(): Promise<CreateMealResponseDTO> {
  // 1. Walidacja
  if (!validateForm()) {
    throw new Error("Formularz zawiera błędy");
  }

  setState((prev) => ({ ...prev, submitLoading: true, submitError: null }));

  try {
    // 2. Przygotowanie danych
    const timestamp = `${state.date}T${state.time}:00Z`;

    const requestData: CreateAIMealRequestDTO | CreateManualMealRequestDTO =
      state.mode === "ai"
        ? {
            description: state.description,
            calories: state.calories!,
            protein: state.protein,
            carbs: state.carbs,
            fats: state.fats,
            category: state.category,
            input_method: "ai",
            ai_generation_id: state.aiGenerationId!,
            meal_timestamp: timestamp,
          }
        : {
            description: state.description,
            calories: state.calories!,
            protein: state.protein,
            carbs: state.carbs,
            fats: state.fats,
            category: state.category,
            input_method: "manual",
            meal_timestamp: timestamp,
          };

    // 3. API call
    const response = await fetch("/api/v1/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      // Obsługa błędów
      // ...
    }

    const result: CreateMealResponseDTO = await response.json();

    setState((prev) => ({ ...prev, submitLoading: false }));

    return result;
  } catch (error) {
    setState((prev) => ({
      ...prev,
      submitLoading: false,
      submitError: "Nie udało się zapisać posiłku",
    }));
    throw error;
  }
}
```

### 6.4. Dodatkowe hooki pomocnicze

#### useCharacterCounter

```typescript
export function useCharacterCounter(text: string, max: number) {
  const count = text.length;
  const percent = (count / max) * 100;

  const color = percent >= 98 ? "text-red-500" : percent >= 90 ? "text-yellow-500" : "text-gray-500";

  return { count, max, percent, color };
}
```

#### useDateValidation

```typescript
export function useDateValidation(date: string): DateValidationWarning | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);

  // Przyszłość - error
  if (selectedDate > today) {
    return {
      type: "future",
      message: "Data nie może być w przyszłości",
    };
  }

  // >7 dni wstecz - warning
  const diffDays = Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > VALIDATION_LIMITS.DATE_WARNING_DAYS) {
    return {
      type: "old",
      message: `Data jest sprzed ${diffDays} dni`,
    };
  }

  return null;
}
```

## 7. Integracja API

### 7.1. POST /api/v1/ai-generations

**Cel**: Generacja oszacowania kalorycznego i makroskładników na podstawie opisu tekstowego.

**Kiedy wywoływane**: Po kliknięciu przycisku "Oblicz kalorie" w trybie AI.

**Request**:

```typescript
// Typ: CreateAIGenerationRequestDTO
{
  prompt: string; // max 500 znaków w UI
}
```

**Przykład request**:

```json
{
  "prompt": "dwa jajka sadzone na maśle i kromka chleba"
}
```

**Response (success - 201)**:

```typescript
// Typ: AIGenerationResponseDTO
{
  id: string;
  user_id: string;
  meal_id: string | null;
  prompt: string;
  generated_calories: number | null;
  generated_protein: number | null;
  generated_carbs: number | null;
  generated_fats: number | null;
  assumptions: string | null;
  model_used: string | null;
  generation_duration: number | null;
  status: "completed" | "failed";
  error_message: string | null;
  created_at: string;
}
```

**Response (unclear description - 201)**:

```json
{
  "id": "uuid",
  "status": "failed",
  "error_message": "Opis jest zbyt ogólny. Proszę podać więcej szczegółów...",
  "generated_calories": null,
  "generated_protein": null,
  "generated_carbs": null,
  "generated_fats": null
}
```

**Error responses**:

- **400 Validation Error**: Invalid prompt
- **429 Rate Limit Exceeded**: Too many requests (retry_after w sekundach)
- **500 Internal Server Error**: AI service failure

**Frontend handling**:

```typescript
// W funkcji generateAI() hooka useAddMealForm

try {
  const response = await fetch("/api/v1/ai-generations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: state.aiPrompt }),
  });

  if (response.status === 429) {
    const errorData = await response.json();
    const retryAfter = errorData.retry_after || 60;
    setState((prev) => ({
      ...prev,
      aiLoading: false,
      aiError: `Zbyt wiele żądań. Spróbuj ponownie za ${retryAfter}s`,
    }));
    return;
  }

  if (!response.ok) {
    throw new Error("API error");
  }

  const result: AIGenerationResponseDTO = await response.json();

  if (result.status === "failed") {
    setState((prev) => ({
      ...prev,
      aiLoading: false,
      aiError: result.error_message,
      aiResult: result, // Zapisz dla możliwości regeneracji
    }));
  } else {
    setState((prev) => ({
      ...prev,
      aiLoading: false,
      aiResult: result,
      aiGenerationId: result.id,
    }));
  }
} catch (error) {
  // Obsługa błędów sieci, itp.
}
```

---

### 7.2. POST /api/v1/meals

**Cel**: Utworzenie nowego wpisu posiłku.

**Kiedy wywoływane**: Po kliknięciu przycisku "Dodaj posiłek" i pomyślnej walidacji.

**Request (AI meal)**:

```typescript
// Typ: CreateAIMealRequestDTO
{
  description: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  category?: MealCategory | null;
  input_method: 'ai';
  ai_generation_id: string;
  meal_timestamp: string; // ISO 8601
}
```

**Request (Manual meal)**:

```typescript
// Typ: CreateManualMealRequestDTO
{
  description: string;
  calories: number;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  category?: MealCategory | null;
  input_method: 'manual';
  meal_timestamp: string; // ISO 8601
}
```

**Przykład request (AI)**:

```json
{
  "description": "Jajka sadzone z chlebem",
  "calories": 420,
  "protein": 18.5,
  "carbs": 25.0,
  "fats": 28.0,
  "category": "breakfast",
  "input_method": "ai",
  "ai_generation_id": "550e8400-e29b-41d4-a716-446655440000",
  "meal_timestamp": "2025-01-27T08:30:00Z"
}
```

**Response (success - 201)**:

```typescript
// Typ: CreateMealResponseDTO
{
  id: string;
  user_id: string;
  description: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  category: MealCategory | null;
  input_method: InputMethodType;
  meal_timestamp: string;
  created_at: string;
  updated_at: string;
  warnings: MealWarningDTO[];
}
```

**Response with warnings**:

```json
{
  "id": "uuid",
  "calories": 650,
  "protein": 45.0,
  "carbs": 70.0,
  "fats": 15.0,
  "warnings": [
    {
      "field": "macronutrients",
      "message": "The calculated calories from macronutrients (540 kcal) differs by more than 5% from the provided calories (650 kcal). Please verify your input."
    }
  ]
}
```

**Error responses**:

- **400 Validation Error**: Invalid data (details w body)
- **404 Not Found**: AI generation not found
- **500 Internal Server Error**: Database failure

**Frontend handling**:

```typescript
// W funkcji submitMeal() hooka useAddMealForm

try {
  const timestamp = `${state.date}T${state.time}:00Z`;

  const requestData =
    state.mode === "ai"
      ? {
          description: state.description,
          calories: state.calories!,
          protein: state.protein,
          carbs: state.carbs,
          fats: state.fats,
          category: state.category,
          input_method: "ai" as const,
          ai_generation_id: state.aiGenerationId!,
          meal_timestamp: timestamp,
        }
      : {
          description: state.description,
          calories: state.calories!,
          protein: state.protein,
          carbs: state.carbs,
          fats: state.fats,
          category: state.category,
          input_method: "manual" as const,
          meal_timestamp: timestamp,
        };

  const response = await fetch("/api/v1/meals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestData),
  });

  if (response.status === 400) {
    const errorData = await response.json();
    // Mapowanie błędów walidacji do validationErrors
    const errors = Object.entries(errorData.details || {}).map(([field, message]) => ({
      field,
      message: message as string,
    }));
    setState((prev) => ({
      ...prev,
      submitLoading: false,
      validationErrors: errors,
    }));
    return;
  }

  if (response.status === 404) {
    setState((prev) => ({
      ...prev,
      submitLoading: false,
      submitError: "Nie znaleziono generacji AI. Spróbuj wygenerować ponownie.",
    }));
    return;
  }

  if (!response.ok) {
    throw new Error("API error");
  }

  const result: CreateMealResponseDTO = await response.json();

  // Jeśli są warningi, wyświetl je użytkownikowi (ale posiłek został utworzony)
  if (result.warnings && result.warnings.length > 0) {
    // Możesz wyświetlić toast z warningami
    console.warn("Meal created with warnings:", result.warnings);
  }

  return result;
} catch (error) {
  setState((prev) => ({
    ...prev,
    submitLoading: false,
    submitError: "Nie udało się zapisać posiłku. Spróbuj ponownie.",
  }));
  throw error;
}
```

---

## 8. Interakcje użytkownika

### 8.1. Otwarcie modala

**Trigger**: Kliknięcie przycisku "Dodaj posiłek" w Dashboard lub DayView
**Akcja**:

- Modal pojawia się z animacją fade-in
- Focus automatycznie na textarea w trybie AI
- Tryb AI jest aktywny domyślnie
- Pola Date i Time wypełnione aktualnymi wartościami

---

### 8.2. Tryb AI - Wpisywanie opisu

**Trigger**: Użytkownik wpisuje tekst w textarea
**Akcja**:

- Character counter aktualizuje się w czasie rzeczywistym (np. "125/500")
- Kolor licznika zmienia się w zależności od wykorzystania:
  - `< 450 znaków`: szary
  - `450-490 znaków`: żółty
  - `490-500 znaków`: czerwony
- Po osiągnięciu 500 znaków dalsza edycja jest blokowana (maxLength)
- Przycisk "Oblicz kalorie" jest disabled gdy prompt jest pusty

---

### 8.3. Tryb AI - Kliknięcie przykładu

**Trigger**: Użytkownik klika na jeden z chipów z przykładami
**Akcja**:

- Textarea wypełnia się wybranym przykładem
- Character counter aktualizuje się
- Focus pozostaje na textarea
- Przycisk "Oblicz kalorie" staje się aktywny

---

### 8.4. Tryb AI - Generacja AI (sukces)

**Trigger**: Kliknięcie przycisku "Oblicz kalorie"
**Akcja**:

1. **Walidacja**: Sprawdzenie czy prompt nie jest pusty i ≤500 znaków
2. **Loading state**:
   - Przycisk zmienia się na disabled z spinnerem
   - Pojawia się LoadingState component
   - Progress dots: ● ○ ○
   - Tekst: "Analizuję opis..."
3. **Po ~1s**: Progress dots: ○ ● ○, tekst: "Szacuję kalorie..."
4. **Po ~2s**: Progress dots: ○ ○ ●, tekst: "Obliczam makroskładniki..."
5. **Po otrzymaniu odpowiedzi** (status: 'completed'):
   - Loading state znika
   - Pojawia się AIResult component z:
     - Dużą liczbą kalorii (np. "420 kcal")
     - Grid z makroskładnikami (2x2)
     - Tekstem z assumptions
   - 3 przyciski: [Dodaj] [Generuj ponownie] [Edytuj ręcznie]

---

### 8.5. Tryb AI - Generacja AI (unclear description)

**Trigger**: API zwraca status: 'failed'
**Akcja**:

- Loading state znika
- Pojawia się Alert (variant: warning) z error_message z API
- 2 przyciski:
  - "Generuj ponownie" - disabled jeśli prompt się nie zmienił
  - "Edytuj ręcznie" - przełącza do trybu manual bez prepopulacji

---

### 8.6. Tryb AI - Rate limit (429)

**Trigger**: API zwraca 429 Too Many Requests
**Akcja**:

- Loading state znika
- Pojawia się Alert (variant: destructive) z komunikatem:
  "Zbyt wiele żądań. Spróbuj ponownie za {countdown}s"
- Licznik odliczający co sekundę
- Przycisk "Oblicz kalorie" disabled przez czas countdown
- Po zakończeniu countdown przycisk staje się aktywny

---

### 8.7. Tryb AI - Akceptacja wyniku

**Trigger**: Kliknięcie przycisku "Dodaj" w AIResult
**Akcja**:

- Dane z AI result są kopiowane do formularza:
  - description = aiPrompt
  - calories = generated_calories
  - protein = generated_protein
  - carbs = generated_carbs
  - fats = generated_fats
- Scrollowanie do sekcji CommonFields
- Przycisk "Dodaj posiłek" (w footer) staje się aktywny

---

### 8.8. Tryb AI - Regeneracja

**Trigger**: Kliknięcie przycisku "Generuj ponownie"
**Akcja**:

- Reset aiResult i aiError
- Ponowne wywołanie API z tym samym promptem
- Ten sam flow jak w pkt 8.4

---

### 8.9. Tryb AI → Manual (z prepopulacją)

**Trigger**: Kliknięcie przycisku "Edytuj ręcznie" w AIResult
**Akcja**:

- Zmiana mode na 'manual'
- AIMode znika, ManualMode pojawia się
- Prepopulacja pól:
  - description = aiPrompt
  - calories = generated_calories
  - protein = generated_protein
  - carbs = generated_carbs
  - fats = generated_fats
- Obliczenie macro warning jeśli różnica >5%
- Focus na polu calories

---

### 8.10. Przełączanie AI ↔ Manual (SegmentedControl)

**Trigger**: Kliknięcie na przeciwny segment w SegmentedControl
**Akcja AI → Manual**:

- Jeśli istnieje aiResult: prepopulacja (jak w 8.9)
- Jeśli nie: zachowanie tylko opisu (description = aiPrompt), reszta null

**Akcja Manual → AI**:

- Zachowanie opisu (aiPrompt = description)
- Reset wartości numerycznych (calories, protein, carbs, fats = null)
- Reset aiResult, aiError

---

### 8.11. Tryb Manual - Wprowadzanie danych

**Trigger**: Użytkownik wpisuje wartości w polach
**Akcja**:

- **Opis**: Character counter aktualizuje się (jak w trybie AI)
- **Kalorie**:
  - Walidacja real-time: 1-10000
  - Jeśli poza zakresem: czerwone obramowanie + komunikat błędu
  - Wywołanie calculateMacroWarning()
- **Makroskładniki**:
  - Walidacja: 0-1000 dla każdego
  - Wywołanie calculateMacroWarning() po każdej zmianie

---

### 8.12. Tryb Manual - Macro Warning

**Trigger**: Różnica między calculated i provided calories >5%
**Akcja**:

- Pojawia się MacroWarning component (żółty Alert)
- Komunikat: "Suma kalorii z makroskładników ({calculated} kcal) różni się o więcej niż 5% od podanych kalorii ({provided} kcal). Sprawdź wprowadzone wartości."
- Przycisk "Przelicz automatycznie"
- Kliknięcie przycisku: calories = calculated, warning znika

---

### 8.13. CommonFields - Wybór kategorii

**Trigger**: Kliknięcie na button w CategorySelector
**Akcja**:

- Toggle selection:
  - Jeśli kategoria była null lub inna: wybierz klikniętą
  - Jeśli kliknięta jest już wybrana: deselect (null)
- Wizualna zmiana: wybrany button ma bg-primary i text-primary-foreground

---

### 8.14. CommonFields - Zmiana daty

**Trigger**: Wybór daty w DatePicker
**Akcja**:

- Aktualizacja state.date
- Wywołanie validateDateField(date)
- Jeśli data w przyszłości:
  - Pojawia się Alert (variant: destructive)
  - Komunikat: "Data nie może być w przyszłości"
  - Przycisk submit disabled
- Jeśli data >7 dni wstecz:
  - Pojawia się Alert (variant: warning)
  - Komunikat: "Data jest sprzed {days} dni"
  - Submit NIE jest disabled

---

### 8.15. CommonFields - Zmiana czasu

**Trigger**: Zmiana czasu w TimePicker
**Akcja**:

- Aktualizacja state.time
- Wywołanie autoDetectCategory(time)
- Auto-detect kategorii:
  - 06:00-10:00 → breakfast
  - 12:00-15:00 → lunch
  - 18:00-21:00 → dinner
  - Inne → null (użytkownik może wybrać ręcznie)
- Jeśli kategoria już została wybrana ręcznie: nie nadpisuj

---

### 8.16. Anulowanie

**Trigger**: Kliknięcie przycisku "Anuluj" lub ESC lub kliknięcie backdrop
**Akcja**:

- Modal zamyka się z animacją fade-out
- Focus wraca do elementu, który otworzył modal
- Stan formularza jest resetowany (nie zachowuje zmian)
- Nie wywołuje onSuccess

---

### 8.17. Zapisanie posiłku (sukces)

**Trigger**: Kliknięcie przycisku "Dodaj posiłek"
**Akcja**:

1. **Walidacja**:
   - Sprawdzenie wszystkich pól według reguł
   - Jeśli błędy: wyświetlenie przy polach, scroll do pierwszego błędu, STOP
2. **Submit**:
   - Przycisk zmienia się na loading (spinner + disabled)
   - Wywołanie API POST /api/v1/meals
3. **Po sukcesie**:
   - Modal zamyka się
   - Toast notification: "Posiłek dodany"
   - Wywołanie onSuccess(meal) - callback do rodzica
   - Rodzic odświeża listę posiłków
   - Jeśli są warnings w response: dodatkowy toast z warningami

---

### 8.18. Zapisanie posiłku (błąd walidacji - 400)

**Trigger**: API zwraca 400 Validation Error
**Akcja**:

- Przycisk przestaje być loading
- Mapowanie details z response na validationErrors
- Wyświetlenie błędów przy odpowiednich polach (czerwone obramowanie + komunikat)
- Scroll do pierwszego błędnego pola
- Modal pozostaje otwarty

---

### 8.19. Zapisanie posiłku (błąd 404 - AI Generation Not Found)

**Trigger**: API zwraca 404 (tylko dla trybu AI)
**Akcja**:

- Przycisk przestaje być loading
- Alert (variant: destructive): "Nie znaleziono generacji AI. Wygeneruj posiłek ponownie."
- Przycisk "Wróć do generacji"
- Kliknięcie: przełączenie widoku do AI result (jeśli istnieje) lub do pustego AI mode

---

### 8.20. Zapisanie posiłku (błąd 500)

**Trigger**: API zwraca 500 Internal Server Error
**Akcja**:

- Przycisk przestaje być loading
- Alert (variant: destructive): "Nie udało się zapisać posiłku. Spróbuj ponownie."
- Modal pozostaje otwarty
- Dane w formularzu są zachowane
- Użytkownik może spróbować ponownie

---

## 9. Warunki i walidacja

### 9.1. Walidacja pola Prompt (AI mode)

**Komponenty**: AIMode > Textarea
**Warunki**:

- **required**: Wartość nie może być pusta (trim)
- **maxLength**: Maksymalnie 500 znaków

**Błędy**:

- Pusty: "Opis posiłku jest wymagany"
- > 500: "Maksymalnie 500 znaków" (blokada input + czerwony licznik)

**Wpływ na UI**:

- Przycisk "Oblicz kalorie" disabled gdy warunek nie spełniony
- Czerwone obramowanie textarea przy błędzie

---

### 9.2. Walidacja pola Description (Manual mode)

**Komponenty**: ManualMode > Textarea
**Warunki**:

- **required**: Wartość nie może być pusta (trim)
- **maxLength**: Maksymalnie 500 znaków

**Błędy**:

- Pusty: "Opis posiłku jest wymagany"
- > 500: "Maksymalnie 500 znaków"

**Wpływ na UI**:

- Przycisk submit disabled gdy błąd
- Czerwone obramowanie + komunikat pod polem

---

### 9.3. Walidacja pola Calories (Manual mode)

**Komponenty**: ManualMode > Input
**Warunki**:

- **required**: Wartość nie może być null/pusta
- **type**: integer (liczba całkowita)
- **min**: 1
- **max**: 10000

**Błędy**:

- Puste: "Kalorie są wymagane"
- <1: "Minimalna wartość to 1 kcal"
- > 10000: "Maksymalna wartość to 10000 kcal"
- Nie integer: "Wartość musi być liczbą całkowitą"

**Wpływ na UI**:

- Submit disabled
- Czerwone obramowanie + komunikat

---

### 9.4. Walidacja pól Macronutrients (Manual mode)

**Komponenty**: ManualMode > MacroInputs
**Warunki** (dla każdego: protein, carbs, fats, fiber):

- **required**: false (opcjonalne)
- **type**: decimal (2 miejsca po przecinku)
- **min**: 0
- **max**: 1000

**Błędy**:

- <0: "Wartość nie może być ujemna"
- > 1000: "Maksymalna wartość to 1000g"
- Nieprawidłowy format: "Wartość musi być liczbą (max 2 miejsca po przecinku)"

**Wpływ na UI**:

- Submit disabled jeśli błąd
- Czerwone obramowanie + komunikat przy błędnym polu

---

### 9.5. Walidacja Macronutrients vs Calories (Warning)

**Komponenty**: ManualMode > MacroWarning
**Warunki**:

- Obliczenie: `calculatedCalories = (protein × 4) + (carbs × 4) + (fats × 9)`
- Warning gdy: `|calculatedCalories - providedCalories| / providedCalories > 0.05` (5%)

**Uwaga**: To jest **warning**, nie error - nie blokuje submitu

**Wpływ na UI**:

- Pojawienie się żółtego Alert box z komunikatem
- Przycisk "Przelicz automatycznie" - ustawia calories na calculatedCalories
- Użytkownik może zignorować i zapisać z różnicą

---

### 9.6. Walidacja Date

**Komponenty**: CommonFields > DatePicker
**Warunki**:

- **Error**: Data nie może być w przyszłości (`selectedDate > today`)
- **Warning**: Data >7 dni wstecz (`today - selectedDate > 7 days`)

**Błędy**:

- Przyszłość (error): "Data nie może być w przyszłości"
- > 7 dni (warning): "Data jest sprzed {days} dni"

**Wpływ na UI**:

- **Error (przyszłość)**: Submit disabled, czerwony Alert
- **Warning (stara data)**: Submit NIE disabled, żółty Alert

---

### 9.7. Walidacja Time

**Komponenty**: CommonFields > TimePicker
**Warunki**:

- Format: HH:MM (24h)
- Zakres: 00:00 - 23:59

**Błędy**:

- Nieprawidłowy format: "Nieprawidłowy format czasu (wymagany: HH:MM)"

**Wpływ na UI**:

- TimePicker (shadcn) powinien wymuszać poprawny format
- W razie błędu: komunikat + submit disabled

---

### 9.8. Walidacja AI Generation ID (AI mode)

**Komponenty**: MealForm (wewnętrzna)
**Warunki**:

- **required**: true (tylko dla input_method: 'ai')
- **type**: string (UUID)
- Istnienie w state.aiGenerationId

**Błędy**:

- Brak ID: "Brak ID generacji AI. Wygeneruj posiłek ponownie."

**Wpływ na UI**:

- Submit disabled jeśli brak aiGenerationId w trybie AI
- Alert z komunikatem

---

### 9.9. Walidacja przed submitem (validateForm)

**Komponenty**: MealForm
**Proces**:

1. Reset validationErrors
2. Sprawdzenie wszystkich pól według powyższych reguł
3. Agregacja błędów do tablicy validationErrors
4. Jeśli errors.length > 0: return false, wyświetl błędy
5. Jeśli errors.length === 0: return true, allow submit

**Specjalne przypadki**:

- **Tryb AI**: Wymagane aiGenerationId
- **Tryb Manual**: Nie wymagane aiGenerationId
- **Data w przyszłości**: Blokuje submit (error)
- **Data >7 dni**: Nie blokuje submit (warning)
- **Macro warning**: Nie blokuje submit (warning)

---

## 10. Obsługa błędów

### 10.1. Błąd sieci (Network Error)

**Scenariusz**: Brak połączenia z internetem, timeout, itp.

**Obsługa**:

- Catch w bloku try-catch API calls
- Alert (variant: destructive): "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
- Przycisk "Spróbuj ponownie"

**Komponenty dotknięte**: AIMode, MealForm (submit)

---

### 10.2. AI Generation - Rate Limit (429)

**Scenariusz**: Użytkownik przekroczył limit 10 req/min

**Obsługa**:

- Parsowanie retry_after z response (w sekundach)
- Alert (variant: destructive): "Zbyt wiele żądań. Spróbuj ponownie za {countdown}s"
- Licznik odliczający (setInterval)
- Dezaktywacja przycisku "Oblicz kalorie" na czas countdown
- Po countdown: przycisk aktywny, alert znika

**Komponenty dotknięte**: AIMode

---

### 10.3. AI Generation - Unclear Description (status: failed)

**Scenariusz**: AI nie rozumie opisu, zwraca status: 'failed'

**Obsługa**:

- Wyświetlenie error_message z API
- Alert (variant: warning): "{error_message}"
- 2 przyciski:
  - "Generuj ponownie" - aktywny tylko jeśli prompt się zmienił
  - "Edytuj ręcznie" - przełącza do trybu manual

**Komponenty dotknięte**: AIMode > AIResult (error state)

---

### 10.4. AI Generation - API Error (500)

**Scenariusz**: Błąd serwera AI, model niedostępny, itp.

**Obsługa**:

- Alert (variant: destructive): "Nie udało się wygenerować oszacowania. Spróbuj ponownie lub wprowadź dane ręcznie."
- 2 przyciski:
  - "Spróbuj ponownie"
  - "Edytuj ręcznie"

**Komponenty dotknięte**: AIMode

---

### 10.5. Meal Creation - Validation Error (400)

**Scenariusz**: Dane wysłane do API są nieprawidłowe (nie powinno się zdarzyć przy poprawnej walidacji frontu)

**Obsługa**:

- Parsowanie details z response
- Mapowanie na validationErrors
- Wyświetlenie błędów przy odpowiednich polach (czerwone obramowanie + komunikat)
- Scroll do pierwszego błędnego pola
- Modal pozostaje otwarty

**Komponenty dotknięte**: MealForm, wszystkie input fields

---

### 10.6. Meal Creation - AI Generation Not Found (404)

**Scenariusz**: Podane ai_generation_id nie istnieje (rzadkie - może wystąpić przy problemach z state)

**Obsługa**:

- Alert (variant: destructive): "Nie znaleziono generacji AI. Wygeneruj posiłek ponownie."
- Przycisk "Wróć do generacji" - przełącza do trybu AI, resetuje aiResult
- Użytkownik musi wygenerować ponownie

**Komponenty dotknięte**: MealForm

---

### 10.7. Meal Creation - API Error (500)

**Scenariusz**: Błąd serwera, bazy danych, itp.

**Obsługa**:

- Alert (variant: destructive): "Nie udało się zapisać posiłku. Spróbuj ponownie."
- Przycisk "Spróbuj ponownie"
- Modal pozostaje otwarty, dane zachowane

**Komponenty dotknięte**: MealForm

---

### 10.8. Macro Warning (informacyjny, nie error)

**Scenariusz**: Suma kalorii z makro różni się >5% od podanych kalorii

**Obsługa**:

- Alert (variant: warning): "Suma kalorii z makroskładników ({calculated} kcal) różni się o więcej niż 5% od podanych kalorii ({provided} kcal). Sprawdź wprowadzone wartości."
- Przycisk "Przelicz automatycznie" - ustawia calories na calculated
- NIE blokuje submitu - użytkownik może zignorować

**Komponenty dotknięte**: ManualMode > MacroWarning

---

### 10.9. Date Warning (informacyjny, nie error)

**Scenariusz**: Data >7 dni wstecz

**Obsługa**:

- Alert (variant: warning): "Data jest sprzed {days} dni"
- NIE blokuje submitu
- Użytkownik może kontynuować

**Komponenty dotknięte**: CommonFields > DateWarning

---

### 10.10. Unexpected Error (catch-all)

**Scenariusz**: Nieoczekiwany błąd w kodzie frontendu

**Obsługa**:

- Error boundary na poziomie AddMealModal
- Fallback UI: Alert + komunikat "Wystąpił nieoczekiwany błąd"
- Przycisk "Zamknij" - zamyka modal
- Logowanie błędu do konsoli (dla developera)

**Komponenty dotknięte**: AddMealModal (error boundary)

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu

1.1. Utworzenie katalogu dla komponentów widoku:

```
src/
  components/
    add-meal/
      AddMealModal.tsx
      MealForm.tsx
      SegmentedControl.tsx
      ai-mode/
        AIMode.tsx
        ExampleChips.tsx
        LoadingState.tsx
        AIResult.tsx
      manual-mode/
        ManualMode.tsx
        MacroInputs.tsx
        MacroWarning.tsx
      common-fields/
        CommonFields.tsx
        CategorySelector.tsx
      FormActions.tsx
      CharacterCounter.tsx
```

1.2. Utworzenie plików dla typów i hooków:

```
src/
  types/
    add-meal.types.ts
  hooks/
    useAddMealForm.ts
    useCharacterCounter.ts
    useDateValidation.ts
  lib/
    validation/
      meal-form.validation.ts
    utils/
      meal-form.utils.ts
```

---

### Krok 2: Implementacja typów i stałych

2.1. Utworzyć plik `src/types/add-meal.types.ts` z:

- MealFormMode
- AILoadingStage
- MacroWarningInfo
- FormValidationError
- DateValidationWarning
- MealFormState
- AIGenerationResult

  2.2. Utworzyć plik `src/lib/constants/meal-form.constants.ts` z:

- CATEGORY_ICONS
- AI_LOADING_STAGES
- MEAL_EXAMPLES
- VALIDATION_LIMITS

---

### Krok 3: Implementacja pomocniczych utilities i walidacji

3.1. Utworzyć `src/lib/utils/meal-form.utils.ts`:

- `formatDateTime(date: string, time: string): string` - łączenie daty i czasu w ISO 8601
- `calculateMacroCalories(protein, carbs, fats): number` - obliczanie kalorii z makro
- `detectCategoryFromTime(time: string): MealCategory | null` - auto-detect kategorii
- `calculateMacroDifference(calculated, provided): number` - obliczanie różnicy %

  3.2. Utworzyć `src/lib/validation/meal-form.validation.ts`:

- `validatePrompt(prompt: string): FormValidationError | null`
- `validateDescription(description: string): FormValidationError | null`
- `validateCalories(calories: number | null): FormValidationError | null`
- `validateMacro(value: number | null, field: string): FormValidationError | null`
- `validateDate(date: string): DateValidationWarning | null`

---

### Krok 4: Implementacja prostych komponentów UI

4.1. **CharacterCounter.tsx**:

- Props: current, max
- Logika koloru (szary/żółty/czerwony)
- Renderowanie: "{current}/{max}"

  4.2. **ExampleChips.tsx**:

- Props: examples, onSelect, disabled
- Mapowanie examples na Button chips
- onClick: onSelect(example)

  4.3. **LoadingState.tsx**:

- Props: stage
- Renderowanie Spinner + ProgressDots + StageText
- Animacje CSS

  4.4. **SegmentedControl.tsx**:

- Props: value, onChange, disabled
- 2 buttony (AI, Manual)
- Sliding indicator (animowany)
- Kliknięcie: onChange(newValue)

---

### Krok 5: Implementacja CategorySelector

5.1. **CategorySelector.tsx**:

- Props: value, onChange
- 4 buttony z ikonami (CATEGORY_ICONS)
- Toggle logic: kliknięcie na wybrany → null, na inny → wybierz
- Styling: wybrany ma bg-primary

---

### Krok 6: Implementacja MacroInputs i MacroWarning

6.1. **MacroInputs.tsx**:

- Props: protein, carbs, fats, fiber, onChange, errors
- 4x (Label + Input type="number")
- onChange: parsowanie value i wywołanie onChange(field, value)
- Wyświetlanie błędów z errors

  6.2. **MacroWarning.tsx**:

- Props: calculatedCalories, providedCalories, differencePercent, onAutoCalculate
- Alert (variant: warning)
- Komunikat z wartościami
- Button "Przelicz automatycznie"

---

### Krok 7: Implementacja AIResult

7.1. **AIResult.tsx**:

- Props: result, onAccept, onRegenerate, onEditManually, regenerateLoading
- Layout:
  - Duża liczba kalorii (result.generated_calories)
  - Grid 2x2 z makroskładnikami
  - Assumptions text (mały font, italic)
- 3 przyciski w row:
  - "Dodaj" (primary)
  - "Generuj ponownie" (outline, z loading state)
  - "Edytuj ręcznie" (ghost)

---

### Krok 8: Implementacja AIMode

8.1. **AIMode.tsx**:

- Props: według interfejsu z sekcji 4.4
- Layout:
  - Label + Textarea (prompt)
  - CharacterCounter (0/500)
  - ExampleChips
  - Button "Oblicz kalorie" (disabled gdy prompt pusty)
- Conditional rendering:
  - Jeśli aiLoading: LoadingState (stage)
  - Jeśli aiError: Alert + przyciski "Spróbuj ponownie" / "Edytuj ręcznie"
  - Jeśli aiResult && status === 'completed': AIResult
  - Jeśli aiResult && status === 'failed': Alert z error_message + przyciski

---

### Krok 9: Implementacja ManualMode

9.1. **ManualMode.tsx**:

- Props: według interfejsu z sekcji 4.8
- Layout:
  - Label + Textarea (description) + CharacterCounter
  - Label + Input (calories, type="number", required)
  - MacroInputs
  - MacroWarning (conditional)
- onFieldChange: aktualizacja przez props
- Wyświetlanie validationErrors przy polach

---

### Krok 10: Implementacja CommonFields

10.1. **CommonFields.tsx**:

- Props: według interfejsu z sekcji 4.11
- Layout:
  - Label + CategorySelector
  - Label + DatePicker (shadcn/ui)
  - DateWarning (conditional Alert)
  - Label + TimePicker (shadcn/ui)
- onChange handlers: wywołanie propsów

---

### Krok 11: Implementacja FormActions

11.1. **FormActions.tsx**:

- Props: onCancel, onSubmit, submitDisabled, submitLoading
- Layout (flex row, justify-between):
  - Button "Anuluj" (variant: ghost)
  - Button "Dodaj posiłek" (variant: default, z loading spinner)

---

### Krok 12: Implementacja hooków pomocniczych

12.1. **useCharacterCounter.ts**:

- Input: text, max
- Output: count, max, percent, color

  12.2. **useDateValidation.ts**:

- Input: date
- Output: DateValidationWarning | null
- Logika: sprawdzenie przyszłości i >7 dni wstecz

---

### Krok 13: Implementacja głównego hooka useAddMealForm

13.1. **useAddMealForm.ts**:

- Implementacja stanu (useState<MealFormState>)
- Implementacja wszystkich funkcji według sekcji 6.1 i 6.3
- Kluczowe funkcje:
  - generateAI() - z multi-stage loading
  - submitMeal() - z komunikacją API
  - calculateMacroWarning() - obliczanie różnicy makro
  - validateForm() - walidacja przed submitem
  - switchToManual(), switchToAI() - przełączanie trybów

  13.2. Testowanie hooka w izolacji (opcjonalnie: unit testy)

---

### Krok 14: Implementacja MealForm

14.1. **MealForm.tsx**:

- Props: onClose, onSuccess
- Użycie hooka: `const form = useAddMealForm()`
- Layout:
  - SegmentedControl (mode, onChange: form.setMode)
  - Conditional: AIMode lub ManualMode
  - Separator
  - CommonFields
  - ValidationErrors (lista form.state.validationErrors)
  - FormActions
- handleSubmit: async
  ```typescript
  const handleSubmit = async () => {
    try {
      const result = await form.submitMeal();
      onSuccess(result);
      onClose();
      toast.success("Posiłek dodany");
    } catch (error) {
      // Błędy są obsługiwane wewnątrz hooka
    }
  };
  ```

---

### Krok 15: Implementacja AddMealModal

15.1. **AddMealModal.tsx**:

- Props: isOpen, onClose, onSuccess
- Użycie shadcn/ui Dialog:
  ```tsx
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogOverlay />
    <DialogContent className="...">
      <DialogHeader>
        <DialogTitle>Dodaj posiłek</DialogTitle>
      </DialogHeader>
      <MealForm onClose={onClose} onSuccess={onSuccess} />
    </DialogContent>
  </Dialog>
  ```
- Responsywność: fullscreen na mobile, dialog na desktop
- Focus trap i accessibility (zapewnione przez Dialog z shadcn)

---

### Krok 16: Stylowanie z Tailwind CSS

16.1. Stylowanie wszystkich komponentów zgodnie z designem:

- Mobile-first approach
- Responsive breakpoints (sm, md, lg)
- Użycie zmiennych CSS theme (primary, destructive, warning)
- Animacje (fade-in, slide, transitions)

  16.2. Szczególne uwagi:

- Modal fullscreen na mobile: `h-screen w-screen md:h-auto md:max-w-2xl`
- Kolory alertów: warning (żółty), destructive (czerwony)
- Loading spinners: użycie shadcn Spinner
- Progress dots: custom CSS animation

---

### Krok 17: Integracja z API

17.1. Testowanie wywołań API:

- POST /api/v1/ai-generations (różne scenariusze: success, failed, 429, 500)
- POST /api/v1/meals (success, 400, 404, 500, with warnings)

  17.2. Obsługa wszystkich przypadków błędów zgodnie z sekcją 10

---

### Krok 18: Accessibility

18.1. Sprawdzenie:

- Focus trap w modalu działa poprawnie
- Focus wraca po zamknięciu
- Wszystkie inputy mają labels (htmlFor)
- Error announcements przez aria-live
- Keyboard navigation działa (Tab, Enter, Escape)
- Screen reader friendly

  18.2. Testy z:

- Keyboard only
- Screen reader (NVDA, VoiceOver)

---

### Krok 19: Testowanie responsywności

19.1. Testowanie na różnych rozdzielczościach:

- Mobile (320px - 480px): fullscreen modal
- Tablet (481px - 768px): fullscreen modal
- Desktop (>768px): dialog modal

  19.2. Sprawdzenie wszystkich interakcji na touch devices

---

### Krok 20: Testowanie integracyjne

20.1. Scenariusze end-to-end:

- US-005: Dodanie posiłku AI (sukces)
- US-006: Dodanie posiłku manual
- US-007: AI unclear description → regeneracja lub manual
- US-008: Kategoryzowanie i datowanie
- US-009: Anulowanie w różnych etapach
- Przełączanie AI ↔ Manual (z prepopulacją i bez)
- Rate limiting
- Wszystkie scenariusze błędów

---

### Krok 21: Performance optimization

21.1. Optymalizacje:

- Memoizacja komponentów (React.memo gdzie potrzeba)
- useCallback dla funkcji przekazywanych jako props
- useMemo dla obliczeń (np. calculateMacroWarning)
- Lazy loading modala (jeśli nie jest używany)
- Debouncing dla character counter (jeśli potrzeba)

---

### Krok 22: Dokumentacja

22.1. Dodanie dokumentacji do kodu:

- JSDoc dla wszystkich funkcji i komponentów
- Przykłady użycia w README
- Komentarze dla skomplikowanych fragmentów logiki

---

### Krok 23: Code review i refactoring

23.1. Przegląd kodu:

- Sprawdzenie zgodności z konwencjami projektu
- Usunięcie duplikacji
- Refactoring zbyt długich funkcji
- Sprawdzenie typów TypeScript

---

### Krok 24: Finalne testy i deploy

24.1. Pełne testy manualne wszystkich flow
24.2. Testy regresji (czy inne części aplikacji działają)
24.3. Deploy do środowiska testowego
24.4. Feedback od PM/QA
24.5. Fixes i deploy do produkcji

---

## Koniec planu implementacji

Ten plan implementacji zapewnia szczegółowy roadmap dla wdrożenia widoku AddMeal. Każdy krok jest zaprojektowany tak, aby być niezależnym etapem, który można zaimplementować, przetestować i zreviewować przed przejściem do kolejnego. Implementacja powinna zajść bottom-up (od prostych komponentów do złożonych) i być iteracyjna (testy po każdym kroku).
