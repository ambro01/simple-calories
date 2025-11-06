# E2E Tests - Simple Calories

> End-to-End tests using Playwright + Supabase Cloud test database

## 📁 Structure

```
e2e/
├── fixtures/           # Test fixtures (auth, data seeding)
│   └── auth.fixture.ts # Auto-login fixture
├── pages/              # Page Object Models
│   ├── LoginPage.ts
│   ├── AddMealPage.ts
│   └── MealCardPage.ts
├── utils/              # Utility functions
│   └── supabase-client.ts # Supabase helpers
└── meals/              # Test suites
    ├── add-meal.spec.ts         # TC-MEAL-001 basic scenarios
    └── add-meal-advanced.spec.ts # TC-MEAL-001 advanced scenarios
```

## 🚀 Running Tests

### Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Install Playwright browsers:

```bash
npx playwright install chromium
```

3. Ensure `.env.test` is configured with test credentials:

```env
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJxxx...
E2E_USERNAME=e2e@test.pl
E2E_PASSWORD=your-password
E2E_USERNAME_ID=uuid-here
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test File

```bash
npx playwright test e2e/meals/add-meal.spec.ts
```

### Run in UI Mode (Interactive)

```bash
npx playwright test --ui
```

### Run in Headed Mode (Watch Browser)

```bash
npx playwright test --headed
```

### Run with Debug Mode

```bash
npx playwright test --debug
```

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

## 🧪 Test Scenarios

### TC-MEAL-001: Add Meal (Manual)

**File:** `e2e/meals/add-meal.spec.ts`

#### Basic Scenarios:

1. ✅ Add meal with full data (description, calories, macros, category)
2. ✅ Add meal with minimal data (description + calories only)
3. ✅ Add meal with category selection
4. ✅ Add meal with custom date and time
5. ✅ Validation: Empty description (should disable submit)
6. ✅ Validation: Empty calories (should disable submit)
7. ✅ Cancel meal creation (should not save)
8. ✅ Add meal with fiber
9. ✅ Optimistic UI update

#### Advanced Scenarios:

**File:** `e2e/meals/add-meal-advanced.spec.ts`

1. ✅ TC-MEAL-002: Macro validation warning (>5% mismatch)
2. ✅ Consistent macros (no warning)
3. ✅ Calories range validation (1-10000)
4. ✅ Description length validation (max 500 chars)
5. ✅ Macros range validation (0-1000g)
6. ✅ Future date validation (blocking error)
7. ✅ Old date warning (>7 days, non-blocking)
8. ✅ Network error handling
9. ✅ API validation error handling
10. ✅ Form data preservation between mode switches
11. ✅ Character counter display
12. ✅ Auto-focus on description field

## 🎯 Page Object Models

### LoginPage

```typescript
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login(email, password);
await loginPage.waitForSuccessfulLogin();
```

### AddMealPage

```typescript
const addMealPage = new AddMealPage(page);

// Quick add with helper
await addMealPage.addMealManually({
  description: "Chicken with Rice",
  calories: 500,
  protein: 30,
  carbs: 40,
  fats: 20,
  category: "lunch",
});

// Or step-by-step
await addMealPage.openModal();
await addMealPage.switchToManualMode();
await addMealPage.fillDescription("...");
await addMealPage.fillCalories(500);
await addMealPage.submit();
```

### MealCardPage

```typescript
const mealCardPage = new MealCardPage(page);

const mealCard = mealCardPage.getMealCardByDescription("Chicken with Rice");
await mealCardPage.verifyMealData(mealCard, { calories: 500 });
await mealCardPage.deleteMeal(mealCard);
```

## 🗄️ Database Utilities

```typescript
import {
  createSupabaseTestClient,
  cleanupUserMeals,
  getMealByDescription,
  verifyMealExists,
} from "../utils/supabase-client";

const supabase = createSupabaseTestClient();
const { userId } = getTestUserCredentials();

// Cleanup before test
await cleanupUserMeals(supabase, userId);

// Verify meal in DB
const mealInDB = await getMealByDescription(supabase, userId, "Chicken with Rice");
expect(mealInDB?.calories).toBe(500);

// Or use helper
const exists = await verifyMealExists(supabase, userId, {
  description: "Chicken with Rice",
  calories: 500,
  protein: 30,
});
```

## 🔧 Fixtures

### Authenticated Fixture

Auto-login before test:

```typescript
import { test, expect } from "../fixtures/auth.fixture";

test("my test", async ({ authenticatedPage }) => {
  // User is already logged in
  // Page is at dashboard (/)
});
```

## 📝 Best Practices

### 1. Use Page Object Models

✅ **Good:**

```typescript
await addMealPage.fillDescription("Test");
```

❌ **Bad:**

```typescript
await page.getByTestId("manual-description-input").fill("Test");
```

### 2. Always Cleanup Test Data

```typescript
test.beforeEach(async () => {
  await cleanupUserMeals(supabase, testUserId);
});

test.afterEach(async () => {
  await cleanupUserMeals(supabase, testUserId);
});
```

### 3. Verify Both UI and Database

```typescript
// Verify in UI
await expect(mealCard).toBeVisible();

// Verify in DB
const mealInDB = await getMealByDescription(...);
expect(mealInDB).not.toBeNull();
```

### 4. Use data-testid Selectors

✅ **Good:**

```typescript
page.getByTestId("submit-meal-button");
```

❌ **Bad:**

```typescript
page.locator('button:has-text("Dodaj posiłek")');
```

### 5. Use Meaningful Test Descriptions

```typescript
test("should add meal with full data and verify in database", async () => {
  // ...
});
```

### 6. Handle Async Operations

```typescript
// Wait for UI updates
await addMealPage.waitForModalClose();

// Wait for elements
await mealCardPage.waitForMealToAppear(description);

// Use timeouts
await expect(element).toBeVisible({ timeout: 5000 });
```

## 🐛 Debugging

### View Traces

```bash
npx playwright show-trace trace.zip
```

### Screenshots on Failure

Screenshots are automatically saved to `test-results/` on failure.

### Enable Verbose Logging

```bash
DEBUG=pw:api npx playwright test
```

## 🔒 Security

- **Never commit** `.env.test` with real credentials
- Use **dedicated test account** (e2e@test.pl)
- Test database should be **isolated** from production
- **Cleanup** test data after each run

## 📚 References

- [Playwright Documentation](https://playwright.dev)
- [Test Plan](.ai/test-plan.md)
- [E2E Test Candidates](.ai/e2e-test-candidates.md)
- [Testing Rules](.cursor/rules/testing-e2e-playwright.mdc)

---

**Last Updated:** 2025-02-06
