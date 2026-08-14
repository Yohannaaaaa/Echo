import { randomUUID as uuidv4 } from 'crypto';
import { getDb } from './db';
import { randomCityExcluding, cityByName } from './cities';

export const PROPAGATION_DELAY_MS = 20_000; // compressed "quelques heures plus tard" for demo purposes
export const MAX_CHAIN_LENGTH = 6;
const MAX_DELIVERIES_PER_PULL = 2;

export type HopRow = {
  id: string;
  echo_id: string;
  parent_hop_id: string | null;
  recipient_id: string | null;
  is_origin: number;
  is_bot: number;
  chain_length: number;
  city: string;
  country_code: string;
  received_at: number;
  reply_note: string | null;
  reveal_choice: 'pending' | 'revealed' | 'mystery';
  recipient_pseudo: string | null;
};

export type EchoRow = {
  id: string;
  creator_id: string;
  song_title: string;
  song_artist: string | null;
  mood: string;
  note: string | null;
  sent_at: number;
  origin_city: string;
  origin_country_code: string;
};

export async function createEcho(
  creatorId: string,
  city: string,
  countryCode: string,
  songTitle: string,
  songArtist: string | undefined,
  mood: string,
  note: string | undefined,
) {
  const db = await getDb();
  const echoId = uuidv4();
  const now = Date.now();
  await db.execute({
    sql: `INSERT INTO echoes (id, creator_id, song_title, song_artist, mood, note, sent_at, origin_city, origin_country_code)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [echoId, creatorId, songTitle, songArtist ?? null, mood, note ?? null, now, city, countryCode],
  });

  const hopId = uuidv4();
  await db.execute({
    sql: `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
          VALUES (?, ?, NULL, ?, 1, 0, 1, ?, ?, ?, NULL, 'revealed')`,
    args: [hopId, echoId, creatorId, city, countryCode, now],
  });

  return echoId;
}

const BOT_REVEAL_POOL: Array<'revealed' | 'mystery'> = [
  'mystery', 'mystery', 'mystery', 'revealed', 'mystery', 'revealed', 'mystery',
];

const BOT_REPLY_POOL = [
  'Moi non plus.',
  'Ça me touche, merci.',
  'Je ressens exactement pareil en ce moment.',
  'Cette chanson, wow.',
  "J'espère que ça va mieux depuis.",
  'Courage.',
  "Je ne suis pas seul(e) alors.",
  'Ça va aller.',
  'Merci de l’avoir partagé.',
  'Je pense à toi, où que tu sois.',
];
const BOT_REPLY_CHANCE = 0.45;

/**
 * Lazily grows echo chains: any leaf hop older than PROPAGATION_DELAY_MS has a
 * chance of "arriving" somewhere new in the world, simulating other people
 * discovering it, without needing a real background worker.
 */
export async function propagateEchoes() {
  const db = await getDb();
  const threshold = Date.now() - PROPAGATION_DELAY_MS;
  const result = await db.execute({
    sql: `SELECT h.* FROM hops h
          WHERE h.received_at <= ?
          AND NOT EXISTS (SELECT 1 FROM hops c WHERE c.parent_hop_id = h.id)`,
    args: [threshold],
  });
  const leaves = result.rows as unknown as HopRow[];

  for (const leaf of leaves) {
    if (leaf.chain_length >= MAX_CHAIN_LENGTH) continue;
    if (Math.random() > 0.75) continue;
    const nextCity = randomCityExcluding(leaf.city);
    const reveal = BOT_REVEAL_POOL[Math.floor(Math.random() * BOT_REVEAL_POOL.length)];
    const replyNote =
      Math.random() < BOT_REPLY_CHANCE ? BOT_REPLY_POOL[Math.floor(Math.random() * BOT_REPLY_POOL.length)] : null;
    await db.execute({
      sql: `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
            VALUES (?, ?, ?, NULL, 0, 1, ?, ?, ?, ?, ?, ?)`,
      args: [uuidv4(), leaf.echo_id, leaf.id, leaf.chain_length + 1, nextCity.name, nextCity.countryCode, Date.now(), replyNote, reveal],
    });
  }
}

export async function deliverEchoesToUser(userId: string, city: string, countryCode: string) {
  const db = await getDb();

  const result = await db.execute({
    sql: `SELECT h.* FROM hops h
          JOIN echoes e ON e.id = h.echo_id
          WHERE e.creator_id != ?
          AND NOT EXISTS (SELECT 1 FROM hops c WHERE c.parent_hop_id = h.id)
          AND NOT EXISTS (
            SELECT 1 FROM hops mine WHERE mine.echo_id = h.echo_id AND mine.recipient_id = ?
          )
          ORDER BY RANDOM()
          LIMIT ?`,
    args: [userId, userId, MAX_DELIVERIES_PER_PULL],
  });
  const candidateLeaves = result.rows as unknown as HopRow[];

  const delivered: string[] = [];
  for (const leaf of candidateLeaves) {
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
            VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NULL, 'pending')`,
      args: [id, leaf.echo_id, leaf.id, userId, leaf.chain_length + 1, city, countryCode, Date.now()],
    });
    delivered.push(leaf.echo_id);
  }
  return delivered;
}

export async function getInboxForUser(userId: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT h.id as hopId, h.echo_id as echoId, h.chain_length as chainLength, h.received_at as receivedAt,
                 h.reply_note as replyNote, h.reveal_choice as revealChoice, h.city as city, h.country_code as countryCode,
                 e.song_title as songTitle, e.song_artist as songArtist, e.mood as mood, e.note as note,
                 e.sent_at as sentAt, e.origin_city as originCity, e.origin_country_code as originCountryCode,
                 p.city as fromCity, p.country_code as fromCountryCode, p.reply_note as fromNote
          FROM hops h
          JOIN echoes e ON e.id = h.echo_id
          LEFT JOIN hops p ON p.id = h.parent_hop_id
          WHERE h.recipient_id = ? AND h.is_origin = 0
          ORDER BY h.received_at DESC`,
    args: [userId],
  });
  return result.rows;
}

export async function replyToHop(hopId: string, userId: string, replyNote: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'UPDATE hops SET reply_note = ? WHERE id = ? AND recipient_id = ?',
    args: [replyNote, hopId, userId],
  });
  return result.rowsAffected > 0;
}

export async function setHopReveal(hopId: string, userId: string, choice: 'revealed' | 'mystery') {
  const db = await getDb();
  const result = await db.execute({
    sql: 'UPDATE hops SET reveal_choice = ? WHERE id = ? AND recipient_id = ?',
    args: [choice, hopId, userId],
  });
  return result.rowsAffected > 0;
}

export async function getJourney(echoId: string) {
  const db = await getDb();
  const echoResult = await db.execute({ sql: 'SELECT * FROM echoes WHERE id = ?', args: [echoId] });
  const echo = echoResult.rows[0] as unknown as EchoRow | undefined;
  if (!echo) return null;
  const hopsResult = await db.execute({
    sql: `SELECT h.*, u.pseudo as recipient_pseudo FROM hops h
          LEFT JOIN users u ON u.id = h.recipient_id
          WHERE h.echo_id = ? ORDER BY h.chain_length ASC, h.received_at ASC`,
    args: [echoId],
  });
  return { echo, hops: hopsResult.rows as unknown as HopRow[] };
}

export async function getMyEchoesToday(userId: string) {
  const db = await getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const echoesResult = await db.execute({
    sql: 'SELECT * FROM echoes WHERE creator_id = ? ORDER BY sent_at DESC',
    args: [userId],
  });
  const echoes = echoesResult.rows as unknown as EchoRow[];

  const groups = [];
  for (const echo of echoes) {
    const hopsTodayResult = await db.execute({
      sql: `SELECT h.*, u.pseudo as recipient_pseudo FROM hops h
            LEFT JOIN users u ON u.id = h.recipient_id
            WHERE h.echo_id = ? AND h.is_origin = 0 AND h.received_at >= ?
            ORDER BY h.received_at ASC`,
      args: [echo.id, startOfDay.getTime()],
    });
    const totalResult = await db.execute({
      sql: 'SELECT COUNT(*) as c FROM hops WHERE echo_id = ? AND is_origin = 0',
      args: [echo.id],
    });
    const totalRow = totalResult.rows[0] as unknown as { c: number };
    groups.push({
      echo,
      hopsToday: hopsTodayResult.rows as unknown as HopRow[],
      totalRecipients: totalRow.c,
    });
  }
  return groups;
}

export { cityByName };
