# `@echojs/http`

Type-safe, extensible HTTP client для приложений и библиотек: **immutable instances**, **normalized options model**, **hooks**, **adapters**, **strong error model**, наблюдаемость (requestId) и честные capability boundaries.

`@echojs/http` не пытается быть “axios clone” и не строится вокруг магического builder DSL. Ядро остаётся небольшим и расширяемым — сложные фичи (cache/cookies/schema/endpoints/concurrency) планируются как плагины/доп. пакеты.

## Установка

В монорепозитории EchoJS пакет доступен как `@echojs/http`. Для внешнего использования (когда пакет станет публичным) установка будет стандартной:

```bash
bun add @echojs/http
# или
npm i @echojs/http
```

## Поддержка рантаймов (кратко)

- **Node**: >= 18 (global `fetch`).
- **Browsers**: современные браузеры с `fetch` и `AbortController`.
- **Bun**: поддерживается.

Ключевое: некоторые вещи (таймауты фаз, декомпрессия, cookies, progress, stream поведение) **зависят от рантайма и адаптера**. См. `docs/runtime-support.md` и `docs/limitations.md`.

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

## Самый короткий пример

```ts
import { createHttpClient } from "@echojs/http";

const http = createHttpClient({ baseUrl: "https://api.example.com" });
const me = await http.get("/me").unwrapJson<{ id: string }>();
```

## Ключевые возможности

- `createHttpClient(defaults?)`, `client.request(options)`, `get/post/put/patch/delete/head/options`
- `client.extend(defaults)` и **иммутабельные** производные клиенты
- `client.withBaseUrl()/withHeader()/withAuth()/withContext()` — композиция инстансов ради DX
- `client.defaults` — безопасный снимок (snapshot) defaults
- Хуки: `init`, `beforeRequest`, `beforeRedirect`, `beforeRetry`, `afterResponse`, `beforeError`
- Facade: `onRequest/onResponse/onError/onRetry/onRedirect`
- Адаптеры: встроенный `fetchAdapter` + возможность подмены `adapter` на запрос
- Ошибки: `HttpClientError` и специализированные подклассы (`HTTPStatusError`, `TimeoutError`, …)
- Парсинг: `response.json<T>()`, `response.text()`, `response.bytes()`, `arrayBuffer()`
- Response helpers: `response.assertOk()`, `response.unwrapJson<T>()`
- `AbortSignal`, `raw()`, `stream()`, опциональный `builder()`

## Почему не “просто wrapper над fetch”

- **Нормализованная модель опций**: предсказуемое merge/override поведение (`extend/withX`) и строгая валидация конфликтов.
- **Hooks**: production-grade lifecycle без ad-hoc интерсепторов.
- **Adapters**: транспорт — pluggable слой. Ядро не привязано к axios/undici.
- **Strong errors**: разные классы ошибок, `instanceof`, type guards, request metadata и `requestId`.
- **Capability boundaries**: честно описываем, что зависит от рантайма/адаптера.

## Документация

- Начните с **[`docs/getting-started.md`](docs/getting-started.md)**.
- Быстрые практичные рецепты: **[`docs/examples.md`](docs/examples.md)**.

Справочник и deep-dive:

- [`docs/api.md`](docs/api.md)
- [`docs/request-options.md`](docs/request-options.md)
- [`docs/instances.md`](docs/instances.md)
- [`docs/responses.md`](docs/responses.md)
- [`docs/errors.md`](docs/errors.md)
- [`docs/retries.md`](docs/retries.md)
- [`docs/timeouts.md`](docs/timeouts.md)
- [`docs/redirects.md`](docs/redirects.md)
- [`docs/hooks.md`](docs/hooks.md)
- [`docs/plugins.md`](docs/plugins.md)
- [`docs/adapters.md`](docs/adapters.md)
- [`docs/testing.md`](docs/testing.md)
- [`docs/mocking.md`](docs/mocking.md)
- [`docs/runtime-support.md`](docs/runtime-support.md)
- [`docs/limitations.md`](docs/limitations.md)
- [`docs/architecture.md`](docs/architecture.md)
- [`docs/faq.md`](docs/faq.md)

## Ограничения и честные оговорки

- Фазовые таймауты (`request` / `response` / `read`) реализованы **best-effort** поверх `fetch`: не все фазы различимы портируемо. Детали — в `docs/adapters.md`.
- `decompress` для `fetch` в основном отражает поведение рантайма (часто декомпрессия уже выполнена до уровня `Response`).
- `.json<T>()` и `.unwrapJson<T>()` **не валидируют** runtime данные. Для валидации используйте schema plugin (планируется) или проверяйте данные вручную.

## Разработка

```bash
bun install
bun run --cwd packages/echojs-http test:run
bun run --cwd packages/echojs-http build
```
