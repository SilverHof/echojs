---
pageType: home

hero:
  name: EchoJS
  text: Экосистема TypeScript-пакетов @echojs
  tagline: Собираю фреймворк как набор совместимых, строго типизированных кирпичей — без магии и с честными границами рантайма.
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started/
    - theme: alt
      text: Explore Packages
      link: /packages/
    - theme: alt
      text: Open @echojs/http
      link: /packages/http/
  image:
    src: /echojs.svg
    alt: EchoJS
features:
  - title: Экосистема, а не монолит
    details: Пакеты проектируются как совместимые уровни (core → UI → web), чтобы можно было подключать только нужное.
    icon: 🧩
    link: /packages/
  - title: Типы как контракт
    details: Публичный API — это exports + TypeScript. Документация и API reference строятся вокруг реально экспортируемых символов.
    icon: 🧠
    link: /api/
  - title: Расширяемость без магии
    details: Там, где нужна “сила”, используются явные расширения (хуки/адаптеры/плагины), а не скрытые глобальные интерсепторы.
    icon: 🔌
    link: /packages/http/
  - title: Честные границы рантайма
    details: Поведение, которое зависит от среды выполнения (Node/Bun/Browser), документируется и изолируется на уровне адаптеров.
    icon: 🧭
    link: /packages/http/
---

## С чего начать

- Если нужен production-grade HTTP клиент, начни с [`@echojs/http`](/packages/http/).
- Если нужна строгая реактивность как фундамент для UI, смотри [`@echojs/reactivity`](/packages/reactivity/).

