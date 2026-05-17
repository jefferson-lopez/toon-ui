# @toon-ui/react

React runtime and component registry for ToonUI.

This package renders a typed ToonUI AST using React components chosen by the developer.

If you want the easiest public API with default components already wired in, use:

- `@toon-ui/toon-ui`

---

## What it includes

- `ToonMessage`
- `ToonRenderer`
- `ToonProvider`
- `useToonUI()`
- `useToonReply()`
- `useToonSubmit()`
- `useToonAction()`
- `basicPreset()`

---

## Install

```bash
pnpm add @toon-ui/react @toon-ui/core react
```

---

## Example

```tsx
import { createToonUI } from '@toon-ui/core';
import { ToonMessage, basicPreset } from '@toon-ui/react';

const runtime = createToonUI({
  components: basicPreset(),
});

export function AssistantMessage({ content }: { content: string }) {
  return <ToonMessage content={content} runtime={runtime} />;
}
```

---

## Partial override example

```tsx
const runtime = createToonUI({
  components: {
    ...basicPreset(),
    button: MyButton,
    field: MyInput,
  },
});
```

Use `@toon-ui/toon-ui` if you want that merge behavior by default.

---

## Important boundary

`@toon-ui/react` owns:

- AST traversal
- component registry resolution
- React event surfacing
- form state for ToonUI forms

It does NOT own:

- chat persistence
- tool calling
- backend execution
- AI SDK orchestration

