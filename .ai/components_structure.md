# Struktura komponentów AddMeal - Diagram zależności

Struktura rozpoczynająca się od `src/components/add-meal/MealModal.tsx`

## Główna hierarchia komponentów (ASCII Diagram)

```
MealModal.tsx
│
├─── Dialog (UI)
│    ├─── DialogContent
│    ├─── DialogHeader
│    ├─── DialogTitle
│    └─── DialogDescription
│
└─── MealForm.tsx
     │
     ├─── useAddMealForm() [HOOK]
     │    │
     │    ├─── useState<MealFormState>
     │    ├─── meal-form.utils.ts [HELPERS]
     │    │    ├─── getCurrentDate()
     │    │    ├─── getCurrentTime()
     │    │    ├─── calculateMacroCalories()
     │    │    ├─── calculateMacroDifference()
     │    │    ├─── detectCategoryFromTime()
     │    │    └─── formatPercentDifference()
     │    │
     │    ├─── meal-form.validation.ts [VALIDATORS]
     │    │    ├─── validatePrompt()
     │    │    ├─── validateDescription()
     │    │    ├─── validateCalories()
     │    │    ├─── validateMacro()
     │    │    ├─── validateDate()
     │    │    └─── validateAIGenerationId()
     │    │
     │    └─── meal-form.constants.ts [CONSTANTS]
     │         ├─── MEAL_EXAMPLES
     │         ├─── VALIDATION_LIMITS
     │         ├─── AI_LOADING_STAGES
     │         └─── CATEGORY_ICONS
     │
     ├─── LoadingOverlay.tsx
     │    └─── Loader2 (lucide-react)
     │
     ├─── SegmentedControl.tsx
     │    └─── [AI / Ręcznie toggle buttons]
     │
     ├─── AIMode.tsx [Tryb AI]
     │    │
     │    ├─── Textarea (UI)
     │    ├─── Label (UI)
     │    ├─── Button (UI)
     │    ├─── Alert (UI)
     │    ├─── AlertDescription (UI)
     │    │
     │    ├─── CharacterCounter.tsx
     │    │    └─── [current/max text with color logic]
     │    │
     │    ├─── ExampleChips.tsx
     │    │    └─── Button (UI) [array of chips]
     │    │
     │    ├─── LoadingState.tsx
     │    │    └─── [Spinner + Progress dots + Stage text]
     │    │
     │    └─── AIResult.tsx
     │         │
     │         ├─── Card (UI)
     │         ├─── CardContent (UI)
     │         ├─── Button (UI)
     │         └─── Loader2 (lucide-react)
     │
     ├─── ManualMode.tsx [Tryb Ręczny]
     │    │
     │    ├─── Textarea (UI)
     │    ├─── Label (UI)
     │    ├─── Input (UI)
     │    │
     │    ├─── CharacterCounter.tsx
     │    │    └─── [current/max text with color logic]
     │    │
     │    ├─── MacroInputs.tsx
     │    │    │
     │    │    ├─── Label (UI)
     │    │    └─── Input (UI) [x4: protein, carbs, fats, fiber]
     │    │
     │    └─── MacroWarning.tsx
     │         │
     │         ├─── Alert (UI)
     │         ├─── AlertDescription (UI)
     │         ├─── AlertTriangle (lucide-react)
     │         └─── Button (UI)
     │
     ├─── Separator (UI)
     │
     ├─── CommonFields.tsx [Wspólne pola]
     │    │
     │    ├─── Label (UI)
     │    ├─── Input (UI) [date, time]
     │    ├─── Alert (UI)
     │    ├─── AlertDescription (UI)
     │    ├─── AlertCircle (lucide-react)
     │    ├─── AlertTriangle (lucide-react)
     │    │
     │    └─── CategorySelector.tsx
     │         │
     │         └─── Button (UI) [x5: breakfast, lunch, dinner, snack, other]
     │
     └─── FormActions.tsx
          │
          ├─── Button (UI) [Anuluj]
          ├─── Button (UI) [Dodaj posiłek / Zapisz zmiany]
          └─── Loader2 (lucide-react)
```

## Zależności zewnętrzne

### UI Components (@/components/ui/\*)

```
@radix-ui/react-dialog ─→ dialog.tsx
@radix-ui/react-separator ─→ separator.tsx
lucide-react ─→ icons: Sparkles, AlertCircle, AlertTriangle, Loader2, XIcon
```

### Typy (src/types/\*)

```
add-meal.types.ts
│
├─── MealFormMode = "ai" | "manual"
├─── MealFormEditMode = "create" | "edit"
├─── AILoadingStage = 0 | 1 | 2
├─── MacroWarningInfo
├─── FormValidationError
├─── DateValidationWarning
├─── MealFormState
├─── AIGenerationResult
│
└─── Props Interfaces:
     ├─── AddMealModalProps
     ├─── MealFormProps
     ├─── SegmentedControlProps
     ├─── AIModeProps
     ├─── ExampleChipsProps
     ├─── LoadingStateProps
     ├─── AIResultProps
     ├─── ManualModeProps
     ├─── MacroInputsProps
     ├─── MacroWarningProps
     ├─── CommonFieldsProps
     ├─── CategorySelectorProps
     ├─── FormActionsProps
     └─── CharacterCounterProps

types/index.ts
│
├─── MealCategory = "breakfast" | "lunch" | "dinner" | "snack" | "other"
├─── AIGenerationResponseDTO
└─── CreateMealResponseDTO
```

### Hook (src/hooks/\*)

```
useAddMealForm.ts
│
├─── Input: initialDate?: string
│
├─── Return: UseAddMealFormReturn
│    ├─── state: MealFormState
│    ├─── setMode()
│    ├─── switchToManual()
│    ├─── switchToAI()
│    ├─── updateField()
│    ├─── updatePrompt()
│    ├─── generateAI()
│    ├─── acceptAIResult()
│    ├─── loadMealForEdit()
│    ├─── calculateMacroWarning()
│    ├─── validateDateField()
│    ├─── autoCalculateCalories()
│    ├─── autoDetectCategory()
│    ├─── validateForm()
│    ├─── submitMeal()
│    ├─── reset()
│    ├─── isAIMode
│    ├─── isManualMode
│    ├─── canSubmit
│    └─── hasAIResult
│
└─── Dependencies:
     ├─── meal-form.utils.ts
     ├─── meal-form.validation.ts
     └─── meal-form.constants.ts
```

### Helpers (src/lib/helpers/\*)

```
meal-form.utils.ts
│
├─── getCurrentDate() → string (YYYY-MM-DD)
├─── getCurrentTime() → string (HH:MM)
├─── calculateMacroCalories(protein, carbs, fats) → number
├─── calculateMacroDifference(calculated, provided) → number (%)
├─── detectCategoryFromTime(time) → MealCategory | null
└─── formatPercentDifference(percent) → string
```

### Validation (src/lib/validation/\*)

```
meal-form.validation.ts
│
├─── validatePrompt(prompt) → FormValidationError | null
├─── validateDescription(desc) → FormValidationError | null
├─── validateCalories(cal) → FormValidationError | null
├─── validateMacro(value, field) → FormValidationError | null
├─── validateDate(date) → DateValidationWarning | null
└─── validateAIGenerationId(id) → FormValidationError | null
```

### Constants (src/lib/constants/\*)

```
meal-form.constants.ts
│
├─── MEAL_EXAMPLES: string[]
├─── VALIDATION_LIMITS
│    ├─── PROMPT_MIN_LENGTH
│    ├─── PROMPT_MAX_LENGTH
│    ├─── DESCRIPTION_MAX_LENGTH
│    ├─── CALORIES_MIN
│    ├─── CALORIES_MAX
│    ├─── MACRO_MIN
│    ├─── MACRO_MAX
│    ├─── MACRO_WARNING_THRESHOLD
│    └─── OLD_DATE_WARNING_DAYS
├─── AI_LOADING_STAGES: Record<AILoadingStage, string>
└─── CATEGORY_ICONS: Record<MealCategory, string>
```

## API Endpoints

```
POST   /api/v1/ai-generations
       ├─── Request: { prompt: string }
       └─── Response: AIGenerationResponseDTO

POST   /api/v1/meals
       ├─── Request: CreateMealRequestDTO
       │    ├─── description
       │    ├─── calories
       │    ├─── protein?
       │    ├─── carbs?
       │    ├─── fats?
       │    ├─── category?
       │    ├─── meal_timestamp
       │    ├─── input_method: "ai" | "manual"
       │    └─── ai_generation_id? (if input_method === "ai")
       └─── Response: CreateMealResponseDTO

GET    /api/v1/meals/:id
       └─── Response: MealDTO

PATCH  /api/v1/meals/:id
       ├─── Request: UpdateMealRequestDTO
       │    ├─── description
       │    ├─── calories
       │    ├─── protein?
       │    ├─── carbs?
       │    ├─── fats?
       │    ├─── category?
       │    └─── meal_timestamp
       └─── Response: CreateMealResponseDTO
```

## Data Flow

### 1. Tworzenie nowego posiłku (Tryb AI)

```
User Input (prompt)
    ↓
AIMode.tsx → onGenerate()
    ↓
useAddMealForm.generateAI()
    ↓
POST /api/v1/ai-generations
    ↓
AIResult.tsx → onAccept()
    ↓
useAddMealForm.acceptAIResult()
    ↓
MealForm → handleSubmit()
    ↓
useAddMealForm.submitMeal()
    ↓
POST /api/v1/meals (with ai_generation_id)
    ↓
onSuccess(meal) → Parent Component
```

### 2. Tworzenie nowego posiłku (Tryb Manual)

```
User Input (description, calories, macros)
    ↓
ManualMode.tsx → onFieldChange()
    ↓
useAddMealForm.updateField()
    ↓
MealForm → handleSubmit()
    ↓
useAddMealForm.submitMeal()
    ↓
POST /api/v1/meals (input_method: "manual")
    ↓
onSuccess(meal) → Parent Component
```

### 3. Edycja posiłku

```
MealModal (with mealId)
    ↓
MealForm.useEffect() → loadMealForEdit(mealId)
    ↓
useAddMealForm.loadMealForEdit()
    ↓
GET /api/v1/meals/:id
    ↓
setState (prepopulate form)
    ↓
User edits fields
    ↓
MealForm → handleSubmit()
    ↓
useAddMealForm.submitMeal()
    ↓
PATCH /api/v1/meals/:id
    ↓
onSuccess(meal) → Parent Component
```

## Walidacja

### Frontend Validation

```
Prompt (AI Mode):
  ├─── Min length: 3
  └─── Max length: 500

Description (Manual Mode):
  ├─── Required
  └─── Max length: 500

Calories:
  ├─── Required
  ├─── Min: 1
  └─── Max: 10000

Macros (protein, carbs, fats, fiber):
  ├─── Optional
  ├─── Min: 0
  └─── Max: 1000

Date:
  ├─── Cannot be in the future (blocks submit)
  └─── Warning if > 7 days old

Macro Warning:
  └─── Triggered if difference > 5%
```

### Backend Validation

```
API returns 400 with validation errors:
  {
    "details": {
      "field_name": "error_message"
    }
  }
```

## State Management

### MealFormState (w useAddMealForm)

```
{
  // Mode
  mode: "ai" | "manual",
  editMode: "create" | "edit",
  editingMealId: string | null,

  // Form Data
  description: string,
  calories: number | null,
  protein: number | null,
  carbs: number | null,
  fats: number | null,
  fiber: number | null,
  category: MealCategory | null,
  date: string,  // YYYY-MM-DD
  time: string,  // HH:MM

  // AI State
  aiPrompt: string,
  aiGenerationId: string | null,
  aiResult: AIGenerationResponseDTO | null,
  aiLoading: boolean,
  aiLoadingStage: 0 | 1 | 2,
  aiError: string | null,

  // Submit State
  submitLoading: boolean,
  submitError: string | null,

  // Load State
  loadingMeal: boolean,
  loadMealError: string | null,

  // Validation
  validationErrors: FormValidationError[],
  macroWarning: MacroWarningInfo | null,
  dateWarning: DateValidationWarning | null
}
```

## Funkcjonalności specjalne

### 1. Auto-calculate Calories

```
ManualMode → MacroWarning → "Przelicz automatycznie"
    ↓
useAddMealForm.autoCalculateCalories()
    ↓
calories = (protein * 4) + (carbs * 4) + (fats * 9)
```

### 2. Auto-detect Category

```
CommonFields → Time Input onChange
    ↓
useAddMealForm.autoDetectCategory(time)
    ↓
06:00-10:00 → "breakfast"
11:00-15:00 → "lunch"
17:00-21:00 → "dinner"
other → null
```

### 3. Multi-stage AI Loading

```
Stage 0 (0ms): "Analizuję opis..."
    ↓
Stage 1 (1000ms): "Szacuję kalorie..."
    ↓
Stage 2 (2000ms): "Obliczam makroskładniki..."
    ↓
Result
```

### 4. Switch to Manual with Prepopulation

```
AIResult → "Edytuj ręcznie"
    ↓
useAddMealForm.switchToManual(prepopulate: true)
    ↓
mode = "manual"
description = aiPrompt
calories = aiResult.generated_calories
protein = aiResult.generated_protein
carbs = aiResult.generated_carbs
fats = aiResult.generated_fats
```

## Podsumowanie komponentów (17 plików)

```
src/components/add-meal/
├── MealModal.tsx                    [Entry Point]
├── MealForm.tsx                     [Main Orchestrator]
├── SegmentedControl.tsx             [Mode Toggle]
├── LoadingOverlay.tsx               [Full-screen loader]
├── CharacterCounter.tsx             [Shared counter]
├── ExampleChips.tsx                 [Quick examples]
├── FormActions.tsx                  [Submit/Cancel buttons]
│
├── ai-mode/
│   ├── AIMode.tsx                   [AI Mode Container]
│   ├── AIResult.tsx                 [AI Result Display]
│   └── LoadingState.tsx             [AI Loading Animation]
│
├── manual-mode/
│   ├── ManualMode.tsx               [Manual Mode Container]
│   ├── MacroInputs.tsx              [4 macro input fields]
│   └── MacroWarning.tsx             [Macro warning alert]
│
└── common-fields/
    ├── CommonFields.tsx             [Shared fields container]
    └── CategorySelector.tsx         [Category buttons]
```

## Używane biblioteki UI

```
@radix-ui/react-dialog       → Dialog, DialogContent, etc.
@radix-ui/react-separator    → Separator
lucide-react                 → Icons (Sparkles, AlertCircle, etc.)
```

## Kluczowe wzorce projektowe

1. **Composition Pattern** - komponenty są kompozycją mniejszych komponentów
2. **Container/Presentational** - MealForm (container) + AIMode/ManualMode (presentational)
3. **Controlled Components** - wszystkie inputy kontrolowane przez useAddMealForm
4. **Props Drilling** - hook przekazuje props przez MealForm do child components
5. **Single Source of Truth** - stan w useAddMealForm
6. **Optimistic UI** - loading states i staged animations
7. **Error Boundaries** - walidacja na różnych poziomach (frontend + backend)
