# Plan implementacji widoku EditMeal

## 1. Przegląd

Widok **EditMeal** umożliwia użytkownikowi edycję wcześniej dodanego posiłku. Wykorzystuje on te same komponenty co widok AddMeal, ale w trybie edycji. Widok pobiera dane istniejącego posiłku z API, prepopuluje formularz, a następnie przy zapisie wysyła zaktualizowane dane używając metody PATCH.

**Kluczowe cechy:**
- Wykorzystanie istniejących komponentów z widoku AddMeal (MealModal, MealForm, etc.)
- Prepopulacja formularza danymi z API (GET /api/v1/meals/:id)
- Możliwość edycji opisu i regeneracji AI
- Możliwość edycji wartości kalorycznych i makroskładników
- Automatyczna zmiana `input_method` na `'ai-edited'` gdy edytowany jest posiłek wygenerowany przez AI
- Zapis zmian używając PATCH /api/v1/meals/:id
- Obsługa błędów (404 gdy posiłek nie istnieje, walidacja, itp.)

## 2. Routing widoku

Widok jest dostępny jako **modal/overlay** wywoływany programowo z innych części aplikacji (Dashboard, DayView).

**Sposób wywoływania**:
- Użycie tego samego komponentu `MealModal` (poprzednio `AddMealModal`)
- Komponent przyjmuje opcjonalny props `mealId?: string`
- Jeśli `mealId` jest podane, modal działa w trybie edycji
- Jeśli `mealId` nie jest podane, modal działa w trybie dodawania

**Przykład użycia**:
```tsx
const [editMealId, setEditMealId] = useState<string | null>(null);

// Otwieranie w trybie edycji
<MealModal
  isOpen={editMealId !== null}
  mealId={editMealId ?? undefined}
  onClose={() => setEditMealId(null)}
  onSuccess={(meal) => {
    // Odśwież listę posiłków
    toast.success('Posiłek zaktualizowany');
    setEditMealId(null);
  }}
/>

// Trigger z listy posiłków
<button onClick={() => setEditMealId(meal.id)}>Edytuj</button>
```

## 3. Struktura komponentów

Widok EditMeal **wykorzystuje te same komponenty** co AddMeal. Nie są potrzebne nowe komponenty - jedynie modyfikacje istniejących w celu obsługi trybu edycji.

```
MealModal (props: isOpen, mealId?, onClose, onSuccess)
└── MealForm (props: mealId?, onClose, onSuccess)
    ├── LoadingOverlay (warunkowy - gdy loadingMeal)
    ├── SegmentedControl (AI/Manual)
    ├── AIMode
    │   ├── ExampleChips
    │   ├── LoadingState
    │   └── AIResult
    ├── ManualMode
    │   ├── MacroInputs
    │   └── MacroWarning
    ├── CommonFields
    │   └── CategorySelector
    └── FormActions (tekst przycisku: "Zapisz zmiany" w trybie edycji)
```

**Różnice względem AddMeal:**
1. **MealModal**: Przyjmuje opcjonalny `mealId` i przekazuje go do MealForm
2. **MealForm**: Przy montowaniu wywołuje `loadMealForEdit(mealId)` jeśli `mealId` jest podane
3. **LoadingOverlay**: Nowy komponent wyświetlany podczas ładowania danych posiłku (state.loadingMeal)
4. **FormActions**: Zmienia tekst przycisku z "Dodaj posiłek" na "Zapisz zmiany" w trybie edycji
5. **useAddMealForm**: Rozszerzony o logikę PATCH i śledzenie zmian input_method

## 4. Szczegóły komponentów

### 4.1. MealModal

**Opis**: Główny kontener modalny. W trybie edycji przekazuje `mealId` do `MealForm`.

**Główne elementy**:
- `Dialog` z shadcn/ui (root)
- `DialogOverlay` (backdrop)
- `DialogContent` (kontener z zawartością)
- `DialogHeader` z dynamicznym tytułem
- `MealForm` (główny formularz)

**Obsługiwane interakcje**:
- `onClose`: zamknięcie modala
- `onSuccess`: callback po pomyślnym zapisie

**Walidacja**: Brak (przekazuje do MealForm)

**Typy**:
- Props: `AddMealModalProps` (z opcjonalnym `mealId`)

**Props**:
```typescript
interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
  mealId?: string; // Jeśli podane, modal działa w trybie edycji
}
```

**Zmiany względem AddMeal**:
- Tytuł modala zmienny: `{mealId ? 'Edytuj posiłek' : 'Dodaj posiłek'}`
- Przekazanie `mealId` do `MealForm`

---

### 4.2. MealForm

**Opis**: Główny komponent formularza. W trybie edycji automatycznie ładuje dane posiłku przy montowaniu.

**Główne elementy**:
- `LoadingOverlay` (warunkowy - gdy `state.loadingMeal`)
- `form` element
- `SegmentedControl`
- `AIMode` lub `ManualMode`
- `CommonFields`
- `FormActions`

**Obsługiwane interakcje**:
- Wszystkie jak w AddMeal
- Dodatkowo: automatyczne wywołanie `loadMealForEdit(mealId)` w `useEffect` przy montowaniu

**Walidacja**:
- Taka sama jak w AddMeal
- Dodatkowo: sprawdzenie czy dane się zmieniły (opcjonalne - do UX)

**Typy**:
- Props: `MealFormProps` (z opcjonalnym `mealId`)

**Props**:
```typescript
interface MealFormProps {
  onClose: () => void;
  onSuccess: (meal: CreateMealResponseDTO) => void;
  mealId?: string; // Jeśli podane, formularz działa w trybie edycji
}
```

**Zmiany względem AddMeal**:
```tsx
useEffect(() => {
  if (mealId) {
    form.loadMealForEdit(mealId).catch((error) => {
      console.error('Failed to load meal:', error);
      toast.error('Nie udało się wczytać posiłku');
      onClose();
    });
  }
}, [mealId]);
```

---

### 4.3. LoadingOverlay

**Opis**: Nowy komponent - overlay z spinnerem wyświetlany podczas ładowania danych posiłku.

**Główne elementy**:
- `div` z pełnym overlay (absolute positioning)
- `Spinner` (animowany)
- Tekst "Wczytuję dane posiłku..."

**Obsługiwane interakcje**: Brak (tylko wizualizacja)

**Walidacja**: Brak

**Typy**:
- Props: brak (statyczny komponent)

**Props**: Brak

**Implementacja**:
```tsx
export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Wczytuję dane posiłku...</p>
      </div>
    </div>
  );
}
```

---

### 4.4. FormActions

**Opis**: Footer formularza z przyciskami akcji. Tekst przycisku submit zmienia się w zależności od trybu.

**Główne elementy**:
- `Button` "Anuluj" (variant: ghost)
- `Button` z dynamicznym tekstem (variant: default, z loading spinner)

**Obsługiwane interakcje**:
- `onCancel`: anulowanie i zamknięcie modala
- `onSubmit`: zapisanie posiłku

**Walidacja**: Brak (wykonywana w MealForm przed submit)

**Typy**:
- Props: `FormActionsProps` (z opcjonalnym `editMode`)

**Props**:
```typescript
interface FormActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
  submitDisabled: boolean;
  submitLoading: boolean;
  editMode?: MealFormEditMode; // 'create' | 'edit'
}
```

**Zmiany względem AddMeal**:
```tsx
const buttonText = editMode === 'edit' ? 'Zapisz zmiany' : 'Dodaj posiłek';

<Button onClick={onSubmit} disabled={submitDisabled || submitLoading}>
  {submitLoading && <Spinner className="mr-2 h-4 w-4" />}
  {buttonText}
</Button>
```

---

### 4.5. Pozostałe komponenty

Wszystkie pozostałe komponenty (SegmentedControl, AIMode, ManualMode, MacroInputs, MacroWarning, CommonFields, CategorySelector, CharacterCounter, ExampleChips, LoadingState, AIResult) **pozostają bez zmian** i działają identycznie jak w trybie dodawania.

## 5. Typy

### 5.1. Istniejące typy z API (z src/types.ts)

```typescript
// Request/Response typy dla API meals
import type {
  MealResponseDTO,         // GET /api/v1/meals/:id response
  UpdateMealRequestDTO,    // PATCH /api/v1/meals/:id request
  UpdateMealResponseDTO,   // PATCH /api/v1/meals/:id response
  MealWarningDTO,
  MealCategory,
  InputMethodType,
} from '../types';
```

### 5.2. Istniejące typy ViewModel (z src/types/add-meal.types.ts)

Wszystkie typy są już zdefiniowane i obsługują tryb edycji:

```typescript
/**
 * Tryb edycji formularza
 */
export type MealFormEditMode = 'create' | 'edit';

/**
 * Stan formularza - już zawiera pola dla trybu edycji
 */
export interface MealFormState {
  // Tryb formularza
  mode: MealFormMode;
  editMode: MealFormEditMode;     // 'create' | 'edit'
  editingMealId: string | null;   // ID edytowanego posiłku

  // ... wszystkie inne pola bez zmian

  // Stan ładowania danych posiłku do edycji
  loadingMeal: boolean;
  loadMealError: string | null;
}
```

### 5.3. Rozszerzenia typów

Jedyne rozszerzenie - typ dla śledzenia oryginalnych wartości (opcjonalne - do logiki input_method):

```typescript
/**
 * Oryginalne wartości posiłku przed edycją
 * Używane do określenia czy input_method powinno zmienić się na 'ai-edited'
 */
export interface OriginalMealValues {
  input_method: InputMethodType;
  description: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}
```

**Uwaga**: Ten typ jest opcjonalny i używany wewnętrznie w hooku. Można go nie implementować jeśli API automatycznie zmienia `input_method` na podstawie wysłanych danych.

## 6. Zarządzanie stanem

### 6.1. Hook useAddMealForm - rozszerzenia dla trybu edycji

Hook `useAddMealForm` **już zawiera** większość logiki dla trybu edycji:
- ✅ `editMode: MealFormEditMode` - śledzenie trybu
- ✅ `editingMealId: string | null` - ID edytowanego posiłku
- ✅ `loadingMeal`, `loadMealError` - stan ładowania
- ✅ `loadMealForEdit(mealId: string)` - funkcja ładowania danych

**Wymagane zmiany**:

#### 6.1.1. Modyfikacja funkcji `submitMeal()`

Obecna implementacja używa tylko POST. Trzeba dodać logikę dla PATCH:

```typescript
const submitMeal = useCallback(async (): Promise<CreateMealResponseDTO> => {
  // ... istniejąca walidacja ...

  setState(prev => ({ ...prev, submitLoading: true, submitError: null, validationErrors: [] }));

  try {
    const localDateTime = new Date(`${state.date}T${state.time}:00`);
    const timestamp = localDateTime.toISOString();

    // ZMIANA: Różne endpointy dla create vs edit
    const isEditMode = state.editMode === 'edit';
    const url = isEditMode
      ? `/api/v1/meals/${state.editingMealId}`
      : '/api/v1/meals';
    const method = isEditMode ? 'PATCH' : 'POST';

    // ZMIANA: Dla edit mode, przygotuj UpdateMealRequestDTO
    let requestData: any;

    if (isEditMode) {
      // PATCH - tylko zmienione pola (UpdateMealRequestDTO)
      requestData = {
        description: description,
        calories: calories!,
        protein: protein,
        carbs: carbs,
        fats: fats,
        category: state.category,
        meal_timestamp: timestamp,
      };

      // Opcjonalnie: Dodaj input_method jeśli się zmienił
      // (można polegać na backendzie który sam zmienia na 'ai-edited')
    } else {
      // POST - CreateMealRequestDTO (bez zmian)
      requestData = state.mode === 'ai'
        ? {
            description: description,
            calories: calories!,
            protein: protein,
            carbs: carbs,
            fats: fats,
            category: state.category,
            input_method: 'ai' as const,
            ai_generation_id: state.aiGenerationId!,
            meal_timestamp: timestamp,
          }
        : {
            description: description,
            calories: calories!,
            protein: protein,
            carbs: carbs,
            fats: fats,
            category: state.category,
            input_method: 'manual' as const,
            meal_timestamp: timestamp,
          };
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData),
    });

    // ... istniejąca obsługa błędów ...

    const result = await response.json();
    setState(prev => ({ ...prev, submitLoading: false }));

    return result;
  } catch (error) {
    // ... istniejąca obsługa błędów ...
  }
}, [state]);
```

#### 6.1.2. Modyfikacja funkcji `loadMealForEdit()`

Obecna implementacja jest poprawna, ale można dodać lepsze parsowanie daty/czasu i obsługę trybu:

```typescript
const loadMealForEdit = useCallback(async (mealId: string) => {
  setState(prev => ({
    ...prev,
    loadingMeal: true,
    loadMealError: null,
    editMode: 'edit',
    editingMealId: mealId,
  }));

  try {
    const response = await fetch(`/api/v1/meals/${mealId}`);

    if (response.status === 404) {
      throw new Error('Meal not found');
    }

    if (!response.ok) {
      throw new Error('Failed to load meal');
    }

    const meal: MealResponseDTO = await response.json();

    // Parse meal_timestamp
    const mealDate = new Date(meal.meal_timestamp);
    const date = mealDate.toISOString().split('T')[0]; // YYYY-MM-DD
    const hours = mealDate.getHours().toString().padStart(2, '0');
    const minutes = mealDate.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`; // HH:MM

    // Zawsze startuj w trybie manual dla edycji
    // (użytkownik może później przełączyć na AI i wygenerować ponownie)
    const mode: MealFormMode = 'manual';

    setState(prev => ({
      ...prev,
      mode,
      description: meal.description,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      fiber: null, // API nie zwraca fiber
      category: meal.category,
      date,
      time,
      loadingMeal: false,
      loadMealError: null,
    }));

    // Calculate warnings
    setTimeout(() => {
      calculateMacroWarning();
      validateDateField(date);
    }, 0);
  } catch (error) {
    const errorMessage = error instanceof Error && error.message === 'Meal not found'
      ? 'Posiłek nie został znaleziony'
      : 'Nie udało się wczytać posiłku. Spróbuj ponownie.';

    setState(prev => ({
      ...prev,
      loadingMeal: false,
      loadMealError: errorMessage,
    }));
    throw error;
  }
}, []);
```

### 6.2. Dodatkowe hooki

Nie są potrzebne nowe hooki - wszystkie istniejące hooki (`useCharacterCounter`, `useDateValidation`) działają bez zmian.

## 7. Integracja API

### 7.1. GET /api/v1/meals/:id

**Cel**: Pobranie danych istniejącego posiłku do edycji.

**Kiedy wywoływane**: Przy montowaniu `MealForm` gdy `mealId` jest podane.

**Request**:
```typescript
GET /api/v1/meals/{mealId}
```

**Response (200 OK)**:
```typescript
// Typ: MealResponseDTO
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
  meal_timestamp: string; // ISO 8601
  created_at: string;
  updated_at: string;
  ai_generation?: MealAIGenerationInfoDTO; // opcjonalne
}
```

**Response (404 Not Found)**:
```typescript
{
  error: "NOT_FOUND",
  message: "Meal not found"
}
```

**Frontend handling**:
```typescript
try {
  const response = await fetch(`/api/v1/meals/${mealId}`);

  if (response.status === 404) {
    toast.error('Posiłek nie został znaleziony');
    onClose();
    return;
  }

  if (!response.ok) throw new Error('Failed to load meal');

  const meal: MealResponseDTO = await response.json();

  // Prepopulacja formularza
  // ...
} catch (error) {
  toast.error('Nie udało się wczytać posiłku');
  onClose();
}
```

---

### 7.2. PATCH /api/v1/meals/:id

**Cel**: Aktualizacja istniejącego posiłku.

**Kiedy wywoływane**: Po kliknięciu przycisku "Zapisz zmiany" i pomyślnej walidacji.

**Request**:
```typescript
PATCH /api/v1/meals/{mealId}
Content-Type: application/json

// Typ: UpdateMealRequestDTO (wszystkie pola opcjonalne)
{
  description?: string;
  calories?: number;
  protein?: number | null;
  carbs?: number | null;
  fats?: number | null;
  category?: MealCategory | null;
  meal_timestamp?: string;
  input_method?: InputMethodType; // opcjonalne - backend może sam zmienić
}
```

**Przykład request**:
```json
{
  "description": "Jajka sadzone z chlebem (updated)",
  "calories": 450,
  "protein": 20.0,
  "category": "breakfast",
  "meal_timestamp": "2025-01-27T08:30:00Z"
}
```

**Response (200 OK)**:
```typescript
// Typ: UpdateMealResponseDTO
{
  id: string;
  user_id: string;
  description: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
  category: MealCategory | null;
  input_method: InputMethodType; // Backend zmienia na 'ai-edited' jeśli oryginalny był 'ai'
  meal_timestamp: string;
  created_at: string;
  updated_at: string;
  warnings: MealWarningDTO[];
}
```

**Response (400 Validation Error)**:
```typescript
{
  error: "VALIDATION_ERROR",
  message: "Invalid update data",
  details: {
    calories: "Calories must be between 1 and 10000"
  }
}
```

**Response (404 Not Found)**:
```typescript
{
  error: "NOT_FOUND",
  message: "Meal not found"
}
```

**Frontend handling**:
```typescript
const response = await fetch(`/api/v1/meals/${mealId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestData),
});

if (response.status === 400) {
  // Obsługa błędów walidacji
  const errorData = await response.json();
  const errors = Object.entries(errorData.details || {}).map(([field, message]) => ({
    field,
    message: message as string,
  }));
  setState(prev => ({ ...prev, submitLoading: false, validationErrors: errors }));
  return;
}

if (response.status === 404) {
  // Posiłek został usunięty między czasem
  toast.error('Posiłek nie został znaleziony. Możliwe że został usunięty.');
  onClose();
  return;
}

if (!response.ok) throw new Error('API error');

const result: UpdateMealResponseDTO = await response.json();

// Wyświetl warningi jeśli są
if (result.warnings && result.warnings.length > 0) {
  result.warnings.forEach(warning => {
    toast.warning(warning.message);
  });
}

toast.success('Posiłek zaktualizowany');
onSuccess(result as any); // Cast do CreateMealResponseDTO dla kompatybilności
```

---

### 7.3. POST /api/v1/ai-generations (regeneracja AI)

W trybie edycji użytkownik może zmienić opis i wygenerować nową propozycję AI. Flow jest identyczny jak w trybie dodawania - nie ma różnic w API.

## 8. Interakcje użytkownika

### 8.1. Otwarcie modala edycji

**Trigger**: Kliknięcie przycisku "Edytuj" na posiłku w liście (Dashboard, DayView)

**Akcja**:
1. Modal pojawia się z animacją fade-in
2. Wyświetlany jest LoadingOverlay z tekstem "Wczytuję dane posiłku..."
3. Wywołanie GET /api/v1/meals/:id
4. Po otrzymaniu danych:
   - LoadingOverlay znika
   - Formularz prepopulowany danymi posiłku
   - Tryb ustawiony na 'manual'
   - Focus na pierwszym polu (description textarea)

**Obsługa błędów**:
- 404: Toast "Posiłek nie został znaleziony" + zamknięcie modala
- Network error: Toast "Nie udało się wczytać posiłku" + zamknięcie modala

---

### 8.2. Edycja opisu i regeneracja AI

**Trigger**: Użytkownik zmienia opis w textarea, przełącza na tryb AI i klika "Oblicz kalorie"

**Akcja**:
1. Przełączenie na tryb AI (SegmentedControl)
2. aiPrompt = aktualny description
3. Zmiana tekstu w textarea
4. Kliknięcie "Oblicz kalorie"
5. Flow identyczny jak w AddMeal:
   - Multi-stage loading
   - Wywołanie POST /api/v1/ai-generations
   - Wyświetlenie AIResult
6. Użytkownik może zaakceptować nowy wynik lub edytować ręcznie

**Uwaga**: Regeneracja AI w trybie edycji tworzy **nową** generację AI, niekoniecznie powiązaną z oryginalnym posiłkiem.

---

### 8.3. Edycja wartości w trybie manual

**Trigger**: Użytkownik zmienia wartości kalorii lub makroskładników

**Akcja**:
- Real-time walidacja pól
- Automatyczne obliczanie macro warning
- Wszystkie interakcje jak w AddMeal (autoCalculate, itp.)

**Uwaga**: Backend automatycznie zmieni `input_method` na `'ai-edited'` jeśli oryginalny posiłek był AI-generated.

---

### 8.4. Zapis zmian (sukces)

**Trigger**: Kliknięcie przycisku "Zapisz zmiany"

**Akcja**:
1. **Walidacja**: Sprawdzenie wszystkich pól
2. **Submit**:
   - Przycisk zmienia się na loading
   - Wywołanie PATCH /api/v1/meals/:id
3. **Po sukcesie**:
   - Modal zamyka się
   - Toast notification: "Posiłek zaktualizowany"
   - Wywołanie onSuccess(meal) - callback do rodzica
   - Rodzic odświeża listę posiłków
   - Jeśli są warnings: dodatkowy toast z warningami

---

### 8.5. Zapis zmian (błędy)

**Trigger**: Błąd podczas zapisu

**Akcja - 400 Validation Error**:
- Przycisk przestaje być loading
- Wyświetlenie błędów przy odpowiednich polach
- Scroll do pierwszego błędnego pola
- Modal pozostaje otwarty

**Akcja - 404 Not Found**:
- Przycisk przestaje być loading
- Toast: "Posiłek nie został znaleziony. Możliwe że został usunięty."
- Zamknięcie modala (po 2s)

**Akcja - 500 Server Error**:
- Przycisk przestaje być loading
- Toast: "Nie udało się zapisać zmian. Spróbuj ponownie."
- Modal pozostaje otwarty

---

### 8.6. Anulowanie edycji

**Trigger**: Kliknięcie przycisku "Anuluj" lub ESC lub kliknięcie backdrop

**Akcja**:
- Modal zamyka się z animacją fade-out
- Focus wraca do elementu, który otworzył modal
- Zmiany NIE są zapisywane
- Nie wywołuje onSuccess

**Opcjonalne**: Pytanie użytkownika "Masz niezapisane zmiany. Czy na pewno chcesz zamknąć?" (jeśli dane się zmieniły)

## 9. Warunki i walidacja

### 9.1. Walidacja ładowania danych

**Komponenty**: MealForm

**Warunki**:
- `mealId` musi być valid UUID
- Posiłek musi istnieć (404 check)
- Użytkownik musi być właścicielem (RLS na backendzie)

**Błędy**:
- Invalid UUID: "Nieprawidłowe ID posiłku"
- 404: "Posiłek nie został znaleziony"
- Network error: "Nie udało się wczytać posiłku"

**Wpływ na UI**:
- Błąd ładowania → zamknięcie modala + toast
- Loading state → wyświetlenie LoadingOverlay

---

### 9.2. Walidacja pól formularza

**Identyczna jak w AddMeal** - wszystkie warunki opisane w add-meal-view-implementation-plan.md sekcja 9 obowiązują bez zmian:

- Walidacja pola Description (Manual mode)
- Walidacja pola Calories (Manual mode)
- Walidacja pól Macronutrients
- Walidacja Macronutrients vs Calories (Warning)
- Walidacja Date
- Walidacja Time
- Walidacja AI Generation ID (AI mode)

---

### 9.3. Walidacja przed PATCH

**Komponenty**: MealForm (submitMeal)

**Warunki**:
- Wszystkie warunki jak w POST
- Dodatkowo: `editingMealId` nie może być null/undefined

**Błędy**:
- Brak editingMealId: "Brak ID posiłku do edycji" (błąd wewnętrzny)

**Wpływ na UI**:
- Submit disabled jeśli brak editingMealId

---

### 9.4. Automatyczna zmiana input_method

**Backend odpowiedzialny**: Zgodnie z dokumentacją API, backend automatycznie zmienia `input_method` na `'ai-edited'` gdy użytkownik edytuje wartości AI-generated meal.

**Frontend NIE musi** jawnie wysyłać `input_method` w requestzie PATCH. Jeśli jednak chcesz śledzić to na frontendzie:

**Warunki**:
- Oryginalny `input_method === 'ai'`
- Zmieniono calories, protein, carbs lub fats

**Logika**:
```typescript
// Opcjonalne - można dodać do requestData jeśli backend tego wymaga
if (originalMeal.input_method === 'ai' && valuesChanged) {
  requestData.input_method = 'ai-edited';
}
```

## 10. Obsługa błędów

### 10.1. Błąd ładowania posiłku (GET)

**Scenariusz**: Posiłek nie istnieje lub błąd sieci

**Obsługa**:
- 404: Toast "Posiłek nie został znaleziony" + zamknięcie modala
- Network error: Toast "Nie udało się wczytać posiłku. Sprawdź połączenie." + zamknięcie modala
- 500: Toast "Wystąpił błąd serwera" + zamknięcie modala

**Komponenty dotknięte**: MealForm (useEffect)

---

### 10.2. Błąd aktualizacji posiłku (PATCH)

**Scenariusz - 400 Validation Error**:
- Parsowanie details z response
- Mapowanie na validationErrors
- Wyświetlenie błędów przy polach
- Modal pozostaje otwarty

**Scenariusz - 404 Not Found**:
- Toast: "Posiłek został usunięty"
- Zamknięcie modala po 2s

**Scenariusz - 500 Server Error**:
- Toast: "Nie udało się zapisać zmian"
- Modal pozostaje otwarty
- Dane zachowane

**Komponenty dotknięte**: MealForm (submitMeal)

---

### 10.3. Błąd regeneracji AI

**Identyczny jak w AddMeal** - wszystkie scenariusze błędów AI (rate limit, unclear description, server error) obsługiwane bez zmian.

---

### 10.4. Edge case: Równoczesna edycja

**Scenariusz**: Użytkownik otworzył edycję posiłku, który w międzyczasie został usunięty lub zmodyfikowany przez inną sesję.

**Obsługa**:
- Przy PATCH otrzymamy 404 → toast + zamknięcie
- Opcjonalne: Optimistic locking (sprawdzenie `updated_at` przed PATCH) - nie wymagane w MVP

---

### 10.5. Edge case: Sieć offline

**Scenariusz**: Użytkownik traci połączenie podczas edycji

**Obsługa**:
- Fetch error → catch block
- Toast: "Brak połączenia z internetem"
- Modal pozostaje otwarty
- Użytkownik może spróbować ponownie

## 11. Kroki implementacji

### Krok 1: Analiza istniejącego kodu

1.1. Przejrzeć implementację komponentów AddMeal:
- `AddMealModal.tsx` (będzie przemianowany na `MealModal.tsx`)
- `MealForm.tsx`
- `useAddMealForm.ts`
- `add-meal.types.ts`

1.2. Zidentyfikować miejsca wymagające zmian dla trybu edycji

---

### Krok 2: Aktualizacja typów

2.1. Sprawdzić czy wszystkie typy w `add-meal.types.ts` są już zaktualizowane:
- ✅ `MealFormEditMode`
- ✅ `MealFormState` z polami `editMode`, `editingMealId`, `loadingMeal`, `loadMealError`
- ✅ `AddMealModalProps` z opcjonalnym `mealId`
- ✅ `FormActionsProps` z opcjonalnym `editMode`

2.2. Jeśli brakuje - dodać brakujące typy

---

### Krok 3: Modyfikacja hooka useAddMealForm

3.1. **Sprawdzić implementację `loadMealForEdit()`**:
- Jeśli już istnieje - zweryfikować poprawność
- Jeśli nie - zaimplementować zgodnie z sekcją 6.1.2

3.2. **Zmodyfikować `submitMeal()`**:
- Dodać logikę warunkową dla PATCH vs POST
- Użyć różnych URL i metod HTTP
- Przygotować odpowiednie request body (UpdateMealRequestDTO vs CreateMealRequestDTO)
- Obsłużyć różne kody błędów

3.3. **Testować hook w izolacji**:
- Przypadek: Ładowanie posiłku (sukces)
- Przypadek: Ładowanie posiłku (404)
- Przypadek: Aktualizacja posiłku (sukces)
- Przypadek: Aktualizacja posiłku (404)

---

### Krok 4: Utworzenie komponentu LoadingOverlay

4.1. **Utworzyć plik `src/components/add-meal/LoadingOverlay.tsx`**:
```tsx
import { Spinner } from '@/components/ui/spinner';

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Wczytuję dane posiłku...</p>
      </div>
    </div>
  );
}
```

4.2. **Dodać stylowanie** (jeśli potrzeba dostosować)

---

### Krok 5: Modyfikacja FormActions

5.1. **Aktualizować `FormActions.tsx`**:
```tsx
export function FormActions({
  onCancel,
  onSubmit,
  submitDisabled,
  submitLoading,
  editMode = 'create' // Domyślnie tryb dodawania
}: FormActionsProps) {
  const buttonText = editMode === 'edit' ? 'Zapisz zmiany' : 'Dodaj posiłek';

  return (
    <div className="flex justify-between gap-4 pt-4">
      <Button variant="ghost" onClick={onCancel} disabled={submitLoading}>
        Anuluj
      </Button>
      <Button onClick={onSubmit} disabled={submitDisabled || submitLoading}>
        {submitLoading && <Spinner className="mr-2 h-4 w-4" />}
        {buttonText}
      </Button>
    </div>
  );
}
```

---

### Krok 6: Modyfikacja MealForm

6.1. **Dodać useEffect dla ładowania danych**:
```tsx
export function MealForm({ mealId, onClose, onSuccess }: MealFormProps) {
  const form = useAddMealForm();

  useEffect(() => {
    if (mealId) {
      form.loadMealForEdit(mealId).catch((error) => {
        console.error('Failed to load meal:', error);
        toast.error(form.state.loadMealError || 'Nie udało się wczytać posiłku');
        onClose();
      });
    }
  }, [mealId]);

  // ... reszta implementacji
}
```

6.2. **Dodać LoadingOverlay**:
```tsx
return (
  <form className="relative space-y-6">
    {form.state.loadingMeal && <LoadingOverlay />}

    {/* Reszta formularza */}
  </form>
);
```

6.3. **Przekazać editMode do FormActions**:
```tsx
<FormActions
  onCancel={onClose}
  onSubmit={handleSubmit}
  submitDisabled={!form.canSubmit}
  submitLoading={form.state.submitLoading}
  editMode={form.state.editMode}
/>
```

---

### Krok 7: Modyfikacja AddMealModal → MealModal

7.1. **Przemianować plik**:
- `AddMealModal.tsx` → `MealModal.tsx`

7.2. **Zaktualizować komponent**:
```tsx
export function MealModal({ isOpen, mealId, onClose, onSuccess }: AddMealModalProps) {
  const title = mealId ? 'Edytuj posiłek' : 'Dodaj posiłek';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay />
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <MealForm mealId={mealId} onClose={onClose} onSuccess={onSuccess} />
      </DialogContent>
    </Dialog>
  );
}
```

7.3. **Zaktualizować eksporty**:
- Zmienić nazwę eksportu w `index.ts` (jeśli istnieje)
- Zaktualizować importy w miejscach użycia

---

### Krok 8: Aktualizacja miejsc użycia

8.1. **Znaleźć wszystkie miejsca używające AddMealModal**:
```bash
grep -r "AddMealModal" src/
```

8.2. **Zaktualizować importy**:
```tsx
// Było:
import { AddMealModal } from '@/components/add-meal/AddMealModal';

// Jest:
import { MealModal } from '@/components/add-meal/MealModal';
```

8.3. **Dodać funkcjonalność otwierania w trybie edycji**:
```tsx
// Przykład w komponencie listy posiłków
const [modalState, setModalState] = useState<{
  isOpen: boolean;
  mealId?: string;
}>({ isOpen: false });

// Dodawanie
<button onClick={() => setModalState({ isOpen: true })}>
  Dodaj posiłek
</button>

// Edycja
<button onClick={() => setModalState({ isOpen: true, mealId: meal.id })}>
  Edytuj
</button>

// Modal
<MealModal
  isOpen={modalState.isOpen}
  mealId={modalState.mealId}
  onClose={() => setModalState({ isOpen: false })}
  onSuccess={(meal) => {
    refreshMeals();
    toast.success(modalState.mealId ? 'Posiłek zaktualizowany' : 'Posiłek dodany');
    setModalState({ isOpen: false });
  }}
/>
```

---

### Krok 9: Testowanie integracji z API

9.1. **Testować GET /api/v1/meals/:id**:
- Sukces: Posiłek wczytany poprawnie
- 404: Toast + zamknięcie modala
- Network error: Toast + zamknięcie

9.2. **Testować PATCH /api/v1/meals/:id**:
- Sukces: Posiłek zaktualizowany
- 400: Błędy walidacji wyświetlone
- 404: Toast + zamknięcie
- 500: Toast + modal otwarty

9.3. **Testować regenerację AI w trybie edycji**:
- Zmiana opisu → przełączenie na AI → generacja → akceptacja → zapis

---

### Krok 10: Testowanie UX

10.1. **Scenariusze end-to-end**:
- US-012.1: Otwarcie edycji → formularz prepopulowany
- US-012.2: Zmiana opisu + regeneracja AI
- US-012.3: Edycja wartości w trybie manual
- US-012.4: Zapis → lista odświeżona

10.2. **Testowanie walidacji**:
- Edycja z błędnymi wartościami → błędy wyświetlone
- Data w przyszłości → submit zablokowany
- Macro warning → wyświetlony ale nie blokuje

10.3. **Testowanie błędów**:
- Posiłek nie istnieje (404) → toast + zamknięcie
- Błąd sieci → toast + możliwość retry
- Równoczesne usunięcie → 404 przy PATCH

---

### Krok 11: Accessibility

11.1. **Sprawdzić**:
- Focus trap w modalu działa
- Focus wraca po zamknięciu
- Keyboard navigation (Tab, Enter, Esc)
- Screen reader announcements dla loading states

11.2. **Dodać aria-labels**:
- LoadingOverlay: `aria-live="polite"` + `aria-busy="true"`
- Submit button: `aria-label="Zapisz zmiany w posiłku"`

---

### Krok 12: Responsywność

12.1. **Testować na różnych rozdzielczościach**:
- Mobile: fullscreen modal
- Tablet: fullscreen modal
- Desktop: dialog modal

12.2. **Sprawdzić touch interactions**

---

### Krok 13: Performance

13.1. **Optymalizacje**:
- Memoizacja komponentów (jeśli potrzeba)
- useCallback dla handleSubmit
- Lazy loading modala (jeśli nie używany)

---

### Krok 14: Dokumentacja

14.1. **Dodać JSDoc**:
- Do nowych/zmienionych funkcji
- Do komponentu MealModal
- Do LoadingOverlay

14.2. **Zaktualizować README** (jeśli istnieje):
- Przykłady użycia MealModal w trybie edycji

---

### Krok 15: Code review i refactoring

15.1. **Przegląd kodu**:
- Sprawdzenie zgodności z konwencjami
- Usunięcie duplikacji
- Sprawdzenie typów TypeScript

15.2. **Refactoring**:
- Wydzielenie wspólnej logiki jeśli potrzeba
- Uproszczenie złożonych fragmentów

---

### Krok 16: Finalne testy

16.1. **Pełne testy manualne wszystkich flow**

16.2. **Testy regresji** (czy AddMeal nadal działa poprawnie)

16.3. **Deploy do środowiska testowego**

16.4. **Feedback od PM/QA**

16.5. **Fixes i deploy do produkcji**

---

## Koniec planu implementacji

Ten plan implementacji zapewnia szczegółowy roadmap dla rozszerzenia widoku AddMeal o funkcjonalność edycji. Kluczowym założeniem jest **maksymalne wykorzystanie istniejącego kodu** poprzez uogólnienie komponentów i dodanie trybu edycji, zamiast tworzenia osobnych komponentów dla edycji. To zapewnia spójność UI/UX oraz łatwiejsze utrzymanie kodu w przyszłości.

**Główne zmiany**:
1. ✅ Typy już są przygotowane (editMode, loadingMeal, mealId)
2. ✅ Hook już ma loadMealForEdit() - wymaga tylko modyfikacji submitMeal()
3. 🆕 Nowy komponent: LoadingOverlay
4. 🔧 Modyfikacja: FormActions (dynamiczny tekst przycisku)
5. 🔧 Modyfikacja: MealForm (useEffect dla ładowania, LoadingOverlay)
6. 🔧 Modyfikacja: AddMealModal → MealModal (dynamiczny tytuł)
7. 🔧 Modyfikacja: useAddMealForm.submitMeal() (PATCH vs POST)
