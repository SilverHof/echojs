---
pageType: home

hero:
  name: '@echojs/http'
  text: Type-safe HTTP client for apps & libraries
  tagline: Immutable instances, normalized options, hooks/adapters, strong errors — no “magic” on top of fetch.
  actions:
    - theme: brand
      text: Quick Start
      link: /en/quick-start/
    - theme: alt
      text: Examples
      link: /en/examples/
    - theme: alt
      text: API Reference
      link: /en/api-reference/
  image:
    src: /echojs.svg
    alt: EchoJS
features:
  - title: Normalized options model
    details: Predictable merge/override semantics and strict conflict validation, instead of “everything is allowed and breaks later”.
    icon: 🧱
    link: /en/guides/options/
  - title: Hooks instead of interceptors
    details: Production-grade lifecycle (beforeRequest/afterResponse/beforeError/...) with explicit execution order.
    icon: 🪝
    link: /en/guides/hooks/
  - title: Adapters and capability boundaries
    details: Transport is a pluggable layer; the core doesn’t pretend it can do what the adapter/runtime can’t.
    icon: 🔌
    link: /en/guides/adapters/
  - title: Strong error model
    details: Error classes + type guards, request metadata and requestId for observability.
    icon: 🧯
    link: /en/guides/errors/
  - title: Retry / Timeout / Redirects
    details: Conservative defaults with explicit extension points.
    icon: ⏱️
    link: /en/guides/retry/
  - title: Response as an object with helpers
    details: json/text/bytes + assertOk/unwrapJson and raw/stream modes.
    icon: 📦
    link: /en/guides/responses/
---

## Minimal example

```ts
import { createHttpClient } from "@echojs/http";

const http = createHttpClient({ baseUrl: "https://api.example.com" });
const me = await http.get("/me").unwrapJson<{ id: string }>();
```

