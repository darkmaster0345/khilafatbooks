const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');
const serveStatic = require('serve-static');
const connect = require('connect');

(async () => {
  const app = connect();
  const staticDir = path.join(__dirname, '../dist');
  const serve = serveStatic(staticDir);

  app.use((req, res, next) => {
    serve(req, res, (err) => {
      if (err) return next(err);
      if (req.method === 'GET' && req.headers.accept && req.headers.accept.includes('text/html')) {
        fs.readFile(path.join(staticDir, 'index.html'), (readErr, content) => {
          if (readErr) { res.statusCode = 500; res.end('Error'); return; }
          res.setHeader('Content-Type', 'text/html');
          res.end(content);
        });
      } else {
        res.statusCode = 404; res.end('Not Found');
      }
    });
  });

  const server = http.createServer(app);
  server.listen(8080);

  const browser = await chromium.launch();
  const page = await browser.newPage();

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
      console.log(`Taking screenshot of ${p.name}...`);
      await page.goto(p.url);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `verification/screenshots/${p.name}.png`, fullPage: true });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
    server.close();
  }
})();
