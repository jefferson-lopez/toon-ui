# ToonUI

ToonUI lets an LLM answer with normal markdown plus compact `toon-ui` blocks, while your app keeps control of chat state, tools, persistence, and business logic.

## Quick path

1. Use `@toon-ui/core` on the server with `createToonProtocol()`.
2. Use `@toon-ui/toon-ui` on the client with `createToonRuntime()`.
3. Render assistant messages with `ToonMessage`.
4. Feed `toon.prompt` into your system prompt.
5. Convert `onReply` / `onSubmit` payloads with `toon.createChatMessage(payload)`.

---

## Package map

| Package | Purpose | Server | Frontend |
|---|---|---:|---:|
| `@toon-ui/core` | Protocol, parser, AST, validation, chat payload helpers | ✅ | ✅ low-level |
| `@toon-ui/react` | React renderer with your own component registry | with core | ✅ |
| `@toon-ui/toon-ui` | Simplest public API with built-in preset | with core on server | ✅ |
| `@toon-ui/prompts` | Prompt-building helpers only | ✅ | ⚠️ not a renderer |
| `@toon-ui/cli` | Validation and AST inspection from terminal/CI | ✅ | ❌ |

---

## Recommended architecture

```txt
Server
  createToonProtocol()
  -> toon.prompt
  -> streamText()/Responses API/your SDK
  -> tools stay in your app

Client
  createToonRuntime()
  -> <ToonMessage />
  -> onReply/onSubmit
  -> toon.createChatMessage(payload)
  -> back into your chat transport/state
```

This boundary is intentional:

- the server owns the model and tools
- the client owns rendering and UX
- ToonUI owns the UI protocol

---

## Install

### Recommended

```bash
pnpm add @toon-ui/core @toon-ui/toon-ui react react-dom
```

### Advanced split packages

```bash
pnpm add @toon-ui/core @toon-ui/react react react-dom
```

### Tooling only

```bash
pnpm add -D @toon-ui/cli
```

---

## End-to-end integration

## 1) Server integration

Use `@toon-ui/core` on the server.

```ts
import { createToonProtocol } from '@toon-ui/core';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const toon = createToonProtocol();

const appToolInstructions = [
  'Available backend tools:',
  '- createProduct(name, price, stock)',
  '- deleteProduct(id)',
].join('\n');

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1'),
    system: [toon.prompt, appToolInstructions].join('\n\n'),
    messages,
    tools: {
      createProduct: async ({ name, price, stock }) => ({ ok: true, name, price, stock }),
      deleteProduct: async ({ id }) => ({ ok: true, id }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### What the server owns

- model provider
- tool definitions
- system prompt composition
- persistence
- auth and business rules

### What ToonUI gives the server

- `toon.prompt`
- `formatReplyMessage()`
- `formatSubmitMessage()`
- `createChatMessage()`
- `parseToonUI()`
- `validateToonUI()`

---

## 2) Frontend integration

Use `@toon-ui/toon-ui` on the client.

```tsx
'use client';

import { createToonRuntime, ToonMessage } from '@toon-ui/toon-ui';
import { useChat } from '@ai-sdk/react';

const toon = createToonRuntime();

export function AssistantChat() {
  const { messages, sendMessage, setMessages } = useChat();

  return (
    <div>
      {messages.map((message) => {
        const content = message.parts
          .filter((part) => part.type === 'text')
          .map((part) => part.text ?? '')
          .join('\n\n');

        return (
          <div key={message.id}>
            {message.role === 'assistant' ? (
              <ToonMessage
                content={content}
                runtime={toon}
                onReply={(payload) => {
                  const next = toon.createChatMessage(payload);
                  setMessages((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      role: next.role,
                      parts: [{ type: 'text', text: next.content }],
                    },
                  ]);
                }}
                onSubmit={(payload) => {
                  const next = toon.createChatMessage(payload);
                  setMessages((current) => [
                    ...current,
                    {
                      id: crypto.randomUUID(),
                      role: next.role,
                      parts: [{ type: 'text', text: next.content }],
                    },
                  ]);
                }}
              />
            ) : (
              <pre>{content}</pre>
            )}
          </div>
        );
      })}

      <button onClick={() => sendMessage({ text: 'crear producto' })}>
        Enviar ejemplo
      </button>
    </div>
  );
}
```

### What the frontend owns

- chat UI
- transport/hook selection
- visual components and styling
- human-visible summaries

### What ToonUI gives the frontend

- `ToonMessage`
- `ToonRenderer`
- `onReply` / `onSubmit`
- default preset via `createToonRuntime()`
- `createChatMessage()` for chat-ready payload mapping

---

## 3) Full loop

```txt
User sends text
-> server sends messages + toon.prompt to the model
-> assistant returns markdown + optional toon-ui blocks
-> client renders assistant text with <ToonMessage />
-> user clicks or submits
-> ToonUI emits structured payload
-> toon.createChatMessage(payload)
-> host app sends that structured content back to the model
-> model decides whether to call a tool
```

---

## Core concept: `content` vs `displayContent`

Never show the raw structured payload to the human.

- `content` = what the model receives
- `displayContent` = what the human should see

Example model-facing content:

```txt
ui_reply:
  eventId: reply_abcd1234
  value: Sí, elimínalo
  source: button
  component: button
```

Human-facing display content:

```txt
Sí, elimínalo
```

---

## Main APIs

### `@toon-ui/core`

- `createToonProtocol()`
- `createToonCoreRuntime()` low-level runtime factory
- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `formatReplyMessage()`
- `formatSubmitMessage()`
- `createChatMessage()`

### `@toon-ui/react`

- `createToonReactRuntime()`
- `ToonMessage`
- `ToonRenderer`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `basicPreset()`

### `@toon-ui/toon-ui`

- `createToonRuntime()`
- all public exports from core
- all public exports from react

---

## Documentation by package

- `packages/core/README.md`
- `packages/react/README.md`
- `packages/toon-ui/README.md`
- `packages/prompts/README.md`
- `packages/cli/README.md`
- `docs/guides/with-vercel-ai-sdk.md`
- `docs/architecture/05-interaction-protocol.md`

---

## Examples

### Playground

```bash
pnpm install
pnpm --filter @apps/playground dev
```

### Next AI SDK example

```bash
pnpm install
pnpm --filter @examples/next-ai-sdk dev
```

---

## Version 0.3.1

This release removes beta package versions and clarifies the public API:

- `createToonProtocol()` for server usage
- `createToonRuntime()` for client usage
- `createToonReactRuntime()` for advanced React setups
- `createToonCoreRuntime()` for low-level core runtime usage
