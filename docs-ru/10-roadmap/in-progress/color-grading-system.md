# Color Grading System - В разработке 🚧

## 📋 Обзор задачи

**Статус:** В активной разработке  
**Приоритет:** Высокий  
**Дата начала:** 25 июня 2025  
**Исполнитель:** Frontend + Backend разработчик  

Создание профессиональной системы цветокоррекции в панели Options для Timeline Studio, обеспечивающей возможности уровня DaVinci Resolve.

## 🎯 Цели

### Основная цель:
Интегрировать полнофункциональную систему цветокоррекции в существующую панель Options как новую вкладку "Color", предоставляя пользователям профессиональные инструменты для работы с цветом в реальном времени.

### Ключевые возможности:
- ✅ Первичная цветокоррекция (Color Wheels: Lift/Gamma/Gain)
- ✅ Тональные и RGB кривые с интерактивным редактором
- ✅ HSL коррекция (Temperature, Tint, Contrast, Saturation)
- ✅ LUT поддержка (импорт .cube файлов)
- ✅ Профессиональные Scopes (Waveform, Vectorscope, Histogram)
- ✅ Real-time preview интеграция с Video Player
- ✅ Apply к клипам Timeline с сохранением настроек

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/color-grading/
├── components/
│   ├── color-settings.tsx        # Основная панель (интеграция в Options)
│   ├── color-wheels/             # Цветовые колеса Lift/Gamma/Gain
│   │   ├── color-wheel.tsx       # Круглый интерактивный регулятор
│   │   └── color-wheels-section.tsx
│   ├── curves/                   # RGB и тональные кривые
│   │   ├── curve-editor.tsx      # SVG график с точками
│   │   └── curves-section.tsx
│   ├── hsl/                      # HSL коррекция
│   │   └── hsl-section.tsx
│   ├── lut/                      # Look-Up Tables
│   │   └── lut-section.tsx
│   ├── scopes/                   # Waveform, Vectorscope, Histogram
│   │   ├── scope-viewer.tsx
│   │   └── scopes-section.tsx
│   └── controls/                 # Управление
│       ├── parameter-slider.tsx
│       └── color-grading-controls.tsx
├── hooks/
│   ├── use-color-grading.ts      # Основной хук управления состоянием
│   ├── use-color-wheels.ts       # Логика цветовых колес
│   ├── use-curves.ts             # Управление кривыми
│   └── use-lut.ts                # Работа с LUT файлами
├── services/
│   ├── color-grading-machine.ts  # XState машина состояний
│   └── color-grading-provider.tsx # React контекст
└── types/
    └── color-grading.ts          # TypeScript интерфейсы
```

## 📐 План реализации

### Фаза 1: Базовая интеграция (1 день) ✅ ТЕКУЩАЯ ФАЗА
- [x] Добавить вкладку "Color" в Options панель
- [x] Создать ColorSettings основной компонент
- [x] Базовая структура с collapsible секциями
- [x] Интеграция в существующий Options workflow

### Фаза 2: Color Wheels (1 день) ✅ ЗАВЕРШЕНА
- [x] ColorWheelsSection с тремя колесами (Lift/Gamma/Gain)
- [x] ColorWheel SVG компонент с интерактивной точкой
- [x] Базовые слайдеры (Temperature, Tint, Contrast, Saturation)
- [x] Real-time обновление значений

### Фаза 3: Curves Editor (2 дня) ✅ ЗАВЕРШЕНА
- [x] CurvesSection с переключением Master/RGB
- [x] CurveEditor SVG график с сеткой
- [x] Интерактивные точки кривой (drag & drop)
- [x] Безье интерполяция между точками

### Фаза 4: LUT поддержка (1 день) ✅ ЗАВЕРШЕНА
- [x] LUTSection с выбором файлов
- [x] Импорт .cube файлов через Tauri
- [x] LUT intensity слайдер
- [x] Превью LUT эффектов

### Фаза 5: Scopes (2 дня) ✅ ЗАВЕРШЕНА
- [x] ScopesSection с тремя типами
- [x] Waveform анализ в реальном времени
- [x] Vectorscope отображение
- [x] Histogram RGB каналов

### Фаза 6: Timeline интеграция (1 день)
- [ ] Apply to Clip функциональность
- [ ] Сохранение настроек в clip.effects
- [ ] Preset система (save/load)
- [ ] Reset и Auto кнопки

## 🎨 UI/UX концепция

### Интеграция в Options:
```typescript
// Обновление options.tsx
const TABS = [
  { id: "video", labelKey: "options.tabs.video", icon: <Video /> },
  { id: "audio", labelKey: "options.tabs.audio", icon: <AudioLines /> },
  { id: "color", labelKey: "options.tabs.color", icon: <Palette /> }, // 🆝 НОВАЯ ВКЛАДКА
  { id: "speed", labelKey: "options.tabs.speed", icon: <Gauge /> },
  { id: "info", labelKey: "options.tabs.info", icon: <Info /> },
]
```

### Макет ColorSettings:
```
┌─────────────────────────────────────────┐
│ ▼ Primary Color Correction              │
│   ◯ Lift    ◯ Gamma    ◯ Gain          │
│   Temperature: ———————○———————           │
│   Contrast:    ———————○———————           │
├─────────────────────────────────────────┤
│ ▼ Curves                                │
│   [Master] [Red] [Green] [Blue]         │
│   ┌─────────────────────────────┐       │
│   │   ╱╱╱  Grid with curve      │       │
│   │  ╱   ╱  and control points  │       │
│   │ ╱___╱                       │       │
│   └─────────────────────────────┘       │
├─────────────────────────────────────────┤
│ ▼ LUT                                   │
│   LUT File: [Select LUT ▼] [📁]        │
│   Intensity: ———————○———————            │
├─────────────────────────────────────────┤
│ ▼ Scopes                                │
│   [Waveform] [Vectorscope] [Histogram]  │
│   ┌─────────────────────────────┐       │
│   │ Real-time scope display     │       │
│   └─────────────────────────────┘       │
├─────────────────────────────────────────┤
│ [Reset All] [Load Preset]  [Apply] ►   │
└─────────────────────────────────────────┘
```

## 🔧 Технические детали

### State Management:
```typescript
interface ColorGradingState {
  // Color Wheels
  lift: { r: number; g: number; b: number }
  gamma: { r: number; g: number; b: number }
  gain: { r: number; g: number; b: number }
  
  // Basic Parameters
  temperature: number    // -100 to 100
  tint: number          // -100 to 100
  contrast: number      // -100 to 100
  saturation: number    // -100 to 100
  
  // Curves
  masterCurve: CurvePoint[]
  redCurve: CurvePoint[]
  greenCurve: CurvePoint[]
  blueCurve: CurvePoint[]
  
  // LUT
  lutFile: string | null
  lutIntensity: number   // 0 to 100
  
  // Preview
  previewEnabled: boolean
  selectedClip: string | null
}
```

### Real-time Preview:
- Интеграция с Video Player для мгновенного preview
- WebGL шейдеры для обработки в реальном времени
- Кэширование промежуточных результатов
- Применение эффектов без влияния на исходный файл

## 🎯 Критерии успеха

### Производительность:
- [ ] Real-time preview без задержек
- [ ] Плавная работа Color Wheels и Curves
- [ ] <100ms применение изменений

### Функциональность:
- [ ] Все основные инструменты цветокоррекции работают
- [ ] Импорт и применение LUT файлов
- [ ] Сохранение настроек в Timeline клипы
- [ ] Система пресетов

### UX:
- [ ] Интуитивный интерфейс
- [ ] Профессиональный внешний вид
- [ ] Совместимость с горячими клавишами DaVinci

## 📊 Прогресс выполнения

### ✅ Завершено:
- [x] Планирование архитектуры
- [x] Создание задачи в roadmap
- [x] UI/UX дизайн концепция
- [x] **Фаза 1: Базовая интеграция (100%)** ✅
  - [x] Создана структура color-grading модуля
  - [x] Добавлена вкладка "Color" в Options панель
  - [x] Создан основной ColorSettings компонент
  - [x] Реализованы все 5 секций с заглушками (ColorWheels, Curves, HSL, LUT, Scopes)
  - [x] Интегрированы переводы для EN и RU языков
  - [x] Проверена компиляция проекта
- [x] **Фаза 2: Color Wheels (100%)** ✅
  - [x] Реализован ColorWheelsSection с 3 колесами (Lift/Gamma/Gain)
  - [x] Создан интерактивный ColorWheel компонент с SVG рендерингом
  - [x] Добавлены базовые слайдеры (Temperature, Tint, Contrast, Saturation)
  - [x] Реализован ParameterSlider компонент с визуальной обратной связью
  - [x] Настроено real-time обновление через ColorGradingProvider
  - [x] Добавлена поддержка drag & drop для цветовых колес
- [x] **Фаза 3: Curves Editor (100%)** ✅
  - [x] Реализован CurveEditor компонент с интерактивным SVG графиком
  - [x] Добавлена поддержка drag & drop для точек кривой
  - [x] Реализована безье интерполяция для плавных кривых
  - [x] Добавлена возможность добавления/удаления точек (клик/двойной клик)
  - [x] Интегрированы кнопки Reset и Auto для быстрой коррекции
  - [x] Настроено переключение между Master/RGB кривыми с цветовой индикацией
  - [x] Обновлен хук use-color-grading для работы с кривыми
- [x] **Фаза 4: LUT поддержка (100%)** ✅
  - [x] Полностью переписан LUTSection компонент с категориями и превью
  - [x] Реализован импорт .cube файлов через Tauri dialog
  - [x] Создан lut-parser.ts с парсингом .cube и трилинейной интерполяцией
  - [x] Добавлены предустановленные LUT в 3 категориях (Film, Creative, Technical)
  - [x] Реализован слайдер интенсивности с форматированием процентов
  - [x] Добавлен Switch для включения/отключения LUT
  - [x] Создана сетка превью с разными уровнями интенсивности
  - [x] Интегрирован dispatch в use-color-grading для управления LUT
- [x] **Фаза 5: Scopes (100%)** ✅
  - [x] Создан ScopesSection компонент с управлением всеми скопами
  - [x] Реализован WaveformScope с Canvas рендерингом и анализом яркости
  - [x] Создан VectorscopeScope с YUV преобразованием и цветовыми таргетами
  - [x] Добавлен HistogramScope с RGB каналами и яркостью
  - [x] Интегрирован ScopeViewer с адаптивными размерами и полноэкранным режимом
  - [x] Настроена частота обновления (15/30/60 FPS)
  - [x] Добавлена интеграция с видео элементом для анализа
  - [x] Обновлен dispatch в use-color-grading для управления скопами

### 🔄 В работе:
- [ ] Фаза 6: Timeline интеграция (0% - следующая фаза)

### ✅ Тестирование:
- [x] Созданы unit тесты для use-color-grading хука (14 тестов, все проходят)
  - [x] Тестирование инициализации с дефолтным состоянием
  - [x] Тесты Color Wheels (updateColorWheel)
  - [x] Тесты Basic Parameters (updateBasicParameter)
  - [x] Тесты Curves (updateCurve)
  - [x] Тесты LUT (loadLUT, setLUTIntensity, toggleLUT)
  - [x] Тесты Scopes (toggleScope, refreshRate через dispatch)
  - [x] Тесты Reset функциональности
  - [x] Тесты Preview toggle
  - [x] Тесты dispatch для всех action types

### ⏳ Запланировано:
- [ ] Фаза 6: Timeline интеграция

## 🔗 Связанные документы

- [Color Grading System (планирование)](../planned/color-grading-system.md)
- [Options модуль](../../src/features/options/README.md)
- [Timeline интеграция](../../src/features/timeline/README.md)

---

*Создано: 25 июня 2025* | *Обновлено: 26 июня 2025* | *Статус: В разработке* | *Приоритет: Высокий*