const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const urls = fs.readFileSync('urls.txt', 'utf-8').split('\n').filter(Boolean);
  const browser = await chromium.launch();
  const context = await browser.newContext();

  for (const url of urls) {
    const page = await context.newPage();
    try {
      console.log(`Processing ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      const newSnapshot = await page.accessibility.snapshot();
      const snapshotFileName = url.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>. ]/g, '_') + '_accessibility_snapshot.txt';
      const snapshotFilePath = path.join('snapshots', snapshotFileName);

      if (fs.existsSync(snapshotFilePath)) {
        const oldSnapshot = JSON.parse(fs.readFileSync(snapshotFilePath, 'utf-8'));
        
        // Basic comparison (deep equal would be better for production)
        if (JSON.stringify(newSnapshot) === JSON.stringify(oldSnapshot)) {
          console.log(`✅ Snapshot is valid for ${url}`);
        } else {
          console.log(`❌ Snapshot is different for ${url}`);
        }
      } else {
        console.log(`⚠️ No snapshot found for ${url}.`);
      }
    } catch (error) {
      console.error(`Failed to process ${url}: ${error}`);
    } finally {
      await page.close();
    }
  }

  await context.close();
  await browser.close();
})();
