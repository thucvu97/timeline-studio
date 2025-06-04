# Timeline Studio

[English](README.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md)

[![Build Status](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/timeline-studio.svg)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/docs-TypeDoc-blue)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/website-Promo-brightgreen)](https://chatman-media.github.io/timeline-studio/)
[![Lint CSS](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-css.yml)
[![Lint TypeScript](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-js.yml)
[![Lint Rust](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml/badge.svg)](https://github.com/chatman-media/timeline-studio/actions/workflows/lint-rs.yml)
[![Telegram](https://img.shields.io/badge/Telegram-Join%20Group-blue?logo=telegram)](https://t.me/timelinestudio)

## Обзор проекта

Timeline Studio - это приложение для создания и редактирования видео на базе Tauri, React, XState, ffmpeg.

![Интерфейс таймлайна](/public/screen3.png)

### Ключевые особенности

- 🎬 Создание и редактирование видеопроектов
- 🖥️ Кроссплатформенность (Windows, macOS, Linux, Telegram Mini App)
- 🧠 Управление состоянием с помощью XState v5
- 🌐 Поддержка интернационализации (i18n)
- 🎨 Современный UI с использованием Tailwind CSS v4,shadcn-ui
- 🔍 Строгий контроль качества кода с помощью ESLint, Stylelint и Clippy
- 📚 Полная документация всех модулей

## Начало работы

### Предварительные требования

- [Node.js](https://nodejs.org/) (v18 или выше)
- [Rust](https://www.rust-lang.org/tools/install) (последняя стабильная версия)
- [bun](https://bun.sh/) (последняя стабильная версия)
- [ffmpeg](https://ffmpeg.org/download.html) (последняя стабильная версия)

### Установка

1. Клонируйте репозиторий:

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

2. Установите зависимости:

```bash
bun install
```

### Запуск в режиме разработки

```bash
bun run tauri dev
```

### Сборка для релиза

```bash
bun run tauri build
```

## Структура проекта

```
timeline-studio/
├── bin/                               # shell Скрипты
├── docs/                              # Автоматически генерируемая документация
├── docs-dev/                          # Документация формируемая в ходе разрабоки, в т.ч. для агентов
├── docs/                              # e2e тесты
├── examples/                          # Примеры использования апи
├── promo/                             # Cайт на github pages
├── public/                            # Static files
├── scripts/                           # Скрипты js
├── src/                               # Frontend source code (React, XState, Next.js)
│   ├── app/                           # Main application entry point
│   ├── components/                    # Shared components
│   ├── hooks/                         # Custom React hooks
│   ├── services/                      # Services for API calls and business logic
│   ├── features/                      # Фичи
│   │   ├── ai-chat/                   # AI-чат-бот (интерактивный помощник)
│   │   ├── app-state/                 # Глобальное состояние приложения
│   │   ├── browser/                   # Браузер медиафайлов (панель файлов)
│   │   ├── camera-capture/            # Захват видео/фото с камеры
│   │   ├── effects/                   # Видеоеффекты и их параметры
│   │   ├── export/                    # Экспорт видео и проектов
│   │   ├── filters/                   # Видеофильтры (цветокор, стили)
│   │   ├── keyboard-shortcuts/        # Горячие клавиши и пресеты
│   │   ├── media/                     # Работа с медиафайлами (аудио/видео)
│   │   ├── media-studio/              # Студия для работы с медиа
│   │   ├── modals/                    # Модальные окна (диалоги)
│   │   ├── music/                     # Импорт и управление музыкой
│   │   ├── options/                   # Настройки экспорта и проекта
│   │   ├── project-settings/          # Настройки проекта (размер, fps и др.)
│   │   ├── recognition/               # Распознавание сцен и объектов
│   │   ├── resources/                 # Управление ресурсами проекта
│   │   ├── style-templates/           # Стили и шаблоны оформления
│   │   ├── subtitles/                 # Импорт и редактирование субтитров
│   │   ├── templates/                 # Видео-шаблоны и пресеты
│   │   ├── timeline/                  # Основная монтажная лента (таймлайн)
│   │   ├── top-bar/                   # Верхняя панель управления
│   │   ├── transitions/               # Видеопереходы между клипами
│   │   ├── user-settings/             # Пользовательские настройки
│   │   ├── video-player/              # Видеоплеер
│   │   ├── voice-recording/           # Запись голоса и озвучка
│   │   ├── script-generator/          # Новый: генерация сценариев
│   │   ├── montage-planner/           # Новый: планирование монтажа
│   │   ├── person-identification/     # Новый: именование людей
│   │   ├── scene-analyzer/            # Новый: анализ сцен
│   │   └── README.md                  # Overview of all features
│   ├── i18n/                          # Internationalization
│   ├── lib/                           # Utilities and libraries
│   ├── styles/                        # Global styles
|   ├── test/                          # Test config and utilities
├── src-tauri/                         # Бэкенд (Rust)
│   ├── src/
│   │   ├── main.rs                    # Точка входа Tauri
│   │   ├── media.rs                   # Анализ медиа (FFmpeg)
│   │   ├── recognition.rs             # YOLO для объектов/лиц
│   │   ├── script_generator.rs        # Генерация сценариев (Claude/OpenAi/Grok API)
│   │   ├── montage_planner.rs         # Планирование монтажа
│   │   ├── person_identification.rs   # Идентификация людей
│   │   ├── scene_analyzer.rs          # Анализ сцен
│   │   └── ai_chat.rs                 # Обработка чата
└── package.json                       # Node.js dependencies configuration
```

## 📚 Документация

### 🗂️ Структура документации

Каждая feature содержит подробную документацию:

- **`README.md`** - функциональные требования, статус готовности
- **`DEV.md`** - техническая архитектура, API, типы данных

### 📋 Ключевые документы

- **`src/features/README.md`** - обзор всех фич с приоритетами
- **`DEV.md`** - архитектура приложения, машины состояний, план разработки
- **`README.md`** - общая информация о проекте (английский)
- **`README.es.md`** - испанская версия документации
- **`README.fr.md`** - французская версия документации
- **`README.de.md`** - немецкая версия документации
- **`README.ru.md`** - русская версия документации

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

### Машины состояний (XState v5)

Проект использует XState v5 для управления сложной логикой состояний.

#### ✅ Реализованные машины состояний (11):

- `appSettingsMachine` - централизованное управление настройками
- `browserStateMachine` - управление состоянием браузера
- `chatMachine` - управление AI чатом
- `modalMachine` - управление модальными окнами
- `playerMachine` - управление видеоплеером
- `resourcesMachine` - управление ресурсами таймлайна
- `userSettingsMachine` - пользовательские настройки
- `projectSettingsMachine` - настройки проекта
- `mediaMachine` - управление медиафайлами
- `timelineMachine` - Основная машина состояний таймлайна

### Тестирование

Проект использует Vitest для модульного тестирования. Тесты находятся в деректории фичи __tests__ там же лежат моки __mocks__.

#### 🧪 Статус покрытия тестами:
```bash
⨯ bun run test

 Test Files  141 passed (141)
      Tests  1295 passed | 9 skipped (1304)
   Start at  23:20:43
   Duration  13.14s (transform 3.71s, setup 25.13s, collect 13.88s, tests 8.69s, environment 38.26s, prepare 8.96s)

⨯ bun run test:rust
   test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.36s

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
npm install
npm run dev
```

Для сборки промо-страницы:

```bash
cd promo
npm run build
```

Промо-страница автоматически обновляется при изменении файлов в папке `promo/` в ветке `main` с помощью GitHub Actions workflow `deploy-promo.yml`.

## Дополнительные ресурсы

- [Next.js Documentation](https://nextjs.org/docs)
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
