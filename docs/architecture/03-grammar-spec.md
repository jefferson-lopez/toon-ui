# Grammar spec

## Top-level rule

A response may contain normal markdown and zero or more fenced `toon-ui` blocks.

## Block structure

- indentation-based nesting
- quoted strings for visible labels/titles
- `:` opens a nested block
- tables use `columns:` and `row:` entries under a `table` block

## MVP grammar sketch

```txt
document        -> node*
node            -> text | card | form | field | button | confirm | list | item | badge | alert | table
text            -> text "value"
card            -> card "title": indented(node*)
form            -> form "title": indented(field* button+)
field           -> field <name> <fieldType> "label" [required]
button          -> button <variant> "label" (reply="value" | submit)
confirm         -> confirm "title": indented(node*)
list            -> list "title": indented(item+)
item            -> item "title": indented(node*)
badge           -> badge "label" <variant>
alert           -> alert <variant> "title": indented(node*)
table           -> table "title": indented(columns row+)
columns         -> columns: value, value, value
row             -> row: value, value, value
```

## Nesting constraints

- `list` can only contain `item`
- `table` can only contain `columns:` and `row:` entries
- `form` must contain at least one `field` and one submit `button`
- `button` is leaf-only in the MVP
- `badge`, `field`, and `text` are leaf-only in the MVP

## Rejected constructs

- unknown components
- raw HTML
- JavaScript or CSS payloads
- custom components
- free-form props
