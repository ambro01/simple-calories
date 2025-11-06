/**
 * Authentication Setup Test
 *
 * This test runs ONCE before all other tests (via project dependencies).
 * It logs in the test user and saves the authentication state,
 * which is then reused by all tests for better performance
 * and to avoid race conditions during parallel execution.
 *
 * This runs AFTER webServer starts, so the app is ready to use.
 */

import { test as setup } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import { getTestUserCredentials } from "./utils/supabase-client";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORAGE_STATE_PATH = path.join(__dirname, "..", ".playwright-state.json");

setup("authenticate", async ({ page }) => {
  console.log("[Auth Setup] Starting one-time authentication...");

  const loginPage = new LoginPage(page);
  const { email, password } = getTestUserCredentials();

  console.log("[Auth Setup] Logging in as:", email);

  // Monitor network requests
  page.on("response", async (response) => {
    if (response.url().includes("/api/v1/auth/login")) {
      console.log("[Auth Setup] Login API response status:", response.status());

      // Check Set-Cookie headers
      const headers = response.headers();
      console.log("[Auth Setup] Set-Cookie headers:", headers["set-cookie"] || "NONE");

      try {
        const body = await response.json();
        console.log("[Auth Setup] Login API response:", JSON.stringify(body));
      } catch {
        console.log("[Auth Setup] Could not parse response body");
      }

      // Check cookies after login API call
      const cookies = await page.context().cookies();
      console.log("[Auth Setup] Cookies after login API:", cookies.map((c) => c.name).join(", "));
    }
  });

  await loginPage.goto();
  await loginPage.login(email, password);

  console.log("[Auth Setup] Login form submitted, current URL:", page.url());

  // Wait a bit for cookies to be set
  await page.waitForTimeout(2000);

  const cookiesBeforeRedirect = await page.context().cookies();
  console.log(
    "[Auth Setup] Cookies before redirect:",
    cookiesBeforeRedirect.map((c) => `${c.name}=${c.value.substring(0, 20)}...`).join(", ")
  );

  await loginPage.waitForSuccessfulLogin();

  console.log("[Auth Setup] Login successful, saving authentication state...");

  // Save the authenticated state to a file
  await page.context().storageState({ path: STORAGE_STATE_PATH });

  console.log("[Auth Setup] Authentication state saved to:", STORAGE_STATE_PATH);
});
