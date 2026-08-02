const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:5174/login', { waitUntil: 'networkidle0' });
  
  console.log('Logging in...');
  await page.type('input[type="text"]', 'admin');
  await page.type('input[type="password"]', 'admin');
  await page.click('button[type="submit"]');
  
  await page.waitForNavigation({ waitUntil: 'networkidle0' });
  
  console.log('Navigating to billing...');
  await page.goto('http://localhost:5174/billing', { waitUntil: 'networkidle0' });
  
  console.log('Taking screenshot...');
  await page.screenshot({path: 'billing_screenshot3.png'});
  console.log('Screenshot saved');
  
  await browser.close();
})();
