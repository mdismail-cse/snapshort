const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const url = process.argv[2];
  if (!url) {
    console.error('URL not provided.');
    process.exit(1);
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({
    // Set a larger viewport to capture more content
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Set reasonable timeouts
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);

  try {
    // Navigate with fallback loading strategy
    let pageLoaded = false;

    try {
      // Try networkidle first (best for fully loaded content)
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

    // Wait for images to load (with timeout protection)
    console.log('🖼️ Waiting for images to load...');
    try {
      await page.evaluate(async () => {
        const images = Array.from(document.querySelectorAll('img'));
        const imagePromises = images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve);
            img.addEventListener('error', resolve);
            setTimeout(resolve, 3000); // 3 second timeout per image
          });
        });
        await Promise.all(imagePromises);
      });
      console.log('✅ Images loaded');
    } catch (error) {
      console.log('⚠️ Some images failed to load, continuing...');
    }

    // Wait for fonts to load
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

    // Wait for any lazy-loaded content and animations
    console.log('⏳ Waiting for dynamic content...');
    await page.waitForTimeout(2000);

    // Scroll to trigger lazy loading (optimized)
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

    // Freeze animations and transitions for consistent snapshots
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

    // Generate base filename
    const baseFileName = url.replace(/https?:\/\//, '').replace(/[\/\\?%*:|"<>\. ]/g, '_');

    // Accessibility snapshot
    const accessibilitySnapshot = await page.accessibility.snapshot();
    const snapshotFileName = baseFileName + '_accessibility_snapshot.txt';
    const snapshotFilePath = path.join('snapshots', snapshotFileName);
    fs.writeFileSync(snapshotFilePath, JSON.stringify(accessibilitySnapshot, null, 2));
    console.log(`Accessibility snapshot saved to ${snapshotFilePath}`);

    // Full page screenshot
    console.log('📸 Taking full page screenshot...');
    const screenshotFileName = baseFileName + '_screenshot.png';
    const screenshotFilePath = path.join('snapshots', screenshotFileName);
    await page.screenshot({
      path: screenshotFilePath,
      fullPage: true,
      type: 'png'
    });
    console.log(`✅ Full page screenshot saved to ${screenshotFilePath}`);

  } catch (error) {
    console.error(`Failed to process ${url}: ${error}`);
  } finally {
    await context.close();
    await browser.close();
  }
})();
