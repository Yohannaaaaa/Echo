import { cookies } from 'next/headers';
import { randomUUID as uuidv4 } from 'crypto';
import { getDb } from './db';
import { detectGeoFromHeaders } from './geo-server';

export const IDENTITY_COOKIE = 'echo_uid';
const ONE_YEAR = 60 * 60 * 24 * 365;

export type CurrentUser = {
  id: string;
  city: string | null;
  countryCode: string | null;
};

/**
 * Must be called from a Route Handler (not a Server Component) since it may
 * write the identity cookie. Every API route calls this first.
 *
 * On first visit, tries to fill in the visitor's city/country from Vercel's
 * geolocation headers, so most people never see a manual "pick your city"
 * step. Falls back to null (handled by the client with a manual picker)
 * when those headers aren't present, e.g. in local dev.
 */
export async function ensureIdentity(): Promise<CurrentUser> {
  const store = await cookies();
  const existing = store.get(IDENTITY_COOKIE)?.value;
  const db = await getDb();

  if (existing) {
    const result = await db.execute({
      sql: 'SELECT id, city, country_code as countryCode FROM users WHERE id = ?',
      args: [existing],
    });
    const row = result.rows[0];
    if (row) return { id: row.id as string, city: row.city as string | null, countryCode: row.countryCode as string | null };
  }

  const id = uuidv4();
  const geo = await detectGeoFromHeaders();
  await db.execute({
    sql: 'INSERT INTO users (id, city, country_code, created_at) VALUES (?, ?, ?, ?)',
    args: [id, geo.city, geo.countryCode, Date.now()],
  });
  store.set(IDENTITY_COOKIE, id, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return { id, city: geo.city, countryCode: geo.countryCode };
}

export async function setUserCity(userId: string, city: string, countryCode: string) {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE users SET city = ?, country_code = ? WHERE id = ?',
    args: [city, countryCode, userId],
  });
}
