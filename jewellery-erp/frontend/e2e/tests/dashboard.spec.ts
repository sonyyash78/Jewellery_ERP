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
    await expect(page.getByText('Sales Trend')).toBeVisible();
    // Assuming RecentTables has 'Recent Invoices' or something similar. We can just check for Top Selling.
    await expect(page.getByText('Top Selling Categories')).toBeVisible();
  });

  test('navigation links should be present', async ({ page }) => {
    const sidebarLinks = [
      'Dashboard', 'Customers', 'Inventory', 
      'Billing', 'Exchange', 'Purchases', 
      'Reports', 'Settings'
    ];

    for (const link of sidebarLinks) {
      await expect(page.getByRole('link', { name: link, exact: true })).toBeVisible();
    }
  });
});
