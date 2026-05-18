# @toon-ui/docs

Documentation site for the entire ToonUI ecosystem.

This app is built with Next.js + Fumadocs and explains:

- what ToonUI is
- how the protocol works
- when to use each package
- how to integrate server prompts, React rendering, and interaction reinjection
- where the architectural boundaries live

## What this app contains

| Area | Purpose |
|---|---|
| `app/` | Next.js routes and Fumadocs layouts |
| `content/docs/` | MDX documentation content grouped by topic |
| `lib/source.ts` | Fumadocs source loader |
| `.source/` | Generated documentation source artifacts |

## Local development

```bash
pnpm --filter @toon-ui/docs dev
```

## Typecheck

```bash
pnpm --filter @toon-ui/docs typecheck
```

## Build

```bash
pnpm --filter @toon-ui/docs build
```

## Documentation structure

The docs are intentionally organized from fundamentals to implementation:

1. **Overview** — what ToonUI is and why it exists
2. **Getting Started** — install and ship the shortest path
3. **Concepts** — the mental model you must teach first
4. **Language** — official grammar and catalog
5. **Packages** — responsibilities and boundaries of each package
6. **Guides** — integration patterns
7. **Reference** — message contracts, validation, and errors
8. **Architecture** — ownership boundaries and composition rules

## Editing content

All user-facing docs live in:

```txt
content/docs
```

Each folder has a `meta.json` file that controls sidebar grouping and page order.
