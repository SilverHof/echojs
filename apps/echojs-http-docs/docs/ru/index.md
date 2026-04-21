---
pageType: home

hero:
  name: '@echojs/http'
  text: Type-safe HTTP client for apps & libraries
  tagline: Immutable instances, normalized options, hooks/adapters, strong errors — без “магии” поверх fetch.
  actions:
    - theme: brand
      text: Быстрый старт
      link: /quick-start/
    - theme: alt
      text: Примеры
      link: /examples/
    - theme: alt
      text: API Reference
      link: /api-reference/
  image:
    src: /echojs.svg
    alt: EchoJS
features:
  - title: Нормализованная модель опций
    details: Предсказуемое merge/override поведение и строгая валидация конфликтов вместо “всё можно и всё сломается позже”.
    icon: 🧱
    link: /guides/options/
  - title: Hooks вместо интерсепторов
    details: Production-grade lifecycle (beforeRequest/afterResponse/beforeError/...) с явным порядком выполнения.
    icon: 🪝
    link: /guides/hooks/
  - title: Adapters и capability boundaries
    details: Транспорт — pluggable слой, ядро не притворяется, что умеет то, чего не умеет адаптер/рантайм.
    icon: 🔌
    link: /guides/adapters/
  - title: Strong error model
    details: Классы ошибок + type guards, request metadata и requestId для наблюдаемости.
    icon: 🧯
    link: /guides/errors/
  - title: Retry / Timeout / Redirects
    details: Консервативные политики по умолчанию и контролируемые точки расширения.
    icon: ⏱️
    link: /guides/retry/
  - title: Ответ как объект с helpers
    details: json/text/bytes + assertOk/unwrapJson и режимы raw/stream.
    icon: 📦
    link: /guides/responses/
---

## Минимальный пример

```ts
import { createHttpClient } from "@echojs/http";

const http = createHttpClient({ baseUrl: "https://api.example.com" });
const me = await http.get("/me").unwrapJson<{ id: string }>();
```

