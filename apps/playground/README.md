# ToonUI Playground

The playground is the fastest way to inspect the raw ToonUI pipeline.

## What it shows

- markdown + `toon-ui` input
- rendered UI
- extracted blocks
- parsed AST
- validation output
- generated prompt

## Run

```bash
pnpm install
pnpm --filter @apps/playground dev
```

## Why it matters

Use this app when you want to debug:

- parser problems
- invalid nesting
- unsafe content
- whether a prompt is producing valid ToonUI
