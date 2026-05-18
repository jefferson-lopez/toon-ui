# @toon-ui/react

`@toon-ui/react` is the explicit React integration layer for ToonUI.

Use it when you want to own the UI adapter instead of relying on the default client package.

## Quick path

1. Server: `createToonProtocol()` from `@toon-ui/core`.
2. Client: build an adapter with `createToonReactAdapter()`.
3. Create a runtime with `createToonReactRuntime({ adapter })`.
4. Render with `ToonMessage` or `ToonRenderer`.
5. Reinject interactions with `runtime.messages.*`.

## Main exports

- `createToonReactAdapter()`
- `createToonAdapter()`
- `mergeToonComponentRegistry()`
- `createToonReactRuntime()`
- `assertToonReactAdapter()`
- `ToonMessage`
- `ToonRenderer`
- `extractToonMarkdown`
- `getToonButtonProps()`
- `getToonInputProps()`
- `getToonTextareaProps()`
- `getToonCheckboxProps()`
- `basicPreset()`
- `useToonAction()`

## Recommended adapter pattern

```tsx
import {
  createToonReactAdapter,
  createToonReactRuntime,
  getToonButtonProps,
  type ToonButtonComponentProps,
} from '@toon-ui/react';

function MyButton(props: ToonButtonComponentProps) {
  return <button {...getToonButtonProps(props)}>{props.node.label}</button>;
}

const adapter = createToonReactAdapter({
  level: 'default',
  components: {
    button: MyButton,
  },
});

const runtime = createToonReactRuntime({ adapter });
```

## Why adapters matter

A raw component registry was weak API design.

An adapter makes the contract explicit:

- what UI you replace
- what defaults remain
- where interaction wiring comes from
- what coverage is still missing via `adapter.meta.missingKeys`
- whether the adapter is `minimal`, `default`, or `strict`

```ts
console.log(adapter.meta.level);
console.log(adapter.meta.providedKeys);
console.log(adapter.meta.missingKeys);
```

Use the levels like this:

- `default` -> merges ToonUI defaults plus your overrides
- `minimal` -> only what you register manually
- `strict` -> requires full coverage and throws if any adapter slot is missing

## Reinjecting interactions

```tsx
onReply={(payload) => {
  const message = runtime.messages.toModelMessage(payload);
  console.log(message.content);
  console.log(message.displayContent);
}}
```

For `useChat`-style state:

```tsx
const next = runtime.messages.toUIMessage(payload);
```

## Hooks

`useToonAction()` now mirrors the protocol mental model:

```ts
const { events, messages } = useToonAction();
```

