# Примеры использования `@echojs/http`

Ниже — практичные сценарии поверх актуального публичного API. Импорт в монорепозитории:

```ts
import { createHttpClient } from "@echojs/http";
```

---

## 1. Клиент с базовым URL и заголовками

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  headers: {
    "x-client": "my-app",
    accept: "application/json",
  },
});

// Относительный путь склеивается с baseUrl
const res = await http.get("/v1/me");
console.log(res.status, res.ok);
```

---

## 2. Параметры запроса (`searchParams`)

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

const page = await http.get("/items", {
  searchParams: { page: 1, status: "active" },
});
```

Объект `searchParams` сериализуется в query-string и **дополняет** URL (не “перетирает” уже существующие параметры в строке `url`, если вы их туда положили вручную).

---

## 3. Типизированный JSON: цепочка на промисе

```ts
type User = { id: string; name: string };

const http = createHttpClient({ baseUrl: "https://api.example.com" });

const users = await http.get("/users").json<User[]>();
const created = await http
  .post("/users", { json: { name: "Ann" } })
  .json<User>();
```

То же самое через полный ответ:

```ts
const res = await http.get("/users");
const users2 = await res.json<User[]>();
```

---

## 4. Текст и бинарные данные

```ts
const http = createHttpClient({ baseUrl: "https://example.com" });

const robots = await http.get("/robots.txt").text();
const logo = await http.get("/favicon.ico").bytes();
```

---

## 5. `POST` с JSON и с form (`application/x-www-form-urlencoded`)

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

await http.post("/login", {
  json: { email: "a@b.c", password: "***" },
});

await http.post("/token", {
  form: { grant_type: "client_credentials", client_id: "..." },
});
```

Важно: **нельзя одновременно** задавать `body`, `json` и `form` — будет `RequestError` на нормализации.

---

## 6. `request()` и явный `method`

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

await http.request({
  method: "PATCH",
  url: "/users/me",
  json: { displayName: "Neo" },
});
```

Метод в опциях можно писать и в нижнем регистре (`"patch"`) — внутри он нормализуется.

---

## 7. `extend()`: производный клиент без мутации родителя

```ts
const publicApi = createHttpClient({
  baseUrl: "https://api.example.com",
  headers: { "x-client": "app" },
});

const userApi = publicApi.extend({
  headers: { authorization: "Bearer SECRET" },
});

// publicApi по-прежнему без Authorization
const snap = publicApi.defaults;
```

`snap` — это **snapshot** defaults (в т.ч. копии массивов hooks), чтобы случайно не мутировать внутренности клиента.

---

## 7.1 `withBaseUrl/withHeader/withAuth`: композиция инстансов

`extend()` остаётся базовым механизмом, но для DX есть короткие immutable-методы:

```ts
const http = createHttpClient();

const api = http.withBaseUrl("https://api.example.com");
const authed = api.withAuth("TOKEN", { scheme: "Bearer" });
const admin = authed.withHeader("x-role", "admin");

const me = await admin.get("/me").unwrapJson();
```

---

## 8. Отмена запроса (`AbortSignal`)

```ts
const controller = new AbortController();

const http = createHttpClient({
  baseUrl: "https://api.example.com",
  signal: controller.signal,
});

const p = http.get("/slow");
controller.abort();

// Обычно это будет AbortError из @echojs/http
await p.catch((e) => e);
```

Сигнал можно передать и на конкретный вызов:

```ts
await http.get("/x", { signal: controller.signal });
```

---

## 9. `raw()`: не бросать на 4xx/5xx, разобрать ответ вручную

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

const res = await http.raw({ url: "/maybe-missing" });
if (!res.ok) {
  const bodyText = await res.text();
  console.warn(res.status, bodyText);
  return;
}

const data = await res.json();
```

---

## 10. `stream()`: ответ как поток (если адаптер поддерживает)

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

const res = await http.stream({ url: "/big.csv" });
const stream = res.body;
if (stream && stream instanceof ReadableStream) {
  // дальше — ваш пайплайн чтения потока
}
```

Если вы не уверены в типе `body`, проверяйте `responseType`/`supports.stream` у адаптера (см. `docs/adapters.md`).

---

## 11. Таймауты (best-effort на `fetch`)

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  timeout: {
    request: 10_000,
    response: 10_000,
    read: 30_000,
  },
});
```

Семантика фаз на `fetch` **не всегда различима портируемо**: часть поведения — это честный best-effort слой. Подробности — в `docs/adapters.md`.

---

## 12. Ретраи (консервативно по умолчанию)

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  retry: {
    limit: 2,
    methods: ["GET", "HEAD"],
    statusCodes: [408, 429, 500, 502, 503, 504],
  },
});
```

Политика ретраев применяется к **ошибкам/исключениям** и “retryable” HTTP-ошибкам при `throwHttpErrors: true`. Если `throwHttpErrors: false`, клиент чаще **возвращает ответ** вместо throw — и ретраи по статусу могут не сработать так, как при исключениях.

---

## 13. Хуки: логирование и модификация ошибки

```ts
import { createHttpClient, HTTPStatusError } from "@echojs/http";

const http = createHttpClient({
  baseUrl: "https://api.example.com",
  hooks: {
    beforeRequest: [
      async ({ normalized }) => {
        console.log("→", normalized.method, normalized.url);
      },
    ],
    beforeError: [
      async ({ error }) => {
        if (error instanceof HTTPStatusError) {
          return error; // или обернуть/заменить
        }
        return error instanceof Error ? error : new Error(String(error));
      },
    ],
  },
});
```

---

## 13.1 Facade над hooks: `onRequest/onResponse/...`

Это просто sugar над `hooks`, сохраняющий порядок и merge-семантику.

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" })
  .onRequest(({ normalized }) => {
    console.log("→", normalized.method, normalized.url);
  })
  .onError(({ error }) => {
    console.error("err", error);
    return error instanceof Error ? error : new Error(String(error));
  });
```

---

## 14. `afterResponse`: контролируемый retry

Хук может вернуть директиву `{ kind: "retry", delayMs?: number }`. Это приводит к внутреннему “контролируемому” retry и учитывает `retry.limit`.

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  retry: { limit: 1 },
  hooks: {
    afterResponse: [
      async ({ response }) => {
        if (response.headers.get("x-ratelimit-remaining") === "0") {
          return { kind: "retry", delayMs: 500 };
        }
        return undefined;
      },
    ],
  },
});
```

---

## 15. `context`: прокинуть данные в хуки/адаптерный слой

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  hooks: {
    beforeRequest: [
      async ({ context }) => {
        console.log("trace", context["traceId"]);
      },
    ],
  },
});

await http.get("/x", { context: { traceId: "abc" } });
```

---

## 16. Опциональный `builder()` (вторичный sugar)

```ts
const http = createHttpClient({ baseUrl: "https://api.example.com" });

const call = http
  .builder()
  .with({ headers: { authorization: "Bearer X" } })
  .with({ timeout: { request: 5_000 } });

await call.get("/me");
```

---

## 17. Обработка ошибок (`instanceof`)

```ts
import {
  AbortError,
  HTTPStatusError,
  NetworkError,
  ParseError,
  TimeoutError,
} from "@echojs/http";

try {
  await http.get("/x");
} catch (e) {
  if (e instanceof HTTPStatusError) {
    console.log(e.response.status);
  } else if (e instanceof TimeoutError) {
    console.log(e.phase);
  } else if (e instanceof AbortError) {
    console.log("aborted");
  } else if (e instanceof NetworkError) {
    console.log("transport");
  } else if (e instanceof ParseError) {
    console.log("decode/json");
  } else {
    throw e;
  }
}
```

---

## 17.1 Type guards для ошибок

```ts
import { isHttpError, isTimeoutError } from "@echojs/http";

try {
  await http.get("/x");
} catch (e) {
  if (isHttpError(e)) {
    console.log(e.code, e.requestId, e.url);
  }
  if (isTimeoutError(e)) {
    console.log("phase", e.phase);
  }
}
```

---

## 19. requestId / tracing header (observability foundation)

```ts
const http = createHttpClient({
  baseUrl: "https://api.example.com",
  tracing: {
    requestIdHeader: "x-request-id",
    generateRequestId: () => "RID-123",
    errorBodyPreviewBytes: 1024,
  },
});

await http.get("/health");
```


## 18. Подмена адаптера на один запрос

```ts
import { createHttpClient, fetchAdapter, type HttpAdapter } from "@echojs/http";

const custom: HttpAdapter = {
  name: "fetch-instrumented",
  supports: fetchAdapter.supports,
  async execute(req, ctx) {
    const started = performance.now();
    const res = await fetchAdapter.execute(req, ctx);
    ctx.timings.request = performance.now() - started;
    return res;
  },
};

const http = createHttpClient({ baseUrl: "https://api.example.com" });

await http.get("/x", { adapter: custom });
```

---

## См. также

- [`api.md`](./api.md) — справочник по публичному API
- [`hooks.md`](./hooks.md) — детали жизненного цикла хуков
- [`adapters.md`](./adapters.md) — адаптеры, ограничения `fetch`, таймауты
- [`architecture.md`](./architecture.md) — слои и расширяемость
