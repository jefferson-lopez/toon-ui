# @toon-ui/prompts

`@toon-ui/prompts` exposes prompt helpers only.

Use it when you want to compose your own ToonUI system prompt without pulling a React runtime into the conversation.

---

## Install

```bash
pnpm add @toon-ui/core @toon-ui/prompts
```

---

## Main exports

- `createPrompt()`
- `createComponentPrompt()`
- `createSafetyPrompt()`
- `createExamplesPrompt()`

---

## Server integration

This is the main use case.

```ts
import { createRules } from '@toon-ui/core';
import {
  createPrompt,
  createSafetyPrompt,
} from '@toon-ui/prompts';

const rules = createRules();

const system = [
  createPrompt(rules),
  '',
  'Available tools:',
  '- searchProducts(query)',
  '- createProduct(name, price, stock)',
  '',
  createSafetyPrompt(),
].join('\n');
```

If you want a simpler server abstraction, prefer:

```ts
import { createToonProtocol } from '@toon-ui/core';
```

---

## Frontend integration

This package does NOT render UI.

Frontend pairing should be:

- server: `@toon-ui/prompts` or `@toon-ui/core`
- client: `@toon-ui/react` or `@toon-ui/toon-ui`

```tsx
import { createToonRuntime, ToonMessage } from '@toon-ui/toon-ui';

const toon = createToonRuntime();

export function AssistantMessage({ content }: { content: string }) {
  return <ToonMessage content={content} runtime={toon} />;
}
```

---

## Boundary

`@toon-ui/prompts` owns:

- prompt text helpers

It does NOT own:

- parsing
- validation
- rendering
- interactions
- chat transport
