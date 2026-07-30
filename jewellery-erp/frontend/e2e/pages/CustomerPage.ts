import { Page, expect } from '@playwright/test';
import { Helpers } from '../utils/helpers';

export class CustomerPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/customers');
    await expect(this.page.getByText('Total Customers')).toBeVisible();
  }

  async addCustomer(customerData: ReturnType<typeof Helpers.generateCustomerData>) {
    await this.page.getByRole('button', { name: 'Add Customer' }).click();
    
    // Fill the modal
    await this.page.getByLabel('Name').fill(customerData.name);
    await this.page.getByLabel('Mobile Number').fill(customerData.mobile);
    await this.page.getByLabel('City').fill(customerData.city);
    await this.page.getByLabel('PAN Number').fill(customerData.pan);
    await this.page.getByLabel('Aadhar Number').fill(customerData.aadhar);
    await this.page.getByLabel('Opening Balance').fill(customerData.balance);
    
    // Wait for API to resolve and close modal
    await Helpers.waitForApi(this.page, '/api/v1/customers', async () => {
      await this.page.getByRole('button', { name: 'Save' }).click();
    });

    // Check for success toast
    await expect(this.page.getByText('Customer created successfully')).toBeVisible();
  }

  async searchCustomer(query: string) {
    await this.page.getByPlaceholder('Search customers...').fill(query);
    // Wait for debounce/network
    await this.page.waitForTimeout(500); 
  }

  async verifyCustomerInList(name: string) {
    await expect(this.page.getByRole('cell', { name, exact: false }).first()).toBeVisible();
  }

  async deleteCustomer(name: string) {
    // Search for the specific customer
    await this.searchCustomer(name);
    
    // Click the delete button on the row
    // Locate row by text, then find the delete button inside it
    const row = this.page.getByRole('row', { name: new RegExp(name, 'i') }).first();
    
    await Helpers.waitForApi(this.page, '/api/v1/customers', async () => {
      await row.getByRole('button', { name: new RegExp(`Delete ${name}`, 'i') }).click();
    });

    await expect(this.page.getByText('Customer deleted successfully')).toBeVisible();
  }
}
