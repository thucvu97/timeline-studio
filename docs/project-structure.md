# Структура проекта Timeline Tauri App

Этот документ описывает структуру проекта Timeline Tauri App, объясняя назначение каждой директории и ключевых файлов.

## Обзор

Timeline Tauri App - это настольное приложение для создания и редактирования видео, построенное на базе:
- **Tauri** - фреймворк для создания кроссплатформенных приложений с веб-интерфейсом и бэкендом на Rust
- **React** - библиотека для создания пользовательского интерфейса
- **Next.js** - фреймворк для React с серверным рендерингом
- **XState** - библиотека для управления состоянием на основе конечных автоматов
- **Tailwind CSS** - утилитарный CSS-фреймворк

## Корневая структура

```
timeline-tauri/
├── .github/                # GitHub Actions и конфигурация CI/CD
├── .vscode/                # Настройки VS Code
├── docs/                   # Документация проекта
├── public/                 # Статические файлы
├── src/                    # Исходный код фронтенда (React, Next.js)
├── src-tauri/              # Исходный код бэкенда (Rust)
├── .eslintrc.json          # Конфигурация ESLint
├── .stylelintrc.json       # Конфигурация Stylelint
├── biome.json              # Конфигурация Biome
├── components.json         # Конфигурация UI компонентов
├── package.json            # Зависимости и скрипты Node.js
├── tailwind.config.js      # Конфигурация Tailwind CSS
└── tsconfig.json           # Конфигурация TypeScript
```

## Фронтенд (src/)

### Основная структура

```
src/
├── app/                    # Компоненты Next.js App Router
├── components/             # Общие компоненты
│   ├── ui/                 # UI компоненты (кнопки, поля ввода и т.д.)
│   └── ...                 # Другие общие компоненты
├── features/               # Функциональные модули приложения
│   ├── browser/            # Компоненты браузера файлов
│   ├── media-studio/       # Компоненты студии редактирования медиа
│   ├── modals/             # Модальные окна и диалоги
│   ├── project-settings/   # Настройки проекта
│   └── user-settings/      # Пользовательские настройки
├── hooks/                  # Пользовательские React хуки
├── i18n/                   # Интернационализация
├── lib/                    # Утилиты и вспомогательные функции
├── providers/              # React контекст-провайдеры
├── styles/                 # CSS стили
│   └── globals.css         # Глобальные стили и Tailwind CSS
└── types/                  # TypeScript типы
```

### Особенности структуры features/

Каждый функциональный модуль в директории `features/` имеет следующую структуру:

```
features/example-feature/
├── components/             # Компоненты, специфичные для этой функции
├── hooks/                  # Хуки, специфичные для этой функции
├── services/               # Сервисы и машины состояний
│   ├── example-machine.ts  # Машина состояний XState
│   └── example-machine.test.ts # Тесты для машины состояний
├── types/                  # Типы, специфичные для этой функции
└── index.ts                # Точка входа, экспортирующая публичное API
```

## Бэкенд (src-tauri/)

```
src-tauri/
├── icons/                  # Иконки приложения
├── src/                    # Исходный код Rust
│   ├── commands/           # Команды Tauri для взаимодействия с фронтендом
│   ├── services/           # Сервисы для работы с файловой системой, медиа и т.д.
│   └── main.rs             # Точка входа в Rust приложение
├── Cargo.toml              # Зависимости Rust
└── tauri.conf.json         # Конфигурация Tauri
```

## Ключевые файлы

### Конфигурационные файлы

- **package.json** - Зависимости и скрипты Node.js
- **tsconfig.json** - Конфигурация TypeScript
- **tailwind.config.js** - Конфигурация Tailwind CSS
- **.eslintrc.json** - Конфигурация ESLint
- **.stylelintrc.json** - Конфигурация Stylelint
- **biome.json** - Конфигурация Biome
- **src-tauri/tauri.conf.json** - Конфигурация Tauri

### Машины состояний

- **src/features/modals/services/modal-machine.ts** - Управление модальными окнами
- **src/features/project-settings/project-settings-machine.ts** - Управление настройками проекта
- **src/features/user-settings/user-settings-machine.ts** - Управление пользовательскими настройками
- **src/features/browser/media/media-machine.ts** - Управление медиафайлами

## Стили и UI

Проект использует Tailwind CSS для стилизации компонентов. Основные стили находятся в файле `src/styles/globals.css`.

UI компоненты построены с использованием библиотеки shadcn/ui, которая предоставляет набор доступных и настраиваемых компонентов на основе Radix UI.

## Тестирование

Тесты находятся рядом с тестируемыми файлами и имеют расширение `.test.ts` или `.test.tsx`.

```
src/features/example/
├── example-component.tsx
├── example-component.test.tsx  # Тест для компонента
├── services/
│   ├── example-machine.ts
│   └── example-machine.test.ts # Тест для машины состояний
```

## Линтинг и форматирование

Проект использует несколько инструментов для обеспечения качества кода:

- **ESLint** - для проверки JavaScript/TypeScript кода
- **Stylelint** - для проверки CSS кода
- **Biome** - для форматирования кода
- **Clippy** - для проверки Rust кода
- **rustfmt** - для форматирования Rust кода

## CI/CD

Проект настроен для использования GitHub Actions для непрерывной интеграции. Рабочие процессы находятся в директории `.github/workflows/`:

- **lint.yml** - Проверка JavaScript/TypeScript, CSS и Rust кода
- **lint-css.yml** - Проверка только CSS кода
- **build.yml** - Сборка проекта
- **check-all.yml** - Запуск всех проверок и тестов
