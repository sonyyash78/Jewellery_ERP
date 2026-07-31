import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

const authFile = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  // Using the seeded admin user
  await loginPage.login('admin', 'admin123');
  
  // Wait until the dashboard is fully loaded
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Today\'s Sales')).toBeVisible({ timeout: 15000 });

  // Save the auth state
  await page.context().storageState({ path: authFile });
});
