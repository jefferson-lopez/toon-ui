# ToonUI

**ToonUI** es un runtime de UI semántica para apps AI-native.

Permite que la IA responda con:

- texto normal
- más bloques compactos ```` ```toon-ui ````

sin generar React, HTML, CSS o JSON pesado de componentes.

---

## Get Started

Si solo quieres entender cómo usar ToonUI, sigue este orden:

1. instala `@toon-ui/toon-ui`
2. crea un runtime con `createToonUI()`
3. renderiza mensajes del assistant con `ToonMessage`
4. deja que ToonUI capture `reply` y `submit`
5. envía esos eventos estructurados de vuelta al chat

La idea central es esta:

```txt
ToonUI define QUÉ puede existir.
El developer define CÓMO se ve.
La IA decide CUÁNDO usarlo.
```

---

## Instalación

### Opción recomendada

```bash
pnpm add @toon-ui/toon-ui react
```

### Opción low-level

Si quieres controlar más piezas manualmente:

```bash
pnpm add @toon-ui/core @toon-ui/react react
```

---

## Uso mínimo

Este es el arranque más simple:

```tsx
import { createToonUI, ToonMessage } from '@toon-ui/toon-ui';

const toon = createToonUI();

export function AssistantMessage({ content }: { content: string }) {
  return <ToonMessage content={content} runtime={toon} />;
}
```

### Importante

`createToonUI()` ya inyecta un `basicPreset()` por defecto.

Eso significa:

- funciona con cero configuración
- si defines solo algunos componentes propios, los que falten usan el preset básico

---

## Override parcial de componentes

```tsx
const toon = createToonUI({
  components: {
    button: MyButton,
    field: MyInput,
  },
});
```

En ese caso:

- `button` y `field` salen de tu app
- `card`, `alert`, `badge`, etc. siguen usando el preset básico

Eso es intencional.  
La librería debe arrancar rápido, pero el developer sigue teniendo el control real.

---

## Cómo piensa ToonUI

ToonUI NO es:

- un framework de agentes
- una capa de tool calling
- un reemplazo de Vercel AI SDK
- un backend orchestrator

ToonUI SÍ es:

- parser
- AST tipado
- validator
- runtime React
- component registry
- formatter de `ui_reply` y `ui_submit`

La app host sigue siendo dueña de:

- `messages`
- `streamText()` / `useChat()` / el SDK que uses
- `tools`
- backend
- persistencia
- UX final del chat

ESA separación es la arquitectura correcta.

---

## Flujo completo

```txt
Usuario escribe
↓
La IA responde markdown + toon-ui
↓
ToonUI extrae bloques
↓
ToonUI parsea y valida
↓
ToonUI renderiza con tus componentes
↓
El usuario interactúa
↓
ToonUI emite ui_reply / ui_submit
↓
Tu host app reinyecta eso al chat
↓
La IA decide si responde o llama una tool
```

---

## Ejemplo de sintaxis

### Confirmación

```toon
confirm "¿Eliminar producto?":
  text "Coca-Cola 400ml será eliminado."
  button secondary "Cancelar" reply="Cancelar"
  button danger "Sí, eliminar" reply="Sí, elimínalo"
```

### Formulario

```toon
form "Crear producto":
  field name text "Nombre" required
  field price number "Precio" required
  field stock number "Stock" required
  button primary "Crear producto" submit
```

### Card

```toon
card "Producto encontrado":
  text "Coca-Cola 400ml"
  badge "Activo" success
  button secondary "Ver producto" reply="Ver producto"
```

---

## Catálogo oficial MVP

Catálogo cerrado:

- `text`
- `card`
- `form`
- `field`
- `button`
- `confirm`
- `list`
- `item`
- `badge`
- `alert`
- `table`

La IA NO puede inventar componentes fuera de ese catálogo.

---

## Cómo renderizar un mensaje del assistant

Si tu modelo devuelve algo así:

````md
Claro, encontré este producto.

```toon-ui
card "Producto encontrado":
  text "Coca-Cola 400ml"
  badge "Activo" success
```
````

Entonces:

```tsx
<ToonMessage content={message.content} runtime={toon} />
```

`ToonMessage` hace esto:

- separa markdown y bloques `toon-ui`
- parsea
- valida
- renderiza UI

---

## Cómo funciona la interacción

### Reply de botón

Si la IA emite:

```toon
button danger "Sí, eliminar" reply="Sí, elimínalo"
```

ToonUI captura el click y tu host app puede serializarlo así:

```txt
ui_reply:
  eventId: reply_xxxxxxxx
  value: Sí, elimínalo
  source: button
  component: button
```

### Submit de formulario

Si la IA emite:

```toon
form "Crear producto":
  field name text "Nombre" required
  field price number "Precio" required
  button primary "Crear producto" submit
```

Tu host app puede serializarlo así:

```txt
ui_submit:
  eventId: submit_xxxxxxxx
  intent: create_product
  formTitle: Crear producto
  name: "Coca-Cola 400ml"
  price: 2500
```

---

## Regla CRÍTICA: modelo vs humano

No muestres al usuario el payload técnico crudo.

Lo correcto es separar:

- `content` → lo que recibe la IA
- `displayContent` → lo que ve el humano

Ejemplo:

### Lo que recibe la IA

```txt
ui_reply:
  eventId: reply_xxxxxxxx
  value: Sí, elimínalo
  source: button
  component: button
```

### Lo que ve el usuario

```txt
Sí, elimínalo
```

Eso mismo aplica a `ui_submit`.

---

## Integración con Vercel AI SDK

La integración correcta NO es mezclar ToonUI con tools.

La integración correcta es:

```ts
import { streamText } from 'ai';
import { createToonUI } from '@toon-ui/toon-ui';

const toon = createToonUI();

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

O sea:

- ToonUI aporta reglas de UI
- tu app aporta tools y orquestación

Para la guía completa:

- `docs/guides/with-vercel-ai-sdk.md`

---

## Apps locales de este repo

### Example vivo

```bash
pnpm --filter @examples/next-ai-sdk dev
```

Sirve para probar:

- chat host real
- render de assistant
- `ui_reply`
- `ui_submit`
- separación entre `content` y `displayContent`

### Playground

```bash
pnpm --filter @apps/playground dev
```

Sirve para probar:

- markdown + `toon-ui`
- AST
- errores
- render
- prompt generado

---

## Verificación local del repo

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
```

---

## CLI

Comandos actuales del MVP:

```bash
pnpm --filter @toon-ui/cli exec toon-ui validate example.toon
pnpm --filter @toon-ui/cli exec toon-ui inspect example.toon
```

---

## Paquetes del monorepo

- `@toon-ui/core` — parser, AST, validator, formatter
- `@toon-ui/react` — runtime React y registry tipado
- `@toon-ui/prompts` — helpers de prompt
- `@toon-ui/cli` — validate / inspect
- `@toon-ui/toon-ui` — entrypoint principal recomendado

---

## Qué leer después

### Si quieres usarlo ya

1. `examples/next-ai-sdk/README.md`
2. `docs/guides/with-vercel-ai-sdk.md`

### Si quieres entender la arquitectura

- `docs/architecture/01-mvp-foundation.md`
- `docs/architecture/02-official-catalog.md`
- `docs/architecture/03-grammar-spec.md`
- `docs/architecture/04-error-system.md`
- `docs/architecture/05-interaction-protocol.md`

---

## Estado actual

ToonUI está en etapa MVP.

Eso significa:

- la arquitectura base ya es real
- el loop conversacional ya es real
- el registry ya es real
- pero el producto todavía está endureciéndose para releases públicas más amplias

