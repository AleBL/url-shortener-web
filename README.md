# Curto (url-shortener-web)

Web frontend for the [URL shortener API](https://github.com/AleBL/url-shortner-api-go). Paste a link, press Enter, press Enter again to copy the short link.

- One page, in Brazilian Portuguese and English, following the browser language.
- Light and dark themes, following the system setting.
- Recent links are kept in this browser only (`localStorage`); shortening a link that is already in the list reuses it without calling the API.

Stack: Vite, React, TypeScript, Tailwind CSS v4, Vitest and Testing Library. Deployed as static files on Vercel.

## Running locally

Requirements: Node.js 20.19+ or 22.12+ (CI uses the current LTS) and Go, for the API.

1. Start the API from its repository. It uses a local SQLite file, so it neither spends the production rate limit nor creates real links:

   ```bash
   ALLOWED_ORIGINS=http://localhost:5173 go run .
   ```

   To try the rate limit message quickly, add `RATE_LIMIT_PER_MINUTE=2`.

2. Point the frontend at it and start the dev server:

   ```bash
   cp .env.example .env.local   # VITE_API_URL=http://localhost:8080
   npm install
   npm run dev                  # http://localhost:5173
   ```

## Scripts

| Script                                    | What it does                                 |
| ----------------------------------------- | -------------------------------------------- |
| `npm run dev`                             | Dev server with hot reload                   |
| `npm run build`                           | Type check and production build into `dist/` |
| `npm run preview`                         | Serves the production build                  |
| `npm test` / `npm run test:watch`         | Unit and component tests                     |
| `npm run lint`                            | oxlint                                       |
| `npm run format` / `npm run format:check` | Prettier, with Tailwind class sorting        |

Prettier also reads an optional, git-ignored `.prettierignore.local` for files that only exist on your machine.

## Environment

| Variable       | Description                                                                                                                                                                        |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL` | Base URL of the API, without a trailing slash. Baked into the bundle at build time: changing it needs a new build. `npm run build` fails when it is missing or not an http(s) URL. |

## How it talks to the API

- Requests always go from the browser straight to the API. The API rate limits per client IP, so a proxy or serverless function would make every user share one limit.
- `GET /health` runs when the page opens, to wake the server up. On Render's free plan the first request after 15 idle minutes can take about a minute; after 3 s the page says the server is waking up.
- `POST /shorten` has a 90 s timeout. Errors are shown from the HTTP status, never from the API's English error text: 400 means the link was rejected, 429 starts a countdown from `Retry-After`, anything else is a server or network error.
- The API only answers origins listed in its `ALLOWED_ORIGINS` variable. If shortening fails with "Couldn't reach the server" while the API is up, check that variable first: the browser console shows a CORS error in that case.

## Languages

Every visible text lives in `src/i18n/messages.ts`. The English dictionary is typed after the Portuguese one, so a missing or extra key fails the type check. To add a text, add the key to both dictionaries and read it with `const { t } = useI18n()`.

The language comes from the saved choice, then the first Portuguese or English entry in the browser's language list, then English. The static `index.html` (title, description, Open Graph tags) stays in Portuguese, because crawlers and link previews do not run the script that switches languages.

## Deploy and branches

```
feature branch  --PR-->  staging  --PR-->  main
                            |                |
                     fixed staging URL   production
```

- `main` deploys to production on Vercel; `staging` deploys to a fixed preview URL.
- Feature branches start from `staging`. Their own preview URLs are not in `ALLOWED_ORIGINS`, so they are only useful to review the interface.
- Vercel needs `VITE_API_URL` for both Production and Preview.
- Staging and production share the same API and database: links created on staging are real.
- CI (`.github/workflows/ci.yml`) runs lint, format check, tests and build on pushes to `main` and `staging` and on pull requests.
