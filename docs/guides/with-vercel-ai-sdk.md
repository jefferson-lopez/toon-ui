# Using ToonUI with Vercel AI SDK

This is the recommended starter integration for React and Next.js apps.

It is NOT the only valid integration.

Use this guide when:

- your host app already uses React or Next.js
- you want a fast path with `useChat`
- you want a practical reference integration

Do NOT read this as “ToonUI requires Vercel AI SDK”. It does not.

## Quick path

1. Server: `createToonProtocol({ components })`.
2. Client: `createToonReactRuntime({ components })`.
3. Host renders markdown with its own renderer.
4. ToonUI renders only `toon-ui` blocks.
5. Reinject interactions with `toon.messages.toUIMessage(payload)`.

## What each layer owns

| Layer | Responsibility |
|---|---|
| ToonUI | prompt protocol, parser, validation, UI runtime |
| Vercel AI SDK | chat state, transport helpers, model loop ergonomics |
| Your app | tools, persistence, business logic, authorization |

This separation matters. ToonUI teaches the model how to write UI, but your host app still decides what the assistant can do.

## Server

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'card', 'form', 'field', 'button', 'table'],
});
const system = [toon.prompt, 'Available tools:', '- searchProducts(query)'].join('

');
```

## Client

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { MessageResponse } from '@ai-sdk/ui';
import { ToonRenderer, createToonReactRuntime, extractToonMarkdown } from '@toon-ui/react';

const toon = createToonReactRuntime({
  components: {
    text: TextComponent,
    card: CardComponent,
    form: FormComponent,
    field: FieldComponent,
    button: ButtonComponent,
    table: TableComponent,
  },
});

export function AssistantChat() {
  const { messages, setMessages } = useChat();

  return messages.map((message) => {
    const content = message.parts
      .filter((part) => part.type === 'text')
      .map((part) => part.text ?? '')
      .join('

');

    if (message.role !== 'assistant') {
      return <pre key={message.id}>{message.metadata?.displayContent ?? content}</pre>;
    }

    return (
      <div key={message.id}>
        <MessageResponse>{extractToonMarkdown(content)}</MessageResponse>
        <ToonRenderer
          content={content}
          runtime={toon}
          onReply={(payload) => setMessages((current) => [...current, toon.messages.toUIMessage(payload)])}
          onSubmit={(payload) => setMessages((current) => [...current, toon.messages.toUIMessage(payload)])}
        />
      </div>
    );
  });
}
```

## Preferred APIs

- `toon.messages.toUIMessage(payload)` for `useChat`
- `toon.messages.toModelMessage(payload)` for custom host state
- `toon.events.*` if you need to manufacture events manually

## When to choose something else

Do NOT force Vercel AI SDK if:

- you already have a custom chat transport
- you use another SDK or direct API calls
- you want framework-agnostic orchestration

In those cases, keep ToonUI and replace only the host chat loop.

## Avoid

- rendering raw protocol text to users
- using `createToonReactRuntime()` on the server
