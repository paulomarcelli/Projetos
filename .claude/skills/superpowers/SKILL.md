---
name: superpowers
description: "Unified Superpowers workflow (obra/superpowers v7.0.1, 15 sub-skills) for disciplined software work: brainstorming before building, writing and executing implementation plans, subagent-driven development, parallel agents, git worktrees, test-driven development, systematic debugging, verification before claiming completion, requesting and receiving code review, finishing a branch, and writing skills. Use at the start of any coding task (new feature, change, bug, test failure, plan, review, merge) and whenever one of these practices applies."
---

# Superpowers (unified)

This skill bundles the 15 Superpowers sub-skills. Each one lives in `skills/<name>/` inside this folder, with its references and scripts.

## How to use

1. Before acting on a task (including clarifying questions or exploring code), check the index below and pick every sub-skill that applies. Process sub-skills come first: "build X" → `brainstorming`; "fix this bug" → `systematic-debugging`; then implementation.
2. Read `skills/<name>/SKILL.md` (relative to this file) and follow it as if it had been invoked directly. Announce "Using <sub-skill> to <purpose>".
3. Relative paths inside a sub-skill (`references/`, `scripts/`, `../<sibling>/scripts/`) resolve from that sub-skill's own folder, `skills/<name>/`. Run scripts through their interpreter (`bash skills/<name>/scripts/...`).
4. Where a sub-skill says to invoke, load or use another skill (written as `skills/<name>/SKILL.md`), read that file instead of calling the Skill tool.
5. Platform notes for Claude Code: `skills/using-superpowers/references/claude-code-tools.md`.
6. User instructions (CLAUDE.md, direct requests) take precedence over these sub-skills. If you were dispatched as a subagent for a specific task, skip `using-superpowers`.

## Index

## Start here

- **using-superpowers** — Use when starting any conversation - establishes how to find and use skills, requiring skill invocation before ANY response including clarifying questions

## Design and planning

- **brainstorming** — You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation).
- **writing-plans** — Use when you have a spec or requirements for a multi-step task, before touching code

## Execution

- **using-git-worktrees** — Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback
- **executing-plans** — Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is available
- **subagent-driven-development** — Use when executing implementation plans with independent tasks in the current session
- **dispatching-parallel-agents** — Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies
- **test-driven-development** — Use when implementing any feature or bugfix, before writing implementation code

## Quality and review

- **systematic-debugging** — Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes
- **verification-before-completion** — Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions always
- **requesting-code-review** — Use when completing tasks, implementing major features, or before merging to verify work meets requirements
- **receiving-code-review** — Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind implementation

## Wrapping up

- **finishing-a-development-branch** — Use when implementation is complete, all tests pass, and you need to decide how to integrate the work

## Meta

- **writing-skills** — Use when creating new skills, editing existing skills, or verifying skills work before deployment
- **diagnosing-superpowers** — Use when a superpowers session went wrong and your human partner wants to know why — repeated work, ignored plans, stumbles, poor results, a skill that didn't fire, "it took too long", "why is it so expensive", "what is it doing" — or wants to build a bug report for the superpowers maintainers, for the current session or a past one identified by id or path, on any harness.

## Typical flow

`brainstorming` → `writing-plans` → `using-git-worktrees` → `subagent-driven-development` or `executing-plans` (with `test-driven-development`) → `verification-before-completion` → `requesting-code-review` → `finishing-a-development-branch`. Use `systematic-debugging` whenever something fails, and `receiving-code-review` when feedback arrives.

Source: https://github.com/obra/superpowers (MIT, Jesse Vincent). Sub-skill texts are unchanged except that cross-references like `superpowers:<name>` were rewritten as `skills/<name>/SKILL.md`.
