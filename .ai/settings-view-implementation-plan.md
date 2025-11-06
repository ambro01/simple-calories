# Plan implementacji widoku Settings

## 1. Przegląd

Widok Settings składa się z dwóch głównych ekranów:

- **Settings** (`/settings`) - główny ekran ustawień z listą opcji konfiguracyjnych
- **EditCalorieGoal** (`/settings/calorie-goal`) - modal/ekran do edycji dziennego celu kalorycznego

Głównym celem widoku Settings jest umożliwienie użytkownikowi zarządzania ustawieniami aplikacji, w tym:

- Przeglądanie profilu użytkownika (email, data utworzenia konta)
- Edycja dziennego celu kalorycznego
- Ponowne uruchomienie onboardingu
- Wylogowanie z aplikacji
- Dostęp do informacji o aplikacji

Widok musi być w pełni responsywny (Mobile First), dostępny z klawiatury i wyposażony w odpowiednie etykiety ARIA.

## 2. Routing widoku

- **Settings (główny ekran)**: `/settings`
- **EditCalorieGoal (modal)**: `/settings/calorie-goal` lub obsługa przez state (modal wewnątrz `/settings`)

**Rekomendacja**: Użyć modalnego dialogu kontrolowanego przez state na stronie `/settings` zamiast osobnego routingu dla lepszego UX.

## 3. Struktura komponentów

```
Settings (Page - src/pages/settings.astro lub settings/index.astro)
├── AppLayout
│   ├── Header
│   │   └── BackButton (→ Dashboard)
│   └── Main
│       ├── PageTitle ("Ustawienia")
│       ├── SettingsSection (Konto)
│       │   └── SettingsCard (Profil)
│       ├── Separator
│       ├── SettingsSection (Dieta)
│       │   └── SettingsCard (Cel kaloryczny)
│       ├── Separator
│       ├── SettingsSection (Aplikacja)
│       │   ├── SettingsCard (Onboarding)
│       │   └── SettingsCard (Informacje)
│       ├── Separator
│       └── SettingsCard (Wyloguj - wariant destructive)
│
├── EditCalorieGoalDialog (React component)
│   └── Dialog (shadcn/ui)
│       ├── DialogContent
│       │   ├── DialogHeader
│       │   │   ├── DialogTitle
│       │   │   └── DialogDescription
│       │   ├── Form
│       │   │   ├── FormField
│       │   │   │   ├── Label
│       │   │   │   ├── Input (type="number")
│       │   │   │   └── FormMessage (validation error)
│       │   │   └── Alert (info box)
│       │   └── DialogFooter
│       │       ├── Button (Anuluj - variant="outline")
│       │       └── Button (Zapisz - type="submit")
│
└── LogoutAlertDialog (React component)
    └── AlertDialog (shadcn/ui)
        └── AlertDialogContent
            ├── AlertDialogHeader
            │   ├── AlertDialogTitle
            │   └── AlertDialogDescription
            └── AlertDialogFooter
                ├── AlertDialogCancel (Anuluj)
                └── AlertDialogAction (Wyloguj - destructive)
```

## 4. Szczegóły komponentów

### 4.1. Settings (Page Component)

**Opis**: Główna strona ustawień wyświetlająca listę opcji konfiguracyjnych w formie kart. Odpowiedzialna za pobieranie danych profilu i aktualnego celu kalorycznego oraz koordynację akcji użytkownika.

**Główne elementy**:

- `AppLayout` - layout aplikacji z headerem i nawigacją
- `PageTitle` - tytuł strony "Ustawienia"
- Lista `SettingsCard` - karty z opcjami ustawień
- `Separator` - wizualne separatory między sekcjami
- `EditCalorieGoalDialog` - modal do edycji celu
- `LogoutAlertDialog` - dialog potwierdzenia wylogowania
- `Toast` - powiadomienia o sukcesie/błędzie

**Obsługiwane interakcje**:

- Kliknięcie na kartę "Profil" → nawigacja do widoku profilu (readonly, placeholder na przyszłość)
- Kliknięcie na kartę "Cel kaloryczny" → otwarcie `EditCalorieGoalDialog`
- Kliknięcie na kartę "Onboarding" → restart onboardingu (ustawienie flagi w localStorage i nawigacja)
- Kliknięcie na kartę "Informacje" → nawigacja do strony "O aplikacji"
- Kliknięcie na kartę "Wyloguj" → otwarcie `LogoutAlertDialog`

**Obsługiwana walidacja**: Brak walidacji na poziomie tego komponentu

**Typy**:

- `ProfileResponseDTO` - dane profilu użytkownika
- `CalorieGoalResponseDTO` - dane aktualnego celu kalorycznego
- `User` (z `@supabase/supabase-js`) - dane użytkownika z Auth
- `SettingsViewModel` - model widoku (state)

**Props**: Brak (page component)

**State**:

```typescript
interface SettingsViewModel {
  profile: ProfileResponseDTO | null;
  currentGoal: CalorieGoalResponseDTO | null;
  userEmail: string | null;
  isLoading: boolean;
  error: string | null;
  showEditGoalDialog: boolean;
  showLogoutDialog: boolean;
}
```

### 4.2. SettingsCard (React Component)

**Opis**: Reużywalny komponent reprezentujący pojedynczą opcję w ustawieniach. Wyświetla tytuł, opcjonalny podtytuł, ikonę oraz chevron wskazujący możliwość kliknięcia.

**Główne elementy**:

- `Card` (shadcn/ui) - kontener karty
- `CardContent` - zawartość karty
- Icon (opcjonalnie) - ikona po lewej stronie
- `div` - kontener na tytuł i podtytuł
  - `h3` - tytuł opcji
  - `p` - podtytuł (opcjonalnie)
- `ChevronRight` (opcjonalnie) - ikona strzałki po prawej

**Obsługiwane interakcje**:

- `onClick` - kliknięcie na kartę

**Obsługiwana walidacja**: Brak

**Typy**:

```typescript
interface SettingsCardProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "destructive";
  showChevron?: boolean;
}
```

**Props**:

- `title: string` - tytuł karty (wymagane)
- `subtitle?: string` - podtytuł/opis (opcjonalnie)
- `icon?: React.ReactNode` - ikona (opcjonalnie)
- `onClick?: () => void` - handler kliknięcia (opcjonalnie)
- `variant?: 'default' | 'destructive'` - wariant stylistyczny (default: 'default')
- `showChevron?: boolean` - czy pokazywać chevron (default: true jeśli onClick jest zdefiniowane)

### 4.3. EditCalorieGoalDialog (React Component)

**Opis**: Modalny dialog do edycji dziennego celu kalorycznego. Wyświetla aktualny cel, pozwala wprowadzić nową wartość (z walidacją 1-10000), informuje o tym, że zmiana będzie efektywna od jutra. Na desktopie wyświetlany jako dialog (max-width: 500px), na mobile jako fullscreen.

**Główne elementy**:

- `Dialog` (shadcn/ui) - kontener dialogu
- `DialogContent` - zawartość dialogu
- `DialogHeader` - nagłówek z tytułem i opisem
- `Form` - formularz
  - `FormField` - pole formularza
    - `Label` - etykieta "Dzienny cel kaloryczny"
    - `Input` - pole numeryczne (type="number", min=1, max=10000)
    - `FormDescription` - opis "Aktualnie: {currentGoal} kcal"
    - `FormMessage` - komunikat walidacji
  - `Alert` - info box z zaleceniami (2000-2500 kcal)
  - `Alert` - info box "Zmiana będzie widoczna od jutra"
- `DialogFooter` - stopka z przyciskami
  - `Button` (Anuluj, variant="outline")
  - `Button` (Zapisz, type="submit")

**Obsługiwane interakcje**:

- `onChange` - zmiana wartości w polu input
- `onSubmit` - submit formularza (zapisanie nowego celu)
- `onCancel` - anulowanie i zamknięcie dialogu
- `onOpenChange` - zmiana stanu otwarcia dialogu

**Obsługiwana walidacja**:

- **Wymagane pole**: Wartość nie może być pusta
- **Zakres**: Wartość musi być liczbą całkowitą w zakresie 1-10000
- **Walidacja po stronie klienta**: Przed wysłaniem żądania do API
  - Sprawdzenie czy wartość jest liczbą: `!isNaN(parseInt(value))`
  - Sprawdzenie zakresu: `value >= 1 && value <= 10000`
  - Komunikat błędu: "Wartość musi być liczbą całkowitą w zakresie 1-10000"
- **Walidacja po stronie serwera**: Obsługa błędów z API
  - 400 Bad Request → Wyświetlenie szczegółów walidacji z `details` object
  - 409 Conflict → Informacja o istniejącym celu na jutro

**Typy**:

- `CalorieGoalResponseDTO` - aktualny cel kaloryczny
- `CreateCalorieGoalRequestDTO` - dane do utworzenia nowego celu
- `ErrorResponseDTO` - odpowiedź błędu z API
- `EditCalorieGoalViewModel` - model widoku (state)

**Props**:

```typescript
interface EditCalorieGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentGoal: CalorieGoalResponseDTO | null;
  onSuccess: () => void; // callback po udanym zapisie
}
```

**State**:

```typescript
interface EditCalorieGoalViewModel {
  goalValue: string;
  isSaving: boolean;
  validationError: string | null;
  apiError: string | null;
}
```

### 4.4. LogoutAlertDialog (React Component)

**Opis**: Dialog potwierdzenia wylogowania. Wyświetla pytanie "Czy na pewno chcesz się wylogować?" z przyciskami Anuluj i Wyloguj.

**Główne elementy**:

- `AlertDialog` (shadcn/ui) - kontener dialogu
- `AlertDialogContent` - zawartość dialogu
- `AlertDialogHeader` - nagłówek
  - `AlertDialogTitle` - tytuł "Wylogowanie"
  - `AlertDialogDescription` - opis "Czy na pewno chcesz się wylogować?"
- `AlertDialogFooter` - stopka z przyciskami
  - `AlertDialogCancel` - przycisk "Anuluj"
  - `AlertDialogAction` - przycisk "Wyloguj" (variant="destructive")

**Obsługiwane interakcje**:

- `onCancel` - anulowanie wylogowania (zamknięcie dialogu)
- `onConfirm` - potwierdzenie wylogowania (wywołanie supabase.auth.signOut())
- `onOpenChange` - zmiana stanu otwarcia dialogu

**Obsługiwana walidacja**: Brak

**Typy**: Brak specyficznych typów

**Props**:

```typescript
interface LogoutAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}
```

## 5. Typy

### 5.1. Istniejące typy (z src/types.ts)

```typescript
// Profile
export type ProfileResponseDTO = Tables<"profiles">;
// Pola: id (string), created_at (string), updated_at (string)

// Calorie Goals
export type CalorieGoalResponseDTO = Tables<"calorie_goals">;
// Pola: id (string), user_id (string), daily_goal (number),
//       effective_from (string), created_at (string), updated_at (string)

export interface CreateCalorieGoalRequestDTO {
  daily_goal: number;
}

export interface UpdateCalorieGoalRequestDTO {
  daily_goal: number;
}

// Errors
export interface ErrorResponseDTO {
  error: string;
  message: string;
  details?: ValidationErrorDetailsDTO;
}

export type ValidationErrorDetailsDTO = Record<string, string>;
```

### 5.2. Nowe typy ViewModels

```typescript
/**
 * Model widoku dla strony Settings
 * Zawiera wszystkie dane wyświetlane na stronie oraz stany UI
 */
interface SettingsViewModel {
  // Dane użytkownika
  profile: ProfileResponseDTO | null;
  currentGoal: CalorieGoalResponseDTO | null;
  userEmail: string | null; // Z Supabase Auth (auth.getUser())

  // Stany UI
  isLoading: boolean; // Ładowanie początkowe danych
  error: string | null; // Ogólny błąd strony
  showEditGoalDialog: boolean; // Widoczność dialogu edycji celu
  showLogoutDialog: boolean; // Widoczność dialogu wylogowania
}

/**
 * Props dla komponentu SettingsCard
 * Reprezentuje pojedynczą kartę opcji w ustawieniach
 */
interface SettingsCardProps {
  title: string; // Tytuł karty, np. "Cel kaloryczny"
  subtitle?: string; // Podtytuł, np. "Aktualnie: 2500 kcal"
  icon?: React.ReactNode; // Ikona po lewej stronie
  onClick?: () => void; // Handler kliknięcia
  variant?: "default" | "destructive"; // Wariant stylistyczny
  showChevron?: boolean; // Czy pokazywać strzałkę (domyślnie true jeśli onClick)
}

/**
 * Model widoku dla dialogu edycji celu kalorycznego
 * Zawiera stan formularza i walidacji
 */
interface EditCalorieGoalViewModel {
  goalValue: string; // Wartość w polu input (jako string dla kontroli)
  isSaving: boolean; // Stan zapisywania (loading)
  validationError: string | null; // Błąd walidacji po stronie klienta
  apiError: string | null; // Błąd z API
}

/**
 * Props dla komponentu EditCalorieGoalDialog
 */
interface EditCalorieGoalDialogProps {
  open: boolean; // Czy dialog jest otwarty
  onOpenChange: (open: boolean) => void; // Handler zmiany stanu otwarcia
  currentGoal: CalorieGoalResponseDTO | null; // Aktualny cel (do wyświetlenia)
  onSuccess: () => void; // Callback po udanym zapisie (do odświeżenia danych)
}

/**
 * Props dla komponentu LogoutAlertDialog
 */
interface LogoutAlertDialogProps {
  open: boolean; // Czy dialog jest otwarty
  onOpenChange: (open: boolean) => void; // Handler zmiany stanu otwarcia
  onConfirm: () => Promise<void>; // Handler potwierdzenia wylogowania
}

/**
 * Dane formularza edycji celu kalorycznego (po walidacji)
 */
interface CalorieGoalFormData {
  daily_goal: number; // Wartość celu (zwalidowana, 1-10000)
}
```

## 6. Zarządzanie stanem

### 6.1. State na poziomie strony Settings

Stan strony Settings będzie zarządzany przez custom hook `useSettings`:

```typescript
const useSettings = () => {
  const [state, setState] = useState<SettingsViewModel>({
    profile: null,
    currentGoal: null,
    userEmail: null,
    isLoading: true,
    error: null,
    showEditGoalDialog: false,
    showLogoutDialog: false,
  });

  // Fetch danych przy montowaniu komponentu
  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Równoległe pobieranie danych
      const [profileRes, goalRes, userRes] = await Promise.all([
        fetch("/api/v1/profile"),
        fetch("/api/v1/calorie-goals/current"),
        supabase.auth.getUser(),
      ]);

      const profile = profileRes.ok ? await profileRes.json() : null;
      const currentGoal = goalRes.ok ? await goalRes.json() : null;
      const userEmail = userRes.data?.user?.email || null;

      setState((prev) => ({
        ...prev,
        profile,
        currentGoal,
        userEmail,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Nie udało się pobrać danych ustawień",
        isLoading: false,
      }));
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // Redirect do /login
      window.location.href = "/login";
    } catch (error) {
      toast.error("Błąd podczas wylogowania");
    }
  };

  return {
    ...state,
    openEditGoalDialog: () => setState((prev) => ({ ...prev, showEditGoalDialog: true })),
    closeEditGoalDialog: () => setState((prev) => ({ ...prev, showEditGoalDialog: false })),
    openLogoutDialog: () => setState((prev) => ({ ...prev, showLogoutDialog: true })),
    closeLogoutDialog: () => setState((prev) => ({ ...prev, showLogoutDialog: false })),
    handleLogout,
    refetchData: fetchSettingsData,
  };
};
```

### 6.2. State w komponencie EditCalorieGoalDialog

Stan formularza będzie zarządzany przez custom hook `useCalorieGoalForm`:

```typescript
const useCalorieGoalForm = (currentGoal: CalorieGoalResponseDTO | null) => {
  const [state, setState] = useState<EditCalorieGoalViewModel>({
    goalValue: currentGoal?.daily_goal.toString() || "",
    isSaving: false,
    validationError: null,
    apiError: null,
  });

  // Aktualizacja wartości początkowej gdy currentGoal się zmieni
  useEffect(() => {
    if (currentGoal) {
      setState((prev) => ({ ...prev, goalValue: currentGoal.daily_goal.toString() }));
    }
  }, [currentGoal]);

  const validateGoalValue = (value: string): boolean => {
    if (!value || value.trim() === "") {
      setState((prev) => ({ ...prev, validationError: "Pole jest wymagane" }));
      return false;
    }

    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      setState((prev) => ({ ...prev, validationError: "Wartość musi być liczbą" }));
      return false;
    }

    if (numValue < 1 || numValue > 10000) {
      setState((prev) => ({ ...prev, validationError: "Wartość musi być w zakresie 1-10000" }));
      return false;
    }

    setState((prev) => ({ ...prev, validationError: null }));
    return true;
  };

  const handleSubmit = async (onSuccess: () => void) => {
    if (!validateGoalValue(state.goalValue)) {
      return;
    }

    setState((prev) => ({ ...prev, isSaving: true, apiError: null }));

    try {
      const response = await fetch("/api/v1/calorie-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daily_goal: parseInt(state.goalValue) }),
      });

      if (!response.ok) {
        const error: ErrorResponseDTO = await response.json();

        if (response.status === 409) {
          // Konflikt - cel na jutro już istnieje
          setState((prev) => ({
            ...prev,
            apiError: "Cel na jutro już istnieje. Operacja anulowana.",
            isSaving: false,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          apiError: error.message || "Wystąpił błąd podczas zapisywania",
          isSaving: false,
        }));
        return;
      }

      // Sukces
      toast.success("Cel kaloryczny zaktualizowany");
      onSuccess();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        apiError: "Błąd połączenia z serwerem",
        isSaving: false,
      }));
    }
  };

  return {
    ...state,
    setGoalValue: (value: string) => setState((prev) => ({ ...prev, goalValue: value })),
    handleSubmit,
  };
};
```

## 7. Integracja API

### 7.1. GET /api/v1/profile

**Endpoint**: `GET /api/v1/profile`

**Request**: Brak parametrów

**Response Type**: `ProfileResponseDTO`

```typescript
interface ProfileResponseDTO {
  id: string;
  created_at: string;
  updated_at: string;
}
```

**Użycie**: Pobieranie danych profilu użytkownika przy ładowaniu strony Settings

**Obsługa błędów**:

- 401 Unauthorized → Redirect do /login
- 404 Not Found → Wyświetlenie komunikatu o braku profilu (nie powinno się zdarzyć)
- 500 Internal Server Error → Wyświetlenie błędu, przycisk retry

### 7.2. GET /api/v1/calorie-goals/current

**Endpoint**: `GET /api/v1/calorie-goals/current`

**Request**: Query parameters (opcjonalnie)

- `date?: string` - Data w formacie YYYY-MM-DD (domyślnie dzisiaj)

**Response Type**: `CalorieGoalResponseDTO`

```typescript
interface CalorieGoalResponseDTO {
  id: string;
  user_id: string;
  daily_goal: number;
  effective_from: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
}
```

**Użycie**: Pobieranie aktualnego celu kalorycznego przy ładowaniu strony Settings i po zapisaniu nowego celu

**Obsługa błędów**:

- 404 Not Found → Wyświetlenie domyślnej wartości 2000 kcal z komunikatem "Brak ustawionego celu"
- 401 Unauthorized → Redirect do /login
- 500 Internal Server Error → Wyświetlenie błędu, przycisk retry

### 7.3. POST /api/v1/calorie-goals

**Endpoint**: `POST /api/v1/calorie-goals`

**Request Type**: `CreateCalorieGoalRequestDTO`

```typescript
interface CreateCalorieGoalRequestDTO {
  daily_goal: number; // 1-10000
}
```

**Request Example**:

```json
{
  "daily_goal": 2500
}
```

**Response Type**: `CalorieGoalResponseDTO` (201 Created)

**Użycie**: Utworzenie nowego celu kalorycznego efektywnego od jutra (CURRENT_DATE + 1)

**Obsługa błędów**:

- 400 Bad Request → Wyświetlenie błędów walidacji z `details` object
- 409 Conflict → Cel na jutro już istnieje - wyświetlenie komunikatu
- 401 Unauthorized → Redirect do /login
- 500 Internal Server Error → Wyświetlenie błędu, możliwość retry

### 7.4. supabase.auth.getUser()

**Metoda**: `supabase.auth.getUser()`

**Response Type**: `{ data: { user: User | null }, error: AuthError | null }`

```typescript
interface User {
  id: string;
  email?: string;
  // ... inne pola
}
```

**Użycie**: Pobieranie adresu email użytkownika do wyświetlenia w karcie Profil

### 7.5. supabase.auth.signOut()

**Metoda**: `supabase.auth.signOut()`

**Response Type**: `{ error: AuthError | null }`

**Użycie**: Wylogowanie użytkownika

**Po sukcesie**:

1. Czyszczenie local state
2. Redirect do /login

## 8. Interakcje użytkownika

### 8.1. Na stronie Settings

| Interakcja                        | Oczekiwany wynik                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Wejście na `/settings`            | Pobieranie danych profilu i aktualnego celu, wyświetlenie loadera, następnie wyświetlenie kart ustawień |
| Kliknięcie karty "Profil"         | Nawigacja do widoku profilu (obecnie placeholder - readonly view)                                       |
| Kliknięcie karty "Cel kaloryczny" | Otwarcie dialogu `EditCalorieGoalDialog` z aktualnym celem                                              |
| Kliknięcie karty "Onboarding"     | Ustawienie flagi w localStorage `showOnboarding=true`, nawigacja do dashboard                           |
| Kliknięcie karty "Informacje"     | Nawigacja do strony "O aplikacji" (`/about`)                                                            |
| Kliknięcie karty "Wyloguj"        | Otwarcie dialogu potwierdzenia `LogoutAlertDialog`                                                      |
| Błąd podczas ładowania danych     | Wyświetlenie komunikatu błędu i przycisku "Spróbuj ponownie"                                            |

### 8.2. W dialogu EditCalorieGoalDialog

| Interakcja                                     | Oczekiwany wynik                                                                                                                        |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Otwarcie dialogu                               | Prepopulacja pola input aktualnym celem, focus na input                                                                                 |
| Wpisanie wartości poza zakresem (np. 0, 15000) | Wyświetlenie błędu walidacji "Wartość musi być w zakresie 1-10000"                                                                      |
| Wpisanie nieprawidłowej wartości (np. tekst)   | Wyświetlenie błędu walidacji "Wartość musi być liczbą"                                                                                  |
| Pozostawienie pola pustego                     | Wyświetlenie błędu walidacji "Pole jest wymagane"                                                                                       |
| Kliknięcie "Anuluj"                            | Zamknięcie dialogu bez zapisywania zmian                                                                                                |
| Kliknięcie "Zapisz" z prawidłową wartością     | Wysłanie POST request, wyświetlenie loadera, po sukcesie: toast "Cel kaloryczny zaktualizowany", zamknięcie dialogu, odświeżenie danych |
| Błąd 409 (Conflict)                            | Wyświetlenie komunikatu "Cel na jutro już istnieje. Operacja anulowana."                                                                |
| Błąd 400 (Validation)                          | Wyświetlenie błędów walidacji z API                                                                                                     |
| Błąd sieci/500                                 | Wyświetlenie komunikatu błędu, możliwość retry                                                                                          |
| Naciśnięcie Escape                             | Zamknięcie dialogu (standardowe zachowanie Dialog)                                                                                      |

### 8.3. W dialogu LogoutAlertDialog

| Interakcja           | Oczekiwany wynik                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------- |
| Otwarcie dialogu     | Wyświetlenie pytania "Czy na pewno chcesz się wylogować?", focus na przycisku "Anuluj"       |
| Kliknięcie "Anuluj"  | Zamknięcie dialogu, pozostanie na stronie Settings                                           |
| Kliknięcie "Wyloguj" | Wywołanie `supabase.auth.signOut()`, wyświetlenie loadera, po sukcesie: redirect do `/login` |
| Błąd wylogowania     | Wyświetlenie toast "Błąd podczas wylogowania", możliwość retry                               |
| Naciśnięcie Escape   | Zamknięcie dialogu (standardowe zachowanie AlertDialog)                                      |

## 9. Warunki i walidacja

### 9.1. Walidacja w EditCalorieGoalDialog

**Warunek 1: Pole wymagane**

- **Komponent**: `EditCalorieGoalDialog` - pole input
- **Warunek**: Wartość nie może być pusta
- **Walidacja**: `if (!value || value.trim() === '') { error }`
- **Wpływ na UI**: Wyświetlenie komunikatu "Pole jest wymagane" pod inputem, zablokowanie przycisku "Zapisz"

**Warunek 2: Wartość musi być liczbą**

- **Komponent**: `EditCalorieGoalDialog` - pole input
- **Warunek**: Wartość musi być liczbą całkowitą
- **Walidacja**: `if (isNaN(parseInt(value))) { error }`
- **Wpływ na UI**: Wyświetlenie komunikatu "Wartość musi być liczbą" pod inputem, zablokowanie przycisku "Zapisz"

**Warunek 3: Zakres 1-10000**

- **Komponent**: `EditCalorieGoalDialog` - pole input
- **Warunek**: Wartość musi być w zakresie 1-10000
- **Walidacja**: `if (value < 1 || value > 10000) { error }`
- **Wpływ na UI**: Wyświetlenie komunikatu "Wartość musi być w zakresie 1-10000" pod inputem, zablokowanie przycisku "Zapisz"
- **Dodatkowa walidacja HTML**: `<input type="number" min={1} max={10000} />`

**Warunek 4: Unikalność celu na dany dzień (z API)**

- **Komponent**: `EditCalorieGoalDialog` - obsługa response z API
- **Warunek**: Na dany dzień (jutro) nie może istnieć już cel
- **Walidacja**: Obsługa błędu 409 Conflict z API
- **Wpływ na UI**: Wyświetlenie komunikatu "Cel na jutro już istnieje. Operacja anulowana." jako apiError

### 9.2. Walidacja autentykacji

**Warunek: Użytkownik musi być zalogowany**

- **Komponent**: `Settings` (page)
- **Warunek**: Obecność sesji użytkownika
- **Walidacja**: Sprawdzenie `supabase.auth.getUser()` przy ładowaniu
- **Wpływ na UI**: Jeśli brak sesji → redirect do `/login`

### 9.3. Warunki wyświetlania danych

**Warunek: Brak ustawionego celu kalorycznego**

- **Komponent**: `SettingsCard` (Cel kaloryczny)
- **Warunek**: API zwraca 404 dla `/api/v1/calorie-goals/current`
- **Wpływ na UI**: Wyświetlenie "Nie ustawiono (domyślnie: 2000 kcal)" jako subtitle

**Warunek: Brak danych profilu**

- **Komponent**: `SettingsCard` (Profil)
- **Warunek**: `profile === null` lub `userEmail === null`
- **Wpływ na UI**: Wyświetlenie "Ładowanie..." lub "Brak danych"

## 10. Obsługa błędów

### 10.1. Błędy na stronie Settings

**Błąd: Brak autoryzacji (401)**

- **Scenariusz**: Token wygasł lub użytkownik nie jest zalogowany
- **Obsługa**: Redirect do `/login`
- **UI**: Brak komunikatu (natychmiastowy redirect)

**Błąd: Błąd serwera (500)**

- **Scenariusz**: Błąd podczas pobierania profilu lub aktualnego celu
- **Obsługa**: Wyświetlenie komunikatu błędu i przycisku retry
- **UI**: Alert z komunikatem "Nie udało się pobrać danych ustawień" + Button "Spróbuj ponownie"

**Błąd: Brak profilu (404)**

- **Scenariusz**: Profil nie został znaleziony (nie powinno się zdarzyć)
- **Obsługa**: Logowanie błędu, wyświetlenie komunikatu
- **UI**: Alert "Profil nie został znaleziony. Skontaktuj się z administratorem."

**Błąd: Brak celu kalorycznego (404)**

- **Scenariusz**: Użytkownik nie ustawił jeszcze celu
- **Obsługa**: Wyświetlenie domyślnej wartości 2000 kcal
- **UI**: Subtitle w karcie "Nie ustawiono (domyślnie: 2000 kcal)"

**Błąd: Błąd sieci**

- **Scenariusz**: Brak połączenia z internetem
- **Obsługa**: Wyświetlenie komunikatu o błędzie sieci
- **UI**: Toast "Sprawdź połączenie z internetem"

### 10.2. Błędy w EditCalorieGoalDialog

**Błąd: Walidacja po stronie klienta**

- **Scenariusz**: Wartość poza zakresem, puste pole, nie liczba
- **Obsługa**: Zablokowanie przycisku submit, wyświetlenie komunikatu
- **UI**: FormMessage pod inputem z odpowiednim komunikatem

**Błąd: Konflikt (409)**

- **Scenariusz**: Cel na jutro już istnieje
- **Obsługa**: Wyświetlenie komunikatu, możliwość zamknięcia dialogu
- **UI**: Alert w dialogu "Cel na jutro już istnieje. Operacja anulowana."

**Błąd: Walidacja po stronie serwera (400)**

- **Scenariusz**: API zwraca błędy walidacji (details object)
- **Obsługa**: Wyświetlenie szczegółowych komunikatów z API
- **UI**: FormMessage z komunikatem z `details.daily_goal`

**Błąd: Błąd serwera (500)**

- **Scenariusz**: Nieoczekiwany błąd podczas zapisywania
- **Obsługa**: Wyświetlenie komunikatu, możliwość retry
- **UI**: Alert "Wystąpił błąd podczas zapisywania. Spróbuj ponownie."

**Błąd: Błąd sieci**

- **Scenariusz**: Brak połączenia podczas POST request
- **Obsługa**: Wyświetlenie komunikatu o błędzie sieci
- **UI**: Alert "Błąd połączenia z serwerem. Sprawdź internet."

### 10.3. Błędy podczas wylogowania

**Błąd: Błąd wylogowania**

- **Scenariusz**: `supabase.auth.signOut()` zwraca błąd
- **Obsługa**: Wyświetlenie toast z błędem, pozostawienie użytkownika w aplikacji
- **UI**: Toast "Błąd podczas wylogowania. Spróbuj ponownie."

**Fallback**: Nawet w przypadku błędu wylogowania, wyczyść local state i zrób redirect (fail-safe)

## 11. Kroki implementacji

### Krok 1: Przygotowanie środowiska

1. Zainstaluj wymagane komponenty z shadcn/ui:
   ```bash
   npx shadcn-ui@latest add card
   npx shadcn-ui@latest add dialog
   npx shadcn-ui@latest add alert-dialog
   npx shadcn-ui@latest add button
   npx shadcn-ui@latest add input
   npx shadcn-ui@latest add label
   npx shadcn-ui@latest add alert
   npx shadcn-ui@latest add separator
   npx shadcn-ui@latest add form
   ```
2. Zainstaluj ikony (jeśli jeszcze nie):
   ```bash
   npm install lucide-react
   ```

### Krok 2: Utworzenie typów ViewModels

1. Utwórz plik `src/types/settings.types.ts`
2. Dodaj interfejsy:
   - `SettingsViewModel`
   - `SettingsCardProps`
   - `EditCalorieGoalViewModel`
   - `EditCalorieGoalDialogProps`
   - `LogoutAlertDialogProps`
   - `CalorieGoalFormData`

### Krok 3: Implementacja komponentu SettingsCard

1. Utwórz plik `src/components/settings/SettingsCard.tsx`
2. Zaimplementuj komponent zgodnie ze specyfikacją z sekcji 4.2
3. Dodaj style dla wariantu `destructive` (czerwony kolor dla Wyloguj)
4. Dodaj testy (opcjonalnie)

### Krok 4: Implementacja custom hooka useSettings

1. Utwórz plik `src/hooks/useSettings.ts`
2. Zaimplementuj logikę pobierania danych (profile, current goal, user email)
3. Dodaj funkcje do zarządzania stanem dialogów
4. Dodaj funkcję wylogowania
5. Dodaj obsługę błędów

### Krok 5: Implementacja custom hooka useCalorieGoalForm

1. Utwórz plik `src/hooks/useCalorieGoalForm.ts`
2. Zaimplementuj walidację po stronie klienta
3. Dodaj logikę submit (POST request)
4. Dodaj obsługę błędów z API (400, 409, 500)

### Krok 6: Implementacja komponentu EditCalorieGoalDialog

1. Utwórz plik `src/components/settings/EditCalorieGoalDialog.tsx`
2. Zaimplementuj formularz z polem input (type="number")
3. Dodaj walidację z wykorzystaniem `useCalorieGoalForm`
4. Dodaj Alert z informacją o zakresie 2000-2500 kcal
5. Dodaj Alert z informacją "Zmiana będzie widoczna od jutra"
6. Dodaj obsługę błędów (wyświetlanie komunikatów)
7. Dodaj przycisk Anuluj i Zapisz
8. Dodaj responsywność (fullscreen na mobile, max-width 500px na desktop)

### Krok 7: Implementacja komponentu LogoutAlertDialog

1. Utwórz plik `src/components/settings/LogoutAlertDialog.tsx`
2. Zaimplementuj AlertDialog z pytaniem o wylogowanie
3. Dodaj przyciski Anuluj i Wyloguj (destructive)
4. Podłącz handler wylogowania

### Krok 8: Implementacja strony Settings

1. Utwórz plik `src/pages/settings.astro` lub `src/pages/settings/index.astro`
2. Utwórz komponent React `SettingsPage.tsx` w `src/components/settings/`
3. Wykorzystaj hook `useSettings` do zarządzania stanem
4. Zaimplementuj layout z AppLayout
5. Dodaj listę SettingsCard:
   - Profil (z email i datą utworzenia)
   - Separator
   - Cel kaloryczny (z aktualnym celem)
   - Separator
   - Onboarding
   - Informacje
   - Separator
   - Wyloguj (wariant destructive)
6. Dodaj komponenty `EditCalorieGoalDialog` i `LogoutAlertDialog`
7. Podłącz handlery kliknięć dla każdej karty

### Krok 9: Obsługa stanów ładowania i błędów

1. Dodaj loader/skeleton podczas początkowego ładowania danych
2. Dodaj wyświetlanie komunikatów błędów
3. Dodaj przycisk "Spróbuj ponownie" w przypadku błędów

### Krok 10: Dodanie nawigacji do Settings

1. Zaktualizuj nawigację/menu aplikacji, aby zawierało link do `/settings`
2. Dodaj ikonę ustawień (Settings icon z lucide-react)

### Krok 11: Implementacja toastów

1. Skonfiguruj toast provider (jeśli jeszcze nie istnieje)
2. Dodaj toast po udanym zapisie celu: "Cel kaloryczny zaktualizowany"
3. Dodaj toast po błędzie wylogowania: "Błąd podczas wylogowania"

### Krok 12: Accessibility i Keyboard Navigation

1. Dodaj ARIA labels do wszystkich kart (`aria-label`)
2. Sprawdź fokus w dialogach (focus trap)
3. Sprawdź nawigację Tab/Shift+Tab
4. Dodaj `aria-describedby` dla pól z walidacją
5. Sprawdź czytniki ekranu (NVDA/VoiceOver)

### Krok 13: Responsywność

1. Przetestuj layout na różnych rozmiarach ekranów (mobile, tablet, desktop)
2. Sprawdź czy dialog EditCalorieGoal jest fullscreen na mobile
3. Sprawdź czy karty są czytelne i łatwe do kliknięcia na mobile (min 44x44px)

### Krok 14: Testowanie

1. Testy jednostkowe dla hooków (`useSettings`, `useCalorieGoalForm`)
2. Testy komponentów (SettingsCard, EditCalorieGoalDialog, LogoutAlertDialog)
3. Testy integracyjne (flow: otwarcie Settings → edycja celu → zapis → weryfikacja)
4. Testy E2E (Playwright/Cypress):
   - Otwarcie Settings
   - Edycja celu kalorycznego
   - Wylogowanie
   - Obsługa błędów

### Krok 15: Finalizacja

1. Code review
2. Poprawki po code review
3. Aktualizacja dokumentacji (jeśli istnieje)
4. Merge do głównej gałęzi
5. Deploy i weryfikacja na produkcji
