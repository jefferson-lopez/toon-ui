# ToonUI

ToonUI lets an LLM answer with normal markdown plus compact `toon-ui` blocks while your app keeps ownership of tools, persistence, transport, and business logic.

The public package model is intentionally small:

| Package | Purpose |
|---|---|
| `@toon-ui/core` | Server-safe protocol, catalog, prompt generation, parser, validation, event/message APIs |
| `@toon-ui/react` | React client runtime, renderer, adapter layer, and interaction wiring |

No umbrella package. No prompt-only package. No CLI package. This keeps server and client boundaries obvious.

## Install

For a React/Next.js app that uses ToonUI end to end:

```bash
pnpm add @toon-ui/core @toon-ui/react
```

For server-only protocol work:

```bash
pnpm add @toon-ui/core
```

Do not install React through ToonUI. `react` and `react-dom` belong to the host app.

## Server model

Use `@toon-ui/core` on the server. The prompt is generated from the standard ToonUI components your app actually supports.

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'card', 'form', 'field', 'button', 'table'],
});

const system = [
  toon.prompt,
  'You are helping users compare products.',
  'Available tools:',
  '- searchProducts(query)',
].join('\n\n');
```

`toon.prompt` teaches the model:

- which configured standard ToonUI components are valid
- how each component is written
- which variants are valid
- which syntax patterns are invalid
- when UI is a better response than plain prose

## Client model

Use `@toon-ui/react` in client React code.

```tsx
'use client';

import { ToonMessage, createToonReactRuntime } from '@toon-ui/react';

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

function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={toon}
      onReply={(payload) => {
        const message = toon.messages.toUIMessage(payload);
        console.log(message.parts[0].text);
      }}
      onSubmit={(payload) => {
        const message = toon.messages.toUIMessage(payload);
        console.log(message.parts[0].text);
      }}
    />
  );
}
```

## Mental model

Think in layers:

- `toon.prompt` -> teaches the LLM how to write the active ToonUI subset
- host system prompt -> teaches the LLM your business role
- host tools -> define what the assistant can actually do
- React runtime -> renders `toon-ui` blocks and sends interactions back

ToonUI owns the UI protocol. Your host app owns orchestration.

## Integration choices

| Situation | Recommended path |
|---|---|
| Server prompt, parser, validation, events/messages | `@toon-ui/core` |
| React rendering and interaction wiring | `@toon-ui/react` |
| Next.js or React with Vercel AI SDK | ToonUI + Vercel AI SDK guide |
| Custom chat loop or another SDK | Keep ToonUI and wire your own host loop |

## Next steps

- Want the recommended React/Next.js path? See `docs/guides/with-vercel-ai-sdk.md`
- Want the architecture boundary? See `docs/architecture/05-interaction-protocol.md`
