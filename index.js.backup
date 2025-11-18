// index.js
const fs = require('fs');
const { chromium } = require('playwright');

(async () => {
  const startTs = Date.now();
  const url = process.env.TARGET_URL || process.argv[2] || 'https://example.com';

  // ---------- launch ----------
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1366,900'
    ]
  });

  // Block heavy resources to speed up / reduce hangs
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: 'en-US',
    timezoneId: 'Europe/Istanbul',
    userAgent:
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) ' +
      'Chrome/122.0.0.0 Safari/537.36'
  });

  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'media' || type === 'font') {
      return route.abort();
    }
    return route.continue();
  });

  // Make headless a bit less obvious
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });

  const page = await context.newPage();

  // ---------- navigate ----------
  let resp = null;
  try {
    resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch (e) {
    // keep going; we’ll still attempt to read what we can
    console.error('Navigation error:', e.message);
  }

  // ---------- try to clear consent banners (best effort) ----------
  const consentSelectors = [
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Allow all")',
    'button[aria-label*="Accept" i]',
    '#onetrust-accept-btn-handler',
    'button[title*="Accept" i]',
    '[data-testid*="consent"] button',
  ];
  try {
    for (const sel of consentSelectors) {
      const loc = page.locator(sel).first();
      if (await loc.isVisible({ timeout: 1000 }).catch(() => false)) {
        await loc.click({ timeout: 1500 }).catch(() => {});
        break;
      }
    }
  } catch {}

  // ---------- wait briefly for main content ----------
  await page.waitForTimeout(500); // small settle
  await page.waitForSelector('main, article, [role="main"], h1', { timeout: 8000 }).catch(() => {});

  // ---------- try feed autodetection (non-blocking) ----------
  // We just collect feed URLs; we’ll fetch them with context.request if present.
  let feedUrls = [];
  try {
    feedUrls = await page.evaluate(() => {
      const out = [];
      const nodes = document.querySelectorAll('link[rel="alternate"]');
      nodes.forEach((n) => {
        const t = (n.getAttribute('type') || '').toLowerCase();
        if (t.includes('rss') || t.includes('atom') || t.includes('xml')) {
          const href = n.getAttribute('href');
          if (href) out.push(new URL(href, location.href).href);
        }
      });
      return Array.from(new Set(out)).slice(0, 5);
    });
  } catch {}

  // Resolve & fetch feeds (if any), but don’t block overall extraction if they 404
  const feeds = [];
  for (const f of feedUrls) {
    try {
      const r = await context.request.get(f, { timeout: 8000 });
      if (r.ok()) {
        const text = await r.text();
        feeds.push({ url: f, status: r.status(), bytes: text.length, snippet: text.slice(0, 4000) });
      } else {
        feeds.push({ url: f, status: r.status(), error: 'non-OK' });
      }
    } catch (e) {
      feeds.push({ url: f, error: e.message });
    }
  }

  // ---------- extract title ----------
  async function getTitle() {
    try {
      const t = await page.title();
      if (t && t.trim()) return t.trim();
    } catch {}
    try {
      const alt = await page.evaluate(() =>
        document.querySelector('meta[property="og:title"]')?.content ||
        document.querySelector('h1')?.textContent?.trim() || ''
      );
      if (alt) return alt.trim();
    } catch {}
    return '';
  }

  // ---------- extract main text with fallbacks ----------
  async function innerText(sel) {
    try { return await page.locator(sel).innerText({ timeout: 2000 }); } catch { return ''; }
  }

  let text =
    (await innerText('main')) ||
    (await innerText('article')) ||
    (await innerText('[role="main"]')) ||
    (await innerText('body')) ||
    '';

  // Clean & trim
  text = text
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 12000); // keep it reasonable

  const title = (await getTitle()) || '';

  // ---------- collect top links (structured) ----------
  const topLinks = await page.evaluate(() => {
    function visible(el) {
      const s = window.getComputedStyle(el);
      return s && s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0;
    }
    const root =
      document.querySelector('main') ||
      document.querySelector('article') ||
      document.querySelector('[role="main"]') ||
      document.body;

    const anchors = Array.from(root.querySelectorAll('a[href]'))
      .filter((a) => visible(a) && (a.textContent || '').trim().length >= 8)
      .map((a) => ({
        text: a.textContent.trim().replace(/\s+/g, ' ').slice(0, 200),
        url: new URL(a.getAttribute('href'), location.href).href
      }));

    // Deduplicate by URL then by text
    const seen = new Set();
    const unique = [];
    for (const a of anchors) {
      const key = a.url;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(a);
      }
    }
    return unique.slice(0, 50);
  }).catch(() => []);

  // ---------- finalize ----------
  const out = {
    requested_url: url,
    final_url: page.url(),
    status: resp ? resp.status() : null,
    title,
    snippet: text,
    links: topLinks,
    feeds,               // any discovered RSS/Atom responses (first ~4000 chars)
    discovered_feed_urls: feedUrls,
    timings_ms: {
      total: Date.now() - startTs
    },
    ts: new Date().toISOString()
  };

  fs.mkdirSync('/output', { recursive: true });
  fs.writeFileSync('/output/result.json', JSON.stringify(out, null, 2));

  await browser.close();
  console.log('Saved /output/result.json');
})();
