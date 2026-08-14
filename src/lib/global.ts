import { randomUUID as uuidv4 } from 'crypto';
import { getDb } from './db';
import { CITIES } from './cities';

const QUESTION_POOL = [
  "Qu'est-ce que personne ne sait sur toi ?",
  'Quelle chanson te fait pleurer et pourquoi tu ne le dis jamais ?',
  "Qu'est-ce que tu ferais si tu n'avais plus peur ?",
  "À quoi penses-tu juste avant de t'endormir ?",
  "Quel est le mensonge que tu te dis le plus souvent ?",
  "Qu'est-ce que tu voudrais dire à la personne que tu étais il y a 5 ans ?",
  'Quel est ton secret le plus léger ?',
  "De quoi as-tu peur pour ton avenir ?",
  "Quel souvenir revient sans que tu l'appelles ?",
  "Qu'est-ce qui te manque et que tu n'admets à personne ?",
];

const BOT_ANSWER_POOL = [
  'Je fais semblant d’aller bien.',
  'Je veux changer de vie.',
  'Je suis amoureux(se) de quelqu’un qui ne le sait pas.',
  'J’ai peur de l’avenir.',
  'Je n’ai jamais dit à mes parents que je les aime.',
  'Je me sens seul(e) même entouré(e).',
  'Je recommence à zéro dans trois mois.',
  'Je pense encore à cette personne, tous les jours.',
  'Je ne sais plus qui je suis en dehors du travail.',
  'J’ai peur de décevoir tout le monde.',
  'Je ris beaucoup plus que je ne suis vraiment heureux(se).',
  'Je regrette de ne pas avoir osé.',
  'Je crois encore que ça peut aller mieux.',
  'Je n’ai jamais pardonné, mais j’ai fait semblant.',
  'Je veux juste qu’on me demande comment je vais, vraiment.',
  'J’ai peur d’être oublié(e).',
  'Je change de trottoir pour éviter certaines personnes.',
  'Je n’ai dit à personne que j’ai arrêté d’essayer.',
  'Je crois toujours aux signes.',
  'Je n’ai jamais autant douté qu’en ce moment.',
];

type Question = { id: string; question_date: string; text: string };

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickQuestion(dateKey: string) {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) hash = (hash * 31 + dateKey.charCodeAt(i)) >>> 0;
  return QUESTION_POOL[hash % QUESTION_POOL.length];
}

export async function getOrCreateTodayQuestion(): Promise<Question> {
  const db = await getDb();
  const dateKey = todayKey();
  const existing = await db.execute({
    sql: 'SELECT * FROM global_questions WHERE question_date = ?',
    args: [dateKey],
  });
  const found = existing.rows[0] as unknown as Question | undefined;
  if (found) return found;

  const id = uuidv4();
  const text = pickQuestion(dateKey);
  try {
    await db.execute({
      sql: 'INSERT INTO global_questions (id, question_date, text) VALUES (?, ?, ?)',
      args: [id, dateKey, text],
    });
  } catch {
    // Another concurrent request created it first — fetch what it wrote.
    const retry = await db.execute({
      sql: 'SELECT * FROM global_questions WHERE question_date = ?',
      args: [dateKey],
    });
    return retry.rows[0] as unknown as Question;
  }
  const question = { id, question_date: dateKey, text };
  await seedBotResponses(id);
  return question;
}

async function seedBotResponses(questionId: string) {
  const db = await getDb();
  const shuffledAnswers = [...BOT_ANSWER_POOL].sort(() => Math.random() - 0.5).slice(0, 14);
  const shuffledCities = [...CITIES].sort(() => Math.random() - 0.5);
  const now = Date.now();
  for (let i = 0; i < shuffledAnswers.length; i++) {
    const city = shuffledCities[i % shuffledCities.length];
    await db.execute({
      sql: `INSERT INTO global_responses (id, question_id, user_id, city, country_code, text, created_at, is_bot)
            VALUES (?, ?, NULL, ?, ?, ?, ?, 1)`,
      args: [uuidv4(), questionId, city.name, city.countryCode, shuffledAnswers[i], now - Math.floor(Math.random() * 3_600_000)],
    });
  }
}

export async function hasResponded(questionId: string, userId: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: 'SELECT 1 FROM global_responses WHERE question_id = ? AND user_id = ?',
    args: [questionId, userId],
  });
  return result.rows.length > 0;
}

export async function submitResponse(questionId: string, userId: string, city: string, countryCode: string, text: string) {
  const db = await getDb();
  if (await hasResponded(questionId, userId)) return false;
  await db.execute({
    sql: `INSERT INTO global_responses (id, question_id, user_id, city, country_code, text, created_at, is_bot)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    args: [uuidv4(), questionId, userId, city, countryCode, text, Date.now()],
  });
  return true;
}

export async function getFeed(questionId: string) {
  const db = await getDb();
  const result = await db.execute({
    sql: `SELECT city, country_code as countryCode, text, created_at as createdAt, is_bot as isBot
          FROM global_responses WHERE question_id = ? ORDER BY RANDOM() LIMIT 60`,
    args: [questionId],
  });
  return result.rows;
}
