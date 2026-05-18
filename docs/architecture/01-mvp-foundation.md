# ToonUI MVP foundation

## Outcome

The MVP is now registry-first, not preset-first.

## Decision summary

- `@toon-ui/core` owns grammar, AST, validation, and protocol formatting.
- `@toon-ui/react` walks the AST and resolves registered components by `node.type`.
- `@toon-ui/toon-ui` now creates a default adapter and lets developers replace pieces explicitly through `createToonAdapter()` / `createToonClient({ adapter })`.
- The component catalog is closed for the MVP.
- `meta` is removed from the official grammar and runtime surface.

## First vertical slice

- Parse `toon-ui` blocks from mixed markdown
- Build a typed AST for official nodes
- Validate semantic and safety rules
- Render through React with a component registry
- Generate a system prompt for the model
- Format reply and submit messages for the chat loop

## Active MVP packages

- `@toon-ui/core`
- `@toon-ui/react`
- `@toon-ui/prompts`
- `@toon-ui/cli`
- `@toon-ui/toon-ui`
