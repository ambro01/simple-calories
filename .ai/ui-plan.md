# Architektura UI dla Simple Calories MVP

## 1. Przegląd struktury UI

Simple Calories to aplikacja webowa zaprojektowana z równym priorytetem dla urządzeń mobilnych i desktopowych. Architektura UI opiera się na trzech głównych filarach:

### Filozofia projektowa

- **Mobile-first approach** z adaptacją do desktop
- **AI-first interface** - domyślnie tryb AI przy dodawaniu posiłków
- **Minimalistyczny design** - prostota i szybkość działania
- **Wizualny feedback** - progress bars, kolorowe statusy, animacje

### Struktura nawigacji

- **Mobile (<1024px)**: Bottom Navigation Bar (3 główne akcje)
- **Desktop (≥1024px)**: Left Sidebar z możliwością zwinięcia
- **Prominent action**: FAB "Dodaj posiłek" zawsze dostępny

### Przepływ danych

```
User Action → Component → API Call → State Update → UI Re-render
```

### Główne obszary funkcjonalne

1. **Authentication Flow** - rejestracja, logowanie, reset hasła
2. **Main App Flow** - dashboard, szczegóły dnia, zarządzanie posiłkami
3. **Settings Flow** - profil, cel kaloryczny, onboarding
4. **Onboarding Flow** - wprowadzenie dla nowych użytkowników

---

## 2. Lista widoków

### 2.1. Widoki Autentykacji (Unauthenticated)

#### Login

- **Ścieżka**: `/login`
- **Główny cel**: Umożliwienie zalogowania się użytkownikowi do aplikacji
- **Kluczowe informacje**:
  - Formularz logowania (email, hasło)
  - Link do rejestracji
  - Link do resetu hasła
  - Komunikaty błędów walidacji
- **Kluczowe komponenty**:
  - `LoginForm` - główny formularz
  - `Input` - pola email i hasło
  - `Button` - przycisk "Zaloguj"
  - `Link` - linki do Register i ForgotPassword
  - `Toast` - powiadomienia o błędach
- **API endpoints**:
  - `supabase.auth.signInWithPassword({ email, password })`
- **UX względy**:
  - Auto-focus na polu email
  - Walidacja w czasie rzeczywistym
  - Pokazywanie/ukrywanie hasła (toggle)
  - Clear error messages
  - Loading state na przycisku podczas logowania
- **Accessibility**:
  - Labels dla wszystkich inputów
  - Focus management (kolejność tab)
  - Error announcements dla screen readers
  - ARIA labels dla ikon
- **Security**:
  - Walidacja formatu email
  - Rate limiting (Supabase)
  - HTTPS only
  - Secure password handling

#### Register

- **Ścieżka**: `/register`
- **Główny cel**: Rejestracja nowego użytkownika
- **Kluczowe informacje**:
  - Formularz rejestracji (email, hasło, powtórz hasło)
  - Link do logowania
  - Wskaźnik siły hasła
  - Komunikaty walidacji
- **Kluczowe komponenty**:
  - `RegisterForm`
  - `Input` (email, password, confirmPassword)
  - `PasswordStrengthIndicator`
  - `Button`
  - `Link`
  - `Toast`
- **API endpoints**:
  - `supabase.auth.signUp({ email, password })`
- **UX względy**:
  - Walidacja zgodności haseł w czasie rzeczywistym
  - Wizualizacja siły hasła (weak/medium/strong)
  - Po rejestracji automatyczne logowanie
  - Redirect do onboardingu po udanej rejestracji
- **Accessibility**:
  - Labels i ARIA descriptions
  - Error messages powiązane z polami
  - Focus trap w formularzu
- **Security**:
  - Walidacja min. 6 znaków (Supabase requirement)
  - Sprawdzanie zgodności haseł
  - Zabezpieczenie przed bot'ami (opcjonalnie captcha)

#### ForgotPassword

- **Ścieżka**: `/forgot-password`
- **Główny cel**: Inicjowanie procesu resetu hasła
- **Kluczowe informacje**:
  - Formularz z polem email
  - Informacja o wysłaniu linku resetującego
  - Link powrotu do logowania
- **Kluczowe komponenty**:
  - `ForgotPasswordForm`
  - `Input` (email)
  - `Button`
  - `Alert` (success message)
  - `Link`
- **API endpoints**:
  - `supabase.auth.resetPasswordForEmail(email)`
- **UX względy**:
  - Potwierdzenie wysłania emaila (nawet jeśli email nie istnieje - security)
  - Clear instructions
  - Link do sprawdzenia spam folderu
- **Accessibility**:
  - Focus management
  - Success announcement
- **Security**:
  - Rate limiting
  - Nie ujawniaj czy email istnieje w systemie

#### ResetPassword

- **Ścieżka**: `/reset-password` (z tokenem w URL)
- **Główny cel**: Ustawienie nowego hasła po resecie
- **Kluczowe informacje**:
  - Formularz (nowe hasło, powtórz hasło)
  - Wskaźnik siły hasła
  - Komunikat o sukcesie
- **Kluczowe komponenty**:
  - `ResetPasswordForm`
  - `Input` (password, confirmPassword)
  - `PasswordStrengthIndicator`
  - `Button`
  - `Toast`
- **API endpoints**:
  - `supabase.auth.updateUser({ password })`
- **UX względy**:
  - Walidacja zgodności haseł
  - Po sukcesie redirect do login z komunikatem
  - Obsługa wygasłego tokenu
- **Accessibility**:
  - Labels, focus management
- **Security**:
  - Weryfikacja tokenu (Supabase)
  - Silne hasło requirement
  - Token jednorazowy

---

### 2.2. Widoki Główne (Authenticated)

#### Dashboard

- **Ścieżka**: `/` (default authenticated view)
- **Główny cel**: Przegląd postępów użytkownika - lista dni z podsumowaniem kalorycznym
- **Kluczowe informacje**:
  - Lista dni (od najnowszego do najstarszego)
  - Dla każdego dnia: data, suma kalorii / cel, procent realizacji, liczba posiłków
  - Progress bar z kolorowaniem statusu (gray/green/orange)
  - Desktop: two-pane layout (lista + szczegóły wybranego dnia)
  - Mobile: single column list
- **Kluczowe komponenty**:
  - `AppLayout` (z navigation)
  - `DayCard` (dla każdego dnia)
  - `CalorieProgress` (progress bar)
  - `FAB` (floating action button "Dodaj posiłek")
  - `InfiniteScroll` (lazy loading)
  - `SkeletonLoader` (loading state)
  - `EmptyState` (brak danych)
  - Desktop: `DayDetails` (right pane)
- **API endpoints**:
  - `GET /api/v1/daily-progress?limit=30&offset=0`
  - Infinite scroll: kolejne batche po 30 dni
- **UX względy**:
  - Infinite scroll z trigger na ostatnim elemencie
  - Skeleton loaders (3 karty) podczas ładowania
  - Empty state dla nowych użytkowników: "Zacznij swoją przygodę! Dodaj pierwszy posiłek" z CTA
  - Desktop: auto-select dzisiejszego dnia, szczegóły po prawej
  - Mobile: click na DayCard → navigate do DayDetails
  - Pull-to-refresh na mobile
  - Smooth animations: DayCard hover effect (shadow-lg, scale)
- **Accessibility**:
  - Semantic HTML (`<main>`, `<nav>`)
  - Keyboard navigation w liście
  - ARIA labels dla progress bars
  - Skip to main content link
- **Security**:
  - Dane tylko dla zalogowanego użytkownika (JWT)
  - RLS na poziomie bazy danych

#### DayDetails

- **Ścieżka**: `/day/:date` (format: YYYY-MM-DD)
- **Główny cel**: Szczegółowy widok pojedynczego dnia z listą wszystkich posiłków
- **Kluczowe informacje**:
  - Sticky header:
    - Data (format: "Poniedziałek, 30 października 2025")
    - Progress bar kaloryczny
    - Suma kalorii / cel + procent
    - Podsumowanie makroskładników (Białko, Tłuszcze, Węglowodany, Błonnik)
    - Liczba posiłków
    - Przycisk "+" (dodaj posiłek)
  - Lista posiłków (chronologicznie, od najstarszego):
    - MealCard dla każdego posiłku
- **Kluczowe komponenty**:
  - `AppLayout`
  - `DayHeader` (sticky)
  - `CalorieProgress`
  - `MacroDisplay` (grid layout)
  - `MealCard` (lista)
  - `EmptyState` (brak posiłków)
  - `DeleteConfirmation` (inline)
- **API endpoints**:
  - `GET /api/v1/daily-progress/:date`
  - `GET /api/v1/meals?date=YYYY-MM-DD&sort=asc`
  - `DELETE /api/v1/meals/:id` (delete action)
- **UX względy**:
  - Sticky header podczas scrollowania
  - Empty state: "Brak posiłków w tym dniu. Dodaj swój pierwszy!" z CTA
  - Click na MealCard → otwiera EditMeal modal
  - Edit icon → otwiera EditMeal
  - Delete icon → inline confirmation (expand karty)
  - Delete confirmation: auto-collapse po 5s bez akcji
  - Fade-out animation po usunięciu
  - Mobile: back button w headerze (←)
  - Desktop: widok w right pane (bez back button)
- **Accessibility**:
  - Focus management przy delete
  - ARIA live region dla zmian
  - Keyboard shortcuts (opcjonalnie: Delete key)
- **Security**:
  - Weryfikacja ownership posiłków (RLS)

#### AddMeal

- **Ścieżka**: `/add-meal` (modal/overlay)
- **Główny cel**: Dodanie nowego posiłku (AI lub manual)
- **Kluczowe informacje**:
  - Toggle AI/Manual (segmented control)
  - **Tryb AI**:
    - Textarea (opis posiłku, max 500 znaków)
    - Przykłady (clickable chips)
    - Przycisk "Oblicz kalorie"
    - Loading: multi-stage feedback
    - Wynik AI: kalorie (duża liczba) + makro (grid) + assumptions
    - Akcje: [Dodaj] [Generuj ponownie] [Edytuj ręcznie]
  - **Tryb Manual**:
    - Opis (textarea, required)
    - Kalorie (number input, required, 1-10000)
    - Makroskładniki (opcjonalne): Białko, Tłuszcze, Węglowodany, Błonnik
    - Warning jeśli makro ≠ kalorie (>5% różnicy)
  - **Wspólne (opcjonalne)**:
    - Kategoria (visual button group: Śniadanie, Lunch, Kolacja, Przekąska)
    - Data (date picker, default: dzisiaj)
    - Czas (time picker, default: teraz)
  - Przyciski: [Anuluj] [Dodaj posiłek]
- **Kluczowe komponenty**:
  - `Modal` (fullscreen mobile, dialog desktop)
  - `MealForm`
  - `SegmentedControl` (AI/Manual toggle)
  - `Textarea` (opis)
  - `Input` (kalorie, makro)
  - `CategorySelector` (visual buttons)
  - `DatePicker`, `TimePicker`
  - `Spinner` (AI loading)
  - `Alert` (makro warning)
  - `Button`
- **API endpoints**:
  - AI: `POST /api/v1/ai-generations` (prompt)
  - Save: `POST /api/v1/meals`
- **UX względy**:
  - Domyślnie tryb AI active
  - AI → Manual: prepopuluj wartości z AI
  - Manual → AI: wyczyść formularz, zachowaj opis
  - Multi-stage loading (0-1s "Analizuję opis...", 1-3s "Szacuję kalorie...", 3-5s "Obliczam makroskładniki...")
  - Progress dots: ● ○ ○ → ○ ● ○ → ○ ○ ●
  - Przykłady: "Kanapka z szynką", "Kurczak z ryżem", "Jogurt z owocami"
  - Character counter (0/500)
  - Auto-detect kategorii na podstawie czasu
  - Warning makro: żółty alert box, przycisk "Przelicz automatycznie"
  - Walidacja: data nie w przyszłości, warning jeśli >7 dni wstecz
  - Po zapisie: modal closes, toast "Posiłek dodany", lista odświeża się
- **Accessibility**:
  - Focus trap w modalu
  - Return focus po zamknięciu
  - Labels dla wszystkich inputów
  - Error announcements
- **Security**:
  - Rate limiting AI (10 req/min)
  - Walidacja zakresu kalorii (1-10000)
  - Timestamp validation

#### EditMeal

- **Ścieżka**: `/edit-meal/:id` (modal/overlay)
- **Główny cel**: Edycja istniejącego posiłku
- **Kluczowe informacje**:
  - To samo co AddMeal, ale:
    - Pola prepopulowane danymi istniejącego posiłku
    - Tytuł: "Edytuj posiłek"
    - Przycisk: "Zapisz zmiany"
    - Możliwość regeneracji AI (nowy opis → nowe wartości)
    - input_method zmienia się na 'ai-edited' jeśli modyfikowane
- **Kluczowe komponenty**:
  - Reuse `MealForm` z AddMeal
  - Dodatkowo: loading state podczas fetch danych
- **API endpoints**:
  - Fetch: `GET /api/v1/meals/:id`
  - Update: `PATCH /api/v1/meals/:id`
  - Regenerate AI: `POST /api/v1/ai-generations`
- **UX względy**:
  - Loading skeleton podczas fetch
  - Pokazanie oryginalnych wartości
  - Możliwość przełączenia AI/Manual
  - Jeśli AI-generated i user edytuje wartości → input_method: 'ai-edited'
  - Po zapisie: modal closes, toast "Zmiany zapisane", lista odświeża
- **Accessibility**:
  - Focus management
  - Loading announcement
- **Security**:
  - Weryfikacja ownership (RLS)
  - Walidacja jak w AddMeal

#### Settings

- **Ścieżka**: `/settings`
- **Główny cel**: Zarządzanie ustawieniami użytkownika
- **Kluczowe informacje**:
  - Lista kart (separatory między sekcjami):
    1. **Profil** - avatar, imię (jeśli dostępne), email (readonly)
    2. **Cel kaloryczny** - aktualny cel (np. "Aktualnie: 2500 kcal")
    3. **Onboarding** - "Pokaż ponownie"
    4. **Informacje** - wersja aplikacji, "O aplikacji"
    5. **Wyloguj** (red color, na dole)
- **Kluczowe komponenty**:
  - `AppLayout`
  - `SettingsCard` (dla każdej opcji)
  - `Avatar`
  - `Button`
  - `AlertDialog` (confirmation wylogowania)
- **API endpoints**:
  - `GET /api/v1/profile`
  - `GET /api/v1/calorie-goals/current`
  - `supabase.auth.signOut()` (logout)
- **UX względy**:
  - Każda karta clickable z chevron right (→)
  - Profil i email readonly (z Supabase Auth)
  - Click "Cel kaloryczny" → navigate to EditCalorieGoal
  - Click "Onboarding" → pokazuje onboarding ponownie
  - Click "Wyloguj" → AlertDialog "Czy na pewno chcesz się wylogować?" [Anuluj] [Wyloguj]
  - Po wylogowaniu: clear local state, redirect to /login
- **Accessibility**:
  - Keyboard navigation
  - ARIA labels dla kart
  - Focus management w AlertDialog
- **Security**:
  - Confirmation dla destructive actions (wylogowanie)

#### EditCalorieGoal

- **Ścieżka**: `/settings/calorie-goal` (modal/screen)
- **Główny cel**: Edycja dziennego celu kalorycznego
- **Kluczowe informacje**:
  - Input dla nowej wartości (1-10000 kcal)
  - Aktualny cel: "Aktualnie: 2500 kcal"
  - Info box: "Zalecane dzienne spożycie dla przeciętnej osoby to 2000-2500 kcal. Dostosuj cel do swoich potrzeb."
  - Przyciski: [Anuluj] [Zapisz]
- **Kluczowe komponenty**:
  - `Modal` (fullscreen mobile, dialog desktop max-width 500px)
  - `Form`
  - `Input` (number)
  - `Alert` (info)
  - `Button`
- **API endpoints**:
  - Fetch current: `GET /api/v1/calorie-goals/current`
  - Create new: `POST /api/v1/calorie-goals` (effective_from: tomorrow)
- **UX względy**:
  - Prepopuluj input z aktualnym celem
  - Walidacja zakresu 1-10000
  - Info o tym, że zmiana będzie efektywna od jutra
  - Po zapisie: modal closes, toast "Cel kaloryczny zaktualizowany", redirect do Settings
  - Dashboard odświeża się z nowym celem
- **Accessibility**:
  - Label dla input
  - Validation messages
  - Focus management
- **Security**:
  - Walidacja zakresu (1-10000)
  - JWT authentication

---

### 2.3. Widoki Specjalne

#### Onboarding

- **Ścieżka**: `/onboarding`
- **Główny cel**: Wprowadzenie nowych użytkowników do aplikacji
- **Kluczowe informacje**:
  - 3 kroki (fullscreen slides):
    1. **Powitanie + AI concept**:
       - Ilustracja: ✨ (duże emoji)
       - Tytuł: "Witaj w Simple Calories! 🎉"
       - Tekst: "Śledź swoje kalorie z pomocą AI. Wystarczy opisać posiłek, a my obliczymy kalorie za Ciebie!"
    2. **Jak dodawać posiłki**:
       - Ilustracja: ➕
       - Tytuł: "Dodawanie posiłków"
       - Bullets: "Tryb AI - opisz posiłek", "Tryb Manual - wprowadź dane", "Makroskładniki opcjonalnie"
    3. **Dashboard i cel**:
       - Ilustracja: 📊
       - Tytuł: "Twój Dashboard"
       - Tekst: "Pasek postępu pokazuje realizację celu. Kolory: zielony = cel osiągnięty, pomarańczowy = przekroczony, szary = poniżej."
  - Top bar: "Krok X/3" + przycisk "Pomiń"
  - Dots indicator: ● ○ ○ (aktywny/nieaktywny)
  - Nawigacja: [← Wstecz] [Dalej →] lub [Rozpocznij!] (ostatni krok)
- **Kluczowe komponenty**:
  - `OnboardingSlide` (dla każdego kroku)
  - `DotsIndicator`
  - `Button`
- **API endpoints**:
  - Brak (localStorage only)
- **UX względy**:
  - Fullscreen overlay
  - Swipe gestures na mobile (left/right)
  - Możliwość skip (zawsze widoczny przycisk)
  - Po zakończeniu: zapisz flagę `onboarding_completed` w localStorage
  - Redirect na dashboard
  - Ilustracje: duże emoji (text-8xl) lub simple SVG
  - Smooth transitions między slajdami (fade + slide)
- **Accessibility**:
  - Keyboard navigation (arrows, enter)
  - Skip option zawsze dostępny
  - Focus management
- **Security**:
  - N/A (tylko prezentacja)

---

## 3. Mapa podróży użytkownika

### 3.1. Nowy użytkownik - First Run

```
1. Landing/Marketing page (out of scope)
   ↓
2. Register (/register)
   - Wypełnia email, hasło, potwierdza hasło
   - Walidacja siły hasła
   - Click "Zarejestruj"
   ↓
3. Automatyczne logowanie
   ↓
4. Onboarding (/onboarding)
   - Przechodzi 3 kroki
   - Dowiaduje się o AI, dodawaniu posiłków, dashboardzie
   - Click "Rozpocznij!"
   ↓
5. Dashboard (/) - EMPTY STATE
   - Widzi: "Zacznij swoją przygodę! Dodaj pierwszy posiłek"
   - Click FAB "+Dodaj posiłek"
   ↓
6. AddMeal (/add-meal) - PIERWSZY POSIŁEK
   - Tryb AI active (default)
   - Opisuje posiłek: "jajecznica na maśle i 2 kromki chleba"
   - Click "Oblicz kalorie"
   - Loading (multi-stage)
   - Wynik: 420 kcal, makro, assumptions
   - Click "Dodaj"
   - Opcjonalnie: wybiera kategorię "Śniadanie", akceptuje domyślną datę/czas
   - Click "Dodaj posiłek"
   ↓
7. Dashboard (/) - UPDATED
   - Widzi DayCard dla dzisiejszego dnia
   - 420 / 2000 kcal (domyślny cel), 21%, progress bar szary (under)
   - 1 posiłek
```

### 3.2. Istniejący użytkownik - Codzienne użytkowanie

```
1. Login (/login)
   - Wprowadza email i hasło
   - Click "Zaloguj"
   ↓
2. Dashboard (/)
   - Widzi listę dni (dzisiaj + historia)
   - Desktop: dzisiaj auto-selected, szczegóły po prawej
   - Mobile: lista dni
   ↓
3a. Click na dzisiejszy dzień (mobile) → DayDetails (/day/2025-10-30)
    - Widzi szczegóły dnia: header z podsumowaniem + lista posiłków
    - Click FAB "+" → AddMeal
    ↓
3b. Click FAB "+" bezpośrednio z Dashboard → AddMeal
    ↓
4. AddMeal (/add-meal)
   - Dodaje kolejny posiłek (AI lub manual)
   - Zapisuje
   ↓
5. Powrót do Dashboard / DayDetails
   - Lista odświeżona z nowym posiłkiem
   - Progress bar zaktualizowany
   - Toast: "Posiłek dodany"
```

### 3.3. Flow: Dodawanie posiłku (AI) - szczegółowy

```
1. User w Dashboard / DayDetails
   ↓
2. Click FAB "+" lub button "Dodaj posiłek"
   ↓
3. AddMeal modal opens
   - Tryb AI active (default)
   - Focus na textarea
   ↓
4. User wpisuje opis
   - "kurczak pieczony z ryżem i warzywami, około 300g"
   - Character counter: 47/500
   ↓
5. Click "Oblicz kalorie"
   ↓
6. Loading state (2-5s)
   - Disable textarea i przycisk
   - Multi-stage feedback:
     - ● ○ ○ "Analizuję opis..." (0-1s)
     - ○ ● ○ "Szacuję kalorie..." (1-3s)
     - ○ ○ ● "Obliczam makroskładniki..." (3-5s)
   ↓
7. Wynik AI displayed
   - Duża liczba: 650 kcal
   - Grid makro: B: 45g | T: 15g | W: 70g | Bł: 8g
   - Assumptions: "Założono: 300g piersi z kurczaka, 150g ryżu ugotowanego, 100g warzyw mieszanych"
   - 3 przyciski:
     - [Dodaj] (primary, green)
     - [Generuj ponownie] (secondary)
     - [Edytuj ręcznie] (link/text)
   ↓
8a. User click "Dodaj"
    → Pokazują się opcjonalne pola:
       - Kategoria (auto-detect: Lunch jeśli ~13:00)
       - Data: dzisiaj
       - Czas: teraz
    → User opcjonalnie zmienia lub zostawia
    → Click "Dodaj posiłek"
    → POST /api/v1/meals (input_method: 'ai')
    → Modal closes
    → Toast: "Posiłek dodany"
    → Dashboard/DayDetails refreshes
    ↓
8b. User click "Generuj ponownie"
    → Nowe API call (POST /api/v1/ai-generations) z tym samym promptem
    → Loading → nowy wynik
    ↓
8c. User click "Edytuj ręcznie"
    → Przełączenie na tryb Manual
    → Pola prepopulowane z wartościami AI
    → User może edytować
    → Zapisuje → input_method: 'ai-edited'
```

### 3.4. Flow: Dodawanie posiłku (Manual) - szczegółowy

```
1. AddMeal modal opens (lub user przełącza z AI na Manual)
   ↓
2. Tryb Manual active
   - Pola widoczne:
     - Opis (textarea, required)
     - Kalorie (number, required, 1-10000)
     - Białko, Tłuszcze, Węglowodany, Błonnik (opcjonalne)
     - Kategoria (opcjonalnie)
     - Data, Czas (defaulty: dzisiaj, teraz)
   ↓
3. User wypełnia:
   - Opis: "Pizza margherita z restauracji"
   - Kalorie: 800
   - Białko: 30, Tłuszcze: 25, Węglowodany: 90, Błonnik: 5
   ↓
4. System oblicza kalorie z makro:
   - Calculated: (30*4) + (25*9) + (90*4) + (5*0) = 585 kcal
   - Provided: 800 kcal
   - Difference: |800-585| / 800 = 26.9% > 5%
   ↓
5. Warning displayed (żółty alert box)
   - "Suma makroskładników (585 kcal) różni się od podanych kalorii (800 kcal) o 27%. Proszę zweryfikować dane."
   - Przycisk: "Przelicz automatycznie" (ustawia kalorie na 585)
   - User może ignorować i zapisać 800
   ↓
6. User wybiera kategorię: "Kolacja"
   - Auto-detect: jeśli czas ~19:00 → sugeruje Kolacja
   ↓
7. User click "Dodaj posiłek"
   ↓
8. Walidacja:
   - Opis: OK
   - Kalorie: OK (1-10000)
   - Data: OK (nie w przyszłości)
   ↓
9. POST /api/v1/meals (input_method: 'manual')
   - Response może zawierać warnings
   ↓
10. Modal closes
    - Toast: "Posiłek dodany"
    - Dashboard/DayDetails refreshes
```

### 3.5. Flow: Edycja posiłku

```
1. User w DayDetails
   - Lista posiłków widoczna
   ↓
2. Click na MealCard lub click edit icon (pencil)
   ↓
3. EditMeal modal opens
   - Loading skeleton (fetch danych)
   - GET /api/v1/meals/:id
   ↓
4. Modal wypełniony danymi:
   - Opis, kalorie, makro, kategoria, data, czas
   - input_method widoczny (np. 'ai')
   ↓
5. User modyfikuje:
   - Zmienia kalorie: 420 → 450
   - input_method automatycznie zmienia się na 'ai-edited'
   ↓
6. Click "Zapisz zmiany"
   ↓
7. PATCH /api/v1/meals/:id
   ↓
8. Modal closes
   - Toast: "Zmiany zapisane"
   - DayDetails refreshes
   - MealCard pokazuje nowe wartości
```

### 3.6. Flow: Usuwanie posiłku

```
1. User w DayDetails
   - Widzi listę posiłków
   ↓
2. Click trash icon na MealCard
   ↓
3. Karta expands inline
   - Pokazuje confirmation:
     "Czy na pewno usunąć ten posiłek?"
     [Anuluj] [Usuń] (red)
   ↓
4a. User click "Usuń"
    → DELETE /api/v1/meals/:id
    → Karta fade-out animation (200ms)
    → Znika z listy
    → Toast: "Posiłek usunięty"
    → DayDetails refreshes (zaktualizowany progress bar)
    ↓
4b. User click "Anuluj" LUB timeout 5s
    → Karta wraca do normal state (collapse)
```

### 3.7. Flow: Edycja celu kalorycznego

```
1. User w Settings
   - Lista opcji widoczna
   ↓
2. Click "Cel kaloryczny" card
   ↓
3. EditCalorieGoal modal/screen opens
   - GET /api/v1/calorie-goals/current
   - Pokazuje: "Aktualnie: 2500 kcal"
   - Input prepopulowany: 2500
   ↓
4. User zmienia wartość: 2500 → 2200
   ↓
5. Click "Zapisz"
   - Walidacja: 2200 w zakresie 1-10000 ✓
   ↓
6. POST /api/v1/calorie-goals
   - Body: { daily_goal: 2200 }
   - effective_from: CURRENT_DATE + 1 (jutro)
   ↓
7. Modal closes
   - Toast: "Cel kaloryczny zaktualizowany. Nowy cel obowiązuje od jutra."
   - Redirect do Settings
   ↓
8. Dashboard refreshes
   - DayCards pokazują nowy cel od jutra
```

### 3.8. Flow: Wylogowanie

```
1. User w Settings
   ↓
2. Click "Wyloguj" (red card na dole)
   ↓
3. AlertDialog opens
   - "Czy na pewno chcesz się wylogować?"
   - [Anuluj] [Wyloguj]
   ↓
4a. User click "Wyloguj"
    → supabase.auth.signOut()
    → Clear localStorage (onboarding flag, etc.)
    → Clear app state
    → Redirect to /login
    → Toast: "Wylogowano pomyślnie"
    ↓
4b. User click "Anuluj"
    → AlertDialog closes
    → Pozostaje w Settings
```

---

## 4. Układ i struktura nawigacji

### 4.1. Nawigacja Mobile (<1024px)

#### Bottom Navigation Bar

- **Pozycja**: Fixed bottom, full width
- **Height**: 64px
- **Background**: White, border-top (gray-200)
- **3 główne ikony** (równomiernie rozłożone):
  1. **Dashboard** (home icon)
     - Label: "Dashboard"
     - Route: `/`
     - Active state: icon + label w primary color (green-500), bold
     - Inactive: gray-600
  2. **Add Meal** (+ icon, large)
     - Label: "Dodaj"
     - Route: `/add-meal`
     - Style: Prominent, accent color (green-500), opcjonalnie FAB (circular, raised)
     - Zawsze wyróżniony (większy od innych)
  3. **Settings** (gear icon)
     - Label: "Ustawienia"
     - Route: `/settings`
     - Active state: primary color
     - Inactive: gray-600

#### Top Bar (w widokach)

- **Dashboard**: Logo/nazwa aplikacji (lewo) + Avatar (prawo)
- **DayDetails**: Back button ← (lewo) + Data (center)
- **Settings**: "Ustawienia" (center)

### 4.2. Nawigacja Desktop (≥1024px)

#### Left Sidebar

- **Szerokość**:
  - Expanded: 240px
  - Collapsed: 64px (tylko ikony)
- **Pozycja**: Fixed left, full height
- **Background**: White lub gray-50, border-right (gray-200)
- **Zawartość** (od góry do dołu):
  1. **Logo/nazwa aplikacji** (top)
     - Logo + "Simple Calories"
     - W collapsed mode: tylko ikona SC
  2. **Nawigacja pionowa**:
     - Dashboard (home icon + label)
     - Settings (gear icon + label)
     - Active state: background green-100, border-left green-500 (4px), bold
     - Hover: background gray-100
  3. **FAB "Dodaj posiłek"** (prominent)
     - Pełna szerokość (padding 16px)
     - Green-500 background, white text
     - Icon + "Dodaj posiłek"
     - W collapsed mode: circular FAB z + icon
  4. **User section** (bottom)
     - Avatar + Email
     - W collapsed mode: tylko Avatar
     - Click → dropdown menu (opcjonalnie: Quick settings, Wyloguj)
  5. **Collapse button** (hamburger icon)
     - Toggle expanded/collapsed
     - Position: top-right corner of sidebar
     - Transition: 300ms smooth

### 4.3. Routing i nawigacja między widokami

#### Public routes (unauthenticated)

- `/login` - Login
- `/register` - Register
- `/forgot-password` - ForgotPassword
- `/reset-password` - ResetPassword (z tokenem)

#### Protected routes (authenticated, require JWT)

- `/` - Dashboard (default)
- `/day/:date` - DayDetails
- `/add-meal` - AddMeal (modal)
- `/edit-meal/:id` - EditMeal (modal)
- `/settings` - Settings
- `/settings/calorie-goal` - EditCalorieGoal (modal)
- `/onboarding` - Onboarding (opcjonalnie, jeśli nie completed)

#### Route guards

- **Unauthenticated routes**: Jeśli zalogowany → redirect to `/`
- **Protected routes**: Jeśli niezalogowany → redirect to `/login`
- **Onboarding check**: Po pierwszym loginie → redirect to `/onboarding` (jeśli flag nie ustawiona)

#### Navigation behavior

- **Dashboard**: Zawsze dostępny (home)
- **DayDetails**:
  - Mobile: navigate (`/day/:date`)
  - Desktop: update right pane (no URL change, or shallow routing)
- **Modals** (AddMeal, EditMeal, EditCalorieGoal):
  - Overlay na obecnym widoku
  - URL update (dla deep linking)
  - Zamknięcie → powrót do poprzedniego widoku
  - Browser back button → zamyka modal

### 4.4. Breadcrumbs (opcjonalnie dla desktop)

Dla lepszej orientacji użytkownika:

- Dashboard > Dzień 30 paź 2025
- Settings > Cel kaloryczny

---

## 5. Kluczowe komponenty

### 5.1. Layout Components

#### AppLayout

- **Cel**: Główny layout aplikacji z nawigacją
- **Warianty**:
  - Mobile: Bottom navigation bar
  - Desktop: Left sidebar
- **Props**:
  - `children` - zawartość strony
  - `currentRoute` - aktywny route (dla highlight)
- **Odpowiedzialności**:
  - Renderowanie nawigacji (Bottom bar / Sidebar)
  - Zarządzanie stanem collapsed (sidebar)
  - Responsive behavior
  - Logout action

#### Modal

- **Cel**: Uniwersalny modal/overlay
- **Warianty**:
  - Mobile: Fullscreen overlay
  - Desktop: Centered dialog (max-width: 600px)
- **Props**:
  - `isOpen` - stan otwarcia
  - `onClose` - callback zamknięcia
  - `title` - tytuł modala
  - `children` - zawartość
  - `size` - rozmiar (sm, md, lg)
- **Cechy**:
  - Backdrop blur/dim
  - Animations: fade-in + slide-in-from-bottom
  - Focus trap
  - Escape key → close
  - Return focus po zamknięciu
  - Prevent body scroll

---

### 5.2. Data Display Components

#### DayCard

- **Cel**: Karta pojedynczego dnia na dashboardzie
- **Props**:
  - `date` - data (YYYY-MM-DD)
  - `totalCalories` - suma kalorii
  - `calorieGoal` - cel kaloryczny
  - `status` - under/on_track/over
  - `mealCount` - liczba posiłków
  - `onClick` - handler kliknięcia
  - `isActive` - czy wybrany (desktop)
- **Wygląd**:
  - Data (kontekstowa: "Dzisiaj", "Wczoraj", "pon, 28 paź")
  - Progress bar (CalorieProgress)
  - Kalorie/cel + procent
  - Liczba posiłków (🍽️ icon + tekst)
  - Chevron right (→)
- **Style**:
  - Background: white
  - Border-radius: 12px
  - Padding: 16px (mobile), 12px (desktop list)
  - Hover: shadow-lg, scale(1.02)
  - Active (desktop): border-left green-500 (4px), background green-50

#### MealCard

- **Cel**: Karta pojedynczego posiłku
- **Props**:
  - `meal` - obiekt posiłku (description, calories, macros, category, timestamp, etc.)
  - `onEdit` - handler edycji
  - `onDelete` - handler usuwania
  - `showActions` - czy pokazywać akcje (edit/delete)
- **Wygląd**:
  - Czas (14:30) + kategoria (🌅 Śniadanie) + akcje (✏️ 🗑️)
  - Opis (max 2 linie, ellipsis)
  - Kalorie (bold, prominent)
  - Makroskładniki (jeśli dostępne): "B: 25g | T: 18g | W: 52g | Bł: 4g"
- **Style**:
  - Background: white
  - Border-radius: 12px
  - Padding: 12px
  - Separator: 12px między kartami
  - Hover: shadow-md
- **Akcje**:
  - Desktop: show on hover
  - Mobile: zawsze widoczne
  - Delete: inline confirmation (expand karty)

#### CalorieProgress

- **Cel**: Progress bar z kolorowaniem statusu
- **Props**:
  - `current` - aktualne kalorie
  - `goal` - cel kaloryczny
  - `status` - under/on_track/over
  - `showLabel` - czy pokazywać label (default: true)
  - `showPercentage` - czy pokazywać procent (default: true)
- **Wygląd**:
  - Progress bar:
    - Height: 8px (mobile), 12px (desktop)
    - Border-radius: full
    - Background: gray-200
    - Fill: gradient w zależności od statusu
      - under: gray-300
      - on_track: green-500
      - over: orange-500
    - Animacja fill: 0 → wartość w 0.5s (ease-out)
  - Label (nad lub pod paskiem):
    - "2150 / 2500 kcal" (current bold) + "86%"
- **Accessibility**:
  - `<progress>` element
  - ARIA label: "Postęp kaloryczny: 2150 z 2500 kcal, 86%"

#### MacroDisplay

- **Cel**: Wyświetlanie makroskładników
- **Warianty**:
  1. **Grid** (header dnia, wynik AI):
     - 4 kolumny: Białko | Tłuszcze | Węglowodany | Błonnik
     - Każda komórka: wartość (bold) + label (small)
  2. **Inline** (karty posiłków):
     - "B: 25g | T: 18g | W: 52g | Bł: 4g"
  3. **Compact** (gdy brak miejsca):
     - "520 kcal • B: 25g T: 18g W: 52g"
- **Props**:
  - `protein`, `fats`, `carbs`, `fiber` - wartości (nullable)
  - `variant` - grid/inline/compact
- **Null handling**:
  - Grid: pokazuj "-"
  - Inline: nie pokazuj linii
  - Compact: pomiń null wartości

#### DayHeader

- **Cel**: Header szczegółów dnia (sticky)
- **Props**:
  - `date` - data
  - `totalCalories`, `calorieGoal`, `status`
  - `macros` - makroskładniki (object)
  - `mealCount` - liczba posiłków
  - `onAddMeal` - handler dodawania
- **Wygląd**:
  - Back button ← (mobile only)
  - Data (format długi: "Poniedziałek, 30 października 2025")
  - CalorieProgress
  - MacroDisplay (grid)
  - Liczba posiłków + przycisk "+" (floating right)
- **Style**:
  - Sticky top: 0
  - Background: white
  - Border-bottom: gray-200
  - Padding: 16px (mobile), 24px (desktop)
  - Shadow gdy scrolled

---

### 5.3. Form Components

#### MealForm

- **Cel**: Formularz dodawania/edycji posiłku (AI + Manual)
- **Props**:
  - `mode` - 'create' / 'edit'
  - `initialData` - dane początkowe (edit mode)
  - `onSubmit` - handler zapisu
  - `onCancel` - handler anulowania
- **Zawartość**:
  - SegmentedControl (AI/Manual)
  - **AI mode**:
    - Textarea (opis, max 500 chars)
    - Przykłady (clickable chips)
    - Button "Oblicz kalorie"
    - Loading state (multi-stage)
    - Wynik AI (kalorie + makro + assumptions)
    - Akcje: [Dodaj] [Generuj ponownie] [Edytuj ręcznie]
  - **Manual mode**:
    - Textarea (opis, required)
    - Input (kalorie, required)
    - Inputs (makro, opcjonalne)
    - Alert (warning makro)
  - **Wspólne**:
    - CategorySelector
    - DatePicker, TimePicker
    - Buttons: [Anuluj] [Dodaj/Zapisz]
- **Logika**:
  - Toggle AI ↔ Manual (prepopulacja)
  - Walidacja formularza
  - API calls (ai-generations, meals)
  - Loading states
  - Error handling

#### SegmentedControl

- **Cel**: Toggle między opcjami (AI/Manual)
- **Props**:
  - `options` - array opcji [{value, label, icon}]
  - `value` - aktywna wartość
  - `onChange` - callback zmiany
- **Wygląd**:
  - Full width (mobile), auto (desktop)
  - Active: background green-500, text white
  - Inactive: background gray-100, text gray-600
  - Height: 44px (mobile), 40px (desktop)
  - Smooth transition: 200ms
- **Accessibility**:
  - Role: radiogroup
  - Arrow keys navigation

#### CategorySelector

- **Cel**: Wybór kategorii posiłku (visual buttons)
- **Props**:
  - `value` - wybrana kategoria
  - `onChange` - callback zmiany
  - `allowNull` - czy można odznaczyć (default: true)
- **Wygląd**:
  - 4 przyciski (grid 2x2 mobile, 4x1 desktop):
    - 🌅 Śniadanie (yellow)
    - ☀️ Lunch (orange)
    - 🌙 Kolacja (blue)
    - 🍪 Przekąska (green)
  - Selected: border-2 border-primary, bg-primary/10
  - Unselected: border border-gray-200, bg-white
  - Hover: border-gray-300, scale(1.02)
- **Logika**:
  - Auto-detect na podstawie czasu (opcjonalnie)
  - Click wybranej → deselect (null)

#### DatePicker

- **Cel**: Wybór daty
- **Props**:
  - `value` - wybrana data (Date lub string)
  - `onChange` - callback zmiany
  - `minDate`, `maxDate` - zakres
- **Cechy**:
  - Native input[type="date"] lub custom calendar
  - Default: dzisiaj
  - Walidacja: nie w przyszłości
  - Warning jeśli >7 dni wstecz

#### TimePicker

- **Cel**: Wybór czasu
- **Props**:
  - `value` - wybrany czas (string HH:mm)
  - `onChange` - callback zmiany
- **Cechy**:
  - Native input[type="time"] lub custom picker
  - Default: teraz (zaokrąglone do 5 min)
  - Format: 24h

#### LoginForm, RegisterForm, CalorieGoalForm

- **Cel**: Specjalizowane formularze
- **Cechy**:
  - Walidacja w czasie rzeczywistym
  - Error messages pod polami
  - Loading states
  - Submit on Enter

---

### 5.4. Feedback Components

#### Toast

- **Cel**: Powiadomienia użytkownika
- **Props**:
  - `variant` - success/error/warning/info
  - `message` - tekst
  - `duration` - czas wyświetlania (default: 3s success, 5s error)
  - `onClose` - callback zamknięcia
- **Wygląd**:
  - Pozycja:
    - Mobile: top-center
    - Desktop: top-right
  - Icon + message + close button (X)
  - Kolory:
    - Success: green-500, ✓ icon
    - Error: red-500, ✕ icon
    - Warning: orange-500, ⚠️ icon
    - Info: blue-500, ℹ️ icon
- **Behavior**:
  - Auto-dismiss (timer)
  - Stack: max 3 jednocześnie
  - Animation: slide-in-from-top (200ms)
  - Swipe to dismiss (mobile)
- **Accessibility**:
  - Role: alert (error) / status (success)
  - ARIA live: polite/assertive

#### Spinner

- **Cel**: Loading indicator
- **Warianty**:
  - Small (16px) - w buttonach
  - Medium (24px) - default
  - Large (48px) - fullscreen loading
- **Wygląd**:
  - Circular spinner (CSS animation lub SVG)
  - Color: primary (green-500) lub inherit
  - `animate-spin`

#### Skeleton

- **Cel**: Skeleton loaders podczas ładowania
- **Warianty**:
  - DayCardSkeleton
  - MealCardSkeleton
  - DayHeaderSkeleton
- **Wygląd**:
  - Szare prostokąty w kształcie komponentu
  - `animate-pulse` (Tailwind)
  - Background: gray-200/gray-300 gradient

#### EmptyState

- **Cel**: Empty state z ilustracją i CTA
- **Props**:
  - `icon` - duże emoji lub SVG
  - `title` - nagłówek
  - `description` - tekst opisowy
  - `action` - button CTA (opcjonalnie)
- **Przykłady**:
  - Dashboard bez dni: 🍽️ "Zacznij swoją przygodę! Dodaj pierwszy posiłek" + [Dodaj posiłek]
  - Dzień bez posiłków: 🍴 "Brak posiłków w tym dniu. Dodaj swój pierwszy!" + [+ Dodaj]

#### ErrorState

- **Cel**: Error state z retry
- **Props**:
  - `error` - obiekt błędu lub message
  - `onRetry` - callback retry
- **Wygląd**:
  - Icon ⚠️ (large)
  - Tytuł: "Coś poszło nie tak"
  - Opis: friendly message
  - Button: "Spróbuj ponownie"

---

### 5.5. UI Components (Atomic)

#### Button

- **Warianty**:
  - Primary: green-500 background, white text
  - Secondary: gray-200 background, gray-900 text
  - Destructive: red-500 background, white text
  - Ghost: transparent, text color
  - Link: no background, text color, underline on hover
- **Sizes**: sm, md, lg
- **States**: default, hover, active, disabled, loading
- **Props**:
  - `variant`, `size`, `disabled`, `loading`, `onClick`

#### Input

- **Types**: text, number, email, password
- **Props**:
  - `type`, `value`, `onChange`, `placeholder`, `disabled`, `error`
  - `label` - label tekst
  - `helperText` - tekst pomocniczy
  - `errorMessage` - komunikat błędu
- **Cechy**:
  - Label nad polem
  - Error state: red border, red message pod polem
  - Helper text: gray text pod polem
  - Focus: ring-2 ring-blue-500

#### Textarea

- **Props**: podobne do Input + `rows` (liczba linii)
- **Cechy**:
  - Auto-resize (opcjonalnie)
  - Character counter (np. 0/500)

#### Avatar

- **Props**:
  - `src` - URL obrazka
  - `alt` - alt text
  - `fallback` - inicjały (jeśli brak obrazka)
  - `size` - sm, md, lg
- **Wygląd**:
  - Circular
  - Fallback: inicjały na kolorowym tle (hash z email)

#### Badge

- **Cel**: Mały status badge
- **Props**:
  - `variant` - default/success/warning/error
  - `children` - tekst
- **Przykład**: Kategoria posiłku jako badge

#### Alert

- **Cel**: Info/warning box
- **Props**:
  - `variant` - info/warning/error/success
  - `title` - tytuł (opcjonalnie)
  - `children` - treść
- **Wygląd**:
  - Border-left (4px) w kolorze wariantu
  - Background: light version koloru
  - Icon + tekst
- **Przykład**: Warning makro w Manual mode

---

### 5.6. Advanced Components

#### InfiniteScroll

- **Cel**: Lazy loading list (dashboard)
- **Props**:
  - `items` - array elementów
  - `loadMore` - callback ładowania kolejnych
  - `hasMore` - czy są jeszcze dane
  - `loading` - stan ładowania
  - `threshold` - odległość od końca do trigger (default: 200px)
- **Logika**:
  - Intersection Observer na ostatnim elemencie
  - Trigger loadMore gdy widoczny
  - Pokazuje SkeletonLoader podczas ładowania

#### AlertDialog

- **Cel**: Modal z pytaniem (confirmation)
- **Props**:
  - `isOpen`, `onClose`
  - `title` - tytuł
  - `description` - opis
  - `confirmLabel` - tekst przycisku potwierdzającego
  - `cancelLabel` - tekst przycisku anulującego
  - `onConfirm` - callback potwierdzenia
  - `variant` - default/destructive (red)
- **Przykład**: Confirmation wylogowania, usuwania posiłku (backup do inline)

#### OnboardingSlide

- **Cel**: Pojedynczy slajd onboardingu
- **Props**:
  - `icon` - duże emoji
  - `title` - tytuł
  - `description` - tekst lub bullets
  - `step` - numer kroku
  - `totalSteps` - łączna liczba kroków
- **Wygląd**:
  - Fullscreen
  - Icon na górze (text-8xl)
  - Title (h1)
  - Description (body, center)
  - Dots indicator na dole

#### DotsIndicator

- **Cel**: Wskaźnik kroków (onboarding, carousel)
- **Props**:
  - `total` - liczba kropek
  - `active` - aktywny index
- **Wygląd**:
  - Kropki w linii: ● ○ ○
  - Active: filled circle (green-500)
  - Inactive: outline circle (gray-300)

---

## 6. Względy techniczne

### 6.1. State Management

- **Local state**: React useState/useReducer dla komponentów
- **Global state**: Context API lub Zustand dla:
  - User auth state (JWT, user info)
  - App settings (onboarding completed, sidebar collapsed)
- **Server state**: React Query lub SWR dla:
  - API data caching
  - Optimistic updates
  - Auto-refetch

### 6.2. Data Fetching Strategy

- **React Query** (rekomendowane):
  - Queries dla GET endpoints
  - Mutations dla POST/PATCH/DELETE
  - Automatic caching i revalidation
  - Optimistic updates dla lepszego UX
- **Key features**:
  - Background refetch
  - Retry logic
  - Error handling
  - Loading states

### 6.3. Performance Optimization

- **Code splitting**: Lazy load routes i modals
- **Image optimization**: Next.js Image lub lazy loading
- **Virtualization**: Jeśli listy >100 elementów (opcjonalnie)
- **Memoization**: React.memo dla drogich komponentów
- **Debounce**: Search/filter inputs

### 6.4. Error Boundaries

- Catch React errors
- Fallback UI: ErrorState z retry
- Log errors do error-logs API (opcjonalnie)

### 6.5. Accessibility Checklist

- ✅ Semantic HTML
- ✅ ARIA labels i descriptions
- ✅ Keyboard navigation (Tab, Enter, Escape, Arrows)
- ✅ Focus management (modals, dialogs)
- ✅ Color contrast (WCAG AA)
- ✅ Screen reader support (announcements)
- ✅ Skip to main content
- ✅ `prefers-reduced-motion` support

### 6.6. Security Considerations

- ✅ JWT w HttpOnly cookies (jeśli możliwe) lub secure localStorage
- ✅ CSRF protection (Supabase handles)
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting dla AI endpoints (API level)
- ✅ RLS policies (database level)
- ✅ HTTPS only (production)

---

## 7. Mapowanie User Stories na UI

| ID     | User Story           | Widoki                           | Komponenty                                             |
| ------ | -------------------- | -------------------------------- | ------------------------------------------------------ |
| US-001 | Rejestracja          | Register                         | RegisterForm, Input, Button, PasswordStrengthIndicator |
| US-002 | Logowanie            | Login                            | LoginForm, Input, Button                               |
| US-003 | Reset hasła          | ForgotPassword, ResetPassword    | ForgotPasswordForm, ResetPasswordForm                  |
| US-004 | Pierwszy cel         | EditCalorieGoal (po rejestracji) | CalorieGoalForm                                        |
| US-005 | Dodawanie AI         | AddMeal (AI mode)                | MealForm, Textarea, Button, Spinner, MacroDisplay      |
| US-006 | Dodawanie manual     | AddMeal (Manual mode)            | MealForm, Input, Alert (warning)                       |
| US-007 | Niejednoznaczny opis | AddMeal (AI error handling)      | ErrorState, Button (regenerate)                        |
| US-008 | Kategoryzacja        | AddMeal, EditMeal                | CategorySelector                                       |
| US-009 | Anulowanie           | AddMeal, EditMeal                | Button (Cancel)                                        |
| US-010 | Dashboard            | Dashboard                        | DayCard, CalorieProgress, InfiniteScroll               |
| US-011 | Szczegóły dnia       | DayDetails                       | DayHeader, MealCard, MacroDisplay                      |
| US-012 | Edycja wpisu         | EditMeal                         | MealForm (prepopulated)                                |
| US-013 | Usuwanie wpisu       | DayDetails                       | MealCard (delete icon), AlertDialog (inline)           |
| US-014 | Aktualizacja celu    | EditCalorieGoal                  | CalorieGoalForm                                        |

---

## 8. Podsumowanie kluczowych decyzji architektonicznych

### UI/UX

- ✅ **Mobile-first** z adaptacją desktop (Bottom nav vs Sidebar)
- ✅ **AI-first interface** - domyślny tryb AI w dodawaniu posiłków
- ✅ **Two-pane layout** na desktop (Dashboard: lista + szczegóły)
- ✅ **Progressive disclosure** - opcjonalne pola po głównej akcji
- ✅ **Visual feedback** - progress bars, kolory statusu, animacje
- ✅ **Empty states** z CTA - motywują do akcji
- ✅ **Inline actions** - edycja/usuwanie bez opuszczania widoku

### Komponenty

- ✅ **Reusable MealForm** dla create/edit (DRY)
- ✅ **CalorieProgress** z kolorowaniem statusu (gray/green/orange)
- ✅ **MacroDisplay** z wariantami (grid/inline/compact)
- ✅ **Modal** responsywny (fullscreen mobile, dialog desktop)
- ✅ **Toast notifications** dla feedbacku
- ✅ **Skeleton loaders** dla lepszego UX podczas ładowania

### Nawigacja

- ✅ **Bottom bar** (mobile) - 3 główne akcje
- ✅ **Sidebar** (desktop) - expandable/collapsible
- ✅ **FAB** - prominent "Dodaj posiłek" zawsze dostępny
- ✅ **Modals z routing** - deep linking, back button support

### Data Flow

- ✅ **React Query** - caching, optimistic updates, auto-refetch
- ✅ **Optimistic UI** - instant feedback, revert on error
- ✅ **Infinite scroll** - dashboard (30 dni per batch)

### Accessibility

- ✅ **WCAG AA compliance**
- ✅ **Keyboard navigation** - wszystkie akcje dostępne
- ✅ **Screen reader support** - semantic HTML, ARIA labels
- ✅ **Focus management** - modals, forms

### Security

- ✅ **JWT authentication** (Supabase)
- ✅ **RLS policies** - data isolation
- ✅ **Rate limiting** - AI endpoints
- ✅ **Input validation** - client + server

---

## 9. Następne kroki (poza zakresem tego dokumentu)

1. **Detailed component specifications** - props, state, behavior
2. **API integration details** - request/response handling, error scenarios
3. **Design system implementation** - Tailwind config, theme, utilities
4. **Animation/transition specifications** - timing, easing, choreography
5. **Testing strategy** - unit, integration, e2e tests
6. **Performance benchmarks** - loading times, bundle size
7. **Analytics events** - tracking user behavior (metryki z PRD)
8. **Internationalization** - jeśli w przyszłości inne języki

---

**Koniec dokumentu architektury UI**
