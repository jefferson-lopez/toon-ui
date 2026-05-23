# @toon-ui/core

`@toon-ui/core` is the protocol foundation of ToonUI.

Use it when you need the server model, the central catalog, parsing, validation, or event/message conversion.

## Quick path

1. Create a protocol with the standard ToonUI components your app actually supports.
2. Feed the generated `toon.prompt` into your system prompt.
3. Use `toon.catalog`, `toon.events`, and `toon.messages` as the public API.

## Install

Use only the protocol package when you do not need React rendering:

```bash
pnpm add @toon-ui/core
```

## Main exports

- `createToonProtocol()`
- `createToonCatalog()`
- `TOON_CATALOG`
- `parseToonUI()`
- `validateToonUI()`
- `extractToonBlocks()`
- `toToonEventContent()`

## Recommended server usage

```ts
import { createToonProtocol } from '@toon-ui/core';

const toon = createToonProtocol({
  components: ['text', 'card', 'form', 'field', 'button', 'table'],
});
const system = [toon.prompt, 'Available tools:', '- searchProducts(query)'].join('

');
```

`toon.prompt` is generated from the active catalog subset. If `chart` is not enabled, the prompt will not teach the model to emit `chart`.

## Public API shape

```ts
const toon = createToonProtocol({
  components: ['text', 'card', 'form', 'field', 'button'],
});

toon.catalog.components.form.syntax;
toon.events.reply('Open details');
toon.events.submit('create_product', { name: 'Coca-Cola' });
toon.messages.toContent(payload);
toon.messages.toModelMessage(payload);
toon.messages.toUIMessage(payload);
```

## Why this shape exists

The old flat helpers were technically functional but conceptually noisy.

The new model is explicit:

- `catalog` = language definition
- `events` = user intent objects
- `messages` = reinjection into chat state

## Boundary

`@toon-ui/core` does NOT render React.

If you need rendering:

- `@toon-ui/react` for client rendering and adapters
