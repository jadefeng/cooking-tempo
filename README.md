# Cooking Tempo MVP

A simple, responsive recipe and meal planner built with Next.js App Router,
Prisma + SQLite, Tailwind CSS, and Zod validation. Import recipes from links,
edit them, and assemble meals from saved recipes.

## Setup

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://localhost:3000`.

Environment:
- Set `DATABASE_URL` to your Postgres connection string (local or Vercel Postgres).
- This project now uses Postgres everywhere (SQLite files are removed).

## Scripts

- `npm run dev` - start the development server
- `npm run build` - production build
- `npm run start` - start the production server
- `npx prisma studio` - inspect the SQLite database

## Notes

- Recipe import is best-effort: JSON-LD is preferred, with a heuristic fallback.
- Instagram import uses public metadata captions and parses headings like
  Ingredients/Instructions when present.
- Ingredients and instructions are stored as newline-separated text for MVP simplicity.
- Database is Postgres (set `DATABASE_URL` accordingly).
