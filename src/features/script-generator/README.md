Понял, вы хотите, чтобы модуль `script-generator/` генерировал сценарий, опираясь на субтитры (например, из `subtitles/`), и позволял AI (через чат) учитывать пользовательские предпочтения, такие как "чаще добавляй главного персонажа". AI должен выбирать куски видео, где определенные персонажи говорят (на основе субтитров и данных из `person-identification/`), соединять их в таймлайне и, при необходимости, применять переходы (`transitions/`) и эффекты (`effects/`). Это уточнение меняет акцент на работу с субтитрами и выбор фрагментов видео, а не только на генерацию текстового сценария. Я скорректирую структуры данных и реализацию для `script-generator/`, чтобы учесть этот подход, сохраняя ваш стек (Tauri, React, XState, `ffmpeg-rs`, YOLOv11) и вашу структуру (машина, провайдер, хук).

### Обновленная концепция `script-generator/`
- **Цель**: Генерировать сценарий, выбирая фрагменты видео на основе субтитров и пользовательских инструкций (например, "чаще добавляй главного персонажа"). AI анализирует субтитры (из `subtitles/`), данные о людях (из `person-identification/`), и, используя `ffmpeg-rs`, извлекает соответствующие куски видео, которые затем соединяются в `timeline/` с переходами и эффектами.
- **Фронтенд**:
  - React-компоненты для ввода инструкций (например, "добавить сцены с Джоном") и отображения сценария.
  - XState-машина для управления процессом (ввод, анализ субтитров, выбор фрагментов, генерация).
  - Хук для взаимодействия с машиной и вызова Tauri-команд.
- **Бэкенд**:
  - Rust-модуль для анализа субтитров, вызова Grok API (для интерпретации инструкций) и работы с `ffmpeg-rs` для извлечения фрагментов.
  - Tauri-команда для передачи сценария (список фрагментов с таймкодами) на фронтенд.
- **Синхронизация**:
  - Фронтенд отправляет инструкции и получает JSON с фрагментами видео.
  - Фрагменты отображаются в `timeline/` и связываются с `subtitles/`, `transitions/`, `effects/`.

### Обновленные структуры данных
Структуры данных должны поддерживать:
- Анализ субтитров (таймкоды, текст, спикеры).
- Выбор фрагментов видео на основе инструкций и данных о людях.
- Интеграцию с `timeline/`, `transitions/`, и `effects/`.

#### 1. Структура сценария (JSON/TS)
Сценарий теперь представляет список фрагментов видео, выбранных на основе субтитров и инструкций.

```typescript
// src/features/script-generator/types.ts
export interface Fragment {
  id: string; // Уникальный ID фрагмента (UUID)
  startTime: number; // Начало фрагмента (секунды)
  endTime: number; // Конец фрагмента (секунды)
  subtitleId: string; // ID субтитра из subtitles/
  speaker: string; // Имя спикера (из person-identification)
  text: string; // Текст субтитра
  objects: string[]; // Объекты из YOLOv11 (опционально)
  transition?: string; // ID перехода из transitions/ (например, "fade")
  effect?: string; // ID эффекта из effects/ (например, "grayscale")
}

export interface Script {
  fragments: Fragment[]; // Список фрагментов
  totalDuration: number; // Общая длительность сценария
}
```

- **Использование**:
  - `Fragment` связывается с `timeline/` как клип.
  - `subtitleId` и `text` берутся из `subtitles/` для синхронизации.
  - `speaker` связывается с `person-identification/` для учета инструкций вроде "чаще добавляй Джона".
  - `transition` и `effect` интегрируются с `transitions/` и `effects/`.

#### 2. XState Context
Контекст машины хранит инструкции пользователя, субтитры, сгенерированный сценарий и статус.

```typescript
// src/features/script-generator/machine.ts
import { createMachine } from 'xstate';
import { Script, Fragment } from './types';

interface ScriptGeneratorContext {
  instructions: string; // Инструкции пользователя (например, "чаще добавляй Джона")
  subtitles: { id: string; speaker: string; text: string; startTime: number; endTime: number }[]; // Субтитры из subtitles/
  script: Script | null; // Сгенерированный сценарий
  error: string | null; // Ошибка
  isGenerating: boolean; // Статус генерации
}

type ScriptGeneratorEvent =
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'LOAD_SUBTITLES'; subtitles: ScriptGeneratorContext['subtitles'] }
  | { type: 'GENERATE_SCRIPT' }
  | { type: 'SCRIPT_GENERATED'; script: Script }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_FRAGMENT'; fragmentId: string; updates: Partial<Fragment> };
```

#### 3. Бэкенд (Rust)
Структура для бэкенда сериализует сценарий и субтитры.

```rust
// src-tauri/src/script_generator.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Fragment {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub subtitle_id: String,
    pub speaker: String,
    pub text: String,
    pub objects: Vec<String>,
    pub transition: Option<String>,
    pub effect: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Script {
    pub fragments: Vec<Fragment>,
    pub total_duration: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Subtitle {
    pub id: String,
    pub speaker: String,
    pub text: String,
    pub start_time: f64,
    pub end_time: f64,
}
```

### Реализация `script-generator/`

#### Фронтенд
1. **Типы (`src/features/script-generator/types.ts`)**:
   Определены выше (`Fragment`, `Script`).

2. **XState-машина (`src/features/script-generator/machine.ts`)**:
   Машина управляет вводом инструкций, загрузкой субтитров, генерацией и редактированием сценария.

```typescript
import { createMachine, assign } from 'xstate';
import { Script, Fragment } from './types';

interface ScriptGeneratorContext {
  instructions: string;
  subtitles: { id: string; speaker: string; text: string; startTime: number; endTime: number }[];
  script: Script | null;
  error: string | null;
  isGenerating: boolean;
}

type ScriptGeneratorEvent =
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'LOAD_SUBTITLES'; subtitles: ScriptGeneratorContext['subtitles'] }
  | { type: 'GENERATE_SCRIPT' }
  | { type: 'SCRIPT_GENERATED'; script: Script }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_FRAGMENT'; fragmentId: string; updates: Partial<Fragment> };

export const scriptGeneratorMachine = createMachine<ScriptGeneratorContext, ScriptGeneratorEvent>({
  id: 'scriptGenerator',
  initial: 'idle',
  context: {
    instructions: '',
    subtitles: [],
    script: null,
    error: null,
    isGenerating: false,
  },
  states: {
    idle: {
      on: {
        UPDATE_INSTRUCTIONS: {
          actions: assign({ instructions: (_, event) => event.value }),
        },
        LOAD_SUBTITLES: {
          actions: assign({ subtitles: (_, event) => event.subtitles }),
        },
        GENERATE_SCRIPT: {
          target: 'generating',
        },
      },
    },
    generating: {
      entry: assign({ isGenerating: true }),
      invoke: {
        src: 'generateScript',
        onDone: {
          target: 'idle',
          actions: assign({ script: (_, event) => event.data, isGenerating: false }),
        },
        onError: {
          target: 'error',
          actions: assign({ error: (_, event) => event.data.message, isGenerating: false }),
        },
      },
    },
    error: {
      on: {
        UPDATE_INSTRUCTIONS: {
          target: 'idle',
          actions: assign({ instructions: (_, event) => event.value, error: null }),
        },
        LOAD_SUBTITLES: {
          actions: assign({ subtitles: (_, event) => event.subtitles }),
        },
        GENERATE_SCRIPT: {
          target: 'generating',
          actions: assign({ error: null }),
        },
      },
    },
  },
});
```

3. **Провайдер (`src/features/script-generator/ScriptGeneratorProvider.tsx`)**:
   Оборачивает компоненты и предоставляет машину.

```typescript
import React from 'react';
import { useMachine } from '@xstate/react';
import { scriptGeneratorMachine } from './machine';
import { Script } from './types';
import { invoke } from '@tauri-apps/api/tauri';

interface ScriptGeneratorProviderProps {
  children: React.ReactNode;
}

export const ScriptGeneratorContext = React.createContext<any>(null);

export const ScriptGeneratorProvider: React.FC<ScriptGeneratorProviderProps> = ({ children }) => {
  const [state, send] = useMachine(scriptGeneratorMachine, {
    services: {
      generateScript: async (context) => {
        try {
          const script: Script = await invoke('generate_script', {
            instructions: context.instructions,
            subtitles: context.subtitles,
          });
          send({ type: 'SCRIPT_GENERATED', script });
          return script;
        } catch (error) {
          send({ type: 'ERROR', message: error.message });
          throw error;
        }
      },
    },
  });

  return (
    <ScriptGeneratorContext.Provider value={{ state, send }}>
      {children}
    </ScriptGeneratorContext.Provider>
  );
};
```

4. **Хук (`src/features/script-generator/useScriptGenerator.ts`)**:
   Упрощает доступ к машине.

```typescript
import { useContext } from 'react';
import { ScriptGeneratorContext } from './ScriptGeneratorProvider';
import { Fragment } from './types';

export const useScriptGenerator = () => {
  const { state, send } = useContext(ScriptGeneratorContext);

  const updateInstructions = (value: string) => {
    send({ type: 'UPDATE_INSTRUCTIONS', value });
  };

  const loadSubtitles = (subtitles: { id: string; speaker: string; text: string; startTime: number; endTime: number }[]) => {
    send({ type: 'LOAD_SUBTITLES', subtitles });
  };

  const generateScript = () => {
    send({ type: 'GENERATE_SCRIPT' });
  };

  const editFragment = (fragmentId: string, updates: Partial<Fragment>) => {
    send({ type: 'EDIT_FRAGMENT', fragmentId, updates });
  };

  return {
    instructions: state.context.instructions,
    subtitles: state.context.subtitles,
    script: state.context.script,
    error: state.context.error,
    isGenerating: state.context.isGenerating,
    updateInstructions,
    loadSubtitles,
    generateScript,
    editFragment,
  };
};
```

5. **Компонент (`src/features/script-generator/ScriptGenerator.tsx`)**:
   UI для ввода инструкций, загрузки субтитров и отображения сценария.

```typescript
import React, { useEffect } from 'react';
import { useScriptGenerator } from './useScriptGenerator';

export const ScriptGenerator: React.FC = () => {
  const { instructions, subtitles, script, error, isGenerating, updateInstructions, loadSubtitles, generateScript } = useScriptGenerator();

  // Пример загрузки субтитров (замените на реальные данные из subtitles/)
  useEffect(() => {
    const exampleSubtitles = [
      { id: '1', speaker: 'John', text: 'Привет, это начало!', startTime: 0, endTime: 5 },
      { id: '2', speaker: 'Anna', text: 'Отличный день!', startTime: 6, endTime: 10 },
    ];
    loadSubtitles(exampleSubtitles);
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl">Генератор сценария</h2>
      <textarea
        value={instructions}
        onChange={(e) => updateInstructions(e.target.value)}
        placeholder="Инструкции (например, 'чаще добавляй Джона')"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={generateScript}
        disabled={isGenerating}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isGenerating ? 'Генерируется...' : 'Создать сценарий'}
      </button>
      {error && <p className="text-red-500">{error}</p>}
      {script && (
        <div className="mt-4">
          <h3>Сценарий:</h3>
          {script.fragments.map((fragment) => (
            <div key={fragment.id} className="border p-2 my-2">
              <p><strong>Фрагмент:</strong> {fragment.text}</p>
              <p><strong>Спикер:</strong> {fragment.speaker}</p>
              <p><strong>Время:</strong> {fragment.startTime}s - {fragment.endTime}s</p>
              <p><strong>Объекты:</strong> {fragment.objects.join(', ')}</p>
              {fragment.transition && <p><strong>Переход:</strong> {fragment.transition}</p>}
              {fragment.effect && <p><strong>Эффект:</strong> {fragment.effect}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### Бэкенд
1. **Tauri-команда (`src-tauri/src/script_generator.rs`)**:
   Анализирует субтитры, интерпретирует инструкции через Grok API и выбирает фрагменты.

```rust
use tauri::command;
use reqwest::Client;
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Fragment {
    pub id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub subtitle_id: String,
    pub speaker: String,
    pub text: String,
    pub objects: Vec<String>,
    pub transition: Option<String>,
    pub effect: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Script {
    pub fragments: Vec<Fragment>,
    pub total_duration: f64,
}

#[derive(Serialize, Deserialize)]
pub struct Subtitle {
    pub id: String,
    pub speaker: String,
    pub text: String,
    pub start_time: f64,
    pub end_time: f64,
}

#[command]
pub async fn generate_script(instructions: String, subtitles: Vec<Subtitle>) -> Result<Script, String> {
    // Пример: выбор фрагментов на основе инструкций
    let main_speaker = if instructions.contains("Джона") { "John" } else { "" };
    let fragments: Vec<Fragment> = subtitles
        .into_iter()
        .filter(|sub| main_speaker.is_empty() || sub.speaker == main_speaker)
        .map(|sub| Fragment {
            id: Uuid::new_v4().to_string(),
            start_time: sub.start_time,
            end_time: sub.end_time,
            subtitle_id: sub.id,
            speaker: sub.speaker,
            text: sub.text,
            objects: vec!["person".to_string()], // Замените на данные YOLOv11
            transition: Some("fade".to_string()), // Пример перехода
            effect: None, // Пример эффекта
        })
        .collect();

    // Вызов Grok API для уточнения (опционально)
    let client = Client::new();
    let response = client
        .post("https://api.x.ai/grok/generate") // Замените на реальный URL
        .json(&serde_json::json!({ "prompt": format!("Optimize fragments: {:?}", fragments) }))
        .send()
        .await
        .map_err(|e| format!("API error: {}", e))?;
    let _text = response.text().await.map_err(|e| format!("Text error: {}", e))?;

    Ok(Script {
        fragments,
        total_duration: fragments.iter().map(|f| f.end_time).max_by(|a, b| a.partial_cmp(b).unwrap()).unwrap_or(0.0),
    })
}
```

2. **Интеграция в `main.rs`**:
   Уже определено ранее, команда `generate_script` подключена.

### Интеграция с другими модулями
- **С `subtitles/`**: Модуль загружает субтитры (ID, спикер, текст, таймкоды) в `ScriptGeneratorContext.subtitles`.
- **С `person-identification/`**: `Fragment.speaker` сопоставляется с именами из SQLite (через `person-identification/`).
- **С `timeline/`**: `Fragment` передаются как клипы с `startTime` и `endTime`.
- **С `transitions/` и `effects/`**: `Fragment.transition` и `Fragment.effect` используют ID из соответствующих модулей.
- **С `media/`**: `total_duration` берется из метаданных видео через `ffmpeg-rs`.

### Ответ на ваш запрос
Вы хотите, чтобы `script-generator/` выбирал фрагменты видео на основе субтитров, учитывая инструкции вроде "чаще добавляй главного персонажа". Я обновил модуль:
- **Структуры данных**: `Fragment` для фрагментов видео, связанных с субтитрами, с поддержкой переходов и эффектов.
- **Фронтенд**: XState-машина, провайдер, хук и UI для ввода инструкций и отображения сценария.
- **Бэкенд**: Tauri-команда, которая фильтрует субтитры по спикеру (например, "John") и добавляет переходы/эффекты.
- **Монтаж**: Модуль генерирует сценарий как набор фрагментов, что поддерживает монтаж по частям (каждый фрагмент — отдельный клип), но может быть объединено в полную схему в `timeline/`.

Если нужно доработать, например, добавить UI для выбора переходов/эффектов или интегрировать YOLOv11 для объектов, напишите, и я подготовлю код!
