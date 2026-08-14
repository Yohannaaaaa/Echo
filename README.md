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
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — base de données locale, aucun service externe requis
- Identité anonyme par cookie (aucun compte, aucun mot de passe)

## Démarrer en local

```bash
npm install
npm run seed   # peuple la base avec un écho "phare" (Paris → Istanbul → Tokyo → São Paulo → New York) et quelques échos en circulation
npm run dev
```

Puis ouvre [http://localhost:3000](http://localhost:3000).

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
