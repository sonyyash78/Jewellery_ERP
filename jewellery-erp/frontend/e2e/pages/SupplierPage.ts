import { Page, expect } from '@playwright/test';
import { Helpers } from '../utils/helpers';

export class SupplierPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/customers');
    await this.page.getByRole('button', { name: 'Suppliers Directory' }).click();
    await expect(this.page.getByText('Total Suppliers')).toBeVisible();
  }

  async addSupplier(supplierData: ReturnType<typeof Helpers.generateSupplierData>) {
    await this.page.getByRole('button', { name: 'Add Supplier' }).click();
    
    // Fill the modal
    await this.page.getByLabel('Name').fill(supplierData.name);
    await this.page.getByLabel('Mobile Number').fill(supplierData.mobile);
    await this.page.getByLabel('City').fill(supplierData.city);
    await this.page.getByLabel('GST Number').fill(supplierData.gst);
    await this.page.getByLabel('Opening Balance').fill(supplierData.balance);
    
    // Wait for API to resolve and close modal
    await Helpers.waitForApi(this.page, '/api/v1/sellers', async () => {
      await this.page.getByRole('button', { name: 'Save' }).click();
    });

    // Check for success toast
    await expect(this.page.getByText('Supplier created successfully')).toBeVisible();
  }

  async searchSupplier(query: string) {
    await this.page.getByPlaceholder('Search suppliers...').fill(query);
    await this.page.waitForTimeout(500); 
  }

  async verifySupplierInList(name: string) {
    await expect(this.page.getByRole('cell', { name, exact: false }).first()).toBeVisible();
  }
}
