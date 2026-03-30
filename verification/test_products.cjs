const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
const fs = require('fs');
const serveStatic = require('serve-static');
const connect = require('connect');

(async () => {
  const app = connect();
  const staticDir = path.join(__dirname, '../dist');
  const serve = serveStatic(staticDir);

  app.use((req, res, next) => {
    serve(req, res, (err) => {
      if (err) return next(err);
      // Fallback for SPA
      if (req.method === 'GET' && req.headers.accept.includes('text/html')) {
        fs.readFile(path.join(staticDir, 'index.html'), (readErr, content) => {
          if (readErr) return next(readErr);
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
        });
      } else {
        res.statusCode = 404;
        res.end('Not Found');
      }
    });
  });

  const server = http.createServer(app);
  server.listen(8082);
  console.log('Server running at http://localhost:8082');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:8082/shop');
    await page.waitForTimeout(5000);

    // Check for "No products match your filters" text
    const content = await page.textContent('body');
    if (content.includes('No products match your filters')) {
      console.log('Shop displays: "No products match your filters"');
    } else {
      const productCount = await page.$$eval('.group.relative', el => el.length);
      console.log(`Found ${productCount} products in shop`);
    }

    await page.screenshot({ path: 'verification/screenshots/shop_page.png' });

    // Check privacy page
    await page.goto('http://localhost:8082/privacy-policy');
    await page.waitForSelector('h1', { timeout: 10000 });
    const privacyTitle = await page.textContent('h1');
    console.log('Privacy page title:', privacyTitle);
    await page.screenshot({ path: 'verification/screenshots/privacy_page.png' });

    // Check terms page
    await page.goto('http://localhost:8082/terms-of-service');
    await page.waitForSelector('h1', { timeout: 10000 });
    const termsTitle = await page.textContent('h1');
    console.log('Terms page title:', termsTitle);
    await page.screenshot({ path: 'verification/screenshots/terms_page.png' });

  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    await browser.close();
    server.close();
  }
})();
