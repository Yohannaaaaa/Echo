# ECHO

Tu ne publies jamais directement.

Tu vis un moment — une chanson à 2h17 du matin, une humeur, une phrase — et l'application en fait un **écho** : un fragment anonyme envoyé quelque part dans le monde, à un inconnu, sans profil, sans followers, sans swipe.

## Le concept

- **🎵 SEND ECHO** — tu enregistres une chanson, l'heure, ton humeur et (optionnellement) une phrase. Aucune identité n'est jointe.
- **📥 Échos reçus** — tu découvres des échos envoyés par d'autres. Tu peux répondre, ce qui laisse l'écho continuer son chemin.
- **🌍 Voyage** — chaque écho garde la trace des villes qu'il a traversées (Paris → Istanbul → Tokyo → São Paulo → New York…), avec des embranchements possibles.
- **🌑 Last Echo** — chaque jour, tu vois qui a reçu tes échos. Chaque destinataire choisit : se révéler (👤) ou rester un mystère (🌑).
- **🌍 Global Echo** — une question identique pour tout le monde, chaque jour. 30 secondes pour répondre honnêtement, puis ta réponse se mélange à celles du monde entier.

## Stack technique

- [Next.js 16](https://nextjs.org/) (App Router, Route Handlers) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/) pour l'interface (thème sombre, mobile-first)
- [@libsql/client](https://github.com/tursodatabase/libsql-client-ts) — SQLite en local (fichier), ou [Turso](https://turso.tech) une fois déployé (même client, juste une URL différente)
- Identité anonyme par cookie (aucun compte, aucun mot de passe)

## Démarrer en local

```bash
npm install
npm run seed   # peuple la base avec un écho "phare" (Paris → Istanbul → Tokyo → São Paulo → New York) et quelques échos en circulation
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000). Aucune variable d'environnement n'est nécessaire en local — l'app écrit dans `data/echo.db`.

## Déployer sur Vercel

Vercel n'a pas de disque persistant, donc la base locale ne suffit pas en production : il faut une base [Turso](https://turso.tech) (SQLite hébergé, gratuit pour ce genre de projet, et compatible avec le même client `@libsql/client` — aucun changement de code entre local et prod).

1. **Créer la base Turso**
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash   # installe la CLI turso
   turso auth signup                                  # ou `turso auth login` si tu as déjà un compte
   turso db create echo
   turso db show echo --url                           # → TURSO_DATABASE_URL
   turso db tokens create echo                         # → TURSO_AUTH_TOKEN
   ```
   (Tout est aussi faisable depuis [tur.so](https://tur.so) sans la CLI.)

2. **Importer le contenu de démo (optionnel)**
   ```bash
   TURSO_DATABASE_URL=<url> TURSO_AUTH_TOKEN=<token> npm run seed
   ```

3. **Déployer sur Vercel**
   - Importe le dépôt GitHub `Yohannaaaaa/Echo` depuis [vercel.com/new](https://vercel.com/new) (Next.js est détecté automatiquement, aucune configuration à changer).
   - Dans *Project Settings → Environment Variables*, ajoute `TURSO_DATABASE_URL` et `TURSO_AUTH_TOKEN`.
   - Déploie. C'est tout — mêmes routes, même code, juste une base hébergée à la place du fichier local.

## Email de réinitialisation de mot de passe

L'app envoie un email (depuis `support.hejecho@gmail.com`) quand quelqu'un demande à réinitialiser son mot de passe. Ça passe par le SMTP de Gmail via [nodemailer](https://nodemailer.com/), avec un **mot de passe d'application** — jamais le mot de passe normal du compte Google.

1. Sur le compte Gmail `support.hejecho@gmail.com`, active la validation en deux étapes (*Compte Google → Sécurité → Validation en deux étapes*) si ce n'est pas déjà fait — Google l'exige pour créer un mot de passe d'application.
2. Va sur [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords), crée un mot de passe d'application (nom libre, ex. "ECHO"), et copie le code à 16 caractères généré.
3. Ajoute-le comme variable d'environnement `GMAIL_APP_PASSWORD` dans *Project Settings → Environment Variables* sur Vercel (et en local dans `.env.local` si besoin de tester).

Sans cette variable, les demandes de reset sont acceptées normalement mais l'email n'est simplement pas envoyé (erreur loggée côté serveur, rien ne casse pour l'utilisateur).

## Comment ça marche (résumé technique)

- Chaque écho est une ligne `echoes`, et chaque étape de son voyage (« hop ») une ligne `hops`, chaînées par `parent_hop_id`.
- Quand tu ouvres tes échos reçus, l'app te livre aléatoirement des échos en circulation créés par d'autres (jamais les tiens).
- Un écho non répondu depuis un moment a une chance de « continuer » automatiquement vers une nouvelle ville (simulation de propagation, compressée pour la démo — quelques secondes au lieu de quelques heures).
- Le choix « se révéler / rester mystère » appartient toujours à la personne qui **reçoit** l'écho, jamais à celle qui l'a envoyé.

## Build de production

```bash
npm run build
npm start
```
