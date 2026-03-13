# Adding a New Topic (SOP)

This document describes the steps to add a new quiz topic (beyond conjugation) to all three platforms.

## Overview

The app uses an extensible topic system. Each topic is a named array in `packages/core/fixtures/bank.json`. The first new topic added is `transitivity` (自動詞・他動詞).

---

## Step 1: Add Data to bank.json

Edit `packages/core/fixtures/bank.json` and add a new top-level array with the topic name (e.g. `"transitivity"`). Each entry should be a self-contained object. Document the expected shape in the new types (step 3).

Then sync all platform copies:

```sh
node scripts/fixtures-push.mjs --to all
```

---

## Step 2: Define Types (Web)

In `apps/web/src/types.ts`:

1. Add a new card type (e.g. `TransitivityCard`).
2. Add a question type and question model if needed.
3. Add the new topic name to `TopicMode`.
4. Add the new topic's settings field to the `Settings` type.

---

## Step 3: Update Constants (Web)

In `apps/web/src/data/constants.ts`:

1. Import the new card type.
2. Export `DEFAULT_<TOPIC>_BANK` loaded from `bank.json`.
3. Add storage keys for the new topic under `STORAGE_KEYS.bank`, `srs`, `stats`, and `wrong`.
4. Export any label maps for the new question types.

---

## Step 4: Create Logic Library (Web)

Create `apps/web/src/lib/<topic>.ts` with:

- `make<Topic>Question(bank, type)` - picks a random card and question config.
- `get<Topic>Answer(question)` - computes the correct answer string.
- `get<Topic>Choices(question, bank)` - returns shuffled multiple-choice options.

---

## Step 5: Update HeaderControls (Web)

In `apps/web/src/components/HeaderControls.tsx`:

1. Add the new topic option to the "主題" `<select>`.
2. Show topic-specific controls (e.g. question type picker) when the topic is active.
3. Hide conjugation-specific controls (類型, 題型, 範圍) when a non-conjugation topic is active.

---

## Step 6: Update App.tsx (Web)

In `apps/web/src/App.tsx`:

1. Import the new types, constants, and logic functions.
2. Add `topicMode` state and `<topic>Type` state, initialized from saved settings.
3. Add a `<topic>Bank`, `<topic>Question`, `<topic>Choices`, `<topic>Result`, and `<topic>Answer` state.
4. Add a `useEffect` that creates the first question when `topicMode` switches to the new topic.
5. Update the `Settings` save effect to include the new fields.
6. In the JSX, branch on `topicMode`: render the new topic's UI when active, otherwise render the conjugation flow.
7. Pass the new props to `HeaderControls`.

---

## Step 7: Update iOS CoreModels.swift

Add a new `Codable` struct for the new card type (e.g. `TransitivityCardFixture`). Update `BankFixtures` to include an optional array of the new type.

---

## Step 8: Update iOS AppState.swift

1. Add `enum <Topic>Mode` and `enum <Topic>QuestionType` with labels.
2. Add a `struct <Topic>QuestionViewModel` with `prompt`, `reading`, `answer` computed from the card.
3. Add `DefaultsKey` constants for the new settings.
4. Add `@Published` properties: `<topic>Bank`, `topicMode`, `<topic>QuestionType`, `current<Topic>Question`, `<topic>Result`, `<topic>AnswerText`.
5. In `loadDefaults()`, load the new bank from `BankFixtures`.
6. In `loadPreferences()`, restore the new settings from `UserDefaults`.
7. Add `next<Topic>Question()`, `submit<Topic>Answer(_:)`, and `skip<Topic>()` methods.

---

## Step 9: Update iOS ContentView.swift

1. Update `SettingsView` to add bindings for `topicMode` and the new question type.
2. Add a "學習主題" `Section` with a segmented `Picker` at the top of the form.
3. Conditionally show/hide conjugation sections based on `topicMode`.
4. Add a new topic section in the form when `topicMode == .<topic>`.
5. In `ContentView.body`, branch on `state.topicMode`:
   - Show the new `<Topic>CardView` and a "下一題" button calling `state.next<Topic>Question()`.
   - Otherwise show the existing conjugation flow.
6. Update `settingsSummary` to return a topic-appropriate string.
7. Add a `private struct <Topic>CardView` that renders the question, choices/input, result, and "下一題".

---

## Step 10: Update Android Models.kt

1. Add a new `@Serializable data class <Topic>CardFixture(...)`.
2. Update `BankFixtures` to include a `val <topic>: List<<Topic>CardFixture> = emptyList()`.

---

## Step 11: Update Android Importing.kt

Add `enum class TopicMode` and `enum class <Topic>QuestionType(val label: String)`.

---

## Step 12: Update Android AppViewModel.kt

1. Add imports for the new types.
2. Add `DefaultsKey` constants.
3. Add a `data class <Topic>QuestionViewModel(...)` with computed `prompt`, `reading`, `answer`.
4. Add state: `topicMode`, `<topic>Bank`, `selected<Topic>Type`, `current<Topic>Question`, `<topic>Result`, `<topic>AnswerText`.
5. In `loadDefaults()`, populate `<topic>Bank = bankFixtures.<topic>`.
6. In `loadPreferences()`, restore `topicMode` and `selected<Topic>Type`.
7. Add `setTopicMode()`, `set<Topic>Type()`, `next<Topic>Question()`, `submitTransitivityAnswer()`, `skip<Topic>()`, and `get<Topic>Choices()` methods.

---

## Step 13: Update Android ContentScreen.kt

1. Import `TopicMode` and `<Topic>QuestionType`.
2. In `ContentScreen`, branch on `viewModel.topicMode`: show `<Topic>Section(viewModel)` + "下一題" when in the new topic; otherwise show the conjugation flow.
3. Update `settingsSummary` to branch on `topicMode`.
4. In `SettingsSheet`, add `pendingTopicMode` and `pending<Topic>Type` state, a "學習主題" `SettingsSection` with `SegmentedRow`, and a conditional "題型" section for the new topic. Call `viewModel.setTopicMode()` and `viewModel.set<Topic>Type()` in the apply action.
5. Add a `@Composable private fun <Topic>Section(viewModel: AppViewModel)` that renders the prompt card, result feedback, choice buttons or text input, and a skip button.
