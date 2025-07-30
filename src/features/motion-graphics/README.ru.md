# Модуль Motion Graphics

## Обзор

Модуль Motion Graphics предоставляет профессиональную систему анимации на основе ключевых кадров для Timeline Studio. Он позволяет создавать сложные анимации свойств объектов во времени, подобно After Effects или другим профессиональным инструментам моушн-дизайна.

## Ключевые возможности

### 🎯 Основные функции
- **Анимация по ключевым кадрам** - Полноценная система keyframe-анимации
- **Множество типов интерполяции** - Linear, Bezier, Ease, Bounce, Elastic и другие
- **Движок выражений** - JavaScript выражения для процедурной анимации
- **Пресеты анимации** - Готовые к использованию анимационные пресеты
- **Система слоёв** - Иерархические слои анимации с режимами смешивания
- **Интеграция с Timeline** - Бесшовная интеграция с основным таймлайном

### 🔧 Технические возможности
- Анимация любых числовых, векторных, цветовых или текстовых свойств
- Визуальный редактор кривых для точного контроля
- Предпросмотр и воспроизведение в реальном времени
- Копирование/вставка анимаций между клипами
- Импорт/экспорт анимационных данных
- Оптимизация производительности для плавного воспроизведения

## Архитектура

### Структура модуля
```
src/features/motion-graphics/
├── components/
│   ├── motion-graphics-panel.tsx  # Главная панель управления
│   └── curve-editor.tsx          # Визуальный редактор кривых
├── services/
│   ├── keyframe-manager.ts       # CRUD операции с ключевыми кадрами
│   ├── interpolation.ts          # Алгоритмы интерполяции
│   ├── expression-engine.ts      # Вычислитель JavaScript выражений
│   ├── animation-layers.ts       # Система управления слоями
│   ├── preset-manager.ts         # Загрузка и управление пресетами
│   └── timeline-integration.ts   # Интеграция с клипами таймлайна
├── types/
│   └── keyframe.ts              # TypeScript определения
├── data/
│   └── motion-presets.json      # Встроенные пресеты анимации
└── hooks/
    └── use-motion-graphics.ts   # React хук для компонентов
```

### Основные типы

#### Ключевой кадр (Keyframe)
```typescript
interface Keyframe<T = KeyframeValue> {
  id: string
  time: number                    // Время в секундах
  value: T                        // Анимируемое значение
  interpolation: InterpolationType
  easeIn?: [number, number]       // Контрольные точки Безье
  easeOut?: [number, number]      // Контрольные точки Безье
  temporalEaseIn?: number         // Временное сглаживание (0-1)
  temporalEaseOut?: number        // Временное сглаживание (0-1)
}
```

#### Анимируемое свойство
```typescript
interface AnimatedProperty {
  id: string
  name: string
  path: string                    // напр., "transform.position.x"
  type: "number" | "vec2" | "vec3" | "vec4" | "color" | "boolean" | "text"
  keyframes: Keyframe[]
  enabled: boolean
  expression?: string             // JavaScript выражение
  expressionEnabled?: boolean
}
```

#### Слой анимации
```typescript
interface AnimationLayer {
  id: string
  name: string
  properties: AnimatedProperty[]
  enabled: boolean
  solo: boolean
  locked: boolean
  opacity: number                 // 0-1, для смешивания
  blendMode: "normal" | "add" | "multiply" | "screen" | "overlay"
}
```

## Типы интерполяции

Модуль поддерживает различные типы интерполяции для разных стилей анимации:

- **Linear** - Постоянная скорость между ключевыми кадрами
- **Bezier** - Плавные кривые с настраиваемыми маркерами
- **Hold** - Без интерполяции (мгновенное изменение)
- **Ease** - Плавное ускорение/замедление
- **Ease In** - Медленное начало, быстрый конец
- **Ease Out** - Быстрое начало, медленный конец
- **Ease In Out** - Медленно с обоих концов
- **Bounce** - Физика прыгающего мяча
- **Elastic** - Пружинистое превышение
- **Back** - Предвосхищение и превышение
- **Expo** - Экспоненциальное ускорение

## Движок выражений

### Встроенные функции
```javascript
// Математические функции
sin(x), cos(x), tan(x), abs(x), sqrt(x), pow(x,y)
min(...), max(...), floor(x), ceil(x), round(x), random()

// Интерполяция
linear(a, b, t)

// Сглаживание
easeIn(t), easeOut(t), easeInOut(t)

// Шум
noise(x, seed)

// Волны
sawtooth(t, period), triangle(t, period), square(t, period)

// Утилиты
clamp(value, min, max)
map(value, inMin, inMax, outMin, outMax)
smoothstep(edge0, edge1, x)

// Векторные операции
vec2(x, y), vec3(x, y, z), vec4(x, y, z, w)
length(v), normalize(v), dot(a, b)

// Цвет
rgb(r, g, b), hsl(h, s, l)

// Помощники анимации
wiggle(freq, amp, octaves, ampMult, time)
loopIn(type, numKeyframes)
loopOut(type, numKeyframes)
```

### Контекст выражений
```javascript
// Доступные переменные в выражениях:
time        // Текущее время в секундах
frame       // Текущий номер кадра
fps         // Кадров в секунду
value       // Текущее значение свойства
velocity    // Текущая скорость
index       // Индекс слоя
comp        // Информация о композиции {width, height, duration}
```

### Примеры выражений
```javascript
// Эффект дрожания
value + wiggle(2, 50)

// Синусоидальные колебания
value + sin(time * 2 * Math.PI) * 50

// Появление за 0.5 секунды
value * clamp(time * 2, 0, 1)

// Печатная машинка для текста
Math.floor(time * 10)

// Затухающий маятник
45 * Math.exp(-0.1 * time) * sin(2 * Math.PI * time / 1.5)
```

## Пресеты анимации

### Категории
- **Текстовые анимации** - Печатная машинка, скремблирование, волна текста
- **Переходы** - Затухания, скольжения, масштабирования
- **Трансформации** - Анимации масштаба, поворота, позиции
- **Эффекты** - Размытие, свечение, тени
- **Поведения** - Дрожание, пульсация, маятник

### Использование пресетов
```typescript
import { applyPreset, getPresetById } from './services/preset-manager'

// Применение пресета для создания слоя анимации
const preset = getPresetById('typewriter')
const animationLayer = applyPreset(preset, {
  startTime: 0,
  duration: 2,
  customizations: {
    'opacity': { min: 0, max: 1 }
  }
})
```

## Интеграция с Timeline

### Расширение клипов Timeline
```typescript
import { applyMotionToClip } from './services/timeline-integration'

// Добавление анимации к клипу
const animatedClip = applyMotionToClip(clip, animationTrack)

// Вычисление анимации в конкретное время
const values = evaluateClipMotionAtTime(animatedClip, 1.5)
// Возвращает: { opacity: 0.75, position: [100, 200], ... }
```

### Анимационные данные в клипах
```typescript
interface AnimatedTimelineClip extends TimelineClip {
  motion?: {
    tracks: AnimationTrack[]
    enabled: boolean
  }
}
```

## Примеры использования

### Базовая анимация
```typescript
import { createKeyframe, addKeyframeToProperty } from './services/keyframe-manager'

// Создание анимации прозрачности
const property: AnimatedProperty = {
  id: 'opacity',
  name: 'Прозрачность',
  path: 'opacity',
  type: 'number',
  keyframes: [],
  enabled: true
}

// Добавление ключевых кадров
property = addKeyframeToProperty(property, createKeyframe(0, 0, 'ease-out'))
property = addKeyframeToProperty(property, createKeyframe(1, 1, 'linear'))
```

### Использование выражений
```typescript
import { ExpressionEvaluator } from './services/expression-engine'

const evaluator = new ExpressionEvaluator()
const context: ExpressionContext = {
  time: 1.5,
  frame: 45,
  fps: 30,
  value: 100,
  // ... другой контекст
}

const result = evaluator.evaluate(
  'value + sin(time * 2 * Math.PI) * 50',
  context
)
```

### Создание пользовательских пресетов
```typescript
import { createPresetFromLayer } from './services/preset-manager'

const customPreset = createPresetFromLayer(animationLayer, {
  name: 'Моя анимация',
  description: 'Пользовательский эффект отскока',
  category: 'effects',
  tags: ['отскок', 'пользовательский']
})
```

## Оптимизация производительности

- Выражения компилируются и кэшируются для производительности
- Интерполяция ключевых кадров использует оптимизированные алгоритмы
- Композитинг слоёв выполняется эффективно
- Вычисляются только видимые свойства
- Умное кэширование вычисленных значений

## Лучшие практики

1. **Плотность ключевых кадров** - Используйте минимум кадров для плавной анимации
2. **Сложность выражений** - Держите выражения простыми для лучшей производительности
3. **Организация слоёв** - Группируйте связанные свойства в слои
4. **Использование пресетов** - Начинайте с пресетов и настраивайте по необходимости
5. **Интеграция с Timeline** - Убедитесь, что длительность анимации соответствует клипу

## Тестирование

```bash
# Запуск тестов motion graphics
bun run test src/features/motion-graphics

# Тестирование конкретных компонентов
bun run test src/features/motion-graphics/__tests__/keyframe-manager.test.ts
bun run test src/features/motion-graphics/__tests__/interpolation.test.ts
```

## Зависимости

- React 19+ для UI компонентов
- XState для управления состоянием (если используется)
- Canvas API для редактора кривых
- Внешние библиотеки анимации не требуются

## Будущие улучшения

- [ ] Симуляция размытия движения
- [ ] Расширенный редактор кривых сглаживания
- [ ] Автодополнение выражений
- [ ] Маркетплейс шаблонов анимации
- [ ] GPU ускорение для сложных анимаций
- [ ] Импорт данных motion capture

## Лицензия

Часть проекта Timeline Studio - см. лицензию основного проекта.