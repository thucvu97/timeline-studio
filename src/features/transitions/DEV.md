# Transitions - Техническая документация

## 📁 Структура модуля

```
transitions/
├── components/
│   ├── transition-group.tsx          # Группировка переходов по категориям
│   ├── transition-preview.tsx        # Компонент предпросмотра перехода
│   └── transition/                   # Компоненты для timeline
│       ├── timeline-transition.tsx   # Визуализация на таймлайне
│       ├── transition-handles.tsx    # Интерактивные handles
│       ├── transition-curve-editor.tsx    # Редактор кривых
│       ├── transition-curve-preview.tsx   # Превью кривых
│       ├── transition-curve-visualizer.tsx # Анимированная визуализация
│       └── transition-control-panel.tsx   # Панель управления
├── data/
│   ├── transitions.json             # Базовые переходы (30 штук)
│   └── advanced-transitions.json    # Расширенные переходы (10 штук)
├── hooks/
│   ├── use-transitions.ts           # Загрузка и управление переходами
│   ├── use-transitions-import.ts    # Импорт пользовательских переходов
│   ├── use-advanced-transitions.ts  # WebGL интеграция
│   └── use-timeline-transitions.ts  # Timeline интеграция
├── services/
│   └── webgl-transition-service.ts  # GPU рендеринг переходов
├── types/
│   ├── transitions.ts               # Базовые типы переходов
│   └── timeline-transition.ts       # Расширенная модель для timeline
├── utils/
│   └── transition-processor.ts      # Обработка и валидация данных
└── __tests__/                       # Тесты компонентов и хуков
```

## 🏗️ Архитектура

### Модель данных

#### Базовый переход (Transition)
```typescript
interface Transition {
  id: string
  type: string
  labels: Record<string, string>
  description: Record<string, string>
  category: TransitionCategory
  complexity: TransitionComplexity
  tags: TransitionTag[]
  duration: {
    min: number
    max: number
    default: number
  }
  parameters?: {
    direction?: string
    easing?: string
    intensity?: number
    blur?: {
      enabled?: boolean
      amount?: number
      type?: "gaussian" | "motion" | "radial"
    }
    color?: {
      enabled?: boolean
      tint?: string
      saturation?: number
      brightness?: number
    }
    perspective?: {
      enabled?: boolean
      rotationX?: number
      rotationY?: number
      rotationZ?: number
    }
  }
  ffmpegCommand: (params) => string
  gpuAccelerated?: boolean
  webglShader?: string
}
```

#### Переход на таймлайне (TimelineTransition)
```typescript
interface TimelineTransition {
  id: string
  transitionId: string
  type: "between" | "in" | "out" | "adjustment"
  position: number
  duration: number
  parameters: TransitionParameters
  keyframes: TransitionKeyframe[]
  curve: TransitionCurve
  isEnabled: boolean
  isSelected: boolean
  isLocked: boolean
  renderCache: RenderCache | null
}
```

### WebGL сервис

WebGLTransitionService предоставляет GPU ускоренный рендеринг:

- **Blur шейдеры**: gaussian, motion, radial blur
- **Color шейдеры**: tint, saturation, brightness adjustments
- **Texture management**: создание и управление WebGL текстурами
- **Shader compilation**: компиляция и кеширование шейдеров

### Resource Manager интеграция

Функции для управления TimelineTransition в проекте:

- `addTimelineTransitionToResources()` - добавление в ресурсы
- `createTimelineTransition()` - создание с параметрами
- `updateTimelineTransitionParameters()` - обновление параметров
- `addKeyframeToTimelineTransition()` - управление keyframes
- `cloneTimelineTransition()` - клонирование

## 🔧 Использование

### Базовое использование
```typescript
import { useTransitions } from '@/features/transitions'

function TransitionPicker() {
  const { transitions, loading } = useTransitions()
  
  return (
    <div>
      {transitions.map(transition => (
        <TransitionPreview 
          key={transition.id}
          transition={transition}
        />
      ))}
    </div>
  )
}
```

### Расширенное использование с WebGL
```typescript
import { useAdvancedTransitions } from '@/features/transitions'

function AdvancedTransitionEditor() {
  const { 
    advancedTransitions,
    initializeWebGL,
    previewTransition,
    isWebGLInitialized 
  } = useAdvancedTransitions()
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      initializeWebGL(canvas)
    }
  }, [])
  
  // Предпросмотр перехода
  const handlePreview = async (transition) => {
    const result = await previewTransition({
      transition,
      sourceImage,
      targetImage,
      progress: 0.5,
      canvas: canvasRef.current
    })
  }
}
```

### Timeline интеграция
```typescript
import { useTimelineTransitions } from '@/features/timeline'

function TimelineEditor({ project }) {
  const {
    createTransition,
    updateTransitionParameters,
    addKeyframe,
    getTransitionsStats
  } = useTimelineTransitions(project)
  
  // Создание перехода на таймлайне
  const handleAddTransition = (transitionResource) => {
    const { project: updated, timelineTransition } = createTransition(
      transitionResource,
      {
        position: currentTime,
        duration: 1.0,
        type: 'between',
        parameters: {
          blur: { enabled: true, amount: 50 }
        }
      }
    )
  }
}
```

## 🧪 Тестирование

### Запуск тестов
```bash
bun run test src/features/transitions
```

### Структура тестов
- `hooks/` - тесты хуков (use-transitions, use-advanced-transitions)
- `components/` - тесты компонентов визуализации
- `utils/` - тесты обработки данных
- `services/` - тесты WebGL сервиса (TODO)

## 🎨 Создание новых переходов

### 1. Добавление в JSON
```json
{
  "id": "my-transition",
  "type": "my-transition",
  "labels": {
    "ru": "Мой переход",
    "en": "My Transition"
  },
  "category": "custom",
  "parameters": {
    "blur": {
      "enabled": true,
      "amount": 30,
      "type": "gaussian"
    }
  },
  "ffmpegTemplate": "...",
  "gpuAccelerated": true,
  "webglShader": "my-transition"
}
```

### 2. Создание WebGL шейдера
```glsl
// В webgl-transition-service.ts
const MY_TRANSITION_SHADER = `
precision mediump float;
uniform sampler2D u_sourceTexture;
uniform sampler2D u_targetTexture;
uniform float u_progress;
// ... параметры

void main() {
  vec4 source = texture2D(u_sourceTexture, v_texCoord);
  vec4 target = texture2D(u_targetTexture, v_texCoord);
  
  // Ваша логика перехода
  
  gl_FragColor = mix(source, target, u_progress);
}
`
```

## ⚡ Оптимизация производительности

### WebGL оптимизации
- Переиспользование текстур и шейдеров
- Кеширование скомпилированных программ
- Минимизация uniform обновлений
- Использование requestAnimationFrame

### Управление памятью
- Автоматическая очистка неиспользуемых ресурсов
- Виртуализация списков переходов
- Ленивая загрузка превью

## 🔮 Планы развития

### Краткосрочные
- [ ] Тесты для WebGL сервиса
- [ ] Оптимизация шейдеров
- [ ] Больше предустановок кривых

### Долгосрочные
- [ ] WebGPU поддержка
- [ ] Пользовательские шейдеры
- [ ] AI-генерация переходов
- [ ] Экспорт в After Effects