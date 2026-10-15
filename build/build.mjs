// Builds the static site into dist/.
//
// With a custom domain in content/site.json ("domain"), the site is built for
// the root of that domain. Without one:
//   BASE_PATH  where the site is served from, e.g. "/aelnir-website" on a
//              GitHub Pages project URL (default "").
//   SITE_URL   the full public address, used for canonical and share links.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { loadProducts, loadSite, ROOT } from './content.mjs';
import { createLayout } from './layout.mjs';
import { createPages } from './pages.mjs';

const DIST = path.join(ROOT, 'dist');
const site = loadSite();
const basePath = site.domain ? '' : process.env.BASE_PATH || '';
const base = `/${basePath.replace(/^\/+|\/+$/g, '')}/`.replace(/^\/\/$/, '/');
const siteUrl = site.domain ? `https://${site.domain}` : process.env.SITE_URL || '';

const products = loadProducts();
const builtOn = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Share images made by `npm run og`, if any.
const OG = path.join(ROOT, '.cache', 'og');
const og = new Set(existsSync(OG) ? readdirSync(OG).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)) : []);

// All CSS goes inline in each page: the design system's tokens and component
// styles, the self-hosted fonts and the site layout. On a slow connection,
// fetching stylesheets before the first paint cost seconds; inline it is
// about 8 KB gzipped per page.
const ds = path.join(ROOT, 'vendor', 'aelnir-ds');
const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const font = (family, weight, file) =>
  `@font-face{font-family:"${family}";font-style:normal;font-weight:${weight};font-display:swap;src:url(${base}assets/fonts/${file}) format("woff2");unicode-range:${LATIN}}`;
const css = minifyCss([
  font('Jost', '300 500', 'jost-latin.woff2'),
  font('IBM Plex Mono', '400', 'ibm-plex-mono-400-latin.woff2'),
  font('IBM Plex Mono', '500', 'ibm-plex-mono-500-latin.woff2'),
  readFileSync(path.join(ds, 'tokens.css'), 'utf8'),
  readFileSync(path.join(ds, 'components', 'bundle.css'), 'utf8').replace(/@import url\([^)]*\);\s*/g, ''),
  readFileSync(path.join(ROOT, 'public', 'assets', 'site.css'), 'utf8')
].join('\n'));

function minifyCss(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};,>])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

const layout = createLayout({ site, base, siteUrl, products, og, css });
const pages = createPages({ site, layout, products, builtOn });

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

function write(route, html) {
  const file = route.endsWith('.html') ? path.join(DIST, route) : path.join(DIST, route, 'index.html');
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, html);
}

const out = [pages.home(), pages.productsIndex(), pages.studio(), pages.labs(), pages.notFound()];
for (const p of products) {
  out.push(pages.product(p));
  if (p.policy) out.push(pages.privacy(p));
  if (p.status === 'testing' && p.testing?.join) out.push(pages.join(p));
}
for (const { path: route, html } of out) write(route, html);

// Static files (site.css is inlined above, so it is not copied)
cpSync(path.join(ROOT, 'public'), DIST, { recursive: true, filter: (src) => !src.endsWith('site.css') });
cpSync(path.join(ROOT, 'vendor', 'fonts'), path.join(DIST, 'assets', 'fonts'), { recursive: true, filter: (src) => !src.endsWith('.txt') });
if (og.size) cpSync(OG, path.join(DIST, 'og'), { recursive: true });
cpSync(path.join(ds, 'logos'), path.join(DIST, 'assets', 'brand'), { recursive: true });

// Product media: the original, plus WebP copies of photos at the widths the pages use.
const jobs = [];
for (const p of products) for (const m of p.media) {
  const to = path.join(DIST, m.to);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(m.from, to);
  if (/\.(png|jpe?g)$/i.test(m.from)) {
    for (const width of m.widths) {
      jobs.push(sharp(m.from).resize({ width, withoutEnlargement: true }).webp({ quality: 80, effort: 5 })
        .toFile(to.replace(/\.(png|jpe?g)$/i, `-${width}.webp`)));
    }
  }
}
await Promise.all(jobs);

// Forms settings for assets/site.js
writeFileSync(path.join(DIST, 'assets', 'forms.json'), JSON.stringify({ contactEmail: site.contactEmail, ...site.forms }, null, 2));
// GitHub Pages: serve files as they are
writeFileSync(path.join(DIST, '.nojekyll'), '');

if (siteUrl) {
  const urls = out.filter((o) => !o.path.endsWith('.html')).map((o) => `  <url><loc>${siteUrl.replace(/\/$/, '')}/${o.path}</loc></url>`);
  writeFileSync(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  writeFileSync(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl.replace(/\/$/, '')}/sitemap.xml\n`);
}

const missing = [];
if (!site.forms?.tester?.action) missing.push('tester form (content/site.json → forms.tester)');
if (!site.forms?.studio?.action) missing.push('Studio form (content/site.json → forms.studio)');
console.log(`Built ${out.length} pages for ${products.length} products into dist/ (base "${base}")`);
if (missing.length) console.log(`Not connected yet, falling back to email: ${missing.join(', ')}`);
