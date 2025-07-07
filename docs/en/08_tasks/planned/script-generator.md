# Script Generator - AI Script Generation

## 📋 Overview

Script Generator is an intelligent module for automatic video script generation based on topics, keywords, or source materials. It uses advanced language models to create structured scripts considering the target audience and publishing platform.

## 🎯 Goals and Objectives

### Primary Goals:
1. **Automation** - quick script creation
2. **Personalization** - audience and platform consideration
3. **Structure** - production-ready scripts
4. **Multilingual** - generation in different languages

### Key Features:
- Generation by topic or keywords
- Platform adaptation (YouTube, TikTok, Vimeo)
- Different genre script creation
- Timeline integration for automatic markup
- Dialogue and voiceover generation

## 🏗️ Technical Architecture

### Frontend Structure:
```
src/features/script-generator/
├── components/
│   ├── generator-wizard/      # Generation wizard
│   │   ├── topic-input.tsx    # Topic input
│   │   ├── style-selector.tsx # Style selection
│   │   └── params-config.tsx  # Parameters
│   ├── script-editor/         # Script editor
│   │   ├── scene-editor.tsx   # Scene editor
│   │   ├── dialogue-editor.tsx # Dialogues
│   │   └── notes-panel.tsx    # Notes
│   ├── templates/             # Templates
│   │   ├── template-browser.tsx # Template browser
│   │   └── custom-template.tsx # Template creation
│   └── preview/               # Preview
│       ├── script-preview.tsx  # Preview
│       └── timeline-sync.tsx   # Synchronization
├── hooks/
│   ├── use-script-generator.ts # Main hook
│   ├── use-ai-models.ts       # AI integration
│   └── use-templates.ts       # Templates
├── services/
│   ├── ai-generator.ts        # AI generator
│   ├── script-formatter.ts    # Formatting
│   ├── template-engine.ts     # Template engine
│   └── platform-adapter.ts    # Platform adaptation
└── types/
    └── script.ts              # Data types
```

### Backend Structure (Rust):
```
src-tauri/src/script_generator/
├── mod.rs                     # Main module
├── ai_models/                 # AI models
│   ├── openai_client.rs       # OpenAI API
│   ├── claude_client.rs       # Claude API
│   └── local_llm.rs          # Local models
├── templates/                 # Templates
│   ├── template_parser.rs     # Template parser
│   └── template_library.rs    # Library
├── formatters/                # Formatting
│   ├── screenplay_format.rs   # Script format
│   └── subtitle_format.rs     # Subtitle format
└── commands.rs                # Tauri commands
```

## 📐 Functional Requirements

### 1. Generation Parameters

#### Main Settings:
```typescript
interface GenerationParams {
    // Topic and content
    topic: string;
    keywords: string[];
    description?: string;
    
    // Format
    format: ScriptFormat;
    duration: Duration;
    platform: Platform;
    
    // Style
    style: ScriptStyle;
    tone: ToneOfVoice;
    targetAudience: Audience;
    
    // Language
    language: Language;
    dialect?: Dialect;
}

enum ScriptFormat {
    ShortForm = 'short',      // TikTok, Reels (15-60s)
    MediumForm = 'medium',    // YouTube (3-10min)
    LongForm = 'long',        // Documentary (10-60min)
    Series = 'series'         // Series/episodes
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

### 2. Script Structure

#### Script Components:
```typescript
interface Script {
    id: string;
    metadata: ScriptMetadata;
    
    // Structure
    acts: Act[];
    totalDuration: Duration;
    
    // Content
    voiceOver?: VoiceOverScript;
    dialogues?: Dialogue[];
    
    // Visual directions
    shotList: Shot[];
    transitions: Transition[];
    
    // Timeline markers
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
    
    // Description
    heading: string;          // INT. KITCHEN - DAY
    action: string;          // Action description
    
    // Content
    dialogue?: Dialogue[];
    voiceOver?: string;
    
    // Visual elements
    shots: Shot[];
    props?: string[];
    
    // Timing
    estimatedDuration: Duration;
}
```

### 3. Dialogue Generation

#### Dialogue Structure:
```typescript
interface Dialogue {
    character: Character;
    text: string;
    
    // Stage directions
    parenthetical?: string;  // (whispers)
    action?: string;         // Character moves to window
    
    // Emotions
    emotion?: Emotion;
    intensity: number;
    
    // Timing
    startTime?: Timecode;
    duration?: Duration;
}

interface Character {
    id: string;
    name: string;
    
    // Characteristics
    role: CharacterRole;
    personality?: string;
    speechStyle?: string;
    
    // Voice (for TTS)
    voiceId?: string;
    voiceParams?: VoiceParameters;
}
```

### 4. Visual Directions

#### Shot List:
```typescript
interface Shot {
    id: string;
    type: ShotType;
    
    // Description
    description: string;
    cameraAngle: CameraAngle;
    movement?: CameraMovement;
    
    // Composition
    framing: Framing;
    subject: string;
    background?: string;
    
    // Duration
    duration: Duration;
    
    // Scene relation
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

### 5. Platform Adaptation

#### YouTube Optimization:
- Hook in first 15 seconds
- Chapter markers
- End screen planning
- SEO-friendly descriptions

#### TikTok Optimization:
- Vertical format
- Fast pace
- Trending sounds integration
- Hashtag suggestions

#### Instagram Reels:
- 30/60/90 second formats
- Visual storytelling focus
- Caption optimization
- Music sync points

### 6. AI Prompts and Configuration

#### Prompt Engineering:
```typescript
interface AIPromptConfig {
    // Base prompt
    systemPrompt: string;
    
    // Generation parameters
    temperature: number;      // Creativity (0-1)
    maxTokens: number;       // Response length
    
    // Examples
    fewShotExamples?: Example[];
    
    // Constraints
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
        // 1. Generate outline
        const outline = await this.generateOutline(params);
        
        // 2. Expand scenes
        const scenes = await this.expandScenes(outline, params);
        
        // 3. Generate dialogues
        const dialogues = await this.generateDialogues(scenes, params);
        
        // 4. Visual directions
        const shots = await this.generateShotList(scenes, params);
        
        // 5. Final assembly
        return this.assembleScript({
            outline,
            scenes,
            dialogues,
            shots
        });
    }
}
```

### 7. Script Templates

#### Template Library:
```typescript
interface ScriptTemplate {
    id: string;
    name: string;
    category: TemplateCategory;
    
    // Structure
    structure: {
        acts: ActTemplate[];
        pacing: PacingGuide;
    };
    
    // Style
    styleGuide: {
        tone: string;
        vocabulary: string;
        sentenceStructure: string;
    };
    
    // Examples
    examples: ScriptExample[];
}
```

#### Popular Templates:
- **Three-Act Structure** - classic structure
- **Hero's Journey** - hero's path
- **Problem-Solution** - for tutorials
- **Before-After** - for transformations
- **Listicle** - top-10 format
- **Case Study** - case analysis

### 8. Timeline Integration

#### Automatic Markup:
```typescript
interface TimelineIntegration {
    // Create markers
    createMarkers(script: Script): TimelineMarker[];
    
    // Create text layers
    createTextLayers(script: Script): TextLayer[];
    
    // Sync with clips
    syncWithClips(script: Script, clips: Clip[]): SyncResult;
    
    // Generate subtitles
    generateSubtitles(script: Script): Subtitle[];
}
```

## 🎨 UI/UX Design

### Generation Wizard:
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

### Script Editor:
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

## 🔧 Technical Details

### AI Integration Layer:

```typescript
class AIScriptGenerator {
    private models: Map<AIProvider, AIClient>;
    
    async generateScript(params: GenerationParams): Promise<Script> {
        const provider = this.selectProvider(params);
        const client = this.models.get(provider);
        
        // Prepare prompt
        const prompt = this.buildPrompt(params);
        
        // Generate with retry logic
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
        
        // Fill variables
        let mut script = template.structure.clone();
        
        for section in &mut script.sections {
            section.content = self.interpolate(&section.content, &context);
            
            // Apply style rules
            if let Some(style) = &template.style_rules {
                section.content = self.apply_style(section.content, style);
            }
        }
        
        Ok(script)
    }
}
```

## 📊 Implementation Plan

### Phase 1: Basic Generation (2 weeks)
- [ ] AI API integration
- [ ] Simple prompts
- [ ] Basic templates
- [ ] Wizard UI

### Phase 2: Advanced Features (3 weeks)
- [ ] Complex script structures
- [ ] Dialogue generation
- [ ] Shot list generation
- [ ] Platform adaptation

### Phase 3: Integration (2 weeks)
- [ ] Timeline synchronization
- [ ] Automatic markers
- [ ] Subtitle generation
- [ ] Export formats

### Phase 4: Optimization (1 week)
- [ ] Result caching
- [ ] Batch generation
- [ ] Local models
- [ ] Fine-tuning

## 🎯 Success Metrics

### Quality:
- 90%+ usable scripts
- <5% require major edits
- 95%+ platform compliance

### Speed:
- <30s short script generation
- <2min for 10-minute video
- Real-time preview

### Usability:
- 3 clicks to ready script
- Clear settings
- Easy editing

## 🔗 Integration

### With Other Modules:
- **Timeline** - automatic markup
- **AI Multi-Platform** - generation foundation
- **Subtitles** - subtitle creation
- **Templates** - template usage

### Developer API:
```typescript
interface ScriptGeneratorAPI {
    // Generation
    generate(params: GenerationParams): Promise<Script>;
    regenerateSection(scriptId: string, sectionId: string): Promise<Section>;
    
    // Templates
    getTemplates(): Template[];
    saveAsTemplate(script: Script, name: string): Template;
    
    // Integration
    applyToTimeline(script: Script): void;
    exportScript(format: ExportFormat): string;
    
    // Configuration
    setAIProvider(provider: AIProvider): void;
    configurePrompts(config: PromptConfig): void;
}
```

## 📚 References

- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Screenplay Format Guide](https://www.writersstore.com/how-to-write-a-screenplay-a-guide-to-scriptwriting/)
- [Platform Best Practices](https://creators.youtube.com/en/how-to/edit-videos/create/)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

*Document will be updated as the module develops*