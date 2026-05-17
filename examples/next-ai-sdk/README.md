# Next AI SDK example

```ts
import { createToonUI } from '@toon-ui/toon-ui';
import { shadcnPreset } from '@toon-ui/toon-ui/presets/shadcn';
import { streamText } from 'ai';

const toon = createToonUI({
  components: shadcnPreset(),
});

const appToolInstructions = [
  'Available backend tools:',
  '- createProduct(name, price, stock)',
  '- deleteProduct(id)',
].join('\n');

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
