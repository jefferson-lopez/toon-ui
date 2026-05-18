# @toon-ui/toon-ui

`@toon-ui/toon-ui` is the main public client package for ToonUI.

Use it when you want the easiest path: default adapter included, clean client naming, and direct access to the protocol APIs.

## Quick path

1. Server: `createToonProtocol()` from `@toon-ui/core`.
2. Client: `createToonClient()`.
3. Render with `ToonMessage`.
4. Reinject interactions with `toon.messages.toUIMessage(payload)`.

## Main exports

- `createToonClient()`
- `createToonAdapter()`
- `ToonMessage`
- `ToonRenderer`
- `extractToonMarkdown`
- all public exports from `@toon-ui/core`
- all public exports from `@toon-ui/react`

## Happy path

```tsx
'use client';

import { ToonMessage, createToonClient } from '@toon-ui/toon-ui';

const toon = createToonClient();

export function AssistantMessage({ content, append }: {
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

## Partial customization

The client runtime now keeps the resolved adapter on `toon.adapter`, so you can inspect what was actually registered. Use `level: 'strict'` if your design system must cover every adapter slot before runtime.


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

## When to use this package

Use `@toon-ui/toon-ui` when:

- you want the default adapter
- you want to override only a few components
- you want the cleanest public client entrypoint

Use `@toon-ui/react` when:

- you want to own the adapter explicitly
- you are integrating a real design system
- you want tighter control over component registration

## Preferred mental model

Teach this first:

- `toon.catalog`
- `toon.events`
- `toon.messages`
- `toon.parse()`
- `toon.validate()`
- `toon.extractBlocks()`

