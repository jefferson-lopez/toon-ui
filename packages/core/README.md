# @toon-ui/core

`@toon-ui/core` is the server and protocol foundation of ToonUI.

Use it when you need:

- `createToonProtocol()` on the server
- prompt generation
- parsing and validation
- interaction payload formatting
- chat-ready interaction messages

---

## Install

```bash
pnpm add @toon-ui/core
```

---

## Main exports

- `createToonProtocol()`
- `createToonCoreRuntime()` low-level runtime
- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `formatReplyMessage()`
- `formatSubmitMessage()`
- `createChatMessage()`
- `createChatUIMessage()`
- `createPrompt()`

---

## Server integration

This is the PRIMARY use case.

```ts
import { createToonProtocol } from '@toon-ui/core';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const toon = createToonProtocol();

const system = [
  toon.prompt,
  'Available tools:',
  '- searchProducts(query)',
  '- createProduct(name, price, stock)',
].join('\n\n');

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1'),
    system,
    messages,
    tools: {
      searchProducts: async ({ query }) => ({ ok: true, query }),
      createProduct: async ({ name, price, stock }) => ({ ok: true, name, price, stock }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

What `createToonProtocol()` gives you:

- `prompt`
- `rules`
- `formatReplyMessage()`
- `formatSubmitMessage()`
- `createChatMessage()`

---

## Frontend integration

`@toon-ui/core` is NOT the recommended frontend renderer package.

Use it on the frontend only if you are building custom tooling or your own renderer.

```ts
import { extractToonBlocks, parseToonUI, validateToonUI } from '@toon-ui/core';

const blocks = extractToonBlocks(content);
const ast = parseToonUI(blocks[0].raw);
const result = validateToonUI(ast);
```

If you want React rendering, use:

- `@toon-ui/react`
- or `@toon-ui/toon-ui`

---

## Interaction helpers

### `formatReplyMessage()`

```ts
import { formatReplyMessage } from '@toon-ui/core';

const content = formatReplyMessage({
  kind: 'ui_reply',
  eventId: 'reply_123',
  source: 'button',
  component: 'button',
  value: 'Sí, elimínalo',
});
```

### `formatSubmitMessage()`

```ts
import { formatSubmitMessage } from '@toon-ui/core';

const content = formatSubmitMessage({
  kind: 'ui_submit',
  eventId: 'submit_123',
  source: 'form',
  intent: 'create_product',
  formTitle: 'Crear producto',
  values: { name: 'Coca-Cola', price: 2500 },
});
```

### `createChatMessage()`

```ts
import { createChatMessage } from '@toon-ui/core';

const message = createChatMessage({
  kind: 'ui_reply',
  eventId: 'reply_123',
  source: 'button',
  component: 'button',
  value: 'Sí, elimínalo',
});

console.log(message.content);
console.log(message.displayContent);
```

### `createChatUIMessage()`

Useful when your frontend uses `useChat`/`UIMessage`-style state and you need:

- model-facing `content` in `parts`
- human-facing `displayContent` in `metadata`

```ts
import { createChatUIMessage } from '@toon-ui/core';

const message = createChatUIMessage({
  kind: 'ui_submit',
  eventId: 'submit_123',
  source: 'form',
  intent: 'agregar_cliente',
  formTitle: 'Agregar cliente',
  values: {
    name: 'Jefferson Lopez Mendoza',
    email: 'jeffersonlopezmendoza343@gmail.com',
  },
});

console.log(message.parts[0].text); // model content
console.log(message.metadata.displayContent); // human content
```

---

## Boundary

`@toon-ui/core` owns:

- grammar
- AST
- validation
- prompts
- interaction protocol

It does NOT own:

- React rendering
- backend tools
- persistence
- model orchestration
