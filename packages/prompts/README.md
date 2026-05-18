# @toon-ui/prompts

`@toon-ui/prompts` exposes prompt helpers only.

Use it when you want custom prompt composition without pulling in the runtime layer.

## Quick path

```ts
import { createRules } from '@toon-ui/core';
import { createPrompt, createSafetyPrompt } from '@toon-ui/prompts';

const rules = createRules();
const system = [createPrompt(rules), createSafetyPrompt()].join('

');
```

## Boundary

Owns:

- prompt text helpers

Does NOT own:

- parsing
- validation
- rendering
- event/message transport

## Pairing

- server: `@toon-ui/prompts` or `@toon-ui/core`
- client: `@toon-ui/react` or `@toon-ui/toon-ui`
