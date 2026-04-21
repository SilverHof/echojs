# Адаптеры (`@echojs/http`)

## Интерфейс `HttpAdapter`

Адаптер отвечает за **транспорт**: принять `NormalizedRequestOptions` и вернуть `AdapterResponse`.

Также объявляет `supports` — capability flags:

- `stream`
- `uploadProgress`
- `downloadProgress`
- `cookies`
- `proxy`

Это граница компетенций: ядро не должно предполагать возможности, которые адаптер не заявил.

## `fetchAdapter`

Базовый адаптер на глобальном `fetch` с `redirect: "manual"`, чтобы редиректы обрабатывались ядром (лимиты, хуки, политика методов/тела).

### Таймауты (best-effort)

`fetch` не даёт портируемого API для всех фаз:

- **`request`/`response`**: на практике моделируются общим дедлайном на время получения `Response` (см. `pickDeadlineMs` в `src/core/execute.ts`).
- **`read`**: отдельно оборачивает чтение тела (буферизация), когда `responseType !== "stream"`.

Если вам нужны более строгие семантики (например, отдельный “TTFB”), это обычно зона **специализированного адаптера** (Node/undici) и явной документации ограничений.

### `decompress`

Для `fetch` декомпрессия часто уже выполнена средой. Флаг `decompress` остаётся частью модели опций и документации совместимости.

## Как подключить свой адаптер

1. Реализуйте `HttpAdapter`.
2. Передайте `adapter` в `createHttpClient({ adapter })` или в конкретный `request({ adapter })`.
