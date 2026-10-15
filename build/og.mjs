// Renders 1200×630 share images (Open Graph / X cards) into .cache/og/ with
// headless Chrome. The build copies them into dist/og/ and points each page at
// its image; pages without one fall back to the app or brand icon.
//
//   CHROME_PATH  path to Chrome or Chromium, if it is not in a usual place.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadProducts, loadSite, ROOT } from './content.mjs';
import { c, esc } from './ds.mjs';

const OUT = path.join(ROOT, '.cache', 'og');
const SRC = path.join(OUT, 'src');
const site = loadSite();
const products = loadProducts();

const browser = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean).find((p) => existsSync(p));

if (!browser) {
  console.log('No Chrome found: skipping share images (set CHROME_PATH to enable).');
  process.exit(0);
}

const fileUrl = (p) => pathToFileURL(p).href;
const css = ['vendor/aelnir-ds/tokens.css', 'vendor/aelnir-ds/components/bundle.css'].map((p) => `<link rel="stylesheet" href="${fileUrl(path.join(ROOT, p))}">`).join('\n');
const LINES = { master: 'var(--prism-line)', products: 'var(--products)', studio: 'var(--studio)', labs: 'var(--labs)' };

function card({ arm = 'master', eyebrow, title, text, icon }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Jost:wght@300;400;500&display=swap">
${css}
<style>
html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: var(--void); color: var(--ink); font-family: var(--font-sans); }
.card { box-sizing: border-box; position: relative; width: 1200px; height: 630px; padding: 64px 80px 72px; display: flex; flex-direction: column; justify-content: space-between; }
.mid { display: flex; align-items: center; gap: 64px; }
.txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px; }
.eyebrow { font-family: var(--font-mono); font-size: 20px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-subtle); }
h1 { margin: 0; font-weight: 300; font-size: 76px; line-height: 1.04; letter-spacing: -0.02em; }
p { margin: 0; font-weight: 300; font-size: 28px; line-height: 1.4; color: var(--ink-muted); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.icon { width: 232px; height: 232px; flex: none; border-radius: 22.5%; }
.foot { font-family: var(--font-mono); font-size: 18px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-subtle); }
.line { position: absolute; left: 80px; right: 80px; bottom: 0; height: 2px; background: ${LINES[arm] || LINES.master}; }
</style></head><body><div class="card">
${c('Logo', { variant: 'horizontal', size: 56, arm })}
<div class="mid"><div class="txt">${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}<h1>${esc(title)}</h1>${text ? `<p>${esc(text)}</p>` : ''}</div>${icon ? `<img class="icon" src="${fileUrl(icon)}" alt="">` : ''}</div>
<div class="foot">${esc(site.domain || 'aelnir')}</div>
<div class="line"></div>
</div></body></html>`;
}

const STATUS = { live: 'On Google Play', testing: 'Closed testing', soon: 'Coming soon' };
const cards = [
  { key: 'home', eyebrow: 'Products · Studio · Labs', title: site.tagline, text: site.description },
  { key: 'products', eyebrow: 'Aelnir Products', title: 'Small, private Android apps', text: products.map((p) => p.name).join(' · ') },
  { key: 'studio', arm: 'studio', eyebrow: 'Apps · Websites · Automation', title: 'Software for your business, built like our own.' },
  { key: 'labs', arm: 'labs', eyebrow: 'Experiments in new technology', title: 'Small bets on new technology.' },
  ...products.map((p) => ({
    key: `product-${p.slug}`,
    arm: 'products',
    eyebrow: `${p.category ? p.category + ' · ' : ''}${STATUS[p.status]}`,
    title: p.name,
    text: p.summary,
    icon: p.media.find((m) => m.to === p.icon)?.from
  }))
];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(SRC, { recursive: true });

let made = 0;
for (const item of cards) {
  const html = path.join(SRC, `${item.key}.html`);
  const png = path.join(OUT, `${item.key}.png`);
  writeFileSync(html, card(item));
  const args = [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    '--allow-file-access-from-files', '--window-size=1200,630', '--virtual-time-budget=6000',
    `--screenshot=${png}`, fileUrl(html)
  ];
  if (process.platform === 'linux') args.unshift('--no-sandbox');
  const run = spawnSync(browser, args, { stdio: 'ignore', timeout: 60000 });
  if (run.status === 0 && existsSync(png)) made += 1;
  else console.log(`- ${item.key}: Chrome did not produce an image`);
}
rmSync(SRC, { recursive: true, force: true });
console.log(`Share images: ${made} of ${cards.length} in .cache/og/`);
