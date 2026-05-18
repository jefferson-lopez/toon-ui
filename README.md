# ToonUI

ToonUI lets an LLM answer with normal markdown plus compact `toon-ui` blocks while your app keeps ownership of tools, persistence, transport, and business logic.

## Quick path

1. Server: `createToonProtocol()` from `@toon-ui/core`.
2. Client: `createToonClient()` from `@toon-ui/toon-ui`.
3. Render assistant output with `ToonMessage` or `ToonRenderer`.
4. Reinject interactions with `toon.messages.toUIMessage(payload)` or `toon.messages.toModelMessage(payload)`.

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

