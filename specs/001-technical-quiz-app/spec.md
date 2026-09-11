# Feature Specification: AI Powered Technical Quiz App

**Feature Branch**: `001-technical-quiz-app`

**Created**: 2026-09-10

**Status**: Draft

**Input**: User description: `#file:PRD.md #file:constitution.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Start a focused technical quiz (Priority: P1)

As a technical learner, I want to choose one supported topic and start a short quiz so that I can assess my knowledge without creating an account or configuring a complicated session.

**Why this priority**: Starting a valid quiz is the core value of the product. Without it, no later learning or review experience is possible.

**Independent Test**: Open the application, verify that the supported topics are available, select one topic, and start the quiz. A complete valid response should open the first question and no incomplete quiz should be shown.

**Acceptance Scenarios**:

1. **Given** the application is opened with no topic selected, **When** the learner views the topic-selection screen, **Then** all nine supported topics are visible and Start Quiz cannot be activated.
2. **Given** a learner selects a supported topic, **When** the learner activates Start Quiz, **Then** the application immediately shows a loading state for that topic and prevents duplicate starts.
3. **Given** the question-generation service returns a complete valid set, **When** generation finishes, **Then** the application opens the first question of a ten-question quiz.
4. **Given** the learner selects a different topic before starting, **When** the second topic is selected, **Then** only the second topic remains selected.

### User Story 2 - Answer, navigate, and complete the quiz (Priority: P1)

As a learner, I want to answer questions, skip and revisit them, and change earlier answers so that I can complete the assessment at my own pace and submit only when every question has an answer.

**Why this priority**: The quiz must support a trustworthy attempt rather than a one-way sequence. Preserving answers and requiring completion are essential to a meaningful score.

**Independent Test**: Use a valid ten-question quiz fixture to answer questions, move backward and forward, skip a question, revisit it, change an answer, and verify that submission remains blocked until every question is answered.

**Acceptance Scenarios**:

1. **Given** an active quiz, **When** the learner views a question, **Then** the prompt, answer choices, current position, and total of ten questions are clear.
2. **Given** the learner chooses an answer and moves away from the question, **When** the learner returns, **Then** the selected answer is still selected and can be changed.
3. **Given** the learner skips a question, **When** the application advances, **Then** that question remains unanswered and is included in the set of questions requiring attention.
4. **Given** unanswered questions remain, **When** the learner reaches the end or attempts to submit, **Then** submission is blocked, the number of unanswered questions is clear, and the learner is taken to an unanswered question.
5. **Given** every question has a valid answer, **When** the learner submits once, **Then** the application accepts the attempt and prevents further answer changes or duplicate submissions.

### User Story 3 - Review a deterministic result (Priority: P1)

As a learner, I want a clear score and a review of every question so that I can understand which answers were correct and why.

**Why this priority**: Immediate, understandable feedback is the product's main learning outcome after a quiz is completed.

**Independent Test**: Submit a fixture with a known answer pattern and verify the score, percentage, correct and incorrect counts, and all ten review entries against that pattern.

**Acceptance Scenarios**:

1. **Given** a completed quiz with known answers, **When** the results screen opens, **Then** it displays the selected topic, score out of ten, percentage, correct count, and incorrect count.
2. **Given** the results screen is open, **When** the learner reviews the questions, **Then** all ten entries show the prompt, the learner's answer, the correct answer, and an explanation.
3. **Given** answer choices were displayed in a different order, **When** the result is calculated, **Then** correctness is unchanged by the displayed position of an answer choice.
4. **Given** the results screen is open, **When** the learner checks available actions, **Then** Choose New Topic is the only post-quiz action.

### User Story 4 - Recover from generation problems (Priority: P2)

As a learner, I want understandable recovery guidance when a quiz cannot be created so that I know what to do next and never receive a partial or misleading quiz.

**Why this priority**: Live generation can fail, and graceful recovery protects trust while keeping the primary flow simple.

**Independent Test**: Simulate configuration, network, timeout, rate-limit, provider, and malformed-response failures and verify that each produces a safe message and an appropriate recovery action without opening a partial quiz.

**Acceptance Scenarios**:

1. **Given** the question-generation service is unavailable or slow, **When** the request fails or times out, **Then** the application shows a plain-language explanation and an appropriate retry or topic-selection action.
2. **Given** the service returns an incomplete, malformed, ambiguous, or invalid set, **When** the response is checked, **Then** the entire set is discarded and no partial quiz is displayed.
3. **Given** the learner returns to topic selection while an earlier request is finishing, **When** that earlier request completes, **Then** its result is ignored and cannot replace the new screen state.

### Edge Cases

- The application must prevent arbitrary topic text, unsupported topics, and multi-topic attempts.
- A question-generation response with fewer or more than ten questions, an incorrect internal composition, a duplicate prompt, an invalid answer reference, missing required content, or an invalid question type must be rejected as a whole.
- Multiple-choice and code-snippet questions must provide four choices; true/false questions must provide exactly the choices True and False.
- Code snippets must be short enough to remain readable and must stay inside their own bounded display region without causing page-wide scrolling. They are display-only text and must never run.
- Difficulty labels, model details, hidden reasoning, raw service errors, and technical diagnostics must not appear in learner-facing text or accessibility output.
- The learner may refresh or close the tab and lose the active attempt; the product must not imply that the attempt was saved.
- If the browser becomes offline during an active quiz, the learner may continue answering the questions already loaded, but a new generation cannot begin until connectivity is restored.
- Repeated activation of Start Quiz or Submit Quiz must not create duplicate requests or duplicate results.
- A selected answer must be a valid choice for the current question; invalid or missing selections remain unresolved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST show its name, a concise purpose statement, and exactly these nine supported topics: C#, .NET Core, SQL, PostgreSQL, Azure, AWS, JavaScript, Generative AI, and OOPS.
- **FR-002**: The application MUST allow exactly one supported topic to be selected for an attempt and MUST prevent custom topic text, unsupported topics, and multi-topic attempts.
- **FR-003**: Start Quiz MUST remain unavailable until exactly one supported topic is selected.
- **FR-004**: Starting a quiz MUST immediately show a loading state that identifies the selected topic without exposing internal composition details, and MUST prevent repeated starts while generation is in progress.
- **FR-005**: A successful quiz-generation response MUST contain exactly ten questions with an internal distribution of four beginner, four intermediate, and two advanced questions, plus at least one multiple-choice question, one true/false question, and one code-snippet question.
- **FR-006**: Every accepted question MUST contain a non-empty prompt, a clear set of answer choices, one correct answer, and a concise explanation; multiple-choice and code-snippet questions MUST contain four choices, while true/false questions MUST contain exactly True and False.
- **FR-007**: Accepted questions MUST be relevant to the selected topic, technically answerable, distinct within the same quiz, and free of ambiguous answer keys or unsupported claims that prevent a single best answer.
- **FR-008**: The application MUST reject the complete response when any question or required field is invalid, missing, duplicated, or incomplete, and MUST never show or score a partial set or substitute a hardcoded quiz.
- **FR-009**: Answer choices MUST be presented in a shuffled order for each attempt, the order MUST remain stable during that attempt, and the correct answer MUST remain correct regardless of its displayed position.
- **FR-010**: The quiz MUST show one question at a time with a clear position such as Question 3 of 10 and may show how many questions have been answered, but MUST NOT show internal difficulty.
- **FR-011**: The learner MUST be able to select an answer, move forward, move backward, skip, revisit earlier questions, and change a previously selected answer while the quiz is active.
- **FR-012**: Skip MUST leave the current question unanswered and MUST move to the next unanswered question after the current position, wrapping to the earliest unanswered question when necessary.
- **FR-013**: Next MUST preserve the current answer and MUST not silently mark an unanswered question as correct, incorrect, or complete.
- **FR-014**: The application MUST derive the unresolved set from the current answers, not from navigation history, so every skipped or cleared question is revisited before submission.
- **FR-015**: Submit Quiz MUST be unavailable or blocked while any question is unanswered, MUST identify how many remain, and MUST direct focus or navigation to an unresolved question.
- **FR-016**: The application MUST accept an attempt only once; after submission, the question controls MUST be read-only and repeated submission events MUST have no effect.
- **FR-017**: The score MUST be calculated from the accepted answer key and the learner's selected choices, awarding one point for each exact correct answer and zero points for each incorrect answer.
- **FR-018**: Results MUST display the selected topic, total score in the form X / 10, percentage, correct count, and incorrect count.
- **FR-019**: Results MUST provide a review entry for all ten questions containing the prompt, any applicable code snippet, the learner's answer, the correct answer, and the explanation.
- **FR-020**: Results MUST distinguish correct and incorrect outcomes using text or symbols in addition to visual styling, and MUST omit internal difficulty, hidden reasoning, model metadata, recommendations, rankings, ratings, and performance tiers.
- **FR-021**: The completed Results screen MUST provide exactly one primary action, Choose New Topic, which clears the active quiz and returns to topic selection; it MUST NOT provide retry, retake, history, leaderboard, share, or equivalent actions.
- **FR-022**: Generation failures MUST be mapped to safe, plain-language states for missing configuration, network failure, timeout, rate limit, unauthorized access, provider failure, invalid response, and unexpected failure.
- **FR-023**: Each recoverable generation failure MUST provide an appropriate next step such as Try Again or Choose New Topic, and error displays MUST NOT expose raw service payloads, credentials, stack traces, or model metadata.
- **FR-024**: The initial topic-selection screen MUST be usable before any question-generation request completes, and loading, error, and recovery states MUST clearly communicate the next available action.
- **FR-025**: Primary flows MUST be usable with a keyboard and assistive technology, with semantic controls, visible focus, meaningful headings, managed focus when screens or questions change, and live announcements for loading, progress, and errors.
- **FR-026**: The application MUST remain usable from 320 CSS pixels through desktop widths without normal page-wide horizontal scrolling, and touch targets and text must remain readable at narrow widths and increased zoom.
- **FR-027**: Selected, correct, incorrect, unresolved, loading, and error states MUST be distinguishable without relying on color alone.
- **FR-028**: Generated question text and code snippets MUST be displayed as inert text, MUST have bounded length and contained overflow, and MUST never be executed or interpreted as active content.
- **FR-029**: The application MUST keep the active quiz, answers, score, and generated content only for the current in-memory visit and MUST NOT create accounts, retain history, collect personal data, or persist quiz data for this release.
- **FR-030**: Service credentials and internal request details MUST never appear in learner-facing content, committed project files, screenshots, tests, released artifacts, or user-visible logs; deployment owners MUST treat browser-visible service access as exposed configuration and apply available origin and quota restrictions.
- **FR-031**: Release verification MUST cover topic selection, complete-set validation, duplicate detection, answer-choice shuffling, navigation and unresolved-question behavior, blocked submission, deterministic scoring, recovery states, inert code display, responsive behavior, accessibility, and the absence of difficulty from learner-facing output.

### Key Entities

- **Topic**: One of the nine supported technical subjects that defines the scope of a single quiz attempt.
- **Quiz Attempt**: The active, temporary set of ten questions, the selected topic, the current position, and the learner's answers.
- **Question**: A topic-specific assessment item with a prompt, question format, answer choices, one correct answer, an explanation, and optional display-only code.
- **Answer Choice**: A selectable response belonging to one question, including the correct choice and distractors where applicable.
- **Learner Response**: The answer choice selected for a question, or an unresolved state when no valid choice has been selected.
- **Quiz Result**: The immutable score summary and complete question-by-question review created after a valid submission.
- **Generation Error**: A safe category describing why a complete quiz could not be created and what recovery action is available.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On opening the application, a learner can see all nine supported topics and the first available action without waiting for question generation.
- **SC-002**: In acceptance testing, 100% of accepted quiz sets contain exactly ten questions, the required 4/4/2 internal composition, all three required question types, and no duplicate normalized prompts.
- **SC-003**: In acceptance testing, 100% of attempts with one or more unanswered questions are prevented from submission and identify a question requiring an answer.
- **SC-004**: In acceptance testing, 100% of selected answers remain unchanged when the learner navigates away and returns, and changing an answer changes the resulting score when the changed choice changes correctness.
- **SC-005**: For every valid submitted attempt, the result shows all four summary metrics and exactly ten review entries, with scores matching the known answer pattern in deterministic test fixtures.
- **SC-006**: For every tested generation failure category, the learner receives a plain-language message and a valid recovery action, and 0% of failed or invalid responses open a partial quiz.
- **SC-007**: All primary actions remain keyboard accessible and understandable with assistive technology in accessibility checks, including visible focus, screen changes, progress, selected states, and errors.
- **SC-008**: At a 320 CSS pixel viewport and at desktop widths, the primary screens remain readable and usable without normal page-wide horizontal scrolling; code content remains contained within its own region.
- **SC-009**: In privacy and security review, no account, personal data, quiz history, active answers, score, or service credential is stored or exposed outside the intended active visit and configured service request.
- **SC-010**: In usability acceptance testing, at least 90% of first-time learners can select a topic, complete a valid attempt, and reach the results review without facilitator intervention.

## Assumptions

- Learners have internet access when they start a new quiz; an active quiz that is already loaded can be completed if connectivity is lost.
- The question-generation service is configured and available to the application owner, but its availability is not guaranteed for every start attempt.
- The nine supported topics and the ten-question format are fixed for this release; adding topics or changing the composition requires a separate product decision.
- Generated questions may differ between attempts, but every accepted set must satisfy the same content and answerability rules before it is shown.
- A page refresh or closed tab may discard the current attempt, and learners are informed through the ephemeral nature of the flow rather than offered persistence.
- The product does not authenticate learners, collect names or contact details, or provide account-based history.
- Explanations are concise answer rationales suitable for learner review; they do not expose hidden model reasoning.
- The service access configuration is considered exposed in a browser-based product and is managed with origin restrictions, quota limits, separate development and production configuration, and rotation procedures outside the learner experience.
