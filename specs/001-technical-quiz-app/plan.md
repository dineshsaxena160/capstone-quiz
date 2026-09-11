# Implementation Plan: AI Powered Technical Quiz App

**Branch**: `001-technical-quiz-app` | **Date**: 2026-09-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-technical-quiz-app/spec.md`, product requirements from `/PRD.md`, and the user-specified stack: React + TypeScript frontend, Node.js + Express API, LangChain, Google AI Studio, and `gemma-4-26b-a4b-it`.

## Summary

Build a focused ten-question technical quiz with nine allowlisted topics, deterministic in-memory quiz behavior, complete-set AI validation, accessible responsive screens, and safe recovery from provider failures. The latest user-provided stack changes the provider boundary from the original static browser-to-Gemini proposal: React remains a Vite/Tailwind static client deployed to GitHub Pages, while a stateless Node.js 20 / Express API invokes LangChain and Google AI Studio with the API key held only on the server. The API validates the full generated set before returning learner-safe questions; the client owns option shuffling, navigation, scoring, and the ephemeral answer map.

The functional requirements in the PRD and feature specification remain authoritative for the learner experience. The user-specified server boundary supersedes the PRD's `Backend: None`, direct browser-key, and `VITE_GEMINI_API_KEY` architecture statements. No server-side quiz session, database, authentication, history, analytics, or fallback question bank is introduced.

## Technical Context

**Language/Version**: TypeScript with strict mode; Node.js 20 LTS; browser ES modules supported by the Vite target

**Primary Dependencies**: React, React DOM, Vite, Tailwind CSS, Express, `@langchain/google`, `@langchain/core`, Zod, Vitest, React Testing Library, Supertest, Playwright, and an accessibility assertion library

**Storage**: N/A for durable storage. Quiz state and answers live in the active React tab only. The API may keep only bounded in-flight request promises for duplicate suppression and must discard them when settled.

**Testing**: Vitest for shared/domain/API unit tests, React Testing Library for components, Supertest for Express contracts, Playwright with mocked API responses for browser flows, and automated accessibility assertions for primary screens

**Target Platform**: Static React client on GitHub Pages; separately deployed HTTPS Node.js 20 Express service, with Google AI Studio reachable from the service. The API host must provide environment secrets and a public CORS-allowed origin.

**Project Type**: Split web application with a static frontend, stateless JSON API, and shared TypeScript/Zod contracts

**Performance Goals**: First topic UI interactive within 2.5 seconds excluding AI latency; client generation request aborts at 30 seconds; API generation stays within that end-to-end budget; loaded quiz transitions and local result calculation complete within 500 ms; normal topic interactions respond within 100 ms

**Constraints**: Exactly ten questions per accepted set with a 4/4/2 internal difficulty distribution and all three required question types; one allowlisted topic; no learner free text; no persistence; server-only Google API key; inert text rendering; no raw provider errors; no page-wide overflow at 320 px; bounded provider retries and request deadlines; exact model configuration must pass a provider smoke test before release

**Scale/Scope**: Nine topics, one active ten-question attempt per browser tab, one generation endpoint, no accounts or durable user data. Initial API protection uses a small per-IP rate limit and a single configured frontend origin rather than a multi-tenant platform.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The constitution was amended from 1.0.0 to 1.1.0 before this plan to authorize the requested stateless Node/Express provider boundary while retaining the product's ephemeral behavior.

- **I. Focused, Ephemeral Learner Flow: PASS.** The API is stateless for learner data; the browser keeps the only active session, and results expose only Choose New Topic.
- **II. Validated, Bounded AI Content: PASS.** LangChain and Google AI Studio are isolated behind the API; Zod validates the complete response before any client display, and difficulty is removed from the learner-facing contract.
- **III. Deterministic Quiz Domain: PASS.** Shared contracts, client option-ID answers, Fisher-Yates shuffling, reducer transitions, and local scoring remain independent of model text and displayed option position.
- **IV. Accessible, Responsive Clarity: PASS.** The screen and component plan includes semantic single-select controls, managed focus, live status/error regions, bounded code, visible focus, and 320 px checks.
- **V. Test-Gated Simplicity: PASS WITH JUSTIFICATION.** The requested API and LangChain boundary are required by the user input and are limited to one stateless generation route; focused server, client, contract, and browser tests gate the added surface.
- **Security constraints: PASS.** `GOOGLE_API_KEY` stays in the API environment, `VITE_API_BASE_URL` is the only client service configuration, CORS and rate limiting are explicit, and no quiz data is persisted.
- **Model availability gate: PASS WITH RELEASE CHECK.** `gemma-4-26b-a4b-it` is the configured Google AI Studio model and supports the provider path. A provider smoke test remains mandatory, and the application must fail with a safe configuration/provider error rather than silently choose another model.

## Project Structure

### Documentation (this feature)

```text
specs/001-technical-quiz-app/
├── plan.md              # This implementation plan
├── research.md          # Phase 0 architecture and dependency decisions
├── data-model.md        # Phase 1 domain, API, and state model
├── quickstart.md        # Phase 1 validation and local run guide
├── contracts/
│   └── quiz-api.md      # HTTP request, response, and error contract
└── tasks.md             # Phase 2 output from /speckit-tasks
```

### Source Code (repository root)

```text
package.json                 # npm workspace scripts and shared quality gates
frontend/
├── package.json
├── .env.example              # VITE_API_BASE_URL placeholder only
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/                  # top-level state union and reducer
│   ├── components/           # accessible reusable UI pieces
│   ├── pages/                # topic selection, quiz, results, error/loading
│   ├── domain/               # shuffle, navigation, answer validation, scoring
│   ├── services/             # typed API client and safe error mapping
│   └── styles/
└── tests/                    # component and browser-facing client tests
backend/
├── package.json
├── .env.example              # GOOGLE_API_KEY, GOOGLE_MODEL, CLIENT_ORIGIN
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config/               # typed environment and limits
│   ├── api/                  # routes, controllers, middleware, errors
│   ├── quiz/                 # prompt, generation, validation, normalization
│   └── provider/             # LangChain ChatGoogle adapter
└── tests/                    # validator, provider mock, and Supertest tests
packages/contracts/
├── package.json
└── src/
    ├── topics.ts              # shared allowlist and quiz distribution
    ├── quiz.ts                # learner-safe shared types
    ├── schemas.ts             # request, response, and error schemas
    └── index.ts
```

**Structure Decision**: Use a small npm workspace with two deployable packages and one shared contract package. `frontend` contains no provider SDK or secret; `backend` owns Express, LangChain, provider configuration, retries, and complete response validation; `packages/contracts` prevents the HTTP shape and topic allowlist from drifting between them. No repository, database, auth, or server-side session layer is planned.

## Phase 0: Research Outputs

Research decisions are recorded in [research.md](research.md). The main resolved unknowns are the server/client boundary, LangChain Google integration, model configuration caveat, structured-output validation, deadline/retry ownership, CORS/rate limiting, ephemeral state, and test strategy.

## Phase 1: Design Outputs

- [data-model.md](data-model.md) defines server-side generated questions, learner-safe questions, quiz sessions, result snapshots, state transitions, validation limits, and error categories.
- [contracts/quiz-api.md](contracts/quiz-api.md) defines the Express health and quiz-generation contracts, HTTP statuses, safe errors, and security behavior.
- [quickstart.md](quickstart.md) defines dependency setup, mock-only quality gates, local client/API execution, provider smoke validation, and end-to-end acceptance scenarios.

## Post-Design Constitution Recheck

- **Scope and state:** PASS. The API has no durable quiz state, and the client state machine still has one active attempt and one results exit action.
- **Provider boundary:** PASS. The only external model call is in `backend/src/provider`, with prompt construction, structured output, semantic validation, error mapping, and model availability checks outside React.
- **Domain correctness:** PASS. The client receives a learner-safe question set and independently validates option references before shuffling; score and unresolved navigation use typed option IDs.
- **Accessibility and security:** PASS. The contract prevents raw provider payloads and server secrets from reaching the client; the UI plan covers focus, live regions, inert code, responsive layout, and non-color state labels.
- **Quality gates:** PASS. CI will run workspace typecheck, lint, unit/component/API tests, mocked browser tests, accessibility checks, and both production builds without a live key. A separate smoke command is the only key-dependent check.

No unresolved `NEEDS CLARIFICATION` items remain in the technical context. The requested model's hosted availability is an explicit release gate, not an unresolved implementation choice.

## Complexity Tracking

| Addition | Why Needed | Simpler Alternative Rejected Because |
|----------|------------|---------------------------------------|
| Stateless Node/Express API | Required by the user-specified backend/API stack and keeps the Google key off the browser | Direct browser calls contradict the requested server boundary and expose the key at runtime |
| LangChain provider adapter | Required framework choice and isolates prompt/model invocation behind a replaceable boundary | Direct Google SDK calls would ignore the requested framework and couple orchestration to the provider client |
| Shared contracts package | Keeps the allowlist and HTTP schemas identical across the two TypeScript deployables | Duplicated types would permit client/API drift; a full shared state-management package would be unnecessary |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
