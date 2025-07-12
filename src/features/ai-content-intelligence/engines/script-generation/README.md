# Script Generation Engine

Движок для генерации скриптов, диалогов и текстового контента на основе AI анализа видео.

## 🎯 Возможности

- **Генерация скриптов** - создание полноценных сценариев
- **Стили повествования** - документальный, нарративный, обучающий
- **Диалоги и закадровый текст** - генерация речи персонажей
- **Мультиязычность** - поддержка 10+ языков
- **SEO оптимизация** - ключевые слова и описания
- **Адаптация под аудиторию** - разные целевые группы

## 📁 Структура

```
script-generation/
├── services/
│   └── script-generation-engine.ts  # Главный движок
├── templates/                       # Шаблоны скриптов
│   ├── documentary.ts
│   ├── narrative.ts
│   └── tutorial.ts
├── types.ts                        # TypeScript типы
└── README.md
```

## 🚀 Использование

### Базовая генерация

```typescript
import { ScriptGenerationEngine } from './services/script-generation-engine'

const engine = new ScriptGenerationEngine()

const script = await engine.generateScript(
  sceneAnalysis, // Результат анализа сцен
  {
    style: 'documentary',
    tone: 'professional',
    targetAudience: 'general',
    duration: 120,
    language: 'ru'
  }
)

console.log(script.scenes) // Сцены со скриптом
console.log(script.voiceover) // Закадровый текст
console.log(script.metadata) // Метаданные
```

### Генерация диалогов

```typescript
const dialogues = await engine.generateDialogues(
  sceneAnalysis,
  {
    characters: ['Host', 'Guest'],
    style: 'conversational',
    mood: 'friendly'
  }
)
```

### SEO оптимизация

```typescript
const seoContent = await engine.generateSEOContent(
  analysis,
  {
    platform: 'youtube',
    keywords: ['tutorial', 'guide'],
    maxDescriptionLength: 5000
  }
)

// Результат:
{
  title: "...",
  description: "...",
  tags: [...],
  hashtags: [...]
}
```

## 🎨 Стили скриптов

### Documentary (Документальный)

```typescript
{
  style: 'documentary',
  characteristics: {
    pacing: 'steady',
    tone: 'informative',
    structure: 'chronological',
    narration: 'third-person'
  }
}
```

**Пример вывода:**
```
"В начале 21 века технологии видеомонтажа претерпели 
революционные изменения. Этот процесс начался с..."
```

### Narrative (Повествовательный)

```typescript
{
  style: 'narrative',
  characteristics: {
    pacing: 'dynamic',
    tone: 'engaging',
    structure: 'story-driven',
    narration: 'first-person'
  }
}
```

**Пример вывода:**
```
"Я помню тот день, когда впервые открыл видеоредактор. 
Передо мной открылся целый мир возможностей..."
```

### Tutorial (Обучающий)

```typescript
{
  style: 'tutorial',
  characteristics: {
    pacing: 'clear',
    tone: 'instructional',
    structure: 'step-by-step',
    narration: 'second-person'
  }
}
```

**Пример вывода:**
```
"Шаг 1: Откройте Timeline Studio и создайте новый проект.
Шаг 2: Импортируйте ваши видео файлы..."
```

## 🌍 Мультиязычная поддержка

```typescript
const supportedLanguages = [
  'en', // English
  'ru', // Русский
  'es', // Español
  'fr', // Français
  'de', // Deutsch
  'pt', // Português
  'zh', // 中文
  'ja', // 日本語
  'ko', // 한국어
  'tr'  // Türkçe
]

// Генерация на разных языках
const ruScript = await engine.generateScript(analysis, {
  language: 'ru',
  style: 'documentary'
})

const enScript = await engine.generateScript(analysis, {
  language: 'en',
  style: 'documentary'
})
```

## 📊 Типы данных

### GeneratedScript

```typescript
interface GeneratedScript {
  id: string
  title: string
  style: ScriptStyle
  language: string
  scenes: ScriptScene[]
  voiceover: VoiceoverScript
  dialogues: Dialogue[]
  metadata: ScriptMetadata
  timestamps: TimestampedText[]
}
```

### ScriptScene

```typescript
interface ScriptScene {
  sceneId: string
  startTime: number
  endTime: number
  narration: string
  dialogue?: string[]
  notes: string[]
  cameraDirections?: string[]
  mood: EmotionalTone
}
```

### ScriptGenerationParams

```typescript
interface ScriptGenerationParams {
  style: 'narrative' | 'documentary' | 'tutorial' | 'promotional'
  tone: 'casual' | 'professional' | 'dramatic' | 'humorous'
  targetAudience: 'children' | 'teens' | 'general' | 'professional'
  duration: number
  language: string
  includeDialogue?: boolean
  includeCameraDirections?: boolean
  seoOptimized?: boolean
}
```

## 🔧 Конфигурация

### Настройки AI модели

```typescript
const config = {
  model: 'gpt-4', // или 'gpt-3.5-turbo'
  temperature: 0.7, // Креативность (0-1)
  maxTokens: 2000,
  topP: 0.9,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5
}

engine.configure(config)
```

### Кастомные шаблоны

```typescript
// Добавить свой шаблон
engine.addTemplate('vlog', {
  structure: 'free-form',
  tone: 'personal',
  elements: ['intro', 'main-content', 'call-to-action']
})
```

## 💡 Продвинутые возможности

### Контекстная генерация

```typescript
// Учитывать предыдущие видео
const script = await engine.generateScript(analysis, {
  context: {
    previousVideos: [...],
    channelStyle: 'educational',
    brandVoice: 'friendly-expert'
  }
})
```

### Интерактивные элементы

```typescript
// Генерация с учетом интерактивности
const interactiveScript = await engine.generateInteractiveScript(
  analysis,
  {
    includeQuizzes: true,
    includePolls: true,
    callToActions: ['subscribe', 'like', 'comment']
  }
)
```

### A/B тестирование

```typescript
// Генерация вариантов для тестирования
const variants = await engine.generateVariants(analysis, {
  count: 3,
  varyBy: ['tone', 'structure'],
  baseParams: { style: 'tutorial' }
})
```

## ⚡ Производительность

- **Короткий скрипт** (< 2 мин): ~3-5 сек
- **Средний скрипт** (2-10 мин): ~5-10 сек
- **Длинный скрипт** (> 10 мин): ~10-20 сек

## 🔍 Отладка

```typescript
// Включить подробные логи
engine.debug = true

// Получить промежуточные результаты
engine.on('progress', (stage) => {
  console.log(`Генерация: ${stage}`)
})

// Анализ качества скрипта
const quality = engine.analyzeScriptQuality(script)
```

## 📝 Примеры использования

### YouTube Tutorial

```typescript
const tutorialScript = await engine.generateScript(
  videoAnalysis,
  {
    style: 'tutorial',
    tone: 'professional',
    targetAudience: 'general',
    seoOptimized: true,
    includeChapters: true
  }
)

// Использовать для субтитров
const subtitles = engine.generateSubtitles(tutorialScript)
```

### TikTok Hook

```typescript
const tiktokScript = await engine.generateShortFormScript(
  analysis,
  {
    duration: 30,
    style: 'hook-based',
    includeCallToAction: true
  }
)
```