<!--
Sync Impact Report
- Version change: unversioned scaffold -> 1.1.0
- Modified principles: PRINCIPLE_1_NAME -> I. Focused, Ephemeral Learner Flow;
	PRINCIPLE_2_NAME -> II. Validated, Bounded AI Content;
	PRINCIPLE_3_NAME -> III. Deterministic Quiz Domain;
	PRINCIPLE_4_NAME -> IV. Accessible, Responsive Clarity;
	PRINCIPLE_5_NAME -> V. Test-Gated Simplicity
- Added sections: Technical and Security Constraints; Development Workflow and
	Quality Gates
- Removed sections: None
- Follow-up TODOs: TODO(RATIFICATION_DATE) records the unknown original adoption date.
-->

# AI Powered Technical Quiz App Constitution

## Core Principles

### I. Focused, Ephemeral Learner Flow
The application MUST provide one focused attempt at a time: a learner selects
exactly one allowlisted topic, completes exactly ten questions, submits once,
reviews the result, and returns only through Choose New Topic. The application
MUST keep quiz questions and answers in memory for the active tab and MUST NOT
add accounts, history, rankings, recommendations, or persistence without a
separate product decision. A stateless Node/Express provider gateway MAY be
used to protect provider credentials, but it MUST NOT create quiz sessions,
persist learner data, or become a second source of quiz state. This preserves
a fast, transparent experience while allowing the provider boundary to evolve.

### II. Validated, Bounded AI Content
The configured Google AI Studio model MUST be accessed through a LangChain
provider adapter outside presentation components and behind the Node/Express
API boundary. Every response MUST be treated as unknown input and validated as
a complete set before any question is shown: exactly ten questions, four
beginner, four intermediate, two advanced, at least one multiple-choice,
true/false, and code-snippet question, unique normalized prompts, valid option
references, and required non-empty content. Invalid, partial, ambiguous, or
malformed content MUST be discarded rather than repaired silently or displayed
partially. Learner-facing content MUST never expose internal difficulty labels,
hidden reasoning, raw provider errors, or model metadata.

### III. Deterministic Quiz Domain
Scoring and workflow behavior MUST be controlled by typed client domain rules,
not by model-generated text or displayed option positions. The client MUST use
option IDs for answer storage and comparison, preserve an immutable answer key,
shuffle options with Fisher-Yates or an equivalent unbiased algorithm, preserve
the shuffled order during an attempt, and derive score, percentage, unresolved
questions, navigation, and submission eligibility from explicit state. Domain
logic MUST remain independently testable so the same inputs always produce the
same result.

### IV. Accessible, Responsive Clarity
All primary flows MUST target WCAG 2.2 AA and remain usable from 320 px through
desktop widths. The UI MUST use semantic controls, keyboard navigation, visible
focus, managed heading focus between screens, live announcements for progress
and errors, readable bounded code blocks, and text or symbols in addition to
color for selected, correct, and incorrect states. Difficulty MUST be absent
from visible text and accessibility output. Clear progress and recovery guidance
are required because the learner must always understand the next action.

### V. Test-Gated Simplicity
The project MUST use strict TypeScript, typed discriminated state, small
feature-oriented client and API modules, and the simplest dependency set that
satisfies the product and the requested server-side provider boundary. Changes
to validation, prompting, navigation, scoring, provider errors, API contracts,
or screen behavior MUST include focused deterministic tests. Continuous
integration MUST run type checking, linting, unit/component/API tests, a
production build, and an accessibility check without a live API key. Simplicity
is a quality constraint: out-of-scope infrastructure or features require
explicit justification and approval.

## Technical and Security Constraints

- The application MUST use React, TypeScript, Tailwind CSS, and a Vite-compatible
	static client build suitable for GitHub Pages, plus a Node.js 20 LTS /
	Express API deployed separately over HTTPS. The API MUST remain stateless for
	learner data: no database, authentication system, or server-side quiz session
	is part of this release.
- Supported topics MUST come from one typed allowlist. The UI MUST reject
	arbitrary topic text, multi-topic attempts, and learner-entered prompt data.
- Google AI Studio configuration MUST be read through one typed API environment
	module using `GOOGLE_API_KEY` and `GOOGLE_MODEL`, with the requested
	`gemma-4-26b-a4b-it` value supplied through deployment configuration. The client
	MUST use a separate typed `VITE_API_BASE_URL` value. Placeholder-only
	`.env.example` files MUST be committed, `.env` files MUST be ignored, and
	keys MUST never appear in source, logs, screenshots, tests, or committed build
	artifacts.
- The deployment owner MUST keep the Google API key server-side, restrict the
	API origin and provider quota where supported, use separate development and
	production keys, and rotate a key when exposure or abuse is suspected. The
	configured model identifier MUST pass a provider smoke test before release;
	the application MUST NOT silently substitute a different model.
- API requests from the client MUST use fetch with AbortController and a
	30-second end-to-end timeout. LangChain provider calls MUST use a bounded
	request deadline and transient failures MAY be retried at most twice with
	bounded exponential backoff and jitter; authentication, configuration, and
	persistently invalid responses MUST NOT be retried indefinitely. Errors MUST
	map to a small typed model and safe plain-language recovery state.
- Model output MUST render as inert text. Generated code MUST never be executed,
	evaluated, or inserted through unsafe HTML APIs, and code content MUST have a
	bounded size and a contained overflow behavior.
- The first topic-selection UI MUST render without waiting for the API or
	Gemma. Generation loading, timeout, rate-limit, provider, network, and
	schema-failure states MUST remain understandable and accessible. No hardcoded
	fallback quiz may be substituted for a failed live generation.
- The application MUST avoid writing quiz data, answers, scores, analytics, or
	personal data to local storage, a database, or a server. HTTPS and a reviewed
	content security policy MUST be used for deployed requests where GitHub Pages
	permits them.

## Development Workflow and Quality Gates

- The PRD and this constitution MUST be reviewed before implementation changes
	are accepted. Each feature change MUST identify its affected state transition,
	domain rule, accessibility behavior, security boundary, and test coverage.
- Domain tests MUST cover topic validation, prompt counts, response schema
	rejection, duplicate detection, option shuffling, answer preservation,
	unresolved-question navigation, submission blocking, scoring, percentage
	bounds, timeout, retry classification, and error mapping.
- Component tests MUST cover topic selection, loading, quiz navigation and
	answer changes, safe code rendering, blocked submission, results completeness,
	recovery actions, and the absence of difficulty in learner-facing output.
- At least one browser-level flow MUST mock the quiz API and cover selecting a topic,
	answering, skipping, revisiting, changing an answer, blocked submission,
	deterministic results, and Choose New Topic. Narrow viewport behavior and
	malformed, timeout, and rate-limit responses MUST also be checked.
- CI MUST use deterministic fixtures and MUST NOT require a real API key. A
	production deployment MUST occur only after the configured typecheck, lint,
	test, accessibility, and build gates pass and production secrets are injected
	through the hosting workflow.
- Prompt, schema, model configuration, or provider-adapter changes MUST include
	updated fixtures and validation coverage. Reviewers MUST reject raw provider
	payloads, unsafe rendering, hidden persistence, and unrelated feature creep.

## Governance

This constitution is the governing engineering contract for the application.
The PRD defines product scope, but it cannot silently override these rules.
When a requirement conflicts with this constitution, the constitution MUST be
amended through the process below before implementation proceeds.

- An amendment MUST be proposed in a reviewed change to this file with a
	rationale, a Sync Impact Report, affected principles and sections, migration
	or compatibility notes when behavior changes, and updated compliance tests or
	acceptance checks.
- Versioning follows semantic intent: MAJOR for backward-incompatible removal
	or redefinition of a principle, MINOR for a new principle or materially
	expanded governance, and PATCH for clarifications, wording, or non-semantic
	refinements.
- Every feature specification, pull request, and release review MUST verify
	compliance with the core principles, technical constraints, accessibility
	requirements, security boundaries, and quality gates. Any approved exception
	MUST be documented with an owner, rationale, and expiration or follow-up
	decision.
- The constitution update itself MUST modify only this constitution file. Any
	deferred implementation, refactoring, build, or deployment work MUST proceed
	through its appropriate Spec Kit command and remain outside this workflow.

**Version**: 1.1.0 | **Ratified**: TODO(RATIFICATION_DATE) | **Last Amended**: 2026-09-10
