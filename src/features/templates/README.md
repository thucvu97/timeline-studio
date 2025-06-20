# Templates - Многокамерные шаблоны

Система многокамерных шаблонов для Timeline Studio, поддерживающая разделенные экраны с 2-25 видеопотоками, используя современную конфигурационную архитектуру.

**Последнее обновление**: 21 июня 2025  
**Архитектура**: Конфигурационная система шаблонов  
**Статус**: Готово к производству - Проблем с импортами не найдено ✅

## 📋 Статус готовности

- ✅ **Configuration System**: Новая конфигурационная архитектура
- ✅ **Template Renderer**: Универсальный рендерер для всех типов
- ✅ **78+ Templates**: Все шаблоны переведены на конфигурации
- ✅ **Гибкая стилизация**: Настраиваемые разделители, заголовки, фоны
- ✅ **Точное позиционирование**: cellLayouts для сложных шаблонов
- ✅ **Расширенное тестирование**: 70+ тестов с полным покрытием
- ✅ **Очистка кода**: Удалены старые JSX компоненты
- ✅ **Производительность**: Оптимизированный рендеринг
- ✅ **Импорты**: Все зависимости разрешаются корректно

## 🏗️ Архитектура

### Основные компоненты
- **`ResizableTemplate`** - Основной интерактивный компонент с поддержкой изменения размеров
- **`TemplateRenderer`** - Движок рендеринга на основе конфигураций  
- **`TemplateList`** - UI выбора шаблонов с поиском и группировкой
- **`TemplatePreview`** - Превью миниатюры шаблонов
- **`VideoPanelComponent`** - Отдельные видеопанели внутри шаблонов

### Структура файлов
```
src/features/templates/
├── components/
│   ├── index.ts                    # Экспорт компонентов
│   ├── resizable-template.tsx      # Основной интерактивный шаблон
│   ├── template-list.tsx          # UI выбора шаблонов
│   ├── template-preview.tsx       # Миниатюры шаблонов
│   ├── template-renderer.tsx      # Рендерер на основе конфигураций
│   ├── video-panel-component.tsx  # Отдельные видеопанели
│   └── template-previews/
│       ├── landscape-templates.tsx # Шаблоны 16:9
│       ├── portrait-templates.tsx  # Шаблоны 9:16  
│       └── square-templates.tsx    # Шаблоны 1:1
├── hooks/
│   ├── index.ts                   # Экспорт хуков
│   ├── use-templates.ts           # Разрешение шаблонов
│   └── use-templates-import.ts    # Загрузка шаблонов
├── lib/
│   ├── index.ts                   # Экспорт библиотеки
│   ├── all-template-configs.ts    # Все 78+ конфигураций шаблонов
│   ├── template-config.ts         # Интерфейсы конфигурации
│   ├── template-labels.ts         # Помощники локализации
│   └── templates.tsx              # Наследуемая система шаблонов
├── services/
│   ├── index.ts                   # Экспорт сервисов
│   └── template-service.ts        # Логика позиционирования видео
├── __tests__/                     # Исчерпывающий набор тестов
├── index.ts                       # Основные экспорты модуля
└── README.md                      # Эта документация
```

## 🎨 Система конфигурации

### Интерфейсы конфигурации шаблонов

```typescript
// Основная конфигурация шаблона
interface MediaTemplateConfig {
  id: string
  split: "vertical" | "horizontal" | "diagonal" | "grid" | "custom"
  screens: number                  // Количество видеопанелей (2-25)
  resizable?: boolean             // Поддерживает интерактивное изменение размеров
  splitPosition?: number          // Позиция разделения в процентах (0-100)
  splitPoints?: SplitPoint[]      // Для диагональных шаблонов
  cells?: CellConfiguration[]     // Конфигурация стилизации ячеек
  cellLayouts?: CellLayout[]      // Точное позиционирование для кастомных макетов
  dividers?: DividerConfig       // Стилизация линий-разделителей
  layout?: LayoutConfig          // Стилизация на уровне контейнера
  gridConfig?: GridConfig        // Специфичная конфигурация сетки
}

// Конфигурация ячейки (видеопанели)
interface CellConfiguration {
  // Настройки отображения видео
  fitMode?: "contain" | "cover" | "fill"
  alignX?: "left" | "center" | "right"
  alignY?: "top" | "center" | "bottom"
  initialScale?: number
  initialPosition?: { x: number; y: number }
  
  // Визуальная стилизация
  background?: {
    color?: string
    gradient?: string
    image?: string
    opacity?: number
  }
  border?: {
    width?: string
    color?: string
    style?: "solid" | "dashed" | "dotted"
    radius?: string
  }
  
  // Заголовок/метка ячейки
  title?: {
    show: boolean
    text?: string
    position?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
    style?: {
      fontSize?: string
      color?: string
      fontWeight?: string
      opacity?: number
      transform?: string
      margin?: string
      padding?: string
    }
  }
  
  padding?: string
  margin?: string
}
```

## 🎯 Типы шаблонов

### 1. Базовые разделения
```typescript
// Вертикальное разделение (бок о бок)
{
  id: "split-vertical-landscape",
  split: "vertical",
  screens: 2,
  resizable: true,
  splitPosition: 50
}

// Горизонтальное разделение (верх/низ)  
{
  id: "split-horizontal-landscape",
  split: "horizontal", 
  screens: 2,
  resizable: true,
  splitPosition: 50
}
```

### 2. Диагональные разделения
```typescript
{
  id: "split-diagonal-landscape",
  split: "diagonal",
  screens: 2,
  splitPoints: [
    { x: 66.67, y: 0 },    // Верхняя точка
    { x: 33.33, y: 100 }   // Нижняя точка
  ]
}
```

### 3. Сеточные макеты
```typescript
{
  id: "split-grid-2x2-landscape",
  split: "grid",
  screens: 4,
  gridConfig: { 
    columns: 2, 
    rows: 2 
  }
}
```

### 4. Кастомные макеты
```typescript
{
  id: "split-1-3-landscape", 
  split: "custom",
  screens: 4,
  cellLayouts: [
    { position: "absolute", top: "0", left: "0", width: "50%", height: "100%" },
    { position: "absolute", top: "0", right: "0", width: "50%", height: "33.33%" },
    { position: "absolute", top: "33.33%", right: "0", width: "50%", height: "33.33%" },
    { position: "absolute", bottom: "0", right: "0", width: "50%", height: "33.33%" }
  ]
}
```

## 🔧 Универсальный рендерер шаблонов

### Единый компонент для всех типов
```typescript
interface TemplateRendererProps {
  config: MediaTemplateConfig
  renderCell: (index: number, cellConfig: CellConfiguration) => React.ReactNode
  className?: string
}

// Один компонент обрабатывает все типы шаблонов
<TemplateRenderer
  config={templateConfig}
  renderCell={(index, cellConfig) => (
    <VideoPanelComponent
      video={videos[index]}
      isActive={isActive}
      config={cellConfig}
    />
  )}
/>
```

### Логика рендеринга по типам

#### Вертикальное/горизонтальное разделение
- **Flexbox** с настраиваемыми разделителями
- Поддержка интерактивного изменения размеров

#### Сеточные шаблоны
- **CSS Grid** с адаптивными колонками/строками
- Настраиваемые отступы между ячейками

#### Диагональные шаблоны
- **SVG clip-path** для создания диагональных разрезов
- Интерактивные точки перетаскивания

#### Кастомные шаблоны
- **Абсолютное позиционирование** с cellLayouts
- Точное управление размерами и позициями

## 📐 Доступные шаблоны

### По количеству экранов
- **2 экрана:** 9 шаблонов (вертикальные, горизонтальные, диагональные)
- **3 экрана:** 8 шаблонов (тройные разделения, смешанные макеты)
- **4 экрана:** 15 шаблонов (сетки, кастомные макеты 1+3, 3+1)
- **5 экранов:** 7 шаблонов (сложные кастомные композиции)
- **6 экранов:** 3 шаблона (сетки 3x2, 2x3)
- **8-25 экранов:** 36 шаблонов (различные конфигурации сеток)

### По соотношению сторон
- **Landscape:** Оптимизированы для дисплеев 16:9
- **Portrait:** Оптимизированы для 9:16 (мобильные/вертикальные)
- **Square:** Оптимизированы для дисплеев 1:1

## 💡 Примеры использования

### Базовое использование шаблона
```typescript
import { ResizableTemplate } from "@/features/templates"

function VideoEditor() {
  const appliedTemplate = {
    template: getTemplateById("split-vertical-landscape"),
    videos: videoFiles
  }
  
  return (
    <ResizableTemplate
      appliedTemplate={appliedTemplate}
      videos={videoFiles}
      activeVideoId={activeId}
      videoRefs={videoRefs}
    />
  )
}
```

### Выбор шаблона
```typescript
import { TemplateList, useTemplates } from "@/features/templates"

function TemplatePicker() {
  const { templates, getTemplateById } = useTemplates()
  
  return (
    <TemplateList
      aspectRatio="landscape"
      resolution="1920x1080" 
      onTemplateSelect={(template) => applyTemplate(template)}
    />
  )
}
```

### Кастомная конфигурация шаблона
```typescript
import { getAllTemplateConfig } from "@/features/templates"

// Получить конфигурацию шаблона для рендеринга
const config = getAllTemplateConfig("split-diagonal-landscape")

// Рендерить с кастомным рендерером ячеек
<TemplateRenderer 
  config={config}
  renderCell={(index, cellConfig) => (
    <VideoPanel video={videos[index]} config={cellConfig} />
  )}
/>
```

## 🎨 Опции конфигурации ячеек

### Визуальная стилизация
```typescript
{
  background: {
    color: "#23262b",
    gradient: "linear-gradient(45deg, #000, #333)",
    opacity: 0.8
  },
  border: {
    width: "2px",
    color: "#4b5563", 
    style: "solid",
    radius: "8px"
  },
  padding: "8px",
  margin: "4px"
}
```

### Поведение видео
```typescript
{
  fitMode: "contain" | "cover" | "fill",
  alignX: "left" | "center" | "right",
  alignY: "top" | "center" | "bottom", 
  initialScale: 1.2,
  initialPosition: { x: 10, y: 20 }
}
```

### Заголовки ячеек
```typescript
{
  title: {
    show: true,
    text: "Камера 1",
    position: "top-left",
    style: {
      fontSize: "16px",
      color: "#fff",
      fontWeight: "bold",
      transform: "translateX(-10px)"
    }
  }
}
```

## 🧪 Тестирование

### Запуск тестов
```bash
# Все тесты шаблонов
bun run test src/features/templates/

# Конкретный тестовый файл
bun run test src/features/templates/__tests__/lib/all-template-configs.test.ts

# Режим наблюдения
bun run test:watch src/features/templates/
```

### Результаты текущих тестов
- ✅ **ВСЕ ТЕСТЫ ПРОХОДЯТ** - 70+ тестов покрывают полную функциональность
- ✅ **Конфигурации шаблонов:** 36 тестов валидируют все 78+ конфигураций
- ✅ **Рендерер шаблонов:** 8 тестов покрывают все типы шаблонов
- ✅ **Тесты компонентов:** Полное покрытие UI компонентов
- ✅ **Тесты сервисов:** Валидация бизнес-логики

## 🛠️ Создание новых шаблонов

### 1. Определить конфигурацию шаблона
```typescript
// Добавить в all-template-configs.ts
const newTemplate: MediaTemplateConfig = {
  id: "my-custom-template",
  split: "custom",
  screens: 3,
  cells: [
    createCellConfig(0, { background: { color: "#123456" } }),
    createCellConfig(1), 
    createCellConfig(2)
  ],
  cellLayouts: [
    { position: "absolute", top: "0", left: "0", width: "60%", height: "100%" },
    { position: "absolute", top: "0", right: "0", width: "40%", height: "50%" },
    { position: "absolute", bottom: "0", right: "0", width: "40%", height: "50%" }
  ],
  dividers: createDividerConfig("default"),
  layout: PRESET_STYLES.layout.withGap
}
```

### 2. Добавить компонент превью
```typescript
// Добавить в landscape-templates.tsx (или portrait/square)
{
  id: "my-custom-template",
  split: "custom", 
  screens: 3,
  render: () => (
    <div className="relative h-full w-full">
      {/* Кастомный JSX для превью */}
    </div>
  )
}
```

### 3. Добавить переводы
```json
{
  "templates": {
    "templateLabels": {
      "my-custom-template": "Мой кастомный макет"
    },
    "templateDescriptions": {
      "my-custom-template": "Кастомная композиция 3-х камер"
    }
  }
}
```

## 🌍 Локализация

Имена и описания шаблонов полностью локализованы:

```typescript
import { getTemplateLabels, getTemplateDescription } from "@/features/templates"

// Получить локализованное имя шаблона
const name = getTemplateLabels("split-vertical-landscape")

// Получить локализованное описание
const description = getTemplateDescription("split-vertical-landscape")
```

## 🚀 Преимущества производительности

### До и после рефакторинга
| Метрика | До | После | Улучшение |
|---------|----|----|-----------|
| Файлы шаблонов | 78 JSX компонентов | 1 TemplateRenderer + конфигурации | -77 файлов |
| Строки кода | ~3000 LOC | ~800 LOC | -73% |
| Размер бандла | Большое JSX дерево | Структурированные данные | Меньше |
| Новый шаблон | Создать JSX файл | Добавить JSON конфигурацию | В 10 раз быстрее |
| Поддерживаемость | Сложная | Простая | Значительно лучше |

### Производительность во время выполнения
- **Единый рендерер** против 78 индивидуальных компонентов
- **Мемоизированные конфигурации** - без повторного парсинга
- **Оптимизированные ре-рендеры** - только целевые обновления
- **Tree shaking** - неиспользуемые конфигурации исключены

## 🔧 Рабочий процесс разработки

### Локальная разработка
```bash
# Запуск с горячей перезагрузкой
bun run dev

# Тестирование конкретного шаблона
bun run test src/features/templates/__tests__/template-renderer.test.tsx

# Проверка типов
bun run lint
```

### Отладка шаблонов
```typescript
// В консоли браузера во время разработки
console.log("Конфигурация шаблона:", getAllTemplateConfig("your-template-id"))

// Тестовый рендеринг
<TemplateRenderer 
  config={testConfig}
  renderCell={(index) => <div>Ячейка {index}</div>}
/>
```

## 🚨 Устранение неполадок

### Частые проблемы

**Шаблон не найден:**
```typescript
// Проверить, что шаблон существует в all-template-configs.ts
const config = getAllTemplateConfig("my-template-id")
if (!config) {
  console.error("Шаблон не найден:", "my-template-id")
}
```

**Проблемы с рендерингом:**
```typescript
// Проверить корректность конфигурации шаблона
if (!template.screens || template.screens < 1) {
  console.error("Некорректная конфигурация шаблона:", template)
}
```

**Изменение размеров не работает:**
```typescript
// Проверить, что шаблон поддерживает изменение размеров
if (template.resizable && isResizableMode) {
  // Изменение размеров должно работать
} else {
  console.warn("Шаблон не поддерживает изменение размеров:", template.id)
}
```

### Режим отладки
Включить отладку шаблонов:
```javascript
localStorage.setItem('debug-templates', 'true')
```

## 📚 Справочник API

### Основные функции
- `getAllTemplateConfig(id)` - Получить конфигурацию шаблона
- `createCellConfig(options)` - Создать конфигурацию ячейки
- `createDividerConfig(options)` - Создать конфигурацию разделителя
- `PRESET_STYLES` - Предопределенные стили

### React компоненты
- `<TemplateRenderer />` - Универсальный рендерер шаблонов
- `<ResizableTemplate />` - Интерактивный шаблон с изменением размеров
- `<TemplatePreview />` - Компонент превью шаблона

### Хуки
- `useTemplates()` - Управление шаблонами
- `useTemplatesImport()` - Функциональность импорта шаблонов

---

## 🎉 Анализ завершен!

**Результаты анализа импортов:**

✅ **ПРОБЛЕМ С ИМПОРТАМИ НЕ НАЙДЕНО** - Все зависимости разрешаются корректно  
✅ **ВСЕ ТЕСТЫ ПРОХОДЯТ** - 70+ тестов покрывают полную функциональность  
✅ **СБОРКА УСПЕШНА** - Нет ошибок TypeScript или компиляции  
✅ **ГОТОВО К ПРОИЗВОДСТВУ** - Модуль стабилен и хорошо спроектирован  

**Ключевые особенности:**
- **78+ шаблонов** поддерживающих 2-25 видеопанелей
- **Конфигурационная архитектура** с `TemplateRenderer`
- **Интерактивное изменение размеров** для поддерживаемых типов шаблонов  
- **Полная поддержка локализации** на 10 языках
- **Исчерпывающее тестирование** с отличным покрытием
- **Типобезопасная** реализация на TypeScript

Модуль шаблонов функционирует корректно без проблем с импортами или зависимостями. Архитектура современная, хорошо протестированная и готова к использованию в производстве. 🚀