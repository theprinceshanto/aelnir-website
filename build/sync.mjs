// Pulls product and lab manifests from GitHub into .cache/, where the build
// merges them over the seed data in content/.
//
// A product repository opts in by having the `aelnir-product` topic and an
// `aelnir.json` manifest at its root (see README). A Labs experiment uses the
// `aelnir-lab` topic. Paths inside a manifest are relative to the repo root.
//
//   AELNIR_REPOS_TOKEN  a token that can read the app repositories (needed for
//                       private ones). Falls back to GITHUB_TOKEN.
//   AELNIR_OWNER        the user or organisation to search (default from content/site.json).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { marked } from 'marked';
import { loadSite, ROOT } from './content.mjs';

const site = loadSite();
const token = process.env.AELNIR_REPOS_TOKEN || process.env.GITHUB_TOKEN || '';
const owner = process.env.AELNIR_OWNER || site.github.owner;
const CACHE = path.join(ROOT, '.cache');

const renderer = new marked.Renderer();
renderer.html = ({ text }) => text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function gh(route, raw = false) {
  const res = await fetch(`https://api.github.com${route}`, {
    headers: {
      Accept: raw ? 'application/vnd.github.raw+json' : 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'aelnir-website-sync',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${route}: ${(await res.text()).slice(0, 200)}`);
  return raw ? Buffer.from(await res.arrayBuffer()) : res.json();
}

async function reposWithTopic(topic) {
  const q = encodeURIComponent(`topic:${topic} user:${owner} archived:false`);
  const result = await gh(`/search/repositories?q=${q}&per_page=100`);
  return result ? result.items : [];
}

const fileOf = (repo, rel) => gh(`/repos/${repo}/contents/${rel.split('/').map(encodeURIComponent).join('/')}`, true);

function safeRel(rel) {
  const clean = path.posix.normalize(String(rel).replace(/\\/g, '/')).replace(/^\/+/, '');
  if (clean.startsWith('..')) throw new Error(`Path leaves the repository: ${rel}`);
  return clean;
}

async function syncProduct(repo) {
  const buf = await fileOf(repo.full_name, 'aelnir.json');
  if (!buf) { console.log(`- ${repo.full_name}: no aelnir.json, skipped`); return null; }
  const manifest = JSON.parse(buf.toString('utf8'));
  if (!manifest.slug || !/^[a-z0-9-]+$/.test(manifest.slug)) throw new Error(`${repo.full_name}: aelnir.json needs a lowercase "slug"`);

  const dir = path.join(CACHE, 'products', manifest.slug);
  mkdirSync(dir, { recursive: true });
  const files = [manifest.icon, ...(manifest.screenshots || []).map((s) => s.src), manifest.privacy?.policy].filter(Boolean);
  for (const rel of files) {
    const clean = safeRel(rel);
    const data = await fileOf(repo.full_name, clean);
    if (!data) { console.log(`  ${repo.full_name}: ${clean} not found`); continue; }
    mkdirSync(path.dirname(path.join(dir, clean)), { recursive: true });
    writeFileSync(path.join(dir, clean), data);
  }

  const releases = ((await gh(`/repos/${repo.full_name}/releases?per_page=5`)) || [])
    .filter((r) => !r.draft)
    .map((r) => ({
      version: r.tag_name,
      date: new Date(r.published_at || r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }),
      html: marked.parse(r.body || '', { renderer })
    }));

  writeFileSync(path.join(dir, 'product.json'), JSON.stringify({ ...manifest, repo: repo.full_name, releases }, null, 2));
  console.log(`- ${repo.full_name}: ${manifest.slug} (${manifest.status || 'status from seed'}, ${releases.length} releases)`);
  return manifest.slug;
}

async function syncLab(repo) {
  const buf = await fileOf(repo.full_name, 'aelnir.json');
  const manifest = buf ? JSON.parse(buf.toString('utf8')) : {};
  return {
    name: manifest.name || repo.name,
    stage: manifest.stage || 'Exploring',
    question: manifest.question || repo.description || '',
    started: manifest.started || new Date(repo.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
    href: manifest.public ? repo.html_url : undefined
  };
}

rmSync(CACHE, { recursive: true, force: true });
mkdirSync(path.join(CACHE, 'products'), { recursive: true });
console.log(`Syncing from github.com/${owner}${token ? '' : ' (no token: public repositories only)'}`);

const products = await reposWithTopic(site.github.topic);
for (const repo of products) {
  try { await syncProduct(repo); } catch (error) { console.log(`- ${repo.full_name}: ${error.message}`); }
}

const labs = await reposWithTopic(site.github.labTopic || 'aelnir-lab');
writeFileSync(path.join(CACHE, 'labs.json'), JSON.stringify(await Promise.all(labs.map(syncLab)), null, 2));
console.log(`Done: ${products.length} product repositories, ${labs.length} lab repositories.`);
