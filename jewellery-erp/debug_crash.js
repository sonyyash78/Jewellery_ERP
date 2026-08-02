const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('response', response => console.log('PAGE RESPONSE:', response.status(), response.url()));
  
  await page.goto('http://localhost:5174/billing', { waitUntil: 'networkidle2' });
  
  // We need to add an item to the cart first, otherwise Generate Bill shows an error toast.
  // Add an item using the store directly or click some buttons.
  await page.evaluate(() => {
    // expose store to window to inject item
    const state = window.__ZUSTAND_STORES__?.find(s => s.name === 'billingStore')?.store.getState();
    if(state) {
        state.addToCart({
            id: '123', itemType: 'Gold', itemName: 'Ring', purityDisplay: '22K', touchDisplay: 91.6,
            grossWeight: 10, stoneWeight: 0, netWeight: 10, rateDisplay: 7000,
            metalValue: 70000, makingAmount: 500, hallmark: 0, otherCharges: 0, discount: 0, taxableAmount: 70500
        });
    }
  });

  // Since we might not have exposed the store to window, let's just click 'GENERATE BILL' and see what happens
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('GENERATE BILL'));
    if(btn) btn.click();
  });
  
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();