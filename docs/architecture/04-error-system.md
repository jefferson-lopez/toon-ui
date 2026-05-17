# Error system

## Shape

```ts
type ValidationIssue = {
  code:
    | "INVALID_COMPONENT"
    | "INVALID_PROP"
    | "INVALID_VARIANT"
    | "MISSING_REQUIRED_FIELD"
    | "INVALID_NESTING"
    | "INVALID_SYNTAX"
    | "UNSAFE_CONTENT";
  message: string;
  line?: number;
  column?: number;
};
```

## Contract

- parser errors MUST include `line` and `column`
- validation errors SHOULD include `line` and `column` when available
- the renderer MUST fail closed when parse/validation errors exist
- UI fallback is preferred over partial unsafe rendering

## Meaning of codes

| Code | Meaning |
|---|---|
| `INVALID_COMPONENT` | unknown or forbidden component key |
| `INVALID_PROP` | malformed field/table/property structure |
| `INVALID_VARIANT` | variant outside official enum |
| `MISSING_REQUIRED_FIELD` | missing title, label, reply, submit, etc. |
| `INVALID_NESTING` | disallowed parent/child relationship |
| `INVALID_SYNTAX` | grammar or block-shape error |
| `UNSAFE_CONTENT` | raw HTML or script-like content |
