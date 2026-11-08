# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Marketing website for Baars Glas en Gevelwerken (gevelreiniging, glasbewassing, impregneren, buitenreiniging), Capelle aan den IJssel / regio Rotterdam. All site content is in **Dutch** — write new copy, error messages and UI text in Dutch.

Plain static site: static HTML pages + Bootstrap/jQuery, one PHP script for the contact form. There is no package.json or build step. `python tools/verify-site.py` checks titles/metas, JSON-LD, canonicals vs sitemap, internal links/anchors, FAQ sync and forbidden strings; run it after any page change (`tools/` is not deployed).

## Running & deploying

- Preview locally with any static server from the repo root, e.g. `php -S localhost:8000` (PHP server also makes `assets/php/contact.php` reachable, though `mail()` won't actually send locally). Clean URLs (`/gevelreiniging`) only resolve on Apache via `.htaccess`; locally open the `.html` file, or run the `php:8.3-apache` Docker image with `a2enmod rewrite headers` and `AllowOverride All` to test redirects.
- **Pushing to `main` deploys to production** via FTP (`.github/workflows/deploy-ftp.yml`). Work happens on `dev`; merge to `main` via PR. The deploy uploads the whole repo except `.git*`, `.github`, `*.md`, `email/`, `tools/`, `logs/`, `*.ps1`.

## Architecture

### Pages are standalone, with duplicated shared markup
Each `*.html` in the root is a full page. There is no templating/includes, so the `<head>` (meta, OG/Twitter tags, JSON-LD, GA consent bootstrap), navbar (Diensten dropdown, Zakelijk, Prijzen, Over ons, phone, Contact button), trust strip under the H1, CTA strip, footer, sticky mobile contact bar (`.mobile-cta-bar`) and script tags are **identical copies in every page**. A change to any of them must be applied to all pages (grep across `*.html`). Our own CSS/JS are linked with `?v=YYYYMMDD` and cached for 1 year: bump it in every page when you change `style.css` or a JS file.

Service pages (e.g. `gevelreiniging.html`, `dak-reinigen.html`) share a structure: JSON-LD `@graph` with `LocalBusiness`, `WebSite`, `BreadcrumbList`, `Service` and `FAQPage` (built from exactly the visible accordion questions), a visible breadcrumb `<nav>` (no microdata), a price block with the line "Richtprijs; de exacte prijs hangt af van de ondergrond, de benodigde materialen en de bereikbaarheid.", a CTA strip, FAQ and related-service cards. `diensten.html` is the grouped overview. Other pages: `/contact`, `/zakelijk`, `/prijzen`, `/over-ons`, `/werkgebied`, `/glazenwasser-rotterdam`, `/kennisbank` + articles, `404.html` (absolute `/assets/` paths because it is served at any URL). When adding a page, copy a similar one and also update: `sitemap.xml`, `diensten.html` / nav dropdown / footer if relevant, and `llms.txt`. Every "Wat kost...?" FAQ links to `/prijzen`. Copy is "u"-form in Jaco's "ik"-voice; only publish facts the owner confirmed.

### URLs
`.htaccess` forces `https://baarsglasengevelwerken.nl` (non-www), strips `.html` (`index.html` -> `/`) and trailing slashes (301), maps clean URLs back to `.html` internally, redirects old `/?go=contact` -> `/contact` and `/?go=x` -> `/#x`, `/dak-impregneren` -> `/dak-reinigen#impregneren`, sets security headers and `ErrorDocument 404 /404.html`. Internal links use clean absolute paths (`/gevelreiniging`, `/privacy`); don't link to `/?go=` any more (use `/contact` or `/#section`; `custom.js` still handles both). Never give a page the same slug as a folder (e.g. `kennisbank.html` + `kennisbank/`): Apache's directory-slash redirect then loops, so articles live at flat URLs like `/hoe-vaak-ramen-laten-wassen`. Canonical/OG URLs must use the clean form.

### CSS / SCSS — edit `assets/css/style.css` directly
`assets/scss/` is the original theme source but is **out of sync**: `style.css` has been edited by hand since (e.g. the `.cookie-banner` styles exist only in CSS), and `style.scss` imports a non-existent `_login.scss`. Recompiling SCSS would drop changes. Make style edits in `assets/css/style.css` unless the user decides to resync the SCSS.

### Analytics & cookie consent (GA4 `G-2JCXZNTE32`, Consent Mode v2)
Three pieces cooperate via the storage key `cookie_consent_v1` (value `"all"` or `"reject"`, stored in localStorage, a cookie and `window.name` as fallbacks):
1. Inline `<head>` script on every page: sets `gtag('consent','default', …)` denied unless stored `"all"`, sets `window.__gaConsentGranted`, and only when `"all"` is stored injects `gtag.js` and calls `gtag('config', …)` (Consent Mode basic: without consent Google Analytics is not loaded at all and nothing is sent to Google).
2. `assets/js/consent.js`: shows the Dutch cookie banner when no choice is stored; on accept loads `gtag.js` (guarded by `window.__gaScriptLoaded`), updates consent and initializes GA (guarded by `window.__gaInitialized`).
3. `assets/js/analytics-events.js`: delegated click tracking (`phone_click`, `whatsapp_click` for `wa.me` links, `email_click`, social/outbound, `.js-contact-link`, `.service-card-link`, `.back_top`, `.img-zoom`), each with a `from` location (nav, sticky_bar, cta_strip, footer, hero, content...), contact form start, scroll depth — all gated on consent. Give new CTAs the class `js-contact-link`.

`consent.js` also handles the "Cookiekeuze resetten" button (`#reset_cookie_choice`) on `/cookies`.

`cookies.html` and `privacy.html` describe this behaviour; keep them consistent if tracking changes.

### Contact form
`#working_form` (identical on `/contact` and in `index.html` `#contact`) is submitted via AJAX by `assets/js/contact.js` as `FormData` (supports file attachments) to `assets/php/contact.php`. Required: name, comments and phone **or** email; optional customer_type (radio, not pre-selected), service and found_via (whitelisted select values: keep the lists in the HTML and the PHP in sync), legacy subject; hidden honeypot `website`. Max 5 attachments of jpg/jpeg/png/webp/pdf ≤ 5 MB; sends via `mail()` to `info@baarsglasengevelwerken.nl`. `custom.js` scrolls `/contact` links to the form when the page has one. It returns an HTML fragment that the JS injects into `#message`; the JS treats a response containing `success` (the `#success_msg` div) as success and fires the GA `generate_lead` event — keep that marker if editing the success output.

### Assets
Images are mostly `.webp` under `assets/images/` (hero: one `<img srcset>` with mobile/tablet/desktop variants and a matching `<link rel=preload imagesrcset>` in `index.html`; social share images in `assets/images/og/`). Google Fonts load with `display=optional` (a late font swap was the homepage LCP and caused CLS). Third-party libs (Bootstrap, jQuery, Owl Carousel, Isotope, Magnific Popup, Typed.js, animate.css) are vendored minified files in `assets/css` and `assets/js` — don't edit them. Pages load `assets/css/bootstrap.purged.min.css`, a PurgeCSS build of `bootstrap.min.css` with only the classes the site uses: when you use a Bootstrap class that wasn't used before, regenerate it with `npx purgecss@6.0.0 --config tools/purgecss.config.cjs --output assets/css/bootstrap.purged.min.css` and bump `?v=`. `email/` holds images for the email signature and isn't deployed.

## SEO conventions
Each page has its own `<title>`, meta description, canonical, OG/Twitter tags and JSON-LD. The `LocalBusiness` entity is identical in the JSON-LD of every page (address Narcisstraat 33, 2906 EA Capelle aan den IJssel; tel +31657614022; KvK 74201654; founded 2019; VCA; `@id` `https://baarsglasengevelwerken.nl/#localbusiness`). Changes to business details must be made in all of them, in the footer, `/over-ons`, `/contact`, privacy and `llms.txt`. No `aggregateRating`/`Review` schema (self-served reviews are ineligible); don't hard-code a review count. Update `sitemap.xml` `<lastmod>` when page content changes.
