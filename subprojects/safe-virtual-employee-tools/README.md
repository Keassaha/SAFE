# SAFE Virtual Employee Tools

This subproject organizes the build of SAFE productivity tools for solo lawyers.

The operating model is:

- Codex plans the next daily batch.
- Claude Code implements the batch.
- SAFE remains tool-first, with AI added later as an orchestration layer.

## Directory Map

- `CLAUDE.md` - project instructions for Claude Code
- `README-OPERATOR.md` - daily operating instructions for Codex and the human operator
- `backlog/` - prioritized tool backlog
- `specs/` - one product/technical spec per tool
- `daily/` - one daily batch plan per work session
- `prompts/` - reusable planning and implementation prompts

## Current Focus

Current tool: SAFE Time Recovery

The first objective is to identify recoverable work signals already present in SAFE, then build a deterministic review workflow before adding any AI behavior.
