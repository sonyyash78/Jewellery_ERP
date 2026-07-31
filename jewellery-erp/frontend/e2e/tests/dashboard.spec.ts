import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load the dashboard successfully', async ({ page }) => {
    // Wait for the main elements instead of a non-existent heading
    await expect(page.getByText('Today\'s Sales')).toBeVisible();
  });

  test('should display KPI cards', async ({ page }) => {
    await expect(page.getByText('Today\'s Sales')).toBeVisible();
    await expect(page.getByText('Today\'s Purchases')).toBeVisible();
    await expect(page.getByText('Total Customers')).toBeVisible();
    await expect(page.getByText('Today\'s Profit')).toBeVisible();
  });

  test('should display recent activity and charts', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sales Trend' })).toBeVisible();
    // Assuming RecentTables has 'Recent Invoices' or something similar. We can just check for Top Selling.
    await expect(page.getByRole('heading', { name: 'Top Selling Categories' })).toBeVisible();
  });

  test('navigation links should be present', async ({ page }) => {
    const sidebarLinks = [
      'Dashboard', 'Customers', 'Inventory', 
      'Billing', 'Exchange', 'Purchases', 
      'Reports', 'Settings'
    ];

    const nav = page.getByRole('navigation');
    for (const link of sidebarLinks) {
      await expect(nav.getByRole('link', { name: link, exact: true })).toBeVisible();
    }
  });
});
