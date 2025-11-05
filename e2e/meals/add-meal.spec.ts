/**
 * E2E Test: TC-MEAL-001 Advanced Scenarios
 *
 * Advanced test scenarios for Add Meal functionality:
 * - Macro validation warnings (TC-MEAL-002)
 * - Form validation edge cases
 * - Error handling
 * - RLS policy verification
 *
 * @see .ai/e2e-test-candidates.md - TC-MEAL-001, TC-MEAL-002
 */

import { test, expect } from "../fixtures/auth.fixture";
import { AddMealPage } from "../pages/AddMealPage";
import { createAuthenticatedTestClient, getTestUserCredentials, cleanupAllTestData } from "../utils/supabase-client";
import type { SupabaseClient } from '@supabase/supabase-js';

test.describe("TC-MEAL-001: Add Meal - Advanced Scenarios", () => {
  let supabase: SupabaseClient;
  let testUserId: string;

  test.beforeAll(async () => {
    supabase = await createAuthenticatedTestClient();
    const { userId } = getTestUserCredentials();
    testUserId = userId;
  });

  test.beforeEach(async ({ authenticatedPage }) => {
    // Clean up any existing test data before each test (meals + ai_generations)
    // Note: daily_progress view will automatically update
    try {
      await cleanupAllTestData(supabase, testUserId);
    } catch (error) {
      console.error('[CLEANUP ERROR] Failed to cleanup test data in beforeEach:', error);
      // Continue anyway - test might still work
    }

    // Navigate to today's day details page where meal cards are displayed
    const today = new Date().toISOString().split('T')[0];
    await authenticatedPage.goto(`/day/${today}`);
  });

  test.afterEach(async () => {
    // Clean up all test data after each test to ensure clean state
    // Wrapped in try-catch to ensure cleanup runs even if test failed
    try {
      await cleanupAllTestData(supabase, testUserId);
    } catch (error) {
      console.error('[CLEANUP ERROR] Failed to cleanup test data in afterEach:', error);
      // Don't throw - we want to ensure other cleanup hooks run
    }
  });

  test.afterAll(async () => {
    // Final cleanup after all tests complete
    // This ensures cleanup happens even if some afterEach hooks failed
    try {
      console.log('[FINAL CLEANUP] Running final cleanup after all tests...');
      await cleanupAllTestData(supabase, testUserId);
      console.log('[FINAL CLEANUP] Final cleanup completed successfully');
    } catch (error) {
      console.error('[CLEANUP ERROR] Failed to cleanup test data in afterAll:', error);
    }
  });

  test("should validate calories within allowed range (1-10000)", async ({ authenticatedPage: page }) => {
    const addMealPage = new AddMealPage(page);

    await addMealPage.openModal();
    await addMealPage.switchToManualMode();

    await addMealPage.fillDescription("E2E Test - Max Calories");

    // Test max value
    await addMealPage.fillCalories(10000);
    const isDisabled = await addMealPage.isSubmitDisabled();
    expect(isDisabled).toBe(false);

    // Test value above max (should show validation error)
    await addMealPage.fillCalories(10001);
    const validationError = page.locator("text=/Kalorie.*przekraczają|too high|max/i");
    await expect(validationError).toBeVisible({ timeout: 3000 });
  });

  test("should show warning for old dates (>7 days)", async ({ authenticatedPage: page }) => {
    const addMealPage = new AddMealPage(page);

    await addMealPage.openModal();
    await addMealPage.switchToManualMode();

    await addMealPage.fillDescription("E2E Test - Old Date");
    await addMealPage.fillCalories(500);

    // Set date to 10 days ago
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const pastDate = oldDate.toISOString().split("T")[0];

    await addMealPage.fillDate(pastDate);

    // Old date warning should appear (non-blocking)
    const dateWarning = page.locator("text=/stara data|old date|days ago/i");
    await expect(dateWarning).toBeVisible({ timeout: 3000 });

    // Should still be able to submit (warning, not error)
    const isDisabled = await addMealPage.isSubmitDisabled();
    expect(isDisabled).toBe(false);
  });

  test("should handle network errors gracefully", async ({ authenticatedPage: page }) => {
    const addMealPage = new AddMealPage(page);

    await addMealPage.openModal();
    await addMealPage.switchToManualMode();

    await addMealPage.fillDescription("E2E Test - Network Error");
    await addMealPage.fillCalories(500);

    // Simulate network failure
    await page.route("**/api/v1/meals", (route) => {
      route.abort("failed");
    });

    await addMealPage.submit();

    // Error message should appear
    const errorMessage = page.locator("text=/błąd|error|failed/i");
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Modal should remain open
    await expect(addMealPage.mealModal).toBeVisible();

    // Remove route interception
    await page.unroute("**/api/v1/meals");
  });

  test("should display character counter for description field", async ({ page }) => {
    const addMealPage = new AddMealPage(page);

    await addMealPage.openModal();
    await addMealPage.switchToManualMode();

    // Fill description
    const description = "Test meal description";
    await addMealPage.fillDescription(description);

    // Character counter should show current/max
    const charCounter = page.locator(`text=/${description.length}/`);
    await expect(charCounter).toBeVisible();
  });
});
