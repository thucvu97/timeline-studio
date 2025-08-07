# Timeline AI Usage Examples

Подробное руководство по использованию Timeline AI для создания проектов и автоматизации видеомонтажа.

## Базовое использование

### 1. Создание timeline из промпта

```typescript
import { useTimelineAI } from '@/features/ai-chat/hooks'

function CreateTimelineExample() {
  const { createTimelineFromPrompt } = useTimelineAI()

  const handleCreateTimeline = async () => {
    const result = await createTimelineFromPrompt(`
      Создай свадебное видео из всех доступных файлов:
      - Длительность: 5-7 минут
      - Добавь романтичную музыку
      - Используй плавные переходы
      - Примени цветокоррекцию в теплых тонах
      - Добавь титры с именами жениха и невесты
    `)
    
    if (result.success) {
      console.log('Timeline создан:', result.data?.createdProject)
      console.log('Следующие действия:', result.nextActions)
      
      // Обработка созданных ресурсов
      if (result.data?.addedResources) {
        console.log('Добавлено ресурсов:', result.data.addedResources.length)
      }
      
      // Обработка размещенных клипов
      if (result.data?.placedClips) {
        console.log('Размещено клипов:', result.data.placedClips.length)
      }
    } else {
      console.error('Ошибки создания timeline:', result.errors)
      
      // Показываем предупреждения пользователю
      if (result.warnings?.length) {
        console.warn('Предупреждения:', result.warnings)
      }
    }
  }

  return (
    <button onClick={handleCreateTimeline}>
      Создать свадебное видео
    </button>
  )
}
```

### 2. Анализ и предложение ресурсов

```typescript
function AnalyzeResourcesExample() {
  const { analyzeAndSuggestResources } = useTimelineAI()

  const handleAnalyze = async () => {
    const result = await analyzeAndSuggestResources(`
      Проанализируй все видеофайлы:
      - Определи качество каждого видео
      - Найди лучшие моменты для монтажа
      - Предложи оптимальную последовательность
      - Выяви проблемы с качеством
      - Предложи подходящие эффекты
    `)
    
    if (result.success && result.data?.analysis) {
      const analysis = result.data.analysis
      
      console.log('Анализ содержимого:', analysis.content)
      console.log('Предложения по улучшению:', result.data.suggestions)
      
      // Отображение результатов анализа
      if (analysis.scenes) {
        console.log('Найдено сцен:', analysis.scenes.length)
      }
      
      if (analysis.persons) {
        console.log('Найдено персон:', analysis.persons.length)
      }
      
      if (analysis.quality) {
        console.log('Оценка качества:', analysis.quality)
      }
    }
  }

  return (
    <div>
      <button onClick={handleAnalyze}>
        Анализировать ресурсы
      </button>
    </div>
  )
}
```

### 3. Выполнение пользовательских команд

```typescript
function CustomCommandExample() {
  const { executeCommand } = useTimelineAI()

  const handleCustomCommand = async () => {
    const result = await executeCommand(
      "create-documentary-style", 
      {
        style: "documentary",
        mood: "informative",
        duration: 600, // 10 минут
        includeNarration: false,
        addSubtitles: true,
        musicStyle: "ambient"
      }
    )
    
    if (result.success) {
      console.log('Команда выполнена:', result.message)
      
      // Обработка примененных улучшений
      if (result.data?.appliedEnhancements) {
        result.data.appliedEnhancements.forEach(enhancement => {
          console.log('Применено улучшение:', enhancement)
        })
      }
      
      // Показ следующих рекомендуемых действий
      if (result.nextActions) {
        console.log('Рекомендуемые следующие шаги:')
        result.nextActions.forEach(action => console.log('-', action))
      }
    } else {
      console.error('Ошибка выполнения команды:', result.errors)
    }
  }

  return (
    <button onClick={handleCustomCommand}>
      Создать документальный стиль
    </button>
  )
}
```

## Интеграция с чатом

### 4. Интеграция Timeline AI с чатом

```typescript
function ChatTimelineIntegration() {
  const { createTimelineFromPrompt, executeCommand } = useTimelineAI()
  const { sendChatMessage } = useChatActions()
  const { chatMessages, isProcessing } = useChatState()

  // Обработчик сообщений чата для Timeline команд
  const handleChatMessage = async (message: string) => {
    const lowerMessage = message.toLowerCase()
    
    // Определяем тип команды по ключевым словам
    if (lowerMessage.includes('создай timeline') || 
        lowerMessage.includes('сделай видео') ||
        lowerMessage.includes('создай проект')) {
      
      try {
        const result = await createTimelineFromPrompt(message)
        
        // Отправляем результат обратно в чат
        const responseMessage = result.success 
          ? `✅ Timeline создан успешно: ${result.message}`
          : `❌ Ошибка создания timeline: ${result.errors?.join(', ')}`
        
        await sendChatMessage(responseMessage)
        
        // Добавляем предложения по следующим шагам
        if (result.success && result.nextActions) {
          const suggestionsMessage = `📝 Рекомендуемые следующие шаги:\n${result.nextActions.map(action => `• ${action}`).join('\n')}`
          await sendChatMessage(suggestionsMessage)
        }
        
      } catch (error) {
        await sendChatMessage(`❌ Произошла ошибка: ${error.message}`)
      }
      
    } else if (lowerMessage.includes('анализ') || lowerMessage.includes('проверь')) {
      
      // Команды анализа
      try {
        const result = await executeCommand("analyze-current-project")
        
        const analysisMessage = result.success
          ? `📊 Анализ завершен: ${result.message}`
          : `❌ Ошибка анализа: ${result.errors?.join(', ')}`
        
        await sendChatMessage(analysisMessage)
        
      } catch (error) {
        await sendChatMessage(`❌ Ошибка анализа: ${error.message}`)
      }
    }
  }

  return (
    <div className="chat-timeline-integration">
      <div className="chat-messages">
        {chatMessages.map(message => (
          <div key={message.id} className={`message ${message.role}`}>
            <strong>{message.role}:</strong> {message.content}
          </div>
        ))}
      </div>
      
      <ChatInput
        onSendMessage={handleChatMessage}
        disabled={isProcessing}
        placeholder="Напишите команду для timeline (например: 'Создай свадебное видео из всех файлов')"
      />
    </div>
  )
}

// Компонент для ввода сообщений
function ChatInput({ onSendMessage, disabled, placeholder }) {
  const [input, setInput] = useState('')
  
  const handleSubmit = () => {
    if (input.trim()) {
      onSendMessage(input)
      setInput('')
    }
  }
  
  return (
    <div className="chat-input">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={placeholder}
        disabled={disabled}
      />
      <button onClick={handleSubmit} disabled={disabled || !input.trim()}>
        {disabled ? 'Обрабатывается...' : 'Отправить'}
      </button>
    </div>
  )
}
```

## Типовые сценарии использования

### 5. Свадебное видео

```typescript
const createWeddingVideo = async () => {
  const { createTimelineFromPrompt, executeCommand } = useTimelineAI()
  
  // Шаг 1: Создание базовой структуры
  const timelineResult = await createTimelineFromPrompt(`
    Создай свадебное видео длительностью 6-8 минут:
    
    Структура:
    1. Подготовка (2 минуты): фото и видео сборов
    2. Церемония (3-4 минуты): основные моменты свадьбы
    3. Празднование (2 минуты): банкет, первый танец
    
    Стиль:
    - Романтичная атмосфера
    - Теплая цветокоррекция (золотистые тона)
    - Плавные переходы между сценами
    - Нежная фоновая музыка
    
    Технические требования:
    - Разрешение: 1920x1080
    - Формат экспорта: MP4
    - Добавить титры с именами и датой
  `)
  
  if (timelineResult.success) {
    console.log('Базовая estrutура создана')
    
    // Шаг 2: Добавление специальных эффектов
    await executeCommand("add-wedding-effects", {
      effects: ["romantic-glow", "soft-focus", "warm-color-grade"],
      transitionStyle: "crossfade",
      titleTemplate: "elegant-script"
    })
    
    // Шаг 3: Синхронизация с музыкой
    await executeCommand("sync-to-music", {
      musicGenre: "romantic",
      beatSync: true,
      emotionalCues: ["ceremony-highlight", "first-dance"]
    })
    
    console.log('Свадебное видео готово!')
  }
}
```

### 6. Тревел-видео

```typescript
const createTravelVideo = async () => {
  const { createTimelineFromPrompt } = useTimelineAI()
  
  const result = await createTimelineFromPrompt(`
    Создай динамичное тревел-видео:
    
    Концепция:
    - Показать путешествие от начала до конца
    - Группировать контент по локациям/дням
    - Подчеркнуть самые яркие моменты
    
    Визуальный стиль:
    - Яркие насыщенные цвета
    - Быстрые энергичные переходы
    - Замедленная съемка для эффектных кадров
    - Ускоренная съемка для перемещений
    
    Структура:
    1. Вступление: карта маршрута (30 сек)
    2. Основная часть: локации и активности (4-5 мин)
    3. Заключение: лучшие моменты (30 сек)
    
    Аудио:
    - Энергичная фоновая музыка
    - Звуки окружения в ключевых моментах
    
    Дополнительно:
    - Географические титры для каждой локации
    - Временные метки для дней путешествия
    - Статистика путешествия в конце
  `)
  
  return result
}
```

### 7. Корпоративная презентация

```typescript
const createCorporatePresentation = async () => {
  const { createTimelineFromPrompt, executeCommand } = useTimelineAI()
  
  // Создание основной структуры
  const result = await createTimelineFromPrompt(`
    Создай профессиональную корпоративную презентацию:
    
    Структура (8-10 минут):
    1. Заставка с логотипом (10 сек)
    2. О компании (2 мин): история, миссия, ценности
    3. Команда (2 мин): интервью с ключевыми сотрудниками  
    4. Продукты/услуги (3 мин): демонстрация возможностей
    5. Клиенты (2 мин): отзывы и кейсы
    6. Заключение и контакты (30 сек)
    
    Визуальный стиль:
    - Деловая и профессиональная подача
    - Корпоративные цвета компании
    - Четкие переходы между разделами
    - Инфографика для статистики
    
    Технические требования:
    - Качество: Full HD (1920x1080)
    - Субтитры для всех говорящих
    - Брендинг: логотипы и фирменные элементы
    - Формат: подходящий для презентаций
  `)
  
  if (result.success) {
    // Добавление корпоративного стиля
    await executeCommand("apply-corporate-branding", {
      primaryColor: "#1a365d",
      secondaryColor: "#2d8cc8", 
      logoPosition: "bottom-right",
      fontFamily: "professional"
    })
    
    // Добавление интерактивных элементов
    await executeCommand("add-corporate-graphics", {
      includeCharts: true,
      includeTimeline: true,
      includeCallouts: true
    })
  }
  
  return result
}
```

## Обработка ошибок и мониторинг

### 8. Комплексная обработка ошибок

```typescript
function ErrorHandlingExample() {
  const { createTimelineFromPrompt, initializeApiKey } = useTimelineAI()
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Инициализация при монтировании
  useEffect(() => {
    const initializeAI = async () => {
      try {
        const apiReady = await initializeApiKey()
        if (!apiReady) {
          setError('API ключ не настроен. Перейдите в настройки для конфигурации.')
          return
        }
        setIsReady(true)
      } catch (error) {
        setError(`Ошибка инициализации: ${error.message}`)
      }
    }
    
    initializeAI()
  }, [])

  const handleCreateWithErrorHandling = async (prompt: string) => {
    if (!isReady) {
      setError('AI сервис не готов. Проверьте настройки.')
      return
    }
    
    setError(null)
    
    try {
      const result = await createTimelineFromPrompt(prompt)
      
      if (!result.success) {
        // Обработка различных типов ошибок
        const errorMessages = result.errors || []
        
        if (errorMessages.some(e => e.includes('API key'))) {
          setError('Проблема с API ключом. Проверьте настройки.')
        } else if (errorMessages.some(e => e.includes('quota'))) {
          setError('Превышен лимит запросов. Попробуйте позже.')
        } else if (errorMessages.some(e => e.includes('network'))) {
          setError('Проблема с сетью. Проверьте подключение к интернету.')
        } else {
          setError(`Ошибка создания timeline: ${errorMessages.join('; ')}`)
        }
        
        // Логируем детальную информацию для отладки
        console.error('Timeline AI Error Details:', {
          errors: result.errors,
          warnings: result.warnings,
          executionTime: result.executionTime
        })
        
        return null
      }
      
      // Показываем предупреждения, если есть
      if (result.warnings?.length) {
        console.warn('Timeline AI Warnings:', result.warnings)
        // Можно показать пользователю неблокирующее уведомление
      }
      
      return result
      
    } catch (error) {
      setError(`Неожиданная ошибка: ${error.message}`)
      console.error('Unexpected Timeline AI Error:', error)
      return null
    }
  }

  return (
    <div className="timeline-ai-with-error-handling">
      {error && (
        <div className="error-message">
          <strong>Ошибка:</strong> {error}
          <button onClick={() => setError(null)}>Закрыть</button>
        </div>
      )}
      
      <button
        onClick={() => handleCreateWithErrorHandling("Создай простое видео из доступных файлов")}
        disabled={!isReady}
      >
        {isReady ? 'Создать видео' : 'Инициализация...'}
      </button>
      
      {!isReady && !error && <div>Настройка AI сервиса...</div>}
    </div>
  )
}
```

### 9. Мониторинг производительности

```typescript
function PerformanceMonitoringExample() {
  const { executeCommand } = useTimelineAI()
  const [metrics, setMetrics] = useState<any[]>([])

  const executeWithTiming = async (commandName: string, params: any = {}) => {
    const startTime = Date.now()
    const operationId = `${commandName}_${Date.now()}`
    
    try {
      console.log(`[${operationId}] Начало выполнения команды: ${commandName}`)
      
      const result = await executeCommand(commandName, params)
      
      const totalTime = Date.now() - startTime
      const aiExecutionTime = result.executionTime
      
      const metric = {
        id: operationId,
        command: commandName,
        success: result.success,
        totalTime,
        aiExecutionTime,
        networkTime: totalTime - aiExecutionTime,
        timestamp: new Date(),
        errors: result.errors?.length || 0,
        warnings: result.warnings?.length || 0
      }
      
      setMetrics(prev => [...prev, metric])
      
      console.log(`[${operationId}] Завершено за ${totalTime}ms`, {
        aiTime: aiExecutionTime,
        networkTime: metric.networkTime,
        success: result.success
      })
      
      // Отправка метрик в аналитику
      if (window.analytics) {
        window.analytics.track('timeline_ai_operation', {
          command: commandName,
          success: result.success,
          execution_time: totalTime,
          ai_execution_time: aiExecutionTime,
          has_errors: result.errors?.length > 0,
          has_warnings: result.warnings?.length > 0
        })
      }
      
      return result
      
    } catch (error) {
      const totalTime = Date.now() - startTime
      
      const errorMetric = {
        id: operationId,
        command: commandName,
        success: false,
        totalTime,
        aiExecutionTime: 0,
        networkTime: totalTime,
        timestamp: new Date(),
        error: error.message,
        errors: 1,
        warnings: 0
      }
      
      setMetrics(prev => [...prev, errorMetric])
      
      console.error(`[${operationId}] Ошибка через ${totalTime}ms:`, error)
      
      // Отправка ошибки в аналитику
      if (window.analytics) {
        window.analytics.track('timeline_ai_error', {
          command: commandName,
          error_message: error.message,
          execution_time: totalTime
        })
      }
      
      throw error
    }
  }

  // Компонент для отображения метрик
  const MetricsDisplay = () => (
    <div className="metrics-display">
      <h3>Метрики производительности Timeline AI</h3>
      <div className="metrics-summary">
        <div>Всего операций: {metrics.length}</div>
        <div>Успешных: {metrics.filter(m => m.success).length}</div>
        <div>Среднее время: {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.totalTime, 0) / metrics.length) : 0}ms</div>
      </div>
      
      <div className="metrics-list">
        {metrics.slice(-10).reverse().map(metric => (
          <div key={metric.id} className={`metric-item ${metric.success ? 'success' : 'error'}`}>
            <div><strong>{metric.command}</strong></div>
            <div>Время: {metric.totalTime}ms (AI: {metric.aiExecutionTime}ms)</div>
            <div>{metric.success ? '✅' : '❌'} {metric.timestamp.toLocaleTimeString()}</div>
            {metric.error && <div className="error-text">{metric.error}</div>}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="performance-monitoring-example">
      <div className="actions">
        <button onClick={() => executeWithTiming("create-simple-timeline")}>
          Создать простой timeline
        </button>
        <button onClick={() => executeWithTiming("analyze-project-quality")}>
          Анализ качества проекта
        </button>
        <button onClick={() => executeWithTiming("optimize-timeline", { removeGaps: true })}>
          Оптимизировать timeline
        </button>
      </div>
      
      <MetricsDisplay />
    </div>
  )
}
```

## Лучшие практики

### 10. Оптимизация промптов для лучших результатов

```typescript
// ❌ Плохие примеры промптов
const badPrompts = [
  "Сделай видео",
  "Улучши качество", 
  "Добавь эффекты",
  "Создай что-то красивое"
]

// ✅ Хорошие примеры промптов
const goodPrompts = [
  `Создай туристическое видео длительностью 3-4 минуты:
   - Используй все видео из папки "Отпуск 2024"
   - Добавь динамичную музыку в стиле indie rock
   - Группируй кадры по дням путешествия  
   - Примени яркую цветокоррекцию с акцентом на голубые тона
   - Добавь географические титры для каждой локации`,
   
  `Оптимизируй текущий проект для социальных сетей:
   - Создай версию 9:16 для Instagram Stories
   - Добавь субтитры с крупным шрифтом
   - Увеличь насыщенность цветов на 20%
   - Укороти до 60 секунд, оставив самые яркие моменты
   - Добавь призыв к действию в конце`,
   
  `Проанализируй качество всех видеофайлов и предложи улучшения:
   - Проверь стабилизацию камеры  
   - Оцени качество звука и предложи коррекцию
   - Найди кадры с плохим освещением
   - Определи оптимальные настройки экспорта
   - Предложи порядок монтажа для лучшего восприятия`
]

// Функция для создания контекстуальных промптов
const createContextualPrompt = (basePrompt: string, context: any) => {
  const contextualInfo = []
  
  if (context.currentProject) {
    contextualInfo.push(`Текущий проект: ${context.currentProject.name}`)
    contextualInfo.push(`Длительность: ${context.currentProject.duration} секунд`)
  }
  
  if (context.availableResources) {
    contextualInfo.push(`Доступно ресурсов: ${context.availableResources.media} видео, ${context.availableResources.audio} аудио`)
  }
  
  if (context.userPreferences) {
    contextualInfo.push(`Предпочтения стиля: ${context.userPreferences.style}`)
  }
  
  return `${basePrompt}\n\nКонтекст:\n${contextualInfo.join('\n')}`
}
```

### 11. Работа с большими проектами

```typescript
function LargeProjectHandling() {
  const { executeCommand, createTimelineFromPrompt } = useTimelineAI()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')

  const processLargeProject = async (projectConfig: any) => {
    const steps = [
      { name: 'Анализ медиафайлов', weight: 20 },
      { name: 'Создание структуры timeline', weight: 30 },
      { name: 'Размещение клипов', weight: 25 },
      { name: 'Добавление переходов и эффектов', weight: 15 },
      { name: 'Финальная оптимизация', weight: 10 }
    ]
    
    let completedWeight = 0
    
    try {
      // Шаг 1: Анализ медиафайлов
      setCurrentStep(steps[0].name)
      const analysisResult = await executeCommand("analyze-large-project", {
        mediaCount: projectConfig.mediaFiles?.length || 0,
        estimatedDuration: projectConfig.targetDuration,
        complexity: projectConfig.complexity || 'medium'
      })
      
      completedWeight += steps[0].weight
      setProgress(completedWeight)
      
      if (!analysisResult.success) {
        throw new Error('Не удалось проанализировать проект')
      }
      
      // Шаг 2: Создание структуры
      setCurrentStep(steps[1].name)
      const structurePrompt = `
        Создай структуру для большого проекта:
        - Медиафайлов: ${projectConfig.mediaFiles?.length || 0}
        - Целевая длительность: ${projectConfig.targetDuration} минут
        - Стиль: ${projectConfig.style}
        - Разбей на логические секции
        - Оптимизируй для производительности
      `
      
      const timelineResult = await createTimelineFromPrompt(structurePrompt)
      completedWeight += steps[1].weight
      setProgress(completedWeight)
      
      if (!timelineResult.success) {
        throw new Error('Не удалось создать структуру timeline')
      }
      
      // Шаг 3: Размещение клипов (пакетная обработка)
      setCurrentStep(steps[2].name)
      const placementResult = await executeCommand("batch-place-clips", {
        strategy: "optimized",
        maxConcurrency: 3, // Ограничиваем параллелизм для стабильности
        priority: "quality" // или "speed"
      })
      
      completedWeight += steps[2].weight
      setProgress(completedWeight)
      
      // Шаг 4: Добавление эффектов
      setCurrentStep(steps[3].name)
      await executeCommand("apply-batch-effects", {
        transitionType: projectConfig.transitions || "smart",
        colorGrading: projectConfig.colorStyle || "auto",
        audioProcessing: true
      })
      
      completedWeight += steps[3].weight
      setProgress(completedWeight)
      
      // Шаг 5: Финальная оптимизация
      setCurrentStep(steps[4].name)
      await executeCommand("optimize-final-project", {
        removeUnusedAssets: true,
        optimizeTransitions: true,
        balanceAudio: true,
        exportSettings: projectConfig.exportSettings
      })
      
      completedWeight += steps[4].weight
      setProgress(completedWeight)
      setCurrentStep('Завершено')
      
      return { success: true, message: 'Большой проект успешно обработан' }
      
    } catch (error) {
      console.error('Ошибка обработки большого проекта:', error)
      setCurrentStep('Ошибка')
      return { success: false, error: error.message }
    }
  }

  return (
    <div className="large-project-handler">
      <div className="progress-indicator">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {currentStep} ({progress}%)
        </div>
      </div>
      
      <button onClick={() => processLargeProject({
        mediaFiles: new Array(50), // Симуляция 50 файлов
        targetDuration: 10,
        style: "documentary",
        complexity: "high"
      })}>
        Обработать большой проект (50+ файлов)
      </button>
    </div>
  )
}
```

Этот файл предоставляет полное руководство по использованию Timeline AI с реальными примерами кода, обработкой ошибок и лучшими практиками для различных сценариев видеомонтажа.