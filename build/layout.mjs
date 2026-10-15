// The frame every page shares: <head>, header, footer and the mobile dock.
import { c, esc } from './ds.mjs';

export function createLayout({ site, base, siteUrl, products, og = new Set() }) {
  const url = (p = '') => base + p;
  const abs = (p = '') => (siteUrl ? siteUrl.replace(/\/$/, '') + '/' + p : null);
  const year = new Date().getFullYear();

  const NAV = [
    { id: 'products', label: 'Products', href: url('products/') },
    { id: 'studio', label: 'Studio', href: url('studio/') },
    { id: 'labs', label: 'Labs', href: url('labs/') },
    { id: 'contact', label: 'Contact', href: url('studio/#enquiry') }
  ];

  const productLinks = products.slice(0, 5).map((p) => ({ label: p.name.replace(/^Aelnir /, ''), href: url(`products/${p.slug}/`) }));
  const policies = products.filter((p) => p.policy);

  function footerColumns(arm) {
    const legal = { title: 'Legal', links: policies.map((p) => ({ label: `${p.name.replace(/^Aelnir /, '')} privacy`, href: url(`products/${p.slug}/privacy/`) })) };
    if (arm === 'studio' || arm === 'labs') {
      return [
        { title: 'Aelnir', links: [{ label: 'Home', href: url() }, { label: 'Products', href: url('products/') }, arm === 'studio' ? { label: 'Labs', href: url('labs/') } : { label: 'Studio', href: url('studio/') }] },
        { title: 'Products', links: productLinks },
        legal
      ];
    }
    return [
      { title: 'Products', links: productLinks },
      { title: 'Company', links: [{ label: 'Studio', href: url('studio/') }, { label: 'Labs', href: url('labs/') }, { label: 'Contact', href: url('studio/#enquiry') }] },
      legal
    ];
  }

  const TAGLINES = {
    studio: 'Apps, websites and automation, built like our own products.',
    labs: 'Experiments in new technology. What works graduates into Products.'
  };

  function dock(current, action) {
    const item = (id, href, label, icon) =>
      `<a href="${href}"${id === current ? ' aria-current="page"' : ''}>${ICONS[icon]}<span class="label">${label}</span></a>`;
    return `
<div class="dock">
${action ? `<a class="ae-btn ae-btn-primary ae-btn-lg body" href="${action.href}">${esc(action.label)}</a>` : ''}
<nav class="pill" aria-label="Main">
${item('home', url(), 'Home', 'ring')}
${item('products', url('products/'), 'Products', 'grid')}
${item('studio', url('studio/'), 'Studio', 'code')}
${item('labs', url('labs/'), 'Labs', 'flask')}
</nav>
</div>
<div class="dock-spacer${action ? ' with-action' : ''}" aria-hidden="true"></div>`;
  }

  /** Organization, used across pages to say who publishes the site and the apps. */
  const organization = siteUrl ? {
    '@type': 'Organization',
    '@id': abs('#organization'),
    name: site.name,
    url: abs(),
    logo: abs('assets/brand/app-icon-dark-512.png'),
    email: site.contactEmail || undefined
  } : null;

  /** BreadcrumbList structured data from [name, path] pairs, home first. */
  function breadcrumbs(trail) {
    if (!siteUrl) return null;
    return {
      '@type': 'BreadcrumbList',
      itemListElement: [['Home', ''], ...trail].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(p) }))
    };
  }

  function jsonLd(items) {
    const graph = items.filter(Boolean);
    if (!graph.length) return '';
    const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
    return `<script type="application/ld+json">${json}</script>`;
  }

  /** A complete HTML document. */
  function page({ path, title, seoTitle, description, arm, current, action, body, bare = false, image, ogKey, schema = [], noindex = false }) {
    const fullTitle = seoTitle || (path === '' ? `${site.name}: ${site.tagline}` : `${title} · ${site.name}`);
    const desc = description || site.description;
    const canonical = noindex ? null : abs(path);
    const wide = ogKey && og.has(ogKey);
    const ogImage = abs(wide ? `og/${ogKey}.png` : image || 'assets/brand/app-icon-dark-512.png');
    const header = c('Header', {
      arm: arm || 'master',
      homeHref: url(),
      nav: NAV.map((n) => ({ label: n.label, href: n.href, current: n.id === current }))
    });
    const footer = c('Footer', {
      arm: arm || 'master',
      tagline: TAGLINES[arm] || site.tagline,
      columns: footerColumns(arm),
      note: `© ${year} ${site.name}. All rights reserved.`
    });

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(fullTitle)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#050506">
<meta name="color-scheme" content="dark">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${canonical}">` : ''}
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(fullTitle)}">
<meta property="og:description" content="${esc(desc)}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ''}
${ogImage ? `<meta property="og:image" content="${ogImage}">` : ''}
${ogImage && wide ? `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(title || site.name)}">` : ''}
<meta name="twitter:card" content="${wide ? 'summary_large_image' : 'summary'}">
${jsonLd([...(path === '' ? [organization] : []), ...schema])}
<link rel="icon" href="${url('assets/brand/favicon.svg')}" type="image/svg+xml">
<link rel="icon" href="${url('assets/brand/favicon-32.png')}" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${url('assets/brand/app-icon-dark-180.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&amp;family=Jost:wght@300;400;500&amp;display=swap">
<link rel="stylesheet" href="${url('assets/ds/tokens.css')}">
<link rel="stylesheet" href="${url('assets/ds/bundle.css')}">
<link rel="stylesheet" href="${url('assets/site.css')}">
<script src="${url('assets/site.js')}" defer></script>
</head>
<body>
${bare ? body : `<a class="skip" href="#main">Skip to content</a>
${header}
<main id="main">
${body}
</main>
${footer}
${dock(current || 'home', action)}`}
</body>
</html>
`;
  }

  return { url, abs, page, organization, breadcrumbs };
}

/** Stroke icons, drawn on a 24px grid. Decorative unless given a label. */
export const ICONS = {
  ring: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="14" r="5"/></svg>',
  grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  code: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/></svg>',
  flask: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3M7.5 15h9"/></svg>',
  'no-ads': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M4 4l16 16"/></svg>',
  unlock: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.5-2"/></svg>',
  infinity: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 9a3 3 0 1 0 0 6c2 0 3-1.5 5-3s3-3 5-3a3 3 0 1 1 0 6c-2 0-3-1.5-5-3S9 9 7 9z"/></svg>',
  chat: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>',
  star: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
  gift: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8c-1.5-3.5-5-4-5-1.5C7 8 12 8 12 8zm0 0c1.5-3.5 5-4 5-1.5C17 8 12 8 12 8z"/></svg>'
};
