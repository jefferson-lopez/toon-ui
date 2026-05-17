# @toon-ui/core

Core parser, AST, validation, and protocol utilities for ToonUI.

This package is for low-level usage.

If you want the easiest React integration, use:

- `@toon-ui/toon-ui`

---

## What it includes

- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `createRules()`
- `createPrompt()`
- `formatReplyMessage()`
- `formatSubmitMessage()`

---

## Install

```bash
pnpm add @toon-ui/core
```

---

## Example

```ts
import {
  extractToonBlocks,
  parseToonUI,
  validateToonUI,
} from '@toon-ui/core';

const content = `
Claro, encontré este producto.

\`\`\`toon-ui
card "Producto encontrado":
  text "Coca-Cola 400ml"
  badge "Activo" success
\`\`\`
`;

const blocks = extractToonBlocks(content);
const ast = parseToonUI(blocks[0].raw);
const result = validateToonUI(ast);

console.log(result.ok);
```

---

## Typical use cases

Use `@toon-ui/core` if you want to:

- parse ToonUI without React
- build your own renderer
- validate assistant output before rendering
- inspect ASTs in tooling or CI
- format structured reply/submit messages yourself

---

## Important boundary

`@toon-ui/core` does NOT know:

- React
- your components
- AI SDK tools
- backend logic

It only owns:

- grammar
- typed AST
- validation
- protocol formatting

---

## Related packages

- `@toon-ui/react` — React runtime and component registry
- `@toon-ui/prompts` — prompt helpers
- `@toon-ui/toon-ui` — easiest public entrypoint

