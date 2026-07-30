import { test, expect } from '@playwright/test';
import { SupplierPage } from '../pages/SupplierPage';
import { Helpers } from '../utils/helpers';

test.describe('Suppliers Module', () => {
  let supplierPage: SupplierPage;
  
  test.beforeEach(async ({ page }) => {
    supplierPage = new SupplierPage(page);
    await supplierPage.goto();
  });

  test('should create a new supplier successfully', async () => {
    const data = Helpers.generateSupplierData();
    await supplierPage.addSupplier(data);
    await supplierPage.verifySupplierInList(data.name);
  });

  test('should edit supplier', async ({ page }) => {
    const data = Helpers.generateSupplierData();
    await supplierPage.addSupplier(data);
    
    await supplierPage.searchSupplier(data.name);
    
    // Click edit button
    const row = page.getByRole('row', { name: new RegExp(data.name, 'i') }).first();
    await row.getByRole('button', { name: new RegExp(`Edit ${data.name}`, 'i') }).click();

    const newCity = 'Ahmedabad';
    await page.getByLabel('City').fill(newCity);
    
    await Helpers.waitForApi(page, '/api/v1/sellers', async () => {
      await page.getByRole('button', { name: 'Save' }).click();
    });

    await expect(page.getByText('Supplier updated successfully')).toBeVisible();
    await supplierPage.verifySupplierInList(newCity);
  });
});
