# SAFE Virtual Employee Tools - Operator Guide

## Daily Loop

1. Open the SAFE repo in VS Code.
2. Ask Codex to run the planner prompt from `prompts/codex-planner.md`.
3. Let Codex read this subproject, the current SAFE codebase, and the latest daily notes.
4. Review the proposed daily batch.
5. Run the exact Claude Code prompt generated in the daily file.
6. Test the implementation.
7. Commit only the coherent batch.
8. Repeat the next day.

## Role Split

Codex is the daily planner:

- reads the state of the project,
- chooses the smallest useful next batch,
- writes or updates the daily plan,
- produces the exact execution prompt.

Claude Code is the implementer:

- follows `CLAUDE.md`,
- implements only the approved batch,
- validates,
- reports changed files and next steps.

## Operating Rules

- One tool in focus at a time.
- One daily batch at a time.
- Specs before code.
- Backend domain logic before UI.
- UI before AI.
- AI only after the deterministic workflow is useful.
- Never sacrifice tenant safety for speed.
