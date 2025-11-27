const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function loadPageWithStabilization(page, url) {
  let pageLoaded = false;

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    console.log('✅ Page loaded with networkidle');
    pageLoaded = true;
  } catch (error) {
    console.log('⚠️ Networkidle timeout, trying domcontentloaded...');
  }

  if (!pageLoaded) {
    try {
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 10000
      });
      console.log('✅ Page loaded with domcontentloaded');
      pageLoaded = true;
    } catch (error) {
      console.log('⚠️ Domcontentloaded timeout, using basic load...');
    }
  }

  if (!pageLoaded) {
    await page.goto(url, {
      waitUntil: 'load',
      timeout: 10000
    });
    console.log('✅ Page loaded with basic load event');
  }

  console.log('🖼️ Waiting for images to load...');
  try {
    await page.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      const imagePromises = images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve);
          img.addEventListener('error', resolve);
          setTimeout(resolve, 3000);
        });
      });
      await Promise.all(imagePromises);
    });
    console.log('✅ Images loaded');
  } catch (error) {
    console.log('⚠️ Some images failed to load, continuing...');
  }

  console.log('🔤 Waiting for fonts to load...');
  try {
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      page.waitForTimeout(2000)
    ]);
    console.log('✅ Fonts loaded');
  } catch (error) {
    console.log('⚠️ Font loading timeout, continuing...');
  }

  console.log('⏳ Waiting for dynamic content...');
  await page.waitForTimeout(2000);

  console.log('🗂️ Triggering lazy loading...');
  try {
    await page.evaluate(async () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollStep = Math.max(viewportHeight / 4, 200);

      for (let y = 0; y < scrollHeight; y += scrollStep) {
        window.scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));
    });
    console.log('✅ Lazy loading triggered');
  } catch (error) {
    console.log('⚠️ Scroll loading failed, continuing...');
  }

  console.log('🧊 Disabling animations and transitions...');
  try {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation: none !important;
          transition: none !important;
          animation-play-state: paused !important;
          transition-duration: 0s !important;
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });

    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      elements.forEach((el) => {
        el.style.animationPlayState = 'paused';
      });
      if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {});
      }
    });
    console.log('✅ Animations disabled');
  } catch (error) {
    console.log('⚠️ Failed to disable animations:', error);
  }
}

(async () => {
  const urlFile = process.env.URL_FILE || 'urls.txt';
  const urls = fs.readFileSync(urlFile, 'utf-8').split('\n').filter(Boolean);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  for (const url of urls) {
    const page = await context.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
      console.log(`Processing ${url}...`);
      await loadPageWithStabilization(page, url);

      const newSnapshot = await page.accessibility.snapshot();
      const snapshotFileName = url.replace(/^https?:\/\//, '').replace(/[\/\\?%*:|"<>. ]/g, '_') + '_accessibility_snapshot.txt';
      const snapshotFilePath = path.join('snapshots', snapshotFileName);

      if (fs.existsSync(snapshotFilePath)) {
        const oldSnapshot = JSON.parse(fs.readFileSync(snapshotFilePath, 'utf-8'));

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
