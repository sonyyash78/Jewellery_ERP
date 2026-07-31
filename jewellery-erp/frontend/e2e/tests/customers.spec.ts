import { test, expect } from '@playwright/test';
import { CustomerPage } from '../pages/CustomerPage';
import { Helpers } from '../utils/helpers';

test.describe('Customers Module', () => {
  let customerPage: CustomerPage;
  
  test.beforeEach(async ({ page }) => {
    customerPage = new CustomerPage(page);
    await customerPage.goto();
  });

  test('should create a new customer successfully', async () => {
    const data = Helpers.generateCustomerData();
    await customerPage.addCustomer(data);
    await customerPage.verifyCustomerInList(data.name);
  });

  test('should fail to create customer with duplicate mobile', async ({ page }) => {
    const data = Helpers.generateCustomerData();
    await customerPage.addCustomer(data);
    
    // Try to create again with same mobile
    const duplicateData = { ...Helpers.generateCustomerData(), mobile: data.mobile };
    
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await page.getByLabel('Name').fill(duplicateData.name);
    await page.getByLabel('Mobile Number').fill(duplicateData.mobile);
    
    const responsePromise = page.waitForResponse(
      response => response.url().includes('/api/v1/customers') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Save' }).click();
    const response = await responsePromise;
    expect(response.status()).toBeGreaterThanOrEqual(400);

    await expect(page.getByText(/mobile number already exists/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Customer' }).click();
    await page.getByRole('button', { name: 'Save' }).click();

    // Check for HTML5 validation or form errors
    // Since it's react-hook-form, we might see error messages below fields
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Mobile number must be 10 digits')).toBeVisible();
  });

  test('should search customer', async () => {
    const data = Helpers.generateCustomerData();
    await customerPage.addCustomer(data);
    
    await customerPage.searchCustomer(data.mobile);
    await customerPage.verifyCustomerInList(data.name);
  });

  test('should edit customer', async ({ page }) => {
    const data = Helpers.generateCustomerData();
    await customerPage.addCustomer(data);
    
    await customerPage.searchCustomer(data.name);
    
    // Click edit button
    const row = page.getByRole('row', { name: new RegExp(data.name, 'i') }).first();
    await row.getByRole('button', { name: new RegExp(`Edit ${data.name}`, 'i') }).click();

    const newCity = 'Pune';
    await page.getByLabel('City').fill(newCity);
    
    await Helpers.waitForApi(page, '/api/v1/customers', async () => {
      await page.getByRole('button', { name: 'Save' }).click();
    });

    await expect(page.getByText('Customer updated successfully')).toBeVisible();
    await customerPage.verifyCustomerInList(newCity);
  });

  test('should delete customer', async () => {
    const data = Helpers.generateCustomerData();
    await customerPage.addCustomer(data);
    
    await customerPage.deleteCustomer(data.name);
  });
});
