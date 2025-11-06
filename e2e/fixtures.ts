import { test as base } from "@playwright/test";

/**
 * Extend Playwright's test fixture with custom fixtures
 * Example: Add authenticated user context, database setup, etc.
 */
type CustomFixtures = Record<string, never>;

export const test = base.extend<CustomFixtures>({
  // Add fixture implementations here
  // Example:
  // authenticatedPage: async ({ page }, use) => {
  //   await page.goto('/login');
  //   await page.fill('[name="email"]', 'test@example.com');
  //   await page.fill('[name="password"]', 'password');
  //   await page.click('button[type="submit"]');
  //   await use(page);
  // },
});

export { expect } from "@playwright/test";
