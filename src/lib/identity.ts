import { cookies } from 'next/headers';
import { randomUUID as uuidv4, randomBytes } from 'crypto';
import { getDb } from './db';
import { detectGeoFromHeaders } from './geo-server';
import { hashPassword, verifyPassword } from './password';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export const IDENTITY_COOKIE = 'echo_uid';
const ONE_YEAR = 60 * 60 * 24 * 365;

export type CurrentUser = {
  id: string;
  city: string | null;
  countryCode: string | null;
  recoveryCode: string;
  email: string | null;
  pseudo: string | null;
};

const USER_COLUMNS = `id, city, country_code as countryCode, recovery_code as recoveryCode, email, pseudo`;

function rowToUser(row: Record<string, unknown>): CurrentUser {
  return {
    id: row.id as string,
    city: row.city as string | null,
    countryCode: row.countryCode as string | null,
    recoveryCode: row.recoveryCode as string,
    email: (row.email as string | null) ?? null,
    pseudo: (row.pseudo as string | null) ?? null,
  };
}

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
      sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`,
      args: [existing],
    });
    const row = result.rows[0];
    if (row) {
      const recoveryCode = (row.recoveryCode as string | null) ?? (await backfillRecoveryCode(db, row.id as string));
      return rowToUser({ ...row, recoveryCode });
    }
  }

  const id = uuidv4();
  const geo = await detectGeoFromHeaders();
  const recoveryCode = await insertUserWithRecoveryCode(db, id, geo.city, geo.countryCode);
  store.set(IDENTITY_COOKIE, id, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return { id, city: geo.city, countryCode: geo.countryCode, recoveryCode, email: null, pseudo: null };
}

export async function setUserCity(userId: string, city: string, countryCode: string) {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE users SET city = ?, country_code = ? WHERE id = ?',
    args: [city, countryCode, userId],
  });
}

export async function setPseudo(userId: string, pseudo: string) {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE users SET pseudo = ? WHERE id = ?',
    args: [pseudo, userId],
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
    sql: `SELECT ${USER_COLUMNS} FROM users WHERE recovery_code = ?`,
    args: [code],
  });
  const row = result.rows[0];
  if (!row) return null;

  const store = await cookies();
  store.set(IDENTITY_COOKIE, row.id as string, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return rowToUser(row);
}

/**
 * Attaches an email + password to the CURRENT anonymous identity, so it can
 * also be recovered by logging in (in addition to the recovery code). Never
 * creates a separate account — the existing echoes stay attached.
 */
export async function setCredentials(
  userId: string,
  rawEmail: string,
  password: string,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Adresse email invalide.' };
  }
  if (password.length < 8) {
    return { ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }

  const db = await getDb();
  const passwordHash = hashPassword(password);
  try {
    await db.execute({
      sql: 'UPDATE users SET email = ?, password_hash = ? WHERE id = ?',
      args: [email, passwordHash, userId],
    });
  } catch (err) {
    if (String(err).includes('UNIQUE')) return { ok: false, error: 'Cet email est déjà utilisé.' };
    throw err;
  }

  const result = await db.execute({ sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, args: [userId] });
  return { ok: true, user: rowToUser(result.rows[0]) };
}

export async function loginWithCredentials(rawEmail: string, password: string): Promise<CurrentUser | null> {
  const email = rawEmail.trim().toLowerCase();
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT ${USER_COLUMNS}, password_hash as passwordHash FROM users WHERE email = ?`,
    args: [email],
  });
  const row = result.rows[0];
  if (!row || !row.passwordHash) return null;
  if (!verifyPassword(password, row.passwordHash as string)) return null;

  const store = await cookies();
  store.set(IDENTITY_COOKIE, row.id as string, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });
  return rowToUser(row);
}

/**
 * Generates a one-time password reset token for the account attached to
 * this email, if one exists with a password set. Returns null when there's
 * nothing to reset — callers should still show a generic "email sent"
 * message either way, to avoid leaking which emails have accounts.
 */
export async function requestPasswordReset(rawEmail: string): Promise<string | null> {
  const email = rawEmail.trim().toLowerCase();
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT id FROM users WHERE email = ? AND password_hash IS NOT NULL',
    args: [email],
  });
  const row = result.rows[0];
  if (!row) return null;

  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  await db.execute({
    sql: 'INSERT INTO password_resets (id, user_id, token, created_at, expires_at, used) VALUES (?, ?, ?, ?, ?, 0)',
    args: [uuidv4(), row.id as string, token, now, now + PASSWORD_RESET_TTL_MS],
  });
  return token;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ ok: true; user: CurrentUser } | { ok: false; error: string }> {
  if (newPassword.length < 8) {
    return { ok: false, error: 'Le mot de passe doit faire au moins 8 caractères.' };
  }

  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT id, user_id as userId, expires_at as expiresAt, used FROM password_resets WHERE token = ?',
    args: [token],
  });
  const reset = result.rows[0];
  if (!reset || reset.used || (reset.expiresAt as number) < Date.now()) {
    return { ok: false, error: 'Ce lien a expiré ou a déjà été utilisé. Refais une demande.' };
  }

  const passwordHash = hashPassword(newPassword);
  await db.execute({
    sql: 'UPDATE users SET password_hash = ? WHERE id = ?',
    args: [passwordHash, reset.userId as string],
  });
  await db.execute({ sql: 'UPDATE password_resets SET used = 1 WHERE id = ?', args: [reset.id as string] });

  const store = await cookies();
  store.set(IDENTITY_COOKIE, reset.userId as string, { maxAge: ONE_YEAR, path: '/', sameSite: 'lax' });

  const userResult = await db.execute({ sql: `SELECT ${USER_COLUMNS} FROM users WHERE id = ?`, args: [reset.userId] });
  return { ok: true, user: rowToUser(userResult.rows[0]) };
}
