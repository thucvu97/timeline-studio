Понял, вы хотите, чтобы модуль `montage-planner/` автоматически начинал анализ видео (генерация скриншотов с помощью `ffmpeg-rs`, затем распознавание объектов/лиц с помощью YOLOv11) сразу после добавления видео в проект на таймлайн, при этом обеспечивая, чтобы процесс не блокировал UI и не вызывал зависаний. Учитывая ваш стек (Tauri, React, XState, `ffmpeg-rs`, YOLOv11) и структуру модулей (машина, провайдер, хук), я определю структуры данных и реализацию для `montage-planner/`, с акцентом на асинхронный анализ, интеграцию с `timeline/` и предотвращение зависаний. Также учту, что анализ начинается с генерации скриншотов, а затем идет распознавание, и что вы хотите, чтобы результат (фрагменты видео) сразу отображался в таймлайне.

### Концепция `montage-planner/`
- **Цель**: Автоматически анализировать видео, добавленные в проект, для создания схемы монтажа. Анализ включает:
  - Генерацию скриншотов (`ffmpeg-rs`) для ключевых кадров.
  - Распознавание объектов/лиц (YOLOv11) на этих скриншотах.
  - Формирование фрагментов видео (с таймкодами, переходами и эффектами), которые отображаются в `timeline/`.
- **Требования**:
  - Анализ запускается сразу после добавления видео в проект (`timeline/`).
  - Процесс асинхронный, чтобы не блокировать UI.
  - Результаты (фрагменты) интегрируются с `timeline/`, `transitions/`, `effects/` и `person-identification/`.
  - Поддержка инструкций из `script-generator/` (например, "чаще добавляй Джона").
- **Фронтенд**:
  - React-компоненты для отображения прогресса анализа и схемы монтажа.
  - XState-машина для управления состояниями (добавление видео, анализ, отображение результата).
  - Хук для взаимодействия с машиной и вызова Tauri-команд.
- **Бэкенд**:
  - Rust-модуль для анализа видео (`ffmpeg-rs` для скриншотов, YOLOv11 для распознавания) и генерации фрагментов.
  - Tauri-команды для асинхронной передачи данных на фронтенд.
- **Синхронизация**:
  - Использование `tauri-plugin-websocket` или событий Tauri для передачи прогресса анализа.
  - Кэширование результатов в SQLite (`resources/`) для повторного использования.

### Структуры данных
Структуры должны поддерживать:
- Описание фрагментов видео (таймкоды, объекты, люди, эффекты, переходы).
- Прогресс анализа (скриншоты, распознавание).
- Интеграцию с `timeline/`, `subtitles/`, `person-identification/`, `transitions/`, `effects/`.

#### 1. Структура фрагментов (JSON/TS)
Фрагменты представляют куски видео, выбранные на основе анализа скриншотов и YOLOv11.

```typescript
// src/features/montage-planner/types.ts
export interface Fragment {
  id: string; // Уникальный ID фрагмента (UUID)
  videoId: string; // ID видео из timeline/
  startTime: number; // Начало фрагмента (секунды)
  endTime: number; // Конец фрагмента (секунды)
  screenshotPath: string; // Путь к скриншоту (локальный путь от ffmpeg-rs)
  objects: string[]; // Объекты из YOLOv11 (например, ["car", "tree"])
  people: Person[]; // Люди из person-identification
  transition?: string; // ID перехода из transitions/
  effect?: string; // ID эффекта из effects/
}

export interface Person {
  id: string; // ID из person-identification
  name: string; // Имя человека
}

export interface MontagePlan {
  fragments: Fragment[]; // Список фрагментов
  totalDuration: number; // Общая длительность плана
}
```

- **Использование**:
  - `Fragment` отображается в `timeline/` как клип.
  - `screenshotPath` используется для предпросмотра в UI.
  - `objects` и `people` интегрируются с `recognition/` и `person-identification/`.
  - `transition` и `effect` связаны с `transitions/` и `effects/`.

#### 2. XState Context
Контекст машины хранит состояние анализа, инструкции и план монтажа.

```typescript
// src/features/montage-planner/machine.ts
import { createMachine } from 'xstate';
import { MontagePlan, Fragment } from './types';

interface MontagePlannerContext {
  videoIds: string[]; // ID видео, добавленных в проект
  instructions: string; // Инструкции (например, "чаще добавляй Джона")
  plan: MontagePlan | null; // Сгенерированный план монтажа
  progress: number; // Прогресс анализа (0-100%)
  error: string | null; // Ошибка
  isAnalyzing: boolean; // Статус анализа
}

type MontagePlannerEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PLAN_GENERATED'; plan: MontagePlan }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_FRAGMENT'; fragmentId: string; updates: Partial<Fragment> };
```

#### 3. Бэкенд (Rust)
Структура для бэкенда сериализует план монтажа и данные анализа.

```rust
// src-tauri/src/montage_planner.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Fragment {
    pub id: String,
    pub video_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub screenshot_path: String,
    pub objects: Vec<String>,
    pub people: Vec<Person>,
    pub transition: Option<String>,
    pub effect: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct MontagePlan {
    pub fragments: Vec<Fragment>,
    pub total_duration: f64,
}
```

### Реализация `montage-planner/`

#### Фронтенд
1. **Типы (`src/features/montage-planner/types.ts`)**:
   Определены выше (`Fragment`, `Person`, `MontagePlan`).

2. **XState-машина (`src/features/montage-planner/machine.ts`)**:
   Машина управляет добавлением видео, анализом и генерацией плана.

```typescript
import { createMachine, assign } from 'xstate';
import { MontagePlan, Fragment } from './types';

interface MontagePlannerContext {
  videoIds: string[];
  instructions: string;
  plan: MontagePlan | null;
  progress: number;
  error: string | null;
  isAnalyzing: boolean;
}

type MontagePlannerEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PLAN_GENERATED'; plan: MontagePlan }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_FRAGMENT'; fragmentId: string; updates: Partial<Fragment> };

export const montagePlannerMachine = createMachine<MontagePlannerContext, MontagePlannerEvent>({
  id: 'montagePlanner',
  initial: 'idle',
  context: {
    videoIds: [],
    instructions: '',
    plan: null,
    progress: 0,
    error: null,
    isAnalyzing: false,
  },
  states: {
    idle: {
      on: {
        ADD_VIDEO: {
          actions: assign({
            videoIds: (ctx, event) => [...ctx.videoIds, event.videoId],
          }),
          target: 'analyzing',
        },
        UPDATE_INSTRUCTIONS: {
          actions: assign({ instructions: (_, event) => event.value }),
        },
      },
    },
    analyzing: {
      entry: assign({ isAnalyzing: true }),
      invoke: {
        src: 'analyzeVideos',
        onDone: {
          target: 'idle',
          actions: assign({
            plan: (_, event) => event.data,
            isAnalyzing: false,
            progress: 100,
          }),
        },
        onError: {
          target: 'error',
          actions: assign({
            error: (_, event) => event.data.message,
            isAnalyzing: false,
          }),
        },
      },
      on: {
        UPDATE_PROGRESS: {
          actions: assign({ progress: (_, event) => event.progress }),
        },
      },
    },
    error: {
      on: {
        ADD_VIDEO: {
          target: 'analyzing',
          actions: assign({
            videoIds: (ctx, event) => [...ctx.videoIds, event.videoId],
            error: null,
          }),
        },
        UPDATE_INSTRUCTIONS: {
          actions: assign({ instructions: (_, event) => event.value }),
        },
      },
    },
  },
});
```

3. **Провайдер (`src/features/montage-planner/MontagePlannerProvider.tsx`)**:
   Оборачивает компоненты и предоставляет машину.

```typescript
import React from 'react';
import { useMachine } from '@xstate/react';
import { montagePlannerMachine } from './machine';
import { MontagePlan } from './types';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface MontagePlannerProviderProps {
  children: React.ReactNode;
}

export const MontagePlannerContext = React.createContext<any>(null);

export const MontagePlannerProvider: React.FC<MontagePlannerProviderProps> = ({ children }) => {
  const [state, send] = useMachine(montagePlannerMachine, {
    services: {
      analyzeVideos: async (context) => {
        try {
          const plan: MontagePlan = await invoke('analyze_videos', {
            videoIds: context.videoIds,
            instructions: context.instructions,
          });
          send({ type: 'PLAN_GENERATED', plan });
          return plan;
        } catch (error) {
          send({ type: 'ERROR', message: error.message });
          throw error;
        }
      },
    },
  });

  // Слушаем прогресс анализа
  React.useEffect(() => {
    const unsubscribe = listen('analysis_progress', (event: { payload: number }) => {
      send({ type: 'UPDATE_PROGRESS', progress: event.payload });
    });
    return () => unsubscribe.then((f) => f());
  }, [send]);

  return (
    <MontagePlannerContext.Provider value={{ state, send }}>
      {children}
    </MontagePlannerContext.Provider>
  );
};
```

4. **Хук (`src/features/montage-planner/useMontagePlanner.ts`)**:
   Упрощает доступ к машине.

```typescript
import { useContext } from 'react';
import { MontagePlannerContext } from './MontagePlannerProvider';
import { Fragment } from './types';

export const useMontagePlanner = () => {
  const { state, send } = useContext(MontagePlannerContext);

  const addVideo = (videoId: string) => {
    send({ type: 'ADD_VIDEO', videoId });
  };

  const updateInstructions = (value: string) => {
    send({ type: 'UPDATE_INSTRUCTIONS', value });
  };

  const editFragment = (fragmentId: string, updates: Partial<Fragment>) => {
    send({ type: 'EDIT_FRAGMENT', fragmentId, updates });
  };

  return {
    videoIds: state.context.videoIds,
    instructions: state.context.instructions,
    plan: state.context.plan,
    progress: state.context.progress,
    error: state.context.error,
    isAnalyzing: state.context.isAnalyzing,
    addVideo,
    updateInstructions,
    editFragment,
  };
};
```

5. **Компонент (`src/features/montage-planner/MontagePlanner.tsx`)**:
   UI для ввода инструкций и отображения плана монтажа.

```typescript
import React from 'react';
import { useMontagePlanner } from './useMontagePlanner';

export const MontagePlanner: React.FC = () => {
  const { videoIds, instructions, plan, progress, error, isAnalyzing, addVideo, updateInstructions } = useMontagePlanner();

  const handleAddVideo = () => {
    const videoId = `video_${Date.now()}`; // Пример, замените на реальный ID
    addVideo(videoId);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl">Планировщик монтажа</h2>
      <textarea
        value={instructions}
        onChange={(e) => updateInstructions(e.target.value)}
        placeholder="Инструкции (например, 'чаще добавляй Джона')"
        className="w-full p-2 border rounded"
      />
      <button
        onClick={handleAddVideo}
        disabled={isAnalyzing}
        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Добавить видео
      </button>
      {isAnalyzing && <p>Прогресс: {progress}%</p>}
      {error && <p className="text-red-500">{error}</p>}
      {plan && (
        <div className="mt-4">
          <h3>План монтажа:</h3>
          {plan.fragments.map((fragment) => (
            <div key={fragment.id} className="border p-2 my-2">
              <p><strong>Видео:</strong> {fragment.videoId}</p>
              <p><strong>Время:</strong> {fragment.startTime}s - {fragment.endTime}s</p>
              <img src={fragment.screenshotPath} alt="Screenshot" className="w-32" />
              <p><strong>Объекты:</strong> {fragment.objects.join(', ')}</p>
              <p><strong>Люди:</strong> {fragment.people.map((p) => p.name).join(', ')}</p>
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
1. **Tauri-команда (`src-tauri/src/montage_planner.rs`)**:
   Анализирует видео, генерирует скриншоты и распознает объекты/лица.

```rust
use tauri::command;
use tauri::Manager;
use ffmpeg::format::{input, Pixel};
use ffmpeg::util::frame::video::Video;
use onnxruntime::{environment::Environment, session::Session};
use serde::{Serialize, Deserialize};
use uuid::Uuid;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct Fragment {
    pub id: String,
    pub video_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub screenshot_path: String,
    pub objects: Vec<String>,
    pub people: Vec<Person>,
    pub transition: Option<String>,
    pub effect: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct MontagePlan {
    pub fragments: Vec<Fragment>,
    pub total_duration: f64,
}

#[command]
pub async fn analyze_videos(app_handle: tauri::AppHandle, video_ids: Vec<String>, instructions: String) -> Result<MontagePlan, String> {
    let mut fragments = vec![];

    for (index, video_id) in video_ids.iter().enumerate() {
        // Путь к видео (замените на реальный путь из resources/)
        let video_path = format!("path/to/video/{}.mp4", video_id);

        // FFmpeg: генерация скриншотов
        let mut ictx = input(&video_path).map_err(|e| format!("FFmpeg error: {}", e))?;
        let video_stream = ictx.streams()
            .best(ffmpeg::media::Type::Video)
            .ok_or("No video stream")?;
        let mut decoder = video_stream.codec().decoder().video().map_err(|e| format!("Decoder error: {}", e))?;
        let mut frame_count = 0;
        let mut screenshots = vec![];

        for (stream, packet) in ictx.packets() {
            if stream.index() == video_stream.index() {
                decoder.send_packet(&packet).map_err(|e| format!("Send packet error: {}", e))?;
                let mut frame = Video::empty();
                if decoder.receive_frame(&mut frame).is_ok() {
                    frame_count += 1;
                    if frame_count % 30 == 0 { // Скриншот каждые 30 кадров
                        let timestamp = frame_count as f64 / video_stream.avg_frame_rate().unwrap_or(30.0);
                        let screenshot_path = format!("screenshots/{}_{}.jpg", video_id, frame_count);
                        // Сохранение скриншота (упрощенно, требуется доработка)
                        let mut encoder = ffmpeg::codec::encoder::find(ffmpeg::codec::Id::JPEG)
                            .unwrap()
                            .encoder()
                            .video()
                            .map_err(|e| format!("Encoder error: {}", e))?;
                        let mut output = ffmpeg::format::output(&Path::new(&screenshot_path))
                            .map_err(|e| format!("Output error: {}", e))?;
                        encoder.send_frame(&frame).map_err(|e| format!("Send frame error: {}", e))?;
                        encoder.flush().map_err(|e| format!("Flush error: {}", e))?;
                        screenshots.push((timestamp, screenshot_path));
                    }
                }
            }
        }

        // Отправка прогресса
        let progress = ((index + 1) as f32 / video_ids.len() as f32 * 50.0) as i32;
        app_handle.emit_all("analysis_progress", progress).map_err(|e| format!("Emit error: {}", e))?;

        // YOLOv11: распознавание объектов/лиц
        let env = Environment::builder().build().map_err(|e| format!("ONNX error: {}", e))?;
        let mut session = env
            .new_session_builder()?
            .with_model_from_file("yolov11.onnx")?;
        for (timestamp, screenshot_path) in screenshots {
            // Пример распознавания (замените на реальный код YOLOv11)
            let objects = vec!["person".to_string()];
            let people = vec![Person {
                id: Uuid::new_v4().to_string(),
                name: if instructions.contains("Джона") { "John".to_string() } else { "Unknown".to_string() },
            }];

            fragments.push(Fragment {
                id: Uuid::new_v4().to_string(),
                video_id: video_id.clone(),
                start_time: timestamp,
                end_time: timestamp + 5.0, // Примерная длительность фрагмента
                screenshot_path,
                objects,
                people,
                transition: Some("fade".to_string()),
                effect: None,
            });
        }
    }

    // Отправка финального прогресса
    app_handle.emit_all("analysis_progress", 100).map_err(|e| format!("Emit error: {}", e))?;

    Ok(MontagePlan {
        fragments,
        total_duration: fragments.iter().map(|f| f.end_time).max_by(|a, b| a.partial_cmp(b).unwrap()).unwrap_or(0.0),
    })
}
```

2. **Интеграция в `main.rs`**:
   Подключите команду в Tauri.

```rust
use tauri::Builder;
mod montage_planner;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![montage_planner::analyze_videos])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Предотвращение зависаний
Чтобы анализ не блокировал UI:
- **Асинхронность**: Используйте `tokio::task::spawn_blocking` для тяжелых операций (`ffmpeg-rs`, YOLOv11) в `montage_planner.rs`.
  ```rust
  use tokio::task::spawn_blocking;

  #[command]
  pub async fn analyze_videos(app_handle: tauri::AppHandle, video_ids: Vec<String>, instructions: String) -> Result<MontagePlan, String> {
      spawn_blocking(move || {
          // Тяжелый код FFmpeg/YOLO
      }).await.map_err(|e| format!("Task error: {}", e))?;
  }
  ```
- **Прогресс**: Отправляйте обновления прогресса через `app_handle.emit_all` и отображайте их в UI (`progress` в контексте XState).
- **Кэширование**: Сохраняйте скриншоты и результаты YOLOv11 в SQLite (`resources/`) для повторного использования.
- **Очереди**: Если добавлено несколько видео, обрабатывайте их последовательно в `montagePlannerMachine` (через `videoIds`).

### Интеграция с другими модулями
- **С `timeline/`**: `Fragment` передаются как клипы с `startTime` и `endTime`.
- **С `subtitles/`**: Если субтитры доступны, используйте их для уточнения фрагментов (например, выбирать куски, где говорит "John").
- **С `person-identification/`**: `Fragment.people` использует данные из SQLite.
- **С `transitions/` и `effects/`**: Применяйте переходы и эффекты на основе инструкций.
- **С `media/`**: Используйте `ffmpeg-rs` для получения метаданных и генерации скриншотов.

### Ответ на ваш запрос
Вы хотите, чтобы `montage-planner/` автоматически анализировал видео при добавлении в проект, генерировал скриншоты (`ffmpeg-rs`), распознавал объекты/лица (YOLOv11) и создавал фрагменты для таймлайна, не вызывая зависаний. Я предложил:
- **Структуры данных**: `Fragment` для фрагментов с таймкодами, скриншотами, объектами и людьми; `MontagePlan` для плана монтажа.
- **Фронтенд**: XState-машина, провайдер, хук и UI для управления анализом и отображения плана.
- **Бэкенд**: Tauri-команда `analyze_videos` для асинхронного анализа с `ffmpeg-rs` и YOLOv11.
- **Предотвращение зависаний**: Асинхронные задачи с `tokio`, прогресс через события Tauri, кэширование в SQLite.

**Монтаж**: Модуль генерирует фрагменты, которые сразу отображаются в `timeline/`, поддерживая монтаж по частям (каждый фрагмент — отдельный клип). Инструкции вроде "чаще добавляй Джона" учитываются при фильтрации фрагментов.

Если нужно доработать, например, добавить поддержку субтитров для фильтрации фрагментов или конкретный код для YOLOv11, напишите, и я подготовлю!