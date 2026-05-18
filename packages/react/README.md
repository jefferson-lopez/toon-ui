# @toon-ui/react

`@toon-ui/react` is the explicit React runtime for ToonUI.

Use this package when you want FULL control over the React component registry instead of relying on the convenience preset package.

---

## Quick path

1. Use `createToonProtocol()` from `@toon-ui/core` on the server.
2. Use `createToonReactRuntime()` from `@toon-ui/react` on the client.
3. Render assistant content with `ToonMessage`.
4. Handle `onReply` and `onSubmit`.
5. Convert interaction payloads back into chat-ready messages with `runtime.createChatMessage(payload)`.

---

## Install

```bash
pnpm add @toon-ui/core @toon-ui/react react react-dom
```

---

## Recommended architecture

```txt
Server
  @toon-ui/core
  -> createToonProtocol()
  -> toon.prompt

Client
  @toon-ui/react
  -> createToonReactRuntime()
  -> ToonMessage / ToonRenderer
  -> onReply / onSubmit
```

`@toon-ui/react` is the CLIENT rendering layer.

It is NOT the server protocol layer.

---

## Main exports

- `createToonReactRuntime()`
- `ToonMessage`
- `ToonRenderer`
- `extractToonMarkdown`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `useToonAction()`
- `basicPreset()`

---

## Server integration

The server should use `@toon-ui/core`, not `@toon-ui/react`.

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

Why not `@toon-ui/react` on the server?

Because the server needs:

- protocol
- prompts
- formatters
- validation

It does NOT need React rendering state.

---

## Frontend integration

This is the primary use case.

```tsx
import {
  ToonMessage,
  basicPreset,
  createToonReactRuntime,
} from '@toon-ui/react';

const runtime = createToonReactRuntime({
  components: {
    ...basicPreset(),
  },
});

export function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={runtime}
      onReply={(payload) => {
        const message = runtime.createChatMessage(payload);
        console.log(message.content);
      }}
      onSubmit={(payload) => {
        const message = runtime.createChatMessage(payload);
        console.log(message.content);
      }}
    />
  );
}
```

---

## Runtime creation

## `createToonReactRuntime()`

Creates the React runtime with your component registry.

### Use it when

- you want explicit runtime construction
- you want to override components
- you do NOT want the convenience wrapper package

### Example

```tsx
import { basicPreset, createToonReactRuntime } from '@toon-ui/react';

const runtime = createToonReactRuntime({
  components: {
    ...basicPreset(),
  },
});
```

### Important

This runtime also includes everything inherited from the core runtime:

- `prompt`
- `rules`
- `parse`
- `validate`
- `extractBlocks`
- `formatReplyMessage`
- `formatSubmitMessage`
- `createChatMessage`

---

## Rendering components

## `ToonMessage`

High-level renderer for a COMPLETE assistant message.

It:

- keeps normal markdown text
- extracts `toon-ui` blocks
- renders text + UI in one component
- defaults to `ReactMarkdown`, but lets the host replace markdown rendering

### Use it when

You have an assistant message string that may contain both:

- plain text
- one or more `toon-ui` blocks

### Props

- `content: string`
- `runtime: ToonReactRuntime`
- `onReply?: (payload: ToonReplyPayload) => void`
- `onSubmit?: (payload: ToonSubmitPayload) => void`
- `renderMarkdown?: (markdown: string) => React.ReactNode`

### Example

```tsx
<ToonMessage
  content={message.content}
  runtime={runtime}
  renderMarkdown={(markdown) => <MyHostMarkdown>{markdown}</MyHostMarkdown>}
  onReply={(payload) => console.log(payload)}
  onSubmit={(payload) => console.log(payload)}
/>
```

### When NOT to use it

If you already separated the ToonUI block yourself and only want to render the structured UI, use `ToonRenderer`.

### Compatibility note

If you do not pass `renderMarkdown`, `ToonMessage` keeps the existing behavior and renders markdown with `ReactMarkdown`.

---

## `ToonRenderer`

Low-level renderer for ONLY the ToonUI blocks inside a string.

It does NOT render surrounding markdown.

### Use it when

- your host app already renders markdown separately
- you want ToonUI to handle only the structured UI section

### Props

- `content: string`
- `runtime: ToonReactRuntime`
- `onReply?: (payload: ToonReplyPayload) => void`
- `onSubmit?: (payload: ToonSubmitPayload) => void`

### Example

```tsx
<ToonRenderer
  content={toonBlockContent}
  runtime={runtime}
  onReply={(payload) => console.log(payload)}
  onSubmit={(payload) => console.log(payload)}
/>
```

### Difference vs `ToonMessage`

- `ToonMessage` = full message
- `ToonRenderer` = only ToonUI UI rendering

---

## `extractToonMarkdown`

Helper for host-first integrations.

It strips every ```toon-ui block and returns only the surrounding markdown text.

### Example

```tsx
const markdown = extractToonMarkdown(message.content);

return (
  <>
    <MessageResponse>{markdown}</MessageResponse>
    <ToonRenderer
      content={message.content}
      runtime={runtime}
      onReply={handleReply}
      onSubmit={handleSubmit}
    />
  </>
);
```

This is the recommended path when the chat host should own markdown rendering.

---

## Context layer

## `ToonProvider`

Provides the Toon runtime and form/action context to the React tree.

Internally it manages:

- current runtime
- form field state
- `sendReply`
- `submitForm`

### Use it when

- you are building custom Toon trees manually
- you want direct access to Toon hooks in your own component subtree

### Example

```tsx
<ToonProvider runtime={runtime} onReply={handleReply} onSubmit={handleSubmit}>
  <MyCustomTree />
</ToonProvider>
```

### Important

You usually do NOT need to mount this directly if you already use:

- `ToonMessage`
- `ToonRenderer`

Those components already create the provider internally.

---

## Hooks

## `useToonUI()`

Returns the active Toon runtime from context.

### Use it when

- you need access to runtime helpers inside a child component
- you need parsing, validation, or formatter helpers from context

### Example

```tsx
function RuntimeDebug() {
  const runtime = useToonUI();
  return <pre>{runtime.prompt}</pre>;
}
```

### Requirement

Must be used inside `ToonProvider`.

---

## `useToonReply()`

Returns the `sendReply(payload)` function from context.

### Use it when

- you are building a custom component
- you want to emit a `ui_reply` manually

### Example

```tsx
function ReplyExample({ payload }: { payload: any }) {
  const sendReply = useToonReply();

  return <button onClick={() => sendReply(payload)}>Enviar reply</button>;
}
```

### Requirement

Must be used inside `ToonProvider`.

---

## `useToonSubmit()`

Returns the `submitForm(form)` function from context.

### Use it when

- you are building custom submit controls
- you want to trigger submit for a specific `FormNode`

### Example

```tsx
function SubmitExample({ form }: { form: any }) {
  const submitForm = useToonSubmit();

  return <button onClick={() => submitForm(form)}>Enviar</button>;
}
```

### Requirement

Must be used inside `ToonProvider`.

---

## `useToonAction()`

Returns protocol formatter helpers from the runtime context.

Current return shape:

```ts
{
  formatSubmitMessage,
  formatReplyMessage
}
```

### Use it when

- you want formatter access inside React components
- you do NOT need the whole runtime object

### Example

```tsx
function FormatterPreview() {
  const { formatReplyMessage } = useToonAction();

  return <pre>{formatReplyMessage('Sí, elimínalo')}</pre>;
}
```

### Important

`useToonAction()` does NOT dispatch actions by itself.

It currently exposes formatter helpers only.

---

## Preset

## `basicPreset()`

Returns the built-in neutral React component registry.

It includes default implementations for:

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

- you want a working default UI immediately
- you want to override only some components

### Example

```tsx
import { basicPreset, createToonReactRuntime } from '@toon-ui/react';

const runtime = createToonReactRuntime({
  components: {
    ...basicPreset(),
    button: MyButton,
    field: MyField,
  },
});
```

### What it is NOT

It is NOT a full design system.

It is a functional baseline so ToonUI works out of the box.

---

## Full custom registry example

```tsx
import {
  ToonMessage,
  basicPreset,
  createToonReactRuntime,
} from '@toon-ui/react';

function AppButton({ node, sendReply, submitForm }: any) {
  return (
    <button
      className="rounded-md border px-3 py-2"
      onClick={() =>
        node.action.kind === 'reply'
          ? sendReply(node.action.value)
          : submitForm()
      }
    >
      {node.label}
    </button>
  );
}

function AppField({ node, value, onChange }: any) {
  return (
    <label className="grid gap-2">
      <span>{node.label}</span>
      <input
        value={value ?? ''}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </label>
  );
}

const runtime = createToonReactRuntime({
  components: {
    ...basicPreset(),
    button: AppButton,
    field: AppField,
  },
});

export function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={runtime}
      onReply={(payload) => {
        const message = runtime.createChatMessage(payload);
        console.log(message);
      }}
      onSubmit={(payload) => {
        const message = runtime.createChatMessage(payload);
        console.log(message);
      }}
    />
  );
}
```

---

## Boundary

`@toon-ui/react` owns:

- AST traversal into React nodes
- registry-based rendering
- form state handling
- interaction surfacing in React

It does NOT own:

- server prompts
- backend tools
- persistence
- model orchestration
- business actions
