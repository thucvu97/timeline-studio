# Script Generator - AI генератор сценариев

## 📋 Обзор

Script Generator - это интеллектуальный модуль для автоматической генерации видео-сценариев на основе темы, ключевых слов или исходных материалов. Использует продвинутые языковые модели для создания структурированных сценариев с учетом целевой аудитории и платформы публикации.

## 🎯 Цели и задачи

### Основные цели:
1. **Автоматизация** - быстрое создание сценариев
2. **Персонализация** - учет аудитории и платформы
3. **Структурированность** - готовые к производству сценарии
4. **Многоязычность** - генерация на разных языках

### Ключевые возможности:
- Генерация по теме или ключевым словам
- Адаптация под платформу (YouTube, TikTok, Instagram)
- Создание сценариев разных жанров
- Интеграция с Timeline для автоматической разметки
- Генерация диалогов и закадрового текста

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/script-generator/
├── components/
│   ├── generator-wizard/      # Мастер генерации
│   │   ├── topic-input.tsx    # Ввод темы
│   │   ├── style-selector.tsx # Выбор стиля
│   │   └── params-config.tsx  # Параметры
│   ├── script-editor/         # Редактор сценария
│   │   ├── scene-editor.tsx   # Редактор сцен
│   │   ├── dialogue-editor.tsx # Диалоги
│   │   └── notes-panel.tsx    # Заметки
│   ├── templates/             # Шаблоны
│   │   ├── template-browser.tsx # Браузер шаблонов
│   │   └── custom-template.tsx # Создание шаблонов
│   └── preview/               # Превью
│       ├── script-preview.tsx  # Предпросмотр
│       └── timeline-sync.tsx   # Синхронизация
├── hooks/
│   ├── use-script-generator.ts # Основной хук
│   ├── use-ai-models.ts       # Работа с AI
│   └── use-templates.ts       # Шаблоны
├── services/
│   ├── ai-generator.ts        # AI генератор
│   ├── script-formatter.ts    # Форматирование
│   ├── template-engine.ts     # Движок шаблонов
│   └── platform-adapter.ts    # Адаптация под платформы
└── types/
    └── script.ts              # Типы данных
```

### Backend структура (Rust):
```
src-tauri/src/script_generator/
├── mod.rs                     # Главный модуль
├── ai_models/                 # AI модели
│   ├── openai_client.rs       # OpenAI API
│   ├── claude_client.rs       # Claude API
│   └── local_llm.rs          # Локальные модели
├── templates/                 # Шаблоны
│   ├── template_parser.rs     # Парсер шаблонов
│   └── template_library.rs    # Библиотека
├── formatters/                # Форматирование
│   ├── screenplay_format.rs   # Формат сценария
│   └── subtitle_format.rs     # Формат субтитров
└── commands.rs                # Tauri команды
```

## 📐 Функциональные требования

### 1. Параметры генерации

#### Основные настройки:
```typescript
interface GenerationParams {
    // Тема и содержание
    topic: string;
    keywords: string[];
    description?: string;
    
    // Формат
    format: ScriptFormat;
    duration: Duration;
    platform: Platform;
    
    // Стиль
    style: ScriptStyle;
    tone: ToneOfVoice;
    targetAudience: Audience;
    
    // Язык
    language: Language;
    dialect?: Dialect;
}

enum ScriptFormat {
    ShortForm = 'short',      // TikTok, Reels (15-60s)
    MediumForm = 'medium',    // YouTube (3-10min)
    LongForm = 'long',        // Документальный (10-60min)
    Series = 'series'         // Сериал/эпизоды
}

enum ScriptStyle {
    Educational = 'educational',
    Entertainment = 'entertainment',
    Documentary = 'documentary',
    Tutorial = 'tutorial',
    Review = 'review',
    Vlog = 'vlog',
    Commercial = 'commercial'
}
```

### 2. Структура сценария

#### Компоненты сценария:
```typescript
interface Script {
    id: string;
    metadata: ScriptMetadata;
    
    // Структура
    acts: Act[];
    totalDuration: Duration;
    
    // Контент
    voiceOver?: VoiceOverScript;
    dialogues?: Dialogue[];
    
    // Визуальные указания
    shotList: Shot[];
    transitions: Transition[];
    
    // Метки для Timeline
    markers: ScriptMarker[];
}

interface Act {
    id: string;
    title: string;
    scenes: Scene[];
    duration: Duration;
}

interface Scene {
    id: string;
    number: number;
    
    // Описание
    heading: string;          // INT. KITCHEN - DAY
    action: string;          // Описание действия
    
    // Контент
    dialogue?: Dialogue[];
    voiceOver?: string;
    
    // Визуальные элементы
    shots: Shot[];
    props?: string[];
    
    // Тайминг
    estimatedDuration: Duration;
}
```

### 3. Генерация диалогов

#### Структура диалога:
```typescript
interface Dialogue {
    character: Character;
    text: string;
    
    // Ремарки
    parenthetical?: string;  // (whispers)
    action?: string;         // Character moves to window
    
    // Эмоции
    emotion?: Emotion;
    intensity: number;
    
    // Тайминг
    startTime?: Timecode;
    duration?: Duration;
}

interface Character {
    id: string;
    name: string;
    
    // Характеристики
    role: CharacterRole;
    personality?: string;
    speechStyle?: string;
    
    // Голос (для TTS)
    voiceId?: string;
    voiceParams?: VoiceParameters;
}
```

### 4. Визуальные указания

#### Shot List:
```typescript
interface Shot {
    id: string;
    type: ShotType;
    
    // Описание
    description: string;
    cameraAngle: CameraAngle;
    movement?: CameraMovement;
    
    // Композиция
    framing: Framing;
    subject: string;
    background?: string;
    
    // Длительность
    duration: Duration;
    
    // Связь со сценой
    sceneId: string;
    order: number;
}

enum ShotType {
    EstablishingShot = 'establishing',
    WideShot = 'wide',
    MediumShot = 'medium',
    CloseUp = 'closeup',
    ExtremeCloseUp = 'extreme-closeup',
    OverTheShoulder = 'ots',
    PointOfView = 'pov',
    TwoShot = 'two-shot'
}
```

### 5. Платформенная адаптация

#### YouTube оптимизация:
- Hook в первые 15 секунд
- Chapter markers
- End screen planning
- SEO-friendly описания

#### TikTok оптимизация:
- Вертикальный формат
- Быстрый темп
- Trending sounds integration
- Hashtag suggestions

#### Instagram Reels:
- 30/60/90 секундные форматы
- Visual storytelling focus
- Caption optimization
- Music sync points

### 6. AI промпты и настройка

#### Prompt Engineering:
```typescript
interface AIPromptConfig {
    // Базовый промпт
    systemPrompt: string;
    
    // Параметры генерации
    temperature: number;      // Креативность (0-1)
    maxTokens: number;       // Длина ответа
    
    // Примеры
    fewShotExamples?: Example[];
    
    // Ограничения
    constraints: {
        avoidTopics?: string[];
        requiredElements?: string[];
        styleGuide?: string;
    };
}
```

#### Chain of Thought:
```typescript
class ScriptGenerationChain {
    async generate(params: GenerationParams): Promise<Script> {
        // 1. Генерация outline
        const outline = await this.generateOutline(params);
        
        // 2. Расширение сцен
        const scenes = await this.expandScenes(outline, params);
        
        // 3. Генерация диалогов
        const dialogues = await this.generateDialogues(scenes, params);
        
        // 4. Визуальные указания
        const shots = await this.generateShotList(scenes, params);
        
        // 5. Финальная сборка
        return this.assembleScript({
            outline,
            scenes,
            dialogues,
            shots
        });
    }
}
```

### 7. Шаблоны сценариев

#### Библиотека шаблонов:
```typescript
interface ScriptTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    
    // Структура
    structure: {
        acts: ActTemplate[];
        pacing: PacingGuide;
    };
    
    // Стиль
    styleGuide: {
        tone: string;
        vocabulary: string;
        sentenceStructure: string;
    };
    
    // Примеры
    examples: ScriptExample[];
}
```

#### Популярные шаблоны:
- **Three-Act Structure** - классическая структура
- **Hero's Journey** - путь героя
- **Problem-Solution** - для туториалов
- **Before-After** - для трансформаций
- **Listicle** - топ-10 формат
- **Case Study** - разбор кейса

### 8. Интеграция с Timeline

#### Автоматическая разметка:
```typescript
interface TimelineIntegration {
    // Создание маркеров
    createMarkers(script: Script): TimelineMarker[];
    
    // Создание текстовых слоев
    createTextLayers(script: Script): TextLayer[];
    
    // Синхронизация с клипами
    syncWithClips(script: Script, clips: Clip[]): SyncResult;
    
    // Генерация субтитров
    generateSubtitles(script: Script): Subtitle[];
}
```

## 🎨 UI/UX дизайн

### Мастер генерации:
```
┌─────────────────────────────────────────────────┐
│ Script Generator              Step 1 of 3   [X] │
├─────────────────────────────────────────────────┤
│                                                 │
│ What's your video about?                       │
│ ┌─────────────────────────────────────────────┐ │
│ │ Travel vlog about Japan                     │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Keywords (optional):                           │
│ [Tokyo] [Culture] [Food] [+]                   │
│                                                 │
│ Platform:                                      │
│ ○ YouTube  ● TikTok  ○ Instagram              │
│                                                 │
│ Duration: [60 seconds ▼]                       │
│                                                 │
├─────────────────────────────────────────────────┤
│               [Back] [Next: Choose Style →]     │
└─────────────────────────────────────────────────┘
```

### Редактор сценария:
```
┌─────────────────────────────────────────────────┐
│ Japan Travel Vlog           [Preview] [Export] │
├─────────────────────────────────────────────────┤
│ Scenes │ Script │ Shots │ Timeline             │
├────────┴────────┴───────┴──────────────────────┤
│ SCENE 1: ARRIVAL IN TOKYO                      │
│ ─────────────────────────                      │
│ FADE IN:                                       │
│                                                │
│ EXT. NARITA AIRPORT - DAY                     │
│                                                │
│ [Wide shot of busy airport terminal]           │
│                                                │
│ NARRATOR (V.O.)                               │
│   Welcome to the land of the rising sun!      │
│   Today, we're exploring the incredible       │
│   contrasts of modern Tokyo.                   │
│                                                │
│ [Cut to: Medium shot of narrator with luggage] │
│                                                │
│ + Add scene element                            │
└─────────────────────────────────────────────────┘
```

## 🔧 Технические детали

### AI Integration Layer:

```typescript
class AIScriptGenerator {
    private models: Map<AIProvider, AIClient>;
    
    async generateScript(params: GenerationParams): Promise<Script> {
        const provider = this.selectProvider(params);
        const client = this.models.get(provider);
        
        // Подготовка промпта
        const prompt = this.buildPrompt(params);
        
        // Генерация с retry logic
        let attempts = 0;
        while (attempts < 3) {
            try {
                const response = await client.generate({
                    prompt,
                    temperature: params.creativity || 0.7,
                    maxTokens: this.calculateTokens(params.duration)
                });
                
                return this.parseResponse(response);
            } catch (error) {
                attempts++;
                await this.handleError(error, attempts);
            }
        }
    }
    
    private buildPrompt(params: GenerationParams): string {
        return `
            Create a ${params.format} script for ${params.platform}.
            Topic: ${params.topic}
            Duration: ${params.duration}
            Style: ${params.style}
            Target Audience: ${params.targetAudience}
            
            Structure the script with clear scenes, dialogue, and visual directions.
            Include timing markers and shot descriptions.
        `;
    }
}
```

### Template Engine:

```rust
pub struct TemplateEngine {
    templates: HashMap<String, Template>,
    variables: HashMap<String, Value>,
}

impl TemplateEngine {
    pub fn render(&self, template_id: &str, context: Context) -> Result<Script> {
        let template = self.templates.get(template_id)
            .ok_or(Error::TemplateNotFound)?;
        
        // Заполнение переменных
        let mut script = template.structure.clone();
        
        for section in &mut script.sections {
            section.content = self.interpolate(&section.content, &context);
            
            // Применение стилевых правил
            if let Some(style) = &template.style_rules {
                section.content = self.apply_style(section.content, style);
            }
        }
        
        Ok(script)
    }
}
```

## 📊 План реализации

### Фаза 1: Базовая генерация (2 недели)
- [ ] Интеграция с AI API
- [ ] Простые промпты
- [ ] Базовые шаблоны
- [ ] UI мастера

### Фаза 2: Расширенные функции (3 недели)
- [ ] Сложные структуры сценариев
- [ ] Генерация диалогов
- [ ] Shot list generation
- [ ] Платформенная адаптация

### Фаза 3: Интеграция (2 недели)
- [ ] Timeline синхронизация
- [ ] Автоматические маркеры
- [ ] Генерация субтитров
- [ ] Экспорт форматов

### Фаза 4: Оптимизация (1 неделя)
- [ ] Кэширование результатов
- [ ] Batch generation
- [ ] Локальные модели
- [ ] Fine-tuning

## 🎯 Метрики успеха

### Качество:
- 90%+ юзабельных сценариев
- <5% требуют major правок
- Соответствие платформе 95%+

### Скорость:
- <30s генерация короткого сценария
- <2min для 10-минутного видео
- Real-time preview

### Удобство:
- 3 клика до готового сценария
- Понятные настройки
- Легкое редактирование

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - автоматическая разметка
- **AI Multi-Platform** - основа для генерации
- **Subtitles** - создание субтитров
- **Templates** - использование в шаблонах

### API для разработчиков:
```typescript
interface ScriptGeneratorAPI {
    // Генерация
    generate(params: GenerationParams): Promise<Script>;
    regenerateSection(scriptId: string, sectionId: string): Promise<Section>;
    
    // Шаблоны
    getTemplates(): Template[];
    saveAsTemplate(script: Script, name: string): Template;
    
    // Интеграция
    applyToTimeline(script: Script): void;
    exportScript(format: ExportFormat): string;
    
    // Настройка
    setAIProvider(provider: AIProvider): void;
    configurePrompts(config: PromptConfig): void;
}
```

## 📚 Справочные материалы

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Screenplay Format Guide](https://www.writersstore.com/how-to-write-a-screenplay-a-guide-to-scriptwriting/)
- [Platform Best Practices](https://creators.youtube.com/en/how-to/edit-videos/create/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

*Документ будет обновляться по мере разработки модуля*