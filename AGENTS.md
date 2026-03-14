# AGENTS.md

Read `docs/ai-context.md` first for shared project context.

## Working Rules

- Treat `packages/core/fixtures/bank.json` as the source of truth for the question bank.
- When fixture data changes, use the sync scripts in `scripts/` to propagate updates to platform copies.
- For iOS project configuration, edit `apps/ios/project.yml` and regenerate the project instead of editing `.xcodeproj` files directly.
- Keep changes narrow and avoid unrelated refactors in this monorepo.
- Run the smallest relevant validation after changes:
  - web: targeted `npm test`, `npm run lint`, or `npm run build`
  - android: targeted `./gradlew` task
  - iOS: regenerate with `xcodegen generate` when `project.yml` changes, then run the relevant Xcode test/build flow
- Follow the authoritative specs in `packages/core/docs/` when changing conjugation logic, SRS behavior, or import formats.

## Branch Naming

- When creating git branches, use these prefixes:
  - `feature/` or `feat/`: new features
  - `bugfix/` or `fix/`: bug fixes
  - `hotfix/`: urgent fixes
  - `release/`: release preparation
  - `chore/`: docs, tooling, maintenance, dependency, or other non-feature updates
- Choose the narrowest accurate prefix.
- Do not use tool-specific prefixes such as `codex/`.
- For documentation-only changes, prefer `chore/`.
