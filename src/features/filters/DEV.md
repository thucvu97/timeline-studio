# Filters - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура

```
src/features/filters/
├── components/
│   ├── filter-group.tsx ✅
│   ├── filter-list.tsx ✅
│   └── filter-preview.tsx ✅
├── hooks/
│   ├── use-filters.ts ✅
│   └── use-filters-import.ts ✅
├── utils/
│   ├── css-filters.ts ✅
│   └── filter-processor.ts ✅
├── filter-list.tsx ✅
└── index.ts ✅
```

### 📊 Данные

```
src/data/
├── filters.json ✅ (15 фильтров)
└── filter-categories.json ✅ (6 категорий)
```

### 🧪 Тестовое покрытие (100%)

```
tests/
├── components/          # 31 тест
│   ├── filter-group.test.tsx ✅ (14 тестов)
│   ├── filter-list.test.tsx ✅ (3 теста)
│   └── filter-preview.test.tsx ✅ (14 тестов)
├── hooks/              # 19 тестов
│   └── use-filters-import.test.ts ✅ (15 тестов)
└── utils/              # 48 тестов
    ├── css-filters.test.ts ✅ (7 тестов)
    ├── filter-processor.test.ts ✅ (41 тест)
    └── use-filters.test.ts ✅ (4 теста)

📊 Общая статистика: 98 тестов, 100% покрытие
```

## 🏗️ Архитектура компонентов

### FilterList

**Файл**: `components/filter-list.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 3 теста
**Описание**: Основной компонент списка фильтров с поддержкой фильтрации, сортировки и группировки. Загружает данные из JSON через хук useFilters.

### FilterGroup

**Файл**: `components/filter-group.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 14 тестов
**Описание**: Компонент для отображения группы фильтров с заголовком. Поддерживает адаптивную сетку и CSS переменные для размеров.

### FilterPreview

**Файл**: `components/filter-preview.tsx`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 14 тестов
**Описание**: Компонент превью фильтра с видео демонстрацией. Поддерживает все параметры фильтров и CSS-эмуляцию сложных эффектов.

## 🔧 Хуки

### useFilters

**Файл**: `hooks/use-filters.ts`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 4 теста
**Описание**: Основной хук для загрузки фильтров из JSON файла с обработкой ошибок и fallback данными.

### useFiltersImport

**Файл**: `hooks/use-filters-import.ts`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 15 тестов
**Описание**: Хук для импорта пользовательских фильтров из JSON файлов и отдельных файлов фильтров.

### useFilterById

**Описание**: Хук для получения конкретного фильтра по ID (часть useFilters)

### useFiltersByCategory

**Описание**: Хук для получения фильтров по категории (часть useFilters)

### useFiltersSearch

**Описание**: Хук для поиска фильтров по названию, описанию и тегам (часть useFilters)

## ⚙️ Утилиты

### filter-processor

**Файл**: `utils/filter-processor.ts`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 41 тест
**Описание**: Утилиты для обработки, валидации и преобразования данных фильтров

### css-filters

**Файл**: `utils/css-filters.ts`
**Статус**: ✅ Полностью реализован
**Тесты**: ✅ 7 тестов
**Описание**: Утилиты для генерации и применения CSS-фильтров

## 📦 Структура данных

### VideoFilter

```typescript
interface VideoFilter {
  id: string;
  name: string;
  category: FilterCategory;
  complexity: FilterComplexity;
  tags: FilterTag[];
  description: {
    ru: string;
    en: string;
  };
  labels: {
    ru: string;
    en: string;
    es?: string;
    fr?: string;
    de?: string;
  };
  params: {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    gamma?: number;
    temperature?: number;
    tint?: number;
    hue?: number;
    vibrance?: number;
    shadows?: number;
    highlights?: number;
    blacks?: number;
    whites?: number;
    clarity?: number;
    dehaze?: number;
    vignette?: number;
    grain?: number;
  };
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
- **pt** - Португальский
- **zh** - Китайский
- **ja** - Японский
- **ko** - Корейский
- **tr** - Турецкий
- **th** - Тайский
- **it** - Итальянский
- **hi** - Хинди
- **ar** - Арабский (RTL)
- **fa** - Персидский (RTL)

### Переводы

- Названия фильтров
- Описания фильтров
- Категории фильтров
- Уровни сложности
- Сообщения об ошибках

### RTL поддержка

- **Арабский (ar)** и **Персидский (fa)** языки автоматически переключают интерфейс на RTL
- Все компоненты адаптированы для правильного отображения справа налево
- CSS стили учитывают направление текста

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

## 🧪 Тестирование

Модуль полностью покрыт тестами для обеспечения стабильности и корректности работы.

### Покрытие тестами

**✅ Компоненты (100%)**

- `filter-list.tsx` - 3 теста
- `filter-group.tsx` - 14 тестов
- `filter-preview.tsx` - 14 тестов

**✅ Хуки (100%)**

- `use-filters.ts` - 4 теста
- `use-filters-import.ts` - 15 тестов

**✅ Утилиты (100%)**

- `css-filters.ts` - 7 тестов
- `filter-processor.ts` - 41 тест

**📊 Общая статистика:**

- **Всего тестов**: 98
- **Покрытие**: 100% файлов
- **Статус**: ✅ Все тесты проходят

### Запуск тестов

```bash
# Запуск всех тестов фильтров
bun run test src/features/filters/

# Запуск конкретного теста
bun run test src/features/filters/tests/utils/css-filters.test.ts

# Запуск тестов компонентов
bun run test src/features/filters/tests/components/

# Запуск тестов хуков
bun run test src/features/filters/tests/hooks/

# Запуск тестов утилит
bun run test src/features/filters/tests/utils/
```

### Типы тестов

**Модульные тесты (Unit Tests)**

- Тестирование отдельных функций и хуков
- Проверка корректности обработки данных
- Валидация входных и выходных параметров

**Компонентные тесты (Component Tests)**

- Тестирование рендеринга компонентов
- Проверка пользовательских взаимодействий
- Тестирование пропсов и состояний

**Интеграционные тесты**

- Тестирование взаимодействия между компонентами
- Проверка работы с внешними API (Tauri)
- Тестирование полных пользовательских сценариев

### Структура тестов

```
tests/
├── components/          # Тесты компонентов
│   ├── filter-list.test.tsx
│   ├── filter-group.test.tsx
│   └── filter-preview.test.tsx
├── hooks/              # Тесты хуков
│   └── use-filters-import.test.ts
└── utils/              # Тесты утилит
    ├── css-filters.test.ts
    ├── filter-processor.test.ts
    └── use-filters.test.ts
```

## 🔄 Интеграция

### Browser Integration

- Интегрирован в систему вкладок Browser
- Поддержка поиска и фильтрации
- Группировка по категориям
- Предпросмотр с демо видео

### Resources Integration

- Добавление фильтров в ресурсы проекта
- Управление избранными фильтрами
- Удаление из ресурсов

### Import System

- Импорт JSON файлов с фильтрами
- Импорт отдельных файлов фильтров
- Валидация структуры данных
- Прогресс импорта

## 🚀 Статус готовности

- ✅ **Компоненты**: 100% готовы
- ✅ **Хуки**: 100% готовы
- ✅ **Утилиты**: 100% готовы
- ✅ **Тесты**: 100% покрытие
- ✅ **Документация**: Полная
- ✅ **Интеграция**: Browser, Resources
- ⚠️ **Timeline**: Требует реализации применения фильтров
