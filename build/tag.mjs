// The Google tag, added to every page the site produces.
//
// Set `googleTag` in content/site.json (empty or missing = no tag). The page frame in
// layout.mjs calls googleTagSnippet() right after <head>, so any page built from now on
// gets it without extra work. build.mjs also runs ensureGoogleTag() over everything in
// dist/ as a safety net, so a hand-written HTML file dropped into public/ is covered too,
// and fails the build if a page still ends up without exactly one tag.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Files that must stay byte-for-byte as given, such as Search Console verification files.
const EXEMPT = /^google[0-9a-f]+.html$/i;

export function googleTagSnippet(id) {
  if (!id) return '';
  return `<script async src="https://www.googletagmanager.com/gtm.js?id=${id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
</script>`;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') && !EXEMPT.test(name) ? [full] : [];
  });
}

const count = (html, id) => html.split(`gtm.js?id=${id}`).length - 1;

/** Adds the tag to any built page that lacks it, then checks every page has exactly one. */
export function ensureGoogleTag(dist, id) {
  if (!id) return 0;
  let added = 0;
  for (const file of htmlFiles(dist)) {
    let html = readFileSync(file, 'utf8');
    if (count(html, id) === 0) {
      if (!/<head[^>]*>/i.test(html)) throw new Error(`Google tag: no <head> in ${path.relative(dist, file)}`);
      html = html.replace(/<head[^>]*>/i, (m) => `${m}
${googleTagSnippet(id)}`);
      writeFileSync(file, html);
      added += 1;
    }
    if (count(readFileSync(file, 'utf8'), id) !== 1) throw new Error(`Google tag: expected exactly one tag in ${path.relative(dist, file)}`);
  }
  return added;
}
