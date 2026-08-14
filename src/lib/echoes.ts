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

export function createEcho(
  creatorId: string,
  city: string,
  countryCode: string,
  songTitle: string,
  songArtist: string | undefined,
  mood: string,
  note: string | undefined,
) {
  const db = getDb();
  const echoId = uuidv4();
  const now = Date.now();
  db.prepare(
    `INSERT INTO echoes (id, creator_id, song_title, song_artist, mood, note, sent_at, origin_city, origin_country_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(echoId, creatorId, songTitle, songArtist ?? null, mood, note ?? null, now, city, countryCode);

  const hopId = uuidv4();
  db.prepare(
    `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
     VALUES (?, ?, NULL, ?, 1, 0, 1, ?, ?, ?, NULL, 'revealed')`,
  ).run(hopId, echoId, creatorId, city, countryCode, now);

  return echoId;
}

const BOT_REVEAL_POOL: Array<'revealed' | 'mystery'> = [
  'mystery', 'mystery', 'mystery', 'revealed', 'mystery', 'revealed', 'mystery',
];

/**
 * Lazily grows echo chains: any leaf hop older than PROPAGATION_DELAY_MS has a
 * chance of "arriving" somewhere new in the world, simulating other people
 * discovering it, without needing a real background worker.
 */
export function propagateEchoes() {
  const db = getDb();
  const threshold = Date.now() - PROPAGATION_DELAY_MS;
  const leaves = db
    .prepare(
      `SELECT h.* FROM hops h
       WHERE h.received_at <= ?
       AND NOT EXISTS (SELECT 1 FROM hops c WHERE c.parent_hop_id = h.id)`,
    )
    .all(threshold) as HopRow[];

  const insert = db.prepare(
    `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
     VALUES (?, ?, ?, NULL, 0, 1, ?, ?, ?, ?, NULL, ?)`,
  );

  for (const leaf of leaves) {
    if (leaf.chain_length >= MAX_CHAIN_LENGTH) continue;
    if (Math.random() > 0.75) continue;
    const nextCity = randomCityExcluding(leaf.city);
    const reveal = BOT_REVEAL_POOL[Math.floor(Math.random() * BOT_REVEAL_POOL.length)];
    insert.run(
      uuidv4(),
      leaf.echo_id,
      leaf.id,
      leaf.chain_length + 1,
      nextCity.name,
      nextCity.countryCode,
      Date.now(),
      reveal,
    );
  }
}

export function deliverEchoesToUser(userId: string, city: string, countryCode: string) {
  const db = getDb();

  const candidateLeaves = db
    .prepare(
      `SELECT h.* FROM hops h
       JOIN echoes e ON e.id = h.echo_id
       WHERE e.creator_id != ?
       AND NOT EXISTS (SELECT 1 FROM hops c WHERE c.parent_hop_id = h.id)
       AND NOT EXISTS (
         SELECT 1 FROM hops mine WHERE mine.echo_id = h.echo_id AND mine.recipient_id = ?
       )
       ORDER BY RANDOM()
       LIMIT ?`,
    )
    .all(userId, userId, MAX_DELIVERIES_PER_PULL) as HopRow[];

  const insert = db.prepare(
    `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
     VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, NULL, 'pending')`,
  );

  const delivered: string[] = [];
  for (const leaf of candidateLeaves) {
    const id = uuidv4();
    insert.run(id, leaf.echo_id, leaf.id, userId, leaf.chain_length + 1, city, countryCode, Date.now());
    delivered.push(leaf.echo_id);
  }
  return delivered;
}

export function getInboxForUser(userId: string) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT h.id as hopId, h.echo_id as echoId, h.chain_length as chainLength, h.received_at as receivedAt,
              h.reply_note as replyNote, h.reveal_choice as revealChoice, h.city as city, h.country_code as countryCode,
              e.song_title as songTitle, e.song_artist as songArtist, e.mood as mood, e.note as note,
              e.sent_at as sentAt, e.origin_city as originCity, e.origin_country_code as originCountryCode,
              p.city as fromCity, p.country_code as fromCountryCode, p.reply_note as fromNote
       FROM hops h
       JOIN echoes e ON e.id = h.echo_id
       LEFT JOIN hops p ON p.id = h.parent_hop_id
       WHERE h.recipient_id = ? AND h.is_origin = 0
       ORDER BY h.received_at DESC`,
    )
    .all(userId);
  return rows;
}

export function replyToHop(hopId: string, userId: string, replyNote: string) {
  const db = getDb();
  const result = db
    .prepare('UPDATE hops SET reply_note = ? WHERE id = ? AND recipient_id = ?')
    .run(replyNote, hopId, userId);
  return result.changes > 0;
}

export function setHopReveal(hopId: string, userId: string, choice: 'revealed' | 'mystery') {
  const db = getDb();
  const result = db
    .prepare('UPDATE hops SET reveal_choice = ? WHERE id = ? AND recipient_id = ?')
    .run(choice, hopId, userId);
  return result.changes > 0;
}

export function getJourney(echoId: string) {
  const db = getDb();
  const echo = db.prepare('SELECT * FROM echoes WHERE id = ?').get(echoId) as EchoRow | undefined;
  if (!echo) return null;
  const hops = db
    .prepare('SELECT * FROM hops WHERE echo_id = ? ORDER BY chain_length ASC, received_at ASC')
    .all(echoId) as HopRow[];
  return { echo, hops };
}

export function getMyEchoesToday(userId: string) {
  const db = getDb();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const echoes = db
    .prepare('SELECT * FROM echoes WHERE creator_id = ? ORDER BY sent_at DESC')
    .all(userId) as EchoRow[];

  return echoes.map((echo) => {
    const hopsToday = db
      .prepare(
        `SELECT * FROM hops WHERE echo_id = ? AND is_origin = 0 AND received_at >= ?
         ORDER BY received_at ASC`,
      )
      .all(echo.id, startOfDay.getTime()) as HopRow[];
    const totalHops = db
      .prepare('SELECT COUNT(*) as c FROM hops WHERE echo_id = ? AND is_origin = 0')
      .get(echo.id) as { c: number };
    return { echo, hopsToday, totalRecipients: totalHops.c };
  });
}

export { cityByName };
