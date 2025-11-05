import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Login Page
 * Implements Playwright best practices with locators
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly loginForm: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.getByTestId('login-form');
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
    this.errorAlert = page.locator('[role="alert"]');
  }

  /**
   * Navigate to login page
   */
  async goto() {
    await this.page.goto('/auth/login');
    await expect(this.loginForm).toBeVisible();
  }

  /**
   * Fill email field
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Click submit button
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Complete login flow with credentials
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  /**
   * Wait for successful login (redirect to dashboard)
   */
  async waitForSuccessfulLogin() {
    // Wait for URL to change to root path after login
    // Use 'load' instead of 'networkidle' because there might be ongoing network requests
    await this.page.waitForURL('/', {
      timeout: 60000,
      waitUntil: 'load'
    });
  }

  /**
   * Check if error is displayed
   */
  async hasError(): Promise<boolean> {
    return await this.errorAlert.isVisible();
  }

  /**
   * Get error message
   */
  async getErrorMessage(): Promise<string> {
    return await this.errorAlert.textContent() || '';
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button is in loading state
   */
  async isSubmitLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes('Logowanie...') || false;
  }
}
