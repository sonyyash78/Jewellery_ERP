import { test, expect } from '@playwright/test';
import { Helpers } from '../utils/helpers';

test.describe('Billing Module', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to Billing directly
    await page.goto('/billing');
  });

  test('should generate a bill without customer (Walk-in)', async ({ page }) => {
    // Wait for Billing page to load by checking TopBar
    await expect(page.getByText('Walk-in Customer')).toBeVisible();

    // Add an item to the cart (simulating Gold Calculator form)
    await page.getByPlaceholder('Item Name').first().fill('Test Ring');
    await page.getByPlaceholder('Gross Wt').first().fill('10');
    await page.getByRole('button', { name: 'Add to Bill' }).first().click();

    // Verify item is in the cart by checking Bill Summary text
    await expect(page.getByText('1 Items')).toBeVisible();

    // Generate Bill (clicking the GENERATE BILL button)
    const generateBtn = page.getByRole('button', { name: /GENERATE BILL/i });
    
    await Helpers.waitForApi(page, '/api/v1/invoices/', async () => {
      await generateBtn.click();
    });

    // Check if PostBillModal is shown
    await expect(page.getByText('Bill Generated!')).toBeVisible();

    // Click "Continue as Walk-in"
    await page.getByRole('button', { name: 'Continue as Walk-in' }).click();

    // Modal should close
    await expect(page.getByText('Bill Generated!')).not.toBeVisible();
    
    // Cart should be cleared
    await expect(page.getByText('0 Items')).toBeVisible();
  });
});
