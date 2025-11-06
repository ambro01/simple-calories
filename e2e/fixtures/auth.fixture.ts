/* eslint-disable react-hooks/rules-of-hooks */
// These are Playwright test fixtures, not React hooks - disable react-hooks rule for this file
import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

/**
 * Fixture for authenticated test context
 *
 * Authentication is handled by auth.setup.ts which runs ONCE before all tests
 * (via project dependencies in playwright.config.ts).
 * The authenticated state is automatically loaded from .playwright-state.json
 * for all tests, enabling safe parallel execution without race conditions.
 */
export const test = base.extend<{
  loginPage: LoginPage;
  authenticatedPage: typeof base.prototype.page;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedPage: async ({ page }, use) => {
    // No login needed here - authentication state is loaded from global setup
    // Just navigate to the dashboard to start the test
    await page.goto("/");

    // Verify we're authenticated by checking if we're on the dashboard
    await page.waitForURL("/", { timeout: 5000 });

    await use(page);
  },
});

export { expect } from "@playwright/test";
