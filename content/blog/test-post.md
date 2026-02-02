+++
title = "A tiny test post with code"
date = 2026-02-01
description = "A short entry to preview typography, lists, and code blocks."
[taxonomies]
tags = ["notes", "code", "zola"]
+++

This is a small post to help you see the layout in action. It includes inline code like `main()` and a few blocks.

## A compact Rust snippet

```rust
fn main() {
    let message = "minimal, but mine";
    println!("{}", message);
}
```

## A tiny JavaScript helper

```js
const formatDate = (date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);

console.log(formatDate(new Date()));
```

A list to check spacing:

- One quiet note
- Another precise detail
- A final line to close the thought
