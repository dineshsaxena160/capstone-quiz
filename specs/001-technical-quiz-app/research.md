# Research: AI Powered Technical Quiz App

## Source reconciliation

**Decision:** Treat the latest user-specified stack as the architecture decision for this feature while retaining the PRD and feature specification's learner-facing behavior, scope, and acceptance criteria.

**Rationale:** The original documents describe a static frontend that calls Gemini directly, but the requested stack explicitly requires a Node.js backend, Express API, LangChain, and a Google AI Studio key. A server-side provider boundary is the smallest change that satisfies the new stack without adding accounts, persistence, or server-side quiz sessions.

**Alternatives considered:**

- Direct browser-to-Google calls were rejected because they expose the API key in the built client and do not satisfy the requested backend.
- A persistent backend session or database was rejected because the product is intentionally ephemeral and the client already owns quiz answers and scoring.
- A single Node process serving both the built frontend and API was rejected for the initial deployment because the PRD's GitHub Pages frontend target can be preserved with a separately deployed API.

## Deployment boundary

**Decision:** Deploy the Vite/Tailwind React client to GitHub Pages and deploy a stateless Node.js 20 / Express API to an HTTPS Node-compatible host. Configure the client with `VITE_API_BASE_URL` and configure the API with `CLIENT_ORIGIN`.

**Rationale:** GitHub Pages cannot execute Express, while a separate API preserves the requested static frontend and keeps the Google AI Studio key server-side. CORS is explicit and limited to the deployed frontend origin.

**Alternatives considered:**

- Replacing GitHub Pages with a single Node host would reduce CORS setup but changes an existing product deployment assumption.
- Adding a serverless function layer would work technically but adds provider-specific deployment coupling and is not required by the requested stack.

## LangChain and Google integration

**Decision:** Use LangChain's current JavaScript Google integration, `@langchain/google`, with `ChatGoogle` imported from the Node entry point. Read `GOOGLE_API_KEY` and `GOOGLE_MODEL` only in the backend configuration module. Use LangChain structured output with a Zod schema where supported, then run the application's complete semantic validator as a second boundary check.

**Rationale:** The current LangChain documentation recommends `@langchain/google` for new Google AI Studio integrations, supports API-key authentication, and exposes structured output. Keeping all provider-specific imports in `backend/src/provider` makes a future provider or package migration local.

**Alternatives considered:**

- The older `@langchain/google-genai` package was rejected for new code because LangChain documents it as a legacy integration being replaced by `@langchain/google`.
- The Google SDK without LangChain was rejected because LangChain is an explicit user requirement.
- LangChain agents, tools, retrieval, and code execution were rejected because quiz generation is a single bounded structured-output request and does not need agent behavior.

## Requested model identifier

**Decision:** Use `gemma-4-26b-a4b-it` as the configured `GOOGLE_MODEL` value because it is the requested Gemma 4 26B instruction-tuned deployment and supports the provider path. Add a provider smoke test and startup/configuration diagnostic that confirms the configured model can be reached through the selected Google AI Studio path before release.

**Rationale:** This preserves the exact model requested by the user while keeping model selection explicit at the provider boundary. The application must surface a safe configuration/provider error if the selected API path rejects the configured deployment.

**Alternatives considered:**

- Silently substituting a listed Gemini model was rejected because it would violate the explicit model request.
- Embedding or self-hosting the 26B model inside the Express process was rejected because it is outside the Node/Express API-key requirement and would require substantial hardware/deployment work.
- Adding a second model fallback was rejected because it would make production behavior non-deterministic and hide deployment misconfiguration.

## Structured generation and validation

**Decision:** Generate all ten questions in one LangChain invocation. Use a Zod output schema for the shape, then validate the entire set against shared topic and quiz rules before returning it. On an invalid response, retry with categorized validation failures and the original structured request; never patch or display individual items.

**Rationale:** One request lets the model satisfy the 4/4/2 composition and type variety as a set. Structured output improves parse reliability, but schema-valid output can still be semantically incomplete, duplicated, too long, or incorrectly keyed, so application validation remains mandatory.

**Alternatives considered:**

- Ten separate model calls were rejected because they make composition, uniqueness, latency, and quota behavior worse.
- Client-only validation was rejected because the API should never return an invalid set and the provider key and raw response belong on the server.
- Silent normalization that invents missing fields or answers was rejected because it can create misleading scoring.

## Prompt and repair policy

**Decision:** Use a stable system instruction plus a request payload containing only the allowlisted topic, required counts, type minimums, schema rules, safety limits, and answer-rationale requirements. A repair attempt receives only categorized validation failures and the original structured request and must return a complete replacement set.

**Rationale:** The endpoint receives no learner free text. A stable prompt keeps behavior testable, and categorized failures make repair targeted without exposing raw provider payloads to the client or asking for hidden reasoning.

**Alternatives considered:**

- Asking the model to reveal chain-of-thought was rejected; explanations are short learner-facing rationales only.
- Asking the model to patch one invalid question was rejected because a replacement payload must be validated as a complete set.

## Timeout and retry ownership

**Decision:** The client uses one 30-second `AbortController` deadline for the generation request. The API owns provider retries and repair attempts within a shorter route deadline, with at most two retries, bounded exponential backoff, jitter, and no nested automatic client retries. Configuration, authentication, and persistently invalid responses are terminal for that request.

**Rationale:** Keeping retries at the API boundary prevents the browser from multiplying provider calls and keeps provider-specific policy out of React. A route deadline leaves transport time for the client response and guarantees the browser can recover predictably.

**Alternatives considered:**

- Independent client and server retries were rejected because one click could create many provider requests.
- Unbounded invalid-response repair was rejected because it can exhaust quota and leave the UI waiting indefinitely.

## API security and abuse controls

**Decision:** Expose only `POST /api/quiz/generate` and a non-sensitive `GET /health`. Validate the topic with a shared enum, reject unknown body fields where practical, cap request size, restrict CORS to `CLIENT_ORIGIN`, apply a per-IP rate limit, and return typed safe errors without provider bodies or stack traces. Use an optional opaque request ID for correlation and concurrent in-flight suppression; remove it when settled.

**Rationale:** There is no authentication requirement, but a server-side key and public endpoint need basic origin, quota, and abuse controls. In-flight suppression prevents duplicate active starts without creating durable quiz state.

**Alternatives considered:**

- Authentication and cookies were rejected as out of scope.
- Persistent idempotency records were rejected because they would store quiz data and create server-side session behavior.
- Logging prompts, generated questions, or headers was rejected because the output is model content and logs must remain redacted.

## Client domain and testing

**Decision:** Keep quiz state in a typed React reducer and keep shuffle, navigation, answer validation, unresolved tracking, submission gating, and scoring in pure client utilities. Use Vitest, React Testing Library, Supertest, Playwright, and accessibility assertions with deterministic fixtures and a mocked provider/API in CI.

**Rationale:** The product's correctness rules do not require network access after a quiz is loaded. Pure utilities make skip wrapping and score determinism easy to test; browser tests prove the full learner flow without a live key.

**Alternatives considered:**

- A global state framework was rejected because one reducer and context are sufficient for one active attempt.
- Live API calls in tests were rejected because they are slow, non-deterministic, quota-consuming, and require secrets.
- Local storage persistence was rejected because refresh-loss is an explicit product constraint.

## References consulted

- LangChain JavaScript `ChatGoogle` integration: `https://docs.langchain.com/oss/javascript/integrations/chat/google`
- Google AI structured output guidance: `https://ai.google.dev/gemini-api/docs/structured-output`
- Google Gemma 4 overview: `https://ai.google.dev/gemma/docs/core`
- Google Gemma getting started guide: `https://ai.google.dev/gemma/docs/get_started`
- Google Gemini model catalog: `https://ai.google.dev/gemini-api/docs/models`
