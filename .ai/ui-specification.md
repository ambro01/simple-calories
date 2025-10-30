# UI Specification - Simple Calories MVP

## 1. Przegląd

### Filozofia Projektu
Aplikacja Simple Calories MVP jest zaprojektowana z równym priorytetem dla mobile (50%) i desktop (45%). Kluczowym założeniem jest prostota, intuicyjność i szybkość działania.

### Priorytety Platformowe
- **Mobile:** 50% użytkowników - bottom navigation, single column layouts
- **Desktop:** 45% użytkowników - sidebar navigation, two-pane layouts
- **Tablet:** 5% użytkowników - adaptacja między mobile a desktop

## 2. Design System

### Kolory

**Status Kalorii:**
- `under` (poniżej celu): gray-300
- `on_track` (cel osiągnięty): green-500
- `over` (powyżej celu): orange-500

**Akcje:**
- Primary: green-500 (przyciski główne, success)
- Destructive: red-500 (usuwanie, wylogowanie)
- Accent: blue-500 (linki, interactive elements)

**Kategorie Posiłków:**
- 🌅 Śniadanie: yellow
- ☀️ Lunch: orange
- 🌙 Kolacja: blue
- 🍪 Przekąska: green

**UI:**
- Background: white (light mode)
- Text: gray-900 (primary), gray-600 (secondary)
- Border: gray-200
- Disabled: gray-400

### Typografia

```
h1: text-3xl (desktop), text-2xl (mobile), font-bold
h2: text-2xl (desktop), text-xl (mobile), font-semibold
h3: text-xl (desktop), text-lg (mobile), font-semibold
body: text-base, font-normal, line-height 1.5
small: text-sm, font-normal
tiny: text-xs
```

### Spacing

```
Section padding: p-6 (desktop), p-4 (mobile)
Card padding: p-4 (desktop), p-3 (mobile)
Gap between items: gap-4 (desktop), gap-3 (mobile)
Border radius: rounded-lg (12px) dla kart
Container max-width: max-w-7xl (1200px) na desktop
```

### Breakpoints

```
Base (mobile):  320-640px  - single column, bottom nav
md:             768px+     - tablet, 2 kolumny
lg:             1024px+    - desktop, sidebar, two-pane
xl:             1280px+    - max-width 1200px, centered
```

## 3. Nawigacja

### Mobile (<1024px)

**Bottom Navigation Bar:**
- Pozycja: fixed bottom, full width
- Height: 64px
- 3 główne ikony:
  - **Dashboard** (home icon) - domyślny widok
  - **Add Meal** (+) - prominent, accent color
  - **Settings** (gear icon)
- Active state: ikona + label w primary color
- Inactive state: gray-600

### Desktop (≥1024px)

**Left Sidebar:**
- Szerokość: 240px (expanded), 64px (collapsed)
- Pozycja: fixed left, full height
- Zawartość:
  - Logo/nazwa aplikacji (górny)
  - Nawigacja pionowa:
    - Dashboard
    - Settings
  - FAB "Dodaj posiłek" (prominent, zielony)
  - Avatar + email użytkownika (dół)
- Collapse: hamburger icon → minimalizuje do ikon only
- Transition: 300ms smooth

## 4. Widoki Główne

### Dashboard

#### Layout Mobile

**Struktura:**
```
┌─────────────────────────────────┐
│ [Header: Logo + Avatar]         │
├─────────────────────────────────┤
│ [DayCard 1: Dzisiaj]            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 2150 / 2500 kcal           86%  │
│ 🍽️ 5 posiłków                   │
├─────────────────────────────────┤
│ [DayCard 2: Wczoraj]            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 2200 / 2500 kcal           88%  │
│ 🍽️ 4 posiłki                    │
├─────────────────────────────────┤
│ [DayCard 3: pon, 28 paź]        │
│ ...                             │
├─────────────────────────────────┤
│ [Loading indicator...]          │
└─────────────────────────────────┘
[Bottom Navigation]
```

- **Lista dni:** Single column, scroll pionowy
- **Infinite scroll:** Trigger na ostatnim elemencie
- **Load more:** 30 dni per batch
- **Skeleton loaders:** 3 szare karty podczas ładowania

#### Layout Desktop

**Struktura:**
```
┌──────────┬────────────────────────────────────┐
│ Sidebar  │ Dashboard Content                  │
│          ├────────────────┬───────────────────┤
│ [Logo]   │ Lista dni      │ Szczegóły dnia    │
│          │ (40%)          │ (60%)             │
│ Dashboard│                │                   │
│ Settings │ [DayCard 1]    │ [Day Header]      │
│          │ ━━━━━━━━━━━━  │ ━━━━━━━━━━━━━━━━│
│          │ 2150/2500 86%  │ Poniedziałek, 30  │
│          │                │ października 2025  │
│ [+ Dodaj]│ [DayCard 2]    │                   │
│          │ ━━━━━━━━━━━━  │ [Makro Summary]   │
│          │ 2200/2500 88%  │ B: 95g | T: 68g   │
│          │                │                   │
│ [Avatar] │ [DayCard 3]    │ [Meal List]       │
│          │ ...            │ 14:30 Lunch       │
│          │                │ Kanapka...        │
└──────────┴────────────────┴───────────────────┘
```

- **Two-pane layout:** Lista dni (lewa) + szczegóły (prawa)
- **Auto-select:** Dzisiejszy dzień domyślnie wybrany
- **Kliknięcie dnia:** Pokazuje szczegóły po prawej bez zmiany URL
- **Highlight:** Wybrany dzień podświetlony w liście

#### DayCard Component

**Wygląd:**
```
┌─────────────────────────────────┐
│ Dzisiaj, 30 paź 2025        [>] │ ← Data + chevron
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │ ← Progress bar (kolorowy)
│ 2150 / 2500 kcal           86%  │ ← Kalorie + procent
│ 🍽️ 5 posiłków                   │ ← Liczba posiłków
└─────────────────────────────────┘
```

**Elementy:**
- **Data:**
  - Dzisiaj: "Dzisiaj, 30 paź 2025"
  - Wczoraj: "Wczoraj, 29 paź 2025"
  - Starsze: "pon, 28 paź 2025"
- **Progress bar:**
  - Height: 8px (mobile), 12px (desktop)
  - Kolorowanie według statusu
  - Animacja wypełnienia: 0 → wartość w 0.5s
  - Rounded-full
  - Gradient fill
- **Kalorie:**
  - Bold dla current value
  - Format: "current / goal kcal"
  - Procent po prawej stronie
- **Liczba posiłków:** Ikona 🍽️ + tekst

**Style:**
- Background: white
- Border-radius: 12px
- Padding: 16px (mobile), 12px (desktop)
- Separator: 12px między kartami
- Hover/active: shadow-lg + scale(1.02)
- Transition: 300ms

### Szczegóły Dnia

#### Layout

**Header (Sticky):**
```
┌─────────────────────────────────────────┐
│ [←] Poniedziałek, 30 października 2025  │ ← Back (mobile only)
│                                          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │ ← Progress bar
│ 2150 / 2500 kcal                    86% │
│                                          │
│ Makroskładniki osiągnięte dzisiaj       │
│ ┌──────┬──────┬───────┬─────────┐      │
│ │ 95g  │ 68g  │ 245g  │  18g    │      │
│ │Białko│Tłusz.│Węgl.  │Błonnik  │      │
│ └──────┴──────┴───────┴─────────┘      │
│                                          │
│ 🍽️ 5 posiłków                     [+]   │
└─────────────────────────────────────────┘
```

**Lista Posiłków:**
- Scrollable pod headerem
- Sortowanie: chronologiczne (od najstarszego)
- Empty state: "Brak posiłków w tym dniu. Dodaj swój pierwszy!"

#### MealCard Component

**Wygląd:**
```
┌─────────────────────────────────────────┐
│ 14:30  🍽️ Lunch               [✏️] [🗑️] │ ← Czas, kategoria, akcje
│ Kanapka z szynką i serem, kawa          │ ← Opis (max 2 linie)
│ 520 kcal                                 │ ← Kalorie (bold)
│ B: 25g | T: 18g | W: 52g | Bł: 4g      │ ← Makro (jeśli dostępne)
└─────────────────────────────────────────┘
```

**Elementy:**
- **Czas:** Format 24h - "14:30"
- **Kategoria:**
  - Ikona + badge z nazwą
  - 🌅 Śniadanie (yellow)
  - ☀️ Lunch (orange)
  - 🌙 Kolacja (blue)
  - 🍪 Przekąska (green)
  - Jeśli null: 🍽️ "Nieokreślona" (gray)
- **Opis:** Max 2 linie, ellipsis jeśli dłuższy
- **Kalorie:** Bold, prominent
- **Makroskładniki:**
  - Format inline: "B: 25g | T: 18g | W: 52g | Bł: 4g"
  - Jeśli null: nie pokazuj linii
- **Akcje:**
  - Edit (pencil icon)
  - Delete (trash icon)
  - Desktop: pokazuj na hover
  - Mobile: zawsze widoczne

**Interakcje:**
- Kliknięcie karty: expand do full view
- Edit icon: otwiera modal edycji
- Delete icon: inline confirmation

**Delete Confirmation:**
```
┌──────────────────────────────────┐
│ Czy na pewno usunąć?             │
│ [Anuluj]  [Usuń]                 │ ← Usuń w red
└──────────────────────────────────┘
```
- Expand karty, pokazuj inline
- Auto-collapse po 5s bez akcji

### Dodawanie/Edycja Posiłku

#### Modal Layout

**Mobile (<768px):**
- Pełnoekranowy overlay
- Slide-up animation z dołu
- Header z przyciskami: "Anuluj" (lewo) + "Zapisz" (prawo)

**Desktop (≥768px):**
- Wyśrodkowany dialog
- Max-width: 600px
- Backdrop blur
- Fade-in + slide-in-from-bottom animation

#### Toggle AI/Manual

**Segmented Control:**
```
┌─────────────────────────────────┐
│ [✨ AI] | [ ✏️ Manual]           │
└─────────────────────────────────┘
```

**Style:**
- Full width na mobile, auto na desktop
- Active: background green-500, text white
- Inactive: background gray-100, text gray-600
- Height: 44px (mobile), 40px (desktop)
- Smooth transition: 200ms
- Sticky na górze podczas scroll (mobile)

#### Tryb AI

**Layout:**
```
┌─────────────────────────────────┐
│ [✨ AI] | [ ✏️ Manual]           │
├─────────────────────────────────┤
│ Opisz swój posiłek              │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │ (textarea 4-6 linii)        │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ 0/500                           │
│                                 │
│ Przykłady:                      │
│ [Kanapka z szynką]              │
│ [Kurczak z ryżem]               │
│ [Jogurt z owocami]              │
│                                 │
│ [Oblicz kalorie]                │
└─────────────────────────────────┘
```

**Elementy:**
- **Textarea:**
  - 4-6 linii wysokości
  - Placeholder: "Opisz swój posiłek, np. 'kanapka z szynką i serem, kawa z mlekiem'"
  - Max 500 znaków
  - Character counter pod polem
- **Przykłady:**
  - 3 clickable chips
  - Kliknięcie → wypełnia textarea
  - Inspiracja dla użytkownika
- **Przycisk:**
  - "Oblicz kalorie" (primary, green)
  - Full width na mobile
  - Disabled gdy textarea puste

**Loading State:**
```
┌─────────────────────────────┐
│  [spinner] Analizuję opis...│ ← 0-1s
│  Szacuję kalorie...         │ ← 1-3s
│  Obliczam makroskładniki... │ ← 3-5s
└─────────────────────────────┘
```
- Multi-stage feedback
- Animowany spinner
- Progress dots: ● ○ ○ → ○ ● ○ → ○ ○ ●
- Disable textarea i przycisk

**Wynik AI:**
```
┌─────────────────────────────────┐
│ Wynik analizy                   │
│                                 │
│         520 kcal                │ ← Duża liczba
│                                 │
│ ┌──────┬──────┬──────┬──────┐ │
│ │ 25g  │ 18g  │ 52g  │  4g  │ │
│ │Białko│Tłusz.│Węgl. │Błon. │ │
│ └──────┴──────┴──────┴──────┘ │
│                                 │
│ [Dodaj]                         │ ← Success button
│ [Generuj ponownie]              │ ← Secondary
│ [Edytuj ręcznie]                │ ← Link/text button
└─────────────────────────────────┘
```

**Akcje:**
- **Dodaj:** Kontynuuj do opcjonalnych pól (kategoria, data/czas)
- **Generuj ponownie:** Nowe wywołanie API z tym samym opisem
- **Edytuj ręcznie:** Przełącz na tryb Manual z prepopulowanymi wartościami

#### Tryb Manual

**Layout:**
```
┌─────────────────────────────────┐
│ [✨ AI] | [✏️ Manual]            │
├─────────────────────────────────┤
│ Opis posiłku *                  │
│ ┌─────────────────────────────┐ │
│ │ (textarea 2 linie)          │ │
│ └─────────────────────────────┘ │
│                                 │
│ Kalorie (kcal) *                │
│ [        ]                      │
│                                 │
│ Makroskładniki (opcjonalnie)    │
│ Białko (g)      Tłuszcze (g)    │
│ [      ]        [      ]        │
│                                 │
│ Węglowodany (g) Błonnik (g)     │
│ [      ]        [      ]        │
│                                 │
│ ⚠️ Suma makroskładników nie     │
│ zgadza się z kaloriami          │
│ [Przelicz automatycznie]        │
│                                 │
│ Kategoria (opcjonalnie)         │
│ ┌──┬──┬──┬──┐                  │
│ │🌅│☀️│🌙│🍪│                  │
│ │Śn│Lu│Ko│Pr│                  │
│ └──┴──┴──┴──┘                  │
│                                 │
│ Data i czas                     │
│ [30.10.2025] [14:30]            │
│                                 │
│ [Anuluj]  [Dodaj posiłek]       │
└─────────────────────────────────┘
```

**Elementy:**
- **Opis:** Textarea 2 linie, max 500 znaków, required
- **Kalorie:** Number input, 1-10000, required
- **Makroskładniki:**
  - 4 pola: Białko, Tłuszcze, Węglowodany, Błonnik
  - Number inputs, min 0
  - Opcjonalne
  - Grid 2x2 (mobile), 4x1 (desktop opcjonalnie)
- **Warning makro:**
  - Pokazuj gdy różnica >5%
  - Żółty alert box
  - Tekst: kalorie z makro vs wprowadzone + % różnicy
  - Przycisk "Przelicz automatycznie" → ustawia kalorie na wyliczone
  - Nie blokuje zapisu
- **Kategoria:**
  - Visual button group
  - 2x2 grid (mobile), 4x1 (desktop)
  - Każdy button: ikona + skrót nazwy
  - Selected: border-2 border-primary, bg-primary/10
  - Unselected: border border-gray-200, bg-white
  - Hover: border-gray-300, scale(1.02)
  - Auto-detect na podstawie czasu (default)
  - Możliwość deselect (null)
- **Data/czas:**
  - Date picker: defaultowo dzisiaj
  - Time picker: defaultowo teraz
  - Walidacja: nie w przyszłości, min 2020-01-01
  - Warning jeśli >7 dni wstecz

**Przełączanie AI ↔ Manual:**
- AI → Manual: prepopuluj wartości z AI
- Manual → AI: wyczyść formularz, zachowaj opis
- Smooth transition: fade 200ms

### Settings

#### Layout

**Lista opcji (karty):**
```
┌─────────────────────────────────┐
│ Profil                       [>]│
│ Avatar | Imię                   │
│        | Email                  │
├─────────────────────────────────┤
│ Cel kaloryczny               [>]│
│ Aktualnie: 2500 kcal           │
├─────────────────────────────────┤
│ Onboarding                   [>]│
│ Pokaż ponownie                 │
├─────────────────────────────────┤
│ Informacje                   [>]│
│ Wersja, O aplikacji            │
├─────────────────────────────────┤
│ Wyloguj                         │ ← Red color
└─────────────────────────────────┘
```

**Struktura:**
- Każda opcja jako karta z chevron right
- Separator między sekcjami
- Profil i email readonly (z Supabase)
- Wyloguj na dole, czerwony, z confirmation modal

#### Edycja Celu Kalorycznego

**Mobile:** Pełnoekranowy widok
**Desktop:** Modal (max-width: 500px)

**Layout:**
```
┌─────────────────────────────────┐
│ Cel kaloryczny                  │
│                                 │
│ Twój dzienny cel kaloryczny     │
│ [        ] kcal                 │
│                                 │
│ Aktualnie: 2500 kcal           │
│                                 │
│ ℹ️ Zalecane dzienne spożycie    │
│ dla przeciętnej osoby to        │
│ 2000-2500 kcal. Dostosuj cel    │
│ do swoich potrzeb.              │
│                                 │
│ [Anuluj]  [Zapisz]              │
└─────────────────────────────────┘
```

### Onboarding

#### Trigger
- Pierwszy raz po zalogowaniu
- Flag w localStorage: `onboarding_completed`

#### Layout

**Pełnoekranowy overlay:**
```
┌─────────────────────────────────┐
│ Krok 1/3              [Pomiń]   │ ← Top bar
│                                 │
│     [Ilustracja ✨]             │ ← Ikona/emoji duży
│                                 │
│   Witaj w Simple Calories! 🎉  │ ← H1
│                                 │
│ Śledź swoje kalorie z pomocą   │
│ AI. Wystarczy opisać posiłek,  │ ← Body text
│ a my obliczymy kalorie za      │
│ Ciebie!                         │
│                                 │
│           ● ○ ○                 │ ← Dots indicator
│                                 │
│                 [Dalej →]       │ ← CTA button
└─────────────────────────────────┘
```

**3 Kroki:**
1. **Powitanie + AI concept:**
   - Ilustracja: ✨ (sparkles)
   - Tytuł: "Witaj w Simple Calories! 🎉"
   - Tekst: Wyjaśnienie koncepcji AI
2. **Jak dodawać posiłki:**
   - Ilustracja: ➕ (plus)
   - Tytuł: "Dodawanie posiłków"
   - Bullets: Tryb AI, Tryb Manual, Makroskładniki
3. **Dashboard i cel:**
   - Ilustracja: 📊 (chart)
   - Tytuł: "Twój Dashboard"
   - Tekst: Pasek postępu, kolory statusu

**Elementy:**
- Przycisk "Pomiń" (top-right) - zawsze widoczny
- Dots indicator: ● (aktywny), ○ (nieaktywny)
- Nawigacja: "Dalej" / "Wstecz" + "Rozpocznij!" (ostatni krok)
- Swipe gestures na mobile
- Ilustracje: duże emoji (text-8xl) lub simple SVG

**Zakończenie:**
- "Rozpocznij!" → redirect na dashboard
- Zapisz flagę completed

## 5. Komponenty UI

### CalorieProgress

**Progress Bar z Kolorami Statusu:**

```typescript
<CalorieProgress
  current={2150}
  goal={2500}
  status="on_track"
/>
```

**Wygląd:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ← Progress bar (kolorowy)
2150 / 2500 kcal                  86% ← Label
```

**Style:**
- Height: 8px (mobile), 12px (desktop)
- Border-radius: full
- Gradient fill
- Kolory według statusu: gray/green/orange
- Animacja: 0 → wartość w 0.5s (ease-out)
- Label nad paskiem: current bold
- Procent pod paskiem: delikatny kolor

### MacroDisplay

**3 Warianty:**

**1. Inline (karty posiłków):**
```
B: 25g | T: 18g | W: 52g | Bł: 4g
```

**2. Grid (header dnia, wynik AI):**
```
┌──────┬──────┬──────┬──────┐
│ 95g  │ 68g  │ 245g │ 18g  │
│Białko│Tłusz.│Węgl. │Błon. │
└──────┴──────┴──────┴──────┘
```

**3. Compact (gdy brak miejsca):**
```
520 kcal • B: 25g T: 18g W: 52g
```

**Null Handling:**
- Grid: pokazuj "-"
- Inline: nie pokazuj linii w ogóle
- Compact: pomiń null wartości

### Toast Notifications

**Pozycja:**
- Mobile: top-center
- Desktop: top-right

**Warianty:**
- Success: ✓ ikona, green accent
- Error: ✕ ikona, red accent
- Warning: ⚠️ ikona, orange accent
- Info: ℹ️ ikona, blue accent

**Behavior:**
- Auto-dismiss: 3s (success), 5s (error)
- Stack: max 3 jednocześnie
- Animation: slide-in-from-top (200ms)
- Close button (X) po prawej

**Przykłady:**
- "Posiłek dodany"
- "Cel kaloryczny zaktualizowany"
- "Nie udało się usunąć posiłku. Spróbuj ponownie"

### Loading States

**Skeleton Loaders:**
- Lista dni: 3 szare karty z pulsing animation
- Szczegóły dnia: header skeleton + 2-3 meal skeletons
- Używaj `animate-pulse` z Tailwind

**Spinners:**
- Przyciski podczas akcji: mały spinner w przycisku
- AI generowanie: duży spinner + multi-stage tekst
- Standard: `animate-spin` icon

### Error States

**Empty States:**

**1. Dashboard bez dni:**
```
┌─────────────────────────────┐
│    [Ilustracja 🍽️]          │
│                             │
│  Zacznij swoją przygodę!   │
│  Dodaj pierwszy posiłek     │
│                             │
│     [+ Dodaj posiłek]       │
└─────────────────────────────┘
```

**2. Dzień bez posiłków:**
```
┌─────────────────────────────┐
│   [Ikona 🍴]                │
│                             │
│   Brak posiłków w tym dniu  │
│   Dodaj swój pierwszy!      │
│                             │
│        [+ Dodaj]            │
└─────────────────────────────┘
```

**Error Messages:**
- Ikona błędu (⚠️)
- Przyjazny tekst wyjaśniający
- Przycisk akcji (Retry/Home)
- Przykład: "Coś poszło nie tak. Spróbuj ponownie."

## 6. Interakcje i Animacje

### Transitions

```css
Buttons: transition-all duration-200 hover:scale-105
Cards: transition-shadow duration-300 hover:shadow-lg
Modals: animate-in fade-in slide-in-from-bottom duration-300
Toast: animate-in slide-in-from-top duration-200
Progress bar: transition-all duration-500 ease-out
```

### Hover States

**Desktop:**
- Cards: shadow-lg + scale(1.02)
- Buttons: scale(1.05) + brightness increase
- Links: underline + color change
- Meal card actions: opacity 0 → 1 (edit/delete icons)

**Mobile:**
- Active state zamiast hover
- Touch feedback: scale(0.98) during press
- Ripple effect dla buttons

### Focus States

- Visible focus ring: `ring-2 ring-blue-500`
- Outline offset: 2px
- Keyboard navigation: logical tab order
- Skip to main content link (ukryty do focus)

### Animations

**Subtle, nie przesadzone:**
- Progress bar fill: ease-out, 500ms
- Modal open: fade + slide, 300ms
- Toast: slide-in, 200ms
- List items: stagger effect (opcjonalnie)
- Loading spinner: `animate-spin`
- Skeleton: `animate-pulse`

**Accessibility:**
- Respektuj `prefers-reduced-motion: reduce`
- Disable animations jeśli użytkownik preferuje
- Max duration: 500ms

## 7. Responsywność

### Layout Adaptations

**Navigation:**
- Mobile: Bottom bar (3 ikony)
- Desktop: Left sidebar (expandable)

**Dashboard:**
- Mobile: Single column list
- Desktop: Two-pane (list + details)

**Modals:**
- Mobile: Fullscreen overlay
- Desktop: Centered dialog (600px)

**Forms:**
- Mobile: Full width inputs, stack vertical
- Desktop: Grid layout dla pól (2 kolumny gdzie sens)

### Touch Targets

**Mobile:**
- Minimum: 44x44px
- Buttons: 44px height
- Icons: 24x24px z padding do 44px
- List items: 60px minimum height

**Desktop:**
- Minimum: 40x40px
- Smaller targets acceptable (precyzyjniejszy kursor)

### Typography Scaling

**Base (mobile):**
```
h1: 24px (text-2xl)
h2: 20px (text-xl)
body: 16px (text-base)
small: 14px (text-sm)
```

**Desktop (lg+):**
```
h1: 30px (text-3xl)
h2: 24px (text-2xl)
body: 16px (text-base)
small: 14px (text-sm)
```

### Images/Icons

**Mobile:** 64-96px dla ilustracji
**Desktop:** 96-128px dla ilustracji
**Icons:** 20-24px standardowo

## 8. Accessibility

### Semantic HTML

```html
<main> - główna treść
<nav> - nawigacja
<header> - nagłówki sekcji
<form> - formularze
<button> - akcje (NIE <div onClick>)
```

### ARIA Labels

**Przykłady:**
```html
<button aria-label="Dodaj posiłek">+</button>
<progress aria-label="Postęp kaloryczny" value={86} max={100} />
<nav aria-label="Główna nawigacja">
<div role="alert" aria-live="polite"> <!-- toasty -->
```

### Keyboard Navigation

- **Tab:** Przechodzenie między elementami
- **Enter/Space:** Aktywacja buttonów
- **Escape:** Zamykanie modali
- **Arrow keys:** Nawigacja w listach (opcjonalnie)
- **Focus trap:** W modalach
- **Return focus:** Po zamknięciu modala

### Color Contrast

- **Minimum:** WCAG AA (4.5:1 dla tekstu)
- **Nie tylko kolor:** Ikony + tekst dla statusów
- **Focus indicators:** Zawsze widoczne
- **Test:** Lighthouse accessibility audit

### Screen Readers

- Alt text dla ilustracji
- Loading states ogłaszane
- Error messages w `role="alert"`
- Skip to main content
- Descriptive labels dla wszystkich inputs

## 9. Szczegóły Przepływów Użytkownika

### Flow: Dodawanie Posiłku (AI)

1. Użytkownik klika FAB "+" lub "Dodaj posiłek"
2. Otwiera się modal z trybem AI active (default)
3. Użytkownik wpisuje opis w textarea
4. Klika "Oblicz kalorie"
5. Pokazuje się loading (multi-stage, 2-5s)
6. Wyświetla się wynik: kalorie + makro w grid
7. Użytkownik ma 3 opcje:
   - **Dodaj:** Kontynuuj do opcjonalnych pól
   - **Generuj ponownie:** Nowe API call
   - **Edytuj ręcznie:** Switch na Manual z prepopulacją
8. Po wyborze "Dodaj" - pokazują się pola kategoria + data/czas
9. Użytkownik wypełnia opcjonalnie lub zostawia defaulty
10. Klika "Dodaj posiłek"
11. Modal zamyka się, toast "Posiłek dodany", lista odświeża się

### Flow: Dodawanie Posiłku (Manual)

1. Użytkownik klika "+"
2. Modal otwiera się, przełącza na tryb Manual
3. Wypełnia pola:
   - Opis (required)
   - Kalorie (required)
   - Makroskładniki (opcjonalnie)
   - Kategoria (opcjonalnie, auto-detect)
   - Data/czas (defaulty: dzisiaj, teraz)
4. Jeśli makro ≠ kalorie (>5%): pokazuje się warning żółty
5. Użytkownik może kliknąć "Przelicz automatycznie" lub ignorować
6. Klika "Dodaj posiłek"
7. Walidacja: jeśli błędy → pokazuje pod polami
8. Jeśli OK: modal zamyka, toast success, lista odświeża

### Flow: Usuwanie Posiłku

1. Użytkownik klika ikonę trash na MealCard
2. Karta expanduje się inline, pokazuje confirmation:
   - "Czy na pewno usunąć?"
   - [Anuluj] [Usuń (red)]
3. Jeśli Usuń:
   - Karta znika (fade-out animation)
   - API DELETE call
   - Toast "Posiłek usunięty"
   - Lista odświeża się
4. Jeśli Anuluj lub 5s timeout:
   - Karta wraca do normal state

### Flow: Edycja Celu Kalorycznego

1. Użytkownik przechodzi do Settings
2. Klika "Cel kaloryczny" kartę
3. Otwiera się modal/screen z formularzem
4. Widzi aktualny cel: "Aktualnie: 2500 kcal"
5. Wprowadza nową wartość (1-10000)
6. Klika "Zapisz"
7. Modal zamyka się
8. Toast "Cel kaloryczny zaktualizowany"
9. Dashboard odświeża się z nowym celem

### Flow: Wylogowanie

1. Użytkownik w Settings klika "Wyloguj" (red)
2. Pokazuje się AlertDialog:
   - "Czy na pewno chcesz się wylogować?"
   - [Anuluj] [Wyloguj]
3. Jeśli Wyloguj:
   - Supabase auth logout
   - Redirect do login screen
   - Clear local state
4. Jeśli Anuluj:
   - Modal zamyka się, zostaje w Settings

## 10. Konwencje Wizualne

### Ikony

**Źródło:** Lucide Icons (lub Emoji jako fallback)

**Standardowe ikony:**
- Home (Dashboard): `home`
- Add: `plus`, `plus-circle`
- Settings: `settings`, `gear`
- Edit: `pencil`, `edit-2`
- Delete: `trash`, `trash-2`
- Back: `arrow-left`, `chevron-left`
- Forward: `arrow-right`, `chevron-right`
- Calendar: `calendar`
- Clock: `clock`
- User: `user`, `user-circle`

**Rozmiary:**
- Small: 16px
- Default: 20px
- Medium: 24px
- Large: 32px

### Emoji

**Kategorie posiłków:**
- 🌅 Śniadanie
- ☀️ Lunch
- 🌙 Kolacja
- 🍪 Przekąska
- 🍽️ Nieokreślona

**Empty states:**
- 🍽️ Brak dni
- 🍴 Brak posiłków

**Onboarding:**
- ✨ AI (krok 1)
- ➕ Dodawanie (krok 2)
- 📊 Dashboard (krok 3)

**Feedback:**
- ✅ Success
- ❌ Error
- ⚠️ Warning
- ℹ️ Info

### Shadows

```css
sm: 0 1px 2px rgba(0,0,0,0.05)     /* Subtelny */
md: 0 4px 6px rgba(0,0,0,0.1)      /* Karty */
lg: 0 10px 15px rgba(0,0,0,0.1)    /* Hover, modals */
xl: 0 20px 25px rgba(0,0,0,0.1)    /* Prominent */
```

### Borders

```css
Width: 1px (default), 2px (selected/active)
Radius:
  - sm: 6px (małe elementy)
  - md: 8px (buttons)
  - lg: 12px (cards)
  - full: 9999px (progress bars, pills)
Color: gray-200 (default), primary (active)
```

### Spacing Scale

```
0: 0px
1: 4px
2: 8px
3: 12px
4: 16px
5: 20px
6: 24px
8: 32px
10: 40px
12: 48px
16: 64px
20: 80px
```

**Użycie:**
- Padding wewnętrzny: 4 (mobile), 6 (desktop)
- Margin między elementami: 3-4
- Gap w grid/flex: 3-4
- Section spacing: 8-12

## 11. Podsumowanie Kluczowych Decyzji

### Layout
- ✅ Mobile (50%) i Desktop (45%) równy priorytet
- ✅ Bottom nav (mobile) + Sidebar (desktop)
- ✅ Dashboard: lista (mobile) vs two-pane (desktop)
- ✅ Modals: fullscreen (mobile) vs dialog (desktop)

### Formularze
- ✅ Jeden komponent MealForm dla create/edit
- ✅ Toggle AI/Manual na górze (segmented control)
- ✅ AI: textarea → wynik → akcje
- ✅ Manual: pola liczbowe + walidacja makro (warning, nie block)
- ✅ Kategoria: visual button group z ikonami
- ✅ Date/time: pickers z defaultami (dzisiaj, teraz)

### Wizualizacja Danych
- ✅ Progress bar kolorowy (gray/green/orange) według statusu
- ✅ Makroskładniki: grid (header) vs inline (karty)
- ✅ Daty: kontekstowe ("Dzisiaj", "Wczoraj", data)
- ✅ Kalorie: bold, prominent, z goalem i procentem

### UX Patterns
- ✅ Toast notifications dla feedbacku
- ✅ Inline confirmation dla delete
- ✅ Modal confirmation dla logout
- ✅ Empty states z ilustracjami + CTA
- ✅ Loading: skeleton (listy) + spinner (akcje) + multi-stage (AI)
- ✅ Onboarding: 3 kroki, fullscreen, możliwość skip

### Accessibility
- ✅ Semantic HTML + ARIA labels
- ✅ Keyboard navigation + focus management
- ✅ WCAG AA color contrast
- ✅ Screen reader support
- ✅ prefers-reduced-motion support

### Design System
- ✅ Tailwind CSS + Shadcn/ui
- ✅ Kolory: green (success), orange (warning), gray (neutral), red (destructive)
- ✅ Typography: system-ui, responsive scale
- ✅ Spacing: 4/8/12/16px system
- ✅ Animations: subtle, max 500ms, GPU-accelerated
