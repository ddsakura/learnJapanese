# Agent Editing Guide

This document captures implementation lessons from PR #22 and turns them into rules that coding agents should follow when editing this repository.

Use this together with `docs/ai-context.md`.

## Goals

- Keep cross-platform behavior aligned across web, iOS, and Android.
- Avoid reviewer churn caused by partial fixes, unstable UI state, or docs/implementation drift.
- Prefer small, coherent changes that fully close a behavior gap.

## Core Rules

### 1. Never generate random UI state during render

Do not call `shuffle()`, `random()`, `pickRandom()`, or equivalent logic from:

- React render paths
- SwiftUI `body`
- Jetpack Compose composables

If a question needs randomized choices, generate them once when the question is created and store them in stable state.

Checklist:

- Question creation computes choices.
- Re-render / recomposition only reads stored choices.
- Switching settings or modes does not silently reshuffle the same question.

### 2. Treat mode/topic switching as a state transition, not a flag flip

When changing `topicMode`, `practice`, review mode, or similar top-level state, the transition handler must do all of the following:

- Persist the new setting.
- Clear transient UI state from the old mode.
- Initialize the new mode with a valid question or empty state.
- Avoid requiring callers to remember extra cleanup calls.

Bad pattern:

- A setter updates only the enum/string.
- Callers must separately call `nextQuestion()` or manually clear state.

Preferred pattern:

- One method handles both directions of the transition.

### 3. Keep defaults, storage, runtime behavior, and docs consistent

If a feature introduces a new persisted concept, verify all of these layers together:

- Type definitions
- Default values
- Storage keys
- Load path
- Save path
- Runtime updates
- User-facing settings
- Documentation / SOP

Do not add storage keys without wiring them up.
Do not describe persistence in docs if the implementation does not actually persist.

### 4. Respect the source of truth for fixtures

`packages/core/fixtures/bank.json` is the only source of truth for the bank.

Rules:

- Edit core fixtures first.
- Sync platform copies with `node scripts/fixtures-push.mjs --to all`.
- Do not hand-edit platform fixture copies as the final source.
- When fixing formatting issues in platform fixture files, confirm whether the core file already needs the same fix.

### 5. Assume cross-platform features need cross-platform review

If a behavior exists on web, iOS, and Android, do not stop after fixing the platform named in the review comment.

Before finishing, scan the other platforms for the same class of issue:

- gating of "next" actions
- state reset when switching modes
- empty/null display handling
- choice generation timing
- initialization on app launch
- persistence behavior

A reviewer comment on one platform is often a signal that the same bug exists elsewhere.

### 6. Design for partial-state cases, not only empty/full cases

When loading saved data or falling back to fixtures, handle partial availability correctly.

Examples:

- One saved bank exists, the other does not.
- A topic bank loads but progress is missing.
- Fixtures fail to load but local data is available.

Do not write fallback logic that only works when "everything exists" or "nothing exists".

### 7. Gate progression buttons on the intended learning flow

Buttons such as `下一題`, `套用`, `略過`, and submit actions must preserve the intended UX.

Questions to check:

- Can the user skip feedback by advancing too early?
- Does a button need to be disabled until a result exists?
- If advancing without answering is allowed, should it count as skip and show the correct answer first?

Use the same rule consistently across platforms unless there is an explicit product reason not to.

### 8. Prefer a single behavior contract per feature

For any new topic or practice flow, define the expected behavior before patching code.

Minimum contract:

- How the first question is created
- Whether answer mode affects the UI
- How choices are generated
- What `skip` does
- When `next` is enabled
- What gets persisted
- What gets reset on topic switch

Then verify that each platform matches that contract.

## PR Review Checklist for Agents

Before concluding a feature PR, check:

- No randomness is executed from render/composable/view code.
- Topic/mode transitions fully initialize and clean up state.
- Storage keys and persistence are either fully wired or intentionally absent.
- Docs and implementation say the same thing.
- Fixture changes were made in core and synced outward.
- iOS, Android, and web were scanned for the same bug pattern.
- Partial saved-data states are handled safely.
- "Next" and similar actions do not bypass expected feedback.

## Validation Guidance

Run the smallest relevant checks, but prefer checks that catch integration drift:

- Web: targeted `npm test`, targeted `eslint`, and `npm run build` when TypeScript shape changes
- Android: `./gradlew :app:testDebugUnitTest`
- iOS: build/test when environment allows; otherwise do a careful static pass and call out the limitation

If a repo-level check fails due to pre-existing issues, state that clearly and separate it from the new changes.
