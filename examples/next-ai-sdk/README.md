# Next AI SDK example

This example shows the real host-loop integration model for ToonUI.

## What it demonstrates

- client rendering with `createToonClient()`
- reinjection with `toon.messages.toModelMessage(payload)`
- separation between model-facing `content` and human-facing `displayContent`
- host ownership of the chat loop

## Core idea

```txt
assistant message
-> ToonUI render
-> user interacts
-> ToonUI emits structured payload
-> host converts payload with toon.messages.*
-> message goes back into the chat loop
```

## Why this matters

If the user sees raw `ui_submit:` or `ui_reply:` text, the host integration is wrong.
