# Subtitles - Функциональные требования

## 📁 Структура проекта

```
src/features/subtitles/
├── components/           # React компоненты
│   ├── subtitle-list.tsx # Основной список субтитров
│   ├── subtitle-group.tsx # Группировка субтитров
│   └── subtitle-preview.tsx # Превью субтитра с текстом
├── hooks/               # React хуки
│   └── use-subtitle-styles.ts # Хуки для работы с субтитрами
├── utils/               # Утилиты
│   ├── subtitle-processor.ts # Обработка данных субтитров
│   └── css-styles.ts    # CSS-стили и утилиты
├── tests/               # Тесты
│   └── subtitle-list.test.tsx # Тесты компонентов
├── examples/            # Примеры использования
│   └── hooks-usage.md   # Документация по API
├── index.ts            # Экспорты модуля
├── README.md           # Документация
└── DEV.md             # Техническая документация
```

## 📊 Данные

```
src/data/
├── subtitle-styles.json     # 12 профессиональных субтитров
└── subtitle-categories.json # 6 категорий с переводами
```

## 📋 Статус готовности

- ✅ **Компоненты**: Полностью реализованы (SubtitleList, SubtitleGroup, SubtitlePreview)
- ✅ **Хуки**: Полностью реализованы (useSubtitles, useSubtitleById, useSubtitlesByCategory, useSubtitlesSearch)
- ✅ **Данные**: JSON структура с 12 субтитрами и 6 категориями
- ✅ **Утилиты**: Обработка данных и CSS-стили
- ✅ **Тесты**: Покрыты тестами
- ✅ **Интернационализация**: Поддержка 5 языков
- ✅ **CSS-стили**: Полная поддержка всех параметров типографики
- ✅ **Архитектура**: Организована по аналогии с effects и filters

## 🎯 Основные функции

### ✅ Готово
- [x] **SubtitleList** - список доступных субтитров с фильтрацией, сортировкой и группировкой
- [x] **SubtitleGroup** - группировка субтитров по категориям
- [x] **SubtitlePreview** - превью субтитров с демонстрацией текста
- [x] **useSubtitles** - хук для загрузки субтитров из JSON
- [x] **JSON данные** - 12 профессиональных субтитров в отдельных файлах
- [x] **Интеграция с Browser** - полная интеграция с табами браузера
- [x] **Типизированные субтитры** - полная типизация TypeScript
- [x] **CSS-стили** - поддержка всех параметров типографики
- [x] **Интернационализация** - переводы на 5 языков
- [x] **Индикаторы** - сложность и категория для каждого субтитра
- [x] **Утилиты** - обработка данных, валидация, CSS-генерация

#### Категории субтитров 🎨
- [x] **Basic** - Базовые (Basic White, Basic Yellow)
- [x] **Cinematic** - Кинематографические (Elegant, Bold)
- [x] **Stylized** - Стилизованные (Neon, Retro)
- [x] **Minimal** - Минималистичные (Clean, Background)
- [x] **Animated** - Анимированные (Typewriter, Fade)
- [x] **Modern** - Современные (Sans, Gradient)

#### Расширенные возможности ✨
- [x] **12 субтитров** - профессиональная библиотека типографических субтитров
- [x] **Уровни сложности** - базовый, средний, продвинутый
- [x] **Полная интернационализация** - поддержка 5 языков (ru, en, es, fr, de)
- [x] **JSON структура данных** - субтитры и категории в отдельных файлах
- [x] **Утилитарные функции** - поиск, фильтрация, группировка, валидация
- [x] **Расширенные фильтры** - по категории, сложности, тегам
- [x] **CSS превью** - типографические субтитры для предпросмотра
- [x] **Профессиональные теги** - elegant, cinematic, animated и др.
- [x] **Обработка ошибок** - fallback данные при ошибках загрузки
- [x] **Модульная архитектура** - компоненты, хуки, утилиты отдельно
- [x] **Анимации** - поддержка CSS анимаций для динамических субтитров
- [x] **Градиенты** - современные градиентные субтитры

### ❌ Требует реализации
- [ ] Создание новых субтитров
- [ ] Редактирование текста субтитров
- [ ] Синхронизация с видео
- [ ] Экспорт в различные форматы (SRT, VTT, ASS)
- [ ] Временные метки для субтитров

## 🔄 Интеграция с другими компонентами

### ✅ Реализовано
- [x] Интеграция с Browser (полная поддержка табов)
- [x] Использование в Resources (добавление в проект)
- [x] Поддержка избранного через Media контекст
- [x] Интеграция с настройками проекта (соотношение сторон)
- [x] Консистентность с архитектурой Effects и Filters

### ❌ Требует реализации
- [ ] Отображение на Timeline
- [ ] Синхронизация с VideoPlayer
- [ ] Экспорт субтитров с видео

## 🛠️ API и хуки

### useSubtitles()
Основной хук для загрузки всех субтитров
```typescript
const { subtitles, loading, error, reload, isReady } = useSubtitles();
```

### useSubtitleById(id: string)
Получение конкретного субтитра по ID
```typescript
const subtitle = useSubtitleById('basic-white');
```

### useSubtitlesByCategory(category: string)
Субтитры определенной категории
```typescript
const cinematicSubtitles = useSubtitlesByCategory('cinematic');
```

### useSubtitlesSearch(query: string, lang?: 'ru' | 'en')
Поиск субтитров
```typescript
const results = useSubtitlesSearch('белый', 'ru');
```

## 🧪 Утилиты

### subtitle-processor.ts
- `processSubtitleStyles()` - обработка сырых данных
- `validateSubtitleStylesData()` - валидация структуры
- `createFallbackSubtitleStyle()` - создание fallback стилей
- `searchSubtitleStyles()` - поиск стилей
- `groupSubtitleStyles()` - группировка стилей
- `sortSubtitleStyles()` - сортировка стилей

### css-styles.ts
- `subtitleStyleToCSS()` - конвертация в React CSS
- `applySubtitleStyle()` - применение к элементу
- `resetSubtitleStyle()` - сброс стиля
- `generateSubtitleCSS()` - генерация CSS класса
- `subtitleAnimations` - предустановленные анимации
- `validateSubtitleStyle()` - валидация CSS стилей
