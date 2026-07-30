import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username = 'admin', password = 'password') {
    // Fill the username
    await this.page.getByLabel('Username').fill(username);
    // Fill the password
    await this.page.getByLabel('Password').fill(password);
    // Click the login button
    await this.page.getByRole('button', { name: 'Sign In' }).click();
  }

  async expectSuccess() {
    // Expect to be redirected to dashboard
    await expect(this.page).toHaveURL('/');
    // Expect a success toast or dashboard header
    await expect(this.page.getByText('Today\'s Sales')).toBeVisible();
  }

  async expectFailure() {
    // Expect an error toast or message
    await expect(this.page.getByText(/Invalid credentials|Login failed/i)).toBeVisible();
  }
}
