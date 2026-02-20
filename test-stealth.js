const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // navigator.webdriver 제거 (봇 탐지 우회용)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.goto('https://example.com');
  // 추가 필요한 자동화 작업

  await browser.close();
})();
