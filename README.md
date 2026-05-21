# ToonUI

ToonUI lets an LLM answer with normal markdown plus compact `toon-ui` blocks while your app keeps ownership of tools, persistence, transport, and business logic.

## Quick path

1. Server: `createToonProtocol()` from `@toon-ui/core`.
2. Client: `createToonClient()` from `@toon-ui/toon-ui`.
3. Render assistant output with `ToonMessage` or `ToonRenderer`.
4. Reinject interactions with `toon.messages.toUIMessage(payload)` or `toon.messages.toModelMessage(payload)`.

## Install

Install only the ToonUI packages you need:

```bash
pnpm add @toon-ui/core @toon-ui/toon-ui
```

If your app already uses React or Next.js, DO NOT duplicate framework installs in this command. Keep `react` and `react-dom` managed by the host app.

Use only the protocol on the server:

```bash
pnpm add @toon-ui/core
```

## Positioning

ToonUI is NOT tied to a single AI SDK.

- Use ToonUI when you want the model to emit structured UI in a compact DSL.
- Use `@toon-ui/core` to teach the model how to write ToonUI.
- Use `@toon-ui/react` or `@toon-ui/toon-ui` to render that output in React.
- Use Vercel AI SDK only if it fits your host app. It is the recommended starter path, not a required dependency.

## Package map

| Package | Purpose |
|---|---|
| `@toon-ui/core` | Protocol, catalog, parser, validation, event/message APIs |
| `@toon-ui/react` | Explicit React runtime plus adapter layer |
| `@toon-ui/toon-ui` | Main public client package with default adapter |
| `@toon-ui/prompts` | Prompt helpers only |

## Server model

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol();

console.log(toon.prompt);
console.log(toon.catalog.components.form.syntax);
```

`toon.prompt` is the base protocol prompt. It teaches the model:

- which ToonUI components exist
- how each component is written
- which variants are valid
- which syntax patterns are invalid
- when UI is a better response than plain prose

In other words: `toon.prompt` is the model-facing specification for writing ToonUI correctly.

## Client model

```tsx
import { ToonMessage, createToonClient } from '@toon-ui/toon-ui';

const toon = createToonClient();

function AssistantMessage({ content }: { content: string }) {
  return (
    <ToonMessage
      content={content}
      runtime={toon}
      onReply={(payload) => {
        const message = toon.messages.toUIMessage(payload);
        console.log(message.parts[0].text);
        console.log(message.metadata.displayContent);
      }}
      onSubmit={(payload) => {
        const message = toon.messages.toUIMessage(payload);
        console.log(message.parts[0].text);
        console.log(message.metadata.displayContent);
      }}
    />
  );
}
```

## Public mental model

Teach THIS first:

- `toon.catalog` -> what the language supports
- `toon.events` -> structured user intent
- `toon.messages` -> how intent returns to the chat loop

That means the preferred APIs are:

- `toon.events.reply(...)`
- `toon.events.submit(...)`
- `toon.messages.toContent(...)`
- `toon.messages.toModelMessage(...)`
- `toon.messages.toUIMessage(...)`

## Integration choices

Choose based on host ownership:

| Situation | Recommended path |
|---|---|
| You want the fastest React starter | `@toon-ui/toon-ui` |
| You want explicit design-system control in React | `@toon-ui/react` |
| You need only the protocol, parser, validation, or prompt | `@toon-ui/core` |
| You are using Next.js or React with Vercel AI SDK | ToonUI + Vercel AI SDK guide |
| You have your own chat loop or another SDK | Keep ToonUI and wire your own host loop |

## Host architecture

Think in layers:

- `toon.prompt` -> teaches the LLM how to write ToonUI
- host system prompt -> teaches the LLM your business role
- host tools -> define what the assistant can actually do
- React runtime -> renders `toon-ui` blocks and sends interactions back

That means ToonUI owns the UI protocol, while the host app owns orchestration.

## Adapter model

Adapters are now explicit contracts, not just loose component maps. Each adapter exposes coverage metadata and supports `minimal`, `default`, and `strict` levels so the host can verify or enforce integration completeness.


If you want defaults, use `@toon-ui/toon-ui`.

If you want explicit UI integration, use `@toon-ui/react`:

```tsx
import { createToonReactAdapter, createToonReactRuntime } from '@toon-ui/react';

const adapter = createToonReactAdapter({
  level: 'strict',
  components: {
    button: MyButton,
    field: MyField,
    // ...register every slot for strict design-system ownership
  },
});

const runtime = createToonReactRuntime({ adapter });
```

## Next steps

- Want the recommended React/Next.js path? See `docs/guides/with-vercel-ai-sdk.md`
- Want the architecture boundary? See `docs/architecture/05-interaction-protocol.md`
