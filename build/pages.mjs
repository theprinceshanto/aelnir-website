// Page templates. Each returns { path, html }.
import { c, esc } from './ds.mjs';
import { ICONS } from './layout.mjs';
import { splitPolicy } from './markdown.mjs';

const STATUS = {
  live: { tone: 'success', label: 'Live on Google Play', short: 'Live' },
  testing: { tone: 'warning', label: 'Closed testing', short: 'Testing' },
  soon: { tone: 'neutral', label: 'Coming soon', short: 'Coming soon' }
};

const STAGES = [
  { id: 'development', name: 'In development', note: 'Built and tested by us on real phones.' },
  { id: 'testing', name: 'Closed testing', note: 'A small group of testers on Google Play.' },
  { id: 'live', name: 'On Google Play', note: 'Free for everyone to install.' }
];

const SCHEMA_CATEGORY = {
  Focus: 'LifestyleApplication',
  Utility: 'UtilitiesApplication',
  Photo: 'MultimediaApplication',
  Privacy: 'SecurityApplication',
  Tools: 'UtilitiesApplication'
};

export function createPages({ site, layout, products, builtOn }) {
  const { url, page, abs, organization, breadcrumbs } = layout;

  /** MobileApplication structured data for a product. */
  function appSchema(p) {
    if (!organization) return null;
    return {
      '@type': 'MobileApplication',
      '@id': abs(`products/${p.slug}/#app`),
      name: p.name,
      description: p.summary,
      url: abs(`products/${p.slug}/`),
      operatingSystem: 'Android',
      applicationCategory: p.schemaCategory || SCHEMA_CATEGORY[p.category] || 'UtilitiesApplication',
      image: p.icon ? abs(p.icon) : undefined,
      screenshot: p.screenshots.length ? p.screenshots.map((s) => abs(s.src)) : undefined,
      publisher: { '@id': organization['@id'] },
      ...(p.status === 'live' ? { installUrl: p.playUrl, offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' } } : {})
    };
  }

  const badge = (label, props = {}) => c('Badge', props, esc(label));
  const more = (href, text) => c('Link', { variant: 'standalone', href }, esc(text));
  const btn = (href, text, variant = 'primary', extra = '') =>
    `<a class="ae-btn ae-btn-${variant} ae-btn-lg body" href="${href}"${extra}>${esc(text)}</a>`;
  const mailto = (subject) => `mailto:${site.contactEmail}?subject=${encodeURIComponent(subject)}`;
  const productUrl = (p, sub = '') => url(`products/${p.slug}/${sub}`);
  const icon = (p, size) => p.icon
    ? `<img class="app-icon" src="${url(p.icon)}" alt="${esc(p.name)} app icon" width="${size}" height="${size}" loading="lazy">`
    : '';
  const shot = (s, eager = false) =>
    `<img class="shot" src="${url(s.src)}" alt="${esc(s.alt || '')}" width="720" height="1536"${eager ? '' : ' loading="lazy"'}>`;

  function meter(cap, taken, small = false) {
    const cells = Array.from({ length: cap }, (_, i) => `<span${i < taken ? ' class="on"' : ''}></span>`).join('');
    return `<div class="meter${small ? ' meter-sm' : ''}" role="img" data-meter aria-label="${taken} of ${cap} tester spots taken">${cells}</div>`;
  }

  /** The tester-spot counter, kept in sync by assets/site.js. */
  function spots(p, small = false) {
    const t = p.testing;
    const left = Math.max(0, t.cap - (t.taken || 0));
    return `<div class="stack g12" data-spots data-cap="${t.cap}" data-taken="${t.taken || 0}"${t.spotsCsv ? ` data-csv="${esc(t.spotsCsv)}"` : ''}>
<p class="label ink" data-spots-label>${left > 0 ? `${left} of ${t.cap} spots left` : `All ${t.cap} spots are taken`}</p>
${meter(t.cap, t.taken || 0, small)}
</div>`;
  }

  function actionsFor(p) {
    if (p.status === 'live' && p.playUrl) {
      return {
        primary: { href: p.playUrl, label: 'Get it on Google Play', extra: ' target="_blank" rel="noopener"' },
        secondary: { href: '#features', label: 'What it does' },
        dock: { href: p.playUrl, label: 'Get it on Google Play' }
      };
    }
    if (p.status === 'testing' && p.testing?.join) {
      return {
        primary: { href: productUrl(p, 'join/'), label: 'Claim a tester spot' },
        secondary: { href: '#join', label: 'See what testers get' },
        caption: `${p.name} is in closed testing on Google Play. Once you are added as a tester, you install it from the Play Store as usual.`,
        dock: { href: productUrl(p, 'join/'), label: 'Claim a tester spot' }
      };
    }
    return {
      primary: { href: mailto(`Tell me when ${p.name} launches`), label: 'Tell me at launch' },
      secondary: { href: '#features', label: 'What it does' },
      caption: 'One email when it reaches Google Play. Nothing else.',
      dock: { href: mailto(`Tell me when ${p.name} launches`), label: 'Tell me at launch' }
    };
  }

  /* ---------- Home ---------- */

  function home() {
    const spotlight = products.filter((p) => p.status !== 'soon');
    const upcoming = products.filter((p) => p.status === 'soon');
    const anyLive = spotlight.some((p) => p.status === 'live');

    const spotlightHtml = spotlight.length ? `
<section class="wrap sec stack g32" aria-labelledby="live-h">
<div class="head-row">
<div class="stack g8"><p class="label subtle">${anyLive ? 'Live now' : 'Now testing'}</p><h2 id="live-h" class="display-md">${anyLive ? 'On Google Play' : 'In closed testing on Google Play'}</h2></div>
${more(url('products/'), 'All products')}
</div>
${spotlight.map((p) => {
  const a = actionsFor(p);
  return `<article class="panel row center g48">
<div class="stack g20" style="flex: 1 1 440px; min-width: 0;">
<div class="row center g20">${icon(p, 88)}<div class="stack g8"><h3 class="display-md">${esc(p.name)}</h3><div class="row g8">${badge(p.status === 'testing' ? 'Closed testing' : 'Live', { tone: STATUS[p.status].tone })}${badge(p.platform || 'Android')}</div></div></div>
<p class="body-lg muted" style="max-width: 520px;">${esc(p.pitch || p.tagline)}</p>
${p.highlights ? `<ul class="numbered small muted">${p.highlights.map((h, i) => `<li><span class="label n">${String(i + 1).padStart(2, '0')}</span>${esc(h)}</li>`).join('')}</ul>` : ''}
<div class="btns" style="padding-top: 8px;">${btn(a.primary.href, a.primary.label, 'secondary', a.primary.extra || '')}${more(productUrl(p), 'Product details')}</div>
${p.testing?.teaser ? `<p class="small muted">${esc(p.testing.teaser)} <a href="${productUrl(p)}#join">See all tester perks</a></p>` : ''}
</div>
${p.screenshots.length >= 2 ? `<div class="shots-pair" style="flex-basis: 416px;">${shot(p.screenshots[0])}${shot(p.screenshots[1])}</div>` : ''}
</article>`;
}).join('\n')}
</section>` : '';

    const upcomingHtml = upcoming.length ? `
<section class="wrap sec stack g32" aria-labelledby="next-h">
<div class="head-row">
<div class="stack g8"><p class="label subtle">${upcoming.length} ${upcoming.length === 1 ? 'app' : 'apps'} in the works</p><h2 id="next-h" class="display-md">Coming next</h2></div>
<p class="label subtle sync">Updated from GitHub · ${builtOn}</p>
</div>
<div class="cards rail" style="grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));">
${upcoming.map((p) => c('Card', { eyebrow: p.category, arm: 'products', title: p.name, href: productUrl(p) },
  `<p>${esc(p.summary)}</p><div class="row center between g12" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">${badge('Coming soon')}<span class="label subtle">${esc(p.platform || 'Android')}</span></div>`)).join('\n')}
</div>
</section>` : '';

    const body = `
<section class="wrap hero split" aria-labelledby="hero-h">
<div class="main stack g24">
<p class="label subtle">Products · Studio · Labs</p>
<h1 id="hero-h" class="display-xl">${esc(site.tagline)}</h1>
<p class="body-lg lead">Aelnir makes small Android apps that do one job well and keep your data on your phone. Aelnir Studio builds apps, websites and automation for clients.</p>
<div class="btns" style="padding-top: 8px;">${btn(url('products/'), 'See the products')}${btn(url('studio/#enquiry'), 'Start a project', 'secondary')}</div>
</div>
</section>
${spotlightHtml}
${upcomingHtml}
<section class="wrap sec stack g32" aria-labelledby="arms-h">
<div class="head"><p class="label subtle">One name, three arms</p><h2 id="arms-h" class="display-md">Products, Studio and Labs</h2><p class="body-lg muted">Raw ideas go in. One precise line of working software comes out. Each arm does that for a different reason.</p></div>
<div class="cards rail">
${c('Card', { eyebrow: 'Aelnir Products', arm: 'products', title: 'Apps we build and run', href: url('products/') }, '<p>Our own apps, ERP and SaaS. The core of the company, and the proof of what we can build.</p>')}
${c('Card', { eyebrow: 'Aelnir Studio', arm: 'studio', title: 'Software for clients', href: url('studio/') }, '<p>Apps, websites, internal tools and automation, built for your business with the same care as our own products.</p>')}
${c('Card', { eyebrow: 'Aelnir Labs', arm: 'labs', title: 'Experiments in new technology', href: url('labs/') }, '<p>Small bets on new ideas. What works graduates into Products. What doesn’t teaches us something.</p>')}
</div>
</section>
<section class="wrap sec-lg" aria-labelledby="studio-h">
<div class="panel-outline row center between g40">
<div class="stack g20" style="flex: 1 1 520px; min-width: 0;">
${c('Logo', { variant: 'horizontal', arm: 'studio', size: 48 })}
<h2 id="studio-h" class="display-lg">Have something to build?</h2>
<p class="body-lg muted" style="max-width: 560px;">Tell us what it needs to do. We come back with questions, a rough plan and a price range.</p>
</div>
<div class="stack g12" style="align-items: flex-start;">${btn(url('studio/#enquiry'), 'Start a project', 'secondary')}${more(url('studio/'), 'About Aelnir Studio')}</div>
</div>
</section>`;

    const website = organization && { '@type': 'WebSite', name: site.name, url: abs(), publisher: { '@id': organization['@id'] } };
    return { path: '', html: page({ path: '', seoTitle: site.seoTitle, body, current: 'home', ogKey: 'home', schema: [website] }) };
  }

  /* ---------- Products ---------- */

  function productsIndex() {
    const filters = [['all', 'All'], ['live', 'Live'], ['testing', 'Testing'], ['soon', 'Coming soon']]
      .map(([id, label]) => ({ id, label, count: id === 'all' ? products.length : products.filter((p) => p.status === id).length }))
      .filter((f) => f.count > 0);

    const body = `
<div class="wrap sec-lg stack g48" style="padding-top: 80px;">
<div class="head"><p class="label subtle">Aelnir Products</p><h1 class="display-lg">Products</h1><p class="body-lg muted">Small Android apps that do one job well. Each one runs on your phone, works offline and keeps your data there.</p></div>
<div class="row center between g16" style="padding-bottom: 16px; border-bottom: 1px solid var(--line);">
<div class="row g8" role="group" aria-label="Filter by status" data-filters>
${filters.map((f, i) => c('Button', { variant: i === 0 ? 'secondary' : 'ghost', size: 'md', 'data-filter': f.id, 'aria-pressed': i === 0 ? 'true' : 'false' }, `${esc(f.label)} · ${f.count}`)).join('')}
</div>
<p class="label subtle sync">Updated from GitHub · ${builtOn}</p>
</div>
<p class="small subtle" aria-live="polite" data-filter-count>Showing ${products.length} of ${products.length} apps</p>
<div class="cards cards-wide">
${products.map((p) => `<div data-filter-item data-status="${p.status}">${c('Card', { eyebrow: p.category, arm: 'products', title: p.name, href: productUrl(p), headingLevel: 2 },
  `<p>${esc(p.summary)}</p><div class="row center between g12" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">${badge(STATUS[p.status].label, { tone: STATUS[p.status].tone })}<span class="label subtle">${esc(p.package || '')}</span></div>`)}</div>`).join('\n')}
</div>
<div class="panel row center between g24" style="margin-top: 32px; padding: 32px;">
<div class="stack g8" style="max-width: 620px;"><h2 class="title">Need an app that isn’t here?</h2><p class="body muted">Aelnir Studio builds apps, websites and automation for clients.</p></div>
${btn(url('studio/#enquiry'), 'Start a project', 'secondary')}
</div>
</div>`;

    const list = organization && {
      '@type': 'ItemList',
      name: 'Aelnir apps',
      itemListElement: products.map((p, i) => ({ '@type': 'ListItem', position: i + 1, name: p.name, url: abs(`products/${p.slug}/`) }))
    };
    return { path: 'products/', html: page({
      path: 'products/', title: 'Products', seoTitle: 'Aelnir apps: small, private Android apps',
      description: 'Small Android apps that do one job well, work offline and keep your data on your phone: Reelock, Aelnir Scan, Photo Kit and more.',
      body, current: 'products', ogKey: 'products', schema: [list, breadcrumbs([['Products', 'products/']])]
    }) };
  }

  /* ---------- Product ---------- */

  function product(p) {
    const a = actionsFor(p);
    const st = STATUS[p.status];
    const t = p.testing;
    const stage = p.status === 'live' ? 'live' : p.status === 'testing' ? 'testing' : (p.stage || 'development');
    const at = STAGES.findIndex((s) => s.id === stage);

    const side = p.screenshots.length >= 2
      ? `<div class="shots-pair">${shot(p.screenshots[0], true)}${shot(p.screenshots[1], true)}</div>`
      : `<aside class="road-panel" aria-labelledby="road-h"><h2 id="road-h" class="label subtle">Road to launch</h2><ol class="road">${STAGES.map((s, i) =>
          `<li class="${i < at ? 'done reached' : i === at ? 'reached' : ''}"><div class="rail" aria-hidden="true"><span class="dot"></span><span class="line"></span></div><div class="text"><p class="body name">${s.name}${i === at ? ' · now' : ''}</p><p class="caption">${s.note}</p></div></li>`).join('')}</ol></aside>`;

    const perks = p.status === 'testing' && t ? `
<section id="join" class="wrap sec" aria-labelledby="join-h">
<div class="panel stack g40">
<div class="row end between g24">
<div class="stack g12" style="flex: 1 1 520px; min-width: 0; max-width: 680px;">
<p class="label subtle">Closed test · first ${t.cap} testers only</p>
<h2 id="join-h" class="display-md">Test ${esc(p.name)} now. Keep it free for good.</h2>
<p class="body-lg muted">We are taking ${t.cap} testers, no more. Help us get ${esc(p.name)} right before launch, and you keep the full app with no ads and no subscription, for as long as ${esc(p.name)} exists.</p>
</div>
<div class="stack g12" style="align-items: flex-start;">${spots(p, true)}${t.join ? btn(productUrl(p, 'join/'), 'Claim a spot', 'secondary') : ''}</div>
</div>
<ul class="hairgrid">${t.perks.map((k) => `<li>${ICONS[k.icon] || ''}<h3 class="title">${esc(k.title)}</h3><p class="small muted">${esc(k.body)}</p></li>`).join('')}</ul>
${t.finePrint ? `<p class="caption subtle">${esc(t.finePrint)}</p>` : ''}
</div>
</section>` : '';

    const features = p.features ? `
<section id="features" class="wrap sec stack g32" aria-labelledby="does-h">
<div class="head"><p class="label subtle">What it does</p><h2 id="does-h" class="display-md">${esc(p.features.title)}</h2>${p.features.lead ? `<p class="body-lg muted">${esc(p.features.lead)}</p>` : ''}</div>
<div class="cards rail">${p.features.items.map((f, i) => c('Card', { eyebrow: String(i + 1).padStart(2, '0'), title: f.title }, `<p>${esc(f.body)}</p>`)).join('')}</div>
</section>` : '';

    const gallery = p.screenshots.length >= 3 ? `
<section class="wrap sec stack g24" aria-labelledby="shots-h">
<h2 id="shots-h" class="label subtle">Screenshots</h2>
<div class="shots-strip">${p.screenshots.map((s) => shot(s)).join('')}</div>
</section>` : '';

    const strip = p.strip ? `
<section class="wrap sec" aria-labelledby="strip-h">
<div class="strip"><h2 id="strip-h" class="label">${esc(p.strip.label)}</h2><p class="code pre-line">${esc(p.strip.text)}</p></div>
</section>` : '';

    const policyLink = p.policy ? more(productUrl(p, 'privacy/'), 'Read the privacy policy') : '';
    const privacyPanel = p.privacy?.points ? `
<section id="privacy" class="wrap sec" aria-labelledby="privacy-h">
<div class="panel row g48">
<div class="stack g16" style="flex: 1 1 360px; min-width: 0;">
<p class="label subtle">Privacy</p>
<h2 id="privacy-h" class="display-md">Built to stay on your phone</h2>
<ul class="dots-list body">${p.privacy.points.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
${policyLink}
</div>
${p.privacy.permissions ? `<div class="stack g16" style="flex: 1 1 480px; min-width: 0;">
<h3 class="title">Why ${esc(p.name)} asks for these permissions</h3>
<dl class="rows">${p.privacy.permissions.map((x) => `<div><dt class="label">${esc(x.name)}</dt><dd class="small">${esc(x.why)}</dd></div>`).join('')}</dl>
</div>` : ''}
</div>
</section>` : '';

    const left = p.releases.length ? `
<div class="stack g16" style="flex: 1 1 560px; min-width: 0;">
<div class="row baseline between g12"><h2 class="display-md">Release notes</h2><p class="label subtle">From GitHub Releases</p></div>
<ol class="rows" style="list-style: none; padding: 0;">${p.releases.map((r) => `<li style="display: flex; flex-wrap: wrap; gap: 8px 24px; padding: 20px 0; border-top: 1px solid var(--line);"><div class="stack g4" style="flex: 0 0 160px;"><span class="code ink">${esc(r.version)}</span><span class="caption subtle">${esc(r.date)}</span></div><div class="body muted prose" style="flex: 1 1 280px;">${r.html || esc(r.notes || '')}</div></li>`).join('')}</ol>
</div>` : p.note ? `
<div class="stack g16" style="flex: 1 1 560px; min-width: 0;">
<p class="label subtle">${esc(p.note.label)}</p>
<h2 class="display-md">${esc(p.note.title)}</h2>
<p class="body-lg muted" style="max-width: 600px;">${esc(p.note.body)}</p>
${policyLink || '<p class="caption subtle">The full privacy policy is published here when the app launches.</p>'}
</div>` : '';

    const body = `
<nav class="wrap crumbs" aria-label="Breadcrumb"><ol class="label"><li><a href="${url('products/')}">Products</a></li><li aria-hidden="true">/</li><li aria-current="page">${esc(p.name)}</li></ol></nav>
<section class="wrap hero-sub split" aria-labelledby="app-h">
<div class="main stack g24">
${icon(p, 112)}
<div class="row g8">${badge(st.label, { tone: st.tone })}${badge(p.platform || 'Android')}${p.category ? badge(p.category) : ''}</div>
<h1 id="app-h" class="display-xl">${esc(p.name)}</h1>
<p class="body-lg lead" style="max-width: 580px;">${esc(p.tagline)}</p>
<div class="btns" style="padding-top: 8px;">${btn(a.primary.href, a.primary.label, 'primary', a.primary.extra || '')}${more(a.secondary.href, a.secondary.label)}</div>
${a.caption ? `<p class="caption subtle">${esc(a.caption)}</p>` : ''}
</div>
${side}
</section>
${perks}
${features}
${gallery}
${strip}
${privacyPanel}
<section class="wrap sec-lg row g48" aria-label="Details">
${left}
<aside class="stack g16" style="flex: 0 1 360px; min-width: 0;" aria-labelledby="facts-h">
<h2 id="facts-h" class="title">Details</h2>
<dl class="facts">${(p.facts || []).map((f) => `<div><dt class="label">${esc(f.k)}</dt><dd class="small">${esc(f.v)}</dd></div>`).join('')}</dl>
</aside>
</section>`;

    const path = `products/${p.slug}/`;
    return { path, html: page({
      path, title: p.name, seoTitle: p.seoTitle || `${p.name} for Android`, description: p.summary, body, current: 'products',
      action: a.dock, image: p.icon, ogKey: `product-${p.slug}`,
      schema: [organization, appSchema(p), breadcrumbs([['Products', 'products/'], [p.name, path]])]
    }) };
  }

  /* ---------- Privacy policy ---------- */

  function privacy(p) {
    const v = p.privacy;
    const { intro, sections } = splitPolicy(p.policy);
    const rows = [...(intro ? [{ id: 's0', n: '00', title: 'Overview', html: intro }] : []), ...sections];
    const meta = [
      ['Effective', v.effective],
      ['App', `${p.name} for ${p.platform || 'Android'}`],
      ['Developer', v.developer],
      ['Contact', v.contact ? `<a href="mailto:${esc(v.contact)}">${esc(v.contact)}</a>` : null]
    ].filter(([, val]) => val);

    const map = v.map ? `
<section class="sec stack g24" aria-labelledby="map-h">
<h2 id="map-h" class="label subtle">Where your data goes</h2>
<div class="map">
<div><div class="key"><span class="mark-solid" aria-hidden="true"></span><h3 class="title">Stays on your phone</h3></div><ul>${v.map.stays.map((x) => `<li><span class="body ink">${esc(x.t)}</span><span class="label subtle">${esc(x.n)}</span></li>`).join('')}</ul></div>
<div><div class="key"><span class="mark-line" aria-hidden="true"></span><h3 class="title">Leaves your phone</h3></div><ul>${v.map.leaves.map((x) => `<li style="gap: 8px;"><span class="body ink">${esc(x.t)}</span><span class="small muted">${esc(x.n)}</span></li>`).join('')}</ul></div>
<div><div class="key"><span class="mark-ring" aria-hidden="true"></span><h3 class="title">Reaches Aelnir</h3></div><p class="zero" aria-hidden="true">0</p><p class="body muted"><span class="ae-sr">Nothing. </span>${esc(v.map.reaches)}</p></div>
</div>
</section>` : '';

    const glance = v.permissions ? `
<section class="sec stack g24" aria-labelledby="glance-h">
<h2 id="glance-h" class="label subtle">Permissions at a glance</h2>
<ul class="hairgrid">${v.permissions.map((x) => `<li><h3 class="label ink">${esc(x.name)}</h3><p class="label subtle">${esc(x.keeps)}</p></li>`).join('')}</ul>
</section>` : '';

    const body = `
<div class="wrap sec-lg">
<nav class="crumbs" aria-label="Breadcrumb"><ol class="label"><li><a href="${url('products/')}">Products</a></li><li aria-hidden="true">/</li><li><a href="${productUrl(p)}">${esc(p.name)}</a></li><li aria-hidden="true">/</li><li aria-current="page">Privacy policy</li></ol></nav>
<header class="row end between g48" style="padding: 64px 0 80px;">
<div class="stack g24" style="flex: 1 1 600px; min-width: 0;">
<p class="label subtle">${esc(p.name)} privacy policy</p>
<h1 class="display-xl" style="max-width: 820px;">${esc(v.headline || `${p.name} privacy policy`)}</h1>
${v.lead ? `<p class="body-lg lead">${esc(v.lead)}</p>` : ''}
</div>
<dl class="meta small" style="flex: 0 1 340px; min-width: 0;">${meta.map(([k, val]) => `<div><dt class="label">${k}</dt><dd>${k === 'Contact' ? val : esc(val)}</dd></div>`).join('')}</dl>
</header>
${map}
${glance}
<nav class="toc" aria-labelledby="toc-h"><h2 id="toc-h" class="label subtle">The full policy</h2><ol class="small">${rows.map((r) => `<li><a href="#${r.id}"><span class="label subtle">${r.n}</span> ${r.title}</a></li>`).join('')}</ol></nav>
${rows.map((r) => `<section id="${r.id}" class="spec" aria-labelledby="${r.id}-h"><header><span class="label subtle">${r.n}</span><h2 id="${r.id}-h" class="display-md">${r.title}</h2></header><div class="prose body">${r.html}</div></section>`).join('\n')}
</div>`;

    const path = `products/${p.slug}/privacy/`;
    return { path, html: page({
      path, title: `${p.name} privacy policy`, description: v.lead || `How ${p.name} handles your data.`, body, current: 'products',
      image: p.icon, ogKey: `product-${p.slug}`,
      schema: [breadcrumbs([['Products', 'products/'], [p.name, `products/${p.slug}/`], ['Privacy policy', path]])]
    }) };
  }

  /* ---------- Join the closed test ---------- */

  function join(p) {
    const t = p.testing;
    const body = `
<div class="wrap sec-lg">
<nav class="crumbs" aria-label="Breadcrumb"><ol class="label"><li><a href="${url('products/')}">Products</a></li><li aria-hidden="true">/</li><li><a href="${productUrl(p)}">${esc(p.name)}</a></li><li aria-hidden="true">/</li><li aria-current="page">Join the test</li></ol></nav>
<div class="row g48" style="align-items: flex-start; gap: 64px; padding-top: 56px;">
<div class="stack g32" style="flex: 1 1 420px; min-width: 0;">
<div class="row center g16">${icon(p, 56)}${badge('Closed testing', { tone: 'warning' })}</div>
<div class="stack g16"><h1 class="display-lg">Claim a ${esc(p.name)} tester spot</h1><p class="body-lg muted">${t.cap} spots, first come first served. Test ${esc(p.name)} before anyone else, and keep it free for good.</p></div>
<div style="padding: 24px 0; border-block: 1px solid var(--line);">${spots(p)}</div>
<div class="stack g12 hide-on-phone">
<h2 class="label subtle">What you get</h2>
<ul class="numbered body muted">${t.perks.map((k, i) => `<li><span class="label n">${String(i + 1).padStart(2, '0')}</span>${esc(k.title)}</li>`).join('')}</ul>
${more(productUrl(p) + '#join', 'Perk details')}
</div>
</div>
<div class="panel" style="flex: 1 1 480px; min-width: 0; max-width: 560px; padding: clamp(24px, 4vw, 40px);" data-form-box>
<form class="form" data-form="tester" data-product="${esc(p.name)}" aria-labelledby="form-h">
<div class="stack g8"><h2 id="form-h" class="title">Your details</h2><p class="small muted">Two fields. Only the email is required.</p></div>
${c('Input', { label: 'Google account email', name: 'email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@gmail.com', hint: 'The account signed in to the Play Store on your phone. Google needs it to let you into the test.' })}
${c('Input', { label: 'WhatsApp number (optional)', name: 'whatsapp', type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+880 17XX XXXXXX', hint: 'For quick test updates, if you prefer WhatsApp to email.' })}
<div class="stack g12">
${c('Checkbox', { label: `Thank me in ${p.name}’s contributor credits`, name: 'credits', hint: 'We will ask how you would like your name shown.' })}
${c('Checkbox', { label: 'Email me about the test', name: 'consent', required: true, hint: 'Required, so we can send you the Google Play link.' })}
</div>
${c('Button', { type: 'submit', variant: 'primary', size: 'lg' }, 'Claim my spot')}
<p class="caption subtle" data-form-error hidden>That did not go through. Check your connection and try again.</p>
<p class="caption subtle">Your answers go to a Google Form we use only to run the ${esc(p.name)} test. We never sell or share them, and ask for a delivery address only when the gift box ships.</p>
</form>
<div class="stack g24" role="status" data-state="sent" hidden>
<span data-my-spot>${badge(`Spot held`, { tone: 'success' })}</span>
<h2 class="display-md">You’re in line.</h2>
<p class="body muted">Thank you. Here is what happens next.</p>
<ol class="rows" style="list-style: none; padding: 0;">${t.next.map((x, i) => `<li style="display: flex; gap: 16px; padding: 16px 0; border-top: 1px solid var(--line);"><span class="label subtle" style="flex: none; width: 24px; padding-top: 4px;">${String(i + 1).padStart(2, '0')}</span><span class="body ink">${esc(x)}</span></li>`).join('')}</ol>
${more(productUrl(p), `Back to ${p.name}`)}
</div>
<div class="stack g16" data-state="full" hidden>
<h2 class="title">This round is full</h2>
<p class="body muted">All ${t.cap} tester spots are taken. Leave your email and we will tell you once, when ${esc(p.name)} launches on Google Play.</p>
${btn(mailto(`Tell me when ${p.name} launches`), 'Tell me at launch', 'secondary')}
</div>
</div>
</div>
</div>`;

    const path = `products/${p.slug}/join/`;
    return { path, html: page({
      path, title: `Join the ${p.name} closed test`, description: `Claim one of ${t.cap} tester spots for ${p.name} and keep it free for good: no ads, no subscription.`,
      body, current: 'products', image: p.icon, ogKey: `product-${p.slug}`,
      schema: [breadcrumbs([['Products', 'products/'], [p.name, `products/${p.slug}/`], ['Join the test', path]])]
    }) };
  }

  /* ---------- Studio ---------- */

  function studio() {
    const proof = products.map((p) => p.studioProof && { ...p.studioProof, name: p.name, href: productUrl(p) }).filter(Boolean);
    const body = `
<section class="wrap hero split" aria-labelledby="hero-h">
<div class="main stack g24">
<p class="label subtle">Aelnir Studio</p>
<h1 id="hero-h" class="display-xl">Software for your business, built like our own.</h1>
<p class="body-lg lead">Android apps, websites, internal tools and automation. The same people and the same standards behind every Aelnir app.</p>
<div class="btns" style="padding-top: 8px;">${btn('#enquiry', 'Start a project')}${more('#proof', 'See what we have built')}</div>
</div>
<div class="side hide-on-phone">${c('Logo', { variant: 'stacked', arm: 'studio', size: 120 })}</div>
</section>
<section id="build" class="wrap sec stack g32" aria-labelledby="build-h">
<div class="head"><p class="label subtle">What we build</p><h2 id="build-h" class="display-md">Four kinds of work</h2></div>
<div class="cards rail" style="grid-template-columns: repeat(auto-fit, minmax(min(260px, 100%), 1fr));">
${c('Card', { eyebrow: '01', arm: 'studio', title: 'Android apps' }, '<p>Native Kotlin and Jetpack Compose, or Flutter when one codebase makes more sense. Built to work offline and keep data on the phone.</p>')}
${c('Card', { eyebrow: '02', arm: 'studio', title: 'Websites' }, '<p>Fast, accessible sites that update themselves from your own data. This site is one: its product list comes straight from our code.</p>')}
${c('Card', { eyebrow: '03', arm: 'studio', title: 'Software and tools' }, '<p>Internal tools, dashboards and business software shaped around how your team already works.</p>')}
${c('Card', { eyebrow: '04', arm: 'studio', title: 'Automation' }, '<p>Scripts, integrations and workflows that take the repetitive work off people and do it the same way every time.</p>')}
</div>
</section>
${proof.length ? `<section id="proof" class="wrap sec row g48" aria-labelledby="proof-h" style="gap: 32px 64px;">
<div class="stack g12" style="flex: 1 1 300px; max-width: 360px;">
<p class="label subtle">The proof</p><h2 id="proof-h" class="display-md">We build our own apps first</h2>
<p class="body muted">Every hard problem below was solved for an Aelnir app. Your project gets the same engineering.</p>
${more(url('products/'), 'All products')}
</div>
<ul class="rows" style="flex: 999 1 560px; min-width: 0; list-style: none; padding: 0;">${proof.map((x) => `<li style="display: flex; flex-wrap: wrap; gap: 8px 32px; padding: 24px 0; border-top: 1px solid var(--line);"><a class="title" href="${x.href}" style="flex: 0 0 220px; color: var(--ink); text-decoration: none;">${esc(x.name)}</a><div class="stack g8" style="flex: 1 1 300px; min-width: 0;"><p class="body muted">${esc(x.hard)}</p><p class="label subtle">${esc(x.stack)}</p></div></li>`).join('')}</ul>
</section>` : ''}
<section id="how" class="wrap sec stack g32" aria-labelledby="how-h">
<div class="head"><p class="label subtle">How we work</p><h2 id="how-h" class="display-md">Plain steps, no surprises</h2></div>
<ol class="hairgrid hairgrid-lg" style="grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));">
${[['Talk', 'Tell us the problem. We ask questions until we understand the job, not just the feature list.'], ['Plan and price', 'A short written plan and a price before any work starts.'], ['Build in the open', 'You see working builds as we go, not a single reveal at the end.'], ['Launch and look after', 'We ship it with you, then fix and improve it as real people use it.']]
  .map(([title, text], i) => `<li><span class="label" style="color: var(--studio);">${String(i + 1).padStart(2, '0')}</span><h3 class="title">${title}</h3><p class="small muted">${text}</p></li>`).join('')}
</ol>
</section>
<section id="enquiry" class="wrap sec-lg" aria-labelledby="enq-h">
<div class="panel-outline row g48" style="padding: clamp(24px, 4vw, 56px);">
<div class="stack g16" style="flex: 1 1 360px; min-width: 0;">
<p class="label subtle">Start a project</p>
<h2 id="enq-h" class="display-lg">Tell us what it needs to do.</h2>
<p class="body-lg muted">A few lines is enough. We come back with questions, a rough plan and a price range.</p>
</div>
<div style="flex: 1 1 420px; min-width: 0; max-width: 560px;" data-form-box>
<form class="form" data-form="studio" aria-labelledby="enq-h">
${c('Input', { label: 'Email', name: 'email', type: 'email', required: true, autoComplete: 'email', placeholder: 'you@company.com' })}
${c('Input', { label: 'WhatsApp number (optional)', name: 'whatsapp', type: 'tel', autoComplete: 'tel', inputMode: 'tel', placeholder: '+880 17XX XXXXXX' })}
${c('Textarea', { label: 'What do you need built?', name: 'message', required: true, rows: 5, placeholder: 'An app for our delivery riders, a booking site, an automated invoice report…' })}
${c('Button', { type: 'submit', variant: 'secondary', size: 'lg' }, 'Send')}
<p class="caption subtle" data-form-error hidden>That did not go through. Check your connection and try again.</p>
<p class="caption subtle">Your message goes to a Google Form we use only to reply to you.</p>
</form>
<div class="stack g16" role="status" data-state="sent" hidden>
${badge('Message sent', { arm: 'studio' })}
<h3 class="display-md">Thank you.</h3>
<p class="body muted">We read every message ourselves and reply with our questions first.</p>
</div>
</div>
</div>
</section>`;

    return { path: 'studio/', html: page({
      path: 'studio/', title: 'Aelnir Studio', seoTitle: 'Aelnir Studio: Android apps, websites and automation',
      description: 'Android apps, websites, internal tools and automation, built like our own products. Tell us what it needs to do.',
      body, arm: 'studio', current: 'studio', action: { href: '#enquiry', label: 'Start a project' }, ogKey: 'studio',
      schema: [breadcrumbs([['Studio', 'studio/']])]
    }) };
  }

  /* ---------- Labs ---------- */

  function labs() {
    const experiments = site.labs || [];
    const body = `
<section class="wrap hero split" aria-labelledby="hero-h">
<div class="main stack g24">
<p class="label subtle">Aelnir Labs</p>
<h1 id="hero-h" class="display-xl">Small bets on new technology.</h1>
<p class="body-lg lead">Experiments that might become products. Most stay small. What works graduates into Aelnir Products, and its line of light turns from violet to ice.</p>
</div>
<div class="side hide-on-phone">${c('Logo', { variant: 'stacked', arm: 'labs', size: 120 })}</div>
</section>
<section class="wrap sec stack g40" aria-labelledby="grad-h">
<div class="head"><p class="label subtle">How an experiment graduates</p><h2 id="grad-h" class="display-md">Three stages, one honest question each</h2></div>
<ol class="track">
<li><div class="bar" aria-hidden="true"><span class="node"></span><span class="seg"></span></div><div class="txt"><span class="label ink">Exploring</span><span class="small muted">Is the idea worth a week?</span></div></li>
<li><div class="bar" aria-hidden="true"><span class="node"></span><span class="seg seg-grad"></span></div><div class="txt"><span class="label ink">Prototype</span><span class="small muted">Does it work for real people?</span></div></li>
<li><div class="bar" aria-hidden="true"><span class="node node-grad"></span></div><div class="txt"><span class="label ink">Graduated</span><span class="small muted">It becomes an Aelnir Product.</span></div></li>
</ol>
</section>
<section class="wrap sec stack g32" aria-labelledby="now-h">
<div class="head-row"><div class="stack g12"><p class="label subtle">In the lab now</p><h2 id="now-h" class="display-md">Current experiments</h2></div><p class="label subtle sync">Updated from GitHub · ${builtOn}</p></div>
${experiments.length ? `<div class="cards cards-wide rail">${experiments.map((x) => c('Card', { eyebrow: x.stage, arm: 'labs', title: x.name, href: x.href }, `<p>${esc(x.question)}</p>${x.started ? `<p class="label subtle" style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--line);">Started ${esc(x.started)}</p>` : ''}`)).join('')}</div>`
  : `<div class="stack g12" style="align-items: flex-start; padding: 40px; border: 1px dashed var(--line-strong); border-radius: var(--radius-lg);"><h3 class="title">The lab is quiet right now</h3><p class="body muted" style="max-width: 560px;">New experiments appear here as soon as they start, straight from their repositories.</p></div>`}
</section>
<section class="wrap sec-lg" aria-labelledby="idea-h">
<div class="panel row center between g32" style="padding: clamp(24px, 4vw, 48px);">
<div class="stack g8" style="flex: 1 1 480px; min-width: 0;"><h2 id="idea-h" class="title">Got an idea worth testing?</h2><p class="body muted">Tell us the problem you would solve with new technology. Good ones become experiments.</p></div>
${btn(mailto('An idea for Aelnir Labs'), 'Share an idea', 'secondary')}
</div>
</section>`;

    return { path: 'labs/', html: page({
      path: 'labs/', title: 'Aelnir Labs', description: 'Experiments in new technology. What works graduates into Aelnir Products.',
      body, arm: 'labs', current: 'labs', action: { href: mailto('An idea for Aelnir Labs'), label: 'Share an idea' }, ogKey: 'labs',
      schema: [breadcrumbs([['Labs', 'labs/']])]
    }) };
  }

  /* ---------- 404 ---------- */

  function notFound() {
    const body = `
<div class="lost">
<main id="main">
${c('Logo', { variant: 'mark', size: 160 })}
<div class="stack g16 center"><p class="label subtle">404</p><h1 class="display-lg">This page fell in.</h1><p class="body muted">The address you followed doesn’t lead anywhere.</p></div>
<div class="btns" style="justify-content: center;">${btn(url(), 'Go home')}${more(url('products/'), 'All products')}</div>
</main>
</div>`;
    return { path: '404.html', html: page({ path: '404.html', title: 'Page not found', body, bare: true, noindex: true }) };
  }

  return { home, productsIndex, product, privacy, join, studio, labs, notFound };
}
