// Builds the static site into dist/.
//
// With a custom domain in content/site.json ("domain"), the site is built for
// the root of that domain. Without one:
//   BASE_PATH  where the site is served from, e.g. "/aelnir-website" on a
//              GitHub Pages project URL (default "").
//   SITE_URL   the full public address, used for canonical and share links.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
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

const layout = createLayout({ site, base, siteUrl, products, og });
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

// Static files
cpSync(path.join(ROOT, 'public'), DIST, { recursive: true });
const ds = path.join(ROOT, 'vendor', 'aelnir-ds');
mkdirSync(path.join(DIST, 'assets', 'ds'), { recursive: true });
cpSync(path.join(ds, 'tokens.css'), path.join(DIST, 'assets', 'ds', 'tokens.css'));
// The fonts are linked from every page's <head>; drop the stylesheet's own
// @import so they are not requested twice before the page can paint.
writeFileSync(path.join(DIST, 'assets', 'ds', 'bundle.css'),
  readFileSync(path.join(ds, 'components', 'bundle.css'), 'utf8').replace(/^@import url\([^)]*fonts\.googleapis[^)]*\);\s*/m, ''));
if (og.size) cpSync(OG, path.join(DIST, 'og'), { recursive: true });
cpSync(path.join(ds, 'logos'), path.join(DIST, 'assets', 'brand'), { recursive: true });
for (const p of products) for (const m of p.media) {
  const to = path.join(DIST, m.to);
  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(m.from, to);
}

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
