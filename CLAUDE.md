# CLAUDE.md

This repository is a cross-platform JLPT N4 conjugation learning app with web, iOS, and Android clients.

Read `docs/ai-context.md` first for project structure, commands, architecture, and platform notes.

Repo-specific rules:

- Treat `packages/core/fixtures/bank.json` as the source of truth for question bank data.
- Sync platform fixture copies with the scripts in `scripts/` instead of editing all copies manually.
- Edit `apps/ios/project.yml`, not the generated `.xcodeproj`.
- Prefer minimal, targeted changes and run the smallest relevant validation for the area you changed.
