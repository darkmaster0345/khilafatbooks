const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: 'verification/videos' }
  });
  const page = await context.newPage();

  try {
    console.log('Navigating to Home...');
    await page.goto('http://localhost:8080/');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verification/screenshots/home.png' });

    console.log('Navigating to Shop...');
    await page.goto('http://localhost:8080/shop');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'verification/screenshots/shop.png' });

    console.log('Navigating to Privacy Policy...');
    await page.goto('http://localhost:8080/privacy-policy');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verification/screenshots/privacy.png' });

    console.log('Navigating to Terms of Service...');
    await page.goto('http://localhost:8080/terms-of-service');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'verification/screenshots/terms.png' });

    console.log('Checking Footer Links...');
    await page.goto('http://localhost:8080/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'verification/screenshots/footer.png' });

  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await context.close();
    await browser.close();
  }
})();
