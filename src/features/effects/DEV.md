# Effects - Техническая документация

## 📁 Структура файлов

### ✅ Реализованная структура
```
src/features/effects/
├── components/
│   ├── effect-list.tsx ✅
│   ├── effect-preview.tsx ✅
│   ├── effect-categories.tsx ✅
│   ├── effect-detail.tsx ✅
│   ├── effect-indicators.tsx ✅
│   └── effect-presets.tsx ✅
├── hooks/
│   ├── use-effects.ts ✅
│   ├── use-effect-categories.ts ✅
│   └── use-effects-import.ts ✅
├── utils/
│   ├── css-effects.ts ✅
│   └── effect-processor.ts ✅
├── tests/
│   ├── effect-list.test.tsx ✅
│   └── effect-preview.test.tsx ✅
├── examples/
│   └── hooks-usage.md ✅
├── DEV.md ✅
├── README.md ✅
└── index.ts ✅
```

### 🧪 Тестовое покрытие
```
tests/
├── effect-list.test.tsx ✅
├── effect-preview.test.tsx ✅
├── effect-categories.test.tsx ⚠️ Требуется
├── effect-detail.test.tsx ⚠️ Требуется
└── use-effects.test.ts ⚠️ Требуется
```

## 🏗️ Архитектура компонентов

### EffectList
**Файл**: `components/effect-list.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Основной компонент списка эффектов с поиском и фильтрацией

### EffectPreview
**Файл**: `components/effect-preview.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент предпросмотра эффекта с видео

### EffectCategories
**Файл**: `components/effect-categories.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент просмотра эффектов по категориям с расширенными фильтрами

### EffectDetail
**Файл**: `components/effect-detail.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Детальная информация об эффекте с параметрами и пресетами

### EffectIndicators
**Файл**: `components/effect-indicators.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Индикаторы сложности и тегов эффектов (простой дизайн без цветов)

### EffectPresets
**Файл**: `components/effect-presets.tsx`
**Статус**: ✅ Полностью реализован
**Описание**: Компонент для работы с пресетами эффектов

## 📦 Типы данных

### VideoEffect
```typescript
interface VideoEffect {
  id: string
  name: string
  type: EffectType
  duration: number
  category: EffectCategory
  complexity: EffectComplexity
  tags: EffectTag[]
  description: {
    ru: string
    en: string
  }
  ffmpegCommand: (params: Record<string, any>) => string
  cssFilter?: (params: Record<string, any>) => string
  params?: Record<string, any>
  previewPath: string
  labels: {
    ru: string
    en: string
    es: string
    fr: string
    de: string
  }
  presets?: Record<string, EffectPreset>
}
```

### EffectCategory
```typescript
type EffectCategory =
  | "color-correction"    // Цветокоррекция
  | "artistic"           // Художественные
  | "vintage"            // Винтажные
  | "cinematic"          // Кинематографические
  | "creative"           // Креативные
  | "technical"          // Технические
  | "motion"             // Движение и скорость
  | "distortion"         // Искажения
```

### EffectComplexity
```typescript
type EffectComplexity = "basic" | "intermediate" | "advanced"
```

### EffectTag
```typescript
type EffectTag =
  | "popular"            // Популярный
  | "professional"       // Профессиональный
  | "beginner-friendly"  // Для начинающих
  | "experimental"       // Экспериментальный
  | "retro"             // Ретро
  | "modern"            // Современный
  | "dramatic"          // Драматический
  | "subtle"            // Тонкий
  | "intense"           // Интенсивный
```

## 🪝 Хуки

### useEffects()
**Файл**: `hooks/use-effects.ts`
**Описание**: Основной хук для загрузки всех эффектов из JSON
**Возвращает**: `{ effects, loading, error, reload, isReady }`

### useEffectCategories()
**Файл**: `hooks/use-effect-categories.ts`
**Описание**: Хук для загрузки категорий эффектов с переводами
**Возвращает**: `{ categories, loading, error, reload }`

### useEffectsImport()
**Файл**: `hooks/use-effects-import.ts`
**Статус**: ✅ Полностью реализован
**Описание**: Хук для импорта пользовательских эффектов
**Возвращает**: `{ importEffectsFile, importEffectFile, isImporting, progress }`

**Функционал**:
- Импорт JSON файлов с эффектами
- Импорт отдельных файлов эффектов (.cube, .3dl, .lut, .preset)
- Валидация структуры эффектов
- Обработка ошибок и отображение прогресса
- Интеграция с общим тулбаром браузера

### useEffectsSearch()
**Описание**: Хук для поиска эффектов по тексту
**Параметры**: `query: string, lang: 'ru' | 'en'`

### useEffectsByCategory()
**Описание**: Хук для получения эффектов по категории
**Параметры**: `category: EffectCategory`

### useEffectById()
**Описание**: Хук для получения эффекта по ID
**Параметры**: `id: string`

## 🛠️ Утилиты

### effect-processor.ts
- `processEffects()` - обработка эффектов из JSON
- `validateEffectsData()` - валидация данных эффектов
- `createFallbackEffect()` - создание резервного эффекта

### css-effects.ts
- CSS-фильтры для веб-превью эффектов
- Функции преобразования параметров в CSS

## 🌍 Интернационализация

### Поддерживаемые языки
- **Русский (ru)** - основной язык
- **Английский (en)** - международный
- **Испанский (es)** - дополнительный
- **Французский (fr)** - дополнительный
- **Немецкий (de)** - дополнительный

### Переводы включают
- Названия и описания эффектов
- Категории эффектов
- Сообщения об ошибках
- Элементы интерфейса
- Fallback данные

## 🔗 Интеграция

### Browser интеграция
```typescript
<TabsContent value="effects">
  <EffectCategories />
</TabsContent>
```

### Resources интеграция
- Используется в TimelineResources
- Отображение в категории эффектов
- Поддержка drag & drop (планируется)

### Timeline интеграция (планируется)
- Применение эффектов к клипам
- Настройка параметров в реальном времени
- Предпросмотр эффектов
