import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for Add Meal Modal
 * Implements Playwright best practices with locators
 */
export class AddMealPage {
  readonly page: Page;

  // Modal elements
  readonly addMealButton: Locator;
  readonly mealModal: Locator;
  readonly modalTitle: Locator;

  // Mode selector
  readonly modeSelector: Locator;
  readonly aiModeButton: Locator;
  readonly manualModeButton: Locator;

  // Manual mode fields
  readonly manualModeForm: Locator;
  readonly descriptionInput: Locator;
  readonly caloriesInput: Locator;
  readonly proteinInput: Locator;
  readonly carbsInput: Locator;
  readonly fatsInput: Locator;
  readonly fiberInput: Locator;

  // Common fields
  readonly categorySelector: Locator;
  readonly dateInput: Locator;
  readonly timeInput: Locator;

  // Actions
  readonly submitButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Modal
    this.addMealButton = page.getByTestId("add-meal-button");
    this.mealModal = page.getByTestId("meal-modal");
    this.modalTitle = page.getByTestId("meal-modal-title");

    // Mode selector
    this.modeSelector = page.getByTestId("mode-selector");
    this.aiModeButton = page.getByTestId("mode-ai");
    this.manualModeButton = page.getByTestId("mode-manual");

    // Manual mode
    this.manualModeForm = page.getByTestId("manual-mode-form");
    this.descriptionInput = page.getByTestId("manual-description-input");
    this.caloriesInput = page.getByTestId("manual-calories-input");
    this.proteinInput = page.getByTestId("manual-protein-input");
    this.carbsInput = page.getByTestId("manual-carbs-input");
    this.fatsInput = page.getByTestId("manual-fats-input");
    this.fiberInput = page.getByTestId("manual-fiber-input");

    // Common fields
    this.categorySelector = page.getByTestId("category-selector");
    this.dateInput = page.getByTestId("meal-date-input");
    this.timeInput = page.getByTestId("meal-time-input");

    // Actions
    this.submitButton = page.getByTestId("submit-meal-button");
    this.cancelButton = page.getByTestId("cancel-button");
  }

  /**
   * Open Add Meal modal
   */
  async openModal() {
    await this.addMealButton.click();
    await expect(this.mealModal).toBeVisible();
  }

  /**
   * Close modal by clicking cancel
   */
  async closeModal() {
    await this.cancelButton.click();
    await expect(this.mealModal).not.toBeVisible();
  }

  /**
   * Switch to manual mode
   */
  async switchToManualMode() {
    await this.manualModeButton.click();
    await expect(this.manualModeForm).toBeVisible();
  }

  /**
   * Switch to AI mode
   */
  async switchToAIMode() {
    await this.aiModeButton.click();
  }

  /**
   * Fill meal description
   */
  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  /**
   * Fill calories
   */
  async fillCalories(calories: number) {
    await this.caloriesInput.fill(calories.toString());
  }

  /**
   * Fill protein
   */
  async fillProtein(protein: number) {
    await this.proteinInput.fill(protein.toString());
  }

  /**
   * Fill carbs
   */
  async fillCarbs(carbs: number) {
    await this.carbsInput.fill(carbs.toString());
  }

  /**
   * Fill fats
   */
  async fillFats(fats: number) {
    await this.fatsInput.fill(fats.toString());
  }

  /**
   * Fill fiber (optional)
   */
  async fillFiber(fiber: number) {
    await this.fiberInput.fill(fiber.toString());
  }

  /**
   * Select category
   * @param category - breakfast, lunch, dinner, snack, other
   */
  async selectCategory(category: string) {
    const categoryButton = this.page.getByTestId(`category-${category}`);
    await categoryButton.click();
  }

  /**
   * Fill date
   * @param date - YYYY-MM-DD format
   */
  async fillDate(date: string) {
    await this.dateInput.fill(date);
  }

  /**
   * Fill time
   * @param time - HH:MM format
   */
  async fillTime(time: string) {
    await this.timeInput.fill(time);
  }

  /**
   * Submit meal form
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Wait for modal to close after successful submission
   */
  async waitForModalClose() {
    await expect(this.mealModal).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Complete manual meal entry flow
   */
  async addMealManually(mealData: {
    description: string;
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
    fiber?: number;
    category?: string;
    date?: string;
    time?: string;
  }) {
    await this.openModal();
    await this.switchToManualMode();

    // Fill required fields
    await this.fillDescription(mealData.description);
    await this.fillCalories(mealData.calories);

    // Fill optional macros
    if (mealData.protein !== undefined) {
      await this.fillProtein(mealData.protein);
    }
    if (mealData.carbs !== undefined) {
      await this.fillCarbs(mealData.carbs);
    }
    if (mealData.fats !== undefined) {
      await this.fillFats(mealData.fats);
    }
    if (mealData.fiber !== undefined) {
      await this.fillFiber(mealData.fiber);
    }

    // Fill optional common fields
    if (mealData.category) {
      await this.selectCategory(mealData.category);
    }
    if (mealData.date) {
      await this.fillDate(mealData.date);
    }
    if (mealData.time) {
      await this.fillTime(mealData.time);
    }

    await this.submit();
    await this.waitForModalClose();
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Check if submit button is loading
   */
  async isSubmitLoading(): Promise<boolean> {
    const text = await this.submitButton.textContent();
    return text?.includes("...") || false;
  }

  /**
   * Get modal title
   */
  async getModalTitle(): Promise<string> {
    return (await this.modalTitle.textContent()) || "";
  }

  /**
   * Check if modal is in edit mode
   */
  async isEditMode(): Promise<boolean> {
    const title = await this.getModalTitle();
    return title.includes("Edytuj");
  }
}
