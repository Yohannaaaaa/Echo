import { randomUUID as uuidv4 } from 'crypto';
import { getDb } from '../src/lib/db';
import { cityByName } from '../src/lib/cities';

async function main() {
  const db = await getDb();

  const already = await db.execute('SELECT COUNT(*) as c FROM users WHERE is_bot = 1');
  const alreadyCount = (already.rows[0] as unknown as { c: number }).c;
  if (alreadyCount > 0) {
    console.log('Déjà seedé — rien à faire. (Supprime data/echo.db, ou vide la base Turso, pour reseeder.)');
    return;
  }

  async function botUser(cityName: string) {
    const city = cityByName(cityName)!;
    const id = uuidv4();
    await db.execute({
      sql: 'INSERT INTO users (id, city, country_code, created_at, is_bot) VALUES (?, ?, ?, ?, 1)',
      args: [id, city.name, city.countryCode, Date.now()],
    });
    return { id, city };
  }

  async function insertEcho(opts: {
    creatorId: string;
    city: string;
    countryCode: string;
    songTitle: string;
    songArtist?: string;
    mood: string;
    note?: string;
    hoursAgo: number;
  }) {
    const id = uuidv4();
    const sentAt = Date.now() - opts.hoursAgo * 3_600_000;
    await db.execute({
      sql: `INSERT INTO echoes (id, creator_id, song_title, song_artist, mood, note, sent_at, origin_city, origin_country_code)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, opts.creatorId, opts.songTitle, opts.songArtist ?? null, opts.mood, opts.note ?? null, sentAt, opts.city, opts.countryCode],
    });

    const originHopId = uuidv4();
    await db.execute({
      sql: `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
            VALUES (?, ?, NULL, ?, 1, 1, 1, ?, ?, ?, NULL, 'revealed')`,
      args: [originHopId, id, opts.creatorId, opts.city, opts.countryCode, sentAt],
    });

    return { echoId: id, sentAt, originHopId };
  }

  async function extendChain(
    echoId: string,
    parentHopId: string,
    chainLength: number,
    hop: { city: string; hoursAfterPrev: number; note?: string; reveal: 'revealed' | 'mystery' },
    prevTime: number,
  ) {
    const city = cityByName(hop.city)!;
    const receivedAt = prevTime + hop.hoursAfterPrev * 3_600_000;
    const id = uuidv4();
    await db.execute({
      sql: `INSERT INTO hops (id, echo_id, parent_hop_id, recipient_id, is_origin, is_bot, chain_length, city, country_code, received_at, reply_note, reveal_choice)
            VALUES (?, ?, ?, NULL, 0, 1, ?, ?, ?, ?, ?, ?)`,
      args: [id, echoId, parentHopId, chainLength, city.name, city.countryCode, receivedAt, hop.note ?? null, hop.reveal],
    });
    return { id, receivedAt };
  }

  // --- The flagship example from the pitch: Paris -> Istanbul -> Tokyo -> São Paulo -> New York
  const svetlana = await botUser('Paris');
  const flagship = await insertEcho({
    creatorId: svetlana.id,
    city: 'Paris',
    countryCode: 'FR',
    songTitle: 'Clair de Lune',
    songArtist: 'Debussy',
    mood: 'insomnie',
    note: "Je n'arrive pas à dormir.",
    hoursAgo: 51,
  });
  {
    let parentId = flagship.originHopId;
    let t = flagship.sentAt;
    const steps: Array<{ city: string; hoursAfterPrev: number; note?: string; reveal: 'revealed' | 'mystery' }> = [
      { city: 'Istanbul', hoursAfterPrev: 4, note: 'Moi non plus.', reveal: 'mystery' },
      { city: 'Tokyo', hoursAfterPrev: 6, reveal: 'revealed' },
      { city: 'São Paulo', hoursAfterPrev: 9, note: 'Ça va aller.', reveal: 'mystery' },
      { city: 'New York', hoursAfterPrev: 14, reveal: 'mystery' },
    ];
    let chainLength = 2;
    for (const step of steps) {
      const res = await extendChain(flagship.echoId, parentId, chainLength, step, t);
      parentId = res.id;
      t = res.receivedAt;
      chainLength += 1;
    }
  }

  // --- A handful of fresh / lightly-traveled echoes waiting to be discovered
  const seeds: Array<{
    city: string;
    songTitle: string;
    songArtist?: string;
    mood: string;
    note?: string;
    hoursAgo: number;
    extra?: Array<{ city: string; hoursAfterPrev: number; note?: string; reveal: 'revealed' | 'mystery' }>;
  }> = [
    {
      city: 'Séoul',
      songTitle: 'Stay',
      songArtist: 'The Kid LAROI',
      mood: 'nostalgie',
      note: 'Ça me rappelle un été.',
      hoursAgo: 3,
    },
    {
      city: 'Lagos',
      songTitle: 'Essence',
      songArtist: 'Wizkid',
      mood: 'joie',
      hoursAgo: 8,
      extra: [{ city: 'Lisbonne', hoursAfterPrev: 5, reveal: 'revealed' }],
    },
    {
      city: 'Mexico',
      songTitle: 'La Vida Es Un Carnaval',
      songArtist: 'Celia Cruz',
      mood: 'espoir',
      note: 'Aujourd’hui, j’ai décidé de recommencer.',
      hoursAgo: 1.5,
    },
    {
      city: 'Berlin',
      songTitle: 'Strobe',
      songArtist: 'Deadmau5',
      mood: 'calme',
      hoursAgo: 20,
      extra: [
        { city: 'Bangkok', hoursAfterPrev: 6, reveal: 'mystery' },
        { city: 'Buenos Aires', hoursAfterPrev: 10, note: 'Je pense à quelqu’un.', reveal: 'mystery' },
      ],
    },
    {
      city: 'Mumbai',
      songTitle: 'Kun Faya Kun',
      songArtist: 'A.R. Rahman',
      mood: 'amour',
      hoursAgo: 0.5,
    },
    {
      city: 'Dakar',
      songTitle: 'Waka Waka',
      songArtist: 'Shakira',
      mood: 'colere',
      note: "J'ai besoin de bouger.",
      hoursAgo: 6,
    },
  ];

  for (const seed of seeds) {
    const user = await botUser(seed.city);
    const city = cityByName(seed.city)!;
    const echo = await insertEcho({
      creatorId: user.id,
      city: city.name,
      countryCode: city.countryCode,
      songTitle: seed.songTitle,
      songArtist: seed.songArtist,
      mood: seed.mood,
      note: seed.note,
      hoursAgo: seed.hoursAgo,
    });
    if (seed.extra) {
      let parentId = echo.originHopId;
      let t = echo.sentAt;
      let chainLength = 2;
      for (const step of seed.extra) {
        const res = await extendChain(echo.echoId, parentId, chainLength, step, t);
        parentId = res.id;
        t = res.receivedAt;
        chainLength += 1;
      }
    }
  }

  console.log('Seed terminé : 1 écho phare (Paris → Istanbul → Tokyo → São Paulo → New York) + 6 échos en circulation.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
