# Next AI SDK example

This example demonstrates the HOST LOOP pattern that ToonUI needs.

It is intentionally simple:

- no real backend
- no real model provider
- no real tool execution

Why? Because first you must understand the ARCHITECTURE.

Once the loop is clear, replacing the mock with the Vercel AI SDK is straightforward.

---

## What this example proves

- assistant messages can contain markdown + `toon-ui`
- `ToonMessage` renders the assistant UI
- button clicks emit structured `ui_reply`
- form submits emit structured `ui_submit`
- the host stores:
  - `content` for the model
  - `displayContent` for the human

That split is CRITICAL.

---

## Run it

From the monorepo root:

```bash
pnpm install
pnpm --filter @examples/next-ai-sdk dev
```

Open the local URL that Vite prints.

---

## What to type

Try:

- `crear producto`
- `eliminar producto`

Or use the draft buttons in the UI.

---

## Expected behavior

### Create product flow

1. write `crear producto`
2. the assistant returns a ToonUI form
3. fill the fields
4. submit
5. the host app stores:
   - a structured `ui_submit` payload in `content`
   - a human summary in `displayContent`

### Delete product flow

1. write `eliminar producto`
2. the assistant returns a confirmation UI
3. click `Sí, eliminar`
4. the host app stores:
   - a structured `ui_reply` payload in `content`
   - `Sí, elimínalo` in `displayContent`

---

## Important files

| File | Why it matters |
|---|---|
| `src/App.tsx` | host chat UI, assistant rendering, and event surfacing |
| `src/chat-loop.ts` | mock assistant loop and `content` vs `displayContent` model |

---

## The key architectural lesson

ToonUI does NOT own your chat framework.

The host app owns the chat.

That means the host is responsible for:

- storing messages
- deciding what the model sees
- deciding what the user sees
- deciding whether to call tools

ToonUI is responsible for:

- rendering assistant UI
- capturing interaction
- formatting structured UI events

---

## How to replace the mock with Vercel AI SDK

Use the same pattern, but replace the fake assistant loop with `streamText()` on the backend and `useChat()` or your own transport on the frontend.

High-level shape:

```ts
import { streamText } from 'ai';
import { createToonUI } from '@toon-ui/toon-ui';

const toon = createToonUI();

const appToolInstructions = [
  'Available backend tools:',
  '- createProduct(name, price, stock)',
  '- deleteProduct(id)',
].join('\n');

const result = streamText({
  model,
  system: [toon.prompt, appToolInstructions].join('\n\n'),
  messages,
  tools: {
    createProduct,
    deleteProduct,
  },
});
```

Detailed guide:

- `../../docs/guides/with-vercel-ai-sdk.md`
