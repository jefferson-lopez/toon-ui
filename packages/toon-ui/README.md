# @toon-ui/toon-ui

`@toon-ui/toon-ui` is the main public package for ToonUI.

Use it when you want the easiest client integration with a built-in preset, while still keeping the clean server/client split:

- `@toon-ui/core` on the server
- `@toon-ui/toon-ui` on the client

---

## Quick path

1. Use `createToonProtocol()` from `@toon-ui/core` on the server.
2. Use `createToonRuntime()` from `@toon-ui/toon-ui` on the client.
3. Render assistant output with `ToonMessage`.
4. Handle `onReply` and `onSubmit`.
5. Convert payloads with `toon.createChatMessage(payload)`.

---

## Install

```bash
pnpm add @toon-ui/core @toon-ui/toon-ui react react-dom
```

---

## Why this package exists

`@toon-ui/toon-ui` is the convenience layer.

It gives you:

- the core exports
- the React exports
- a built-in neutral preset automatically merged
- a clearer client-side runtime name: `createToonRuntime()`

So instead of wiring `basicPreset()` manually, you can move faster.

---

## Main exports

- `createToonRuntime()`
- `ToonMessage`
- `ToonRenderer`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `useToonAction()`
- `basicPreset()`
- all public exports from `@toon-ui/core`

---

## Server integration

Do NOT use `createToonRuntime()` on the server.

The correct server package is `@toon-ui/core`.

```ts
import { createToonProtocol } from '@toon-ui/core';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

const toon = createToonProtocol();

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4.1'),
    system: [
      toon.prompt,
      'Available tools:',
      '- searchProducts(query)',
      '- createProduct(name, price, stock)',
    ].join('\n\n'),
    messages,
    tools: {
      searchProducts: async ({ query }) => ({ ok: true, query }),
      createProduct: async ({ name, price, stock }) => ({ ok: true, name, price, stock }),
    },
  });

  return result.toUIMessageStreamResponse();
}
```

### Why not use this package on the server?

Because the server needs protocol, not a React preset.

The split is intentional:

- `createToonProtocol()` = server
- `createToonRuntime()` = client

---

## Frontend integration

This is the primary use case.

```tsx
'use client';

import { createToonRuntime, ToonMessage } from '@toon-ui/toon-ui';

const toon = createToonRuntime();

export function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={toon}
      onReply={(payload) => {
        const message = toon.createChatMessage(payload);
        console.log(message.content);
      }}
      onSubmit={(payload) => {
        const message = toon.createChatMessage(payload);
        console.log(message.content);
      }}
    />
  );
}
```

---

## Runtime creation

## `createToonRuntime()`

Creates the client runtime with the built-in `basicPreset()` already merged.

### Use it when

- you want the easiest public API
- you want default components without manual registry setup
- you want to override only some components

### Example

```tsx
import { createToonRuntime } from '@toon-ui/toon-ui';

const toon = createToonRuntime();
```

### Partial override example

```tsx
import { createToonRuntime } from '@toon-ui/toon-ui';

function MyButton(props: any) {
  return <button className="rounded-md border px-3 py-2" {...props} />;
}

const toon = createToonRuntime({
  components: {
    button: MyButton,
  },
});
```

Everything you do NOT override still falls back to the default preset.

---

## Rendering exports

## `ToonMessage`

High-level renderer for a full assistant message.

It:

- keeps normal text
- extracts ToonUI blocks
- renders both together

### Use it when

Your assistant message contains markdown plus optional ToonUI blocks.

### Props

- `content: string`
- `runtime: ToonReactRuntime`
- `onReply?: (payload) => void`
- `onSubmit?: (payload) => void`

### Example

```tsx
<ToonMessage
  content={message.content}
  runtime={toon}
  onReply={(payload) => console.log(payload)}
  onSubmit={(payload) => console.log(payload)}
/>
```

---

## `ToonRenderer`

Low-level renderer for only the structured ToonUI blocks.

### Use it when

- markdown is rendered elsewhere
- you want ToonUI only for the UI block section

### Example

```tsx
<ToonRenderer
  content={toonOnlyContent}
  runtime={toon}
  onReply={(payload) => console.log(payload)}
  onSubmit={(payload) => console.log(payload)}
/>
```

### Difference vs `ToonMessage`

- `ToonMessage` = full assistant message
- `ToonRenderer` = only ToonUI rendering

---

## `ToonProvider`

The React context provider for ToonUI runtime and form/action state.

### Use it when

- you are composing advanced custom trees manually
- you want to use Toon hooks inside your own nested components

### Example

```tsx
<ToonProvider runtime={toon} onReply={handleReply} onSubmit={handleSubmit}>
  <CustomToonTree />
</ToonProvider>
```

### Important

You usually do NOT need to use this directly because `ToonMessage` and `ToonRenderer` already wrap it internally.

---

## Hooks

## `useToonUI()`

Returns the active runtime from context.

### Use it when

- you need runtime helpers from inside a child component

### Example

```tsx
function RuntimeDebug() {
  const runtime = useToonUI();
  return <pre>{runtime.prompt}</pre>;
}
```

---

## `useToonReply()`

Returns the `sendReply(payload)` function from context.

### Use it when

- you are building a custom component that should emit `ui_reply`

### Example

```tsx
function ReplyButton({ payload }: { payload: any }) {
  const sendReply = useToonReply();
  return <button onClick={() => sendReply(payload)}>Reply</button>;
}
```

---

## `useToonSubmit()`

Returns the `submitForm(form)` function from context.

### Use it when

- you are creating a custom submit control

### Example

```tsx
function SubmitButton({ form }: { form: any }) {
  const submitForm = useToonSubmit();
  return <button onClick={() => submitForm(form)}>Submit</button>;
}
```

---

## `useToonAction()`

Returns formatter helpers from the runtime context.

Current shape:

```ts
{
  formatSubmitMessage,
  formatReplyMessage
}
```

### Use it when

- you want protocol formatter helpers inside React components

### Example

```tsx
function Preview() {
  const { formatReplyMessage } = useToonAction();
  return <pre>{formatReplyMessage('Sí, elimínalo')}</pre>;
}
```

### Important

Despite the name, it currently exposes formatter helpers, not a full action dispatcher.

---

## `basicPreset()`

Returns the built-in neutral component registry.

It includes working defaults for:

- `text`
- `badge`
- `button`
- `field`
- `card`
- `confirm`
- `form`
- `item`
- `list`
- `alert`
- `table`

### Use it when

- you want a working UI immediately
- you want to override only some components

### Example

```tsx
import { basicPreset } from '@toon-ui/toon-ui';

const preset = basicPreset();
```

In this package you usually do NOT need it directly because `createToonRuntime()` already merges it for you.

You use it directly only if you want to inspect or reuse the preset explicitly.

---

## Full frontend chat example

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
        Probar flujo
      </button>
    </div>
  );
}
```

---

## Naming

Use:

- `createToonProtocol()` on the server
- `createToonRuntime()` on the client
- `createToonCoreRuntime()` only for low-level core usage

---

## Boundary

`@toon-ui/toon-ui` is the convenience client package.

It does NOT replace:

- your server
- your tools
- your persistence
- your chat SDK

It gives you:

- a ready-to-use client runtime
- default components
- React rendering
- core protocol helpers re-exported in one place
