# Kompakt Web — expanded edition

## Cloudflare Workers Static Assets
The production site uses `wrangler.jsonc`: `src/index.js` handles `/api/*`, and `public/` contains the static assets. There is no frontend build step. Keep the existing production domain, bindings and secrets when deploying through the established Cloudflare workflow.

The contact form posts JSON to `/api/contact`; `functions/api/contact.js` verifies Cloudflare Turnstile and integrates with Notion and Telegram. Legacy Netlify attributes in the HTML do not configure production delivery. Verify a real enquiry after an intentional deployment; never put private credentials in HTML or tracked files.

Workers Static Assets currently redirects `.html` page requests to extensionless URLs and `index.html` to directory URLs. Canonical metadata, sitemap entries and navigation use those final URLs; keep the existing redirects. See [the November 9 SEO audit](docs/seo-audit-2026-11-09.md) for all 15 Search Console URL findings, Cloudflare instructions and post-deployment checks.

## Content and languages
Serbian is the default at `/`. English is at `/en/`, Russian at `/ru/`. The language flags preserve the current page and section. Each local SVG flag has an accessible language name, so it renders consistently on Windows as well as mobile devices. Each language has complete static HTML, metadata, canonical and alternate language links; no translation API or automatic browser-language redirection is used.

Original four packages, euro prices, exclusions and four-step methodology are retained. New content covers approach, responsive design, a real project preview, process details, service guidance and FAQs. The four benefit statistics now describe local search intent, purchases, mobile abandonment and retail conversion research. The public statistics now show only a short heading and one direct statement; research references are retained below for editing, without visible website citations. They are historical international research, not client results or a forecast for Serbia. Service illustrations are labelled as illustrations; they are not measured scores or guaranteed results.

## Motion and performance
The default hero artwork is a local static SVG sphere with a static CSS laptop. No animation must run for the illustration to appear. After the full page loads and the browser is idle, capable devices may get a lightweight canvas 3D sphere, capped at about 30 fps with a bounded backing-store resolution.

The page stays static when any of these signals apply: four or fewer logical CPU threads, 4 GB or less reported device memory, data-saving mode, a slow-2g/2g connection, or a performance fallback recorded earlier in this tab session. Missing device APIs are not treated as an error; runtime monitoring still applies.

During animation, four consecutive renders costing over 8 ms, or a rolling 1.5-second sample with at least 12 frames and more than 40% of intervals exceeding 55 ms, trigger the static fallback. That decision is retained in sessionStorage when available. The canvas loop stops, observers disconnect, and its backing store is released. Decorative CSS motion is also disabled. Hardware hints are conservative approximations, not exact device speed measurements.

The canvas stops when off screen, when the tab is hidden, when the visitor pauses motion, or when reduced motion is requested. There are no external 3D libraries or model downloads. If JavaScript is unavailable, visitors see the static artwork and can use native language flag links.

## Research behind the four benefit statistics
- 76% / 28%: Google/Purchased Digital Diary, May 2016, US smartphone users; 76% of people searching for something nearby visited a related business within a day, and 28% of nearby smartphone searches led to a purchase. Source: https://blog.google/products-and-platforms/products/ads/the-year-of-supershopper/
- 53%: Google global aggregated mobile-web analytics, March 2016; abandonment for mobile visits taking longer than three seconds to load. Reported in https://blog.google/products-and-platforms/products/ads/speed-scorecard-impact-calculator/
- +8.4%: Google-commissioned Deloitte/55 research, 2020; higher retail conversion rates observed when four speed metrics each improved by 0.1 seconds across the customer journey. This does not mean every 0.1-second change on any website produces that result. Source: https://web.dev/case-studies/milliseconds-make-millions

## SEO: kompaktweb.rs, all of Serbia
All 18 indexable pages have unique titles and descriptions targeting Serbia in their own language, self-canonical URLs, reciprocal Serbian/English/Russian/x-default alternate links, and branded PNG social previews. Visible headings, service introductions, homepage copy and footers describe nationwide service, including online collaboration.

Structured data describes the real organisation, website, current page, breadcrumbs and individual service where applicable. Organisation and service coverage use the country Serbia (RS). No physical office address, phone number, review or rating has been fabricated. Thank-you pages remain noindexed and are excluded from the multilingual sitemap. Internal homepage links use the canonical directory URLs.

Service and project pages have visible breadcrumbs matching their structured data. Every indexable page links directly to all service pages, projects, packages and contact in its footer. Descriptive headings and consistent internal links help Google understand the site hierarchy; Google automatically decides whether to show sitelinks. See https://developers.google.com/search/docs/appearance/sitelinks.

## Analytics and mobile layout
Every HTML head, including all three thank-you pages, contains one Google tag for `G-V2S6XTTB56`. Local browser checks block Google Analytics requests so QA visits do not enter the live property. Actual receipt of events in the owner's Analytics account must be checked after deployment.

Shared responsive styles allow grid children and form fields to shrink to the viewport, wrap long text and footer links, and reduce form padding on phones. Form text uses 16px on phones to avoid input-focus zoom. Turnstile uses its supported compact size so its verification UI fits narrow form containers. All 21 pages were checked in headless Edge at 320, 375, 390, 600, 768, 1024 and 1440px, including expanded navigation: 255 layout checks passed without horizontal overflow. This is browser emulation, not a physical iPhone or Android test.

After deploying, verify the existing primary Cloudflare hostname https://kompaktweb.rs, then submit https://kompaktweb.rs/sitemap.xml in the owner's Google Search Console account. No Search Console or Google Business Profile account was accessed or configured by this update.

## Scroll reveals
Sections, individual cards, process steps and FAQ items fade in once as they enter view, with a small stagger between siblings. The effect uses opacity and translation only and works independently of the 3D performance fallback. Reduced-motion and no-JavaScript visitors see content immediately.

## Readability and navigation
Statistics use larger body text and one card per row on phones. The four values count from zero when they first enter view, with a 1.4-second easing animation, localised decimals and a stable final value for screen readers. The brief counter animation remains available when only the 3D performance fallback is active. Reduced-motion preferences or a manual animation pause show the final values immediately.

Navbar section links use native smooth scrolling with spacing for the fixed header. Static 3D mode no longer disables smooth scrolling; reduced-motion preferences still disable it.

## Editing
Shared styling: `enhancements.css`, alongside original brand stylesheets. Shared interactions: `experience.js`. Edit text directly in each language's HTML when updating copy. Package option values intentionally remain stable Serbian identifiers for form processing and preselection.

External resources: Google Fonts, Google Analytics and Cloudflare Turnstile. System font fallbacks remain usable if fonts are unavailable. Existing social links, project destination and images were retained. Domain-based metadata assumes https://kompaktweb.rs.

## Verification
Run `node scripts/verify-seo.mjs` to check local canonical metadata, reciprocal hreflang, structured data, sitemap coverage, robots.txt and internal links/assets. Historical checks covered translation coverage, 18 unique SEO titles/descriptions and simulated browser APIs for device hints, reduced motion, animation performance, navigation and multilingual form handling. For the November 9 audit, see the linked report for actual live HTTP observations and verification limits. Verify real contact delivery through Cloudflare Turnstile, Notion and Telegram after deployment.

## Limited launch offer
The offer is 160 EUR reduced to 80 EUR for a five-page site, with 9 places
remaining. The launch banner and contact-form option are on all three
homepages. The entry dialog also appears on service and project pages, once
per browser tab session. It supports keyboard dismissal and focus return.
The place count is a manually maintained value, not a live reservation system;
update the banner and dialog copy in the HTML pages when availability changes.
Hosting/domain remain excluded. No enquiry automatically reserves a place.
Scroll fades and count-up effects respect reduced-motion preferences. Without
JavaScript, statistics retain their final values and page content stays visible.
