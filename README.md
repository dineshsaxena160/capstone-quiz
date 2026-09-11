# Signal Quiz

Signal Quiz is a focused ten-question technical assessment. A learner selects one of nine supported topics, answers the generated questions in the current browser tab, and receives a deterministic local result with a complete review.

The repository contains:

- `frontend`: React, TypeScript, Vite, and Tailwind static client for GitHub Pages.
- `backend`: stateless Express API with the server-only LangChain Google provider boundary.
- `packages/contracts`: shared topic, quiz, error, and Zod contract definitions.

## Local setup

Requires Node.js 20 LTS or newer and npm.

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run typecheck
npm run lint
npm test
npm run test:accessibility
npm run build
```

Set `GOOGLE_API_KEY`, `GOOGLE_MODEL`, `CLIENT_ORIGIN`, and `PORT` in `backend/.env`. Use a Google model that supports structured output; the provided configuration uses `gemini-3.6-flash`. Set only `VITE_API_BASE_URL` in `frontend/.env`.

Run the API and client in separate terminals:

```bash
npm run dev:api
npm run dev:frontend
```

The API owns provider credentials and learner-safe response validation. The browser stores the active quiz and answers only in memory. There is no account, database, history, analytics, or server-side quiz session.

## Release checks

The deterministic CI gates do not require a Google key:

```bash
npm run typecheck
npm run lint
npm test
npm run test:accessibility
npm run build
npm run test:browser
```

After configuring the backend secret and exact model deployment, run the separate credential-dependent smoke gate:

```bash
npm run smoke:provider
```

The smoke command reports only success or a safe error. It never prints the API key, prompt, or provider response. A failed smoke test blocks release; the application does not silently select a different model.