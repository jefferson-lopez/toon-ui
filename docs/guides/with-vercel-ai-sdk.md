# Using ToonUI with Vercel AI SDK

This is the recommended host-first integration.

## Quick path

1. Server: `createToonProtocol()`.
2. Client: `createToonClient()`.
3. Host renders markdown with its own renderer.
4. ToonUI renders only `toon-ui` blocks.
5. Reinject interactions with `toon.messages.toUIMessage(payload)`.

## Server

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol();
const system = [toon.prompt, 'Available tools:', '- searchProducts(query)'].join('

');
```

## Client

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { MessageResponse } from '@ai-sdk/ui';
import { ToonRenderer, createToonClient, extractToonMarkdown } from '@toon-ui/toon-ui';

const toon = createToonClient();

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

## Avoid

- rendering raw protocol text to users
- using `createToonClient()` on the server
