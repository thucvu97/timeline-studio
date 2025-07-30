# Timeline Studio Promo Site

Официальный промо-сайт Timeline Studio - профессионального AI-powered видеоредактора.

## 🌐 Живая версия

Сайт доступен по адресу: [https://timelinestudio.pro](https://timelinestudio.pro)

## 🛠️ Технологии

- **React 19** с TypeScript
- **Vite** для быстрой сборки
- **React Router** с HashRouter для GitHub Pages
- **Tailwind CSS v4** для стилизации
- **Framer Motion** для анимаций
- **GitHub Pages** для хостинга

## 🚀 Начало работы

### Установка зависимостей

```bash
cd promo
bun install
```

### Локальная разработка

```bash
bun run dev
```

Сайт будет доступен по адресу: http://localhost:5173

### Сборка для продакшена

```bash
bun run build
```

Готовые файлы будут в папке `dist/`

### Предпросмотр собранной версии

```bash
bun run preview
```

## 📁 Структура проекта

```
promo/
├── src/
│   ├── components/     # React компоненты
│   ├── pages/         # Страницы сайта
│   ├── hooks/         # Custom hooks
│   ├── utils/         # Утилиты
│   └── main.tsx       # Точка входа
├── public/            # Статические файлы
│   ├── favicon/       # Иконки сайта
│   └── 404.html       # Fallback для GitHub Pages
├── content/           # Markdown контент
│   ├── blog/          # Статьи блога
│   └── changelog/     # История изменений
└── dist/              # Собранный сайт (gitignored)
```

## 🔗 Навигация

Сайт использует HashRouter для совместимости с GitHub Pages:

- Главная: `https://timelinestudio.pro/`
- О продукте: `https://timelinestudio.pro/#/about`
- Цены: `https://timelinestudio.pro/#/pricing`
- Changelog: `https://timelinestudio.pro/#/changelog`
- Блог: `https://timelinestudio.pro/#/blog`
- Документация: `https://timelinestudio.pro/#/docs`
- FAQ: `https://timelinestudio.pro/#/faq`

## 📝 Контент

### Блог

Статьи блога хранятся в `content/blog/` в формате Markdown. Для добавления новой статьи:

1. Создайте файл `content/blog/your-article-slug.md`
2. Добавьте метаданные в начало файла:
```markdown
---
title: "Заголовок статьи"
date: "2025-07-30"
excerpt: "Краткое описание"
author: "Имя автора"
---

Содержание статьи...
```

### Changelog

История изменений автоматически синхронизируется из основного репозитория.

## 🚀 Деплой

Сайт автоматически деплоится на GitHub Pages при пуше в основной репозиторий. См. [DEPLOYMENT.md](./DEPLOYMENT.md) для подробностей.

## 🎨 Дизайн

- **Цветовая схема**: Темная тема с фиолетовыми акцентами
- **Типографика**: Bebas Neue для заголовков, Inter для текста
- **Анимации**: Плавные переходы и glassmorphism эффекты
- **Адаптивность**: Полностью респонсивный дизайн

## 📄 Лицензия

Все права защищены © 2025 Timeline Studio