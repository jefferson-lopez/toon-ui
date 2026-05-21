# Interaction protocol

## Boundary

ToonUI is a UI runtime, not a tool-orchestration layer.

- ToonUI emits structured UI intent.
- The host app decides how to combine ToonUI prompt instructions with model/system prompts.
- The host app decides which AI SDK tools exist and when the model can call them.

## Mental model

Separate these concerns ON PURPOSE:

- `toon.prompt` teaches the model how to write valid ToonUI
- the host system prompt teaches the model the product role
- host tools define which business actions are available
- the UI runtime renders blocks and converts user interactions back into chat messages

This means ToonUI is SDK-agnostic at the orchestration layer. Vercel AI SDK is a good host choice, not a protocol requirement.

## Reply payload

```ts
type ReplyPayload = {
  kind: "ui_reply";
  source: "button";
  component: "button";
  value: string;
  line?: number;
  context?: Record<string, string | number | boolean>;
};
```

Serialized format:

```txt
ui_reply:
  value: Sí, elimínalo
  source: button
  component: button
```

## Submit payload

```ts
type SubmitPayload = {
  kind: "ui_submit";
  source: "form";
  intent: string;
  formTitle: string;
  values: Record<string, string | number | boolean>;
  line?: number;
};
```

Serialized format:

```txt
ui_submit:
  intent: create_product
  formTitle: Crear producto
  name: "Coca-Cola 400ml"
  price: 2500
  stock: 20
```

## Host app composition example

```ts
const toon = createToonProtocol();

const system = [
  toon.prompt,
  appSpecificToolInstructions,
].join("\n\n");
```

## Rules

- ToonUI never executes business logic directly
- reply and submit only send structured user intent back to the chat loop
- the AI decides whether to call a tool after receiving the payload
- tool definitions belong to the host app, not to ToonUI
