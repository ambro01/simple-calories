# E2E Test Candidates - Playground Priorities

> **Kontekst:** Testy E2E z Playwright + Supabase Cloud (baza testowa)
> **Cel:** Identyfikacja najlepszych kandydatów do automatyzacji critical user flows

---

## 🎯 **Top Priority - Critical User Flows**

### 1. **TC-MEAL-001: Dodawanie Posiłku (Manual)**
**Flow:** UI → API → Supabase → Update UI

**Kroki:**
1. User otwiera AddMeal dialog
2. Wypełnia formularz (prompt, description, calories, macros)
3. Klika "Add Meal"
4. POST /api/v1/meals
5. Weryfikacja w bazie + UI update (meal card widoczna)
6. Cleanup: DELETE meal z bazy testowej

**Pokrycie:**
- Form validation
- API integration
- RLS policies
- Optimistic updates

**Priorytet:** ⭐⭐⭐⭐⭐

---

### 2. **TC-AI-001: Generowanie Posiłku przez AI**
**Flow:** UI → OpenAI API → Parser → Supabase → UI

**Kroki:**
1. User wpisuje prompt "2 jajka na bekonie"
2. Klika "Generate with AI"
3. POST /api/v1/ai/generate
4. Spinner → AI response
5. Form auto-fill (description, calories, macros)
6. User klika "Add Meal"
7. Weryfikacja w bazie

**Pokrycie:**
- AI integration
- Error handling (rate limit)
- Parsing logic
- user_status='ai_edited'

**Priorytet:** ⭐⭐⭐⭐⭐

---

### 3. **TC-MEAL-004: Edycja Posiłku**
**Flow:** Read → Update → Verify

**Kroki:**
1. Seed meal w bazie testowej
2. User klika edit icon na meal card
3. EditMeal dialog (pre-filled)
4. Zmienia calories: 500 → 600
5. Klika "Update"
6. PATCH /api/v1/meals/:id
7. Weryfikacja: meal card pokazuje 600 kcal
8. Weryfikacja w bazie: updated_at timestamp

**Pokrycie:**
- Optimistic updates
- Conflict resolution
- user_status changes

**Priorytet:** ⭐⭐⭐⭐⭐

---

### 4. **TC-MEAL-005: Usuwanie Posiłku**
**Flow:** UI action → Soft delete → UI update

**Kroki:**
1. Seed meal w bazie
2. User klika delete icon
3. Confirmation modal (opcjonalne)
4. DELETE /api/v1/meals/:id
5. Meal card znika z UI
6. Weryfikacja w bazie: deleted_at NOT NULL
7. Progress bar update (calories decrease)

**Pokrycie:**
- Soft delete logic
- Cascade effects
- UI consistency

**Priorytet:** ⭐⭐⭐⭐⭐

---

## 🔥 **High Priority - Complex Scenarios**

### 5. **TC-PROGRESS-001: Daily Progress Tracking**
**Flow:** Multi-meal aggregate + real-time calc

**Kroki:**
1. Seed calorie_goal = 2000 kcal
2. Seed 3 meals: 400 + 600 + 500 = 1500 kcal
3. Navigate to dashboard
4. Weryfikacja:
   - Progress bar: 75% (1500/2000)
   - "500 kcal remaining"
   - Meal cards sorted by time
5. Add 4th meal (600 kcal)
6. Progress bar update: 105% (2100/2000)
7. Color change: green → red (over budget)

**Pokrycie:**
- Aggregations
- Reactive updates
- Visual feedback

**Priorytet:** ⭐⭐⭐⭐

---

### 6. **TC-PROGRESS-004: Calendar Navigation**
**Flow:** Date filtering + persistence

**Kroki:**
1. Current date: 2025-02-06
2. Seed meals: 2 today, 3 yesterday
3. Click "Previous Day" button
4. URL update: ?date=2025-02-05
5. Weryfikacja: 3 meal cards visible
6. Click "Next Day"
7. Back to today (2 meals)
8. Refresh page → date persists

**Pokrycie:**
- Query params
- Date filtering
- URL state

**Priorytet:** ⭐⭐⭐⭐

---

### 7. **TC-GOAL-001: Ustawianie Celu Kalorycznego**
**Flow:** First-time setup + update

**Kroki:**
1. New user (no calorie_goal)
2. Modal "Set Your Goal" auto-opens
3. Input: 2200 kcal
4. Click "Save"
5. POST /api/v1/calorie-goals
6. Modal closes
7. Progress bar appears (0/2200)
8. Edit goal: 2200 → 2500
9. PATCH /api/v1/calorie-goals/:id
10. Progress bar recalculates

**Pokrycie:**
- Onboarding
- CRUD
- Dependent calculations

**Priorytet:** ⭐⭐⭐⭐

---

## ⚙️ **Medium Priority - Edge Cases**

### 8. **TC-AI-008: Rate Limiting**
**Flow:** Quota enforcement

**Kroki:**
1. User generuje 20 AI requests (daily limit)
2. 21st request → 429 Too Many Requests
3. UI shows: "Daily limit reached. Try tomorrow."
4. Button disabled
5. Mock time +24h → button re-enabled

**Pokrycie:**
- Rate limit logic
- Error states
- User feedback

**Priorytet:** ⭐⭐⭐

---

### 9. **TC-MEAL-002: Macro Validation Conflict**
**Flow:** Inconsistent macros detection

**Kroki:**
1. User fills form:
   - Calories: 500
   - Protein: 10g, Carbs: 10g, Fats: 5g
   - Calculated: 10*4 + 10*4 + 5*9 = 125 kcal
   - Difference: (500-125)/500 = 75% > 5%
2. Warning appears: "Macros don't match calories"
3. user_status = 'user_edited' (not 'clean')
4. Meal saves anyway (non-blocking)

**Pokrycie:**
- Validation warnings
- Data quality flags

**Priorytet:** ⭐⭐⭐

---

### 10. **TC-MEAL-007: Concurrent Edits**
**Flow:** Optimistic UI + conflict resolution

**Kroki:**
1. User A opens edit dialog (meal v1)
2. User B edits same meal (meal v2)
3. User A submits changes
4. Conflict detection (updated_at mismatch)
5. Error: "Meal was modified. Reload?"
6. User A reloads → sees B's changes

**Pokrycie:**
- Concurrency
- Optimistic locking
- UX recovery

**Priorytet:** ⭐⭐

---

## 📊 **Rekomendowana Kolejność Implementacji**

### **Sprint 1: Core CRUD (Tydzień 1)**
1. ✅ **TC-MEAL-001** - Add Meal (manual)
2. ✅ **TC-MEAL-004** - Edit Meal
3. ✅ **TC-MEAL-005** - Delete Meal

**Uzasadnienie:** Podstawowe operacje CRUD to fundament aplikacji. Testowanie tych flows zapewnia stabilność dla dalszych feature'ów.

---

### **Sprint 2: AI + Progress (Tydzień 2)**
4. ✅ **TC-AI-001** - AI Generation
5. ✅ **TC-PROGRESS-001** - Daily Progress
6. ✅ **TC-PROGRESS-004** - Calendar Navigation

**Uzasadnienie:** AI generation to kluczowa wartość aplikacji. Progress tracking pokazuje real-time calculations i agregacje.

---

### **Sprint 3: Advanced (Tydzień 3)**
7. ✅ **TC-GOAL-001** - Set Calorie Goal
8. ⚠️ **TC-AI-008** - Rate Limiting
9. ⚠️ **TC-MEAL-002** - Macro Validation
10. ⚠️ **TC-MEAL-007** - Concurrent Edits

**Uzasadnienie:** Edge cases i advanced scenarios. Mogą wymagać dodatkowych mocków lub setup'u.

---

## 🛠️ **Struktura Testów E2E**

### Przykład: TC-MEAL-001

```typescript
// e2e/meals/add-meal.spec.ts
import { test, expect } from '@playwright/test';
import { createSupabaseClient } from '../utils/supabase-client';

test.describe('TC-MEAL-001: Add Meal (Manual)', () => {
  let supabase;
  let mealId: string;

  test.beforeEach(async ({ page }) => {
    // Initialize Supabase client for test DB
    supabase = createSupabaseClient();

    // Login to test account
    await page.goto('/login');
    await page.fill('[name="email"]', process.env.TEST_USER_EMAIL);
    await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForURL('/dashboard');
  });

  test('should add meal manually and verify in DB', async ({ page }) => {
    // 1. Open AddMeal dialog
    await page.click('[data-testid="add-meal-button"]');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // 2. Fill form (manual mode - no AI)
    await page.fill('[name="description"]', 'Test Meal E2E');
    await page.fill('[name="calories"]', '500');
    await page.fill('[name="protein"]', '30');
    await page.fill('[name="carbs"]', '40');
    await page.fill('[name="fats"]', '20');
    await page.selectOption('[name="category"]', 'lunch');

    // 3. Submit
    await page.click('button:has-text("Add Meal")');

    // 4. Verify UI update
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    await expect(page.locator('text=Test Meal E2E')).toBeVisible();
    await expect(page.locator('text=500 kcal')).toBeVisible();

    // 5. Verify DB
    const { data: meals } = await supabase
      .from('meals')
      .select('*')
      .eq('description', 'Test Meal E2E')
      .order('created_at', { ascending: false })
      .limit(1);

    expect(meals).toHaveLength(1);
    mealId = meals[0].id;
    expect(meals[0].calories).toBe(500);
    expect(meals[0].protein_grams).toBe(30);
    expect(meals[0].user_status).toBe('user_edited');
  });

  test.afterEach(async () => {
    // 6. Cleanup
    if (mealId) {
      await supabase.from('meals').delete().eq('id', mealId);
    }
  });
});
```

---

## 🔧 **Setup Requirements**

### 1. Environment Variables
```bash
# .env.test
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test123
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # For cleanup operations
```

### 2. Playwright Config
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### 3. Test Utils
```typescript
// e2e/utils/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

---

## 📈 **Success Metrics**

- **Coverage:** 80%+ critical user flows
- **Execution Time:** <5 min per test suite
- **Flakiness:** <2% failure rate
- **Maintenance:** Test updates w ciągu 1 dnia po feature change

---

## 🚨 **Known Challenges**

### 1. **AI API Mocking**
**Problem:** OpenAI calls są kosztowne i non-deterministic
**Rozwiązanie:** Mock AI responses w test environment:
```typescript
// Mock w MSW lub Playwright
await page.route('**/api/v1/ai/generate', (route) => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({
      description: 'Mocked AI Meal',
      calories: 500,
      // ...
    }),
  });
});
```

### 2. **Date/Time Dependencies**
**Problem:** Tests zależne od current date mogą failować
**Rozwiązanie:** Mock system time:
```typescript
await page.addInitScript(() => {
  Date.now = () => new Date('2025-02-06T12:00:00Z').getTime();
});
```

### 3. **Supabase RLS**
**Problem:** Test user może nie mieć dostępu do danych innych userów
**Rozwiązanie:** Używaj `service_role_key` tylko do cleanup, nie do assertions

---

## 🎓 **Best Practices**

1. **Seed Data:** Zawsze seeduj dane na początku testu (nie zakładaj istniejących)
2. **Cleanup:** Zawsze usuwaj test data w `afterEach` (nawet jeśli test failuje)
3. **Assertions:** Weryfikuj UI + DB (double confirmation)
4. **Timeouts:** Używaj `waitFor` zamiast `sleep` (lepsze error messages)
5. **Test Isolation:** Każdy test powinien działać niezależnie (no shared state)

---

**Ostatnia aktualizacja:** 2025-02-06
**Autor:** Claude (AI Assistant)
