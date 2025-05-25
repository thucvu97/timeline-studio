# Filters - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура
```
src/features/filters/
├── filter-list.tsx ✅
├── filter-group.tsx ✅
├── filter-preview.tsx ✅
├── hooks/
│   └── use-filters.ts ✅
└── index.ts ✅
```

### 📊 Данные
```
src/data/
├── filters.json ✅ (15 фильтров)
└── filter-categories.json ✅ (6 категорий)
```

### 🧪 Тестовое покрытие
```
├── filter-list.test.tsx ✅
├── filter-preview.test.tsx ✅
```

## 🏗️ Архитектура компонентов

### FilterList
**Файл**: `filter-list.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Основной компонент списка фильтров с поддержкой фильтрации, сортировки и группировки. Загружает данные из JSON через хук useFilters.

### FilterGroup
**Файл**: `filter-group.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент для отображения группы фильтров с заголовком. Поддерживает адаптивную сетку.

### FilterPreview
**Файл**: `filter-preview.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент превью фильтра с видео демонстрацией. Поддерживает все параметры фильтров и CSS-эмуляцию сложных эффектов.

## 🔧 Хуки

### useFilters
**Файл**: `hooks/use-filters.ts`
**Статус**: ✅ Полностью реализован
**Описание**: Основной хук для загрузки фильтров из JSON файла с обработкой ошибок и fallback данными.

### useFilterById
**Описание**: Хук для получения конкретного фильтра по ID

### useFiltersByCategory
**Описание**: Хук для получения фильтров по категории

### useFiltersSearch
**Описание**: Хук для поиска фильтров по названию, описанию и тегам

## 📦 Структура данных

### VideoFilter
```typescript
interface VideoFilter {
  id: string
  name: string
  category: FilterCategory
  complexity: FilterComplexity
  tags: FilterTag[]
  description: {
    ru: string
    en: string
  }
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  params: {
    brightness?: number
    contrast?: number
    saturation?: number
    gamma?: number
    temperature?: number
    tint?: number
    hue?: number
    vibrance?: number
    shadows?: number
    highlights?: number
    blacks?: number
    whites?: number
    clarity?: number
    dehaze?: number
    vignette?: number
    grain?: number
  }
}
```

### Категории фильтров
- **color-correction** - Цветокоррекция (Rec.709, Rec.2020, Flat, Neutral)
- **technical** - Технические (S-Log, D-Log, V-Log, HLG)
- **cinematic** - Кинематографические (CineStyle, Dramatic Contrast)
- **artistic** - Художественные (Portrait, Landscape)
- **creative** - Креативные (Warm Sunset, Cold Blue)
- **vintage** - Винтажные (Vintage Film)

### Сложность фильтров
- **basic** - Базовый (простые настройки)
- **intermediate** - Средний (умеренная сложность)
- **advanced** - Продвинутый (профессиональные LOG профили)

## 🎨 CSS-фильтры

### Поддерживаемые эффекты
- **brightness** - Яркость (CSS: brightness)
- **contrast** - Контраст (CSS: contrast)
- **saturation** - Насыщенность (CSS: saturate)
- **hue** - Оттенок (CSS: hue-rotate)
- **temperature** - Цветовая температура (CSS: sepia + hue-rotate)
- **tint** - Тонирование (CSS: hue-rotate)
- **clarity** - Четкость (эмуляция через contrast)
- **vibrance** - Живость (эмуляция через saturate)
- **shadows** - Тени (эмуляция через brightness)
- **highlights** - Света (эмуляция через brightness)

## 🌍 Интернационализация

### Поддерживаемые языки
- **ru** - Русский (основной)
- **en** - Английский
- **es** - Испанский
- **fr** - Французский
- **de** - Немецкий

### Переводы
- Названия фильтров
- Описания фильтров
- Категории фильтров
- Уровни сложности
- Сообщения об ошибках

## 🔄 Миграция с hardcoded данных

### Что изменилось
1. **Удален файл** `filters.ts` с hardcoded данными
2. **Добавлены JSON файлы** с данными фильтров
3. **Создан хук** `useFilters` для загрузки данных
4. **Обновлены типы** с поддержкой новых параметров
5. **Улучшена CSS-обработка** всех параметров фильтров

### Преимущества новой архитектуры
- ✅ Легкое добавление новых фильтров через JSON
- ✅ Полная интернационализация
- ✅ Типобезопасность TypeScript
- ✅ Обработка ошибок загрузки
- ✅ Fallback данные
- ✅ Консистентность с эффектами
