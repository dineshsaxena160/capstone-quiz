# Product Requirements Document

## AI Powered Technical Quiz App

**Document status:** Implementation-ready baseline  
**Version:** 1.0  
**Application type:** Responsive web application  
**Frontend:** React + TypeScript  
**Styling:** Tailwind CSS  
**Hosting:** GitHub Pages  
**Backend:** None  
**Database:** None  
**Authentication:** None  
**AI provider:** Google Gemini API

## 1. Executive Summary

The AI Powered Technical Quiz App is a responsive web application that lets a learner select one technical topic and complete a short, ten-question quiz generated live by Google Gemini. Each quiz contains four Beginner, four Intermediate, and two Advanced questions. Difficulty is used internally to control generation and validation and must never be shown to the learner.

The application is intentionally ephemeral and focused. It has no accounts, login, database, score history, ranking, or administration features. A learner selects a topic, answers all ten questions, submits the quiz, and reviews a detailed result for every question. Questions are generated at quiz creation time, options are shuffled in the browser, and the session remains in memory only.

The product must be useful on a mobile phone, tablet, and desktop, while remaining small enough to deploy as a static site on GitHub Pages. Since the Gemini API is called from the browser, the API-key exposure limitation of a serverless frontend is an explicit product and security constraint, not an implementation detail to hide.

## 2. Product Vision

Make technical self-assessment immediate, focused, and trustworthy: a learner should be able to choose a subject and receive a concise, varied quiz that feels relevant, technically sound, and easy to review in a few minutes.

The experience should feel calm and transparent. The learner should always know what to do next, how far they have progressed, and why an answer is correct, without being distracted by accounts, rankings, recommendations, or unnecessary configuration.

## 3. Business Objectives

### Objectives

1. Provide a usable technical quiz experience with no registration friction.
2. Generate topic-specific questions dynamically instead of maintaining a question bank.
3. Test both conceptual understanding and practical code-reading ability.
4. Give learners immediate, question-by-question feedback after submission.
5. Keep the product simple enough to host and operate as a static GitHub Pages application.

### Product success criteria

The initial release is successful when:

- A learner can start a quiz for any supported topic and receive exactly ten valid questions.
- Every generated quiz meets the 4 Beginner, 4 Intermediate, 2 Advanced distribution internally.
- No question is duplicated within one quiz session.
- The learner cannot submit while any question is unanswered.
- A completed quiz calculates and displays correct results deterministically.
- The application remains usable at 320 px viewport width and at desktop widths.
- Invalid or unavailable Gemini responses result in understandable recovery guidance rather than a broken or partial quiz.

No analytics, account data, or ranking data is collected to measure these criteria in the initial release.

## 4. User Personas

### Technical learner

- Wants a quick way to check knowledge before an interview, assessment, course, or work task.
- May use a phone while commuting or a desktop while studying.
- Values clear explanations more than a competitive score.
- Does not want to create an account for a one-off quiz.

### Early-career developer

- Needs practice across common technologies and language ecosystems.
- Benefits from a mix of conceptual questions and realistic code snippets.
- May not know which difficulty level to choose, so the fixed mix should require no manual calibration.

### Experienced developer refreshing a topic

- Wants a compact, high-signal check of fundamentals and edge cases.
- Expects technically accurate wording and credible explanations.
- Needs fast navigation and the ability to change an answer before submission.

## 5. User Journey

1. The learner opens the application and sees the Topic Selection screen.
2. The learner selects exactly one topic from the predefined list.
3. The learner activates **Start Quiz**.
4. The application shows a loading state and requests a complete ten-question payload from Gemini.
5. The application validates the response, shuffles answer options, and opens the first question.
6. The learner answers, skips, navigates backward or forward, and changes answers as needed.
7. Skipped or otherwise unanswered questions remain in the unresolved set and must be answered before submission.
8. The learner submits after all ten questions have answers.
9. The application calculates the score locally and displays the Results screen.
10. The learner reviews every question, their answer, the correct answer, and the explanation.
11. The only action from the completed Results screen is **Choose New Topic**, which clears the current session and returns to topic selection.

## 6. Functional Requirements

### 6.1 Supported topics

The application must expose exactly these selectable topics:

1. C#
2. .NET Core
3. SQL
4. PostgreSQL
5. Azure
6. AWS
7. JavaScript
8. Generative AI
9. OOPS

Topic values must come from a typed allowlist in code. The learner must not enter arbitrary topic text. The UI must prevent selecting more than one topic for an attempt.

### 6.2 Quiz composition

Each attempt must contain exactly ten questions with this internal distribution:

| Difficulty | Required count |
| --- | ---: |
| Beginner | 4 |
| Intermediate | 4 |
| Advanced | 2 |
| **Total** | **10** |

The difficulty field may exist in the internal model and Gemini response for validation, but it must not appear in learner-facing UI, accessible labels, result text, browser titles, or explanations that reveal the intended difficulty.

The generated set must include a mix of:

- Multiple choice questions.
- True/False questions.
- Code snippet-based questions.

Each quiz must contain at least one question of each type. The remaining seven questions may be distributed according to the topic and model output. Code snippet questions may also be multiple choice, but they must include a realistic, readable snippet relevant to the selected topic.

Questions must be appropriate to the assigned difficulty, technically accurate, and distinct within the current session. Questions may repeat in later attempts.

### 6.3 Question model

The canonical application model should be equivalent to:

```ts
type Difficulty = "beginner" | "intermediate" | "advanced";
type QuestionType = "multiple_choice" | "true_false" | "code_snippet";

interface QuizQuestion {
  id: string;
  difficulty: Difficulty;
  type: QuestionType;
  prompt: string;
  code?: string;
  options: Array<{
    id: string;
    text: string;
  }>;
  correctOptionId: string;
  explanation: string;
}
```

Additional invariants:

- `id` is unique within the quiz and is generated or normalized by the client; it must not be trusted as a security identifier.
- `prompt`, option text, code, and explanation are plain text from the validated response.
- Multiple choice and code snippet questions contain exactly four options.
- True/False questions contain exactly two options whose displayed values are `True` and `False`.
- `correctOptionId` must reference one of the question's options.
- `code` is required and non-empty for `code_snippet` questions and absent for other question types unless the implementation intentionally supports code in another format.
- Explanations must explain the correct answer concisely and must not reveal the internal difficulty label.

### 6.4 Answer option behavior

- Options must be shuffled for every quiz session using a Fisher-Yates shuffle or equivalent unbiased algorithm.
- The correct answer must be tracked by option ID, never by array index or displayed text.
- Shuffling must not mutate the canonical question in a way that changes scoring.
- Option order must remain stable while the learner navigates within the same session.
- A selected option must have a visible and programmatically determinable selected state.

### 6.5 Quiz navigation and answering

- The quiz displays one question at a time.
- The progress indicator must show the current position, for example `Question 3 of 10`.
- The learner can select an answer, go to the next question, go back to a previous question, and change a previous answer.
- **Skip** moves the learner forward without selecting an answer and marks the question as unresolved.
- The application should navigate to the next unresolved question when one exists; if all later questions have been visited, it should return to the earliest unresolved question.
- The progress indicator may show the number answered, but it must not show difficulty.
- A question is considered answered only when a valid option ID is stored for it.
- The **Submit Quiz** control must be disabled while any question is unanswered, and the UI must identify how many questions remain.
- If a learner reaches the end with unresolved questions, the application must take them to the unresolved questions rather than silently submitting.
- A learner may not alter answers after submission.

### 6.6 Scoring

Scoring is performed locally after submission:

- Correct answer: 1 point.
- Incorrect answer: 0 points.
- Maximum score: 10.
- Percentage: `correctAnswers / 10 * 100`.

The score must be derived from the immutable question answer key and the learner's stored option IDs. It must not be calculated from model-generated text or from a displayed option position.

The UI must display:

- Total score in the form `X / 10`.
- Correct answers.
- Incorrect answers.
- Percentage score.

No rankings, ratings, badges, or performance tiers may be displayed.

### 6.7 Results and review

The Results screen must display:

- Selected topic name.
- Total score.
- Percentage.
- Number of correct answers.
- Number of incorrect answers.
- A review entry for every question.

Each review entry must display:

- The question prompt.
- The code snippet when applicable.
- The learner's answer.
- The correct answer.
- The detailed explanation.

The result review must make correct and incorrect outcomes visually distinct without relying on color alone. It must not display learning recommendations, difficulty, hidden metadata, or model chain-of-thought.

The completed Results screen must provide exactly one primary action: **Choose New Topic**. It must not provide Retry Quiz, Retake Same Quiz, View History, Leaderboards, or equivalent actions.

### 6.8 Session lifecycle

- Quiz data is held in application memory for the current tab session.
- No quiz history, score, question set, or learner answer is written to a database, server, local storage, or analytics system in the initial release.
- Refreshing the page or closing the tab may discard the current attempt.
- Choosing a new topic clears the current question set and answers before starting a new generation flow.
- The application must prevent double submission and duplicate generation requests while a request or submission is in progress.

## 7. Non Functional Requirements

### 7.1 Performance

- The static application should load and become interactive within 2.5 seconds on a representative mid-range device over a good 4G connection, excluding Gemini response time.
- The first contentful UI should not wait for Gemini.
- Topic selection interactions should respond within 100 ms under normal conditions.
- Gemini generation should have a client timeout of 30 seconds. The UI must show a meaningful loading state throughout the wait.
- Once questions are available, transitioning to the first question should take less than 500 ms.
- Results calculation and rendering must occur locally and should complete within 500 ms for a ten-question quiz.
- Avoid loading a large syntax-highlighting or UI library when a small text renderer is sufficient.

### 7.2 Responsiveness

- Support viewport widths from 320 px through large desktop displays.
- Use responsive Tailwind layouts with readable line lengths and stable option/button dimensions.
- On narrow screens, controls may stack vertically; no horizontal scrolling should be required for normal content.
- Code snippets must wrap or scroll within their own bounded region without causing page-wide overflow.
- Touch targets should be at least 44 by 44 CSS pixels where practical.

### 7.3 Maintainability

- Enable TypeScript strict mode.
- Keep provider-specific code behind a Gemini service adapter.
- Keep scoring, navigation, validation, shuffling, and error mapping as pure or separately testable utilities.
- Use typed discriminated unions for screen state and question types.
- Do not use `any` for API payloads or question data.
- Keep the supported topic list and quiz distribution in one typed configuration source.
- Use ESLint and consistent formatting in CI.
- Add concise comments only for non-obvious domain rules.

### 7.4 Scalability

The static frontend can scale through GitHub Pages distribution, but Gemini quota and client API-key exposure are limiting factors. The code should isolate provider configuration, request retry policy, schema validation, and prompt construction so a future service boundary could be introduced without changing quiz UI or domain logic. A backend, user system, database, and future enhancements are explicitly out of scope for this release.

### 7.5 Reliability

- A malformed or incomplete Gemini response must never open a partial quiz.
- A request retry must not create duplicate questions in an already active session.
- State transitions must be explicit and recoverable to topic selection after a terminal error.
- The application must preserve the learner's in-memory answers across question navigation.

## 8. Screen Specifications

### 8.1 Topic Selection screen

**Purpose:** Start a quiz by choosing one supported topic.

**Required elements:**

- Application name and concise purpose statement.
- A single-select topic control containing all nine supported topics.
- A clear selected state with keyboard and screen-reader support.
- **Start Quiz** button.
- Start button disabled until exactly one topic is selected.

**Behavior:**

- Selecting a topic deselects any previous topic.
- Activating Start Quiz immediately enters the loading state and disables repeated activation.
- No login, registration, topic search, custom topic entry, difficulty selector, or multi-select control.

### 8.2 Loading state

**Purpose:** Explain that questions are being created while preventing conflicting actions.

**Required elements:**

- Visible progress or loading indicator.
- Status text such as `Creating your 10-question quiz...`.
- Selected topic name.
- A polite wait message; do not expose raw API details.

**Behavior:**

- Start and topic controls are disabled during generation.
- The request uses an abort signal so a new state can cancel an obsolete request.
- Loading state must not disclose difficulty distribution to the learner.

### 8.3 Quiz screen

**Required elements:**

- Topic name.
- Progress indicator, such as `Question 3 of 10`.
- The question prompt.
- Code block for code snippet questions.
- Answer options using accessible single-select controls.
- Back, Skip, and Next controls as applicable.
- Submit Quiz control on the final workflow step.
- Remaining unanswered count when useful.

**Behavior:**

- Back is unavailable on the first question or is disabled with an explanatory accessible state.
- Next requires an answer for the current question unless the learner activates Skip.
- Skip never marks a question correct or incorrect; it only leaves it unresolved.
- Submitting with unresolved questions is blocked and focuses the first unresolved question.
- Difficulty is not shown in text, badges, styling, or control labels.

### 8.4 Results screen

**Required elements:**

- Topic name.
- Score summary with score, percentage, correct count, and incorrect count.
- Review list of all ten questions.
- Learner answer, correct answer, and explanation for each review item.
- One **Choose New Topic** action.

**Behavior:**

- Review content is read-only.
- The topic action clears current state and returns to Topic Selection.
- No retry, history, ranking, recommendation, or share actions.

### 8.5 Error states

Error states must be rendered within the application shell and must include:

- A plain-language summary.
- A useful next step.
- An accessible alert announcement.
- A non-sensitive technical error identifier in development only, if useful.

Before a quiz exists, the error state may offer **Try Again** for the failed generation and **Choose New Topic**. These are recovery actions, not post-results quiz-retake features. The Results screen restriction remains unchanged.

## 9. AI Integration Requirements

### 9.1 Configuration

Use build-time environment configuration:

```text
VITE_GEMINI_API_KEY=replace-with-developer-configured-key
VITE_GEMINI_MODEL=developer-selected-model
```

Requirements:

- Commit `.env.example` with placeholders only.
- Add `.env` to `.gitignore`.
- Read environment variables through one typed configuration module.
- Do not hardcode the API key or model name in components.
- For GitHub Actions, inject the key as a repository secret during the build; never commit it to the repository.
- Treat the key as exposed client configuration because a static frontend cannot keep it secret.

### 9.2 Generation strategy

Generate all ten questions in one Gemini request so the model can satisfy the distribution and uniqueness requirements as a set. The request must include:

- The selected topic from the allowlist.
- Exact counts: four Beginner, four Intermediate, two Advanced.
- Required question types and minimum one-of-each constraint.
- A strict JSON response contract.
- Instructions for technical accuracy, current industry practices, realistic snippets, and self-contained explanations.
- A prohibition against returning markdown fences, commentary, hidden reasoning, or difficulty-revealing learner text.

The client must validate the entire response before making any question visible. A response with one invalid item is a failed generation and must not be partially displayed.

### 9.3 Prompt engineering strategy

The prompt builder should use a stable system instruction plus a request-specific user payload. The prompt should:

1. Establish Gemini's role as a technical assessment author and reviewer.
2. State the exact topic and prohibit questions outside that topic.
3. State the exact difficulty counts without asking the model to expose difficulty to the learner.
4. Require variety in concepts, wording, distractors, and question types.
5. Require one clearly correct answer and distractors that are plausible but unambiguously wrong.
6. Require code snippets to be syntactically plausible, concise, safe to display, and relevant to the selected technology.
7. Require explanations to identify why the correct answer is correct and why the key distractors are wrong, without chain-of-thought disclosure.
8. Prohibit ambiguous questions, multiple correct answers, trick wording, version-specific claims without context, unsafe executable behavior, and invented APIs.
9. Require exact JSON matching the schema and no surrounding prose.
10. Ask the model to self-check counts, option references, uniqueness, topic alignment, and answerability before returning.

For a repair attempt, send only the validation failures and the original structured request, asking for a complete replacement payload. Do not ask the model to patch one item in place unless the response contract guarantees all ten items are returned again.

### 9.4 Response validation

Use a runtime schema validator such as Zod at the API boundary. Validation must check:

- Top-level object and question array exist.
- Exactly ten questions are present.
- Difficulty counts are 4/4/2.
- Type values are from the allowed enum.
- At least one question uses each required type.
- Every prompt and explanation is non-empty and within configured length limits.
- Multiple choice and code snippet options count is four.
- True/False options count is two and values are valid.
- Option IDs are unique within each question.
- Correct option IDs resolve to an option.
- Code is present only where required and has a safe length.
- Normalized question fingerprints are unique within the set.
- No question includes the selected topic outside the intended context or an unsupported generated topic.

The validator must normalize model output carefully but must not silently invent missing answers, explanations, or options. A small amount of whitespace normalization is acceptable; semantic repair belongs in a retry.

### 9.5 Explanations

Request one concise, technically grounded explanation per question in the generation response. This makes the Results screen available without a second request and avoids an explanation failure after a completed quiz. Explanations should be displayed as generated content after schema validation.

The product must not display hidden reasoning or ask Gemini to reveal chain-of-thought. The requested explanation is an answer rationale suitable for a learner, not internal deliberation.

### 9.6 Request policy

- Use `fetch` through the Gemini service adapter.
- Use `AbortController` with a 30-second timeout.
- Do not send learner-entered free-form data; the only quiz input is the allowlisted topic.
- Retry transient failures at most twice with bounded exponential backoff and jitter.
- Do not retry authentication/configuration errors or persistently invalid schema responses indefinitely.
- Deduplicate concurrent generation requests for the same active start action.
- Log only redacted status, timing, validation categories, and request correlation ID in development. Never log the API key or full sensitive request headers.

## 10. Quiz Workflow

### 10.1 State machine

The application should model the top-level flow as a discriminated union similar to:

```ts
type AppState =
  | { status: "topic_selection"; selectedTopic: Topic | null }
  | { status: "generating"; topic: Topic; requestId: string }
  | { status: "quiz"; session: QuizSession }
  | { status: "results"; result: QuizResult }
  | { status: "error"; topic: Topic | null; error: AppError };
```

The quiz session should contain the immutable question set, current question index, and an answer map keyed by question ID. A reducer is preferred for navigation and answer transitions because every transition is finite and testable.

### 10.2 Workflow transitions

| Current state | Event | Required result |
| --- | --- | --- |
| Topic selection | Select topic | Store one allowlisted topic |
| Topic selection | Start | Enter generating and issue one request |
| Generating | Valid response | Shuffle options, create session, show question 1 |
| Generating | Recoverable failure | Retry within policy or show error |
| Generating | Terminal failure | Show error with recovery action |
| Quiz | Select answer | Store option ID for current question |
| Quiz | Next | Advance while preserving answer state |
| Quiz | Back | Move backward while preserving answer state |
| Quiz | Skip | Leave current item unresolved and advance to next unresolved item |
| Quiz | Submit with unanswered items | Block submit and focus first unresolved question |
| Quiz | Submit complete | Score locally and show results |
| Results | Choose New Topic | Clear session and show topic selection |

### 10.3 Skip and unresolved-question algorithm

Maintain an answer map with either an option ID or no entry for each question. On Skip:

1. Leave the current question unanswered.
2. Find the next question after the current index without an answer.
3. If none exists, wrap from index zero and find the first unanswered question.
4. If every question has an answer, go to the next sequential question or the final review position.

Before submission, compute unresolved questions from the answer map rather than from navigation history. This guarantees that skipped questions cannot be accidentally omitted.

### 10.4 Submission algorithm

1. Block repeated submission events.
2. Verify that the answer map contains a valid option ID for all ten question IDs.
3. For every question, compare the stored option ID with `correctOptionId`.
4. Calculate correct count, incorrect count, score, and percentage.
5. Build an immutable result snapshot.
6. Transition to Results and release quiz controls.

## 11. Error Handling Requirements

All errors must be mapped to a small typed error model, for example `configuration`, `network`, `timeout`, `rate_limit`, `unauthorized`, `provider`, `invalid_response`, and `unknown`. The UI should not show raw Gemini response bodies or stack traces.

| Condition | Detection | User-facing behavior |
| --- | --- | --- |
| Missing API configuration | Required environment value absent at startup | `Quiz generation is not configured. Please contact the application maintainer.` Offer Choose New Topic; log a developer diagnostic without the key. |
| No internet connection | Fetch rejects or browser reports offline | `We could not reach the quiz service. Check your internet connection and try again.` Offer Try Again and Choose New Topic. |
| Slow response | 30-second abort timeout | `The quiz is taking longer than expected. Please try again.` Offer Try Again. |
| Rate limit / HTTP 429 | Provider status or quota signal | `Quiz generation is temporarily busy. Please wait a moment and try again.` Respect a safe Retry-After value when available. |
| Unauthorized / forbidden | HTTP 401 or 403 | `The quiz service is unavailable because its configuration needs attention.` Do not expose key details. |
| Provider 5xx | HTTP 500-599 | `The quiz service is temporarily unavailable. Please try again.` Retry within the bounded policy. |
| Invalid JSON or schema | Parse or runtime validation failure | Retry with a repair prompt; after the limit, `We received an unusable quiz response. Please try again.` |
| Empty question array | Valid JSON but no questions | Treat as invalid response; never render an empty quiz. |
| Partial generation | Fewer than ten valid questions or wrong difficulty counts | Treat as invalid response; discard all partial data and request a complete replacement. |
| Unexpected client error | Any unclassified failure | `Something went wrong while creating your quiz. Please try again.` Include a development-only correlation ID. |

Additional requirements:

- The application must not quietly substitute hardcoded questions when live generation fails; live generation is a core requirement.
- A failed start must not leave a stale quiz session visible.
- A generation request that finishes after the learner has returned to topic selection must be ignored using a request ID or abort signal.
- If the browser becomes offline during an active quiz, the learner may continue because all quiz data is already in memory. No offline restart or offline generation is required.
- No partial quiz may be submitted or scored.

## 12. Accessibility Requirements

Target WCAG 2.2 AA for the supported experience.

- Use semantic landmarks, headings, lists, buttons, and form controls.
- Render answer options as a properly grouped single-select control with an accessible legend or question label.
- Ensure every interactive control is keyboard reachable and has a visible focus indicator.
- Manage focus when changing screens: focus the screen heading on load and the question heading when navigating.
- Announce loading, generation failures, validation errors, and progress updates through appropriate live regions without excessive repetition.
- Do not rely on color alone for selected, correct, or incorrect states; use text and icons or labels as well.
- Maintain at least 4.5:1 contrast for normal text and 3:1 for large text and meaningful UI boundaries.
- Provide accessible names for icon-only controls; prefer text labels for Back, Skip, Next, Submit Quiz, and Choose New Topic.
- Keep text readable at 200% zoom and preserve functionality at narrow widths.
- Respect `prefers-reduced-motion`; animation must never be required to understand progress.
- Code blocks must have a descriptive accessible label and must not be announced as an executable control.
- Error messages must be associated with the relevant control or screen region.
- Do not expose the hidden difficulty in any accessible name or description.

## 13. Security Requirements

### 13.1 API-key exposure constraint

Because the app has no backend and calls Gemini from a static browser client, any API key placed in the Vite build is recoverable by a user. The `.env` file protects the key from source control, but it does not make the key secret at runtime. This limitation must be documented for maintainers and accepted by the deployment owner.

Mitigations:

- Restrict the Google API key by HTTP referrer to the production GitHub Pages origin where supported.
- Restrict the key to only the required Gemini API and apply quota and billing limits.
- Use separate development and production keys.
- Rotate or revoke the key if it is exposed or abused.
- Keep the key out of logs, screenshots, issues, and committed files.
- Inject the production value through GitHub Actions secrets at build time.

If the deployment owner requires a truly secret key, the architecture must change to a server-side proxy; that is outside this PRD's implementation scope.

### 13.2 Client and content security

- Validate every provider response before rendering or scoring.
- Render model output as text; never execute generated code or use `eval`, `new Function`, or an HTML injection path.
- Do not insert model output with unsafe HTML APIs. If rich formatting is added later, sanitize through a reviewed allowlist.
- Escape or safely render code snippets and limit their size.
- Use a Content Security Policy compatible with the Gemini endpoint and GitHub Pages where practical.
- Pin or lock dependency versions and review dependency updates.
- Keep source maps and build output free of `.env` files and accidental secrets.
- Do not collect names, email addresses, credentials, or other personal data.
- Use HTTPS for the deployed site and provider requests.

## 14. Testing Requirements

Use a TypeScript-compatible test stack such as Vitest and React Testing Library. Mock the Gemini boundary; unit tests must not depend on live API calls.

Unit Testing is required for the quiz domain, services, utilities, and state transitions before release. Tests must be deterministic, isolated from the live Gemini API, and runnable in CI without a configured API key.

### 14.1 Utility and domain tests

Test:

- Topic allowlist accepts all nine supported values and rejects arbitrary values.
- Prompt builder includes selected topic and exact 4/4/2 counts.
- Fisher-Yates option shuffle preserves all options and the correct option ID.
- Question fingerprinting detects duplicate questions after normalization.
- Response schema accepts a valid ten-question payload.
- Response schema rejects missing fields, wrong counts, duplicate IDs, invalid option references, empty explanations, invalid types, and missing code.
- Scoring returns 10/10, 0/10, and mixed-score cases correctly.
- Percentage is calculated correctly and remains bounded from 0 to 100.
- Answer map identifies unresolved questions accurately.
- Skip navigation wraps to the first unresolved question and never drops a skipped question.
- Back and Next preserve previously selected answers.
- Submission is blocked when one or more questions are unanswered.
- Request timeout, retry count, backoff classification, and error mapping behave as specified.

### 14.2 Component tests

Test:

- Topic Selection renders all topics and allows one selection only.
- Start Quiz is disabled with no selection and starts generation with a selected topic.
- Loading state disables conflicting controls and exposes an accessible status.
- Quiz screen renders prompt, options, progress, and code safely.
- Selecting an option updates the selected state.
- Back, Next, and Skip produce the expected navigation.
- Submit is disabled or blocked while unanswered questions remain.
- Changing an earlier answer changes the final score.
- Results render the topic, summary metrics, all ten questions, learner answers, correct answers, and explanations.
- Results expose only Choose New Topic as the post-quiz action.
- Error states show user-friendly text and invoke the correct recovery event.
- Difficulty never appears in learner-facing UI or accessible output.

### 14.3 Integration and end-to-end tests

At least one browser-level flow should cover:

1. Select a topic.
2. Mock a valid Gemini response.
3. Answer, skip, revisit, and change answers.
4. Verify submission remains blocked until the skipped question is answered.
5. Submit and verify deterministic score and review content.
6. Choose New Topic and verify the quiz state is cleared.

Additional browser checks should cover a malformed provider response, timeout, rate limit, and narrow viewport layout.

### 14.4 CI quality gates

The pull request pipeline should run:

- TypeScript type checking.
- ESLint.
- Unit and component tests.
- Production build.
- A basic accessibility test pass for the primary screens.

No test should require a real API key. A separate manual smoke test may use a developer-configured key outside CI.

## 15. Acceptance Criteria

### Topic selection and start

- Given the app is opened, all nine supported topics are visible.
- Given no topic is selected, Start Quiz cannot start generation.
- Given one topic is selected, Start Quiz sends that topic and enters a loading state.
- Given a second topic is selected, the first selection is cleared rather than creating a multi-topic attempt.

### Generation

- Given Gemini returns a valid response, the app opens a quiz with exactly ten questions.
- The validated internal set contains exactly four Beginner, four Intermediate, and two Advanced questions.
- The set contains at least one multiple choice, one True/False, and one code snippet question.
- No question text fingerprint is duplicated within the set.
- Options are shuffled while the correct answer remains correct.
- Given Gemini returns invalid, empty, partial, or malformed data, no partial quiz is shown.

### Quiz interaction

- The quiz displays progress in the form Question N of 10 and never displays difficulty.
- A learner can answer, navigate back, navigate forward, and change an answer.
- Skip leaves the question unanswered and the question is revisited before completion.
- Submit is unavailable or blocked until all ten questions have answers.
- A valid answer remains selected when the learner returns to its question.

### Scoring and results

- On submission, every exact option-ID match scores one point and every mismatch scores zero.
- Results display topic, score out of ten, percentage, correct count, incorrect count, and all ten reviews.
- Each review includes the question, learner answer, correct answer, and explanation.
- Results do not display learning recommendations, rankings, ratings, or difficulty.
- Results provide only Choose New Topic as the post-quiz action.

### Error, accessibility, and security

- Network, timeout, rate-limit, provider, and schema errors show plain-language recovery guidance.
- API keys are absent from source control and logs.
- Generated code is displayed as inert text and never executed.
- Primary flows are keyboard usable and meet the agreed WCAG 2.2 AA checks.
- The production build succeeds without requiring a database or backend server.

## 16. Technical Assumptions

- Node.js 20 LTS or the version standardized by the repository's CI image.
- Vite is the recommended React build tool because it supports static GitHub Pages output and build-time `VITE_` environment variables.
- Tailwind CSS is configured through the project build pipeline.
- The Gemini model and endpoint may change; both are configuration values behind the service adapter.
- The deployed GitHub Pages origin is known so API-key referrer restrictions can be configured.
- The browser supports `fetch`, `AbortController`, ES modules, and modern React browser requirements.
- Gemini requests from the deployed origin are permitted by the provider's browser/CORS behavior. If the provider disallows this in the target environment, a backend proxy is required and this architecture cannot meet the no-backend constraint.
- The client can render plain text and code snippets without a markdown or syntax execution engine.
- No data needs to survive a page refresh.
- There is no requirement to support offline generation, and no generated question is considered authoritative outside the active session.

## 17. Recommended Architecture

### 17.1 Architectural style

Use a small feature-oriented React application with a unidirectional state flow:

```text
Topic Selection
      |
      v
useQuizSession / reducer
      |
      +--> quizGenerator service --> Gemini API
      |          |
      |          +--> runtime schema validation
      |          +--> retry and error mapping
      |
      +--> Quiz domain utilities
      |          +--> shuffle
      |          +--> navigation
      |          +--> scoring
      |
      +--> Quiz / Results presentation
```

### 17.2 Responsibilities

- **App shell:** Owns top-level state and renders the correct screen for the current state.
- **Topic data/config:** Owns the allowlist and quiz distribution constants.
- **Gemini client:** Performs HTTP requests, timeout handling, and provider status mapping; it knows nothing about React.
- **Prompt builder:** Produces stable, testable system and user prompt content.
- **Question validator:** Parses and validates unknown provider data into the domain model.
- **Quiz generator:** Orchestrates prompt construction, request retry, complete-set validation, and option shuffling.
- **Quiz reducer/hook:** Owns answer selection, navigation, skip behavior, unresolved tracking, and submission state.
- **Scoring utility:** Produces an immutable result from questions and answer map.
- **Presentational components:** Render accessible screens and emit typed user events; they do not call Gemini directly.
- **Error mapper:** Converts provider, browser, and validation failures into safe user-facing messages.

### 17.3 Routing recommendation

No multi-page route is required. Use an app-state-driven shell for the three screens. If a routing library is introduced, use a hash-based route or an explicitly configured GitHub Pages fallback; do not make the initial quiz state depend on server-side route rewrites. A browser refresh may reset to Topic Selection because session persistence is out of scope.

### 17.4 Suggested dependencies

- React and React DOM.
- TypeScript.
- Tailwind CSS.
- Zod or equivalent runtime schema validation.
- Vitest and React Testing Library for tests.
- ESLint and a formatter already accepted by the repository.

Avoid adding a state-management framework, router, markdown renderer, or syntax highlighter unless the implementation demonstrates a concrete need.

## 18. Recommended Folder Structure

```text
.
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
├── public/
│   └── ...static assets...
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── app/
│   │   ├── AppState.ts
│   │   └── appReducer.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── ErrorState.tsx
│   │   ├── LoadingState.tsx
│   │   ├── ProgressIndicator.tsx
│   │   ├── QuestionCard.tsx
│   │   ├── QuestionReview.tsx
│   │   ├── ScoreSummary.tsx
│   │   └── TopicSelector.tsx
│   ├── config/
│   │   ├── env.ts
│   │   └── quizConfig.ts
│   ├── data/
│   │   └── topics.ts
│   ├── hooks/
│   │   └── useQuizSession.ts
│   ├── pages/
│   │   ├── TopicSelectionPage.tsx
│   │   ├── QuizPage.tsx
│   │   └── ResultsPage.tsx
│   ├── services/
│   │   ├── geminiClient.ts
│   │   ├── questionGenerator.ts
│   │   ├── promptBuilder.ts
│   │   └── errorMapper.ts
│   ├── types/
│   │   ├── quiz.ts
│   │   ├── api.ts
│   │   └── errors.ts
│   ├── utils/
│   │   ├── shuffle.ts
│   │   ├── questionValidation.ts
│   │   ├── questionFingerprint.ts
│   │   ├── navigation.ts
│   │   └── scoring.ts
│   └── styles/
│       └── index.css
└── tests/
    ├── components/
    ├── services/
    ├── utils/
    └── fixtures/
```

The exact filenames may be adjusted to match the chosen scaffold, but provider calls must remain outside components and domain rules must remain independently testable.

## 19. Risks and Mitigations

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Browser-exposed Gemini key is copied or abused | Quota, cost, or service disruption | Referrer/API restrictions, separate keys, quotas, rotation, no secret logging, documented limitation. |
| Gemini returns ambiguous or inaccurate content | Learner receives misleading feedback | Strict prompt, exact schema, self-check instruction, validation, bounded repair retries, manual prompt fixture review. |
| Provider response format changes | Quiz generation breaks | Isolate API adapter, pin expected schema, test fixtures, configuration-driven model, clear invalid-response state. |
| Rate limits or quota exhaustion | Learner cannot start a quiz | Exponential backoff for transient errors, clear messages, quotas, monitoring outside the app, no fake fallback questions. |
| Code snippets contain unsafe or excessively large content | XSS, layout breakage, or confusing UX | Plain-text rendering, no execution, length limits, schema validation, bounded scroll/wrap. |
| Generated questions repeat within one set | Reduced quiz quality | Prompt for variety, normalized fingerprint validation, discard and regenerate the complete set. |
| Slow generation discourages learners | Abandoned attempts | Immediate loading UI, 30-second timeout, bounded retries, concise status, no blocking initial render. |
| GitHub Pages path or SPA fallback is misconfigured | Blank or inaccessible deployment | State-driven root flow or hash routing, build/deploy smoke test, configure base path explicitly. |
| Model difficulty is accidentally shown | Violates product requirement | Keep difficulty out of presentational props where possible and test rendered/accessibility output for absence. |
| User refreshes during a quiz | Answers are lost | Document ephemeral-session behavior; persistence is intentionally out of scope. |

## 20. Out of Scope

The initial release explicitly excludes:

- Authentication.
- Authorization.
- User accounts.
- Admin portal.
- CRUD management screens.
- Database.
- Dedicated backend server or proxy.
- Score history.
- Analytics.
- Leaderboards.
- Rankings or ratings.
- Certificates.
- Learning recommendations.
- Theme switching.
- Multi-topic quizzes.
- Custom user-entered topics.
- Offline mode.
- Persistent quiz sessions.
- Social sharing.
- Export or printing.
- Voice input or narration.
- Manual question authoring UI.
- Model fine-tuning or custom AI training.
- Future enhancements or a future-feature backlog in this release.

Any capability not required by this PRD should be treated as out of scope until a separate product decision is made.