# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Frontend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://codecov.io/gh/chatman-media/timeline-studio/branch/main/graph/badge.svg?token=ee5ebdfd-4bff-4c8c-8cca-36a0448df9de&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)

[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Обзор проекта

Timeline Studio — это профессиональное приложение для видеомонтажа, построенное на современных веб-технологиях с нативной производительностью. Наша цель — создать редактор уровня DaVinci Resolve, доступный каждому.

![Интерфейс таймлайна #1](/public/screen2.png)

![Интерфейс таймлайна #2](/public/screen4.png)

### Статус проекта (июнь 2025)

**Общая готовность: 53.4%** ⬆️ (пересчитано с учетом реального состояния модулей и 14 новых планируемых модулей)
- **Завершено**: 11 модулей (100% готовности) 
- **В разработке**: 8 модулей (45-85% готовности)
- **Планируется**: 5 модулей (30-85% готовности)
- **Новые планируемые**: 14 модулей (0% готовности) - [подробности в planned/](docs-ru/08-roadmap/planned/)

### Ключевые достижения:
- ✅ **Video Compiler** - полностью реализован с GPU ускорением (100%)
- ✅ **Timeline** - основной редактор полностью функционален (100%)
- ✅ **Media Management** - управление файлами готово (100%)
- ✅ **Core Architecture** - app-state, browser, modals, user/project settings (100%)
- ✅ **Recognition** - YOLO v11 распознавание объектов и лиц (100%)
- 🔄 **Effects/Filters/Transitions** - богатая библиотека эффектов в стиле Filmora (75-80%)
- 🔄 **Export** - почти готов, остались детали параметров (85%)
- ❗ **Resources UI** - отсутствуют UI компоненты (40%)
- ❗ **AI Chat** - требует реальная API интеграция (30%)
- 📋 **14 новых планируемых модулей** - [см. planned/](docs-ru/08-roadmap/planned/) для достижения уровня DaVinci + Filmora
- 🎯 **Цель** - сочетание мощи DaVinci и библиотеки Filmora с AI автоматизацией

## Ключевые возможности

- 🎬 Профессиональный видеомонтаж с многодорожечным таймлайном
- 🖥️ Кроссплатформенность (Windows, macOS, Linux)
- 🚀 GPU-ускоренная обработка видео (NVENC, QuickSync, VideoToolbox)
- 🤖 ИИ-распознавание объектов/лиц (YOLO v11 - ORT исправлен)
- 🎨 30+ переходов, визуальных эффектов и фильтров
- 📝 Продвинутая система субтитров с 12 стилями и анимациями
- 🎵 Многодорожечное аудиоредактирование с эффектами
- 📤 Экспорт в MP4/MOV/WebM с OAuth интеграцией соцсетей
- 🔐 Поддержка OAuth для YouTube/TikTok/Vimeo/Telegram с безопасным хранением токенов
- 📱 Пресеты устройств (iPhone, iPad, Android) для оптимизированного экспорта
- 🧠 Управление состоянием с помощью XState v5
- 🌐 Поддержка интернационализации (11 языков)
- 💾 Умное кэширование и унифицированная система превью
- 🎨 Современный UI с использованием Tailwind CSS v4, shadcn-ui
- 📚 Полная документация с 2400+ тестами (98.8% успешных)

## Начало работы

### Требования

- [Node.js](https://nodejs.org/) (версия 18 или выше)
- [Rust](https://www.rust-lang.org/tools/install) (последняя стабильная версия)
- [bun](https://bun.sh/) (последняя стабильная версия)
- [ffmpeg](https://ffmpeg.org/download.html) (последняя стабильная версия)

### Установка

1. Клонирование репозитория:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Установка зависимостей:

```bash
bun install
```

### Запуск в режиме разработки

```bash
bun run tauri dev
```

### Сборка релиза

```bash
bun run tauri build
```

## Документация

### 📚 Основная документация

- 📚 [Обзор документации](docs-ru/README.md) - Полная карта документации
- 🚀 [Начало работы](docs-ru/01-getting-started/README.md) - Установка и первые шаги
- 🏗️ [Руководство по архитектуре](docs-ru/02-architecture/README.md) - Архитектура системы
- 🎯 [Руководство по функциям](docs-ru/03-features/README.md) - Обзор функций и статус
- 📡 [Справочник API](docs-ru/04-api-reference/README.md) - Справочник команд Tauri
- 🧪 [Руководство разработчика](docs-ru/05-development/README.md) - Тестирование и разработка
- 🚀 [Руководство по развертыванию](docs-ru/06-deployment/README.md) - Сборка и развертывание
- 📋 [Пользовательские руководства](docs-ru/07-guides/README.md) - Производительность и лучшие практики
- 🛣️ [Дорожная карта](docs-ru/08-roadmap/README.md) - Дорожная карта разработки
- 🔐 [Настройка OAuth](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Интеграция с социальными сетями

### 📋 Документация проекта

- **`src/features/README.md`** - обзор всех функций с приоритетами и статусом
- **Языковые версии**: Доступны на 11 языках через переключатель выше

## Разработка

### Доступные скрипты

- `bun run dev` - Запуск Next.js в режиме разработки
- `bun run tauri dev` - Запуск Tauri в режиме разработки
- `bun run build` - Сборка Next.js
- `bun run tauri build` - Сборка Tauri приложения

#### Линтинг и форматирование

- `bun run lint` - Проверка JavaScript/TypeScript кода с помощью ESLint
- `bun run lint:fix` - Исправление ошибок ESLint
- `bun run lint:css` - Проверка CSS кода с помощью Stylelint
- `bun run lint:css:fix` - Исправление ошибок Stylelint
- `bun run format:imports` - Форматирование импортов
- `bun run lint:rust` - Проверка Rust кода с помощью Clippy
- `bun run format:rust` - Форматирование Rust кода с помощью rustfmt
- `bun run check:all` - Запуск всех проверок и тестов
- `bun run fix:all` - Исправление всех ошибок линтинга

#### Тестирование

- `bun run test` - Запуск тестов
- `bun run test:app` - Запуск тестов только для компонентов приложения
- `bun run test:coverage` - Запуск тестов с отчетом о покрытии
- `bun run test:ui` - Запуск тестов с UI интерфейсом
- `bun run test:e2e` - Запуск end-to-end тестов с Playwright

### Тестирование

Проект использует Vitest для модульного тестирования. Тесты расположены в директории __tests__ функции, а моки в __mocks__.

#### 🧪 Статус покрытия тестами:
```bash
⨯ bun run test

 Test Files  242 passed | 1 skipped (243)
      Tests  3284 passed | 60 skipped (3344)
   Start at  16:17:39
   Duration  29.44s (transform 5.03s, setup 47.28s, collect 22.85s, tests 32.74s, environment 74.05s, prepare 22.21s)

⨯ bun run test:rust
   test result: ok. 366 passed; 0 failed; 2 ignored; 0 measured; 0 filtered out; finished in 12.38s

```

```bash
# Запуск тестов клиента
bun run test

# Запуск тестов rust
bun run test:rust

# Запуск тестов с отчетом о покрытии
bun run test:coverage

# Запуск тестов для конкретной функции
bun run test src/features/effects
```

## Непрерывная интеграция и развертывание

Проект настроен для использования GitHub Actions для непрерывной интеграции и развертывания. Рабочие процессы:

### Проверка и сборка

- `check-all.yml` - Запуск всех проверок и тестов
- `lint-css.yml` - Проверка только CSS кода (запускается при изменении CSS файлов)
- `lint-rs.yml` - Проверка только Rust кода (запускается при изменении Rust файлов)
- `lint-js.yml` - Проверка только JavaScript/TypeScript кода (запускается при изменении JavaScript/TypeScript файлов)

### Развертывание

- `build.yml` - Сборка проекта
- `build-release.yml` - Сборка проекта для релиза
- `deploy-promo.yml` - Сборка и публикация промо-страницы на GitHub Pages
- `docs.yml` - Генерация и публикация API документации на GitHub Pages

### Конфигурация линтеров

#### Stylelint (CSS)

Проект использует Stylelint для проверки CSS кода. Конфигурация находится в файле `.stylelintrc.json`. Основные особенности:

- Поддержка Tailwind CSS директив
- Игнорирование дублирующихся селекторов для совместимости с Tailwind
- Автоматическое исправление ошибок при сохранении файла (в VS Code)

Для запуска CSS линтера используйте команду:

```bash
bun lint:css
```

Для автоматического исправления ошибок:

```bash
bun lint:css:fix
```

## Документация API

Документация API доступна по адресу: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Для локальной генерации документации используйте команду:

```bash
bun run docs
```

Документация будет доступна в папке `docs/`.

Для разработки документации в режиме реального времени используйте:

```bash
bun run docs:watch
```

Документация автоматически обновляется при изменении исходного кода в ветке `main` с помощью GitHub Actions workflow `docs.yml`.

## Промо-страница

Промо-страница проекта доступна по адресу: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)

Исходный код промо-страницы находится в папке `promo/`.

Для локальной разработки промо-страницы используйте команды:

```bash
cd promo
bun install
bun run dev
```

Для сборки промо-страницы:

```bash
cd promo
bun run build
```

Промо-страница автоматически обновляется при изменении файлов в папке `promo/` в ветке `main` с помощью GitHub Actions workflow `deploy-promo.yml`.

## Дополнительные ресурсы

- [Tauri Documentation](https://v2.tauri.app/start/)
- [XState Documentation](https://xstate.js.org/docs/)
- [Vitest Documentation](https://vitest.dev/guide/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com/)
- [Stylelint Documentation](https://stylelint.io/)
- [ESLint Documentation](https://eslint.org/docs/latest/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [TypeDoc Documentation](https://typedoc.org/)
- [ffmpeg Documentation](https://ffmpeg.org/documentation.html)

## Лицензия

Данный проект распространяется под лицензией MIT с условием Commons Clause.

**Основные условия:**

- **Открытый исходный код**: Вы можете свободно использовать, модифицировать и распространять код в соответствии с условиями лицензии MIT.
- **Ограничение на коммерческое использование**: Commons Clause запрещает "продажу" программного обеспечения без отдельного соглашения с автором.
- **"Продажа"** означает использование функциональности программного обеспечения для предоставления третьим лицам продукта или услуги за плату.

Эта лицензия позволяет:

- Использовать код для личных и некоммерческих проектов
- Изучать и модифицировать код
- Распространять модификации под той же лицензией

Но запрещает:

- Создавать коммерческие продукты или услуги на основе кода без лицензии

Для получения коммерческой лицензии, пожалуйста, свяжитесь с автором: ak.chatman.media@gmail.com

Полный текст лицензии доступен в файле [LICENSE](./LICENSE)

## GitHub Pages

Проект использует GitHub Pages для размещения документации API и промо-страницы:

- **Промо-страница**: [https://chatman-media.github.io/timeline-studio/](https://chatman-media.github.io/timeline-studio/)
- **Документация API**: [https://chatman-media.github.io/timeline-studio/api-docs/](https://chatman-media.github.io/timeline-studio/api-docs/)

Обе страницы автоматически обновляются при изменении соответствующих файлов в ветке `main` с помощью GitHub Actions workflows.
