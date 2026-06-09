// Scraper for airdrops.io public listing pages.
// Source attribution is preserved (source: 'airdrops.io'). Server-side cached to limit load.

export interface AirdropsIoItem {
  name: string;
  url: string;            // airdrops.io project page (used to resolve official link)
  officialUrl?: string;   // resolved official project site (no referral)
  twitter?: string;       // project X handle (without @)
  logo?: string;
  category?: string;
  status: 'ongoing' | 'confirmed' | 'claim-live';
  popularity: number;     // "temperature"
  publishedAt?: number;   // epoch ms
  requirements: string[]; // ['X', 'Telegram', 'KYC', ...]
  isNew: boolean;
}

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const NEW_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

function parsePublished(s?: string): number | undefined {
  // format: YYYYMMDDHHmmss
  if (!s || s.length < 8) return undefined;
  const y = +s.slice(0, 4), mo = +s.slice(4, 6) - 1, d = +s.slice(6, 8);
  const h = +s.slice(8, 10) || 0, mi = +s.slice(10, 12) || 0;
  const t = Date.UTC(y, mo, d, h, mi);
  return Number.isFinite(t) ? t : undefined;
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&#0?38;/g, '&')
    .replace(/&#8217;/g, '\u2019').replace(/&#8211;/g, '\u2013')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, '').trim();
}

function parseListing(html: string): AirdropsIoItem[] {
  const parts = html.split(/id=["']?post-\d+["']?\s+class=["']grid-33 airdrop-click/);
  const out: AirdropsIoItem[] = [];
  const now = Date.now();
  for (let i = 1; i < parts.length; i++) {
    const head = parts[i].slice(0, 300);
    const b = parts[i].slice(0, 2400);

    const link = (b.match(/location\.href=['"](https:\/\/airdrops\.io\/[^'"]+)['"]/) || [])[1];
    const nameRaw = (b.match(/<h3[^>]*>([^<]+)<\/h3>/) || b.match(/alt=["']([^"']+?)(?:-logo)?["']/) || [])[1];
    if (!link || !nameRaw) continue;

    const logo = (b.match(/data-src=["'](https:[^"']+\.(?:webp|png|jpg|jpeg))["']/) || [])[1];
    const temp = +((b.match(/data-temperature=["'](\d+)["']/) || [])[1] || '0');
    const pub = parsePublished((b.match(/data-published=["'](\d{8,14})["']/) || [])[1]);
    const cat = (head.match(/categories-([a-z0-9-]+)/) || [])[1];

    const reqs: string[] = [];
    if ((b.match(/data-twitter-required=["'](\d)["']/) || [])[1] === '1') reqs.push('X');
    if ((b.match(/data-telegram-required=["'](\d)["']/) || [])[1] === '1') reqs.push('Telegram');
    if ((b.match(/data-discord-required=["'](\d)["']/) || [])[1] === '1') reqs.push('Discord');
    if ((b.match(/data-kyc-required=["'](\d)["']/) || [])[1] === '1') reqs.push('KYC');
    if ((b.match(/data-email-address-required=["'](\d)["']/) || [])[1] === '1') reqs.push('Email');

    const status: AirdropsIoItem['status'] =
      /claim-live/.test(head) ? 'claim-live' : /\bconfirmed\b/.test(head) ? 'confirmed' : 'ongoing';

    out.push({
      name: decode(nameRaw),
      url: link,
      logo,
      category: cat,
      status,
      popularity: temp,
      publishedAt: pub,
      requirements: reqs,
      isNew: pub ? (now - pub) < NEW_WINDOW_MS : false,
    });
  }
  return out;
}

async function fetchPage(url: string): Promise<AirdropsIoItem[]> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, cache: 'no-store' });
  if (!res.ok) throw new Error(`airdrops.io HTTP ${res.status}`);
  return parseListing(await res.text());
}

/** Fetches current airdrops from airdrops.io (latest + hottest), deduped. */
export async function fetchAirdropsIo(): Promise<AirdropsIoItem[]> {
  const pages = ['https://airdrops.io/latest/', 'https://airdrops.io/'];
  const results = await Promise.allSettled(pages.map(fetchPage));
  const seen = new Set<string>();
  const merged: AirdropsIoItem[] = [];
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const item of r.value) {
      const key = item.name.toLowerCase().trim();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  // Newest first, then hottest.
  merged.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0) || b.popularity - a.popularity);
  return merged;
}

function stripRef(raw: string): string {
  try {
    const u = new URL(raw);
    // Drop referral/tracking params so we don't propagate airdrops.io's referral.
    ['ref', 'r', 'utm_source', 'utm_medium', 'utm_campaign', 'aff', 'code', 'referralCode', 'refcode', 'referral_code', 'referral', 'via'].forEach((k) => u.searchParams.delete(k));
    const qs = u.searchParams.toString();
    return `${u.origin}${u.pathname}${qs ? `?${qs}` : ''}`.replace(/\/$/, '');
  } catch {
    return raw;
  }
}

/**
 * Reads an airdrops.io detail page to resolve the official project website
 * (following the /visit/ redirect, stripping referral) and the project's X handle —
 * so the app links to the real project, never to airdrops.io.
 */
export async function resolveOfficial(detailUrl: string): Promise<{ officialUrl?: string; twitter?: string }> {
  try {
    const res = await fetch(detailUrl, { headers: { 'User-Agent': UA, 'Accept': 'text/html' }, cache: 'no-store' });
    if (!res.ok) return {};
    const html = await res.text();

    const handles = [...html.matchAll(/(?:x|twitter)\.com\/([A-Za-z0-9_]{2,30})/g)]
      .map((m) => m[1])
      .filter((h) => !/^(airdrops_io|intent|share|home|hashtag|search)$/i.test(h));
    const twitter = handles[0];

    const visit = (html.match(/href=["'](\/visit\/[a-z0-9]+\/?)["']/i) || [])[1];
    let officialUrl: string | undefined;
    if (visit) {
      const vres = await fetch(`https://airdrops.io${visit}`, {
        headers: { 'User-Agent': UA }, redirect: 'manual', cache: 'no-store',
      });
      const loc = vres.headers.get('location');
      if (loc && /^https?:\/\//i.test(loc) && !/airdrops\.io/i.test(loc)) officialUrl = stripRef(loc);
    }
    return { officialUrl, twitter };
  } catch {
    return {};
  }
}
