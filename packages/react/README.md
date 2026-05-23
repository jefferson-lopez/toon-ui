# @toon-ui/react

React rendering utilities for ToonUI.

Use `@toon-ui/react` when your app receives assistant markdown with fenced `toon-ui` blocks and you want to render them with your own React components. The package does not ship a production design system or default preset. You register the components your app supports.

## Install

```bash
pnpm add @toon-ui/core @toon-ui/react
```

Use `@toon-ui/core` on the server to generate the catalog-aware prompt. Use `@toon-ui/react` on the client to render the model output.

## Quick start

```tsx
'use client';

import {
  ToonMessage,
  createToonReactRuntime,
  getToonButtonProps,
  type ToonButtonComponentProps,
  type ToonTextComponentProps,
} from '@toon-ui/react';

function TextComponent({ node }: ToonTextComponentProps) {
  return <p>{node.value}</p>;
}

function ButtonComponent(props: ToonButtonComponentProps) {
  return <button {...getToonButtonProps(props)}>{props.node.label}</button>;
}

const toon = createToonReactRuntime({
  components: {
    text: TextComponent,
    button: ButtonComponent,
  },
});

export function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={toon}
      onReply={(payload) => {
        sendToChat(toon.messages.toUIMessage(payload));
      }}
      onSubmit={(payload) => {
        sendToChat(toon.messages.toUIMessage(payload));
      }}
    />
  );
}
```

## Mental model

1. Server creates `toon.prompt` with `@toon-ui/core` from the enabled catalog.
2. The model returns normal markdown plus optional fenced `toon-ui` blocks.
3. React renders only the standard components you registered in the runtime.
4. Buttons/forms emit typed payloads that you reinject into your chat state.

## Registering components

```tsx
import { createToonReactRuntime } from '@toon-ui/react';

const toon = createToonReactRuntime({
  components: {
    text: TextComponent,
    card: CardComponent,
    form: FormComponent,
    field: FieldComponent,
    button: ButtonComponent,
    confirm: ConfirmComponent,
  },
});
```

The React runtime creates its catalog from the registered component keys. If a model emits a component you did not register, ToonUI renders an error instead of inventing UI.

## Adapter coverage

Use an explicit adapter when you want to inspect or enforce coverage.

```tsx
import { createToonReactAdapter, createToonReactRuntime } from '@toon-ui/react';

const adapter = createToonReactAdapter({
  level: 'strict',
  components,
});

console.log(adapter.meta.providedKeys);
console.log(adapter.meta.missingKeys);

const toon = createToonReactRuntime({ adapter });
```

| Level | Behavior |
| --- | --- |
| `minimal` | Accepts the components you provide. Missing components render an error if emitted. |
| `strict` | Throws during runtime creation unless every official React adapter key is registered. |

## Rendering assistant output

Use `ToonMessage` when the assistant content contains both markdown and `toon-ui` blocks.

```tsx
<ToonMessage
  content={assistantMessage}
  runtime={toon}
  renderMarkdown={(markdown) => <MessageResponse>{markdown}</MessageResponse>}
  onReply={(payload) => append(toon.messages.toUIMessage(payload))}
  onSubmit={(payload) => append(toon.messages.toUIMessage(payload))}
  renderError={(error) => <pre>{error.message}</pre>}
  showErrorDetails
/>
```

Use `ToonRenderer` when you only want to render extracted ToonUI blocks.

```tsx
<ToonRenderer
  content={assistantMessage}
  runtime={toon}
  onReply={(payload) => append(toon.messages.toUIMessage(payload))}
  onSubmit={(payload) => append(toon.messages.toUIMessage(payload))}
/>
```

## Component helpers

These helpers wire common DOM controls to ToonUI payloads.

| Helper | Use it for |
| --- | --- |
| `getToonButtonProps()` | Button click behavior for `reply` and `submit` actions. |
| `getToonInputProps()` | Text, email, password, number, and similar input fields. |
| `getToonTextareaProps()` | Textarea fields. |
| `getToonCheckboxProps()` | Checkbox fields. |
| `getToonFieldId()` | Stable field ids derived from the ToonUI node. |

Example field:

```tsx
import { getToonInputProps, type ToonFieldComponentProps } from '@toon-ui/react';

function FieldComponent(props: ToonFieldComponentProps) {
  return (
    <label htmlFor={`${props.node.name}-${props.node.line}`}>
      {props.node.label}
      <input {...getToonInputProps(props)} />
    </label>
  );
}
```

## Public API

| Export | Use it for |
| --- | --- |
| `createToonReactRuntime()` | Create the React runtime from registered components or an adapter. |
| `createToonReactAdapter()` / `createToonAdapter()` | Create an inspectable adapter contract. |
| `mergeToonComponentRegistry()` | Combine component registries. |
| `getToonAdapterCoverage()` | Read provided/missing adapter keys. |
| `assertToonReactAdapter()` | Enforce strict adapter coverage. |
| `ToonMessage` | Render markdown and ToonUI blocks in message order. |
| `ToonRenderer` | Render ToonUI blocks from content. |
| `ToonProvider` and hooks | Access runtime/action context in custom render trees. |
| `extractToonMarkdown()` | Remove ToonUI blocks and keep markdown text. |
| `ToonError` | Default error UI for parse/validation/missing component errors. |
| Prop helper functions | Wire DOM controls to ToonUI interactions. |
| Types | Component props, payloads, adapter metadata, runtime, and node helpers. |

## Boundary

`@toon-ui/react` does not generate React components, execute tools, or own your design system. Your app owns rendering, styling, validation, permissions, and API calls.

## Links

- Documentation: https://toon-ui.dev/docs
- React API docs: https://toon-ui.dev/docs/packages/react
- AI SDK guide: https://toon-ui.dev/docs/guides/vercel-ai-sdk
- Playground: https://toon-ui.dev/playground
