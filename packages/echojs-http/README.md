# `@echojs/http`

Современный HTTP-клиент для приложений и библиотек: object-first API, иммутабельные инстансы, нормализованная модель опций, хуки жизненного цикла, адаптеры и строгая модель ошибок.

## Быстрый старт

```ts
import { createHttpClient } from "@echojs/http";

const http = createHttpClient({
  baseUrl: "https://api.example.com",
  headers: { "x-client": "echojs" },
  timeout: { request: 10_000, response: 10_000, read: 30_000 },
  retry: { limit: 2 },
});

const response = await http.get("/users", { searchParams: { page: 1 } });

const users = await http.get("/users").json<User[]>();
const text = await http.get("/robots.txt").text();

const created = await http
  .post("/users", {
    json: { name: "John" },
  })
  .json<User>();

const api = http.extend({
  headers: { authorization: "Bearer TOKEN" },
});
```

## Ключевые возможности

- `createHttpClient(defaults?)`, `client.request(options)`, `get/post/put/patch/delete/head/options`
- `client.extend(defaults)` и **иммутабельные** производные клиенты
- `client.defaults` — безопасный снимок (snapshot) defaults
- Хуки: `init`, `beforeRequest`, `beforeRedirect`, `beforeRetry`, `afterResponse`, `beforeError`
- Адаптеры: встроенный `fetchAdapter` + возможность подмены `adapter` на запрос
- Ошибки: `HttpClientError` и специализированные подклассы (`HTTPStatusError`, `TimeoutError`, …)
- Парсинг: `response.json<T>()`, `response.text()`, `response.bytes()`, `arrayBuffer()`
- `AbortSignal`, `raw()`, `stream()`, опциональный `builder()`

## Документация

- **[`docs/examples.md`](docs/examples.md)** — примеры: JSON/form, `extend`, хуки, отмена, `raw`/`stream`, ретраи, ошибки
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/api.md`](docs/api.md)
- [`docs/hooks.md`](docs/hooks.md)
- [`docs/adapters.md`](docs/adapters.md)

## Ограничения и честные оговорки

- Фазовые таймауты (`request` / `response` / `read`) реализованы **best-effort** поверх `fetch`: не все фазы различимы портируемо. Детали — в `docs/adapters.md`.
- `decompress` для `fetch` в основном отражает поведение рантайма (часто декомпрессия уже выполнена до уровня `Response`).

## Разработка

```bash
bun install
bun run --cwd packages/echojs-http test:run
bun run --cwd packages/echojs-http build
```
