import { cookies } from 'next/headers';
import { randomUUID as uuidv4 } from 'crypto';
import { getDb } from './db';

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
 */
export async function ensureIdentity(): Promise<CurrentUser> {
  const store = await cookies();
  const existing = store.get(IDENTITY_COOKIE)?.value;
  const db = getDb();

  if (existing) {
    const row = db
      .prepare('SELECT id, city, country_code as countryCode FROM users WHERE id = ?')
      .get(existing) as CurrentUser | undefined;
    if (row) return row;
  }

  const id = uuidv4();
  db.prepare('INSERT INTO users (id, city, country_code, created_at) VALUES (?, NULL, NULL, ?)').run(id, Date.now());
  store.set(IDENTITY_COOKIE, id, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return { id, city: null, countryCode: null };
}

export function setUserCity(userId: string, city: string, countryCode: string) {
  const db = getDb();
  db.prepare('UPDATE users SET city = ?, country_code = ? WHERE id = ?').run(city, countryCode, userId);
}
