# Official component catalog

This catalog is CLOSED for the MVP.

## Allowed component keys

```ts
type ToonComponentKey =
  | "text"
  | "card"
  | "form"
  | "field"
  | "button"
  | "confirm"
  | "list"
  | "item"
  | "badge"
  | "alert"
  | "table";
```

## Rules

- The AI can only emit official component keys.
- The developer can only register components that match official keys.
- Unknown components are rejected as `INVALID_COMPONENT`.
- Extensions are OUT OF SCOPE for the MVP.

## Resolved decision: `meta`

`meta` is NOT part of the official MVP catalog.

Why:
- it was present in an earlier syntax example
- it was absent from the closed catalog
- keeping both states would corrupt the contract

Decision:
- remove `meta` from the parser/runtime contract
- model secondary text with `text` inside `item` for the MVP
