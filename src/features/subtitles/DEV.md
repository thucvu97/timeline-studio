# Subtitles - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура
```
src/features/subtitles/
├── components/
│   ├── subtitle-list.tsx ✅
│   ├── subtitle-group.tsx ✅
│   └── subtitle-preview.tsx ✅
├── hooks/
│   ├── use-subtitle-styles.ts ✅
│   └── use-subtitles-import.ts ✅
├── utils/
│   ├── css-styles.ts ✅
│   └── subtitle-processor.ts ✅
├── data/
│   ├── subtitle-styles.json ✅
│   └── subtitle-categories.json ✅
├── types/
│   ├── index.ts ✅
│   └── subtitles.ts ✅
├── __tests__/
│   ├── components/
│   │   ├── subtitle-list.test.tsx ✅
│   │   ├── subtitle-group.test.tsx ✅
│   │   └── subtitle-preview.test.tsx ✅
│   ├── css-styles.test.ts ✅
│   ├── subtitle-processor.test.ts ✅
│   └── use-subtitle-styles.test.ts ✅
├── examples/
│   └── hooks-usage.md ✅
├── README.md ✅
├── DEV.md ✅
└── index.ts ✅
```

## 📊 Тестовое покрытие

### Общее покрытие

- **Всего тестов**: 91 (83 проходят, 8 пропущены) ✅
- **Покрытие кода**: 
  - Общее: ~70% ⚠️ (значительно улучшено с 8.4%)
  - По категориям:

### Покрытие по категориям

- **Компоненты**: 69.67% ⚠️
  - subtitle-list.tsx: 56.81% (тесты улучшены)
  - subtitle-preview.tsx: 82.17% ✅
  - subtitle-group.tsx: покрыт ✅
- **Хуки**: ~30% ⚠️
  - use-subtitle-styles.ts: тесты добавлены
  - use-subtitles-import.ts: тесты добавлены  
- **Утилиты**: ~70% ✅
  - css-styles.ts: 92.06% ✅
  - subtitle-processor.ts: тесты добавлены ✅
- **Типы**: 100% ✅

### Приоритеты для улучшения покрытия

1. **Компоненты** (текущее: 69.67%):
   - [x] `SubtitlePreview` - 82.17% ✅
   - [x] `SubtitleList` - 56.81% ✅ (фильтрация и избранное протестированы)
   - [x] `SubtitleGroup` - покрыт ✅

2. **Хуки** (улучшено):
   - [x] `useSubtitleStyles` - тесты добавлены ✅
   - [x] `use-subtitles-import` - тесты добавлены ✅

3. **Утилиты** (улучшено):
   - [x] `css-styles` - 92.06% ✅
   - [x] `subtitle-processor` - тесты добавлены ✅

## 🏗️ Архитектура компонентов

### SubtitleList
**Файл**: `components/subtitle-list.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ⚠️ Частично покрыт (56.81%)
**Функционал**:
- Отображение списка стилей субтитров
- Фильтрация по категориям
- Поиск по названию
- Интеграция с Browser компонентом

### SubtitleGroup
**Файл**: `components/subtitle-group.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ Покрыт
**Функционал**:
- Группировка субтитров по категориям
- Отображение счетчиков
- Раскрывающиеся секции

### SubtitlePreview
**Файл**: `components/subtitle-preview.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ Хорошо покрыт (82.17%)
**Функционал**:
- Предпросмотр стиля субтитра
- Демонстрация текста с примененными стилями
- Индикаторы сложности и категории
- Кнопки добавления в проект и избранное

## 📦 Типы данных

### SubtitleStyle
```typescript
interface SubtitleStyle {
  id: string
  name: string
  category: string
  complexity: string
  tags: string[]
  description: { ru: string; en: string }
  labels: { ru: string; en: string }
  style: {
    color?: string
    fontSize?: number
    fontFamily?: string
    fontWeight?: string
    textAlign?: string
    backgroundColor?: string
    padding?: string
    borderRadius?: string
    textShadow?: string
    letterSpacing?: number
    lineHeight?: number
    animation?: string
    // Градиенты
    background?: string
    WebkitBackgroundClip?: string
    WebkitTextFillColor?: string
  }
}
```

## 🔌 Интеграция

### Зависимости
- **ResourcesProvider**: Для управления добавленными субтитрами
- **BrowserStateProvider**: Для фильтрации и поиска
- **AppSettingsProvider**: Для локализации
- **ProjectSettingsProvider**: Для соотношения сторон

### Использование
```tsx
import { SubtitleList } from '@/features/subtitles'

// В компоненте браузера
<SubtitleList />
```

## 🎨 Стили субтитров

### Категории
- **basic**: Базовые стили (12 стилей)
- **cinematic**: Кинематографические (12 стилей)
- **stylized**: Стилизованные (12 стилей)
- **minimal**: Минималистичные (12 стилей)
- **animated**: Анимированные (12 стилей)
- **modern**: Современные (12 стилей)

### Примеры стилей
- Базовые: белый, желтый, с тенью
- Кинематографические: элегантный, драматичный, ретро
- Стилизованные: неоновый, граффити, комикс
- Минималистичные: тонкий, чистый, монохромный
- Анимированные: печатная машинка, затухание, скольжение
- Современные: градиент, глюк, голографический

## 🚀 Оптимизация

### Производительность
- Мемоизация CSS стилей
- Ленивая загрузка стилей
- Виртуализация списка (TODO)

### Качество кода
- TypeScript строгая типизация
- Комментарии JSDoc
- Модульные тесты
- Интеграционные тесты компонентов

## 📝 TODO

1. **Улучшить покрытие тестами**:
   - [x] Добавить тесты для хуков ✅
   - [x] Покрыть subtitle-processor ✅
   - [x] Исправить тесты фильтрации в SubtitleList ✅

2. **Функциональность**:
   - [ ] Виртуализация для больших списков
   - [ ] Предпросмотр анимаций в реальном времени
   - [ ] Экспорт/импорт пользовательских стилей

3. **Оптимизация**:
   - [ ] Кеширование превью
   - [ ] Оптимизация рендеринга групп