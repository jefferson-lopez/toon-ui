# Using ToonUI with Vercel AI SDK

This guide shows the complete mental model for integrating ToonUI with `useChat` / `streamText`.

## The correct split

- server uses `@toon-ui/core`
- client uses `@toon-ui/toon-ui`
- your app owns tool execution and persistence
- ToonUI owns UI grammar, rendering, and interaction payloads

---

## Quick path

1. Build a server protocol with `createToonProtocol()`.
2. Add `toon.prompt` to your system prompt.
3. Render assistant responses with `ToonMessage`.
4. Convert interactions with `toon.createChatUIMessage(payload)`.
5. Show `metadata.displayContent` to the human, not raw protocol text.

---

## Install

```bash
pnpm add ai @ai-sdk/openai @toon-ui/core @toon-ui/toon-ui react react-dom
```

---

## 1. Server

Use `createToonProtocol()` on the server.

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
  '- createCustomer(name, email, phone)',
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
      createCustomer: async ({ name, email, phone }) => ({ ok: true, name, email, phone }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Why this matters

The model needs two kinds of knowledge:

1. **How to emit valid ToonUI** -> `toon.prompt`
2. **What backend capabilities exist** -> your tool instructions

Those are related, but they are NOT the same concern.

---

## 2. Client

Use `createToonRuntime()` on the client.

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { MessageResponse } from '@ai-sdk/ui';
import { createToonRuntime, extractToonMarkdown, ToonRenderer } from '@toon-ui/toon-ui';

const toon = createToonRuntime();

export function AssistantChat() {
  const { messages, setMessages, sendMessage } = useChat();

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
              <>
                <MessageResponse>{extractToonMarkdown(content)}</MessageResponse>
                <ToonRenderer
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
              </>
            ) : (
              <pre>{message.metadata?.displayContent ?? content}</pre>
            )}
          </div>
        );
      })}

      <button onClick={() => sendMessage({ text: 'agregar cliente' })}>
        Probar
      </button>
    </div>
  );
}
```

---

## 3. Why host-first markdown rendering is better here

With Vercel AI SDK, the host chat layer already knows how to render streamed message parts.

So the clean split is:

- host owns markdown rendering
- ToonUI owns only the `toon-ui` blocks

That is why this guide uses:

```tsx
<MessageResponse>{extractToonMarkdown(content)}</MessageResponse>
<ToonRenderer content={content} runtime={toon} />
```

You can still use `ToonMessage` for fast demos or simple apps, but host-first rendering is the better default for a production chat host.

---

## 4. Why `createChatUIMessage()` matters

This helper exists for one reason:

`useChat` wants `UIMessage`-style objects, but ToonUI needs to preserve:

- **model-facing content**
- **human-facing display content**

When you do:

```ts
toon.createChatUIMessage(payload)
```

you get:

- `parts[0].text` -> raw structured content for the model
- `metadata.displayContent` -> safe readable content for the human

That avoids the classic bug where the user sees:

```txt
ui_submit:
  eventId: ...
  intent: ...
  ...
```

instead of a readable summary.

---

## 5. `createChatMessage()` vs `createChatUIMessage()`

## Use `createChatMessage()` when:

- your app has its own host message shape
- you do not rely on `UIMessage`
- you want direct access to `content` and `displayContent`

```ts
const message = toon.createChatMessage(payload);

hostMessages.push({
  id: crypto.randomUUID(),
  role: message.role,
  content: message.content,
  displayContent: message.displayContent,
});
```

## Use `createChatUIMessage()` when:

- your app uses `useChat`
- your app uses a `UIMessage`-like structure
- you want the split already mapped correctly

```ts
setMessages((current) => [
  ...current,
  toon.createChatUIMessage(payload),
]);
```

---

## 6. Example: customer creation flow

### User asks

```txt
crea un formulario para un cliente
```

### Assistant responds

```toon-ui
form "Agregar cliente":
  field name text "Nombre" required
  field email email "Email" required
  field phone text "Teléfono" required
  button primary "Agregar cliente" submit
```

### User submits

ToonUI emits a payload like:

```txt
ui_submit:
  eventId: submit_9p245eo7
  intent: agregar_cliente
  formTitle: Agregar cliente
  name: "Jefferson Lopez Mendoza"
  email: "jeffersonlopezmendoza343@gmail.com"
  phone: "4157145953"
```

### Model should receive

That exact structured content.

### Human should see

```txt
Agregar cliente
name: Jefferson Lopez Mendoza
email: jeffersonlopezmendoza343@gmail.com
phone: 4157145953
```

### Correct state update

```ts
setMessages((current) => [
  ...current,
  toon.createChatUIMessage(payload),
]);
```

### Correct render for user messages

```tsx
<pre>{message.metadata?.displayContent ?? content}</pre>
```

---

## 7. Common mistakes

## Mistake 1: rendering raw protocol text for humans

Wrong:

```tsx
<pre>{content}</pre>
```

for user messages produced from Toon interactions.

Correct:

```tsx
<pre>{message.metadata?.displayContent ?? content}</pre>
```

## Mistake 2: putting `createToonRuntime()` on the server

Wrong:

```ts
import { createToonRuntime } from '@toon-ui/toon-ui';
```

Correct:

```ts
import { createToonProtocol } from '@toon-ui/core';
```

## Mistake 3: expecting ToonUI to execute tools

Wrong idea:

> The user submitted the form, so ToonUI should create the customer.

Correct idea:

> ToonUI sends structured user intent back into the conversation. Your app or model decides whether a tool should run.

---

## 7. Boundary checklist

Before shipping, verify:

- [ ] server uses `createToonProtocol()`
- [ ] client uses `createToonRuntime()`
- [ ] assistant messages render with `ToonMessage`
- [ ] `onReply` and `onSubmit` feed back into chat state
- [ ] human sees `displayContent`
- [ ] model receives structured `content`
- [ ] tools stay in the host app

---

## 8. Related docs

- `README.md`
- `packages/core/README.md`
- `packages/react/README.md`
- `packages/toon-ui/README.md`
- `docs/architecture/05-interaction-protocol.md`
