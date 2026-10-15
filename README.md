# Aelnir website

The Aelnir company site: products, Studio and Labs. It is a static site built
with Node and deployed to GitHub Pages. Every Aelnir app appears on it
automatically, and its page updates when the app's repository changes.

- **Design**: the Aelnir design system in `vendor/aelnir-ds/` (tokens, styles and
  React components). Components are rendered to plain HTML at build time, so the
  site ships no React.
- **Content**: `content/site.json` and one folder per product in `content/products/`.
- **Automation**: `.github/workflows/deploy.yml` syncs products from GitHub,
  builds and deploys on every push, every day at 03:17 UTC, and whenever an app
  repository asks for it.

## Run it locally

```bash
npm install
npm run dev
```

Then open http://localhost:4321. `npm run build` writes the site to `dist/`;
`npm run sync` pulls product manifests from GitHub into `.cache/`.

## How products get onto the site

The build starts from the seed data in `content/products/<slug>/product.json`,
then merges anything `npm run sync` found on GitHub over it. An app shows up
automatically when its repository:

1. has the topic **`aelnir-product`** (repository page → About → Topics), and
2. has an **`aelnir.json`** manifest at its root.

The manifest uses the same fields as the seed files. Paths are relative to the
repository root. A minimal one:

```json
{
  "slug": "scan",
  "name": "Aelnir Scan",
  "status": "soon",
  "category": "Utility",
  "package": "com.aelnir.scan",
  "icon": "docs/site/icon.png",
  "summary": "One line for product cards.",
  "tagline": "One or two sentences for the top of the product page."
}
```

| Field | What it does |
| --- | --- |
| `status` | `soon`, `testing` or `live`. Moves the app between Coming next, Now testing and Live, and changes its buttons. |
| `stage` | For `soon` apps: where the Road to launch box points (`development`). |
| `order` | Position in lists, lowest first. |
| `playUrl` | Google Play link, used once the app is `live`. |
| `screenshots` | `[{ "src", "alt" }]`. Two or more show beside the title; three or more add a gallery. Portrait 720×1536 works best. |
| `features` | `{ "title", "lead", "items": [{ "title", "body" }] }` |
| `strip` | `{ "label", "text" }`: a one-line list such as supported formats. |
| `note` | `{ "label", "title", "body" }`: a short privacy or pricing note. |
| `facts` | `[{ "k", "v" }]` for the Details list. |
| `privacy.policy` | Path to the privacy policy in Markdown. Publishes it at `/products/<slug>/privacy/`, the address to give Google Play. |
| `privacy.headline`, `lead`, `effective`, `developer`, `contact` | The policy page header. |
| `privacy.map`, `points`, `permissions` | Optional: the "where your data goes" board and permission summaries (see `content/products/reelock/product.json`). |
| `testing` | Closed-test settings: `cap`, `taken`, `spotsCsv`, `join`, `teaser`, `perks`, `finePrint`, `next`. |
| `studioProof` | `{ "hard", "stack" }`: the line about this app on the Studio page. |
| `hidden` | `true` keeps the app off the site. |

Releases come from the repository's GitHub Releases: the five latest appear on
the product page, with the release notes.

### Private app repositories

GitHub's built-in token can only read public repositories. For private ones,
create a fine-grained personal access token with **read-only Contents and
Metadata** on the app repositories, and save it in this repository as the
Actions secret **`AELNIR_REPOS_TOKEN`**.

### Rebuild right after an app release

The site rebuilds every day on its own. To update it as soon as an app is
released, add this workflow to the app repository and give it a secret
`SITE_DISPATCH_TOKEN` (a fine-grained token with **Contents: read and write** on
this website repository):

```yaml
# .github/workflows/notify-website.yml
name: Notify website
on:
  release:
    types: [published]
  push:
    branches: [main]
    paths: [aelnir.json]
jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - run: gh api repos/theprinceshanto/aelnir-website/dispatches -f event_type=product-updated
        env:
          GH_TOKEN: ${{ secrets.SITE_DISPATCH_TOKEN }}
```

## Labs

Experiments come from repositories with the topic **`aelnir-lab`**. An optional
`aelnir.json` sets `name`, `stage` (Exploring or Prototype), `question` and
`started`. With none, the Labs page shows its empty state.

## Forms

The tester sign-up and the Studio enquiry send answers to Google Forms. Until a
form is connected, the site opens the visitor's email app addressed to
`contactEmail` instead.

The quickest way is the setup script in `tools/google-forms/Code.gs`. It
creates both forms with the right questions and settings, their response
sheets, a rule that closes tester sign-ups at 20, an email to you for every
sign-up and enquiry, and a web app that reports how many tester spots are
taken (put its URL in the product's `testing.spotsCsv`):

1. Open https://script.new, replace the sample code with `Code.gs`, and save.
2. Pick `setup` in the toolbar and click Run. Approve the permissions.
3. Deploy → New deployment → Web app; Execute as: Me; Who has access: Anyone.
4. Run `printSettings` and copy the log into `content/site.json`.

To connect a form by hand instead:

1. Build it in Google Forms with the same questions (tester: email, WhatsApp,
   credits checkbox, consent checkbox; Studio: email, WhatsApp, message).
   In Settings, turn **off** "Collect email addresses" and "Limit to 1 response":
   both require a Google sign-in, which stops submissions from the site.
2. Open ⋮ → **Get pre-filled link**, fill every field, and copy the link. It
   contains the form ID and one `entry.<number>` per question.
3. In `content/site.json`, set `action` to
   `https://docs.google.com/forms/d/e/<form-id>/formResponse` and each field to
   its `entry.<number>`. For a checkbox, `value` must match the option text in
   the form exactly.

### Live tester-spot counter

In the form's response sheet, add a tab that holds only
`=COUNTA('Form Responses 1'!B2:B)`, publish **only that tab** as CSV
(File → Share → Publish to web), and put the link in the product's
`testing.spotsCsv`. Never publish the responses tab: it holds testers' emails
and phone numbers.

## Deploying

1. Push this repository to GitHub.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. The next push, or Actions → Build and deploy → Run workflow, publishes the
   site at `https://<user>.github.io/<repository>/`.

### Custom domain

The site runs on **aelnir.com**, set in two places that must agree:

1. Settings → Pages → Custom domain (with the DNS records GitHub shows), and
2. `"domain"` in `content/site.json`, which builds every link for the root of
   that domain.

To move domains, change both and push. To go back to the GitHub address,
remove `"domain"`; the build then takes the path from GitHub Pages.
Turn on **Enforce HTTPS** in Settings → Pages once GitHub has issued the
certificate.

## Search and sharing

Every build gives each page:

- a search title (`seoTitle` in a manifest, under 60 characters) and description,
- a canonical address on the custom domain, `sitemap.xml` and `robots.txt`,
- structured data: Organization and WebSite on the home page, MobileApplication
  for each app, an ItemList of apps, and breadcrumbs,
- a 1200×630 share image made by `npm run og` (headless Chrome) for WhatsApp,
  Facebook, X and LinkedIn previews. New apps get one on the next deploy.

The 404 page is kept out of search results.

Once, after launch: add `aelnir.com` as a Domain property in
[Google Search Console](https://search.google.com/search-console) (it asks
for a DNS TXT record), then submit `https://aelnir.com/sitemap.xml`. Do the
same in Bing Webmaster Tools, which can import the Search Console property.

## Updating the design system

`vendor/aelnir-ds/` is a copy of `aelnir-design-system/`: `tokens.css`,
`tokens.json`, `components/bundle.css`, `components/bundle.js` and a few brand
files in `logos/`. Copy newer versions over them and rebuild.
