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
  recoveryCode: string;
};

// Avoids ambiguous characters (0/O, 1/I/L) so codes are easy to read and retype.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode(length: number): string {
  let out = '';
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  return out;
}

function generateRecoveryCode(): string {
  return randomCode(12);
}

export function formatRecoveryCode(code: string): string {
  return code.match(/.{1,4}/g)?.join('-') ?? code;
}

export function normalizeRecoveryCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

async function insertUserWithRecoveryCode(
  db: Awaited<ReturnType<typeof getDb>>,
  id: string,
  city: string | null,
  countryCode: string | null,
): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const recoveryCode = generateRecoveryCode();
    try {
      await db.execute({
        sql: 'INSERT INTO users (id, city, country_code, created_at, recovery_code) VALUES (?, ?, ?, ?, ?)',
        args: [id, city, countryCode, Date.now(), recoveryCode],
      });
      return recoveryCode;
    } catch (err) {
      if (!String(err).includes('UNIQUE') || attempt === 4) throw err;
    }
  }
  throw new Error('unreachable');
}

async function backfillRecoveryCode(db: Awaited<ReturnType<typeof getDb>>, userId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const recoveryCode = generateRecoveryCode();
    try {
      await db.execute({
        sql: 'UPDATE users SET recovery_code = ? WHERE id = ?',
        args: [recoveryCode, userId],
      });
      return recoveryCode;
    } catch (err) {
      if (!String(err).includes('UNIQUE') || attempt === 4) throw err;
    }
  }
  throw new Error('unreachable');
}

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
      sql: 'SELECT id, city, country_code as countryCode, recovery_code as recoveryCode FROM users WHERE id = ?',
      args: [existing],
    });
    const row = result.rows[0];
    if (row) {
      const recoveryCode = (row.recoveryCode as string | null) ?? (await backfillRecoveryCode(db, row.id as string));
      return {
        id: row.id as string,
        city: row.city as string | null,
        countryCode: row.countryCode as string | null,
        recoveryCode,
      };
    }
  }

  const id = uuidv4();
  const geo = await detectGeoFromHeaders();
  const recoveryCode = await insertUserWithRecoveryCode(db, id, geo.city, geo.countryCode);
  store.set(IDENTITY_COOKIE, id, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return { id, city: geo.city, countryCode: geo.countryCode, recoveryCode };
}

export async function setUserCity(userId: string, city: string, countryCode: string) {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE users SET city = ?, country_code = ? WHERE id = ?',
    args: [city, countryCode, userId],
  });
}

/**
 * Restores a previous anonymous identity on a new device/browser from its
 * recovery code. No email, no password — just this code.
 */
export async function restoreIdentity(rawCode: string): Promise<CurrentUser | null> {
  const code = normalizeRecoveryCode(rawCode);
  if (!code) return null;
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT id, city, country_code as countryCode, recovery_code as recoveryCode FROM users WHERE recovery_code = ?',
    args: [code],
  });
  const row = result.rows[0];
  if (!row) return null;

  const store = await cookies();
  store.set(IDENTITY_COOKIE, row.id as string, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return {
    id: row.id as string,
    city: row.city as string | null,
    countryCode: row.countryCode as string | null,
    recoveryCode: row.recoveryCode as string,
  };
}
