import { Page, expect } from '@playwright/test';

export class Helpers {
  static generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateRandomNumber(length: number): string {
    const chars = '0123456789';
    let result = '';
    // First digit shouldn't be 0 for phone numbers etc
    result += chars.charAt(Math.floor(Math.random() * 9) + 1);
    for (let i = 1; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  static generateRandomPhone(): string {
    return this.generateRandomNumber(10);
  }

  static generateRandomEmail(): string {
    return `test_${this.generateRandomString(8)}@example.com`;
  }

  /**
   * Helper to wait for a network request to complete and verify success.
   * Useful when submitting forms.
   */
  static async waitForApi(page: Page, urlPart: string, action: () => Promise<void>) {
    const responsePromise = page.waitForResponse(
      response => response.url().includes(urlPart) && response.status() >= 200 && response.status() < 300
    );
    await action();
    return await responsePromise;
  }

  static generateCustomerData() {
    return {
      name: `Cust_${this.generateRandomString(6)}`,
      mobile: this.generateRandomPhone(),
      email: this.generateRandomEmail(),
      city: 'Mumbai',
      pan: `ABCDE${this.generateRandomNumber(4)}F`,
      aadhar: this.generateRandomNumber(12),
      balance: Math.floor(Math.random() * 10000).toString(),
    };
  }

  static generateSupplierData() {
    return {
      name: `Supp_${this.generateRandomString(6)}`,
      mobile: this.generateRandomPhone(),
      city: 'Surat',
      gst: `24ABCDE${this.generateRandomNumber(4)}F1Z5`,
      balance: Math.floor(Math.random() * 50000).toString(),
    };
  }
}
