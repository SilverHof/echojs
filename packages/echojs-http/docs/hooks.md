# Hooks (`@echojs/http`)

## Список хуков

- **`init`**: `(plain, normalized) => void` — синхронно, до сети; удобно для инвариантов/логирования.
- **`beforeRequest`**: `BeforeRequestContext` — перед адаптером.
- **`beforeRedirect`**: `BeforeRedirectContext` — перед следованием редиректу (если включено).
- **`beforeRetry`**: `BeforeRetryContext` — перед ожиданием backoff и повтором.
- **`afterResponse`**: `AfterResponseContext` → можно вернуть:
  - `ResponseLike` (заменить ответ)
  - `{ kind: "retry", delayMs? }` (инициировать контролируемый retry)
- **`beforeError`**: `BeforeErrorContext` → `Error` (заменить/обогатить ошибку)

## Порядок выполнения

- `init`: строго в порядке регистрации (с учётом merge: parent → child).
- `beforeRequest` / `beforeRedirect` / `beforeRetry`: последовательно `await`.
- `afterResponse`: последовательно; каждый следующий хук получает **текущий** `response` (после возможной замены).
- `beforeError`: последовательно; ошибка “протекает” через цепочку.

## Merge при `extend()`

Массивы хуков **конкатенируются**: сначала родительские функции, затем дочерние.

## Ошибки в хуках

Любой throw из хука (кроме контролируемых директив) превращается в `RequestError` с понятным сообщением и `cause`.

## Примеры

См. **[`examples.md`](./examples.md)** (разделы про `beforeRequest`, `beforeError`, `afterResponse` + controlled retry).
