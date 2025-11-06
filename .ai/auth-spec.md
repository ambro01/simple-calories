# Specyfikacja Techniczna Modułu Autentykacji

## Spis treści

1. [Wprowadzenie](#1-wprowadzenie)
2. [Architektura interfejsu użytkownika](#2-architektura-interfejsu-użytkownika)
3. [Logika backendowa](#3-logika-backendowa)
4. [System autentykacji](#4-system-autentykacji)
5. [Przepływy użytkownika](#5-przepływy-użytkownika)
6. [Obsługa błędów i walidacja](#6-obsługa-błędów-i-walidacja)
7. [Zabezpieczenia i compliance](#7-zabezpieczenia-i-compliance)

---

## 1. Wprowadzenie

### 1.1. Cel dokumentu

Dokument stanowi szczegółową specyfikację techniczną implementacji systemu autentykacji dla aplikacji "Szybkie Kalorie", obejmującą rejestrację, logowanie, odzyskiwanie hasła oraz zmianę hasła zgodnie z wymaganiami US-001, US-002, US-003 i US-003a.

### 1.2. Zakres funkcjonalny

- **Rejestracja użytkownika** (US-001): Email + hasło z automatycznym logowaniem
- **Logowanie użytkownika** (US-002): Weryfikacja credentials i utrzymanie sesji (30 dni)
- **Resetowanie hasła** (US-003): Wysyłka linku resetującego przez email
- **Zmiana hasła** (US-003a): Zmiana hasła w panelu ustawień

### 1.3. Wymagania niefunkcjonalne

- Hashowanie haseł algorytmem bcrypt (zapewnione przez Supabase Auth)
- Pełna izolacja danych użytkowników (RLS policies w Supabase)
- Sesja użytkownika utrzymywana przez 30 dni
- Brak dostępu do funkcji biznesowych bez autentykacji

### 1.4. Istniejąca architektura do zachowania

- **Frontend**: Astro 5 (SSR) + React 19 + TypeScript 5 + Tailwind 4 + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth)
- **Istniejące strony**: `/` (dashboard), `/settings`, `/day/[date]`
- **Istniejące API endpoints**: `/api/v1/meals`, `/api/v1/daily-progress`, `/api/v1/calorie-goals`, `/api/v1/profile`
- **Middleware**: `src/middleware/index.ts` (udostępnia `locals.supabase`)

---

## 2. Architektura interfejsu użytkownika

### 2.1. Nowe strony Astro

#### 2.1.1. `/src/pages/auth/signup.astro`

**Cel**: Strona rejestracji nowego użytkownika

**Struktura**:

```astro
---
// Pre-rendering: false (SSR wymagane dla sprawdzenia sesji)
export const prerender = false;

// Server-side logic:
// 1. Sprawdzenie czy użytkownik już zalogowany
//    - Jeśli TAK: redirect na "/"
// 2. Obsługa potencjalnych błędów przekazanych przez URL params
//    - ?error=registration_failed
---

<AuthLayout title="Rejestracja - Szybkie Kalorie">
  <SignupForm client:load />
</AuthLayout>
```

**Odpowiedzialności strony**:

- Renderowanie layoutu autentykacyjnego (logo, title, meta tags)
- Server-side redirect jeśli użytkownik zalogowany
- Przekazanie error params do komponentu React
- Metadata SEO (noindex dla stron auth)

**Integracja z backendem**:

- Server-side: `await locals.supabase.auth.getUser()` dla sprawdzenia sesji
- Redirect pattern: `return Astro.redirect("/")` jeśli user exists

---

#### 2.1.2. `/src/pages/auth/login.astro`

**Cel**: Strona logowania użytkownika

**Struktura**:

```astro
---
export const prerender = false;

// Server-side logic:
// 1. Sprawdzenie czy użytkownik już zalogowany
//    - Jeśli TAK: redirect na "/"
// 2. Obsługa error params (?error=invalid_credentials)
// 3. Obsługa success params (?success=password_reset)
---

<AuthLayout title="Logowanie - Szybkie Kalorie">
  <LoginForm client:load />
</AuthLayout>
```

**Odpowiedzialności strony**:

- Identyczne do signup.astro
- Dodatkowo: obsługa komunikatów sukcesu (np. po resecie hasła)

---

#### 2.1.3. `/src/pages/auth/forgot-password.astro`

**Cel**: Strona żądania resetu hasła

**Struktura**:

```astro
---
export const prerender = false;

// Server-side logic:
// 1. Sprawdzenie czy użytkownik zalogowany
//    - Jeśli TAK: redirect na "/"
// 2. Obsługa success params (?success=email_sent)
---

<AuthLayout title="Resetowanie hasła - Szybkie Kalorie">
  <ForgotPasswordForm client:load />
</AuthLayout>
```

**Odpowiedzialności strony**:

- Renderowanie formularza do wysyłki emaila
- Wyświetlanie komunikatu sukcesu po wysłaniu emaila
- Server-side redirect dla zalogowanych użytkowników

---

#### 2.1.4. `/src/pages/auth/reset-password.astro`

**Cel**: Strona ustawiania nowego hasła (po kliknięciu w link z emaila)

**Struktura**:

```astro
---
export const prerender = false;

// Server-side logic:
// 1. Walidacja tokenu z URL (?access_token=xxx&type=recovery)
//    - Supabase automatycznie przekierowuje tutaj z emaila
// 2. Jeśli token nieprawidłowy/wygasły:
//    - Wyświetl komunikat błędu z możliwością ponownego żądania resetu
// 3. Jeśli użytkownik już zalogowany (bez tokenu):
//    - Redirect na "/settings" (tam jest zmiana hasła)
---

<AuthLayout title="Ustaw nowe hasło - Szybkie Kalorie">
  <ResetPasswordForm client:load />
</AuthLayout>
```

**Odpowiedzialności strony**:

- Walidacja recovery token server-side
- Wyświetlanie formularza zmiany hasła
- Obsługa błędów wygasłego/nieprawidłowego tokenu
- Redirect dla użytkowników bez tokenu

---

#### 2.1.5. `/src/pages/auth/callback.astro`

**Cel**: Endpoint callback dla Supabase Auth (obsługa OAuth, magic links, email confirmation)

**Struktura**:

```astro
---
export const prerender = false;

// Server-side logic:
// 1. Supabase.auth.exchangeCodeForSession()
//    - Przekształcenie kodu autoryzacyjnego w sesję
// 2. Obsługa różnych typów callback:
//    - type=signup → Redirect na "/onboarding" lub "/settings"
//    - type=recovery → Redirect na "/auth/reset-password"
//    - type=invite → Redirect na odpowiednią stronę
// 3. W przypadku błędu:
//    - Redirect na "/auth/login?error=auth_callback_failed"
---
```

**Odpowiedzialności strony**:

- Obsługa wymiany kodu na sesję (Supabase PKCE flow)
- Routing użytkownika po callback
- Error handling dla niepowodzeń auth flow

---

### 2.2. Layout dla stron autentykacyjnych

#### 2.2.1. `/src/layouts/AuthLayout.astro`

**Cel**: Dedykowany layout dla stron auth (signup, login, forgot-password, reset-password)

**Funkcjonalności**:

- Centrowane okno z formularzem
- Logo aplikacji u góry
- Link "Powrót na stronę główną" (prowadzi do strony marketingowej lub dashboard jeśli zalogowany)
- Responsywność (mobile-first)
- Dark mode support (dziedziczenie z głównego Layout.astro)

**Struktura**:

```astro
---
import "../styles/global.css";
interface Props {
  title: string;
}
---

<!doctype html>
<html lang="pl">
  <head>
    <!-- Meta tags, title, theme script -->
    <meta name="robots" content="noindex, nofollow" />
  </head>
  <body>
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <!-- Slot dla formularza -->
        <slot />
      </div>
    </div>
  </body>
</html>
```

---

### 2.3. Komponenty React dla formularzy

#### 2.3.1. `/src/components/auth/SignupForm.tsx`

**Cel**: Formularz rejestracji użytkownika

**Stan komponentu**:

```typescript
interface SignupFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}
```

**Funkcjonalności**:

- **Walidacja client-side**:
  - Email: format (regex), wymagane
  - Hasło: min. 8 znaków, wymagane
  - Potwórz hasło: musi być identyczne z hasłem
- **Walidacja real-time**: Po blur na polach
- **Submit handler**:
  1. Client-side validation
  2. POST `/api/v1/auth/signup` z body `{ email, password }`
  3. W przypadku sukcesu:
     - Automatyczne logowanie (Supabase Auth robi to domyślnie)
     - Redirect na "/settings" (pierwsze ustawienie celu kalorycznego zgodnie z US-004)
  4. W przypadku błędu:
     - Wyświetlenie komunikatu (np. "Email już zarejestrowany")

**Używane UI komponenty**:

- `<Input>` (shadcn/ui)
- `<Label>` (shadcn/ui)
- `<Button>` (shadcn/ui)
- `<Alert>` (shadcn/ui) dla błędów

**Accessibility**:

- Właściwe labele i aria-labels
- Focus management (błędy → focus na pierwszym błędnym polu)
- Error announcements (aria-live)

---

#### 2.3.2. `/src/components/auth/LoginForm.tsx`

**Cel**: Formularz logowania użytkownika

**Stan komponentu**:

```typescript
interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}
```

**Funkcjonalności**:

- **Walidacja client-side**: Email format, pola wymagane
- **Submit handler**:
  1. POST `/api/v1/auth/login` z body `{ email, password }`
  2. W przypadku sukcesu:
     - Redirect na "/" (dashboard)
  3. W przypadku błędu:
     - "Nieprawidłowy email lub hasło"
- **Link do "Zapomniałem hasła"**: Prowadzi do `/auth/forgot-password`
- **Link do rejestracji**: "Nie masz konta? Zarejestruj się"

**Używane UI komponenty**: Identyczne jak SignupForm

---

#### 2.3.3. `/src/components/auth/ForgotPasswordForm.tsx`

**Cel**: Formularz żądania resetu hasła

**Stan komponentu**:

```typescript
interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  isSuccess: boolean; // Email wysłany
  errors: {
    email?: string;
    general?: string;
  };
}
```

**Funkcjonalności**:

- **Pojedyncze pole**: Email
- **Submit handler**:
  1. POST `/api/v1/auth/forgot-password` z body `{ email }`
  2. W przypadku sukcesu:
     - Wyświetl komunikat: "Link do resetu hasła został wysłany na adres {email}. Sprawdź swoją skrzynkę pocztową."
     - Formularz zostaje zastąpiony komunikatem sukcesu
  3. **UWAGA bezpieczeństwa**: Nawet jeśli email nie istnieje w bazie, wyświetl komunikat sukcesu (przeciwdziałanie enumeracji użytkowników)
- **Link powrotu**: "Wróć do logowania"

**Używane UI komponenty**: Input, Button, Alert

---

#### 2.3.4. `/src/components/auth/ResetPasswordForm.tsx`

**Cel**: Formularz ustawiania nowego hasła (po kliknięciu w link z emaila)

**Stan komponentu**:

```typescript
interface ResetPasswordFormState {
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  errors: {
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}
```

**Funkcjonalności**:

- **Walidacja**: Hasło min. 8 znaków, potwierdzenie musi się zgadzać
- **Submit handler**:
  1. POST `/api/v1/auth/reset-password` z body `{ password }`
     - Token autoryzacyjny jest już w sesji (Supabase callback go ustawił)
  2. W przypadku sukcesu:
     - Redirect na "/auth/login?success=password_reset"
     - Wyświetl toast: "Hasło zostało zmienione. Możesz się teraz zalogować."
  3. W przypadku błędu:
     - "Token wygasł" → Wyświetl link do ponownego żądania resetu

**Używane UI komponenty**: Input, Button, Alert

---

#### 2.3.5. `/src/components/settings/ChangePasswordDialog.tsx`

**Cel**: Dialog zmiany hasła w panelu ustawień (US-003a)

**Stan komponentu**:

```typescript
interface ChangePasswordDialogState {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
  isLoading: boolean;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    general?: string;
  };
}
```

**Funkcjonalności**:

- **3 pola**:
  - Aktualne hasło
  - Nowe hasło (min. 8 znaków)
  - Potwierdzenie nowego hasła
- **Submit handler**:
  1. POST `/api/v1/auth/change-password` z body `{ currentPassword, newPassword }`
  2. W przypadku sukcesu:
     - Zamknij dialog
     - Wyświetl toast: "Hasło zostało zmienione"
  3. W przypadku błędu:
     - "Aktualne hasło jest nieprawidłowe"

**Integracja z Settings**:

- Dodanie nowej karty `<SettingsCard>` w sekcji "Konto":
  ```tsx
  <SettingsCard
    title="Zmień hasło"
    subtitle="Zaktualizuj swoje hasło"
    icon={<Key className="h-5 w-5" />}
    onClick={openChangePasswordDialog}
  />
  ```

**Używane UI komponenty**: Dialog (shadcn/ui), Input, Button, Alert

---

### 2.4. Aktualizacja istniejących stron

#### 2.4.1. Wszystkie strony chronionych zasobów

**Strony do zabezpieczenia**:

- `/src/pages/index.astro` (Dashboard)
- `/src/pages/settings.astro`
- `/src/pages/day/[date].astro`

**Wzorzec zabezpieczenia** (dodany na początku frontmatter):

```astro
---
export const prerender = false;

// Auth guard
const {
  data: { user },
  error,
} = await Astro.locals.supabase.auth.getUser();

if (error || !user) {
  return Astro.redirect("/auth/login");
}

// Reszta logiki strony...
---
```

**Dlaczego ten wzorzec**:

- Server-side rendering zapewnia, że sprawdzenie autentykacji dzieje się PRZED renderowaniem
- Brak wycieku danych (HTML nie jest renderowany dla niezalogowanych)
- SEO-friendly (Google nie indeksuje chronionych treści)
- Wsparcie dla back button (redirect nie powoduje problemów z nawigacją)

---

#### 2.4.2. `/src/components/settings/Settings.tsx`

**Modyfikacje**:

1. Dodanie karty "Zmień hasło" w sekcji "Konto" (po karcie "Email", przed "Motyw aplikacji")
2. Dodanie stanu dialogu zmiany hasła:
   ```typescript
   const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
   ```
3. Import i renderowanie `<ChangePasswordDialog />`

**Nowy layout sekcji "Konto"**:

```
Konto
├── Email (non-clickable, informational)
├── Zmień hasło (otwiera dialog) ← NOWE
├── Motyw aplikacji (toggle light/dark)
└── Wyloguj się (otwiera confirmation dialog)
```

---

#### 2.4.3. `/src/components/settings/LogoutAlertDialog.tsx`

**Modyfikacje**:

- Aktualizacja logiki `onConfirm` aby używała nowego endpointa `/api/v1/auth/logout`
- Po wylogowaniu: redirect na `/auth/login`

**Nowy handler**:

```typescript
const handleLogout = async () => {
  try {
    setIsLoading(true);
    await fetch("/api/v1/auth/logout", { method: "POST" });
    // Redirect zostanie obsłużony przez endpoint (server-side)
    window.location.href = "/auth/login";
  } catch (error) {
    console.error("Logout failed:", error);
    // Fallback: force redirect
    window.location.href = "/auth/login";
  }
};
```

---

### 2.5. Wspólne komponenty UI

#### 2.5.1. `/src/components/auth/AuthFormFooter.tsx`

**Cel**: Reużywalny footer dla formularzy auth z linkami

**Przykład użycia**:

```tsx
// W LoginForm.tsx:
<AuthFormFooter
  text="Nie masz konta?"
  linkText="Zarejestruj się"
  linkHref="/auth/signup"
/>

// W SignupForm.tsx:
<AuthFormFooter
  text="Masz już konto?"
  linkText="Zaloguj się"
  linkHref="/auth/login"
/>
```

---

#### 2.5.2. `/src/components/auth/PasswordInput.tsx`

**Cel**: Input z możliwością pokazania/ukrycia hasła

**Funkcjonalności**:

- Toggle button (ikona oka) pokazujący/ukrywający hasło
- Accessibility: aria-label dla przycisku toggle
- Integracja z `<Input>` z shadcn/ui

**Props**:

```typescript
interface PasswordInputProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  autoComplete?: string;
}
```

---

### 2.6. Nawigacja i linki

#### 2.6.1. Struktura linków w flow auth

```
/auth/login
  ├→ "Zapomniałem hasła" → /auth/forgot-password
  └→ "Zarejestruj się" → /auth/signup

/auth/signup
  └→ "Zaloguj się" → /auth/login

/auth/forgot-password
  └→ "Wróć do logowania" → /auth/login

/auth/reset-password
  └→ Sukces → /auth/login?success=password_reset
```

#### 2.6.2. Aktualizacja głównego layoutu

- Jeśli użytkownik zalogowany: pokazuj link "Ustawienia" i "Wyloguj" (opcjonalnie w dropdown menu)
- Jeśli niezalogowany: nie dotyczy (wszystkie strony są chronione lub auth)

---

### 2.7. Obsługa komunikatów i stanów

#### 2.7.1. Toast notifications

**Cel**: Wyświetlanie krótkich komunikatów (sukces, błąd)

**Przypadki użycia**:

- Sukces rejestracji: "Konto zostało utworzone. Witaj!"
- Sukces zmiany hasła: "Hasło zostało zmienione"
- Błąd ogólny: "Wystąpił błąd. Spróbuj ponownie."

**Implementacja**:

- Dodanie `<Toaster />` z shadcn/ui do `Layout.astro`
- Użycie `toast()` w komponentach React

**Instalacja**:

```bash
npx shadcn@latest add toast
```

---

#### 2.7.2. Loading states

**Wzorzec dla wszystkich formularzy**:

```tsx
<Button type="submit" disabled={isLoading} className="w-full">
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Ładowanie..." : "Zaloguj się"}
</Button>
```

**Blokowanie formularza podczas ładowania**:

- Disable wszystkich inputów gdy `isLoading === true`
- Disable przycisku submit
- Pokazanie spinnera w przycisku

---

#### 2.7.3. Error display pattern

**Alert component dla błędów formularza**:

```tsx
{
  errors.general && (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>{errors.general}</AlertDescription>
    </Alert>
  );
}
```

**Inline errors dla pól**:

```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    className={errors.email ? "border-red-500" : ""}
  />
  {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
</div>
```

---

## 3. Logika backendowa

### 3.1. Nowe API endpoints

#### 3.1.1. POST `/api/v1/auth/signup`

**Cel**: Rejestracja nowego użytkownika

**Lokalizacja**: `/src/pages/api/v1/auth/signup.ts`

**Request body**:

```typescript
interface SignupRequestDTO {
  email: string;
  password: string;
}
```

**Walidacja** (Zod schema):

```typescript
const signupSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Proces obsługi**:

1. **Walidacja request body** (Zod)
   - W przypadku błędu: 400 Bad Request z details
2. **Wywołanie Supabase Auth**:
   ```typescript
   const { data, error } = await supabase.auth.signUp({
     email,
     password,
     options: {
       emailRedirectTo: `${Astro.site}/auth/callback`,
     },
   });
   ```
3. **Obsługa wyniku**:
   - Sukces (201 Created):
     ```json
     {
       "user": {
         "id": "uuid",
         "email": "user@example.com"
       },
       "session": {
         "access_token": "jwt_token",
         "refresh_token": "refresh_token"
       }
     }
     ```
   - Błąd - Email już istnieje (409 Conflict):
     ```json
     {
       "error": "Conflict",
       "message": "Użytkownik z tym adresem email już istnieje"
     }
     ```
   - Błąd - Ogólny (500 Internal Server Error):
     ```json
     {
       "error": "Internal Server Error",
       "message": "Nie udało się utworzyć konta"
     }
     ```

4. **Ustawienie cookies** (automatyczne przez Supabase):
   - `sb-access-token` (httpOnly, secure, sameSite=lax)
   - `sb-refresh-token` (httpOnly, secure, sameSite=lax)
   - Expires: 30 dni (zgodnie z wymaganiem o długości sesji)

5. **Triggery po sukcesie** (Supabase DB):
   - `handle_new_user()` trigger automatycznie tworzy rekord w tabeli `profiles`

**Response type**:

```typescript
interface SignupResponseDTO {
  user: {
    id: string;
    email: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
  };
}
```

**Error handling**:

- Logowanie błędów do tabeli `error_logs` (istniejąca funkcja `logError()`)
- Mapowanie błędów Supabase na przyjazne komunikaty użytkownika

---

#### 3.1.2. POST `/api/v1/auth/login`

**Cel**: Logowanie użytkownika

**Lokalizacja**: `/src/pages/api/v1/auth/login.ts`

**Request body**:

```typescript
interface LoginRequestDTO {
  email: string;
  password: string;
}
```

**Walidacja**:

```typescript
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
```

**Proces obsługi**:

1. **Walidacja request body**
2. **Wywołanie Supabase Auth**:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   });
   ```
3. **Obsługa wyniku**:
   - Sukces (200 OK):
     ```json
     {
       "user": { "id": "uuid", "email": "user@example.com" },
       "session": { "access_token": "...", "refresh_token": "..." }
     }
     ```
   - Błąd - Nieprawidłowe credentials (401 Unauthorized):
     ```json
     {
       "error": "Unauthorized",
       "message": "Nieprawidłowy email lub hasło"
     }
     ```
   - Błąd - Email nie potwierdzony (403 Forbidden):
     ```json
     {
       "error": "Forbidden",
       "message": "Potwierdź swój adres email przed zalogowaniem"
     }
     ```

4. **Ustawienie cookies** (automatyczne przez Supabase)

**Security considerations**:

- Nie rozróżniaj czy email nie istnieje vs. hasło nieprawidłowe (przeciwdziałanie enumeracji)
- Rate limiting na poziomie Supabase (wbudowane)

---

#### 3.1.3. POST `/api/v1/auth/logout`

**Cel**: Wylogowanie użytkownika

**Lokalizacja**: `/src/pages/api/v1/auth/logout.ts`

**Request body**: Brak (użycie sesji z cookies)

**Proces obsługi**:

1. **Sprawdzenie sesji**:
   ```typescript
   const {
     data: { user },
     error,
   } = await supabase.auth.getUser();
   ```
2. **Wywołanie Supabase Auth**:
   ```typescript
   await supabase.auth.signOut();
   ```
3. **Wyczyszczenie cookies** (automatyczne przez Supabase)
4. **Response**:
   - Sukces (200 OK):
     ```json
     { "message": "Wylogowano pomyślnie" }
     ```

**Uwaga**: Endpoint zawsze zwraca 200, nawet jeśli użytkownik nie był zalogowany (idempotentność)

---

#### 3.1.4. POST `/api/v1/auth/forgot-password`

**Cel**: Wysłanie emaila z linkiem do resetu hasła

**Lokalizacja**: `/src/pages/api/v1/auth/forgot-password.ts`

**Request body**:

```typescript
interface ForgotPasswordRequestDTO {
  email: string;
}
```

**Proces obsługi**:

1. **Walidacja email**
2. **Wywołanie Supabase Auth**:
   ```typescript
   const { error } = await supabase.auth.resetPasswordForEmail(email, {
     redirectTo: `${Astro.site}/auth/reset-password`,
   });
   ```
3. **Response** (zawsze sukces dla bezpieczeństwa):
   ```json
   {
     "message": "Jeśli podany email istnieje w systemie, wysłaliśmy link do resetu hasła"
   }
   ```

**Security considerations**:

- Zawsze zwracaj 200 OK, nawet jeśli email nie istnieje
- Zapobiega enumeracji użytkowników
- Supabase automatycznie throttle'uje requesty

**Email template** (konfiguracja w Supabase Dashboard):

```
Temat: Resetowanie hasła - Szybkie Kalorie

Cześć!

Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.

Kliknij poniższy link, aby ustawić nowe hasło:
{{ .ConfirmationURL }}

Link jest ważny przez 1 godzinę.

Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.

Pozdrawiamy,
Zespół Szybkie Kalorie
```

---

#### 3.1.5. POST `/api/v1/auth/reset-password`

**Cel**: Ustawienie nowego hasła (po kliknięciu w link z emaila)

**Lokalizacja**: `/src/pages/api/v1/auth/reset-password.ts`

**Request body**:

```typescript
interface ResetPasswordRequestDTO {
  password: string;
}
```

**Walidacja**:

```typescript
const resetPasswordSchema = z.object({
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Proces obsługi**:

1. **Sprawdzenie sesji recovery**:
   ```typescript
   const {
     data: { user },
     error,
   } = await supabase.auth.getUser();
   if (error || !user) {
     return Response(401, { error: "Unauthorized", message: "Nieprawidłowy lub wygasły token" });
   }
   ```
2. **Aktualizacja hasła**:
   ```typescript
   const { error } = await supabase.auth.updateUser({
     password: newPassword,
   });
   ```
3. **Response**:
   - Sukces (200 OK):
     ```json
     { "message": "Hasło zostało zmienione" }
     ```
   - Błąd - Token wygasły (401 Unauthorized)
   - Błąd - Hasło zbyt słabe (400 Bad Request)

---

#### 3.1.6. POST `/api/v1/auth/change-password`

**Cel**: Zmiana hasła w ustawieniach (wymaga aktualnego hasła)

**Lokalizacja**: `/src/pages/api/v1/auth/change-password.ts`

**Request body**:

```typescript
interface ChangePasswordRequestDTO {
  currentPassword: string;
  newPassword: string;
}
```

**Walidacja**:

```typescript
const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "Nowe hasło musi mieć minimum 8 znaków"),
});
```

**Proces obsługi**:

1. **Weryfikacja użytkownika** (z JWT w cookies):
   ```typescript
   const {
     data: { user },
     error,
   } = await supabase.auth.getUser();
   if (error || !user) {
     return Response(401, { error: "Unauthorized" });
   }
   ```
2. **Re-authentication** (weryfikacja aktualnego hasła):
   ```typescript
   const { error: reAuthError } = await supabase.auth.signInWithPassword({
     email: user.email!,
     password: currentPassword,
   });
   if (reAuthError) {
     return Response(401, { error: "Unauthorized", message: "Aktualne hasło jest nieprawidłowe" });
   }
   ```
3. **Aktualizacja hasła**:
   ```typescript
   const { error: updateError } = await supabase.auth.updateUser({
     password: newPassword,
   });
   ```
4. **Response**:
   - Sukces (200 OK):
     ```json
     { "message": "Hasło zostało zmienione" }
     ```
   - Błąd - Aktualne hasło nieprawidłowe (401)
   - Błąd - Nowe hasło zbyt słabe (400)

---

### 3.2. Serwisy

#### 3.2.1. `/src/lib/services/auth.service.ts`

**Cel**: Business logic layer dla operacji autentykacyjnych

**Klasa AuthService**:

```typescript
export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Rejestracja nowego użytkownika
   */
  async signUp(email: string, password: string): Promise<SignupResult> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      throw this.mapAuthError(error);
    }

    return {
      user: data.user!,
      session: data.session!,
    };
  }

  /**
   * Logowanie użytkownika
   */
  async signIn(email: string, password: string): Promise<SignInResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw this.mapAuthError(error);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  /**
   * Wylogowanie użytkownika
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * Żądanie resetu hasła
   */
  async requestPasswordReset(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.PUBLIC_SITE_URL}/auth/reset-password`,
    });

    // Celowo nie rzucamy błędu jeśli email nie istnieje (bezpieczeństwo)
    if (error && !this.isUserNotFoundError(error)) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * Resetowanie hasła (z tokenem z emaila)
   */
  async resetPassword(newPassword: string): Promise<void> {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw this.mapAuthError(error);
    }
  }

  /**
   * Zmiana hasła (z weryfikacją aktualnego)
   */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    // Krok 1: Re-authentication
    const { error: reAuthError } = await this.supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (reAuthError) {
      throw new AuthError("Aktualne hasło jest nieprawidłowe", "INVALID_CURRENT_PASSWORD");
    }

    // Krok 2: Aktualizacja hasła
    const { error: updateError } = await this.supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw this.mapAuthError(updateError);
    }
  }

  /**
   * Pobranie aktualnie zalogowanego użytkownika
   */
  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error) {
      throw this.mapAuthError(error);
    }

    return user;
  }

  /**
   * Mapowanie błędów Supabase na własne błędy
   */
  private mapAuthError(error: AuthError): AppAuthError {
    // Mapowanie kodów błędów Supabase na przyjazne komunikaty
    const errorMap: Record<string, string> = {
      invalid_credentials: "Nieprawidłowy email lub hasło",
      email_exists: "Użytkownik z tym adresem email już istnieje",
      weak_password: "Hasło jest zbyt słabe",
      email_not_confirmed: "Potwierdź swój adres email przed zalogowaniem",
      invalid_token: "Link wygasł lub jest nieprawidłowy",
    };

    return new AppAuthError(errorMap[error.code] || "Wystąpił nieoczekiwany błąd", error.code);
  }

  private isUserNotFoundError(error: AuthError): boolean {
    return error.code === "user_not_found";
  }
}
```

**Custom error class**:

```typescript
export class AppAuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppAuthError";
  }
}
```

---

#### 3.2.2. Aktualizacja `/src/lib/services/profile.service.ts`

**Nowa metoda**: `createProfileForNewUser()` (wywoływana przez trigger w bazie danych)

**Uwaga**: Supabase trigger `handle_new_user()` automatycznie tworzy profil po rejestracji, więc ten serwis nie wymaga zmian. Pozostaje jako read-only dla MVP.

---

### 3.3. Walidacja

#### 3.3.1. `/src/lib/validation/auth.schemas.ts`

**Cel**: Zod schemas dla walidacji requestów auth

```typescript
import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email").max(255),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków").max(72, "Hasło może mieć maksymalnie 72 znaki"), // bcrypt limit
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Nieprawidłowy format email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków").max(72, "Hasło może mieć maksymalnie 72 znaki"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Aktualne hasło jest wymagane"),
  newPassword: z
    .string()
    .min(8, "Nowe hasło musi mieć minimum 8 znaków")
    .max(72, "Nowe hasło może mieć maksymalnie 72 znaki"),
});

// Type exports
export type SignupRequestDTO = z.infer<typeof signupSchema>;
export type LoginRequestDTO = z.infer<typeof loginSchema>;
export type ForgotPasswordRequestDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestDTO = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordRequestDTO = z.infer<typeof changePasswordSchema>;
```

**Dodatkowe walidacje client-side** (w komponentach React):

```typescript
// Potwierdzenie hasła (tylko frontend)
const signupFormSchema = signupSchema
  .extend({
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła muszą być identyczne",
    path: ["passwordConfirm"],
  });
```

---

### 3.4. Typy TypeScript

#### 3.4.1. `/src/types/auth.types.ts`

**Cel**: Definicje typów dla modułu autentykacji

```typescript
import type { User, Session } from "@supabase/supabase-js";

// Request DTOs (zaimportowane z validation schemas)
export type {
  SignupRequestDTO,
  LoginRequestDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  ChangePasswordRequestDTO,
} from "../lib/validation/auth.schemas";

// Response DTOs
export interface AuthResponseDTO {
  user: User;
  session: Session;
}

export interface MessageResponseDTO {
  message: string;
}

export interface AuthErrorResponseDTO {
  error: string;
  message: string;
  details?: Record<string, string>;
}

// Service result types
export interface SignupResult {
  user: User;
  session: Session;
}

export interface SignInResult {
  user: User;
  session: Session;
}

// Auth state (dla React components)
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Form states
export interface LoginFormState {
  email: string;
  password: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    general?: string;
  };
}

export interface SignupFormState {
  email: string;
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  errors: {
    email?: string;
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}

export interface ForgotPasswordFormState {
  email: string;
  isLoading: boolean;
  isSuccess: boolean;
  errors: {
    email?: string;
    general?: string;
  };
}

export interface ResetPasswordFormState {
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  errors: {
    password?: string;
    passwordConfirm?: string;
    general?: string;
  };
}

export interface ChangePasswordFormState {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
  isLoading: boolean;
  errors: {
    currentPassword?: string;
    newPassword?: string;
    newPasswordConfirm?: string;
    general?: string;
  };
}
```

---

### 3.5. Aktualizacja middleware

#### 3.5.1. `/src/middleware/index.ts`

**Cel**: Dodanie obsługi sesji Supabase dla każdego requesta

**Aktualizacja**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware(async (context, next) => {
  // Udostępnij Supabase client w locals (istniejące)
  context.locals.supabase = supabaseClient;

  // NOWE: Odświeżenie sesji z cookies (jeśli istnieje)
  // Supabase automatycznie sprawdzi cookies i odświeży token jeśli potrzeba
  const {
    data: { session },
  } = await context.locals.supabase.auth.getSession();

  // Sesja jest już w Supabase client state, więc kolejne wywołania
  // auth.getUser() będą używać tej sesji

  return next();
});
```

**Dlaczego ta zmiana jest ważna**:

- Automatyczne odświeżanie wygasających tokenów
- Sync stanu sesji między requestami
- Brak potrzeby manualnego zarządzania tokenami

---

### 3.6. Environment variables

#### 3.6.1. Wymagane zmienne środowiskowe

**Plik**: `.env`

```bash
# Supabase (istniejące)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx... # Tylko dla server-side admin operations

# Auth (nowe)
PUBLIC_SITE_URL=http://localhost:3000  # Używane w redirect URLs

# Session (opcjonalne, Supabase defaults)
SUPABASE_JWT_EXPIRY=604800  # 7 dni (Supabase domyślnie)
SUPABASE_REFRESH_TOKEN_EXPIRY=2592000  # 30 dni (zgodnie z wymaganiem)
```

**Uwaga**: `SUPABASE_JWT_EXPIRY` i `SUPABASE_REFRESH_TOKEN_EXPIRY` są konfigurowane w Supabase Dashboard, nie w .env. Powyższe są tylko dokumentacyjne.

---

## 4. System autentykacji

### 4.1. Architektura Supabase Auth

#### 4.1.1. Wybór strategii autentykacji

**Supabase Auth oferuje**:

- Email/Password (używamy w MVP)
- Magic Links (opcjonalnie w przyszłości)
- OAuth providers (Google, GitHub, etc. - out of scope MVP)

**Wybrana strategia**: Email/Password

- Najprostsza implementacja
- Pełna kontrola nad UX
- Zgodność z wymaganiami PRD

---

#### 4.1.2. Flow autentykacji

**Rejestracja (Signup Flow)**:

```
1. User wypełnia formularz (email + password)
   ↓
2. Frontend: POST /api/v1/auth/signup
   ↓
3. Backend: supabase.auth.signUp()
   ↓
4. Supabase:
   - Tworzy użytkownika w auth.users
   - Hashuje hasło (bcrypt)
   - Generuje JWT access token + refresh token
   - Wywołuje trigger handle_new_user() → tworzy profil w public.profiles
   ↓
5. Backend: Ustawia cookies (sb-access-token, sb-refresh-token)
   ↓
6. Frontend: Redirect na /settings (pierwsze ustawienie celu kalorycznego)
```

**Logowanie (Login Flow)**:

```
1. User wypełnia formularz (email + password)
   ↓
2. Frontend: POST /api/v1/auth/login
   ↓
3. Backend: supabase.auth.signInWithPassword()
   ↓
4. Supabase:
   - Weryfikuje hasło (bcrypt compare)
   - Generuje nowe tokeny
   ↓
5. Backend: Ustawia cookies
   ↓
6. Frontend: Redirect na / (dashboard)
```

**Resetowanie hasła (Password Reset Flow)**:

```
1. User klika "Zapomniałem hasła"
   ↓
2. Wypełnia formularz z emailem
   ↓
3. Frontend: POST /api/v1/auth/forgot-password
   ↓
4. Backend: supabase.auth.resetPasswordForEmail()
   ↓
5. Supabase:
   - Generuje recovery token (1h ważności)
   - Wysyła email z linkiem: /auth/reset-password?token=xxx
   ↓
6. User klika link z emaila
   ↓
7. Astro page /auth/reset-password:
   - Supabase automatycznie parsuje token z URL
   - Tworzy recovery session
   ↓
8. User ustawia nowe hasło
   ↓
9. Frontend: POST /api/v1/auth/reset-password
   ↓
10. Backend: supabase.auth.updateUser({ password })
   ↓
11. Supabase aktualizuje hasło
   ↓
12. Frontend: Redirect na /auth/login?success=password_reset
```

**Zmiana hasła w ustawieniach (Change Password Flow)**:

```
1. User w /settings klika "Zmień hasło"
   ↓
2. Wypełnia formularz (aktualne + nowe hasło)
   ↓
3. Frontend: POST /api/v1/auth/change-password
   ↓
4. Backend:
   - Weryfikuje aktualne hasło (re-authentication)
   - Aktualizuje hasło
   ↓
5. Frontend: Toast "Hasło zmienione" + zamknięcie dialogu
```

---

#### 4.1.3. Session management

**Token storage**:

- **Access token**: JWT, ważny 1 godzinę (domyślnie)
- **Refresh token**: Ważny 30 dni (zgodnie z wymaganiem)
- **Storage**: httpOnly cookies (bezpieczne, automatyczne przez Supabase)

**Automatyczne odświeżanie**:

```typescript
// Middleware automatycznie odświeża token przed wygaśnięciem
const {
  data: { session },
} = await supabase.auth.getSession();
// Jeśli access token wygasł ale refresh token ważny:
// Supabase automatycznie wysyła request do /auth/v1/token?grant_type=refresh_token
```

**Wylogowanie**:

- Wywołanie `supabase.auth.signOut()` usuwa cookies
- Server-side: sprawdzenie `getUser()` zwróci error
- Frontend: redirect na /auth/login

---

#### 4.1.4. RLS (Row Level Security) policies

**Istniejące policies (do zachowania)**:

```sql
-- profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- meals table
CREATE POLICY "Users can view own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

-- itd. dla pozostałych tabel
```

**Zmiana po implementacji auth**:

- Wszystkie istniejące polityki używają `auth.uid()` - nie wymaga zmian
- Usunięcie `DEFAULT_USER_ID` z serwisów:

  ```typescript
  // PRZED:
  const userId = DEFAULT_USER_ID;

  // PO:
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;
  ```

---

#### 4.1.5. Database triggers

**Istniejący trigger** (stworzony wcześniej, gotowy do użycia):

```sql
-- Function: Automatyczne tworzenie profilu po rejestracji
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Wywoływany po INSERT do auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
```

**Weryfikacja**: Po implementacji sprawdzić czy trigger działa:

```sql
-- Test query po rejestracji nowego użytkownika
SELECT
  u.email,
  p.id,
  p.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'test@example.com';
-- Oczekiwany wynik: profil istnieje z tym samym ID co user
```

---

### 4.2. Konfiguracja Supabase Dashboard

#### 4.2.1. Authentication settings

**Lokalizacja**: Supabase Dashboard → Authentication → Settings

**Email Auth**:

- ✅ Enable Email provider
- ✅ Confirm email: **Disabled dla MVP** (uproszczenie onboardingu)
  - W przyszłości: Enable i dodanie email confirmation flow
- ✅ Enable Signup: **Enabled**

**Session Settings**:

- JWT Expiry: **3600 seconds** (1 godzina)
- Refresh Token Expiry: **2592000 seconds** (30 dni) ← zgodne z wymaganiem

**Site URL**:

- Development: `http://localhost:3000`
- Production: `https://szybkie-kalorie.pl` (lub docelowa domena)

**Redirect URLs** (whitelist):

- `http://localhost:3000/auth/callback`
- `https://szybkie-kalorie.pl/auth/callback`
- `http://localhost:3000/auth/reset-password`
- `https://szybkie-kalorie.pl/auth/reset-password`

---

#### 4.2.2. Email templates

**Lokalizacja**: Supabase Dashboard → Authentication → Email Templates

**Reset Password Email**:

```html
<h2>Resetowanie hasła</h2>
<p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w aplikacji Szybkie Kalorie.</p>
<p>Kliknij poniższy przycisk, aby ustawić nowe hasło:</p>
<a
  href="{{ .ConfirmationURL }}"
  style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: 500;"
>
  Ustaw nowe hasło
</a>
<p style="margin-top: 16px; color: #6b7280; font-size: 14px;">Link jest ważny przez 1 godzinę.</p>
<p style="color: #6b7280; font-size: 14px;">Jeśli nie prosiłeś o reset hasła, zignoruj tę wiadomość.</p>
<hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
<p style="color: #9ca3af; font-size: 12px;">
  Pozdrawiamy,<br />
  Zespół Szybkie Kalorie
</p>
```

**Change Email Address** (opcjonalnie, nie w MVP):

```html
<!-- Dla przyszłości, gdy dodamy zmianę emaila -->
```

**Confirm Signup** (wyłączone w MVP, ale gotowy template):

```html
<h2>Potwierdź swój adres email</h2>
<p>Dziękujemy za rejestrację w Szybkie Kalorie!</p>
<p>Kliknij poniższy przycisk, aby potwierdzić swój adres email:</p>
<a href="{{ .ConfirmationURL }}">Potwierdź email</a>
```

---

#### 4.2.3. Rate limiting (wbudowane w Supabase)

Supabase automatycznie limituje:

- Signup: 30 requestów / godzinę z tego samego IP
- Login: 30 requestów / godzinę z tego samego IP
- Password reset: 10 requestów / godzinę z tego samego IP

**Brak potrzeby własnej implementacji rate limitingu dla MVP.**

---

### 4.3. Client-side auth state management

#### 4.3.1. `/src/hooks/useAuth.ts`

**Cel**: React hook do zarządzania stanem autentykacji

```typescript
import { useEffect, useState } from "react";
import { supabaseClient } from "@/db/supabase.client";
import type { User, Session } from "@supabase/supabase-js";
import type { AuthState } from "@/types/auth.types";

/**
 * Hook do zarządzania stanem autentykacji
 *
 * UWAGA: Ten hook jest używany TYLKO w komponentach React.
 * Strony Astro używają server-side auth checking.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Pobierz początkową sesję
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    // Nasłuchuj na zmiany auth state
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}
```

**Użycie w komponentach**:

```tsx
// W komponencie który potrzebuje user info (np. Settings)
function Settings() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <div>Ładowanie...</div>;
  }

  if (!isAuthenticated) {
    // To nie powinno się zdarzyć (Astro page chroni stronę)
    // ale na wszelki wypadek:
    window.location.href = "/auth/login";
    return null;
  }

  return (
    <div>
      <p>Zalogowany jako: {user.email}</p>
    </div>
  );
}
```

---

#### 4.3.2. Auth context provider (opcjonalnie)

**Dla aplikacji z wieloma komponentami potrzebującymi auth state**:

**Uwaga dla MVP**: Nie jest to krytyczne, ponieważ:

- Astro chroni strony server-side
- Większość komponentów nie potrzebuje auth state
- `useAuth()` hook wystarcza dla prostych przypadków

**Implementacja dla przyszłości**:

```tsx
// /src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from "react";
import type { AuthState } from "@/types/auth.types";
import { supabaseClient } from "@/db/supabase.client";

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // ... identyczna logika jak w useAuth
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
```

---

### 4.4. Server-side auth helpers

#### 4.4.1. `/src/lib/helpers/auth.helpers.ts`

**Cel**: Utility functions dla autentykacji server-side (Astro pages, API endpoints)

````typescript
import type { AstroGlobal } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

/**
 * Pobiera zalogowanego użytkownika lub przekierowuje na /auth/login
 *
 * Użycie w Astro pages:
 * ```astro
 * ---
 * const user = await requireAuth(Astro);
 * // Jeśli użytkownik niezalogowany, nastąpi redirect (funkcja nie zwróci)
 * ---
 * ```
 */
export async function requireAuth(astro: AstroGlobal): Promise<User> {
  const {
    data: { user },
    error,
  } = await astro.locals.supabase.auth.getUser();

  if (error || !user) {
    return astro.redirect("/auth/login");
  }

  return user;
}

/**
 * Pobiera zalogowanego użytkownika lub zwraca null
 *
 * Użycie gdy redirect nie jest pożądany (np. w middleware):
 * ```typescript
 * const user = await getAuthUser(supabase);
 * if (!user) {
 *   // custom handling
 * }
 * ```
 */
export async function getAuthUser(supabase: SupabaseClient): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Redirect jeśli użytkownik JUŻ zalogowany (dla stron auth)
 *
 * Użycie w /auth/login, /auth/signup:
 * ```astro
 * ---
 * await redirectIfAuthenticated(Astro);
 * // Jeśli użytkownik zalogowany, zostanie przekierowany na /
 * ---
 * ```
 */
export async function redirectIfAuthenticated(astro: AstroGlobal): Promise<void> {
  const {
    data: { user },
  } = await astro.locals.supabase.auth.getUser();

  if (user) {
    return astro.redirect("/");
  }
}

/**
 * Sprawdza czy user ma recovery session (po kliknięciu linku z emaila)
 */
export async function hasRecoverySession(supabase: SupabaseClient): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Jeśli user istnieje w recovery context
  // (Supabase automatycznie ustawia to po kliknięciu w link z emaila)
  return !!user;
}
````

**Przykłady użycia**:

```astro
---
// /src/pages/index.astro
import { requireAuth } from "@/lib/helpers/auth.helpers";

const user = await requireAuth(Astro);
// Tutaj mamy gwarancję że user jest zalogowany
---

<Layout>
  <p>Witaj, {user.email}!</p>
</Layout>
```

```astro
---
// /src/pages/auth/login.astro
import { redirectIfAuthenticated } from "@/lib/helpers/auth.helpers";

await redirectIfAuthenticated(Astro);
// Jeśli użytkownik zalogowany, nie dojdziemy do tego miejsca
---

<AuthLayout>
  <LoginForm client:load />
</AuthLayout>
```

---

## 5. Przepływy użytkownika

### 5.1. Rejestracja nowego użytkownika (US-001)

**Scenariusz główny**:

1. User odwiedza `/auth/signup`
2. Wypełnia formularz:
   - Email: `jan@example.com`
   - Hasło: `SecurePass123`
   - Powtórz hasło: `SecurePass123`
3. Klika "Zarejestruj się"
4. System:
   - Waliduje dane (client-side)
   - Wysyła POST `/api/v1/auth/signup`
   - Tworzy użytkownika w Supabase
   - Automatycznie loguje (ustawia cookies)
   - Tworzy profil (trigger `handle_new_user()`)
5. Redirect na `/settings` (zgodnie z US-004: pierwsze ustawienie celu kalorycznego)
6. User widzi komunikat: "Witaj! Ustaw swój dzienny cel kaloryczny, aby rozpocząć."

**Scenariusze alternatywne**:

- **Email już istnieje**:
  - Błąd: "Użytkownik z tym adresem email już istnieje"
  - Link: "Może chcesz się zalogować?"
- **Hasła nie pasują**:
  - Walidacja client-side, błąd pod polem "Powtórz hasło"
- **Słabe hasło** (< 8 znaków):
  - Błąd: "Hasło musi mieć minimum 8 znaków"

---

### 5.2. Logowanie (US-002)

**Scenariusz główny**:

1. User odwiedza `/auth/login`
2. Wypełnia formularz:
   - Email: `jan@example.com`
   - Hasło: `SecurePass123`
3. Klika "Zaloguj się"
4. System:
   - Weryfikuje credentials
   - Ustawia sesję (cookies na 30 dni)
5. Redirect na `/` (dashboard)
6. User widzi swój dashboard z historią posiłków

**Scenariusze alternatywne**:

- **Nieprawidłowe credentials**:
  - Błąd: "Nieprawidłowy email lub hasło"
  - Nie rozróżniaj czy email nie istnieje vs. hasło złe (bezpieczeństwo)
- **Za dużo prób logowania**:
  - Supabase automatycznie blokuje (rate limiting)
  - Błąd: "Zbyt wiele prób. Spróbuj ponownie za kilka minut."

**Link do zapomnienia hasła**:

- "Zapomniałem hasła" → `/auth/forgot-password`

---

### 5.3. Resetowanie hasła (US-003)

**Scenariusz główny**:

1. User odwiedza `/auth/login`
2. Klika "Zapomniałem hasła"
3. Redirect na `/auth/forgot-password`
4. Wypełnia email: `jan@example.com`
5. Klika "Wyślij link resetujący"
6. System:
   - Wysyła email z linkiem (ważny 1h)
   - Wyświetla komunikat sukcesu (nawet jeśli email nie istnieje)
7. User otrzymuje email:

   ```
   Temat: Resetowanie hasła - Szybkie Kalorie

   Kliknij link aby ustawić nowe hasło:
   https://szybkie-kalorie.pl/auth/reset-password?token=xxx
   ```

8. User klika link
9. Redirect na `/auth/reset-password` (Supabase parsuje token)
10. Formularz zmiany hasła:
    - Nowe hasło: `NewSecurePass456`
    - Powtórz hasło: `NewSecurePass456`
11. Klika "Zmień hasło"
12. System aktualizuje hasło
13. Redirect na `/auth/login?success=password_reset`
14. Toast: "Hasło zostało zmienione. Możesz się teraz zalogować."
15. User loguje się nowym hasłem

**Scenariusze alternatywne**:

- **Token wygasł**:
  - Błąd: "Link wygasł. Poproś o nowy link do resetu hasła."
  - Przycisk: "Wróć do formularza resetowania"
- **Hasła nie pasują**:
  - Walidacja client-side
- **Email nie istnieje** (na etapie forgot-password):
  - System wyświetla sukces (nie ujawnia czy email istnieje)

---

### 5.4. Zmiana hasła w ustawieniach (US-003a)

**Scenariusz główny**:

1. User zalogowany odwiedza `/settings`
2. Widzi sekcję "Konto" z kartami:
   - Email
   - **Zmień hasło** ← nowa karta
   - Motyw aplikacji
   - Wyloguj się
3. Klika "Zmień hasło"
4. Otwiera się dialog z formularzem:
   - Aktualne hasło: `SecurePass123`
   - Nowe hasło: `BetterPass789`
   - Powtórz nowe hasło: `BetterPass789`
5. **Wymaganie z US-003a**: Przycisk "Zapisz" jest zablokowany dopóki pola nie są wypełnione
6. Klika "Zapisz"
7. System:
   - Weryfikuje aktualne hasło (re-authentication)
   - Aktualizuje hasło
8. Dialog się zamyka
9. Toast: "Hasło zostało zmienione"

**Scenariusze alternatywne**:

- **Aktualne hasło nieprawidłowe**:
  - Błąd: "Aktualne hasło jest nieprawidłowe"
  - Focus na polu "Aktualne hasło"
- **Nowe hasło zbyt słabe**:
  - Błąd: "Nowe hasło musi mieć minimum 8 znaków"
- **Hasła nie pasują**:
  - Błąd: "Hasła muszą być identyczne"
- **Anulowanie**:
  - Klika "Anuluj" lub X
  - Dialog się zamyka bez zapisywania

---

### 5.5. Wylogowanie

**Scenariusz główny**:

1. User w `/settings` klika "Wyloguj się"
2. Otwiera się dialog potwierdzenia:

   ```
   Czy na pewno chcesz się wylogować?

   [Anuluj]  [Wyloguj się]
   ```

3. Klika "Wyloguj się"
4. System:
   - POST `/api/v1/auth/logout`
   - Usuwa cookies sesji
5. Redirect na `/auth/login`
6. Toast: "Zostałeś wylogowany"

---

### 5.6. Automatyczne odświeżanie sesji

**Scenariusz**:

1. User zalogowany, używa aplikacji
2. Po 50 minutach (przed wygaśnięciem 1h access token):
3. Middleware wykrywa wygasający token
4. Supabase automatycznie wysyła request z refresh token
5. Otrzymuje nowy access token
6. User nie zauważa żadnej przerwy (seamless)

**Po 30 dniach** (wygaśnięcie refresh token):

1. User próbuje wejść na `/`
2. Middleware wykrywa brak ważnej sesji
3. Redirect na `/auth/login`
4. Toast: "Twoja sesja wygasła. Zaloguj się ponownie."

---

## 6. Obsługa błędów i walidacja

### 6.1. Walidacja client-side

#### 6.1.1. Email

```typescript
const validateEmail = (email: string): string | undefined => {
  if (!email) {
    return "Email jest wymagany";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return "Nieprawidłowy format email";
  }

  if (email.length > 255) {
    return "Email jest zbyt długi";
  }

  return undefined; // Brak błędu
};
```

#### 6.1.2. Hasło

```typescript
const validatePassword = (password: string): string | undefined => {
  if (!password) {
    return "Hasło jest wymagane";
  }

  if (password.length < 8) {
    return "Hasło musi mieć minimum 8 znaków";
  }

  if (password.length > 72) {
    return "Hasło może mieć maksymalnie 72 znaki"; // bcrypt limit
  }

  // Opcjonalnie: dodatkowe wymagania (cyfry, znaki specjalne)
  // Zostawione proste dla MVP zgodnie z US-001

  return undefined;
};
```

#### 6.1.3. Potwierdzenie hasła

```typescript
const validatePasswordConfirm = (password: string, passwordConfirm: string): string | undefined => {
  if (!passwordConfirm) {
    return "Potwierdzenie hasła jest wymagane";
  }

  if (password !== passwordConfirm) {
    return "Hasła muszą być identyczne";
  }

  return undefined;
};
```

#### 6.1.4. Real-time validation trigger

```tsx
// W komponencie formularza
<Input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  onBlur={() => {
    const error = validateEmail(email);
    setErrors((prev) => ({ ...prev, email: error }));
  }}
/>
```

---

### 6.2. Walidacja server-side

#### 6.2.1. Wzorzec walidacji w API endpoints

```typescript
// W każdym endpoint (np. POST /api/v1/auth/signup)
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Step 1: Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: "Invalid JSON body",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Step 2: Validate with Zod
    let validatedData;
    try {
      validatedData = signupSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        const details: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path.join(".");
          details[field] = err.message;
        });

        return new Response(
          JSON.stringify({
            error: "Bad Request",
            message: "Validation failed",
            details,
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      throw error; // Unexpected error
    }

    // Step 3: Business logic
    // ...
  } catch (error) {
    // Step 4: Error handling
    // ...
  }
};
```

---

### 6.3. Komunikaty błędów

#### 6.3.1. Mapy błędów dla użytkownika

**Frontend error messages**:

```typescript
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // Network errors
  "Failed to fetch": "Brak połączenia z serwerem. Sprawdź internet.",
  NetworkError: "Brak połączenia z serwerem. Sprawdź internet.",

  // Validation errors
  invalid_email: "Nieprawidłowy format email",
  weak_password: "Hasło jest zbyt słabe",
  passwords_dont_match: "Hasła muszą być identyczne",

  // Auth errors
  invalid_credentials: "Nieprawidłowy email lub hasło",
  email_exists: "Użytkownik z tym adresem email już istnieje",
  email_not_confirmed: "Potwierdź swój adres email przed zalogowaniem",
  invalid_token: "Link wygasł lub jest nieprawidłowy",
  user_not_found: "Nie znaleziono użytkownika",
  invalid_current_password: "Aktualne hasło jest nieprawidłowe",

  // Rate limiting
  too_many_requests: "Zbyt wiele prób. Spróbuj ponownie za kilka minut.",

  // Generic
  unknown: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.",
};

const getErrorMessage = (errorCode: string): string => {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES["unknown"];
};
```

---

### 6.4. Logging błędów

#### 6.4.1. Wykorzystanie istniejącej infrastruktury

Aplikacja już ma funkcję `logError()` w `/src/lib/helpers/error-logger.ts`.

**Użycie w auth endpoints**:

```typescript
// W catch block każdego auth endpoint
catch (error) {
  console.error('Signup error:', error);

  await logError(locals.supabase, {
    user_id: null, // Użytkownik jeszcze nie istnieje przy signup
    error_type: 'auth_signup_error',
    error_message: error instanceof Error ? error.message : String(error),
    error_details: error instanceof Error ? { stack: error.stack } : undefined,
    context: {
      endpoint: 'POST /api/v1/auth/signup',
      email: body?.email, // Do debugowania (bez hasła!)
    },
  });

  return new Response(
    JSON.stringify({
      error: 'Internal Server Error',
      message: 'Nie udało się utworzyć konta',
    }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**WAŻNE**: Nigdy nie loguj haseł (ani w plain text, ani zahaszowanych).

---

### 6.5. Obsługa błędów UX

#### 6.5.1. Pattern dla inline errors

```tsx
{
  errors.email && (
    <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="h-4 w-4" />
      {errors.email}
    </p>
  );
}
```

#### 6.5.2. Pattern dla global errors

```tsx
{
  errors.general && (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Błąd</AlertTitle>
      <AlertDescription>{errors.general}</AlertDescription>
    </Alert>
  );
}
```

#### 6.5.3. Toast notifications

```tsx
import { toast } from "sonner"; // lub toast z shadcn/ui

// Sukces
toast.success("Hasło zostało zmienione");

// Błąd
toast.error("Nie udało się zmienić hasła");

// Informacja
toast.info("Link do resetu hasła został wysłany na Twój email");
```

---

## 7. Zabezpieczenia i compliance

### 7.1. Bezpieczeństwo haseł

#### 7.1.1. Hashowanie (Supabase)

- **Algorytm**: bcrypt (wbudowany w Supabase Auth)
- **Cost factor**: 10 (domyślnie w Supabase)
- **Czas hashowania**: ~100ms (optymalne dla UX i bezpieczeństwa)

**Weryfikacja**: Hasła NIE są przechowywane w plain text. Supabase przechowuje tylko hash.

---

#### 7.1.2. Wymagania dla haseł

**Minimalne wymaganie (zgodnie z US-001)**:

- Minimum 8 znaków

**Rekomendacje dla przyszłości** (opcjonalne enhancement):

- Minimum 1 wielka litera
- Minimum 1 cyfra
- Minimum 1 znak specjalny

**UWAGA**: Zgodnie z PRD, MVP ma proste wymagania (tylko długość). Nie komplikować onboardingu.

---

### 7.2. Zabezpieczenie endpoints

#### 7.2.1. Chronionych endpoints

**Wszystkie endpoints wymagające autentykacji**:

```typescript
// Pattern dla chronionych endpoints (np. /api/v1/meals)
export const GET: APIRoute = async ({ locals }) => {
  // Krok 1: Sprawdź autentykację
  const {
    data: { user },
    error,
  } = await locals.supabase.auth.getUser();

  if (error || !user) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Authentication required",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Krok 2: Business logic z user.id
  const userId = user.id;
  // ...
};
```

**Lista endpoints do zabezpieczenia** (już istniejących):

- ✅ `/api/v1/profile` (GET, PATCH)
- ✅ `/api/v1/meals` (GET, POST, PATCH, DELETE)
- ✅ `/api/v1/daily-progress` (GET)
- ✅ `/api/v1/calorie-goals` (GET, POST, PATCH)
- ✅ `/api/v1/ai-generations` (POST)

**Publiczne endpoints** (bez auth):

- `/api/v1/auth/signup` (POST)
- `/api/v1/auth/login` (POST)
- `/api/v1/auth/logout` (POST)
- `/api/v1/auth/forgot-password` (POST)
- `/api/v1/auth/reset-password` (POST)
- `/api/v1/auth/change-password` (POST) ← wymaga auth!

---

### 7.3. CSRF protection

**Supabase automatycznie chroni przed CSRF**:

- Tokens w httpOnly cookies (nie dostępne dla JavaScript)
- SameSite=Lax attribute
- Origin checking

**Brak potrzeby własnej implementacji CSRF tokens dla MVP.**

---

### 7.4. XSS prevention

#### 7.4.1. React automatyczne escapowanie

React automatycznie escapuje content w JSX, więc:

```tsx
<p>{user.email}</p> // Bezpieczne
```

#### 7.4.2. Unikaj dangerouslySetInnerHTML

```tsx
// ❌ NIE:
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// ✅ TAK:
<div>{userInput}</div>
```

#### 7.4.3. Walidacja input

Wszystkie inputy są walidowane (Zod schemas) przed zapisem do bazy.

---

### 7.5. RLS (Row Level Security)

#### 7.5.1. Polityki izolacji danych

**Wymaganie z PRD**: "Dane poszczególnych użytkowników muszą być od siebie w pełni odizolowane."

**Implementacja**: RLS policies w Supabase (już istniejące)

```sql
-- Przykład policy dla meals
CREATE POLICY "Users can only view own meals"
  ON meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own meals"
  ON meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Analogicznie dla: profiles, calorie_goals, daily_progress, ai_generations
```

**Weryfikacja** po implementacji auth:

```sql
-- Test jako user A
SELECT * FROM meals;
-- Powinien zwrócić tylko posiłki użytkownika A

-- Próba INSERT posiłku z cudzym user_id
INSERT INTO meals (user_id, ...) VALUES ('other-user-id', ...);
-- Powinno rzucić błąd: "new row violates row-level security policy"
```

---

### 7.6. Session security

#### 7.6.1. Cookie attributes

**Supabase automatycznie ustawia**:

```http
Set-Cookie: sb-access-token=xxx;
  HttpOnly;
  Secure;
  SameSite=Lax;
  Max-Age=3600;
  Path=/
```

**Atrybuty**:

- `HttpOnly`: JavaScript nie ma dostępu (ochrona przed XSS)
- `Secure`: Tylko HTTPS (prod)
- `SameSite=Lax`: Ochrona CSRF, pozwala na top-level navigation
- `Max-Age`: Wygaśnięcie tokenu

---

#### 7.6.2. Token refresh flow

```
Access token wygasa po 1h
  ↓
Middleware wykrywa wygaśnięcie
  ↓
Supabase.auth automatycznie używa refresh token
  ↓
Nowy access token (jeszcze 1h)
  ↓
Seamless UX (user nie zauważa)
```

**Po 30 dniach** (refresh token wygaśnięcie):

- User musi się ponownie zalogować
- Zgodne z wymaganiem: "Sesja użytkownika jest utrzymywana przez 30 dni"

---

### 7.7. Compliance z RODO (GDPR)

#### 7.7.1. Przechowywanie danych

**Dane osobowe w systemie**:

- Email (auth.users i public.profiles)
- Historia posiłków (public.meals)
- Cele kaloryczne (public.calorie_goals)

**Minimalizacja danych**: Zbieramy tylko niezbędne (zgodne z MVP scope).

---

#### 7.7.2. Prawo do usunięcia danych

**Wymaganie z US-001**: "Użytkownik może poprosić o usunięcie swojego konta poprzez wysłanie prośby na wskazany adres e-mail zespołu wsparcia."

**Implementacja dla MVP**: Manual deletion przez admina (z Supabase Dashboard).

**Dla przyszłości**: Self-service deletion endpoint:

```typescript
// POST /api/v1/auth/delete-account
export const POST: APIRoute = async ({ locals }) => {
  const {
    data: { user },
  } = await locals.supabase.auth.getUser();

  // Krok 1: Usuń dane użytkownika (CASCADE dzięki FK constraints)
  await locals.supabase.from("profiles").delete().eq("id", user.id);

  // Krok 2: Usuń użytkownika z auth.users (wymaga service role key)
  await supabaseAdmin.auth.admin.deleteUser(user.id);

  // Krok 3: Wyloguj
  await locals.supabase.auth.signOut();

  return new Response(JSON.stringify({ message: "Konto zostało usunięte" }), { status: 200 });
};
```

---

### 7.8. Rate limiting

**Supabase wbudowane limity** (wystarczające dla MVP):

- 30 signup attempts / hour / IP
- 30 login attempts / hour / IP
- 10 password reset attempts / hour / IP

**Dla przyszłości**: Custom rate limiting z Redis (jeśli potrzeba):

```typescript
import { RateLimitService } from "@/lib/services/rate-limit.service";

// W auth endpoint
const rateLimiter = new RateLimitService();
const isAllowed = await rateLimiter.checkLimit(ipAddress, "login", 5, 60); // 5 prób na minutę

if (!isAllowed) {
  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Zbyt wiele prób. Spróbuj ponownie za chwilę.",
    }),
    { status: 429 }
  );
}
```

---

### 7.9. Security headers

#### 7.9.1. Aktualizacja Astro config

**Dodanie security headers** w `astro.config.mjs`:

```javascript
export default defineConfig({
  output: "server",
  vite: {
    plugins: [tailwindcss()],
  },
  server: {
    headers: {
      // HSTS (wymusza HTTPS)
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",

      // Zapobiega clickjacking
      "X-Frame-Options": "DENY",

      // Blokuje MIME type sniffing
      "X-Content-Type-Options": "nosniff",

      // XSS protection (legacy, ale nie szkodzi)
      "X-XSS-Protection": "1; mode=block",

      // Referrer policy (nie wysyłaj referrer na inne domeny)
      "Referrer-Policy": "strict-origin-when-cross-origin",

      // Content Security Policy (opcjonalnie, wymaga testowania)
      // 'Content-Security-Policy': "default-src 'self'; ..."
    },
  },
});
```

**Uwaga**: CSP wymaga dokładnej konfiguracji (inline scripts, CDN'y). Zostawić na later jeśli powoduje problemy.

---

## Podsumowanie

### Kluczowe elementy architektury

#### Frontend (Astro + React)

- **Nowe strony**: `/auth/signup`, `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/callback`
- **Nowy layout**: `AuthLayout.astro` dla stron auth
- **Nowe komponenty**: `SignupForm`, `LoginForm`, `ForgotPasswordForm`, `ResetPasswordForm`, `ChangePasswordDialog`
- **Aktualizacje**: Zabezpieczenie istniejących stron (`requireAuth()`), dodanie karty "Zmień hasło" w Settings

#### Backend (API endpoints)

- **Nowe endpoints**:
  - POST `/api/v1/auth/signup`
  - POST `/api/v1/auth/login`
  - POST `/api/v1/auth/logout`
  - POST `/api/v1/auth/forgot-password`
  - POST `/api/v1/auth/reset-password`
  - POST `/api/v1/auth/change-password`
- **Serwis**: `AuthService` z metodami dla każdej operacji auth
- **Walidacja**: Zod schemas w `auth.schemas.ts`
- **Aktualizacje**: Zamiana `DEFAULT_USER_ID` na `auth.getUser().id` we wszystkich istniejących endpoints

#### Autentykacja (Supabase)

- **Email/Password** flow z automatycznym logowaniem po signup
- **Session management**: Access token (1h) + Refresh token (30 dni)
- **RLS policies**: Izolacja danych użytkowników (już istniejące)
- **Email templates**: Reset hasła
- **Trigger**: `handle_new_user()` tworzy profil (już istniejący)

#### Bezpieczeństwo

- **Hashowanie haseł**: bcrypt (Supabase)
- **CSRF protection**: SameSite cookies (Supabase)
- **XSS prevention**: React automatic escaping + walidacja
- **Rate limiting**: Wbudowane w Supabase
- **RODO compliance**: Minimalizacja danych, prawo do usunięcia (manual w MVP)

### Kolejność implementacji (rekomendowana)

1. **Faza 1: Podstawy backend**
   - Serwis `AuthService`
   - Validation schemas
   - Types/interfaces

2. **Faza 2: API endpoints**
   - POST `/api/v1/auth/signup`
   - POST `/api/v1/auth/login`
   - POST `/api/v1/auth/logout`

3. **Faza 3: Strony auth**
   - `AuthLayout.astro`
   - `/auth/signup.astro`
   - `/auth/login.astro`
   - `SignupForm.tsx`
   - `LoginForm.tsx`

4. **Faza 4: Reset hasła**
   - POST `/api/v1/auth/forgot-password`
   - POST `/api/v1/auth/reset-password`
   - `/auth/forgot-password.astro`
   - `/auth/reset-password.astro`
   - `ForgotPasswordForm.tsx`
   - `ResetPasswordForm.tsx`

5. **Faza 5: Zmiana hasła w Settings**
   - POST `/api/v1/auth/change-password`
   - `ChangePasswordDialog.tsx`
   - Aktualizacja `Settings.tsx`

6. **Faza 6: Zabezpieczenie istniejących stron**
   - Helper `requireAuth()`
   - Aktualizacja `index.astro`, `settings.astro`, `day/[date].astro`
   - Aktualizacja wszystkich API endpoints (zamiana DEFAULT_USER_ID)

7. **Faza 7: Middleware i extras**
   - Aktualizacja middleware (session refresh)
   - `/auth/callback.astro`
   - Toast notifications
   - Security headers

8. **Faza 8: Testowanie i polish**
   - E2E testing flows
   - Error handling edge cases
   - UX improvements

### Zgodność z wymaganiami PRD

✅ **US-001**: Rejestracja z email/hasło, automatyczne logowanie, redirect na ustawienie celu
✅ **US-002**: Logowanie z weryfikacją credentials, sesja 30 dni
✅ **US-003**: Reset hasła przez email, link z tokenem (1h ważności)
✅ **US-003a**: Zmiana hasła w ustawieniach z weryfikacją aktualnego hasła
✅ **Bezpieczeństwo**: Bcrypt hashowanie (Supabase), izolacja danych (RLS)
✅ **Dostęp**: Brak dostępu do funkcji biznesowych bez logowania (requireAuth())

---

**Koniec specyfikacji technicznej modułu autentykacji.**
