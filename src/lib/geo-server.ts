import { headers } from 'next/headers';

/**
 * Vercel injects these headers at the edge for every request, for free,
 * based on the visitor's IP — no external geolocation service needed.
 * They're absent in local dev, where callers should fall back to a manual
 * city picker. Server-only (uses next/headers) — never import from a
 * client component.
 */
export async function detectGeoFromHeaders(): Promise<{ city: string | null; countryCode: string | null }> {
  const store = await headers();
  const rawCity = store.get('x-vercel-ip-city');
  const countryCode = store.get('x-vercel-ip-country');
  const city = rawCity ? decodeURIComponent(rawCity) : null;
  return {
    city: city && city.trim() ? city.trim() : null,
    countryCode: countryCode && countryCode.trim() ? countryCode.trim().toUpperCase() : null,
  };
}
