# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing website for Baars Glas en Gevelwerken (gevelreiniging, glasbewassing, impregneren, buitenreiniging), Capelle aan den IJssel / regio Rotterdam. All site content is in **Dutch** — write new copy, error messages and UI text in Dutch.

Plain static site: hand-written HTML pages + Bootstrap/jQuery, one PHP script for the contact form. There is no package.json, build step, linter or test suite.

## Running & deploying

- Preview locally with any static server from the repo root, e.g. `php -S localhost:8000` (PHP server also makes `assets/php/contact.php` reachable, though `mail()` won't actually send locally). Clean URLs (`/gevelreiniging`) only resolve on Apache via `.htaccess`; locally open the `.html` file.
- **Pushing to `main` deploys to production** via FTP (`.github/workflows/deploy-ftp.yml`). Work happens on `dev`; merge to `main` via PR. The deploy uploads the whole repo except `.git*`, `.github`, `*.md`, `email/`, `tools/`, `logs/`, `*.ps1`.

## Architecture

### Pages are standalone, with duplicated shared markup
Each `*.html` in the root is a full page. There is no templating/includes, so the `<head>` (meta, OG/Twitter tags, JSON-LD, GA consent bootstrap), navbar, footer and script tags are **copy-pasted in every page**. A change to nav, footer, contact info, GA config or script list must be applied to all pages (grep across `*.html`).

Service pages (e.g. `gevelreiniging.html`, `dak-reinigen.html`) share a structure: JSON-LD `@graph` with `BreadcrumbList` + `Service`, a visible breadcrumb `<nav>`, and the same nav/footer. `diensten.html` is the overview linking to them. When adding a service page, copy an existing one and also update: `sitemap.xml`, the links on `diensten.html` / `index.html`, and footer/nav links if relevant.

### URLs
`.htaccess` forces `https://baarsglasengevelwerken.nl` (non-www), strips `.html` and trailing slashes (301), and maps clean URLs back to `.html` internally. Internal links therefore use clean absolute paths (`/gevelreiniging`, `/privacy`). Links to homepage sections from other pages use `/?go=<sectionId>` (e.g. `/?go=contact`); `assets/js/custom.js` handles `?go=` and `#hash` links with navbar-offset smooth scrolling and scrollspy. Canonical/OG URLs must use the clean form.

### CSS / SCSS — edit `assets/css/style.css` directly
`assets/scss/` is the original theme source but is **out of sync**: `style.css` has been edited by hand since (e.g. the `.cookie-banner` styles exist only in CSS), and `style.scss` imports a non-existent `_login.scss`. Recompiling SCSS would drop changes. Make style edits in `assets/css/style.css` unless the user decides to resync the SCSS.

### Analytics & cookie consent (GA4 `G-2JCXZNTE32`, Consent Mode v2)
Three pieces cooperate via the storage key `cookie_consent_v1` (value `"all"` or `"reject"`, stored in localStorage, a cookie and `window.name` as fallbacks):
1. Inline `<head>` script on every page: sets `gtag('consent','default', …)` denied unless stored `"all"`, sets `window.__gaConsentGranted`, and only calls `gtag('config', …)` if consent was already given.
2. `assets/js/consent.js`: shows the Dutch cookie banner when no choice is stored; on accept updates consent and initializes GA (guarded by `window.__gaInitialized`).
3. `assets/js/analytics-events.js`: delegated click tracking (phone/email/social/outbound, `.js-contact-link`, `.service-card-link`, `.back_top`, `.img-zoom`, portfolio filters), contact form start, scroll depth — all gated on consent. Adding these classes to elements is how new links get tracked.

`cookies.html` and `privacy.html` describe this behaviour; keep them consistent if tracking changes.

### Contact form
`#working_form` (on `index.html`) is submitted via AJAX by `assets/js/contact.js` as `FormData` (supports file attachments) to `assets/php/contact.php`. The PHP validates required fields (name, email, phone, subject, customer_type, comments), allows max 5 attachments of jpg/jpeg/png/webp/pdf ≤ 5 MB, and sends via `mail()` to `info@baarsglasengevelwerken.nl`. It returns an HTML fragment that the JS injects into `#message`; the JS treats a response containing `success` (the `#success_msg` div) as success and fires the GA `generate_lead` event — keep that marker if editing the success output.

### Assets
Images are mostly `.webp` under `assets/images/` (hero has desktop/tablet/mobile variants preloaded by an inline script in `index.html`). Third-party libs (Bootstrap, jQuery, Owl Carousel, Isotope, Magnific Popup, Typed.js, animate.css) are vendored minified files in `assets/css` and `assets/js` — don't edit them. `email/` holds images for the email signature and isn't deployed.

## SEO conventions
Each page has its own `<title>`, meta description, canonical, OG/Twitter tags and JSON-LD. The `LocalBusiness` entity is repeated in the JSON-LD of every page except cookies/privacy (address Narcisstraat 33, 2906 EA Capelle aan den IJssel; tel +31657614022) and uses the `@id` `https://baarsglasengevelwerken.nl/#localbusiness`. Changes to business details must be made in all of them. Update `sitemap.xml` `<lastmod>` when page content changes.
