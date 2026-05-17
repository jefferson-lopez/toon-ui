# @toon-ui/prompts

Prompt helpers for teaching models to emit valid ToonUI.

This package is useful if you want prompt-building utilities without pulling the full main entrypoint.

---

## What it includes

- `createPrompt()`
- `createComponentPrompt()`
- `createSafetyPrompt()`
- `createExamplesPrompt()`

---

## Install

```bash
pnpm add @toon-ui/prompts @toon-ui/core
```

---

## Example

```ts
import { createRules } from '@toon-ui/core';
import { createPrompt } from '@toon-ui/prompts';

const prompt = createPrompt(createRules());

console.log(prompt);
```

---

## When to use this package

Use it if you want to:

- compose your own system prompts
- reuse only the prompt layer
- keep prompt generation separate from rendering

If you want the most common setup, use:

- `@toon-ui/toon-ui`

