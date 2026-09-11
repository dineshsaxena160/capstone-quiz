# Data Model: AI Powered Technical Quiz App

## Design boundary

The backend has a provider-facing generated model that includes difficulty for validation. The API maps it to a learner-safe response before returning it. The frontend keeps only the active question set, shuffled options, current index, and answer map in memory. No entity below is persisted.

## Shared configuration values

### SupportedTopic

A string literal from the single shared allowlist:

- `C#`
- `.NET Core`
- `SQL`
- `PostgreSQL`
- `Azure`
- `AWS`
- `JavaScript`
- `Generative AI`
- `OOPS`

The client renders this list and the API validates incoming requests against the same source. No custom topic text is accepted.

### QuizDistribution

```text
beginner: 4
intermediate: 4
advanced: 2
total: 10
```

The distribution is an internal provider validation rule. It is never included in learner-facing labels, accessible names, progress, results, or browser metadata.

## Provider-side entities

### GeneratedQuestion

The normalized question returned by the LangChain/provider adapter before the learner-safe mapping.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Required from provider only as input; normalized to a new bounded ID before use |
| `difficulty` | `beginner \| intermediate \| advanced` | Required; counts must equal 4/4/2 across the full set |
| `type` | `multiple_choice \| true_false \| code_snippet` | Required; all three types must appear in the set |
| `prompt` | string | Trimmed, non-empty, maximum 500 characters |
| `code` | string or absent | Required and maximum 4000 characters for `code_snippet`; absent for other types |
| `options` | Option[] | Four options for multiple choice and code snippet; exactly two for true/false |
| `correctOptionId` | string | Must resolve to exactly one option in the same question |
| `explanation` | string | Trimmed, non-empty, maximum 800 characters; answer rationale only, no hidden reasoning or difficulty |

The validator rejects unknown types, empty fields, duplicate option IDs, duplicate normalized prompts, invalid answer references, extra code on non-code questions, and invalid option counts.

### Option

```text
id: string
text: string
```

Option IDs must be unique within a question. Option text is trimmed, non-empty, and bounded to 240 characters. For true/false questions, the normalized displayed texts must be exactly `True` and `False`, with no additional options.

## Learner-safe entities

### QuizQuestion

The API response shape used by the browser. It intentionally omits `difficulty`.

```ts
interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "code_snippet";
  prompt: string;
  code?: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanation: string;
}
```

The backend creates stable IDs after validation. The client revalidates that every `correctOptionId` and answer reference resolves before creating a session. The answer key is immutable after the session is created.

### QuizSession

The active browser-only attempt.

```ts
interface QuizSession {
  topic: SupportedTopic;
  questions: QuizQuestion[];
  currentIndex: number;
  answers: Record<string, string | undefined>;
}
```

Invariants:

- `questions.length === 10`.
- Every question ID is unique.
- Every answer key is an option ID belonging to its question.
- `currentIndex` is between 0 and 9.
- The `answers` record contains no invalid option IDs.
- Display option order is shuffled exactly once when the session is created and remains stable during navigation.
- Skipping does not add an answer entry.

### LearnerAnswer

A valid option ID selected for a question, or an absent record for unresolved. The domain never stores an answer by array index or displayed text.

### QuizResult

An immutable snapshot created exactly once when all ten questions have valid answers.

```ts
interface QuizResult {
  topic: SupportedTopic;
  questions: QuizQuestion[];
  answers: Record<string, string>;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
}
```

The result is derived locally by comparing each stored answer ID to the question's immutable `correctOptionId`. `percentage` is `correctAnswers / 10 * 100`, bounded to 0 through 100. The results screen uses the original stable option IDs to render learner and correct answer text.

## Application state

```ts
type AppState =
  | { status: "topic_selection"; selectedTopic: SupportedTopic | null }
  | { status: "generating"; topic: SupportedTopic; requestId: string }
  | { status: "quiz"; session: QuizSession }
  | { status: "results"; result: QuizResult }
  | { status: "error"; topic: SupportedTopic | null; error: AppError };
```

Required transitions:

| Current | Event | Result |
|---|---|---|
| topic selection | select topic | Replace the one selected topic |
| topic selection | start | generating with request ID |
| generating | valid response | quiz with shuffled options and index 0 |
| generating | terminal error | error with safe category and recovery actions |
| generating | stale response | ignored if request ID or abort signal is no longer current |
| quiz | select answer | replace the current question's option ID |
| quiz | next | advance while preserving answers; unresolved current item cannot be silently scored |
| quiz | back | move backward while preserving answers |
| quiz | skip | leave current answer absent and move to next unanswered, wrapping |
| quiz | submit incomplete | remain in quiz, identify unresolved count, focus first unresolved |
| quiz | submit complete | build immutable result and enter results |
| results | choose new topic | clear session/result and enter topic selection |
| error | try again | start a new generation for the retained topic |
| error | choose new topic | clear generation error and enter topic selection |

## Navigation and unresolved rules

The unresolved set is computed from `questions` and `answers` on every relevant action. It is never inferred from visited history.

1. On skip, search indexes after `currentIndex` for the first question without a valid answer.
2. If none exists, wrap from index 0 and search through the current position.
3. If all questions have answers, advance sequentially without changing answers.
4. On submit, if unresolved questions exist, move to the first unresolved index and do not create a result.
5. A valid answer may be changed until the single successful submission transition.

## Error model

```ts
type ErrorCode =
  | "configuration"
  | "invalid_request"
  | "network"
  | "timeout"
  | "rate_limit"
  | "unauthorized"
  | "provider"
  | "invalid_response"
  | "unknown";

interface AppError {
  code: ErrorCode;
  message: string;
  retryable: boolean;
  requestId?: string;
}
```

Messages are mapped to safe product language. Raw status bodies, API keys, model metadata, stack traces, validation payloads, and provider reasoning are never returned to or rendered by the client.

## Ephemeral lifecycle

- React memory is the source of truth for the active session and result.
- No question, answer, score, topic, request body, or result is written to local storage, cookies, a database, analytics, or a durable server log.
- The API may hold a pending promise for the current request ID only while a generation is running; it is removed on completion or failure.
- Refreshing or closing the tab may discard the attempt.
- `Choose New Topic` clears all question and answer references before a new request can begin.
