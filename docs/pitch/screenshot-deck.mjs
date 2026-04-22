import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = join(__dirname, 'llm-sponsorship-deck-zh.html');
const outDir = join(__dirname, 'screenshots');
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });

// Wait for Reveal.js to initialize and fonts to load
await page.waitForFunction(() => typeof Reveal !== 'undefined' && Reveal.isReady());
await page.waitForTimeout(1500); // fonts

const totalSlides = await page.evaluate(() => Reveal.getTotalSlides());
console.log(`Total slides: ${totalSlides}`);

const issues = [];

for (let i = 0; i < totalSlides; i++) {
  await page.evaluate((idx) => Reveal.slide(idx), i);
  await page.waitForTimeout(400);

  const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
  await page.screenshot({ path: join(outDir, filename) });

  // Check for overflow / cutoff
  const overflowInfo = await page.evaluate(() => {
    const section = document.querySelector('.present');
    if (!section) return null;
    const rect = section.getBoundingClientRect();
    const children = section.querySelectorAll('*');
    let maxBottom = 0;
    let maxRight = 0;
    for (const child of children) {
      const cr = child.getBoundingClientRect();
      if (cr.bottom > maxBottom) maxBottom = cr.bottom;
      if (cr.right > maxRight) maxRight = cr.right;
    }
    return {
      sectionHeight: rect.height,
      sectionWidth: rect.width,
      sectionBottom: rect.bottom,
      sectionRight: rect.right,
      contentBottom: maxBottom,
      contentRight: maxRight,
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      overflowY: maxBottom > window.innerHeight,
      overflowX: maxRight > window.innerWidth,
    };
  });

  const slideLabel = `Slide ${i + 1}`;
  if (overflowInfo?.overflowY) {
    const px = Math.round(overflowInfo.contentBottom - overflowInfo.viewportHeight);
    issues.push(`${slideLabel}: vertical overflow by ${px}px (content bottom: ${Math.round(overflowInfo.contentBottom)}, viewport: ${overflowInfo.viewportHeight})`);
  }
  if (overflowInfo?.overflowX) {
    const px = Math.round(overflowInfo.contentRight - overflowInfo.viewportWidth);
    issues.push(`${slideLabel}: horizontal overflow by ${px}px`);
  }
  console.log(`  ${slideLabel}: ${overflowInfo?.overflowY || overflowInfo?.overflowX ? 'OVERFLOW' : 'OK'} (bottom: ${Math.round(overflowInfo?.contentBottom || 0)}/${overflowInfo?.viewportHeight})`);
}

if (issues.length) {
  console.log(`\n--- ISSUES (${issues.length}) ---`);
  issues.forEach(i => console.log(`  ⚠  ${i}`));
} else {
  console.log('\n✅ All slides fit within viewport. No cutoff detected.');
}

await browser.close();
