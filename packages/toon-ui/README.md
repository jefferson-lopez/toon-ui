# @toon-ui/toon-ui

`@toon-ui/toon-ui` is the main client package for ToonUI.

Use it when you want the simplest React integration:

- default adapter included
- one public entrypoint for client work
- direct access to the core protocol APIs
- easy rendering of mixed markdown + `toon-ui` responses

If `@toon-ui/core` teaches the model how to WRITE ToonUI, `@toon-ui/toon-ui` helps your app RENDER it and send user interactions back into the chat loop.

## Quick path

1. Build the server prompt with `createToonProtocol()` from `@toon-ui/core`.
2. Create a client runtime with `createToonClient()`.
3. Render assistant output with `ToonMessage` or `ToonRenderer`.
4. Reinject button/form interactions with `toon.messages.toUIMessage(payload)` or `toon.messages.toModelMessage(payload)`.

## Install

In a React host app:

```bash
pnpm add @toon-ui/core @toon-ui/toon-ui
```

Do NOT force `react` or `react-dom` in this command.

Those dependencies belong to the host app and should stay versioned there.

## What this package includes

`@toon-ui/toon-ui` re-exports:

- the public protocol APIs from `@toon-ui/core`
- the public React rendering APIs from `@toon-ui/react`
- a default client runtime creator: `createToonClient()`
- a default adapter alias: `createToonAdapter()`

That means you get a practical “batteries included” client package without losing access to lower-level APIs.

## When to use this package

Use `@toon-ui/toon-ui` when:

- you want the fastest happy path
- you are already in React or Next.js
- you want default rendering behavior first
- you may override only a few components later
- you want one import surface for most client work

Use `@toon-ui/react` instead when:

- you want to own the adapter explicitly from day one
- you are integrating a real design system
- you want stricter control over slot coverage
- you want the React runtime layer without the “main package” abstraction

Use `@toon-ui/core` only when:

- you need just the prompt, parser, validation, catalog, or event/message helpers
- you are working on the server side only
- you are not rendering ToonUI in React

## Mental model

Teach THIS first:

- `toon.prompt` -> teaches the LLM how to write ToonUI
- `toon.catalog` -> defines what the language supports
- `toon.events` -> creates structured interaction payloads
- `toon.messages` -> converts payloads back into chat-friendly messages
- `ToonMessage` -> renders markdown + ToonUI together
- `ToonRenderer` -> renders only ToonUI blocks

The most important boundary is this:

- the model emits ToonUI
- your app renders ToonUI
- your app owns tools, business logic, persistence, and transport

## Main exports

### Runtime creation

- `createToonClient()`
- `createToonAdapter()`

### Rendering

- `ToonMessage`
- `ToonRenderer`
- `extractToonMarkdown`

### Protocol helpers re-exported from core

- `createToonProtocol()`
- `createToonCatalog()`
- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `toon.events.*`
- `toon.messages.*`

### React helper utilities re-exported from react

- `getToonButtonProps()`
- `getToonInputProps()`
- `getToonTextareaProps()`
- `getToonCheckboxProps()`
- adapter/runtime types

## The default client runtime

`createToonClient()` builds a ToonUI runtime using the default adapter unless you provide your own.

```tsx
import { createToonClient } from '@toon-ui/toon-ui';

const toon = createToonClient();
```

Conceptually, this is equivalent to:

```tsx
const toon = createToonClient({
  adapter: createToonAdapter({ level: 'default' }),
});
```

So the package gives you a safe default without hiding the underlying adapter model.

## End-to-end happy path

### 1) Server: teach the model ToonUI

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol();

const system = [
  toon.prompt,
  'You are helping users compare products.',
  'Use ToonUI when structured UI reduces friction.',
  'Available tools:',
  '- searchProducts(query)',
].join('\n\n');
```

`toon.prompt` is the important part here. It teaches the model:

- how ToonUI is written
- which components are valid
- which patterns are invalid
- when UI is preferable to plain prose

### 2) Client: render assistant output

```tsx
'use client';

import { ToonMessage, createToonClient } from '@toon-ui/toon-ui';

const toon = createToonClient();

export function AssistantMessage({
  content,
  append,
}: {
  content: string;
  append: (message: unknown) => void;
}) {
  return (
    <ToonMessage
      content={content}
      runtime={toon}
      onReply={(payload) => append(toon.messages.toUIMessage(payload))}
      onSubmit={(payload) => append(toon.messages.toUIMessage(payload))}
    />
  );
}
```

This gives you:

- normal markdown rendering
- ToonUI block rendering
- automatic conversion of user interactions into chat messages

## `ToonMessage` vs `ToonRenderer`

Use `ToonMessage` when the assistant output mixes:

- markdown
- one or more ```toon-ui blocks

Use `ToonRenderer` when you want to render ONLY the ToonUI blocks and handle markdown somewhere else.

### `ToonMessage`

`ToonMessage` does two jobs:

1. strips ToonUI blocks from the markdown view
2. renders markdown and ToonUI blocks in the SAME order they appeared in the original assistant message

That makes it the best default for chat apps.

```tsx
<ToonMessage
  content={content}
  runtime={toon}
  onReply={handleReply}
  onSubmit={handleSubmit}
  renderError={({ message }) => <MyAlert tone="danger">{message}</MyAlert>}
/>
```

### `ToonRenderer`

Use `ToonRenderer` when:

- markdown is already rendered by your host app
- you want finer layout control
- you want only the interactive ToonUI portion

```tsx
<ToonRenderer
  content={content}
  runtime={toon}
  onReply={handleReply}
  onSubmit={handleSubmit}
  showErrorDetails={false}
/>
```

Both renderers also support:

- `renderError(error)` for host-controlled fallback UI when a ToonUI block fails
- `showErrorDetails` for optional parser/validator details in debug scenarios

## Extracting markdown only

If your host already has a markdown renderer, use `extractToonMarkdown(content)` to remove the `toon-ui` blocks first.

```tsx
import { extractToonMarkdown } from '@toon-ui/toon-ui';

const markdown = extractToonMarkdown(content);
```

This is useful when you want a split layout:

- markdown rendered by your host
- ToonUI rendered separately

## Interaction reinjection

ToonUI never executes business actions directly.

Instead, buttons and forms emit structured payloads such as:

- `ui_reply`
- `ui_submit`

Your app decides what to do with them next.

### For UI/chat state

Use `toon.messages.toUIMessage(payload)` when your chat store expects UI-shaped messages.

```tsx
onReply={(payload) => {
  const message = toon.messages.toUIMessage(payload);
  setMessages((current) => [...current, message]);
}}
```

### For model/chat loop state

Use `toon.messages.toModelMessage(payload)` when your host loop stores model-friendly messages.

```tsx
onSubmit={(payload) => {
  const message = toon.messages.toModelMessage(payload);
  appendModelMessage(message);
}}
```

## Partial customization

The runtime exposes the resolved adapter on `toon.adapter`.

That matters because you can:

- inspect what was registered
- see which slots are still missing
- start with defaults and override only a few pieces

```tsx
import {
  createToonAdapter,
  createToonClient,
  getToonButtonProps,
  type ToonButtonComponentProps,
} from '@toon-ui/toon-ui';

function MyButton(props: ToonButtonComponentProps) {
  return <button {...getToonButtonProps(props)}>{props.node.label}</button>;
}

const adapter = createToonAdapter({
  level: 'default',
  components: {
    button: MyButton,
  },
});

const toon = createToonClient({ adapter });
```

## Adapter levels

Use adapter levels intentionally:

- `default` -> keep ToonUI defaults and override selected components
- `minimal` -> render only what you explicitly register
- `strict` -> require full adapter coverage

Use `strict` when your design system must own every slot before runtime.

## Common patterns

### Simple chat message rendering

```tsx
<ToonMessage
  content={content}
  runtime={toon}
  onReply={(payload) => append(toon.messages.toUIMessage(payload))}
  onSubmit={(payload) => append(toon.messages.toUIMessage(payload))}
/>
```

### Host-controlled markdown + ToonUI split

```tsx
import { ToonRenderer, extractToonMarkdown } from '@toon-ui/toon-ui';

const markdown = extractToonMarkdown(content);

return (
  <>
    <Markdown>{markdown}</Markdown>
    <ToonRenderer
      content={content}
      runtime={toon}
      onReply={handleReply}
      onSubmit={handleSubmit}
    />
  </>
);
```

### Read-only rendering

Set `interactive={false}` when you want to display the UI without allowing interaction.

```tsx
<ToonMessage content={content} runtime={toon} interactive={false} />
```

## Common mistakes

Avoid these:

- using `createToonClient()` on the server
- forcing `react` or `react-dom` into the install command
- rendering raw protocol text to end users
- assuming ToonUI owns tool execution
- skipping reinjection of reply/submit payloads into the host chat loop
- using `@toon-ui/toon-ui` when you really need full explicit adapter ownership from the start

## Package choice cheat sheet

| Need | Package |
|---|---|
| Teach the model ToonUI on the server | `@toon-ui/core` |
| Render ToonUI with the easiest React path | `@toon-ui/toon-ui` |
| Own the React adapter contract explicitly | `@toon-ui/react` |
| Generate prompt fragments only | `@toon-ui/prompts` |

## Next steps

- Need the protocol layer? Read `packages/core/README.md`
- Need explicit adapter ownership? Read `packages/react/README.md`
- Need the recommended React/Next.js host path? Read `docs/guides/with-vercel-ai-sdk.md`
