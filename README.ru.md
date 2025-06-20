# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![Статус сборки](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=сборка)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Тесты](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=тесты)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Линтинг CSS](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-css.yml?style=for-the-badge&label=линтинг%20css)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Линтинг TypeScript](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-js.yml?style=for-the-badge&label=линтинг%20ts)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Линтинг Rust](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/lint-rs.yml?style=for-the-badge&label=линтинг%20rust)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)

[![Покрытие фронтенда](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=frontend&style=for-the-badge&label=покрытие%20фронтенда)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Покрытие бэкенда](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?flag=backend&style=for-the-badge&label=покрытие%20бэкенда)](https://codecov.io/gh/chatman-media/timeline-studio)
[![E2E Тесты](https://img.shields.io/badge/E2E%20Тесты-Playwright-45ba4b?style=for-the-badge&logo=playwright)](https://github.com/chatman-media/timeline-studio/tree/main/e2e)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Discord-Join%20Server-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)

## Обзор проекта

Timeline Studio - это современный видеоредактор, построенный на архитектуре Tauri (Rust + React).

**Наша цель**: создать редактор, сочетающий:
- **Профессиональную мощь DaVinci Resolve** - полный контроль над монтажом, цветокоррекцией, микшированием звука, визуальными эффектами, моушн-графикой и продвинутым композитингом
- **Обширную творческую библиотеку** - эффекты, фильтры, переходы, многокамерные шаблоны, анимированные титры, стили оформления и пресеты субтитров, сравнимые с популярными редакторами типа Filmora
- **AI-скриптинг и автоматизацию** - автоматическая генерация контента на разных языках и для разных платформ

**Ключевая инновация**: Пользователю достаточно загрузить видео, музыку и другие ресурсы, а AI автоматически создаст набор видео на разных языках и оптимизированных под разные платформы (YouTube, TikTok, Vimeo, Telegram).

![Интерфейс таймлайна #1](/public/screen2.png)

![Интерфейс таймлайна #2](/public/screen4.png)

### Статус проекта (июнь 2025)

**Общая готовность: 53.8%** ⬆️ (пересчитано с учетом реального состояния модулей и 14 новых планируемых модулей)
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
- 🔄 **Панель ресурсов** - основной UI готов, не хватает drag & drop (80%)
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

### Быстрый старт

```bash
# Режим разработки
bun run tauri dev

# Запуск тестов
bun run test && bun run test:rust

# Проверка качества кода
bun run check:all
```

### Основные команды

| Команда | Описание |
|---------|----------|
| `bun run tauri dev` | Запуск полного приложения в разработке |
| `bun run dev` | Запуск только фронтенда |
| `bun run build` | Сборка для продакшена |
| `bun run test` | Запуск тестов фронтенда |
| `bun run test:rust` | Запуск тестов бэкенда |
| `bun run lint` | Проверка качества кода |
| `bun run fix:all` | Автоисправление ошибок кода |

📚 **[Полное руководство разработчика →](docs-ru/05-development/README.md)**

### Статус покрытия тестами

✅ **Тесты фронтенда**: 3,623 прошли
✅ **Тесты бэкенда**: 655 прошли
✅ **Тесты e2e**: 801 прошли
📊 **Всего**: >5000 тестов проходят

## CI/CD и качество кода

### Автоматизированные процессы
- ✅ **Линтинг**: ESLint, Stylelint, Clippy
- ✅ **Тестирование**: Фронтенд (Vitest), Бэкенд (Rust), E2E (Playwright)
- ✅ **Покрытие**: Интеграция с Codecov
- ✅ **Сборка**: Кроссплатформенные сборки

📚 **[Подробное руководство по CI/CD →](docs-ru/06-deployment/README.md)**  
🔧 **[Линтинг и форматирование →](docs-ru/05-development/linting-and-formatting.md)**

## Документация и ресурсы

- 📚 [**Документация API**](https://chatman-media.github.io/timeline-studio/api-docs/) - Автогенерируемая документация TypeScript
- 🚀 [**Промо-страница**](https://chatman-media.github.io/timeline-studio/) - Презентация проекта
- 📖 [**Полная документация**](docs-ru/README.md) - Полное руководство на русском
- 🎬 [**Живая демонстрация**](https://chatman-media.github.io/timeline-studio/) - Попробуйте редактор онлайн

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
