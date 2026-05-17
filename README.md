# ToonUI

ToonUI is the UI language for AI-native apps.

## Core idea

```txt
AI -> markdown + toon-ui -> parser -> typed AST -> validator -> React runtime -> your components
```

ToonUI defines what can exist.
The developer defines how it looks.
The AI decides when to use it.

## Boundary

ToonUI does NOT own model orchestration or backend tools.

- ToonUI owns UI grammar, AST, validation, rendering, and reply/submit protocols.
- Your host app owns `messages`, `streamText()`, `tools`, and backend execution.
- Compose ToonUI prompt instructions with your app-specific tool instructions OUTSIDE ToonUI.

## Official MVP catalog

- `text`
- `card`
- `form`
- `field`
- `button`
- `confirm`
- `list`
- `item`
- `badge`
- `alert`
- `table`

## Current architecture

- `@toon-ui/core` — parser, typed AST, validator, rules, reply/submit formatting
- `@toon-ui/react` — AST traversal, component registry, interaction hooks
- `@toon-ui/shadcn` — optional preset for the component registry
- `@toon-ui/prompts` — prompt helper generators
- `@toon-ui/cli` — inspection and validation commands
- `toon-ui` — primary public entrypoint

## Important docs

- `docs/architecture/01-mvp-foundation.md`
- `docs/architecture/02-official-catalog.md`
- `docs/architecture/03-grammar-spec.md`
- `docs/architecture/04-error-system.md`
- `docs/architecture/05-interaction-protocol.md`
