# Next AI SDK example

This example shows the recommended split:

- server-style protocol usage with `createToonProtocol()`
- client-side rendering with `createToonRuntime()`
- chat loop reinjection with `createChatMessage()`

---

## What this example proves

- assistant messages can contain markdown + `toon-ui`
- `ToonMessage` renders the assistant UI
- button clicks emit structured `ui_reply`
- form submits emit structured `ui_submit`
- the host converts those events back into chat-ready messages

---

## Install and run

```bash
pnpm install
pnpm --filter @examples/next-ai-sdk dev
```

---

## Architecture

```txt
Assistant message
-> ToonMessage renders UI
-> user clicks/submits
-> runtime emits payload
-> runtime.createChatMessage(payload)
-> host app stores model-facing content and human-facing displayContent
```

---

## Important files

| File | Purpose |
|---|---|
| `src/App.tsx` | host UI, message loop, event reinjection |
| `src/chat-loop.ts` | mocked assistant behavior |

---

## Server equivalent

If you replace the mock with a real backend, the server side should look like:

```ts
import { createToonProtocol } from '@toon-ui/core';
import { streamText } from 'ai';

const toon = createToonProtocol();

const system = [
  toon.prompt,
  'Available tools:',
  '- createProduct(name, price, stock)',
].join('\\n\\n');
```

---

## Client equivalent

The current example already uses the client runtime pattern:

```ts
import { createToonRuntime } from '@toon-ui/toon-ui';

const toon = createToonRuntime();
```

When interactions happen:

```ts
const message = toon.createChatMessage(payload);
```

That is the official bridge from ToonUI interaction payloads back into your chat loop.
