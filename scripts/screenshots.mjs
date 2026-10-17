// Takes full-page screenshots of a running app at phone and desktop width.
// Usage:
//   node scripts/screenshot.mjs <url> [--seed path.json] [--name page]
//                                     [--out .screenshots] [--schemes light,dark]
// Seed file format: { "localStorage": { "key": <string or JSON value> } }

import { chromium } from 'playwright';
import { readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const args = process.argv.slice(2);
const url = args[0];

function opt(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

if (!url || url.startsWith('--')) {
  console.error('Usage: node scripts/screenshot.mjs <url> [--seed file] [--name page] [--out dir] [--schemes light,dark]');
  process.exit(1);
}

const outDir = opt('out', '.screenshots');
const name = opt('name', 'page');
const seedPath = opt('seed', null);
const schemes = opt('schemes', 'light').split(',').map((s) => s.trim());
const seed = seedPath ? JSON.parse(await readFile(seedPath, 'utf8')) : null;

const viewports = [
  { label: 'phone', width: 390, height: 844 },
  { label: 'desktop', width: 1280, height: 800 },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

try {
  for (const scheme of schemes) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: scheme,
      });

      if (seed?.localStorage) {
        await context.addInitScript((entries) => {
          window.localStorage.clear();
          for (const [key, value] of Object.entries(entries)) {
            window.localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        }, seed.localStorage);
      }

      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      const file = join(outDir, `${name}-${vp.label}-${scheme}.png`);
      await page.screenshot({ path: file, fullPage: true });
      console.log(file);

      await context.close();
    }
  }
} finally {
  await browser.close();
}