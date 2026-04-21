# Публичный API (`@echojs/http`)

## `createHttpClient(defaults?: RequestOptions): HttpClient`

Создаёт клиент с дефолтами. Дефолты не “шарятся” глобально между инстансами.

## `HttpClient`

### Методы запросов

- `request(options: RequestOptions): HttpRequestPromise`
- `get/post/put/patch/delete/head/options(url, options?)`

`HttpRequestPromise` — это `Promise<HttpResponse>` с sugar-методами:

- `.json<T>()`
- `.text()`
- `.bytes()`
- `.arrayBuffer()`
- `.unwrapJson<T>()`

### Производные клиенты

- `extend(options: RequestOptions): HttpClient`
- `withDefaults(options: RequestOptions): HttpClient`
- `withHeader(name, value): HttpClient`
- `withHeaders(headers): HttpClient`
- `withBaseUrl(url): HttpClient`
- `withContext(ctx): HttpClient`
- `withAuth(value, { scheme?, headerName? }): HttpClient`

### Facade поверх hooks

- `onRequest(fn)`
- `onResponse(fn)`
- `onError(fn)`
- `onRetry(fn)`
- `onRedirect(fn)`

### Defaults

- `readonly defaults: Readonly<RequestOptions>`

### Специальные режимы

- `raw(options)` — `throwHttpErrors: false`
- `stream(options)` — `responseType: "stream"` (требует поддержки адаптера)

### Опциональный builder

- `builder()` — вторичный слой: `with()`, `request()`, `get()`, `post()`

## Экспортируемые типы

Ключевые типы: `RequestOptions`, `HttpMethod`, `HttpResponse`, `HttpAdapter`, `HttpHooks`, ошибки, `mergeRequestOptions`, `normalizeRequestOptions`.

## Утилиты для библиотек

- `mergeRequestOptions(parent, child)`
- `normalizeRequestOptions(plain)`
- `mergeAndNormalize(parent, child)` (merge + normalize)

## Примеры

См. **[`examples.md`](./examples.md)** — пошаговые сценарии (GET/POST, типизация, хуки, `AbortSignal`, `raw`/`stream`, ретраи, обработка ошибок).
