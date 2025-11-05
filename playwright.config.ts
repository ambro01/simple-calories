import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Increase timeout for slow operations like authentication */
  timeout: 60 * 1000, // 60 seconds per test
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:3000",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
    /* Take screenshot on failure */
    screenshot: "only-on-failure",
    /* Increase action timeout */
    actionTimeout: 15 * 1000, // 15 seconds for actions
    navigationTimeout: 30 * 1000, // 30 seconds for navigation
  },

  /* Configure projects for major browsers */
  projects: [
    // Setup project - runs once to authenticate and save state
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    // Chromium tests - depend on setup completing first
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        /* Use the saved authentication state from setup project */
        storageState: ".playwright-state.json",
      },
      dependencies: ["setup"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Merge with existing environment instead of replacing
      ...process.env,
      // Override with test-specific values
      SUPABASE_URL: process.env.SUPABASE_URL || '',
      PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL || '',
      SUPABASE_KEY: process.env.SUPABASE_KEY || '',
      PUBLIC_SUPABASE_KEY: process.env.PUBLIC_SUPABASE_KEY || '',
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL || '',
    },
  },
});
