const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to billing...');
  await page.goto('http://localhost:5174/billing', { waitUntil: 'networkidle0' });
  
  // Click Generate Bill
  console.log('Clicking Generate Bill...');
  // The button text has "GENERATE BILL"
  const generateBtn = await page.$x("//button[contains(., 'GENERATE BILL')]");
  if (generateBtn.length > 0) {
    await generateBtn[0].click();
    console.log('Clicked Generate Bill');
  } else {
    console.log('Could not find Generate Bill button');
  }

  await new Promise(r => setTimeout(r, 1000));
  
  console.log('Taking screenshot after clicking Generate Bill...');
  await page.screenshot({path: 'billing_screenshot6.png'});
  console.log('Screenshot saved');
  
  await browser.close();
})();
