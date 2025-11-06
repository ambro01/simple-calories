# Plan implementacji widoków Dashboard i DayDetails

## 1. Przegląd

System składa się z dwóch powiązanych widoków służących do przeglądania postępów użytkownika w śledzeniu kalorii:

**Dashboard** to główny widok aplikacji wyświetlający listę dni z podsumowaniem kalorycznym. Każdy wpis zawiera datę, sumę spożytych kalorii w stosunku do celu oraz wizualny progress bar z kolorowaniem statusu (szary/zielony/pomarańczowy). Widok wspiera infinite scroll do ładowania starszych dni oraz różne układy dla desktop (two-pane z listą i szczegółami) i mobile (single column).

**DayDetails** prezentuje szczegółowy widok pojedynczego dnia zawierający sticky header z podsumowaniem oraz listę wszystkich posiłków. Użytkownik może edytować i usuwać posiłki, a także dodawać nowe. Widok dostosowuje się do kontekstu - na mobile jest to osobna strona z przyciskiem powrotu, na desktop wyświetla się w prawym panelu dashboardu.

## 2. Routing widoku

### Dashboard

- **Ścieżka**: `/` (główna ścieżka dla zalogowanych użytkowników)
- **Typ**: Strona Astro z komponentem React (`src/pages/index.astro`)
- **Dostęp**: Wymaga autentykacji (redirect do `/login` jeśli niezalogowany)

### DayDetails

- **Ścieżka**: `/day/[date]` (dynamiczny parametr daty w formacie YYYY-MM-DD)
- **Przykład**: `/day/2025-01-27`
- **Typ**: Strona Astro z komponentem React (`src/pages/day/[date].astro`)
- **Dostęp**: Wymaga autentykacji
- **Walidacja**: Date param musi być w formacie YYYY-MM-DD, niepoprawny format → redirect do `/`

## 3. Struktura komponentów

```
DashboardPage (src/pages/index.astro)
└── AppLayout
    └── DashboardContainer (React - client:load)
        ├── DaysList
        │   ├── InfiniteScrollTrigger
        │   ├── DayCard (multiple)
        │   │   ├── DayDate
        │   │   ├── CalorieProgressBar
        │   │   ├── CalorieSummary
        │   │   └── MealCount
        │   ├── SkeletonDayCard (3x podczas loading)
        │   └── EmptyDashboard (warunkowy)
        ├── FAB (Floating Action Button)
        ├── AddMealModal (warunkowy)
        └── [Desktop] DayDetailsPanel
            └── DayDetailsContainer (embedded)

DayDetailsPage (src/pages/day/[date].astro)
└── AppLayout
    └── DayDetailsContainer (React - client:load)
        ├── DayHeader (sticky)
        │   ├── BackButton (mobile only)
        │   ├── DateDisplay
        │   ├── CalorieProgressBar
        │   ├── CalorieSummary
        │   ├── MacroDisplay
        │   └── AddButton
        ├── MealsList
        │   ├── MealCard (multiple)
        │   │   ├── MealInfo
        │   │   │   ├── Description
        │   │   │   ├── CaloriesDisplay
        │   │   │   ├── MacrosDisplay (opcjonalne)
        │   │   │   └── Timestamp
        │   │   ├── ActionButtons
        │   │   │   ├── EditButton
        │   │   │   └── DeleteButton
        │   │   └── DeleteConfirmation (warunkowy, expanded inline)
        │   └── EmptyDayState (warunkowy)
        ├── AddMealModal (warunkowy)
        └── EditMealModal (warunkowy)
```

## 4. Szczegóły komponentów

### 4.1. DashboardContainer

**Opis**: Główny kontener zarządzający stanem dashboardu, infinite scroll oraz komunikacją z API. Orkiestruje wszystkie sub-komponenty i obsługuje różnice między layoutem desktop i mobile.

**Główne elementy**:

- Conditional rendering: lista dni lub empty state
- InfiniteScrollTrigger na końcu listy
- FAB (Floating Action Button) do dodawania posiłków
- Desktop: DayDetailsPanel po prawej stronie
- Mobile: tylko lista dni

**Obsługiwane interakcje**:

- `onDayClick(date)`: Desktop → selekcja dnia i update panelu, Mobile → navigate do `/day/:date`
- `onLoadMore()`: Infinite scroll trigger
- `onRefresh()`: Pull-to-refresh (mobile)
- `onAddMealSuccess()`: Callback po dodaniu posiłku → refetch dni
- `onMealChange()`: Callback po edycji/usunięciu → refetch dni

**Walidacja**: Brak (przekazuje do child components)

**Typy**:

- State: `DashboardState`
- Props: `DashboardContainerProps`

**Props**:

```typescript
interface DashboardContainerProps {
  initialData?: DailyProgressListResponseDTO; // SSR data (opcjonalnie)
}
```

---

### 4.2. DaysList

**Opis**: Kontener listy dni obsługujący renderowanie DayCard oraz infinite scroll. Zarządza skeleton loaders i empty state.

**Główne elementy**:

- Mapowanie `days` na `DayCard` komponenty
- `InfiniteScrollTrigger` na końcu listy
- `SkeletonDayCard` (3 sztuki) podczas ładowania
- `EmptyDashboard` gdy brak danych

**Obsługiwane interakcje**:

- `onDayClick(date)`: Przekazywane z DayCard do parent
- `onInfiniteScroll()`: Trigger ładowania kolejnych dni

**Walidacja**: Brak

**Typy**:

- Props: `DaysListProps`

**Props**:

```typescript
interface DaysListProps {
  days: DailyProgressResponseDTO[];
  loading: boolean;
  hasMore: boolean;
  selectedDate: string | null; // desktop only
  onDayClick: (date: string) => void;
  onLoadMore: () => void;
}
```

---

### 4.3. DayCard

**Opis**: Karta reprezentująca pojedynczy dzień z podsumowaniem kalorycznym i progress bar. Wizualizuje status realizacji celu poprzez kolorowanie.

**Główne elementy**:

- Header z datą (format: "Poniedziałek, 30 października")
- `CalorieProgressBar` z kolorowaniem wg statusu
- Suma kalorii / cel (np. "2150 / 2500 Kcal")
- Procent realizacji (np. "86%")
- Liczba posiłków (np. "5 posiłków")

**Obsługiwane interakcje**:

- `onClick`: Kliknięcie całej karty → wywołanie `onDayClick(date)`
- Hover effect: shadow-lg, scale (animacja)
- Active/Selected state (desktop): highlight selected day

**Walidacja**: Brak

**Typy**:

- Props: `DayCardProps`

**Props**:

```typescript
interface DayCardProps {
  day: DailyProgressResponseDTO;
  isSelected?: boolean; // desktop only
  onClick: (date: string) => void;
}
```

---

### 4.4. CalorieProgressBar

**Opis**: Komponent progress bar z kolorowaniem wg statusu realizacji celu. Używany zarówno w Dashboard jak i DayDetails.

**Główne elementy**:

- Progress bar (HTML `<progress>` lub custom div z width %)
- Kolorowanie tła wg statusu:
  - `under`: bg-sky-400
  - `on_track`: bg-green-500
  - `over`: bg-orange-500
- Opcjonalnie: procent jako label

**Obsługiwane interakcje**: Brak (tylko wyświetlanie)

**Walidacja**:

- `percentage` ograniczone do 0-100% dla UI (może być > 100 w danych)
- Status musi być jednym z: 'under' | 'on_track' | 'over'

**Typy**:

- Props: `CalorieProgressBarProps`

**Props**:

```typescript
interface CalorieProgressBarProps {
  percentage: number;
  status: DailyProgressStatus;
  showLabel?: boolean; // domyślnie false
  size?: "sm" | "md" | "lg"; // domyślnie 'md'
}
```

---

### 4.5. SkeletonDayCard

**Opis**: Skeleton loader imitujący wygląd DayCard podczas ładowania danych.

**Główne elementy**:

- Placeholder dla daty (szara linia)
- Placeholder dla progress bar
- Placeholder dla tekstu kalorii
- Animacja pulse

**Obsługiwane interakcje**: Brak

**Walidacja**: Brak

**Typy**: Brak props

---

### 4.6. EmptyDashboard

**Opis**: Empty state wyświetlany gdy użytkownik nie ma żadnych posiłków.

**Główne elementy**:

- Ikona (np. 🍽️)
- Tekst: "Zacznij swoją przygodę! Dodaj pierwszy posiłek"
- CTA Button: "Dodaj posiłek"

**Obsługiwane interakcje**:

- `onAddMeal()`: Kliknięcie CTA → otwiera AddMealModal

**Walidacja**: Brak

**Typy**:

- Props: `EmptyDashboardProps`

**Props**:

```typescript
interface EmptyDashboardProps {
  onAddMeal: () => void;
}
```

---

### 4.7. FAB (Floating Action Button)

**Opis**: Przycisk floating action (stała pozycja bottom-right) do szybkiego dodawania posiłków.

**Główne elementy**:

- Button z ikoną "+" (duży, rounded-full)
- Pozycja: fixed bottom-right
- Shadow i hover effects

**Obsługiwane interakcje**:

- `onClick`: Otwiera AddMealModal

**Walidacja**: Brak

**Typy**:

- Props: `FABProps`

**Props**:

```typescript
interface FABProps {
  onClick: () => void;
}
```

---

### 4.8. InfiniteScrollTrigger

**Opis**: Niewidoczny element służący jako trigger dla infinite scroll (Intersection Observer).

**Główne elementy**:

- Div o wysokości 1px (niewidoczny)
- Intersection Observer hook

**Obsługiwane interakcje**:

- `onIntersect()`: Gdy element wejdzie w viewport → trigger loadMore

**Walidacja**:

- Trigger tylko gdy `hasMore === true`
- Nie trigger gdy `loading === true`

**Typy**:

- Props: `InfiniteScrollTriggerProps`

**Props**:

```typescript
interface InfiniteScrollTriggerProps {
  onIntersect: () => void;
  hasMore: boolean;
  loading: boolean;
}
```

---

### 4.9. DayDetailsContainer

**Opis**: Główny kontener szczegółów dnia zarządzający stanem, posiłkami oraz komunikacją z API. Może być używany jako osobna strona (mobile) lub w panelu (desktop).

**Główne elementy**:

- `DayHeader` (sticky)
- `MealsList`
- Modals: `AddMealModal`, `EditMealModal`

**Obsługiwane interakcje**:

- `onMealEdit(meal)`: Otwiera EditMealModal
- `onMealDelete(id)`: Usuwa posiłek (po potwierdzeniu)
- `onAddMeal()`: Otwiera AddMealModal
- `onBack()`: Mobile only → navigate do dashboard
- `onMealChange()`: Callback po dodaniu/edycji/usunięciu → refetch

**Walidacja**:

- Date param w formacie YYYY-MM-DD

**Typy**:

- State: `DayDetailsState`
- Props: `DayDetailsContainerProps`

**Props**:

```typescript
interface DayDetailsContainerProps {
  date: string; // YYYY-MM-DD
  embedded?: boolean; // true gdy w desktop panel
  onDateChange?: (date: string) => void; // desktop panel navigation
}
```

---

### 4.10. DayHeader

**Opis**: Sticky header wyświetlający podsumowanie dnia z progress bar, sumą kalorii i makroskładnikami.

**Główne elementy**:

- BackButton (mobile only)
- Data (format: "Poniedziałek, 30 października 2025")
- `CalorieProgressBar`
- Suma kalorii / cel + procent (np. "2150 / 2500 Kcal (86%)")
- `MacroDisplay` (grid z makroskładnikami)
- Liczba posiłków (np. "5 posiłków")
- AddButton "+" (otwiera AddMealModal)

**Obsługiwane interakcje**:

- `onBack()`: Mobile only → navigate do dashboard
- `onAddMeal()`: Kliknięcie "+" → otwiera AddMealModal

**Walidacja**: Brak

**Typy**:

- Props: `DayHeaderProps`

**Props**:

```typescript
interface DayHeaderProps {
  progress: DailyProgressResponseDTO;
  mealCount: number;
  showBackButton: boolean; // mobile only
  onBack?: () => void;
  onAddMeal: () => void;
}
```

---

### 4.11. MacroDisplay

**Opis**: Grid wyświetlający podsumowanie makroskładników (Białko, Węglowodany, Tłuszcze, Błonnik).

**Główne elementy**:

- Grid 2x2 (responsive: 2x2 desktop, 1x4 mobile)
- Dla każdego makro:
  - Label (np. "Białko")
  - Wartość (np. "95.5g")
  - Kolor tła lub ikona (opcjonalnie)

**Obsługiwane interakcje**: Brak (tylko wyświetlanie)

**Walidacja**: Brak

**Typy**:

- Props: `MacroDisplayProps`

**Props**:

```typescript
interface MacroDisplayProps {
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number; // opcjonalnie (nie wspierane w MVP API)
}
```

---

### 4.12. MealsList

**Opis**: Kontener listy posiłków z sortowaniem chronologicznym (od najstarszego) i empty state.

**Główne elementy**:

- Mapowanie `meals` na `MealCard` komponenty
- `EmptyDayState` gdy brak posiłków
- Loading state (skeleton loaders opcjonalnie)

**Obsługiwane interakcje**:

- `onMealClick(meal)`: Kliknięcie na posiłek → otwiera EditMealModal
- `onMealEdit(meal)`: Kliknięcie edit icon → otwiera EditMealModal
- `onMealDelete(id)`: Kliknięcie delete icon → pokazuje DeleteConfirmation

**Walidacja**: Brak

**Typy**:

- Props: `MealsListProps`

**Props**:

```typescript
interface MealsListProps {
  meals: MealResponseDTO[];
  loading: boolean;
  onMealClick: (meal: MealResponseDTO) => void;
  onMealEdit: (meal: MealResponseDTO) => void;
  onMealDelete: (id: string) => void;
}
```

---

### 4.13. MealCard

**Opis**: Karta pojedynczego posiłku z informacjami o kaloriach, makroskładnikach oraz akcjami (edycja, usuwanie).

**Główne elementy**:

- Header:
  - Timestamp (format: "08:30")
  - Category badge (opcjonalnie, np. "Śniadanie")
- Body:
  - Description (opis posiłku)
  - Kalorie (duża liczba, np. "420 Kcal")
  - Makroskładniki (jeśli dostępne):
    - Białko: 18.5g | Węglowodany: 25.0g | Tłuszcze: 28.0g
    - Jeśli brak: "-"
  - Input method badge (opcjonalnie, np. "AI", "Manual", "AI-edited")
- Footer (Action buttons):
  - EditButton (ikona ołówka)
  - DeleteButton (ikona śmietnika)
- DeleteConfirmation (conditional, expanded inline):
  - Pojawia się po kliknięciu delete
  - Tekst: "Czy na pewno chcesz usunąć ten posiłek?"
  - Przyciski: "Usuń" (destructive), "Anuluj"
  - Auto-collapse po 5s bez akcji

**Obsługiwane interakcje**:

- `onClick`: Kliknięcie całej karty → wywołanie `onMealClick(meal)`
- `onEdit`: Kliknięcie edit icon → wywołanie `onMealEdit(meal)`
- `onDelete`: Kliknięcie delete icon → pokazanie inline DeleteConfirmation
- `onConfirmDelete`: Potwierdzenie usunięcia → wywołanie `onMealDelete(id)` + fade-out animation
- `onCancelDelete`: Anulowanie → collapse confirmation
- Hover effect: shadow, scale

**Walidacja**:

- Edit/Delete buttons disabled podczas loading
- Auto-collapse DeleteConfirmation po 5s

**Typy**:

- Props: `MealCardProps`
- Local state: `DeleteConfirmationState`

**Props**:

```typescript
interface MealCardProps {
  meal: MealResponseDTO;
  onMealClick: (meal: MealResponseDTO) => void;
  onEdit: (meal: MealResponseDTO) => void;
  onDelete: (id: string) => void;
  deleting?: boolean; // loading state podczas usuwania
}
```

---

### 4.14. DeleteConfirmation

**Opis**: Inline confirmation expandujący się w MealCard po kliknięciu delete. Alternatywnie może być osobnym komponentem (jeśli potrzebny reuse).

**Główne elementy**:

- Alert box (variant: destructive/warning)
- Tekst pytający: "Czy na pewno chcesz usunąć ten posiłek?"
- Opis posiłku (dla kontekstu)
- Przyciski:
  - "Usuń" (variant: destructive, loading state podczas usuwania)
  - "Anuluj" (variant: ghost)

**Obsługiwane interakcje**:

- `onConfirm()`: Potwierdzenie usunięcia
- `onCancel()`: Anulowanie
- Auto-collapse po 5s (setTimeout)

**Walidacja**:

- Przycisk "Usuń" disabled podczas loading

**Typy**:

- Props: `DeleteConfirmationProps`

**Props**:

```typescript
interface DeleteConfirmationProps {
  mealDescription: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}
```

---

### 4.15. EmptyDayState

**Opis**: Empty state wyświetlany gdy dzień nie ma żadnych posiłków.

**Główne elementy**:

- Ikona (np. 📝)
- Tekst: "Brak posiłków w tym dniu. Dodaj swój pierwszy!"
- CTA Button: "Dodaj posiłek"

**Obsługiwane interakcje**:

- `onAddMeal()`: Kliknięcie CTA → otwiera AddMealModal

**Walidacja**: Brak

**Typy**:

- Props: `EmptyDayStateProps`

**Props**:

```typescript
interface EmptyDayStateProps {
  onAddMeal: () => void;
}
```

---

### 4.16. EditMealModal

**Opis**: Modal do edycji istniejącego posiłku. Bardzo podobny do `AddMealModal` ale z preloaded danymi i endpoint PATCH zamiast POST.

**Główne elementy**:

- Dialog/Modal z shadcn/ui
- Formularz identyczny jak w AddMealModal:
  - SegmentedControl (AI/Manual)
  - AIMode lub ManualMode
  - CommonFields (kategoria, data, czas)
  - FormActions (Anuluj, Zapisz)
- Pre-populate z danymi posiłku
- Note: Gdy edytowany jest AI meal → automatyczna zmiana `input_method` na 'ai-edited'

**Obsługiwane interakcje**:

- `onClose`: Zamknięcie modala
- `onSuccess(meal)`: Callback po pomyślnej edycji
- Identyczne jak w AddMealModal (generacja AI, walidacja, submit)

**Walidacja**:

- Identyczna jak w AddMealModal
- Dodatkowo: automatyczna zmiana input_method przy edycji AI meal

**Typy**:

- Props: `EditMealModalProps`
- Hook: `useEditMealForm(mealId, initialData)` - podobny do `useAddMealForm`

**Props**:

```typescript
interface EditMealModalProps {
  isOpen: boolean;
  meal: MealResponseDTO; // preloaded data
  onClose: () => void;
  onSuccess: (meal: UpdateMealResponseDTO) => void;
}
```

---

## 5. Typy

### 5.1. Istniejące typy z API (src/types.ts)

```typescript
// Używane bezpośrednio z API
import type {
  DailyProgressResponseDTO,
  DailyProgressListResponseDTO,
  DailyProgressStatus,
  MealResponseDTO,
  MealsListResponseDTO,
  UpdateMealRequestDTO,
  UpdateMealResponseDTO,
  CreateMealResponseDTO,
  MealWarningDTO,
  PaginationMetaDTO,
  ErrorResponseDTO,
  MealCategory,
  InputMethodType,
} from "../types";
```

### 5.2. Nowe typy ViewModel

```typescript
/**
 * Stan głównego dashboardu
 */
export interface DashboardState {
  days: DailyProgressResponseDTO[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  offset: number;
  limit: number; // domyślnie 30
  selectedDate: string | null; // dla desktop two-pane
  refreshing: boolean; // pull-to-refresh state
}

/**
 * Stan szczegółów dnia
 */
export interface DayDetailsState {
  date: string; // YYYY-MM-DD
  progress: DailyProgressResponseDTO | null;
  meals: MealResponseDTO[];
  loading: boolean;
  error: string | null;
  deletingMealId: string | null; // ID posiłku obecnie usuwanego
  editingMeal: MealResponseDTO | null; // Posiłek obecnie edytowany
}

/**
 * Parametry infinite scroll
 */
export interface InfiniteScrollParams {
  limit: number;
  offset: number;
  hasMore: boolean;
}

/**
 * Stan delete confirmation
 * Może być zarządzany lokalnie w MealCard lub w parent state
 */
export interface DeleteConfirmationState {
  isOpen: boolean;
  mealId: string | null;
  mealDescription: string;
  autoCollapseTimer: NodeJS.Timeout | null;
}

/**
 * Mapowanie statusów na kolory Tailwind
 */
export const STATUS_COLOR_MAP: Record<DailyProgressStatus, StatusColorConfig> = {
  under: {
    bg: "bg-sky-400",
    text: "text-gray-700",
    border: "border-gray-300",
  },
  on_track: {
    bg: "bg-green-500",
    text: "text-green-700",
    border: "border-green-400",
  },
  over: {
    bg: "bg-orange-500",
    text: "text-orange-700",
    border: "border-orange-400",
  },
};

export interface StatusColorConfig {
  bg: string;
  text: string;
  border: string;
}

/**
 * Mapowanie kategorii na ikony/kolory
 */
export const CATEGORY_CONFIG: Record<MealCategory, CategoryConfig> = {
  breakfast: {
    label: "Śniadanie",
    icon: "🍳",
    color: "bg-yellow-100 text-yellow-800",
  },
  lunch: {
    label: "Obiad",
    icon: "🍽️",
    color: "bg-blue-100 text-blue-800",
  },
  dinner: {
    label: "Kolacja",
    icon: "🍲",
    color: "bg-purple-100 text-purple-800",
  },
  snack: {
    label: "Przekąska",
    icon: "🍪",
    color: "bg-pink-100 text-pink-800",
  },
  other: {
    label: "Inne",
    icon: "🍴",
    color: "bg-gray-100 text-gray-800",
  },
};

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
}

/**
 * Limity paginacji
 */
export const PAGINATION_LIMITS = {
  DASHBOARD_DAYS_LIMIT: 30,
  DAY_DETAILS_MEALS_LIMIT: 100, // wszystkie posiłki z dnia
};
```

### 5.3. Typy formatowania daty

```typescript
/**
 * Formaty dat używane w aplikacji
 */
export type DateFormat =
  | "YYYY-MM-DD" // 2025-01-27 (API format)
  | "full" // Poniedziałek, 30 października 2025
  | "short" // Pn, 30 paź
  | "time"; // 08:30

/**
 * Helper do formatowania dat
 */
export interface DateFormatter {
  format(date: string | Date, format: DateFormat): string;
  parseAPIDate(date: string): Date;
  toAPIFormat(date: Date): string;
}
```

## 6. Zarządzanie stanem

### 6.1. Główny hook: useDashboard

Zarządzanie stanem dashboardu jest scentralizowane w custom hooku `useDashboard`. Hook enkapsuluje logikę biznesową, infinite scroll, pull-to-refresh i komunikację z API.

**Lokalizacja**: `src/hooks/useDashboard.ts`

**Odpowiedzialności**:

- Zarządzanie stanem listy dni (DashboardState)
- Ładowanie początkowe i infinite scroll
- Pull-to-refresh (mobile)
- Selekcja dnia (desktop two-pane)
- Refetch po zmianach w posiłkach
- Obsługa błędów

**Struktura hooka**:

```typescript
interface UseDashboardReturn {
  // Stan
  state: DashboardState;

  // Akcje - ładowanie danych
  loadInitialDays: () => Promise<void>;
  loadMoreDays: () => Promise<void>;
  refreshDays: () => Promise<void>;

  // Akcje - nawigacja
  selectDay: (date: string) => void;
  deselectDay: () => void;

  // Akcje - updates
  refetchAfterMealChange: () => Promise<void>;

  // Computed values
  isEmpty: boolean;
  isInitialLoading: boolean;
}

export function useDashboard(initialData?: DailyProgressListResponseDTO): UseDashboardReturn {
  const [state, setState] = useState<DashboardState>(getInitialState(initialData));

  // ... implementacja funkcji

  return {
    state,
    loadInitialDays,
    loadMoreDays,
    refreshDays,
    selectDay,
    deselectDay,
    refetchAfterMealChange,
    isEmpty: !state.loading && state.days.length === 0,
    isInitialLoading: state.loading && state.days.length === 0,
  };
}
```

### 6.2. Funkcja getInitialState (Dashboard)

```typescript
function getInitialState(initialData?: DailyProgressListResponseDTO): DashboardState {
  return {
    days: initialData?.data || [],
    loading: !initialData, // false jeśli mamy SSR data
    error: null,
    hasMore: initialData ? initialData.pagination.total > initialData.data.length : true,
    offset: initialData?.data.length || 0,
    limit: PAGINATION_LIMITS.DASHBOARD_DAYS_LIMIT,
    selectedDate: null, // można ustawić dzisiejszą datę jako default
    refreshing: false,
  };
}
```

### 6.3. Kluczowe funkcje hooka useDashboard

#### loadInitialDays()

```typescript
async function loadInitialDays(): Promise<void> {
  setState((prev) => ({ ...prev, loading: true, error: null }));

  try {
    const response = await fetch(`/api/v1/daily-progress?limit=${state.limit}&offset=0`);

    if (!response.ok) {
      throw new Error("Failed to load days");
    }

    const data: DailyProgressListResponseDTO = await response.json();

    setState((prev) => ({
      ...prev,
      days: data.data,
      loading: false,
      offset: data.data.length,
      hasMore: data.pagination.total > data.data.length,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: "Nie udało się załadować danych. Spróbuj ponownie.",
    }));
  }
}
```

#### loadMoreDays() - Infinite Scroll

```typescript
async function loadMoreDays(): Promise<void> {
  if (!state.hasMore || state.loading) return;

  setState((prev) => ({ ...prev, loading: true }));

  try {
    const response = await fetch(`/api/v1/daily-progress?limit=${state.limit}&offset=${state.offset}`);

    if (!response.ok) {
      throw new Error("Failed to load more days");
    }

    const data: DailyProgressListResponseDTO = await response.json();

    setState((prev) => ({
      ...prev,
      days: [...prev.days, ...data.data],
      loading: false,
      offset: prev.offset + data.data.length,
      hasMore: prev.offset + data.data.length < data.pagination.total,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: "Nie udało się załadować kolejnych dni.",
    }));
  }
}
```

#### refreshDays() - Pull-to-Refresh

```typescript
async function refreshDays(): Promise<void> {
  setState((prev) => ({ ...prev, refreshing: true, error: null }));

  try {
    const response = await fetch(`/api/v1/daily-progress?limit=${state.limit}&offset=0`);

    if (!response.ok) {
      throw new Error("Failed to refresh days");
    }

    const data: DailyProgressListResponseDTO = await response.json();

    setState((prev) => ({
      ...prev,
      days: data.data,
      refreshing: false,
      offset: data.data.length,
      hasMore: data.pagination.total > data.data.length,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      refreshing: false,
      error: "Nie udało się odświeżyć danych.",
    }));
  }
}
```

#### refetchAfterMealChange()

```typescript
async function refetchAfterMealChange(): Promise<void> {
  // Refetch tylko widocznych dni (do obecnego offset)
  try {
    const response = await fetch(`/api/v1/daily-progress?limit=${state.offset}&offset=0`);

    if (!response.ok) return; // Silent fail

    const data: DailyProgressListResponseDTO = await response.json();

    setState((prev) => ({
      ...prev,
      days: data.data,
    }));
  } catch (error) {
    console.error("Failed to refetch after meal change:", error);
  }
}
```

### 6.4. Główny hook: useDayDetails

Zarządzanie stanem szczegółów dnia jest scentralizowane w custom hooku `useDayDetails`. Hook obsługuje ładowanie szczegółów dnia, listę posiłków oraz akcje (edycja, usuwanie).

**Lokalizacja**: `src/hooks/useDayDetails.ts`

**Odpowiedzialności**:

- Zarządzanie stanem szczegółów dnia (DayDetailsState)
- Ładowanie progress i meals
- Edycja i usuwanie posiłków
- Refetch po zmianach
- Obsługa błędów

**Struktura hooka**:

```typescript
interface UseDayDetailsReturn {
  // Stan
  state: DayDetailsState;

  // Akcje - ładowanie danych
  loadDayDetails: () => Promise<void>;
  reload: () => Promise<void>;

  // Akcje - meals
  editMeal: (meal: MealResponseDTO) => void;
  deleteMeal: (id: string) => Promise<void>;
  closeEditModal: () => void;

  // Akcje - updates
  refetchAfterMealChange: () => Promise<void>;

  // Computed values
  isEmpty: boolean;
  isLoading: boolean;
  mealCount: number;
}

export function useDayDetails(date: string): UseDayDetailsReturn {
  const [state, setState] = useState<DayDetailsState>(getInitialState(date));

  // ... implementacja funkcji

  return {
    state,
    loadDayDetails,
    reload,
    editMeal,
    deleteMeal,
    closeEditModal,
    refetchAfterMealChange,
    isEmpty: !state.loading && state.meals.length === 0,
    isLoading: state.loading,
    mealCount: state.meals.length,
  };
}
```

### 6.5. Funkcja getInitialState (DayDetails)

```typescript
function getInitialState(date: string): DayDetailsState {
  return {
    date,
    progress: null,
    meals: [],
    loading: true,
    error: null,
    deletingMealId: null,
    editingMeal: null,
  };
}
```

### 6.6. Kluczowe funkcje hooka useDayDetails

#### loadDayDetails()

```typescript
async function loadDayDetails(): Promise<void> {
  setState((prev) => ({ ...prev, loading: true, error: null }));

  try {
    // Parallel fetch progress i meals
    const [progressRes, mealsRes] = await Promise.all([
      fetch(`/api/v1/daily-progress/${state.date}`),
      fetch(`/api/v1/meals?date=${state.date}&sort=asc`),
    ]);

    if (!progressRes.ok || !mealsRes.ok) {
      throw new Error("Failed to load day details");
    }

    const progress: DailyProgressResponseDTO = await progressRes.json();
    const mealsData: MealsListResponseDTO = await mealsRes.json();

    setState((prev) => ({
      ...prev,
      progress,
      meals: mealsData.data,
      loading: false,
    }));
  } catch (error) {
    setState((prev) => ({
      ...prev,
      loading: false,
      error: "Nie udało się załadować szczegółów dnia.",
    }));
  }
}
```

#### deleteMeal(id)

```typescript
async function deleteMeal(id: string): Promise<void> {
  setState((prev) => ({ ...prev, deletingMealId: id }));

  try {
    const response = await fetch(`/api/v1/meals/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Posiłek nie istnieje - usuń z listy
        setState((prev) => ({
          ...prev,
          meals: prev.meals.filter((m) => m.id !== id),
          deletingMealId: null,
        }));
        // Refetch progress
        await refetchProgress();
        return;
      }
      throw new Error("Failed to delete meal");
    }

    // Sukces - usuń z listy i refetch progress
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id),
      deletingMealId: null,
    }));

    await refetchProgress();
  } catch (error) {
    setState((prev) => ({
      ...prev,
      deletingMealId: null,
      error: "Nie udało się usunąć posiłku.",
    }));
  }
}
```

#### refetchAfterMealChange()

```typescript
async function refetchAfterMealChange(): Promise<void> {
  // Refetch progress i meals po dodaniu/edycji
  try {
    const [progressRes, mealsRes] = await Promise.all([
      fetch(`/api/v1/daily-progress/${state.date}`),
      fetch(`/api/v1/meals?date=${state.date}&sort=asc`),
    ]);

    if (!progressRes.ok || !mealsRes.ok) return; // Silent fail

    const progress: DailyProgressResponseDTO = await progressRes.json();
    const mealsData: MealsListResponseDTO = await mealsRes.json();

    setState((prev) => ({
      ...prev,
      progress,
      meals: mealsData.data,
    }));
  } catch (error) {
    console.error("Failed to refetch after meal change:", error);
  }
}
```

### 6.7. Dodatkowe hooki pomocnicze

#### useInfiniteScroll

```typescript
export function useInfiniteScroll(
  callback: () => void,
  options: { hasMore: boolean; loading: boolean }
): React.RefObject<HTMLDivElement> {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger || !options.hasMore || options.loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(trigger);

    return () => {
      observer.disconnect();
    };
  }, [callback, options.hasMore, options.loading]);

  return triggerRef;
}
```

#### usePullToRefresh

```typescript
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const startY = useRef(0);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;
        if (diff > 100) {
          setPulling(true);
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pulling) {
        await onRefresh();
        setPulling(false);
      }
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [pulling, onRefresh]);

  return pulling;
}
```

#### useMediaQuery

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    media.addEventListener("change", listener);

    return () => {
      media.removeEventListener("change", listener);
    };
  }, [query]);

  return matches;
}

// Użycie: const isDesktop = useMediaQuery('(min-width: 768px)');
```

#### useDateFormatter

```typescript
export function useDateFormatter(): DateFormatter {
  return useMemo(
    () => ({
      format(date: string | Date, format: DateFormat): string {
        const d = typeof date === "string" ? new Date(date) : date;

        switch (format) {
          case "YYYY-MM-DD":
            return d.toISOString().split("T")[0];
          case "full":
            return new Intl.DateTimeFormat("pl-PL", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(d);
          case "short":
            return new Intl.DateTimeFormat("pl-PL", {
              weekday: "short",
              day: "numeric",
              month: "short",
            }).format(d);
          case "time":
            return new Intl.DateTimeFormat("pl-PL", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(d);
          default:
            return d.toISOString();
        }
      },
      parseAPIDate(date: string): Date {
        return new Date(date);
      },
      toAPIFormat(date: Date): string {
        return date.toISOString().split("T")[0];
      },
    }),
    []
  );
}
```

## 7. Integracja API

### 7.1. GET /api/v1/daily-progress

**Cel**: Pobranie listy dni z podsumowaniem kalorycznym dla zalogowanego użytkownika.

**Kiedy wywoływane**:

- Initial load dashboardu
- Infinite scroll (loadMoreDays)
- Pull-to-refresh (refreshDays)
- Po dodaniu/edycji/usunięciu posiłku (refetchAfterMealChange)

**Request**:

```typescript
// Query parameters
interface GetDailyProgressQuery {
  date_from?: string; // opcjonalnie
  date_to?: string; // opcjonalnie
  limit: number; // domyślnie 30
  offset: number; // domyślnie 0
}
```

**Przykład request**:

```
GET /api/v1/daily-progress?limit=30&offset=0
```

**Response (success - 200)**:

```typescript
// Typ: DailyProgressListResponseDTO
{
  data: DailyProgressResponseDTO[];
  pagination: PaginationMetaDTO;
}
```

**Przykład response**:

```json
{
  "data": [
    {
      "date": "2025-01-27",
      "user_id": "uuid",
      "total_calories": 2150,
      "total_protein": 95.5,
      "total_carbs": 220.0,
      "total_fats": 75.0,
      "calorie_goal": 2500,
      "percentage": 86.0,
      "status": "under"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 30,
    "offset": 0
  }
}
```

**Error responses**:

- **400 Validation Error**: Invalid query parameters
- **401 Unauthorized**: Not authenticated (redirect to login)
- **500 Internal Server Error**: Database failure

**Frontend handling**:

```typescript
// W funkcji loadInitialDays() hooka useDashboard

try {
  const response = await fetch(`/api/v1/daily-progress?limit=${limit}&offset=0`);

  if (response.status === 401) {
    // Redirect to login
    window.location.href = "/login";
    return;
  }

  if (!response.ok) {
    throw new Error("Failed to load days");
  }

  const data: DailyProgressListResponseDTO = await response.json();

  setState((prev) => ({
    ...prev,
    days: data.data,
    loading: false,
    offset: data.data.length,
    hasMore: data.pagination.total > data.data.length,
  }));
} catch (error) {
  setState((prev) => ({
    ...prev,
    loading: false,
    error: "Nie udało się załadować danych. Spróbuj ponownie.",
  }));
}
```

---

### 7.2. GET /api/v1/daily-progress/:date

**Cel**: Pobranie szczegółów pojedynczego dnia.

**Kiedy wywoływane**:

- Initial load DayDetails
- Po dodaniu/edycji/usunięciu posiłku (refetch)

**Request**:

```typescript
// URL parameter
date: string; // YYYY-MM-DD
```

**Przykład request**:

```
GET /api/v1/daily-progress/2025-01-27
```

**Response (success - 200)**:

```typescript
// Typ: DailyProgressResponseDTO
{
  date: string;
  user_id: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  calorie_goal: number;
  percentage: number;
  status: DailyProgressStatus;
}
```

**Response (no meals - 200)**:

```json
{
  "date": "2025-01-27",
  "user_id": "uuid",
  "total_calories": 0,
  "total_protein": 0,
  "total_carbs": 0,
  "total_fats": 0,
  "calorie_goal": 2500,
  "percentage": 0.0,
  "status": "under"
}
```

**Error responses**:

- **400 Validation Error**: Invalid date format
- **401 Unauthorized**: Not authenticated
- **500 Internal Server Error**: Database failure

**Frontend handling**:

```typescript
// W funkcji loadDayDetails() hooka useDayDetails

try {
  const response = await fetch(`/api/v1/daily-progress/${date}`);

  if (!response.ok) {
    throw new Error("Failed to load day progress");
  }

  const progress: DailyProgressResponseDTO = await response.json();

  setState((prev) => ({
    ...prev,
    progress,
  }));
} catch (error) {
  setState((prev) => ({
    ...prev,
    error: "Nie udało się załadować szczegółów dnia.",
  }));
}
```

---

### 7.3. GET /api/v1/meals

**Cel**: Pobranie listy posiłków dla zalogowanego użytkownika z filtrowaniem po dacie.

**Kiedy wywoływane**:

- Initial load DayDetails (z filtrem `date`)
- Po dodaniu/edycji/usunięciu posiłku (refetch)

**Request**:

```typescript
// Query parameters
interface GetMealsQuery {
  date?: string; // YYYY-MM-DD (używamy tego dla DayDetails)
  date_from?: string;
  date_to?: string;
  category?: MealCategory;
  limit?: number; // domyślnie 50
  offset?: number; // domyślnie 0
  sort?: "asc" | "desc"; // domyślnie desc, dla DayDetails używamy 'asc'
}
```

**Przykład request (DayDetails)**:

```
GET /api/v1/meals?date=2025-01-27&sort=asc
```

**Response (success - 200)**:

```typescript
// Typ: MealsListResponseDTO
{
  data: MealResponseDTO[];
  pagination: PaginationMetaDTO;
}
```

**Przykład response**:

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "description": "Jajka sadzone z chlebem",
      "calories": 420,
      "protein": 18.5,
      "carbs": 25.0,
      "fats": 28.0,
      "category": "breakfast",
      "input_method": "ai",
      "meal_timestamp": "2025-01-27T08:30:00Z",
      "created_at": "2025-01-27T08:35:00Z",
      "updated_at": "2025-01-27T08:35:00Z",
      "ai_generation": {
        "id": "uuid",
        "prompt": "dwa jajka sadzone na maśle i kromka chleba",
        "assumptions": "Założono: 2 jajka średniej wielkości...",
        "model_used": "gpt-4",
        "generation_duration": 1234
      }
    }
  ],
  "pagination": {
    "total": 5,
    "limit": 50,
    "offset": 0
  }
}
```

**Frontend handling**:

```typescript
// W funkcji loadDayDetails() hooka useDayDetails

try {
  const response = await fetch(`/api/v1/meals?date=${date}&sort=asc`);

  if (!response.ok) {
    throw new Error("Failed to load meals");
  }

  const mealsData: MealsListResponseDTO = await response.json();

  setState((prev) => ({
    ...prev,
    meals: mealsData.data,
  }));
} catch (error) {
  // Obsługa błędu
}
```

---

### 7.4. DELETE /api/v1/meals/:id

**Cel**: Usunięcie posiłku.

**Kiedy wywoływane**: Po potwierdzeniu usunięcia w DeleteConfirmation

**Request**:

```typescript
// URL parameter
id: string; // UUID posiłku
```

**Przykład request**:

```
DELETE /api/v1/meals/550e8400-e29b-41d4-a716-446655440000
```

**Response (success - 204 No Content)**:
(brak body)

**Error responses**:

- **404 Not Found**: Posiłek nie istnieje
- **401 Unauthorized**: Not authenticated
- **500 Internal Server Error**: Database failure

**Frontend handling**:

```typescript
// W funkcji deleteMeal(id) hooka useDayDetails

try {
  const response = await fetch(`/api/v1/meals/${id}`, {
    method: "DELETE",
  });

  if (response.status === 404) {
    // Posiłek nie istnieje - usuń z listy lokalnie
    setState((prev) => ({
      ...prev,
      meals: prev.meals.filter((m) => m.id !== id),
      deletingMealId: null,
    }));
    await refetchProgress();
    return;
  }

  if (!response.ok) {
    throw new Error("Failed to delete meal");
  }

  // Sukces - usuń z listy i refetch progress
  setState((prev) => ({
    ...prev,
    meals: prev.meals.filter((m) => m.id !== id),
    deletingMealId: null,
  }));

  await refetchProgress();
} catch (error) {
  setState((prev) => ({
    ...prev,
    deletingMealId: null,
    error: "Nie udało się usunąć posiłku.",
  }));
}
```

---

## 8. Interakcje użytkownika

### 8.1. Dashboard - Initial Load

**Trigger**: Wejście na stronę główną `/`

**Akcja**:

1. Strona Astro renderuje się po stronie serwera
2. Komponent React (`DashboardContainer`) hydratuje się
3. Hook `useDashboard()` wywołuje `loadInitialDays()`
4. **Loading state**: Wyświetlenie 3x `SkeletonDayCard`
5. API call: `GET /api/v1/daily-progress?limit=30&offset=0`
6. Po otrzymaniu danych: render `DayCard` dla każdego dnia
7. Desktop: Auto-selekcja dzisiejszego dnia, render `DayDetailsPanel`

---

### 8.2. Dashboard - Infinite Scroll

**Trigger**: Scroll użytkownika do końca listy (IntersectionObserver trigger)

**Akcja**:

1. `InfiniteScrollTrigger` wykrywa wejście w viewport
2. Sprawdzenie `hasMore === true && loading === false`
3. Wywołanie `loadMoreDays()`
4. **Loading state**: Spinner lub skeleton na końcu listy
5. API call: `GET /api/v1/daily-progress?limit=30&offset=30`
6. Append nowych dni do listy (`state.days.push(...newDays)`)
7. Update `offset` i `hasMore`

---

### 8.3. Dashboard - Pull-to-Refresh (Mobile)

**Trigger**: Użytkownik przeciąga listę w dół na początku (pull-to-refresh gesture)

**Akcja**:

1. Hook `usePullToRefresh()` wykrywa gesture
2. **Refreshing state**: Spinner na górze listy
3. Wywołanie `refreshDays()`
4. API call: `GET /api/v1/daily-progress?limit=30&offset=0`
5. Replace listy nowymi danymi (`state.days = newDays`)
6. Reset `offset` i `hasMore`
7. Ukrycie spinnera

---

### 8.4. Dashboard - Kliknięcie na DayCard (Mobile)

**Trigger**: Tap na kartę dnia

**Akcja**:

1. Wywołanie `onDayClick(date)`
2. Navigate do `/day/:date` (Astro navigate)
3. Ładowanie strony DayDetails

---

### 8.5. Dashboard - Kliknięcie na DayCard (Desktop)

**Trigger**: Click na kartę dnia

**Akcja**:

1. Wywołanie `selectDay(date)`
2. Update `state.selectedDate = date`
3. Highlight wybranej karty (active state)
4. `DayDetailsPanel` renderuje `DayDetailsContainer` z `date` prop
5. `DayDetailsContainer` ładuje szczegóły dnia

---

### 8.6. Dashboard - Kliknięcie FAB "Dodaj Posiłek"

**Trigger**: Click na FAB (Floating Action Button)

**Akcja**:

1. Wywołanie `setIsAddMealOpen(true)`
2. Otwarcie `AddMealModal` (już zaimplementowany)
3. Użytkownik wypełnia formularz i zapisuje
4. Callback `onSuccess(meal)`:
   - Desktop: Wywołanie `refetchAfterMealChange()` + `selectDay(meal.date)`
   - Mobile: Wywołanie `refetchAfterMealChange()`
5. Toast notification: "Posiłek dodany"

---

### 8.7. DayDetails - Initial Load

**Trigger**: Wejście na `/day/:date`

**Akcja**:

1. Strona Astro renderuje się z date param
2. Komponent React (`DayDetailsContainer`) hydratuje się z `date` prop
3. Hook `useDayDetails(date)` wywołuje `loadDayDetails()`
4. **Loading state**: Skeleton loader dla header i listy
5. Parallel API calls:
   - `GET /api/v1/daily-progress/:date`
   - `GET /api/v1/meals?date=:date&sort=asc`
6. Po otrzymaniu danych:
   - Render `DayHeader` z progress
   - Render `MealsList` z posiłkami
   - Jeśli brak posiłków: render `EmptyDayState`

---

### 8.8. DayDetails - Kliknięcie na MealCard

**Trigger**: Click/Tap na kartę posiłku

**Akcja**:

1. Wywołanie `onMealClick(meal)`
2. Wywołanie `editMeal(meal)`
3. Update `state.editingMeal = meal`
4. Otwarcie `EditMealModal` z preloaded danymi
5. Użytkownik edytuje i zapisuje
6. Callback `onSuccess(updatedMeal)`:
   - Wywołanie `refetchAfterMealChange()`
   - Zamknięcie modala
7. Toast notification: "Posiłek zaktualizowany"

---

### 8.9. DayDetails - Kliknięcie Edit Icon

**Trigger**: Click/Tap na ikonę edycji w MealCard

**Akcja**:

- Identyczna jak 8.8 (kliknięcie na kartę)

---

### 8.10. DayDetails - Kliknięcie Delete Icon

**Trigger**: Click/Tap na ikonę usuwania w MealCard

**Akcja**:

1. Wywołanie `onDelete` w MealCard
2. **Inline expansion**: MealCard expanduje się, pokazując `DeleteConfirmation`
3. DeleteConfirmation wyświetla:
   - Tekst: "Czy na pewno chcesz usunąć ten posiłek?"
   - Opis posiłku (dla kontekstu)
   - Przycisk "Usuń" (destructive)
   - Przycisk "Anuluj"
4. Auto-collapse timer: 5 sekund (setTimeout)
   - Po 5s bez akcji → collapse confirmation

---

### 8.11. DayDetails - Potwierdzenie Usunięcia

**Trigger**: Click na przycisk "Usuń" w DeleteConfirmation

**Akcja**:

1. Wywołanie `onConfirm()`
2. Wywołanie `deleteMeal(id)` z hooka
3. **Deleting state**: Przycisk "Usuń" pokazuje spinner + disabled
4. API call: `DELETE /api/v1/meals/:id`
5. Po sukcesie:
   - **Fade-out animation** MealCard
   - Usunięcie z `state.meals`
   - Refetch `state.progress` (zaktualizowana suma)
   - Toast notification: "Posiłek usunięty"
6. Po błędzie:
   - Toast notification: "Nie udało się usunąć posiłku"
   - Collapse confirmation

---

### 8.12. DayDetails - Anulowanie Usunięcia

**Trigger**:

- Click na przycisk "Anuluj" w DeleteConfirmation
- Auto-collapse po 5s

**Akcja**:

1. Wywołanie `onCancel()`
2. **Collapse animation** DeleteConfirmation
3. MealCard wraca do normalnego stanu

---

### 8.13. DayDetails - Kliknięcie "+" Button (Add Meal)

**Trigger**: Click na przycisk "+" w DayHeader

**Akcja**:

1. Wywołanie `onAddMeal()`
2. Otwarcie `AddMealModal`
3. Pre-fill daty i czasu (bieżący dzień + czas)
4. Użytkownik wypełnia i zapisuje
5. Callback `onSuccess(meal)`:
   - Wywołanie `refetchAfterMealChange()`
   - Zamknięcie modala
6. Toast notification: "Posiłek dodany"

---

### 8.14. DayDetails - Back Button (Mobile)

**Trigger**: Click na przycisk "←" w DayHeader (mobile only)

**Akcja**:

1. Wywołanie `onBack()`
2. Navigate do `/` (dashboard)

---

## 9. Warunki i walidacja

### 9.1. Dashboard - Infinite Scroll Trigger

**Komponenty**: `InfiniteScrollTrigger`

**Warunki**:

- `hasMore === true` - są jeszcze dni do załadowania
- `loading === false` - nie trwa już ładowanie

**Wpływ na UI**:

- Jeśli warunki spełnione: trigger `loadMoreDays()` po wejściu w viewport
- Jeśli `hasMore === false`: nie renderuj triggera

---

### 9.2. Dashboard - Skeleton Loaders

**Komponenty**: `DaysList`

**Warunki**:

- `loading === true` - trwa ładowanie
- `days.length === 0` - brak danych (initial load)

**Wpływ na UI**:

- Render 3x `SkeletonDayCard`
- Przy infinite scroll: render spinner na końcu listy (nie skeleton)

---

### 9.3. Dashboard - Empty State

**Komponenty**: `DaysList`

**Warunki**:

- `loading === false` - zakończono ładowanie
- `days.length === 0` - brak dni

**Wpływ na UI**:

- Render `EmptyDashboard` zamiast listy
- Wyświetlenie CTA "Dodaj posiłek"

---

### 9.4. Dashboard - Selected Day (Desktop)

**Komponenty**: `DayCard`

**Warunki**:

- `isSelected === true` (day.date === selectedDate)

**Wpływ na UI**:

- Highlight karty (border, background color, shadow)
- Active state styling

---

### 9.5. DayDetails - Date Parameter Validation

**Komponenty**: `DayDetailsPage` (Astro), `DayDetailsContainer`

**Warunki**:

- Date param musi być w formacie YYYY-MM-DD
- Regex: `/^\d{4}-\d{2}-\d{2}$/`

**Wpływ na UI**:

- Niepoprawny format → redirect do `/`
- Toast notification: "Niepoprawna data"

---

### 9.6. DayDetails - Empty State

**Komponenty**: `MealsList`

**Warunki**:

- `loading === false` - zakończono ładowanie
- `meals.length === 0` - brak posiłków

**Wpływ na UI**:

- Render `EmptyDayState` zamiast listy
- Wyświetlenie CTA "Dodaj posiłek"

---

### 9.7. DayDetails - Macronutrients Display

**Komponenty**: `MealCard`

**Warunki**:

- Dla każdego makroskładnika (protein, carbs, fats):
  - Jeśli `value !== null && value !== undefined`: wyświetl wartość
  - Jeśli `value === null || value === undefined`: wyświetl "-"

**Wpływ na UI**:

- Przykład: "Białko: 18.5g | Węglowodany: - | Tłuszcze: 28.0g"

---

### 9.8. DayDetails - Delete Confirmation State

**Komponenty**: `MealCard`, `DeleteConfirmation`

**Warunki**:

- `deleteConfirmationOpen === true` - confirmation jest otwarty
- `deletingMealId === meal.id` - trwa usuwanie tego posiłku

**Wpływ na UI**:

- Expansion `DeleteConfirmation` inline w MealCard
- Disabled edit/delete buttons podczas usuwania
- Loading spinner w przycisku "Usuń"
- Auto-collapse po 5s (setTimeout)

---

### 9.9. Progress Bar - Status Coloring

**Komponenty**: `CalorieProgressBar`

**Warunki**:

- `status === 'under'`: bg-sky-400
- `status === 'on_track'`: bg-green-500
- `status === 'over'`: bg-orange-500

**Obliczanie statusu** (po stronie API):

- `under`: total_calories < calorie_goal - 100
- `on_track`: calorie_goal - 100 <= total_calories <= calorie_goal + 100
- `over`: total_calories > calorie_goal + 100

**Wpływ na UI**:

- Kolorowanie progress bar
- Kolorowanie tła DayCard (opcjonalnie, light version)

---

### 9.10. Edit/Delete Actions - Disabled State

**Komponenty**: `MealCard`

**Warunki**:

- `deletingMealId === meal.id` - trwa usuwanie
- `loading === true` - trwa ładowanie ogólne

**Wpływ na UI**:

- Disabled edit/delete buttons
- Cursor: not-allowed

---

## 10. Obsługa błędów

### 10.1. Dashboard - Błąd Initial Load

**Scenariusz**: Błąd sieci lub serwera podczas początkowego ładowania dashboardu

**Obsługa**:

1. Catch w `loadInitialDays()`
2. Update `state.error = 'Nie udało się załadować danych. Spróbuj ponownie.'`
3. **Error state UI**:
   - Alert box (variant: destructive) z komunikatem błędu
   - Przycisk "Spróbuj ponownie"
4. Kliknięcie "Spróbuj ponownie" → retry `loadInitialDays()`

**Komponenty dotknięte**: `DashboardContainer`, `DaysList`

---

### 10.2. Dashboard - Błąd Infinite Scroll

**Scenariusz**: Błąd podczas ładowania kolejnych dni (infinite scroll)

**Obsługa**:

1. Catch w `loadMoreDays()`
2. Toast notification: "Nie udało się załadować kolejnych dni"
3. `state.hasMore = false` - zapobiega kolejnym próbom
4. **Error indicator** na końcu listy:
   - Komunikat błędu
   - Przycisk "Spróbuj ponownie"
5. Kliknięcie "Spróbuj ponownie" → retry `loadMoreDays()` + `state.hasMore = true`

**Komponenty dotknięte**: `DashboardContainer`, `DaysList`

---

### 10.3. Dashboard - Błąd Pull-to-Refresh

**Scenariusz**: Błąd podczas pull-to-refresh (mobile)

**Obsługa**:

1. Catch w `refreshDays()`
2. Toast notification: "Nie udało się odświeżyć danych"
3. Zachowanie poprzednich danych w `state.days`
4. `state.refreshing = false` - ukrycie spinnera

**Komponenty dotknięte**: `DashboardContainer`

---

### 10.4. Dashboard - Błąd 401 Unauthorized

**Scenariusz**: Użytkownik niezalogowany lub sesja wygasła

**Obsługa**:

1. Wykrycie response.status === 401
2. Redirect do `/login`
3. Query param z returnUrl: `/login?returnUrl=/`
4. Po zalogowaniu → redirect z powrotem do dashboardu

**Komponenty dotknięte**: `DashboardContainer`

---

### 10.5. DayDetails - Błąd Initial Load

**Scenariusz**: Błąd podczas ładowania szczegółów dnia (progress lub meals)

**Obsługa**:

1. Catch w `loadDayDetails()`
2. Update `state.error = 'Nie udało się załadować szczegółów dnia.'`
3. **Error state UI**:
   - Alert box z komunikatem
   - Przycisk "Spróbuj ponownie"
4. Kliknięcie "Spróbuj ponownie" → retry `loadDayDetails()`

**Komponenty dotknięte**: `DayDetailsContainer`

---

### 10.6. DayDetails - Błąd Usuwania (404 Not Found)

**Scenariusz**: Posiłek nie istnieje (został już usunięty lub nie należy do użytkownika)

**Obsługa**:

1. Wykrycie response.status === 404
2. Toast notification: "Posiłek nie został znaleziony"
3. Usunięcie z lokalnej listy: `state.meals = state.meals.filter(m => m.id !== id)`
4. Refetch progress (zaktualizowana suma)

**Komponenty dotknięte**: `DayDetailsContainer`, `MealCard`

---

### 10.7. DayDetails - Błąd Usuwania (500 Server Error)

**Scenariusz**: Błąd serwera podczas usuwania posiłku

**Obsługa**:

1. Catch w `deleteMeal(id)`
2. Toast notification: "Nie udało się usunąć posiłku. Spróbuj ponownie."
3. Collapse DeleteConfirmation
4. Zachowanie posiłku na liście
5. `state.deletingMealId = null` - reset loading state

**Komponenty dotknięte**: `DayDetailsContainer`, `MealCard`, `DeleteConfirmation`

---

### 10.8. DayDetails - Błąd Niepoprawnej Daty w URL

**Scenariusz**: Date param w URL nie jest w formacie YYYY-MM-DD

**Obsługa**:

1. Walidacja w Astro page lub useEffect
2. Redirect do `/` (dashboard)
3. Toast notification: "Niepoprawna data"

**Komponenty dotknięte**: `DayDetailsPage` (Astro), `DayDetailsContainer`

---

### 10.9. EditMealModal - Błąd Edycji (400 Validation Error)

**Scenariusz**: Błąd walidacji podczas edycji posiłku (dane niepoprawne)

**Obsługa**:

1. Response 400 z details (field: message)
2. Mapowanie błędów na `validationErrors`
3. Wyświetlenie błędów przy odpowiednich polach w formularzu (czerwone obramowanie + komunikat)
4. Scroll do pierwszego błędu
5. Modal pozostaje otwarty

**Komponenty dotknięte**: `EditMealModal`, form fields

---

### 10.10. EditMealModal - Błąd Edycji (500 Server Error)

**Scenariusz**: Błąd serwera podczas edycji posiłku

**Obsługa**:

1. Catch w `submitMeal()`
2. Toast notification: "Nie udało się zaktualizować posiłku. Spróbuj ponownie."
3. Modal pozostaje otwarty
4. Dane w formularzu zachowane

**Komponenty dotknięte**: `EditMealModal`

---

### 10.11. Błąd Sieci (Network Error)

**Scenariusz**: Brak połączenia z internetem, timeout, itp.

**Obsługa**:

1. Catch w bloku try-catch wszystkich API calls
2. Toast notification: "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie."
3. Przycisk "Spróbuj ponownie" (gdzie applicable)

**Komponenty dotknięte**: Wszystkie komponenty z API calls

---

## 11. Kroki implementacji

### Krok 1: Przygotowanie struktury projektu

1.1. Utworzenie katalogów dla komponentów widoków:

```
src/
  pages/
    index.astro                    # Dashboard page
    day/
      [date].astro                 # DayDetails page
  components/
    dashboard/
      DashboardContainer.tsx
      DaysList.tsx
      DayCard.tsx
      SkeletonDayCard.tsx
      EmptyDashboard.tsx
      FAB.tsx
    day-details/
      DayDetailsContainer.tsx
      DayHeader.tsx
      MacroDisplay.tsx
      MealsList.tsx
      MealCard.tsx
      DeleteConfirmation.tsx
      EmptyDayState.tsx
    shared/
      CalorieProgressBar.tsx
      InfiniteScrollTrigger.tsx
```

1.2. Utworzenie plików dla typów i hooków:

```
src/
  types/
    dashboard.types.ts
    day-details.types.ts
  hooks/
    useDashboard.ts
    useDayDetails.ts
    useInfiniteScroll.ts
    usePullToRefresh.ts
    useMediaQuery.ts
    useDateFormatter.ts
  lib/
    utils/
      date-formatter.ts
      status-colors.ts
```

---

### Krok 2: Implementacja typów i stałych

2.1. Utworzyć plik `src/types/dashboard.types.ts`:

- `DashboardState`
- `InfiniteScrollParams`
- `STATUS_COLOR_MAP`
- `PAGINATION_LIMITS`

  2.2. Utworzyć plik `src/types/day-details.types.ts`:

- `DayDetailsState`
- `DeleteConfirmationState`
- `CATEGORY_CONFIG`

  2.3. Utworzyć plik `src/lib/utils/date-formatter.ts`:

- `DateFormatter` interface
- `formatDate()` implementation
- `parseAPIDate()` implementation

  2.4. Utworzyć plik `src/lib/utils/status-colors.ts`:

- `getStatusColor(status)` helper
- Export `STATUS_COLOR_MAP`

---

### Krok 3: Implementacja prostych komponentów shared

3.1. **CalorieProgressBar.tsx**:

- Props: percentage, status, showLabel, size
- Progress bar element (HTML `<div>` z width %)
- Kolorowanie wg statusu (używając `STATUS_COLOR_MAP`)
- Opcjonalny label z procentem
- Tailwind styling, responsive

  3.2. **InfiniteScrollTrigger.tsx**:

- Props: onIntersect, hasMore, loading
- Invisible div (h-1)
- Intersection Observer hook
- Trigger tylko gdy hasMore && !loading

---

### Krok 4: Implementacja pomocniczych hooków

4.1. **useInfiniteScroll.ts**:

- Params: callback, options (hasMore, loading)
- Intersection Observer setup
- Return: triggerRef

  4.2. **usePullToRefresh.ts** (opcjonalnie, może być biblioteka):

- Touch events handling
- Pull gesture detection
- Callback trigger
- Return: pulling state

  4.3. **useMediaQuery.ts**:

- Params: query string
- MediaQueryList API
- Return: matches boolean

  4.4. **useDateFormatter.ts**:

- Return: DateFormatter object
- Implementacja format(), parseAPIDate(), toAPIFormat()

---

### Krok 5: Implementacja głównego hooka useDashboard

5.1. **useDashboard.ts**:

- Implementacja stanu (useState<DashboardState>)
- `getInitialState(initialData)` function
- `loadInitialDays()` - initial load
- `loadMoreDays()` - infinite scroll
- `refreshDays()` - pull-to-refresh
- `selectDay(date)` - desktop two-pane selection
- `refetchAfterMealChange()` - po zmianach w posiłkach
- Error handling w każdej funkcji

  5.2. Testowanie hooka w izolacji (opcjonalnie: unit testy)

---

### Krok 6: Implementacja komponentów Dashboard

6.1. **SkeletonDayCard.tsx**:

- Placeholder dla daty (gray line, animate-pulse)
- Placeholder dla progress bar
- Placeholder dla tekstu
- Tailwind styling

  6.2. **EmptyDashboard.tsx**:

- Props: onAddMeal
- Ikona (🍽️)
- Tekst "Zacznij swoją przygodę!"
- CTA Button "Dodaj posiłek"
- onClick → onAddMeal()

  6.3. **FAB.tsx**:

- Props: onClick
- Button (rounded-full, fixed bottom-right)
- Ikona "+"
- Shadow, hover effects
- Tailwind styling

  6.4. **DayCard.tsx**:

- Props: day, isSelected, onClick
- Layout:
  - Header: Data (formatDate 'short')
  - CalorieProgressBar
  - Suma kalorii/cel + procent
  - Liczba posiłków (opcjonalnie, jeśli dostępna w API)
- onClick → onClick(day.date)
- Active/Selected state styling
- Hover effects (shadow, scale)
- Responsive

  6.5. **DaysList.tsx**:

- Props: days, loading, hasMore, selectedDate, onDayClick, onLoadMore
- Mapowanie days → DayCard
- InfiniteScrollTrigger na końcu
- Conditional: SkeletonDayCard (3x) vs DayCard list vs EmptyDashboard

  6.6. **DashboardContainer.tsx**:

- Props: initialData (opcjonalnie)
- Hook: useDashboard(initialData)
- Hook: useMediaQuery('(min-width: 768px)') dla desktop detection
- Layout:
  - DaysList
  - FAB
  - [Desktop] DayDetailsPanel (conditional)
- State: isAddMealOpen
- Handlers: onDayClick, onLoadMore, onAddMealSuccess
- Modals: AddMealModal (conditional)

---

### Krok 7: Implementacja strony Dashboard (Astro)

7.1. **src/pages/index.astro**:

- Import DashboardContainer (client:load)
- Import AppLayout
- Opcjonalnie: SSR fetch initial data (getStaticProps lub SSR)
- Layout:

  ```astro
  ---
  import AppLayout from "../layouts/AppLayout.astro";
  import DashboardContainer from "../components/dashboard/DashboardContainer";

  // Opcjonalnie: SSR fetch
  // const initialData = await fetch('/api/v1/daily-progress?limit=30&offset=0').then(r => r.json());
  ---

  <AppLayout title="Dashboard">
    <DashboardContainer client:load />
  </AppLayout>
  ```

---

### Krok 8: Implementacja głównego hooka useDayDetails

8.1. **useDayDetails.ts**:

- Implementacja stanu (useState<DayDetailsState>)
- `getInitialState(date)` function
- `loadDayDetails()` - parallel fetch progress + meals
- `deleteMeal(id)` - DELETE API + refetch
- `editMeal(meal)` - set editingMeal state
- `closeEditModal()` - reset editingMeal
- `refetchAfterMealChange()` - refetch po zmianach
- Error handling

  8.2. Testowanie hooka

---

### Krok 9: Implementacja komponentów DayDetails

9.1. **MacroDisplay.tsx**:

- Props: protein, carbs, fats, fiber (optional)
- Grid 2x2 (responsive)
- Dla każdego makro:
  - Label
  - Wartość (z "g" suffix) lub "-"
- Tailwind styling

  9.2. **DeleteConfirmation.tsx**:

- Props: mealDescription, onConfirm, onCancel, loading
- Alert box (variant: destructive/warning)
- Tekst pytający + opis posiłku
- Buttons: "Usuń" (loading state), "Anuluj"
- Auto-collapse po 5s (useEffect z setTimeout)

  9.3. **EmptyDayState.tsx**:

- Props: onAddMeal
- Ikona (📝)
- Tekst "Brak posiłków w tym dniu"
- CTA Button "Dodaj posiłek"

  9.4. **MealCard.tsx**:

- Props: meal, onMealClick, onEdit, onDelete, deleting
- Local state: deleteConfirmationOpen
- Layout:
  - Header: Timestamp, Category badge
  - Body: Description, Kalorie, Makro (lub "-"), Input method badge
  - Footer: EditButton, DeleteButton
  - DeleteConfirmation (conditional, expanded inline)
- Handlers: onClick, onEdit, onDelete, onConfirm, onCancel
- Fade-out animation przy usuwaniu (CSS transition)
- Hover effects

  9.5. **MealsList.tsx**:

- Props: meals, loading, onMealClick, onMealEdit, onMealDelete
- Mapowanie meals → MealCard
- Conditional: EmptyDayState vs MealCard list
- Skeleton loaders (opcjonalnie)

  9.6. **DayHeader.tsx**:

- Props: progress, mealCount, showBackButton, onBack, onAddMeal
- Sticky positioning (sticky top-0)
- Layout:
  - BackButton (conditional, mobile)
  - Data (formatDate 'full')
  - CalorieProgressBar
  - Suma kalorii/cel + procent
  - MacroDisplay
  - Liczba posiłków
  - AddButton "+"
- Handlers: onBack, onAddMeal

  9.7. **DayDetailsContainer.tsx**:

- Props: date, embedded (optional), onDateChange (optional)
- Hook: useDayDetails(date)
- State: isAddMealOpen, isEditMealOpen
- Handlers: onMealClick, onMealEdit, onMealDelete, onAddMeal, onBack
- Layout:
  - DayHeader (sticky)
  - MealsList
  - Modals: AddMealModal, EditMealModal (conditional)

---

### Krok 10: Implementacja EditMealModal

10.1. **EditMealModal.tsx**:

- Props: isOpen, meal, onClose, onSuccess
- Hook: useEditMealForm(meal.id, meal) - podobny do useAddMealForm
- Formularz identyczny jak AddMealModal:
  - SegmentedControl (AI/Manual)
  - AIMode lub ManualMode
  - CommonFields
  - FormActions
- Pre-populate z meal data
- API: PATCH /api/v1/meals/:id
- Note: automatyczna zmiana input_method na 'ai-edited' przy edycji AI meal
- Callback onSuccess(updatedMeal)

  10.2. **useEditMealForm.ts**:

- Podobny do useAddMealForm
- Dodatkowo: preload initial data
- API endpoint: PATCH zamiast POST
- Logika input_method change (ai → ai-edited)

---

### Krok 11: Implementacja strony DayDetails (Astro)

11.1. **src/pages/day/[date].astro**:

- Import DayDetailsContainer (client:load)
- Import AppLayout
- Extract date param
- Walidacja date format (regex)
- Opcjonalnie: SSR fetch initial data
- Layout:

  ```astro
  ---
  import AppLayout from "../../layouts/AppLayout.astro";
  import DayDetailsContainer from "../../components/day-details/DayDetailsContainer";

  const { date } = Astro.params;

  // Walidacja
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!date || !dateRegex.test(date)) {
    return Astro.redirect("/");
  }
  ---

  <AppLayout title={`Szczegóły dnia ${date}`}>
    <DayDetailsContainer client:load date={date} />
  </AppLayout>
  ```

---

### Krok 12: Implementacja Desktop Two-Pane Layout

12.1. **DashboardContainer.tsx** - update:

- Hook: useMediaQuery('(min-width: 768px)')
- Conditional rendering:
  ```tsx
  {
    isDesktop && selectedDate && (
      <div className="fixed right-0 top-16 bottom-0 w-1/2 border-l overflow-auto">
        <DayDetailsContainer date={selectedDate} embedded={true} />
      </div>
    );
  }
  ```
- DaysList z max-width na desktop (w-1/2 gdy panel otwarty)

  12.2. **DayDetailsContainer.tsx** - update:

- Props: embedded (boolean)
- Conditional: showBackButton = !embedded
- Conditional styling dla embedded mode

---

### Krok 13: Stylowanie z Tailwind CSS

13.1. Stylowanie wszystkich komponentów zgodnie z designem:

- Mobile-first approach
- Responsive breakpoints (sm, md, lg)
- Progress bar colors (gray-400, green-500, orange-500)
- Category badges colors
- Hover effects (shadow-lg, scale-105)
- Animations (fade-in, fade-out, pulse, slide)

  13.2. Szczególne uwagi:

- DayCard: hover shadow-lg transition-transform
- MealCard: fade-out animation przy usuwaniu (opacity + height transition)
- DeleteConfirmation: slide-down animation (max-height transition)
- Skeleton loaders: animate-pulse
- FAB: shadow-xl, hover shadow-2xl, z-50

---

### Krok 14: Integracja z API i testowanie

14.1. Testowanie wywołań API:

- GET /api/v1/daily-progress (pagination, infinite scroll)
- GET /api/v1/daily-progress/:date (single day)
- GET /api/v1/meals (filtering by date)
- DELETE /api/v1/meals/:id (delete meal)
- Obsługa błędów (400, 401, 404, 500)

  14.2. Testowanie scenariuszy:

- Dashboard initial load
- Infinite scroll (multiple batches)
- Pull-to-refresh (mobile)
- Desktop two-pane selection
- DayDetails initial load
- Edit meal (open modal, edit, save)
- Delete meal (confirmation, delete, refetch)
- Empty states (dashboard, day details)
- Error states (network error, 404, 500)

---

### Krok 15: Accessibility

15.1. Sprawdzenie:

- Semantic HTML (`<main>`, `<nav>`, `<article>`)
- Keyboard navigation (Tab, Enter, Escape)
- Focus management (modals, delete confirmation)
- ARIA labels:
  - Progress bars: aria-label="Postęp realizacji celu kalorycznego"
  - Buttons: aria-label dla icon-only buttons
  - Empty states: role="status" dla komunikatów
- Screen reader friendly:
  - Alt text dla ikon (jeśli używamy img zamiast emoji)
  - Announce changes (aria-live dla toast notifications)

  15.2. Testy z:

- Keyboard only
- Screen reader (NVDA, VoiceOver)

---

### Krok 16: Testowanie responsywności

16.1. Testowanie na różnych rozdzielczościach:

- Mobile (320px - 480px): single column, fullscreen DayDetails
- Tablet (481px - 768px): single column
- Desktop (>768px): two-pane layout

  16.2. Testowanie interakcji:

- Touch gestures (tap, swipe)
- Pull-to-refresh (mobile)
- Hover effects (desktop only)
- Infinite scroll (mobile i desktop)

---

### Krok 17: Performance optimization

17.1. Optymalizacje:

- React.memo dla DayCard, MealCard (jeśli rendering jest wolny)
- useCallback dla handlers przekazywanych jako props
- useMemo dla obliczeń (np. date formatting)
- Lazy loading modals (React.lazy + Suspense)
- Virtualization dla długich list (opcjonalnie, react-window)

  17.2. Code splitting:

- Astro automatically splits pages
- Dynamic import dla EditMealModal (jeśli duży)

---

### Krok 18: Error boundaries

18.1. Dodanie Error Boundary na poziomie głównych kontenerów:

- DashboardContainer
- DayDetailsContainer

  18.2. Fallback UI:

- Komunikat błędu
- Przycisk "Odśwież stronę"
- Logowanie błędu do konsoli (dla developera)

---

### Krok 19: Toast Notifications

19.1. Implementacja toast system (opcjonalnie: biblioteka jak react-hot-toast):

- Toast container
- showToast(message, type)
- Typy: success, error, info, warning

  19.2. Integracja w komponentach:

- Po dodaniu posiłku: "Posiłek dodany"
- Po edycji: "Posiłek zaktualizowany"
- Po usunięciu: "Posiłek usunięty"
- Błędy: komunikaty błędów

---

### Krok 20: Testowanie integracyjne

20.1. Scenariusze end-to-end:

- US-010: Przeglądanie dashboardu
- US-011: Przeglądanie szczegółów dnia
- US-012: Edycja posiłku
- US-013: Usuwanie posiłku
- Desktop two-pane workflow
- Mobile workflow (navigation między stronami)
- Infinite scroll z wieloma batch'ami
- Pull-to-refresh
- Wszystkie scenariusze błędów

---

### Krok 21: Dokumentacja

21.1. Dodanie dokumentacji do kodu:

- JSDoc dla wszystkich funkcji i komponentów
- Przykłady użycia w komentarzach
- README dla komponentów (opcjonalnie)

  21.2. Storybook (opcjonalnie):

- Stories dla DayCard, MealCard, CalorieProgressBar
- Różne stany (loading, error, empty)

---

### Krok 22: Code review i refactoring

22.1. Przegląd kodu:

- Sprawdzenie zgodności z konwencjami projektu
- Usunięcie duplikacji
- Refactoring zbyt długich funkcji
- Sprawdzenie typów TypeScript

  22.2. Cleanup:

- Usunięcie console.log
- Usunięcie nieużywanych importów
- Formatowanie kodu (Prettier)

---

### Krok 23: Finalne testy i deploy

23.1. Pełne testy manualne wszystkich flow
23.2. Testy regresji (czy inne części aplikacji działają)
23.3. Deploy do środowiska testowego
23.4. Feedback od PM/QA
23.5. Fixes i deploy do produkcji

---

## Koniec planu implementacji

Ten plan implementacji zapewnia szczegółowy roadmap dla wdrożenia widoków Dashboard i DayDetails. Każdy krok jest zaprojektowany tak, aby być niezależnym etapem, który można zaimplementować, przetestować i zreviewować przed przejściem do kolejnego. Implementacja powinna zajść bottom-up (od prostych komponentów do złożonych) i być iteracyjna (testy po każdym kroku).
