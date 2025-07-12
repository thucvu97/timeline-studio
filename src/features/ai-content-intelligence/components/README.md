# AI Content Intelligence Components

React компоненты для UI модуля AI Content Intelligence.

## 📁 Структура

```
components/
├── unified-dashboard/    # Главная панель управления AI
│   ├── index.tsx        # Основной компонент дашборда
│   ├── action-panel.tsx # Панель действий
│   ├── analysis-results.tsx # Отображение результатов
│   ├── dashboard-header.tsx # Заголовок дашборда
│   └── pipeline-status.tsx  # Статус обработки
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
- Три вкладки: Analysis, Script, Platforms
- Выбор файлов для анализа
- Отображение прогресса обработки
- Просмотр результатов анализа

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

### PipelineStatus

Отображение статуса обработки AI pipeline.

```tsx
<PipelineStatus progress={progress} />
```

**Props:**
- `progress: PipelineProgress` - Объект с информацией о прогрессе

**Отображает:**
- Общий прогресс (progress bar)
- Текущий шаг обработки
- Статус каждого шага
- Сообщения об ошибках

### AnalysisResults

Компонент для отображения результатов AI анализа.

```tsx
<AnalysisResults 
  result={analysisResult}
  activeTab="analysis"
/>
```

**Props:**
- `result: IntelligentContent` - Результаты анализа
- `activeTab: 'analysis' | 'script' | 'platforms'` - Активная вкладка

**Отображает:**
- Детали анализа сцен
- Сгенерированные скрипты
- Адаптации для платформ
- Ключевые моменты
- Метрики качества

### DashboardHeader

Заголовок дашборда с названием и кнопкой закрытия.

```tsx
<DashboardHeader onClose={handleClose} />
```

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