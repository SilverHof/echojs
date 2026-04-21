import * as path from 'node:path';
import { defineConfig } from '@rspress/core';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  lang: 'ru',
  locales: [
    {
      lang: 'ru',
      label: 'Русский',
      title: '@echojs/http',
      description:
        'Type-safe, extensible HTTP client: immutable instances, normalized options model, hooks, adapters, strong error model.',
    },
    {
      lang: 'en',
      label: 'English',
      title: '@echojs/http',
      description:
        'Type-safe, extensible HTTP client: immutable instances, normalized options model, hooks, adapters, strong error model.',
    },
  ],
  title: '@echojs/http',
  description:
    'Type-safe, extensible HTTP client: immutable instances, normalized options model, hooks, adapters, strong error model.',
  icon: '/echojs.svg',
  logo: {
    light: '/echojs.svg',
    dark: '/echojs.svg',
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/echojs',
      },
    ],
  },
});
