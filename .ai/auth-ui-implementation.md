# Implementacja UI dla modułu autentykacji

## Status: ✅ Ukończone

Zaimplementowano pełny interfejs użytkownika dla procesu autentykacji zgodnie ze specyfikacją w `auth-spec.md`.

## Zaimplementowane komponenty

### 1. Layout

#### `src/layouts/AuthLayout.astro`

- Dedykowany layout dla stron autentykacyjnych
- Centrowane okno z formularzem (max-w-sm - węższe niż poprzednio)
- Logo aplikacji (zmniejszone z text-3xl do text-2xl)
- Responsywny design (mobile-first)
- Dark mode support (zgodny z głównym Layout.astro)
- SEO meta tags (noindex, nofollow)
- Favicon i generator meta tags (spójność z Layout.astro)

### 2. Komponenty wspólne

#### `src/components/auth/PasswordInput.tsx`

- Input z możliwością pokazania/ukrycia hasła
- Toggle button z ikoną oka (Eye/EyeOff)
- Pełne wsparcie dla accessibility (aria-labels)
- Integracja z shadcn/ui Input

#### `src/components/auth/AuthFormFooter.tsx`

- Reużywalny footer dla formularzy auth z linkami
- Używany w SignupForm i LoginForm

### 3. Formularze autentykacyjne

#### `src/components/auth/SignupForm.tsx`

- Formularz rejestracji użytkownika w Card komponencie
- CardHeader z tytułem i opisem
- Pola: email, hasło, potwierdzenie hasła
- Walidacja client-side (real-time po blur)
- Inline error messages
- Loading states
- Focus management dla błędów
- Accessibility (aria-invalid, aria-describedby)

#### `src/components/auth/LoginForm.tsx`

- Formularz logowania w Card komponencie
- CardHeader z tytułem i opisem
- Pola: email, hasło
- Link "Zapomniałem hasła" przy polu hasła
- Link do rejestracji w footerze
- Walidacja client-side
- Loading states

#### `src/components/auth/ForgotPasswordForm.tsx`

- Formularz żądania resetu hasła w Card komponencie
- CardHeader z tytułem i opisem (dla form state)
- Pojedyncze pole: email
- Success state w Card z ikoną Mail i komunikatem
- Możliwość wysłania ponownie
- Link powrotu do logowania

#### `src/components/auth/ResetPasswordForm.tsx`

- Formularz ustawiania nowego hasła w Card komponencie
- CardHeader z tytułem i opisem
- Pola: nowe hasło, potwierdzenie
- Obsługa błędu wygasłego tokenu z linkiem do ponownego żądania
- Link powrotu do logowania

#### `src/components/settings/ChangePasswordDialog.tsx`

- Dialog zmiany hasła w panelu ustawień
- Pola: aktualne hasło, nowe hasło, potwierdzenie
- Walidacja (nowe hasło musi być inne niż aktualne)
- Dialog UI z shadcn/ui
- Reset formularza po zamknięciu

### 4. Strony Astro

#### `src/pages/auth/signup.astro`

- Strona rejestracji
- SSR enabled (`prerender = false`)
- Placeholder dla server-side auth check
- Komunikaty błędów są teraz wewnątrz SignupForm (Card)

#### `src/pages/auth/login.astro`

- Strona logowania
- SSR enabled
- Komunikaty są teraz wewnątrz LoginForm (Card)

#### `src/pages/auth/forgot-password.astro`

- Strona żądania resetu hasła
- SSR enabled
- Komunikaty wewnątrz ForgotPasswordForm (Card)

#### `src/pages/auth/reset-password.astro`

- Strona ustawiania nowego hasła
- Walidacja tokenu (placeholder)
- Obsługa błędu wygasłego tokenu w Card komponencie z Alert

#### `src/pages/auth/callback.astro`

- Endpoint callback dla Supabase Auth
- Placeholder dla exchangeCodeForSession
- Routing użytkownika po callback

## Wzorce UI wykorzystane w implementacji

### Walidacja formularzy

- Real-time walidacja po blur
- Client-side walidacja przed submitem
- Inline error messages pod każdym polem
- Focus management - fokusowanie pierwszego błędnego pola
- Accessibility - aria-invalid, aria-describedby, role="alert"

### Loading states

```tsx
<Button disabled={isLoading}>
  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  {isLoading ? "Ładowanie..." : "Zaloguj się"}
</Button>
```

### Error display

- Alert component dla błędów ogólnych (destructive variant)
- Inline text errors dla pól formularza
- Red border dla błędnych inputów

### Accessibility

- Wszystkie pola z labelami
- Error messages z proper ARIA attributes
- Focus management
- Keyboard navigation support

## Routing flow

```
/auth/signup → Rejestracja
  ├→ Sukces → (TODO: redirect na /settings)
  └→ "Masz konto?" → /auth/login

/auth/login → Logowanie
  ├→ Sukces → (TODO: redirect na /)
  ├→ "Zapomniałem hasła" → /auth/forgot-password
  └→ "Zarejestruj się" → /auth/signup

/auth/forgot-password → Żądanie resetu
  ├→ Email wysłany → Success message
  └→ "Wróć do logowania" → /auth/login

/auth/reset-password → Ustawienie nowego hasła
  ├→ Sukces → (TODO: redirect na /auth/login?success=password_reset)
  ├→ Token wygasł → Link do /auth/forgot-password
  └→ "Wróć do logowania" → /auth/login

/auth/callback → Callback endpoint
  └→ (TODO: routing based on type: signup/recovery/etc.)
```

## Backend integration - TODO

Wszystkie formularze zawierają zakomentowany kod dla integracji z API:

```tsx
// TODO: Wywołanie API /api/v1/auth/signup
// const response = await fetch("/api/v1/auth/signup", {
//   method: "POST",
//   headers: { "Content-Type": "application/json" },
//   body: JSON.stringify({ email, password }),
// });
```

Tymczasowo wszystkie formularze pokazują `alert()` z komunikatem że UI jest gotowe.

## Następne kroki (dla backendu)

1. **API Endpoints** (zgodnie z sekcją 3 specyfikacji):
   - POST `/api/v1/auth/signup`
   - POST `/api/v1/auth/login`
   - POST `/api/v1/auth/logout`
   - POST `/api/v1/auth/forgot-password`
   - POST `/api/v1/auth/reset-password`
   - POST `/api/v1/auth/change-password`

2. **Auth Service** (`src/lib/services/auth.service.ts`):
   - Implementacja business logic dla operacji auth
   - Mapowanie błędów Supabase na przyjazne komunikaty

3. **Walidacja** (`src/lib/validation/auth.schemas.ts`):
   - Zod schemas dla wszystkich requestów

4. **Server-side auth guards**:
   - Aktualizacja istniejących stron (/, /settings, /day/[date])
   - Dodanie `requireAuth()` helper

5. **Middleware** (`src/middleware/index.ts`):
   - Automatyczne odświeżanie sesji

6. **Supabase Configuration**:
   - Email templates
   - Redirect URLs whitelist
   - Session settings (30 dni)

## Testowanie UI

Aby przetestować zaimplementowane UI:

1. Uruchom dev server:

   ```bash
   npm run dev
   ```

2. Odwiedź strony:
   - http://localhost:4321/auth/signup
   - http://localhost:4321/auth/login
   - http://localhost:4321/auth/forgot-password
   - http://localhost:4321/auth/reset-password

3. Przetestuj walidację:
   - Puste pola
   - Nieprawidłowy format email
   - Hasło < 8 znaków
   - Niezgodne hasła w potwierdzeniu

## Stylizacja

Wszystkie komponenty używają:

- Tailwind CSS classes
- shadcn/ui components (Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Button, Label, Alert, Dialog)
- Dark mode support (automatyczne wykrywanie z localStorage, zgodne z Layout.astro)
- Responsywność (mobile-first, max-w-sm dla wąskich formularzy auth)
- Card-based design dla wszystkich formularzy (spójność z SettingsCard i resztą aplikacji)
- Podobna stylistyka do istniejących komponentów (DayDetails, SettingsCard)

### Zmiany w stosunku do pierwotnej implementacji:

- ✅ AuthLayout zaktualizowany do stylu Layout.astro (theme script, favicon, meta tags)
- ✅ Formularze używają Card zamiast zwykłych div (bardziej spójne z aplikacją)
- ✅ Szerokość zmniejszona z max-w-md do max-w-sm (węższe formularze)
- ✅ Logo zmniejszone z text-3xl do text-2xl
- ✅ CardHeader z CardTitle i CardDescription zamiast zwykłych h2/p
- ✅ Wszystkie komunikaty error/success wewnątrz Card (nie na poziomie strony)

## Pliki utworzone

```
src/
├── layouts/
│   └── AuthLayout.astro                    ✅ Nowy
├── components/
│   ├── auth/
│   │   ├── index.ts                        ✅ Nowy
│   │   ├── PasswordInput.tsx               ✅ Nowy
│   │   ├── AuthFormFooter.tsx              ✅ Nowy
│   │   ├── SignupForm.tsx                  ✅ Nowy
│   │   ├── LoginForm.tsx                   ✅ Nowy
│   │   ├── ForgotPasswordForm.tsx          ✅ Nowy
│   │   └── ResetPasswordForm.tsx           ✅ Nowy
│   └── settings/
│       └── ChangePasswordDialog.tsx        ✅ Nowy
└── pages/
    └── auth/
        ├── signup.astro                    ✅ Nowy
        ├── login.astro                     ✅ Nowy
        ├── forgot-password.astro           ✅ Nowy
        ├── reset-password.astro            ✅ Nowy
        └── callback.astro                  ✅ Nowy
```

## Kompatybilność z istniejącym kodem

- ✅ Używa istniejących UI komponentów z shadcn/ui
- ✅ Zgodny z Tailwind config
- ✅ Follows Astro guidelines (.cursor/rules/astro.mdc)
- ✅ Follows React guidelines (.cursor/rules/react.mdc)
- ✅ Podobna struktura do istniejących komponentów (DayDetails)
- ✅ TypeScript strict mode compatible
- ✅ Kompiluje się bez błędów (npx tsc --noEmit ✓)
