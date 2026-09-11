# Quiz API Contract

Base URL is configured in the frontend as `VITE_API_BASE_URL`. In local development it may be `http://localhost:3001`; production must use HTTPS.

## `GET /health`

A non-sensitive liveness check for local development and deployment probes.

### Success: `200 OK`

```json
{
  "status": "ok"
}
```

The response must not include the API key, model name, prompt, provider quota, or generated content. Provider availability is verified by a separate smoke command and is not inferred from liveness alone.

## `POST /api/quiz/generate`

Generates one complete ten-question quiz for one allowlisted topic. The endpoint is stateless for learner data.

### Request

Headers:

```text
Content-Type: application/json
X-Request-Id: <optional opaque UUID>
```

Body:

```json
{
  "topic": "JavaScript"
}
```

`topic` must be exactly one of:

```text
C#
.NET Core
SQL
PostgreSQL
Azure
AWS
JavaScript
Generative AI
OOPS
```

Unknown fields, missing bodies, arrays, arbitrary topic text, and multiple topics are rejected. The API applies a small JSON body limit and a per-IP rate limit.

### Success: `200 OK`

The API returns a complete learner-safe set. Internal difficulty is validated by the API but is not returned to the browser.

```json
{
  "topic": "JavaScript",
  "questions": [
    {
      "id": "question-1",
      "type": "multiple_choice",
      "prompt": "Which statement best describes ...?",
      "options": [
        { "id": "option-a", "text": "..." },
        { "id": "option-b", "text": "..." },
        { "id": "option-c", "text": "..." },
        { "id": "option-d", "text": "..." }
      ],
      "correctOptionId": "option-b",
      "explanation": "..."
    }
  ]
}
```

The array contains exactly ten questions, at least one question of each supported type, four options for multiple-choice/code questions, and exactly `True` and `False` options for true/false questions. A code snippet is present only on code-snippet questions and is inert plain text.

### Error envelope

All expected errors use this shape:

```json
{
  "error": {
    "code": "invalid_response",
    "message": "We received an unusable quiz response. Please try again.",
    "retryable": true,
    "requestId": "optional-redacted-correlation-id"
  }
}
```

`requestId` is optional and contains no prompt, key, model response, or learner data. The client renders `message` and uses `retryable` only to choose recovery actions.

### Error status mapping

| HTTP status | Code | Retryable | Behavior |
|---:|---|---|---|
| 400 | `invalid_request` | no | The topic/body is not accepted |
| 429 | `rate_limit` | yes | Tell the learner the service is busy and offer a later retry |
| 401 or 403 from provider | `unauthorized` | no | Show configuration guidance without provider details |
| 408 or 504 | `timeout` | yes | Explain that generation took too long and offer Try Again |
| 502 | `provider` or `invalid_response` | depends | Hide raw provider data; retry only under the bounded policy |
| 503 | `configuration` or `provider` | depends | Explain service availability without exposing credentials |
| 500 | `unknown` | yes | Show generic recovery guidance and a safe correlation ID in development only |

The server maps provider errors before serialization. It never returns raw Gemini/Google AI Studio response bodies, LangChain traces, request headers, API keys, or model-generated hidden reasoning.

## Request policy

- The frontend prevents duplicate starts while a request is active and aborts obsolete requests when returning to topic selection.
- The API may suppress concurrent duplicate requests using an in-memory pending map keyed by `X-Request-Id`; entries are removed when the request settles.
- Provider calls and repair attempts share a bounded route deadline. At most two retries occur, with bounded exponential backoff and jitter.
- The client has a 30-second end-to-end timeout and does not automatically retry the same request. A learner-visible Try Again starts a new request.
- The endpoint accepts no learner-entered free text beyond the topic allowlist.

## CORS and deployment requirements

- `Access-Control-Allow-Origin` is the exact configured `CLIENT_ORIGIN`, never `*` in production.
- Credentials are disabled; the product has no cookies or login.
- Only the required `POST /api/quiz/generate` and `GET /health` methods are exposed.
- `GOOGLE_API_KEY` and `GOOGLE_MODEL` exist only in the backend environment.
- The configured `GOOGLE_MODEL` must be provider-smoke-tested as `gemini-3.6-flash` before release. An unavailable model produces a safe configuration/provider error; no alternate model is selected automatically.
