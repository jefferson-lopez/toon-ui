# @toon-ui/cli

CLI tools for validating and inspecting ToonUI files.

---

## Install

```bash
pnpm add -D @toon-ui/cli
```

Or run it without adding to dependencies:

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

## What this package is for

Use the CLI when you want to:

- validate assistant-generated ToonUI in scripts
- inspect AST output during development
- debug grammar problems quickly

