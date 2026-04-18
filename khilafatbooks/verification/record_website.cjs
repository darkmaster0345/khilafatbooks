const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: { dir: 'verification/videos' }
  });
  const page = await context.newPage();

  try {
    const pages = [
      { name: 'home', url: 'http://localhost:8080/' },
      { name: 'shop', url: 'http://localhost:8080/shop' },
      { name: 'book-requests', url: 'http://localhost:8080/book-requests' },
      { name: 'faq', url: 'http://localhost:8080/faq' },
      { name: 'privacy', url: 'http://localhost:8080/privacy-policy' },
      { name: 'auth', url: 'http://localhost:8080/auth' }
    ];

    for (const p of pages) {
      console.log(`Navigating to ${p.name}...`);
      await page.goto(p.url);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `verification/screenshots/${p.name}.png` });

      if (p.name === 'home') {
        await page.evaluate(() => window.scrollTo(0, 1000));
        await page.waitForTimeout(1000);
        await page.evaluate(() => window.scrollTo(0, 2000));
        await page.waitForTimeout(1000);
      }
    }
  } catch (err) {
    console.error('Verification failed:', err);
  } finally {
    await context.close();
    await browser.close();
  }
})();
