# @toon-ui/toon-ui

Main public entrypoint for ToonUI.

This is the package most developers should install first.

It gives you:

- the ToonUI core API
- the React runtime
- a zero-config `createToonUI()`
- a default neutral `basicPreset()` behind the scenes

---

## Install

```bash
pnpm add @toon-ui/toon-ui react
```

---

## Quickstart

```tsx
import { createToonUI, ToonMessage } from '@toon-ui/toon-ui';

const toon = createToonUI();

export function AssistantMessage({ content }: { content: string }) {
  return <ToonMessage content={content} runtime={toon} />;
}
```

Important:

`createToonUI()` automatically injects the built-in `basicPreset()`.

That means:

- zero config works
- if you override only some components, missing ones fall back to the defaults

---

## Partial override example

```tsx
const toon = createToonUI({
  components: {
    button: MyButton,
    field: MyInput,
  },
});
```

In that example:

- `button` and `field` come from your app
- the rest still render through the built-in preset

---

## Vercel AI SDK pattern

ToonUI sits ABOVE your chat stack.

```ts
import { streamText } from 'ai';
import { createToonUI } from '@toon-ui/toon-ui';

const toon = createToonUI();

const result = streamText({
  model,
  system: [toon.prompt, appToolInstructions].join('\n\n'),
  messages,
  tools: {
    createProduct,
    deleteProduct,
  },
});
```

Boundary:

- ToonUI owns UI grammar, validation, rendering, and structured interaction events
- your host app owns messages, tools, backend execution, and chat persistence

---

## Main exports

- `createToonUI()`
- `ToonMessage`
- `ToonRenderer`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `useToonAction()`
- `basicPreset()`

---

## Learn more

- Root docs: `https://github.com/jefferson-lopez/toon-ui`
- Vercel AI SDK guide: `docs/guides/with-vercel-ai-sdk.md` in the repo

