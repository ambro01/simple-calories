import { test, expect } from './fixtures';

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Basic assertion that the page loaded
    expect(page.url()).toContain('localhost:4321');
  });

  test('should have a title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check that the page has a title (adjust based on your actual title)
    await expect(page).toHaveTitle(/Simple Calories|Calories|Home/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for a login link/button (adjust selector based on your actual UI)
    const loginButton = page.getByRole('link', { name: /zaloguj|login|sign in/i });

    // If login button exists, click it and verify navigation
    const loginExists = await loginButton.count() > 0;
    if (loginExists) {
      await loginButton.first().click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});

test.describe('Visual regression', () => {
  test('homepage should match snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Take a screenshot for visual regression testing
    await expect(page).toHaveScreenshot('homepage.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });
});
