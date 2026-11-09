// Run from any directory: node scripts/verify-seo.mjs
// Checks the repository only; no external requests or form submissions.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const origin = 'https://kompaktweb.rs';
const read = file => readFileSync(file, 'utf8');
const walk = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
const withoutComments = text => text.replace(/<!--[\s\S]*?-->/g, '');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)]
  .map(([, key, , value]) => [key.toLowerCase(), value.replaceAll('&amp;', '&')]));
const tags = (text, name) => [...text.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))]
  .map(([tag]) => attrs(tag));
const route = file => '/' + path.relative(root, file).replaceAll(path.sep, '/')
  .replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
const pages = new Map(walk(root).filter(file => file.endsWith('.html')).map(file => {
  const html = withoutComments(read(file));
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert(head, `${file}: missing head`);
  const meta = tags(head, 'meta');
  return [origin + route(file), { file, html, head, meta,
    noindex: meta.some(tag => tag.name === 'robots' && /\bnoindex\b/.test(tag.content)),
    lang: tags(html, 'html')[0]?.lang,
    links: tags(head, 'link'),
    ids: new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1])) }];
}));
const indexable = new Map([...pages].filter(([, page]) => !page.noindex));
assert.equal(indexable.size, 18, 'Expected 18 indexable pages');
assert.equal(pages.size - indexable.size, 3, 'Thank-you pages must remain noindexed');
const titleSet = new Set();
const descriptionSet = new Set();
let referenceCount = 0;

function expectedAlternates(url) {
  const pathname = new URL(url).pathname.replace(/^\/(en|ru)(?=\/)/, '');
  return { sr: origin + pathname, en: origin + '/en' + pathname,
    ru: origin + '/ru' + pathname, 'x-default': origin + pathname };
}
function alternateMap(links) {
  const entries = links.filter(tag => tag.rel === 'alternate' && tag.hreflang);
  assert.equal(entries.length, 4, 'Expected four hreflang entries');
  return Object.fromEntries(entries.map(tag => [tag.hreflang, tag.href]));
}
function inspectStructuredData(value, source) {
  if (typeof value === 'string' && /^https?:\/\/(www\.)?kompaktweb\.rs(?:\/|$)/.test(value)) {
    const url = new URL(value);
    assert.equal(url.origin, origin, `${source}: noncanonical origin ${value}`);
    assert(!url.pathname.endsWith('.html'), `${source}: redirecting structured URL ${value}`);
    url.hash = ''; url.search = '';
    assert(pages.has(url.href), `${source}: unknown structured page ${value}`);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) inspectStructuredData(item, source);
  }
}

for (const [url, page] of indexable) {
  const canonicals = page.links.filter(tag => tag.rel === 'canonical');
  assert.equal(canonicals.length, 1, `${page.file}: expected one canonical`);
  assert.equal(canonicals[0].href, url, `${page.file}: canonical must reference final self URL`);
  const expected = expectedAlternates(url);
  assert.deepEqual(alternateMap(page.links), expected, `${page.file}: incorrect hreflang`);
  assert.equal(expected[page.lang], url, `${page.file}: wrong HTML language`);
  for (const target of Object.values(expected)) {
    assert(indexable.has(target), `${page.file}: hreflang target is not indexable: ${target}`);
    assert.deepEqual(alternateMap(indexable.get(target).links), expected,
      `${page.file}: hreflang must be reciprocal`);
  }
  assert.equal(page.meta.find(tag => tag.property === 'og:url')?.content, url,
    `${page.file}: Open Graph URL differs from canonical`);
  const title = page.head.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  const description = page.meta.find(tag => tag.name === 'description')?.content;
  assert(title && !titleSet.has(title), `${page.file}: missing/duplicate title`);
  assert(description && !descriptionSet.has(description), `${page.file}: missing/duplicate description`);
  titleSet.add(title); descriptionSet.add(description);
  const jsonBlocks = [...page.head.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert(jsonBlocks.length, `${page.file}: missing structured data`);
  for (const [, json] of jsonBlocks) {
    const data = JSON.parse(json);
    inspectStructuredData(data, page.file);
    assert(data['@graph'].some(node => /Page$/.test(node['@type']) && node.url === url),
      `${page.file}: structured page URL must match canonical`);
  }
}

for (const [url, page] of pages) {
  assert(!/https?:\/\/www\.kompaktweb\.rs\b/.test(page.html), `${page.file}: WWW reference`);
  for (const tag of tags(page.html, '(?:a|link|script|img|form)')) {
    // Form actions are deliberately preserved, and are checked for existence only.
    for (const key of ['href', 'src', 'action', 'data-locale-href']) {
      const value = tag[key];
      if (!value || /^(?:mailto:|tel:|data:|javascript:)/i.test(value)) continue;
      const target = new URL(value, url);
      if (target.origin !== origin) continue;
      referenceCount++;
      const filePath = path.join(root, decodeURIComponent(target.pathname));
      const destination = target.origin + target.pathname;
      const physicalHtml = destination.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
      const targetPage = pages.get(destination) || pages.get(physicalHtml);
      assert(targetPage || (existsSync(filePath) && statSync(filePath).isFile()),
        `${page.file}: broken ${key}: ${value}`);
      if (key !== 'action' && targetPage && !targetPage.noindex) {
        assert.equal(destination, origin + route(targetPage.file),
          `${page.file}: redirecting ${key}: ${value}`);
      }
      if (target.hash && targetPage) {
        assert(targetPage.ids.has(decodeURIComponent(target.hash.slice(1))),
          `${page.file}: missing fragment target: ${value}`);
      }
      if (tag['data-language'] && key === 'data-locale-href') {
        assert.equal(targetPage?.lang, tag['data-language'], `${page.file}: language switch target`);
      }
    }
  }
}

const sitemap = read(path.join(root, 'sitemap.xml'));
assert(sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'));
assert(sitemap.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
const entries = [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)];
const listed = entries.map(([, entry]) => entry.match(/<loc>(.*?)<\/loc>/)?.[1]);
assert.equal(new Set(listed).size, listed.length, 'Duplicate sitemap URLs');
assert.deepEqual([...listed].sort(), [...indexable.keys()].sort(), 'Sitemap coverage differs from indexable pages');
for (const [, entry] of entries) {
  const url = entry.match(/<loc>(.*?)<\/loc>/)[1];
  assert.deepEqual(alternateMap(tags(entry, 'xhtml:link')), expectedAlternates(url),
    `${url}: sitemap hreflang differs from HTML`);
}
const robots = read(path.join(root, 'robots.txt'));
assert.match(robots, /^User-agent:\s*\*\s*$/m);
assert.match(robots, /^Allow:\s*\/\s*$/m);
assert(!/^Disallow:\s*\S+/m.test(robots), 'Unexpected crawl block');
assert.match(robots, /^Sitemap:\s*https:\/\/kompaktweb\.rs\/sitemap\.xml\s*$/m);
console.log(`PASS: ${indexable.size} self-canonical pages, reciprocal hreflang in HTML and sitemap, unique titles/descriptions, structured data, ${pages.size - indexable.size} noindexed thank-you pages, robots.txt, and ${referenceCount} local references including fragments and language links.`);
