# @toon-ui/cli

`@toon-ui/cli` gives you terminal tooling for ToonUI validation and AST inspection.

Use it when you want:

- CI validation
- quick debugging of generated ToonUI
- AST inspection without writing scripts

---

## Install

```bash
pnpm add -D @toon-ui/cli
```

Or run it ad hoc:

```bash
pnpm dlx @toon-ui/cli validate example.toon
```

---

## Commands

### Validate a file

```bash
toon-ui validate example.toon
```

### Inspect the parsed AST

```bash
toon-ui inspect example.toon
```

---

## Example input

```toon
form "Crear producto":
  field name text "Nombre" required
  field price number "Precio" required
  button primary "Crear producto" submit
```

---

## Server integration

`@toon-ui/cli` is useful in server-side workflows and CI, not as a runtime dependency for production rendering.

Example validation script:

```json
{
  "scripts": {
    "validate:toon": "toon-ui validate samples/create-product.toon"
  }
}
```

Example CI step:

```bash
pnpm dlx @toon-ui/cli validate ./fixtures/example.toon
```

---

## Frontend integration

There is no direct frontend integration.

This package does NOT render UI and does NOT belong in browser code.

Pair it with:

- `@toon-ui/core` for server/runtime utilities
- `@toon-ui/react` or `@toon-ui/toon-ui` for frontend rendering

---

## Typical workflow

1. Your model emits a `toon-ui` block.
2. You save that block into a fixture file.
3. You run `toon-ui validate fixture.toon`.
4. You inspect the AST with `toon-ui inspect fixture.toon`.
5. You fix either the prompt or the generated output.

---

## Boundary

`@toon-ui/cli` owns:

- file-based validation
- AST inspection
- local debugging ergonomics

It does NOT own:

- prompt composition
- rendering
- chat orchestration
