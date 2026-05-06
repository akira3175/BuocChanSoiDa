import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER_ERROR:', error));

  console.log('Navigating...');
  await page.goto('http://localhost:5173/analytics/heatmap', { waitUntil: 'networkidle' });
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'test_heatmap.png' });
  
  await browser.close();
})();
