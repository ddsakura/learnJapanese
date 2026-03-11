# GitHub Copilot Instructions

Read `docs/ai-context.md` for project overview, commands, and architecture.

- Treat `packages/core/fixtures/bank.json` as the source of truth for question bank data.
- Use the scripts in `scripts/` to sync fixture changes to platform copies.
- Edit `apps/ios/project.yml` instead of generated `.xcodeproj` files.
- Prefer minimal diffs and avoid unrelated refactors.
- Run the smallest relevant validation for the code you changed.
