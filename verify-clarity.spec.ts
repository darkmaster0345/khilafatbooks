import { test, expect } from '@playwright/test';

test('verify Microsoft Clarity script in head', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Check if the script exists in the head
  const scriptExists = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts.some(s => s.textContent?.includes('w2cz1tr7pz') && s.textContent?.includes('clarity'));
  });

  expect(scriptExists).toBe(true);

  // Verify CSP headers (mocking response as we cannot easily check server headers from page.evaluate without re-fetching)
  // However, we can check if there are any CSP errors in the console
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Content Security Policy')) {
      consoleErrors.push(msg.text());
    }
  });

  await page.reload();
  expect(consoleErrors.length).toBe(0);
});
