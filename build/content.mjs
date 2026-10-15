// Loads site settings and products.
//
// Products come from content/products/<slug>/product.json (committed seed
// data). When `npm run sync` has fetched manifests from GitHub, each synced
// product in .cache/products/<slug>/ is merged over its seed, and products
// that only exist on GitHub are added. Media paths in a manifest are relative
// to the folder the manifest sits in.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEED = path.join(ROOT, 'content', 'products');
const CACHE = path.join(ROOT, '.cache', 'products');

const STATUSES = ['live', 'testing', 'soon'];

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function readProducts(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(path.join(dir, d.name, 'product.json')))
    .map((d) => ({ dir: path.join(dir, d.name), data: readJson(path.join(dir, d.name, 'product.json')) }));
}

/** Resolve a manifest-relative media path to an absolute source file. */
function sourceOf(dirs, rel) {
  if (!rel) return null;
  for (const dir of dirs) {
    const file = path.join(dir, rel);
    if (existsSync(file)) return file;
  }
  return null;
}

export function loadSite() {
  const site = readJson(path.join(ROOT, 'content', 'site.json'));
  const syncedLabs = path.join(ROOT, '.cache', 'labs.json');
  if (existsSync(syncedLabs)) {
    const labs = readJson(syncedLabs);
    if (labs.length) site.labs = labs;
  }
  return site;
}

export function loadProducts() {
  const bySlug = new Map();
  for (const { dir, data } of readProducts(SEED)) bySlug.set(data.slug, { dirs: [dir], data });
  for (const { dir, data } of readProducts(CACHE)) {
    const seed = bySlug.get(data.slug);
    bySlug.set(data.slug, seed
      ? { dirs: [dir, ...seed.dirs], data: { ...seed.data, ...data } }
      : { dirs: [dir], data });
  }

  const products = [];
  for (const { dirs, data } of bySlug.values()) {
    if (!data.slug || !data.name) throw new Error(`Product manifest is missing slug or name: ${JSON.stringify(data).slice(0, 80)}`);
    if (!STATUSES.includes(data.status)) throw new Error(`${data.slug}: status must be one of ${STATUSES.join(', ')}`);
    if (data.hidden) continue;

    // `widths`: WebP copies the build makes of a PNG or JPEG, at these pixel widths.
    const media = [];
    const asset = (rel, widths = []) => {
      const from = sourceOf(dirs, rel);
      if (!from) return null;
      const to = `products/${data.slug}/media/${rel.replace(/\\/g, '/').replace(/^\.?\//, '')}`;
      media.push({ from, to, widths });
      return to;
    };

    const product = {
      ...data,
      icon: asset(data.icon, [256]),
      screenshots: (data.screenshots || [])
        .map((s) => ({ ...s, src: asset(s.src, [480, 720]) }))
        .filter((s) => s.src),
      media,
      policy: data.privacy?.policy ? readPolicy(sourceOf(dirs, data.privacy.policy)) : null,
      releases: data.releases || []
    };
    products.push(product);
  }

  return products.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || a.name.localeCompare(b.name));
}

function readPolicy(file) {
  return file ? readFileSync(file, 'utf8') : null;
}
