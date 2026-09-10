# Movie Recommender

A movie recommendation web app built with Next.js.

> **Note for the repo owner**: I generated this README from your repo's
> real folder structure, `package.json`, and commit history — not by
> guessing at a typical movie-recommender pattern. I could confirm the
> tech stack and file layout, but not the actual recommendation logic or
> data source (the `data/` folder's contents and the recommendation
> approach itself aren't visible from the file tree alone). The
> **"How It Works"** section below is a placeholder — fill it in with
> the real approach (content-based? an external API? a static local
> dataset?) and delete this note once you have.

## Tech Stack

- **[Next.js 16](https://nextjs.org)** (App Router) — very recent version; if you're using an AI coding assistant on this repo, note the project's own `AGENTS.md` flags real breaking changes from what older training data expects
- **React 19** + **TypeScript**
- **Tailwind CSS v4** for styling
- **Framer Motion** for animations
- **Lucide React** for icons

## Project Structure

```
├── app/            # Next.js App Router pages and layouts
├── components/     # React components
├── data/           # Movie data (source/format: TODO — describe here)
├── public/         # Static assets
├── types/          # TypeScript type definitions
├── package.json
├── next.config.ts
├── tsconfig.json
└── eslint.config.mjs
```

## How It Works

<!-- TODO: describe the actual recommendation approach here, e.g.:
- Is `data/` a static local dataset, or does the app call an external API?
- What's the recommendation method — content similarity, a fixed
  curated list, something else?
- Any notable UI/UX details worth calling out (the animations via
  Framer Motion, for instance)?
-->

## Getting Started

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it.

Other available scripts (from `package.json`):

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Deployment

Deployed on [Vercel](https://vercel.com).

## License

<!-- TODO: add a license if you want one (MIT is the common default for personal projects) -->
