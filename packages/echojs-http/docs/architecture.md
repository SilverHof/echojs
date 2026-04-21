# Архитектура `@echojs/http`

## Слои

1. **Public API** (`createHttpClient`, `HttpClient`, sugar `builder()`)
2. **Нормализация опций** (`mergeRequestOptions`, `validateRequestOptions`, `normalizeRequestOptions`)
3. **Хуки** (`src/core/hooks.ts`) — предсказуемый порядок, явное слияние при `extend()`
4. **Пайплайн исполнения** (`src/core/execute.ts`) — ретраи, редиректы, таймауты, финализация ответа
5. **Адаптер** (`src/adapters/fetch-adapter.ts`) — транспорт и capability flags
6. **Парсинг** (`src/core/parse-*`, `HttpResponseImpl`) — отдельно от исполнения
7. **Ошибки** (`src/errors/*`) — нормализация и `beforeError`
8. **Плагины** (`src/plugins/index.ts`) — точка расширения на будущее

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
- **Plugins**: заготовка интерфейса `HttpPlugin` (пока без реализаций).

## Контролируемый retry из `afterResponse`

Если хук возвращает `{ kind: "retry", delayMs? }`, ядро бросает `AfterResponseControlledRetry`, который обрабатывается верхним ретрай-циклом и уважает `retry.limit`.

## Примеры

См. **[`examples.md`](./examples.md)**.
