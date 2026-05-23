# @toon-ui/core

Server-safe protocol utilities for ToonUI.

ToonUI lets an LLM describe semantic UI inside chat. `@toon-ui/core` is the package that defines the allowed catalog, generates the model prompt, parses/validates ToonUI blocks, and converts UI interactions back into model-readable messages.

## Install

```bash
pnpm add @toon-ui/core
```

Use this package when you are building the server/protocol side only. If you also need React rendering, install `@toon-ui/react` in the client package.

## Quick start

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'card', 'form', 'field', 'button', 'confirm'],
});

const system = [
  'You are an assistant inside our product.',
  toon.prompt,
  'Available tools:',
  '- createProduct(name, price)',
].join('\n\n');
```

`toon.prompt` is generated from the active catalog. If your app does not enable `chart`, the prompt does not teach the model to emit `chart`.

## Mental model

| API | Purpose |
| --- | --- |
| `catalog` | The ToonUI language subset your app allows. |
| `prompt` | Model-facing instructions generated from that catalog. |
| `rules` | Small runtime summary of enabled components and variants. |
| `events` | Helpers for creating reply/submit interaction payloads. |
| `messages` | Helpers for reinjecting interactions into chat state. |

## Recommended server flow

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'alert', 'form', 'field', 'button'],
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  return streamText({
    model,
    system: toon.prompt,
    messages,
  });
}
```

Then render the assistant output on the client with your registered components in `@toon-ui/react`.

## Parse and validate model output

```ts
import { parseToonUI, validateToonUI, createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'card', 'button'],
});

const source = `card "Next step":\n  text "Choose an action."\n  button primary "Continue" reply="continue"`;

const ast = parseToonUI(source);
const result = validateToonUI(ast, toon.catalog);

if (!result.ok) {
  console.error(result.errors);
}
```

## Convert UI events into chat messages

```ts
const reply = toon.events.reply('show-products');

const content = toon.messages.toContent(reply);
const modelMessage = toon.messages.toModelMessage(reply);
const uiMessage = toon.messages.toUIMessage(reply);
```

For forms:

```ts
const submit = toon.events.submit('create_product', {
  name: 'Coca-Cola',
  price: 25.5,
});

const message = toon.messages.toModelMessage(submit);
```

These helpers keep user interactions machine-readable for the model while still preserving display-friendly content for your app.

## Public API

| Export | Use it for |
| --- | --- |
| `createToonProtocol()` | Create the catalog-aware prompt plus event/message helpers. |
| `createToonCoreRuntime()` | Create a protocol runtime with parser, validator, and block extraction. |
| `createRules()` | Get enabled component/variant rules from a catalog. |
| `createToonCatalog()` | Build the active catalog from official ToonUI component keys. |
| `TOON_CATALOG` | Full official catalog definition. |
| `parseToonUI()` | Parse one ToonUI block into an AST. |
| `validateToonUI()` | Validate parsed nodes against the active catalog. |
| `extractToonBlocks()` | Extract fenced `toon-ui` blocks from assistant markdown. |
| `extractToonSegments()` | Split assistant markdown into markdown and ToonUI segments. |
| `createPrompt()` and prompt helpers | Compose lower-level prompt sections when you need custom prompt assembly. |
| Types | Catalog, node, payload, message, and runtime TypeScript types. |

## Boundary

`@toon-ui/core` does not render UI and does not execute tools. It is safe to use on the server.

For React rendering, use [`@toon-ui/react`](https://www.npmjs.com/package/@toon-ui/react).

## Links

- Documentation: https://toon-ui.dev/docs
- Core API docs: https://toon-ui.dev/docs/packages/core
- Playground: https://toon-ui.dev/playground
