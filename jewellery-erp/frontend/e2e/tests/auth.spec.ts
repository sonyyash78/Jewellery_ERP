import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Do not use the global auth setup for this file because we are testing auth
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication', () => {
  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await loginPage.expectSuccess();
  });

  test('should fail to login with invalid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong', 'wrongpassword');
    await loginPage.expectFailure();
  });

  test('should logout successfully', async ({ page }) => {
    // First login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'admin123');
    await loginPage.expectSuccess();

    // Then logout (assumes there is a logout button in the sidebar or header)
    // Finding the logout button in AdminLayout sidebar
    await page.getByRole('button', { name: 'Logout' }).click();

    // Verify redirected to login
    await expect(page).toHaveURL('/login');
  });
});
