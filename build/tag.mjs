// Google Tag Manager, added to every page the site produces.
//
// Set `googleTag` in content/site.json (empty or missing = no tag). The page frame in
// layout.mjs calls googleTagSnippet() right after <head> and googleTagNoscript() right
// after <body>, so any page built from now on gets both without extra work. build.mjs
// also runs ensureGoogleTag() over everything in dist/ as a safety net, so a hand-written
// HTML file dropped into public/ is covered too, and fails the build if a page still ends
// up without exactly one of each.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Files that must stay byte-for-byte as given, such as Search Console verification files.
const EXEMPT = /^google[0-9a-f]+\.html$/i;

const HEAD_MARK = '<!-- Google Tag Manager -->';
const BODY_MARK = '<!-- Google Tag Manager (noscript) -->';

/** The standard Tag Manager loader. It pushes the gtm.start / gtm.js event, which is what
 *  lets the container's triggers (All Pages, Page View) fire. */
export function googleTagSnippet(id) {
  if (!id) return '';
  return `${HEAD_MARK}
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${id}');</script>
<!-- End Google Tag Manager -->`;
}

/** The fallback for visitors with JavaScript off. */
export function googleTagNoscript(id) {
  if (!id) return '';
  return `${BODY_MARK}
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${id}" height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') && !EXEMPT.test(name) ? [full] : [];
  });
}

const count = (html, mark) => html.split(mark).length - 1;

/** Adds the tag to any built page that lacks it, then checks every page has exactly one. */
export function ensureGoogleTag(dist, id) {
  if (!id) return 0;
  let fixed = 0;
  for (const file of htmlFiles(dist)) {
    const rel = path.relative(dist, file);
    let html = readFileSync(file, 'utf8');
    const before = html;
    if (count(html, HEAD_MARK) === 0) {
      if (!/<head[^>]*>/i.test(html)) throw new Error(`Google tag: no <head> in ${rel}`);
      html = html.replace(/<head[^>]*>/i, (m) => `${m}\n${googleTagSnippet(id)}`);
    }
    if (count(html, BODY_MARK) === 0) {
      if (!/<body[^>]*>/i.test(html)) throw new Error(`Google tag: no <body> in ${rel}`);
      html = html.replace(/<body[^>]*>/i, (m) => `${m}\n${googleTagNoscript(id)}`);
    }
    if (html !== before) { writeFileSync(file, html); fixed += 1; }
    if (count(html, HEAD_MARK) !== 1 || count(html, BODY_MARK) !== 1) throw new Error(`Google tag: expected exactly one head and one noscript tag in ${rel}`);
  }
  return fixed;
}
