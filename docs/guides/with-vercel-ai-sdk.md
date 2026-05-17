# Using ToonUI with Vercel AI SDK

This is the minimum correct integration:

- server uses `@toon-ui/core`
- client uses `@toon-ui/toon-ui`
- the host app keeps ownership of tools, transport, persistence, and message state

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

---

## 2. Client

Use `createToonRuntime()` on the client.

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { createToonRuntime, ToonMessage } from '@toon-ui/toon-ui';

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

      <button onClick={() => sendMessage({ text: 'crear producto' })}>
        Probar
      </button>
    </div>
  );
}
```

---

## 3. Flow

```txt
User sends text
-> server sends messages + toon.prompt to the model
-> assistant returns markdown + optional toon-ui blocks
-> client renders with ToonMessage
-> user clicks/submits
-> ToonUI emits structured payload
-> toon.createChatMessage(payload)
-> host app sends structured content back to the model
-> model decides whether to call a tool
```

---

## 4. Boundary

ToonUI owns:

- UI protocol
- prompt rules
- structured interaction payloads
- rendering

Important:

- the model should receive `content`
- the human should see `displayContent`
- `createChatUIMessage()` helps preserve that split when using `useChat`

Your app owns:

- tools
- persistence
- auth
- business actions
- chat transport
