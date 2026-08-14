import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'echo.db');

declare global {
  // eslint-disable-next-line no-var
  var __echoDb: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      city TEXT,
      country_code TEXT,
      created_at INTEGER NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS echoes (
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
    );

    CREATE TABLE IF NOT EXISTS hops (
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
    );

    CREATE TABLE IF NOT EXISTS global_questions (
      id TEXT PRIMARY KEY,
      question_date TEXT NOT NULL UNIQUE,
      text TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS global_responses (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      user_id TEXT,
      city TEXT NOT NULL,
      country_code TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_bot INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES global_questions(id)
    );

    CREATE INDEX IF NOT EXISTS idx_hops_echo ON hops(echo_id);
    CREATE INDEX IF NOT EXISTS idx_hops_recipient ON hops(recipient_id);
    CREATE INDEX IF NOT EXISTS idx_echoes_creator ON echoes(creator_id);
    CREATE INDEX IF NOT EXISTS idx_responses_question ON global_responses(question_id);
  `);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__echoDb) {
    global.__echoDb = createConnection();
  }
  return global.__echoDb;
}
