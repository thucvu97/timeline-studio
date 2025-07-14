# AI Content Intelligence Components

React компоненты для UI модуля AI Content Intelligence.

## 📁 Структура

```
components/
├── unified-dashboard/      # Главная панель управления AI
│   ├── index.tsx          # Основной компонент дашборда
│   ├── action-panel.tsx   # Панель действий
│   └── tabs/              # Вкладки дашборда
│       ├── overview-tab.tsx
│       ├── pipeline-tab.tsx
│       ├── results-tab.tsx
│       ├── scripts-tab.tsx
│       └── metrics-tab.tsx
├── generation-wizard/      # Мастер генерации контента
│   ├── index.tsx
│   └── steps/
│       ├── content-selection.tsx
│       ├── template-selection.tsx
│       ├── style-configuration.tsx
│       └── generation-review.tsx
├── analysis-viewer/        # Просмотр результатов анализа
│   ├── index.tsx
│   ├── scene-details.tsx
│   ├── key-moments.tsx
│   ├── quality-metrics.tsx
│   └── suggestions.tsx
├── preview-grid/           # Сетка превью контента
│   ├── index.tsx
│   ├── preview-card.tsx
│   ├── filter-bar.tsx
│   └── selection-actions.tsx
├── shared/                 # Общие компоненты
│   ├── loading-states.tsx
│   ├── error-display.tsx
│   └── progress-indicators.tsx
└── README.md
```

## 🎨 Компоненты

### UnifiedDashboard

Главный компонент для управления всеми AI функциями.

```tsx
import { UnifiedDashboard } from '@/features/ai-content-intelligence/components/unified-dashboard'

<UnifiedDashboard 
  className="h-full"
  onClose={() => setShowAI(false)}
/>
```

**Props:**
- `className?: string` - CSS классы
- `onClose?: () => void` - Обработчик закрытия

**Возможности:**
- Пять вкладок: Overview, Pipeline, Results, Scripts, Metrics
- Управление AI pipeline через XState
- Отображение результатов анализа с персонажами
- Просмотр сгенерированных сценариев
- Метрики качества и рекомендации

### ActionPanel

Панель с кнопками управления процессом анализа.

```tsx
<ActionPanel
  isProcessing={isProcessing}
  hasFiles={selectedFiles.length > 0}
  onAnalyze={handleAnalyze}
  onProcess={handleProcessProject}
  onPause={pausePipeline}
  onResume={resumePipeline}
  onCancel={cancelPipeline}
/>
```

**Props:**
- `isProcessing: boolean` - Идет ли обработка
- `hasFiles: boolean` - Есть ли выбранные файлы
- `onAnalyze: () => void` - Запуск анализа
- `onProcess: () => void` - Запуск полной обработки
- `onPause: () => void` - Пауза
- `onResume: () => void` - Продолжение
- `onCancel: () => void` - Отмена

### GenerationWizard

Мастер генерации контента с пошаговым интерфейсом.

```tsx
import { GenerationWizard } from '@/features/ai-content-intelligence/components/generation-wizard'

<GenerationWizard
  onComplete={(config) => handleGenerate(config)}
  onCancel={() => setShowWizard(false)}
/>
```

**Props:**
- `onComplete: (config: GenerationConfig) => void` - Обработчик завершения
- `onCancel: () => void` - Обработчик отмены
- `initialConfig?: Partial<GenerationConfig>` - Начальная конфигурация

**Шаги:**
1. Выбор контента для генерации
2. Выбор шаблона (опционально)
3. Настройка стиля и параметров
4. Превью и подтверждение

### AnalysisViewer

Компонент для детального отображения результатов AI анализа.

```tsx
import { AnalysisViewer } from '@/features/ai-content-intelligence/components/analysis-viewer'

<AnalysisViewer
  analysis={contentAnalysis}
  suggestions={suggestions}
  onSuggestionApply={(suggestion) => applySuggestion(suggestion)}
/>
```

**Props:**
- `analysis: UnifiedContentAnalysis` - Результаты анализа
- `suggestions?: ContentSuggestion[]` - Предложения по улучшению
- `onSuggestionApply?: (suggestion: ContentSuggestion) => void` - Применение предложения

**Отображает:**
- Детали анализа сцен
- Обнаруженные объекты и персонажи
- Ключевые моменты с таймкодами
- Метрики качества видео
- Предложения с приоритетами

### PreviewGrid

Сетка превью контента с возможностью фильтрации и выбора.

```tsx
import { PreviewGrid } from '@/features/ai-content-intelligence/components/preview-grid'

<PreviewGrid
  scenes={analysisResult.scenes}
  onSceneSelect={(scene) => handleSceneSelect(scene)}
  onBatchAction={(action, scenes) => handleBatchAction(action, scenes)}
/>
```

**Props:**
- `scenes: SceneAnalysis[]` - Массив сцен для отображения
- `onSceneSelect?: (scene: SceneAnalysis) => void` - Выбор сцены
- `onBatchAction?: (action: string, scenes: SceneAnalysis[]) => void` - Групповые действия
- `filterOptions?: PreviewFilterOptions` - Опции фильтрации

**Возможности:**
- Фильтрация по типу сцены, качеству, длительности
- Мультивыбор с checkbox
- Превью миниатюр с hover эффектами
- Отображение обнаруженных персонажей

## 🆕 Новые возможности

### Интеграция с Person Identification
- Отображение обнаруженных персонажей в результатах анализа
- Статистика появлений персонажей в сценах
- Генерация диалогов с реальными персонажами

### OCR и анализ композиции
- Распознавание текста в видео
- Анализ правила третей, баланса и направляющих линий
- Оценка глубины и цветовой гармонии

### Улучшенные компоненты
- **GenerationWizard** - мастер с пошаговым интерфейсом
- **AnalysisViewer** - детальный просмотр результатов
- **PreviewGrid** - умная сетка превью с фильтрами
- **UnifiedDashboard** - расширен до 5 вкладок

## 🎯 Использование

### Интеграция в приложение

```tsx
import { useState } from 'react'
import { UnifiedDashboard } from '@/features/ai-content-intelligence/components'

function App() {
  const [showAIDashboard, setShowAIDashboard] = useState(false)
  
  return (
    <>
      <Button onClick={() => setShowAIDashboard(true)}>
        Open AI Intelligence
      </Button>
      
      {showAIDashboard && (
        <UnifiedDashboard
          onClose={() => setShowAIDashboard(false)}
        />
      )}
    </>
  )
}
```

### Кастомизация стилей

Все компоненты используют Tailwind CSS и поддерживают className prop:

```tsx
<UnifiedDashboard 
  className="bg-dark-900 text-white rounded-xl shadow-2xl"
/>
```

## 🔧 Конфигурация

Компоненты используют контекст и хуки для получения данных:

```tsx
// В UnifiedDashboard
const {
  isProcessing,
  progress,
  error,
  result,
  analyzeContent,
  processProject,
} = useAIIntelligence()
```

## 📱 Адаптивность

Компоненты адаптированы для различных размеров экранов:
- Desktop: Две колонки (controls + results)
- Tablet: Одна колонка с табами
- Mobile: Упрощенный интерфейс

## 🎨 Темы

Поддержка светлой и темной темы через CSS переменные:
- `--background`
- `--foreground`
- `--muted`
- `--primary`
- `--destructive`

## ⚡ Оптимизация

- Ленивая загрузка результатов
- Мемоизация тяжелых вычислений
- Виртуализация длинных списков
- Оптимистичные обновления UI