import { createClient, type Client } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

declare global {
  // eslint-disable-next-line no-var
  var __echoDb: Client | undefined;
  // eslint-disable-next-line no-var
  var __echoDbReady: Promise<void> | undefined;
}

function createConnection(): Client {
  if (TURSO_URL) {
    return createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN });
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  return createClient({ url: `file:${path.join(dataDir, 'echo.db')}` });
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    city TEXT,
    country_code TEXT,
    created_at INTEGER NOT NULL,
    is_bot INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS echoes (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    song_title TEXT NOT NULL,
    song_artist TEXT,
    mood TEXT NOT NULL,
    note TEXT,
    sent_at INTEGER NOT NULL,
    origin_city TEXT NOT NULL,
    origin_country_code TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS hops (
    id TEXT PRIMARY KEY,
    echo_id TEXT NOT NULL,
    parent_hop_id TEXT,
    recipient_id TEXT,
    is_origin INTEGER NOT NULL DEFAULT 0,
    is_bot INTEGER NOT NULL DEFAULT 0,
    chain_length INTEGER NOT NULL DEFAULT 1,
    city TEXT NOT NULL,
    country_code TEXT NOT NULL,
    received_at INTEGER NOT NULL,
    reply_note TEXT,
    reveal_choice TEXT NOT NULL DEFAULT 'pending',
    FOREIGN KEY (echo_id) REFERENCES echoes(id),
    FOREIGN KEY (parent_hop_id) REFERENCES hops(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id)
  )`,
  `CREATE TABLE IF NOT EXISTS global_questions (
    id TEXT PRIMARY KEY,
    question_date TEXT NOT NULL UNIQUE,
    text TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS global_responses (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    user_id TEXT,
    city TEXT NOT NULL,
    country_code TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    is_bot INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (question_id) REFERENCES global_questions(id)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_hops_echo ON hops(echo_id)`,
  `CREATE INDEX IF NOT EXISTS idx_hops_recipient ON hops(recipient_id)`,
  `CREATE INDEX IF NOT EXISTS idx_echoes_creator ON echoes(creator_id)`,
  `CREATE INDEX IF NOT EXISTS idx_responses_question ON global_responses(question_id)`,
];

async function ensureSchema(db: Client) {
  if (!TURSO_URL) {
    await db.execute('PRAGMA journal_mode = WAL');
  }
  await db.execute('PRAGMA foreign_keys = ON');
  for (const statement of SCHEMA_STATEMENTS) {
    await db.execute(statement);
  }
}

export async function getDb(): Promise<Client> {
  if (!global.__echoDb) {
    global.__echoDb = createConnection();
  }
  if (!global.__echoDbReady) {
    global.__echoDbReady = ensureSchema(global.__echoDb);
  }
  await global.__echoDbReady;
  return global.__echoDb;
}
