import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Page Object Model for Meal Card Component
 * Implements Playwright best practices with locators
 */
export class MealCardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Get all meal cards on the page
   */
  getAllMealCards(): Locator {
    return this.page.getByTestId('meal-card');
  }

  /**
   * Get meal card by meal ID
   */
  getMealCardById(mealId: string): Locator {
    return this.page.locator(`[data-testid="meal-card"][data-meal-id="${mealId}"]`);
  }

  /**
   * Get meal card by description
   */
  getMealCardByDescription(description: string): Locator {
    return this.page
      .getByTestId('meal-card')
      .filter({ has: this.page.getByTestId('meal-card-description').filter({ hasText: description }) });
  }

  /**
   * Get meal card by description and time (for unique identification when multiple meals with same description exist)
   */
  getMealCardByDescriptionAndTime(description: string, time: string): Locator {
    return this.page
      .getByTestId('meal-card')
      .filter({
        has: this.page.getByTestId('meal-card-description').filter({ hasText: description })
      })
      .filter({
        has: this.page.getByTestId('meal-card-time').filter({ hasText: time })
      });
  }

  /**
   * Get description from meal card
   */
  async getDescription(mealCard: Locator): Promise<string> {
    return await mealCard.getByTestId('meal-card-description').textContent() || '';
  }

  /**
   * Get calories from meal card
   */
  async getCalories(mealCard: Locator): Promise<number> {
    const text = await mealCard.getByTestId('meal-card-calories').textContent() || '';
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Get time from meal card
   */
  async getTime(mealCard: Locator): Promise<string> {
    return await mealCard.getByTestId('meal-card-time').textContent() || '';
  }

  /**
   * Click edit button on meal card
   */
  async clickEdit(mealCard: Locator) {
    await mealCard.getByTestId('meal-card-edit-button').click();
  }

  /**
   * Click delete button on meal card
   */
  async clickDelete(mealCard: Locator) {
    await mealCard.getByTestId('meal-card-delete-button').click();
  }

  /**
   * Confirm delete action
   */
  async confirmDelete(mealCard: Locator) {
    const deleteDialog = mealCard.getByTestId('delete-confirm-dialog');
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByTestId('confirm-delete-button').click();
  }

  /**
   * Cancel delete action
   */
  async cancelDelete(mealCard: Locator) {
    const deleteDialog = mealCard.getByTestId('delete-confirm-dialog');
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByTestId('cancel-delete-button').click();
  }

  /**
   * Delete meal with confirmation
   */
  async deleteMeal(mealCard: Locator) {
    await this.clickDelete(mealCard);
    await this.confirmDelete(mealCard);
  }

  /**
   * Check if meal card exists by description
   */
  async mealExistsByDescription(description: string): Promise<boolean> {
    const card = this.getMealCardByDescription(description);
    return await card.count() > 0;
  }

  /**
   * Wait for meal card to disappear
   */
  async waitForMealToDisappear(mealCard: Locator) {
    await expect(mealCard).not.toBeVisible({ timeout: 10000 });
  }

  /**
   * Wait for new meal card to appear by description
   */
  async waitForMealToAppear(description: string, time?: string) {
    const card = time
      ? this.getMealCardByDescriptionAndTime(description, time)
      : this.getMealCardByDescription(description);
    await expect(card).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get count of all meal cards
   */
  async getMealCount(): Promise<number> {
    return await this.getAllMealCards().count();
  }

  /**
   * Verify meal card data
   */
  async verifyMealData(
    mealCard: Locator,
    expectedData: {
      description?: string;
      calories?: number;
      time?: string;
    }
  ) {
    if (expectedData.description) {
      const actualDescription = await this.getDescription(mealCard);
      expect(actualDescription).toBe(expectedData.description);
    }

    if (expectedData.calories) {
      const actualCalories = await this.getCalories(mealCard);
      expect(actualCalories).toBe(expectedData.calories);
    }

    if (expectedData.time) {
      const actualTime = await this.getTime(mealCard);
      expect(actualTime).toBe(expectedData.time);
    }
  }
}
