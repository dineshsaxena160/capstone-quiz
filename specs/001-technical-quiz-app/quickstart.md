# Quickstart Validation Guide

This guide validates the planned React client, Express API, LangChain provider boundary, and ten-question learner workflow. It intentionally separates deterministic CI checks from the optional live provider smoke test.

## Prerequisites

- Node.js 20 LTS and npm
- A Google AI Studio API key for the live smoke test only
- A provider account/model deployment that accepts the configured structured-output model identifier `gemini-3.6-flash`
- A browser with JavaScript enabled for the Playwright flow

The CI and local mock test suites must pass without an API key.

## Install and configure

From the repository root:

```bash
npm install
```

Create local environment files from the committed placeholders:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Set values locally, without committing them:

```text
backend/.env
GOOGLE_API_KEY=developer-configured-secret
GOOGLE_MODEL=gemini-3.6-flash
CLIENT_ORIGIN=http://localhost:5173
PORT=3001

frontend/.env
VITE_API_BASE_URL=http://localhost:3001
```

The API key must remain in `backend/.env` or the deployment secret store. It must never be added to the frontend environment file, fixtures, screenshots, or logs.

The repository root also contains `README.md` with the same local commands and release boundaries. The frontend deployment workflow injects only `VITE_API_BASE_URL`; the backend key and model remain deployment-owner configuration.

## Deterministic quality gates

Run these commands without a live provider key:

```bash
npm run typecheck
npm run lint
npm test
npm run test:accessibility
npm run build
```

Expected outcome:

- Both TypeScript projects typecheck in strict mode.
- ESLint reports no errors.
- Domain tests cover topic validation, complete-set validation, duplicate detection, option shuffling, unresolved navigation, submission blocking, scoring, retry classification, and error mapping.
- Component tests cover all four screens and the absence of difficulty from visible and accessible output.
- API tests use a mocked LangChain adapter and cover success, invalid topic, malformed output, timeout, rate limit, unauthorized provider, and stale request behavior.
- Browser tests use a mocked API response and do not contact Google AI Studio.
- Accessibility checks cover keyboard focus, landmarks, grouped answer controls, live regions, state labels, and 320 px rendering.
- Production builds succeed for both frontend and backend packages.

## Run locally

Use two terminals from the repository root:

```bash
npm run dev:api
```

```bash
npm run dev:frontend
```

Open the Vite URL shown by the frontend command. The topic screen must render before any generation request and must show exactly nine topics with Start Quiz disabled until one is selected.

## Optional provider smoke test

After configuring the backend secret and exact model name:

```bash
npm run smoke:provider
```

Expected outcome:

- The command reaches Google AI Studio through the LangChain adapter.
- The configured `gemini-3.6-flash` identifier is accepted by the selected provider path.
- A small structured-output probe succeeds without printing the API key, full prompt, or response body.

If the provider rejects the identifier, the command must fail clearly and the application must remain in a safe configuration/provider error state. Do not change to another model silently; resolve provider deployment/configuration explicitly.

## End-to-end acceptance flow

Run the browser flow with the API mocked to return a valid ten-question fixture:

1. Open the application and verify all nine topics are visible.
2. Confirm Start Quiz is disabled with no selection.
3. Select one topic and confirm only that topic is selected.
4. Start the quiz and verify the loading status identifies the topic without exposing difficulty.
5. Verify the first screen shows Question 1 of 10, a prompt, grouped options, and no difficulty text or accessible name.
6. Answer a question, move forward, go back, and verify the selection remains stable.
7. Skip a question, continue to the end, and verify the unresolved count blocks submission.
8. Submit while unresolved and verify focus/navigation moves to an unanswered question.
9. Answer the skipped question, change one earlier answer, and submit once.
10. Verify score, percentage, correct count, incorrect count, and exactly ten review entries.
11. Verify every review includes the prompt, learner answer, correct answer, explanation, and code when applicable.
12. Verify correct/incorrect states use text or symbols as well as styling.
13. Verify Results exposes only Choose New Topic as its post-quiz action.
14. Choose New Topic and verify questions, answers, and result state are cleared.

## Failure and responsive checks

With the API mocked or controlled by API tests, verify:

- Missing configuration maps to a maintainer-safe configuration message.
- Network failure offers Try Again and Choose New Topic.
- Timeout and rate limit messages are plain-language and do not expose provider data.
- Malformed, incomplete, duplicate, wrong-count, wrong-type, invalid-reference, and unsafe-length responses never open a partial quiz.
- A late response from an aborted or replaced request cannot replace topic selection or a newer attempt.
- Code snippets render as inert text in a bounded region and cannot execute markup or scripts.
- The 320 px viewport has no normal page-wide horizontal scroll; only a bounded code region may scroll.
- Keyboard navigation reaches every control, focus is visible, and screen/question changes announce the next action.
- Refreshing the page discards the active in-memory attempt and does not imply persistence.
