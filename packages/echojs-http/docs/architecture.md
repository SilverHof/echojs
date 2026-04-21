# Архитектура `@echojs/http`

## Слои

1. **Public API** (`createHttpClient`, `HttpClient`, sugar `builder()`)
2. **Нормализация опций** (`mergeRequestOptions`, `validateRequestOptions`, `normalizeRequestOptions`)
3. **Хуки** (`src/core/hooks.ts`) — предсказуемый порядок, явное слияние при `extend()`
4. **Пайплайн исполнения** (`src/core/execute.ts`) — ретраи, редиректы, таймауты, финализация ответа
5. **Адаптер** (`src/adapters/fetch-adapter.ts`) — транспорт и capability flags
6. **Парсинг** (`src/core/parse-*`, `HttpResponseImpl`) — отдельно от исполнения
7. **Ошибки** (`src/errors/*`) — нормализация и `beforeError`
8. **Плагины** — точка расширения (в core постепенно; см. `docs/plugins.md`)

## Иммутабельность

- Каждый `HttpClient` хранит defaults как результат `mergeRequestOptions({}, …)`.
- `extend()` создаёт **новый** клиент; родитель не мутируется.
- `defaults` отдаёт snapshot (включая копирование массивов hooks), чтобы случайные мутации снаружи не ломали внутреннее состояние.

## Merge-стратегия

См. `src/options/merge.ts`:

- скаляры: побеждает child, если поле задано
- `headers`: объединение с перекрытием ключей
- `timeout/retry/redirect`: shallow merge
- `hooks`: конкатенация массивов в порядке `[parent..., child...]`
- `context`: shallow merge

## Расширяемость

- **Адаптер**: интерфейс `HttpAdapter` + `supports` для capability boundaries.
- **Hooks**: расширение поведения без “магического” DSL.
- **Plugins**: проектируются как opt-in слой поверх hooks/adapters (см. `docs/plugins.md`).

## Контролируемый retry из `afterResponse`

Если хук возвращает `{ kind: "retry", delayMs? }`, запрос будет переисполнен в рамках общего retry-цикла и с уважением к `retry.limit`.

## Примеры

См. **[`examples.md`](./examples.md)**.
