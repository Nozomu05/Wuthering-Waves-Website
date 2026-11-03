# Wuwa Wiki

A fan-made database and build guide for **Wuthering Waves**: characters, weapons, echoes, and Sonata sets, all built from the game's own data files.

## Features

- **Characters**: skill descriptions with full multiplier tables at every level, resonance chains, recommended weapons and echo builds, and total leveling material costs.
- **Weapons**: base stats, refinement scaling, passives, and ascension materials.
- **Echoes**: cost tiers and the Sonata sets each echo can belong to.
- **Echo build recommendations**: hand-curated picks where available. For the remaining characters, a local LLM reads each character's kit and suggests a role and Sonata set.
- **Search and filtering** across every list page.
- **Calculation helpers** for crit value, echo cost layouts, damage formulas, and stat scaling curves.

## Tech stack

| Area | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, React Server Components) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com), [Geist](https://vercel.com/font) font |
| Language | [TypeScript](https://www.typescriptlang.org) |
| Database | [PostgreSQL 16](https://www.postgresql.org), run locally with [Docker Compose](https://docs.docker.com/compose/) |
| ORM / migrations | [Drizzle ORM](https://orm.drizzle.team) and Drizzle Kit |
| Data pipeline | TypeScript scripts run with [tsx](https://tsx.is) |
| Build recommendations | [Ollama](https://ollama.com) running a local LLM (default `qwen2.5:14b-instruct`) |
| Linting | [ESLint](https://eslint.org) with `eslint-config-next` |

## Data sources

- **Game data**: [Arikatsu/WutheringWaves_Data](https://github.com/Arikatsu/WutheringWaves_Data) (version 3.5). Includes characters, skills, weapons, echoes, items, and English text.
- **Images**: [encore.moe](https://encore.moe). Images are downloaded once and stored in `public/images/`.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20.9 or newer
- [Docker](https://www.docker.com) (for the PostgreSQL database)
- *Optional:* [Ollama](https://ollama.com), only needed for automated echo build recommendations

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string. The default matches `docker-compose.yml`. |
| `AUTH_SECRET` | Reserved for upcoming account features. Leave empty for now. |
| `OLLAMA_HOST` | *Optional.* Ollama server URL. Defaults to `http://localhost:11434`. |
| `REASONING_MODEL` | *Optional.* Ollama model to use. Defaults to `qwen2.5:14b-instruct`. |

### 3. Start the database and create the tables

```bash
docker compose up -d
npm run db:push
```

### 4. Load the game data

```bash
npx tsx scripts/pipeline/fetch.ts
npx tsx scripts/pipeline/seed.ts
```

- `fetch.ts` downloads the raw game data into `scripts/pipeline/cache/`.
- `seed.ts` turns that data into clean tables and loads them into the database.

If Ollama isn't running, seeding still finishes. Characters without a hand-curated build just won't get an automated one.

### 5. Run the site

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

### npm scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Run the production build |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Sync the database schema with `src/lib/db/schema.ts` |
| `npm run db:generate` | Generate SQL migration files from the schema |
| `npm run db:migrate` | Apply generated migrations |
| `npm run db:studio` | Open Drizzle Studio to browse the database |

### Data pipeline scripts

Run each with `npx tsx scripts/pipeline/<file>`.

| Script | Description |
|---|---|
| `fetch.ts` | Download raw game data into the local cache |
| `seed.ts` | Transform cached data and load it into the database (replaces existing content) |
| `fetch-images.ts` | Download any missing character, weapon, and echo images into `public/images/` |
| `retry-echo-analysis.ts` | Re-run automated echo recommendations for characters that don't have one yet |
| `cleanup-mismatched-main-echoes.ts` | Remove recommended main echoes that don't belong to the recommended Sonata set |

## Project structure

```
src/
  app/                 Pages (home, characters, weapons, echoes)
  components/          Shared UI components
  lib/
    calc/              Game math (damage, crit value, scaling, echo layouts)
    db/                Drizzle schema, database client, and queries
scripts/pipeline/
  fetch.ts             Download raw game data
  seed.ts              Load transformed data into the database
  transform/           Convert raw game data into database rows
  curate/              Echo build recommendation logic (manual + LLM)
  curated/             Hand-curated echo build recommendations
  lib/                 Shared pipeline helpers
public/images/         Downloaded game images
docker-compose.yml     Local PostgreSQL database
drizzle.config.ts      Drizzle Kit configuration
```

## Disclaimer

This is an unofficial fan project and is not affiliated with or endorsed by Kuro Games. Wuthering Waves and all related names, images, and game data belong to Kuro Games.
