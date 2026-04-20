# `echojs-reactivity`

Минималистичная **строгая** реактивность для Echo JS, построенная поверх `alien-signals`, но с **собственным surface API**.

## Зачем отдельный API поверх `alien-signals`

`alien-signals` — быстрый низкоуровневый движок, но его публичный API (callable-сигналы, `trigger()` и т.д.) не совпадает с тем, как удобно и безопасно писать Echo-код.

Цели этого пакета:

- **объектный API**, который проще читать и сложнее использовать неправильно
- **строгое разделение** writable / readonly
- **запрет случайных мутаций** через `.value()`
- **изолировать движок**: сегодня `alien-signals` внутри, завтра можно заменить engine без слома API

## Установка

Внутри монорепы:

```bash
bun add echojs-reactivity
```

## Примеры

Живые примеры лежат в `examples/`:

- `examples/basic.ts`
- `examples/object-state.ts`
- `examples/peek-and-subscribe.ts`

## Быстрый старт

```ts
import { signal, computed, effect } from "echojs-reactivity";

const $count = signal(0);
const $double = computed(() => $count.value() * 2);

effect(() => {
  console.log($double.value());
});

$count.set(2);
$count.update((v) => v + 1);
```

## Документация / API

## Модель исполнения (важно)

- **`effect()` запускается сразу** (синхронно) и затем перезапускается при изменении зависимостей.
- **`computed()` ленивый**: он пересчитывается по требованию (когда его читают) и инвалидируется при изменении зависимостей.
- **`batch()`** откладывает обработку реакций/эффектов до конца батча.

### `signal(initial)`

Создаёт writable signal (объект).

- **читать**: `.value()` (с трекингом)
- **читать без трекинга**: `.peek()`
- **писать**: `.set(next)`
- **обновлять от предыдущего**: `.update(prev => next)`
- **подписаться**: `.subscribe(fn)` → `unsubscribe`
- **readonly facade**: `.readonly()`

#### Контракт

- `.value()` и `.peek()` возвращают текущее значение.
- `.value()` **участвует** в трекинге зависимостей.
- `.peek()` **не участвует** в трекинге (полезно внутри эффектов, чтобы не подписываться).
- `.set(next)` и `.update(fn)` — единственные поддерживаемые способы записи.
- `.subscribe(fn)` вызывает `fn` **только когда значение реально изменилось** (по `Object.is`).
- `.subscribe(fn)` **не вызывает** `fn` сразу при подписке (только на изменения).

#### Ошибки

- `signal()` без аргумента бросает `TypeError`.

### `computed(() => value)`

Создаёт readonly/computed signal (объект) с методами:

- `.value()`
- `.peek()`
- `.subscribe(fn)`

#### Ошибки

- `computed(getter)` бросает `TypeError`, если `getter` не функция.

### `effect(fn)`

Запускает эффект. Возвращает disposer:

```ts
const stop = effect(() => {
  console.log("count:", $count.value());
});

stop();
```

#### Ошибки

- `effect(fn)` бросает `TypeError`, если `fn` не функция.

### `batch(fn)`

Группирует несколько обновлений так, чтобы реакции/эффекты обработались один раз после батча:

```ts
batch(() => {
  $a.set(1);
  $b.set(2);
});
```

#### Ошибки

- `batch(fn)` бросает `TypeError`, если `fn` не функция.

### `scope(fn)`

Запускает effect-scope. Возвращает disposer. Всё, что создано внутри `scope`, будет очищено на `stopScope()`:

```ts
const stopScope = scope(() => {
  effect(() => {
    console.log($count.value());
  });
});

stopScope();
```

#### Ошибки

- `scope(fn)` бросает `TypeError`, если `fn` не функция.

### `readonly($signal)`

Возвращает readonly facade (без `.set()`/`.update()`), чтобы нельзя было случайно мутировать состояние.

### `isSignal(x)` / `isReadonlySignal(x)`

Проверки на экземпляры сигналов этого пакета.

## `.value()` и запрет мутаций

Главное правило: **запись только через `.set()`/`.update()`**.

На уровне типов `.value()` для объектов/массивов возвращает `DeepReadonly<T>`, чтобы у вас не появлялся соблазн делать:

```ts
const $user = signal({ name: "Vova", tags: ["a"] });

const user = $user.value();
// user.name = "x"      // TS error
// user.tags.push("b")  // TS error
```

Правильный способ — immutable update:

```ts
const $state = signal({
  user: { name: "Vova" },
  tags: ["a"],
});

$state.update((prev) => ({
  ...prev,
  tags: [...prev.tags, "b"],
}));
```

## Dev freeze

В dev-режиме (когда `NODE_ENV !== "production"`) значения-объекты/массивы, записанные в сигнал, **deep-freeze**-ятся.

Это означает, что любые прямые мутации будут падать предсказуемо (обычно `TypeError`), и вы быстро увидите неправильное место в коде.

## Intentionally not implemented (v0)

- **Публичный `trigger()`** — намеренно не экспортируется. Мы не хотим поддерживать паттерн «мутируй руками и потом триггери».
- **Proxy-based deep mutations / draft API** (`mutate(draft => ...)`, `alien-deepsignals`, и т.п.) — сознательно не входят в core v0.

## FAQ

### Почему `.value()` возвращает `DeepReadonly` для объектов/массивов?

Чтобы не поощрять паттерн “прочитал объект → мутировал поле”. Запись должна происходить через `.set()`/`.update()`, чтобы реактивность была предсказуемой и без `trigger()`.

### Почему `subscribe()` не вызывает callback сразу?

Это намеренный контракт: `subscribe()` — только про **изменения**. Если нужно “сразу и дальше”, делайте:

```ts
fn();
const unsub = $sig.subscribe(fn);
```


