# Using ToonUI with Vercel AI SDK

This guide shows the CORRECT integration boundary:

- Vercel AI SDK handles chat transport, streaming, and tool calling.
- ToonUI handles conversational UI rendering and interaction capture.

If you mix those responsibilities, the architecture gets weak FAST.

---

## Quick path

1. Create a ToonUI runtime in your app.
2. Compose `toon.prompt` into your system prompt.
3. Keep your backend tools OUTSIDE ToonUI.
4. Render assistant messages with `ToonMessage`.
5. Convert UI interactions into structured user messages.

---

## 1. Install

```bash
pnpm add @toon-ui/toon-ui ai
```

You will also need your model provider package, for example:

```bash
pnpm add @ai-sdk/openai
```

---

## 2. Create the ToonUI runtime

```tsx
import { createToonUI } from '@toon-ui/toon-ui';

export const toon = createToonUI();
```

This runtime knows:

- the allowed components
- the grammar
- the validation rules
- the interaction protocols

It does NOT know:

- your tools
- your backend
- your model provider

Default behavior:

- `@toon-ui/toon-ui` already injects `basicPreset()`
- if you override only some components, missing ones are filled with the defaults

Example:

```tsx
export const toon = createToonUI({
  components: {
    button: AppButton,
    field: AppInput,
  },
});
```

---

## 3. Compose the system prompt

```ts
const appToolInstructions = [
  'Available backend tools:',
  '- createProduct(name, price, stock)',
  '- deleteProduct(id)',
].join('\n');

const systemPrompt = [toon.prompt, appToolInstructions].join('\n\n');
```

Why this matters:

- `toon.prompt` teaches the model HOW to emit valid ToonUI
- your app prompt teaches the model WHAT business actions exist

Those are different concerns.

---

## 4. Backend example with `streamText`

```ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { toon } from './toon';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const appToolInstructions = [
    'Available backend tools:',
    '- createProduct(name, price, stock)',
    '- deleteProduct(id)',
  ].join('\n');

  const result = streamText({
    model: openai('gpt-4.1'),
    system: [toon.prompt, appToolInstructions].join('\n\n'),
    messages,
    tools: {
      createProduct: async ({ name, price, stock }) => {
        return { ok: true, name, price, stock };
      },
      deleteProduct: async ({ id }) => {
        return { ok: true, id };
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
```

The important point is NOT the exact provider.

The important point is the boundary:

- `streamText()` belongs to the host app
- `tools` belong to the host app
- ToonUI stays focused on UI semantics

---

## 5. Frontend rendering

Render assistant content with `ToonMessage`.

```tsx
import { ToonMessage } from '@toon-ui/toon-ui';
import { toon } from './toon';

export function AssistantBubble({ content }: { content: string }) {
  return <ToonMessage content={content} runtime={toon} />;
}
```

If you need interaction handling:

```tsx
<ToonMessage
  content={message.content}
  runtime={toon}
  onReply={(payload) => {
    // convert to host message
  }}
  onSubmit={(payload) => {
    // convert to host message
  }}
/>
```

---

## 6. Host message model

Your host chat should keep TWO representations:

```ts
type HostMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayContent?: string;
  kind?: 'plain' | 'ui_reply' | 'ui_submit';
};
```

Why?

Because the model and the human should NOT always see the same thing.

Example:

- model-facing `content`:

```txt
ui_reply:
  eventId: reply_xxxxxxxx
  value: Sí, elimínalo
  source: button
  component: button
```

- human-facing `displayContent`:

```txt
Sí, elimínalo
```

If you show the raw structured payload to the human, the chat becomes technical and ugly.

---

## 7. Mapping ToonUI events back into chat messages

### Reply

```ts
function surfaceReply(payload: ToonReplyPayload): HostMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    kind: 'ui_reply',
    content: toon.formatReplyMessage(payload),
    displayContent: payload.value,
  };
}
```

### Submit

```ts
function createDisplaySubmitSummary(payload: ToonSubmitPayload): string {
  const fields = payload.node.children.filter((child) => child.type === 'field');

  const entries = fields
    .filter((field) => Object.prototype.hasOwnProperty.call(payload.values, field.name))
    .map((field) => `${field.label}: ${String(payload.values[field.name])}`);

  return [payload.formTitle, ...entries].join('\n');
}

function surfaceSubmit(payload: ToonSubmitPayload): HostMessage {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    kind: 'ui_submit',
    content: toon.formatSubmitMessage(payload),
    displayContent: createDisplaySubmitSummary(payload),
  };
}
```

Notice the important detail:

The visible summary uses the FORM LABELS, not raw technical keys like `name` or `price`.

That is what keeps the UI aligned with the language of the conversation.

---

## 8. Example chat loop

```txt
User types "crear producto"
↓
Backend sends messages to streamText()
↓
Model replies with markdown + ```toon-ui
↓
ToonMessage renders the form
↓
User submits
↓
Host app creates:
  - content = structured ui_submit
  - displayContent = human-friendly summary
↓
Host app sends that back to the model
↓
Model decides whether to answer or call createProduct()
```

That is the correct loop.

---

## 9. Where this is already implemented in the repo

Live reference:

- `examples/next-ai-sdk/src/App.tsx`
- `examples/next-ai-sdk/src/chat-loop.ts`

Those files prove:

- assistant messages are rendered with `ToonMessage`
- structured UI events are captured
- model content and display content are separated

---

## 10. Notes about AI SDK APIs

I verified the current official references before writing this guide:

- `streamText` is still the standard server-side primitive in the Vercel AI SDK docs.
- `useChat` exists in `@ai-sdk/react`.
- the official `useChat` docs describe the newer transport-based architecture in AI SDK 5.

That matters because ToonUI should sit ABOVE that transport layer, not replace it.

Official references:

- https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat
- https://vercel.com/kb/guide/streaming-from-llm

---

## 11. Checklist

- [ ] ToonUI runtime created in app code
- [ ] `toon.prompt` composed into the system prompt
- [ ] tools defined outside ToonUI
- [ ] assistant messages rendered with `ToonMessage`
- [ ] `ui_reply` mapped to model `content` + human `displayContent`
- [ ] `ui_submit` mapped to model `content` + human `displayContent`

---

## 12. Next step

If you want to test the pattern locally right now:

```bash
pnpm --filter @examples/next-ai-sdk dev
```
