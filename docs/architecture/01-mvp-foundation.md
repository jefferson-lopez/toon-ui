# ToonUI MVP foundation

## Outcome

The MVP is registry-first and package-boundary-first.

## Decision summary

- `@toon-ui/core` owns grammar, AST, validation, active catalog creation, prompt generation, and protocol formatting.
- `@toon-ui/react` walks the AST and resolves registered React components by `node.type`.
- There is no umbrella `@toon-ui/toon-ui` package, no prompt-only package, and no CLI package in the public MVP surface.
- The component language is closed: developers configure/select from standard parseable ToonUI components; they do not invent component types.
- The server prompt is generated from the active component subset configured by the host app.
- `meta` is removed from the official grammar and runtime surface.

## First vertical slice

- Parse `toon-ui` blocks from mixed markdown
- Build a typed AST for official nodes
- Validate semantic and safety rules against the active catalog
- Render through React with a component registry
- Generate a system prompt for the model from the active catalog
- Format reply and submit messages for the chat loop

## Active MVP packages

- `@toon-ui/core`
- `@toon-ui/react`
