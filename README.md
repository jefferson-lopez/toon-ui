# ToonUI

ToonUI lets an LLM answer with normal markdown plus compact `toon-ui` blocks, while your app keeps ownership of tools, persistence, transport, and business logic.

## What problem ToonUI solves

Without ToonUI, an LLM usually has to return:

- raw text only
- HTML/React/JSON that is too open-ended
- UI structures that are hard to validate and unsafe to trust

ToonUI gives you a middle layer:

- constrained UI grammar
- typed AST
- validation
- React rendering
- structured interaction payloads

That means the model can say:

```toon-ui
form "Agregar cliente":
  field name text "Nombre" required
  field email email "Email" required
  field phone text "Teléfono" required
  button primary "Agregar cliente" submit
```

and your app can render that safely and feed the interaction back into the chat loop in a structured way.

---

## Quick path

1. Use `@toon-ui/core` on the server with `createToonProtocol()`.
2. Use `@toon-ui/toon-ui` on the client with `createToonRuntime()`.
3. Render assistant messages with `ToonMessage`, or use `extractToonMarkdown()` + `ToonRenderer` for host-first markdown rendering.
4. Feed `toon.prompt` into your system prompt.
5. Convert `onReply` / `onSubmit` payloads with `toon.createChatUIMessage(payload)` if you use `useChat`, or `toon.createChatMessage(payload)` for a generic host loop.

---

## Package map

| Package | Purpose | Server | Frontend |
|---|---|---:|---:|
| `@toon-ui/core` | Protocol, parser, AST, validation, chat payload helpers | ✅ | ✅ low-level |
| `@toon-ui/react` | Explicit React renderer with your own registry | with core | ✅ |
| `@toon-ui/toon-ui` | Main public package with built-in preset | with core on server | ✅ |
| `@toon-ui/prompts` | Prompt fragments only | ✅ | ⚠️ not a renderer |
| `@toon-ui/cli` | Validation / inspect in terminal and CI | ✅ | ❌ |

---

## Architecture

```txt
Server
  createToonProtocol()
  -> toon.prompt
  -> model call
  -> tools remain in your app

Client
  createToonRuntime()
  -> host markdown renderer or <ToonMessage />
  -> <ToonRenderer />
  -> onReply/onSubmit
  -> createChatUIMessage() or createChatMessage()
  -> back into your chat state
```

### Responsibility split

ToonUI owns:

- UI grammar
- validation
- rendering
- structured interaction payloads

Your app owns:

- model provider
- tool calling
- persistence
- auth
- business mutations
- message transport

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

## The most important concept: `content` vs `displayContent`

This is the part people get wrong FIRST.

- `content` = what the model should receive
- `displayContent` = what the human should see

Example user action:

### Model-facing content

```txt
ui_submit:
  eventId: submit_9p245eo7
  intent: agregar_cliente
  formTitle: Agregar cliente
  name: "Jefferson Lopez Mendoza"
  email: "jeffersonlopezmendoza343@gmail.com"
  phone: "4157145953"
```

### Human-facing display content

```txt
Agregar cliente
name: Jefferson Lopez Mendoza
email: jeffersonlopezmendoza343@gmail.com
phone: 4157145953
```

If the human sees the raw `ui_submit:` block, your integration is wrong.

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

### What you use from the protocol

- `toon.prompt`
- `toon.rules`
- `toon.formatReplyMessage()`
- `toon.formatSubmitMessage()`
- `toon.createChatMessage()`
- `toon.createChatUIMessage()`

---

## 2) Client integration

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
                  setMessages((current) => [
                    ...current,
                    toon.createChatUIMessage(payload),
                  ]);
                }}
                onSubmit={(payload) => {
                  setMessages((current) => [
                    ...current,
                    toon.createChatUIMessage(payload),
                  ]);
                }}
              />
            ) : (
              <pre>{message.metadata?.displayContent ?? content}</pre>
            )}
          </div>
        );
      })}

      <button onClick={() => sendMessage({ text: 'agregar cliente' })}>
        Enviar ejemplo
      </button>
    </div>
  );
}
```

---

## 3) Full loop

```txt
User sends text
-> server calls model with toon.prompt
-> assistant returns markdown + optional toon-ui blocks
-> client renders with ToonMessage
-> user clicks or submits
-> ToonUI emits structured payload
-> host app converts payload back into chat state
-> model receives content
-> human sees displayContent
-> model decides whether to call a tool
```

---

## When to use `createChatMessage()` vs `createChatUIMessage()`

## `createChatMessage(payload)`

Use this when your app has its OWN host message model.

Return shape:

- `role`
- `kind`
- `content`
- `displayContent`
- `payload`

Example:

```ts
const message = toon.createChatMessage(payload);

hostMessages.push({
  id: crypto.randomUUID(),
  role: message.role,
  content: message.content,
  displayContent: message.displayContent,
});
```

## `createChatUIMessage(payload)`

Use this when your app uses `useChat` / `UIMessage`-style state and wants a message already shaped for that pattern.

Return shape:

- `id`
- `role`
- `parts`
- `metadata.displayContent`
- `metadata.kind`

Example:

```ts
setMessages((current) => [
  ...current,
  toon.createChatUIMessage(payload),
]);
```

### Rule of thumb

- custom host state -> `createChatMessage()`
- `useChat` state -> `createChatUIMessage()`

---

## Main APIs

### `@toon-ui/core`

- `createToonProtocol()`
- `createToonCoreRuntime()`
- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `formatReplyMessage()`
- `formatSubmitMessage()`
- `createChatMessage()`
- `createChatUIMessage()`

### `@toon-ui/react`

- `createToonReactRuntime()`
- `ToonMessage`
- `ToonRenderer`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `useToonAction()`
- `basicPreset()`

### `@toon-ui/toon-ui`

- `createToonRuntime()`
- all public exports from core
- all public exports from react

---

## Common mistakes

### Mistake 1: showing protocol payloads to the user

Wrong:

```tsx
<pre>{content}</pre>
```

when `content` is the raw `ui_submit`.

Correct:

```tsx
<pre>{message.metadata?.displayContent ?? content}</pre>
```

### Mistake 2: using the client runtime on the server

Wrong:

```ts
import { createToonRuntime } from '@toon-ui/toon-ui';
```

Correct:

```ts
import { createToonProtocol } from '@toon-ui/core';
```

### Mistake 3: expecting ToonUI to execute business actions

Wrong mental model:

> “User submitted the form, so ToonUI should create the customer.”

Correct mental model:

> ToonUI sends structured user intent back into the chat loop. Your app decides whether a tool should run.

---

## Documentation map

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

## Version 1.1.0

This release line clarifies the naming and interaction boundary:

- `createToonProtocol()` for server usage
- `createToonRuntime()` for client usage
- `createToonReactRuntime()` for advanced React setups
- `createToonCoreRuntime()` for low-level core runtime usage
- `createChatUIMessage()` for `useChat`-style integrations
