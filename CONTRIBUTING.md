# Contributing to ToonUI

Thanks for contributing.

This project is open to the community, but we care about QUALITY over speed.

## Quick path

1. Open an issue first for bugs, proposals, or significant changes.
2. Keep pull requests focused and reviewable.
3. Include docs and tests when behavior changes.
4. Be explicit about tradeoffs and architecture decisions.

## Before you start

Please check:

- existing issues
- existing pull requests
- package boundaries in the repo
- whether the change belongs to `core`, `react`, `toon-ui`, `prompts`, or `cli`

## Development principles

- Prefer clear architecture over clever shortcuts.
- Do not introduce ambiguous APIs.
- Do not mix protocol concerns with host app concerns.
- Keep public APIs intentional and teachable.
- If a change affects the mental model, update the docs.

## Setup

```bash
pnpm install
pnpm build
pnpm test
```

## Pull request guidelines

Please:

- keep the PR scoped
- explain the WHY, not only the WHAT
- update docs when public behavior or positioning changes
- add or update tests when runtime behavior changes
- avoid unrelated refactors in the same PR

## Commit style

Use conventional commits.

Examples:

- `feat(core): add chart point validation`
- `fix(react): preserve form values on rerender`
- `docs(toon-ui): clarify installation`

## Documentation expectations

If your change affects:

- installation
- package choice
- prompt behavior
- interaction payloads
- adapter ownership

then update the relevant README or docs page in the same PR.

## Need help?

If you are unsure about architecture or scope, open an issue and explain:

- the problem
- the proposed solution
- alternatives considered
- tradeoffs
