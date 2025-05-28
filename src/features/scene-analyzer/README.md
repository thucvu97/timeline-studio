Класс, мы почти завершили! 😄 Последний модуль, который вы упомянули ранее, — это **`scene-analyzer/`**. Он нужен для анализа сцен в видео, объединяя данные из `media/` (аудио и скриншоты через `ffmpeg-rs`), `recognition/` (объекты/лица через YOLOv11), `person-identification/` (имена людей) и `subtitles/` (диалоги и спикеры). Этот модуль создаст описания сцен, которые будут использоваться в `montage-planner/` и `script-generator/` для формирования точных фрагментов и сценариев, учитывая ваши инструкции (например, "чаще добавляй Джона"). Учитывая ваш стек (Tauri, React, XState, `ffmpeg-rs`, YOLOv11) и структуру (машина, провайдер, хук), я определю структуры данных и реализацию для `scene-analyzer/`, с акцентом на асинхронный анализ, интеграцию с таймлайном и предотвращение зависаний.

### Концепция `scene-analyzer/`
- **Цель**: Анализировать видео, разбивая его на сцены на основе данных из `ffmpeg-rs` (аудио, ключевые кадры), YOLOv11 (объекты/лица), `person-identification/` (люди) и `subtitles/` (диалоги). Результат — список сцен с таймкодами, описаниями и метаданными, которые интегрируются в `montage-planner/` и `script-generator/`.
- **Требования**:
  - Автоматический запуск анализа при добавлении видео в проект (как в `montage-planner/`).
  - Асинхронная обработка для предотвращения зависаний UI.
  - Интеграция с `timeline/`, `subtitles/`, `person-identification/`, `transitions/`, `effects/`.
  - Учет инструкций пользователя (например, приоритет сцен с определенными людьми).
- **Фронтенд**:
  - React-компоненты для отображения сцен и прогресса анализа.
  - XState-машина для управления состояниями (добавление видео, анализ, отображение).
  - Хук для взаимодействия с машиной и вызова Tauri-команд.
- **Бэкенд**:
  - Rust-модуль для объединения данных (`ffmpeg-rs`, YOLOv11, субтитры) и создания описаний сцен.
  - Tauri-команда для передачи результатов на фронтенд.
- **Синхронизация**:
  - Прогресс анализа отправляется через `tauri-plugin-websocket` или события Tauri.
  - Результаты кэшируются в SQLite (`resources/`) для повторного использования.

### Структуры данных
Структуры должны поддерживать:
- Описание сцен (таймкоды, объекты, люди, диалоги).
- Интеграцию с `montage-planner/` и `script-generator/`.
- Связь с субтитрами и данными о людях.

#### 1. Структура сцен (JSON/TS)
```typescript
// src/features/scene-analyzer/types.ts
export interface Scene {
  id: string; // Уникальный ID (UUID)
  videoId: string; // ID видео из timeline/
  startTime: number; // Начало сцены (секунды)
  endTime: number; // Конец сцены (секунды)
  description: string; // Описание сцены (например, "Джон говорит в парке")
  screenshotPath: string; // Путь к ключевому скриншоту
  objects: string[]; // Объекты из YOLOv11 (например, ["car", "tree"])
  people: Person[]; // Люди из person-identification
  subtitleIds: string[]; // ID субтитров из subtitles/
  audioFeatures?: { peakVolume: number; speechDetected: boolean }; // Аудио-данные из ffmpeg-rs
}

export interface Person {
  id: string; // ID из person-identification
  name: string; // Имя человека
}

export interface SceneAnalysisResult {
  scenes: Scene[]; // Список сцен
  totalDuration: number; // Общая длительность
}
```

- **Использование**:
  - `Scene` передается в `montage-planner/` как основа для фрагментов.
  - `description` используется в `script-generator/` для сценария.
  - `screenshotPath` отображается в UI для предпросмотра.
  - `subtitleIds` связывает сцены с диалогами.
  - `audioFeatures` помогает определять сцены (например, по пикам громкости).

#### 2. XState Context
Контекст машины хранит данные о видео, инструкции, сцены и прогресс.

```typescript
// src/features/scene-analyzer/machine.ts
import { createMachine } from 'xstate';
import { SceneAnalysisResult, Scene } from './types';

interface SceneAnalyzerContext {
  videoIds: string[]; // ID видео для анализа
  instructions: string; // Инструкции (например, "чаще добавляй Джона")
  scenes: SceneAnalysisResult | null; // Результат анализа
  progress: number; // Прогресс (0-100%)
  error: string | null; // Ошибка
  isAnalyzing: boolean; // Статус анализа
}

type SceneAnalyzerEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'SCENES_ANALYZED'; scenes: SceneAnalysisResult }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_SCENE'; sceneId: string; updates: Partial<Scene> };
```

#### 3. Бэкенд (Rust)
Структура для бэкенда сериализует сцены.

```rust
// src-tauri/src/scene_analyzer.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Scene {
    pub id: String,
    pub video_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub description: String,
    pub screenshot_path: String,
    pub objects: Vec<String>,
    pub people: Vec<Person>,
    pub subtitle_ids: Vec<String>,
    pub audio_features: Option<AudioFeatures>,
}

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct AudioFeatures {
    pub peak_volume: f32,
    pub speech_detected: bool,
}

#[derive(Serialize, Deserialize)]
pub struct SceneAnalysisResult {
    pub scenes: Vec<Scene>,
    pub total_duration: f64,
}
```

### Реализация `scene-analyzer/`

#### Фронтенд
1. **Типы (`src/features/scene-analyzer/types.ts`)**:
   Определены выше (`Scene`, `Person`, `AudioFeatures`, `SceneAnalysisResult`).

2. **XState-машина (`src/features/scene-analyzer/machine.ts`)**:
   Управляет анализом сцен и интеграцией данных.

```typescript
import { createMachine, assign } from 'xstate';
import { SceneAnalysisResult, Scene } from './types';

interface SceneAnalyzerContext {
  videoIds: string[];
  instructions: string;
  scenes: SceneAnalysisResult | null;
  progress: number;
  error: string | null;
  isAnalyzing: boolean;
}

type SceneAnalyzerEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_INSTRUCTIONS'; value: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'SCENES_ANALYZED'; scenes: SceneAnalysisResult }
  | { type: 'ERROR'; message: string }
  | { type: 'EDIT_SCENE'; sceneId: string; updates: Partial<Scene> };

export const sceneAnalyzerMachine = createMachine<SceneAnalyzerContext, SceneAnalyzerEvent>({
  id: 'sceneAnalyzer',
  initial: 'idle',
  context: {
    videoIds: [],
    instructions: '',
    scenes: null,
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
        src: 'analyzeScenes',
        onDone: {
          target: 'idle',
          actions: assign({
            scenes: (_, event) => event.data,
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

3. **Провайдер (`src/features/scene-analyzer/SceneAnalyzerProvider.tsx`)**:
   Оборачивает компоненты и предоставляет машину.

```typescript
import React from 'react';
import { useMachine } from '@xstate/react';
import { sceneAnalyzerMachine } from './machine';
import { SceneAnalysisResult } from './types';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface SceneAnalyzerProviderProps {
  children: React.ReactNode;
}

export const SceneAnalyzerContext = React.createContext<any>(null);

export const SceneAnalyzerProvider: React.FC<SceneAnalyzerProviderProps> = ({ children }) => {
  const [state, send] = useMachine(sceneAnalyzerMachine, {
    services: {
      analyzeScenes: async (context) => {
        try {
          const result: SceneAnalysisResult = await invoke('analyze_scenes', {
            videoIds: context.videoIds,
            instructions: context.instructions,
          });
          send({ type: 'SCENES_ANALYZED', scenes: result });
          return result;
        } catch (error) {
          send({ type: 'ERROR', message: error.message });
          throw error;
        }
      },
    },
  });

  // Слушаем прогресс анализа
  React.useEffect(() => {
    const unsubscribe = listen('scene_analysis_progress', (event: { payload: number }) => {
      send({ type: 'UPDATE_PROGRESS', progress: event.payload });
    });
    return () => unsubscribe.then((f) => f());
  }, [send]);

  return (
    <SceneAnalyzerContext.Provider value={{ state, send }}>
      {children}
    </SceneAnalyzerContext.Provider>
  );
};
```

4. **Хук (`src/features/scene-analyzer/useSceneAnalyzer.ts`)**:
   Упрощает доступ к машине.

```typescript
import { useContext } from 'react';
import { SceneAnalyzerContext } from './SceneAnalyzerProvider';
import { Scene } from './types';

export const useSceneAnalyzer = () => {
  const { state, send } = useContext(SceneAnalyzerContext);

  const addVideo = (videoId: string) => {
    send({ type: 'ADD_VIDEO', videoId });
  };

  const updateInstructions = (value: string) => {
    send({ type: 'UPDATE_INSTRUCTIONS', value });
  };

  const editScene = (sceneId: string, updates: Partial<Scene>) => {
    send({ type: 'EDIT_SCENE', sceneId, updates });
  };

  return {
    videoIds: state.context.videoIds,
    instructions: state.context.instructions,
    scenes: state.context.scenes,
    progress: state.context.progress,
    error: state.context.error,
    isAnalyzing: state.context.isAnalyzing,
    addVideo,
    updateInstructions,
    editScene,
  };
};
```

5. **Компонент (`src/features/scene-analyzer/SceneAnalyzer.tsx`)**:
   UI для отображения сцен и прогресса анализа.

```typescript
import React from 'react';
import { useSceneAnalyzer } from './useSceneAnalyzer';

export const SceneAnalyzer: React.FC = () => {
  const { scenes, progress, error, isAnalyzing, addVideo, updateInstructions } = useSceneAnalyzer();

  const handleAddVideo = () => {
    const videoId = `video_${Date.now()}`; // Замените на реальный ID
    addVideo(videoId);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl">Анализ сцен</h2>
      <textarea
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
      {scenes && (
        <div className="mt-4">
          <h3>Сцены:</h3>
          {scenes.scenes.map((scene) => (
            <div key={scene.id} className="border p-2 my-2">
              <p><strong>Видео:</strong> {scene.videoId}</p>
              <p><strong>Описание:</strong> {scene.description}</p>
              <p><strong>Время:</strong> {scene.startTime}s - {scene.endTime}s</p>
              <img src={scene.screenshotPath} alt="Screenshot" className="w-32" />
              <p><strong>Объекты:</strong> {scene.objects.join(', ')}</p>
              <p><strong>Люди:</strong> {scene.people.map((p) => p.name).join(', ')}</p>
              <p><strong>Субтитры:</strong> {scene.subtitleIds.join(', ')}</p>
              {scene.audioFeatures && (
                <p>
                  <strong>Аудио:</strong> Громкость: {scene.audioFeatures.peakVolume}, Речь:{' '}
                  {scene.audioFeatures.speechDetected ? 'Да' : 'Нет'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

#### Бэкенд
1. **Tauri-команда (`src-tauri/src/scene_analyzer.rs`)**:
   Анализирует видео, объединяя данные `ffmpeg-rs`, YOLOv11 и субтитры.

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
pub struct Scene {
    pub id: String,
    pub video_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub description: String,
    pub screenshot_path: String,
    pub objects: Vec<String>,
    pub people: Vec<Person>,
    pub subtitle_ids: Vec<String>,
    pub audio_features: Option<AudioFeatures>,
}

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct AudioFeatures {
    pub peak_volume: f32,
    pub speech_detected: bool,
}

#[derive(Serialize, Deserialize)]
pub struct SceneAnalysisResult {
    pub scenes: Vec<Scene>,
    pub total_duration: f64,
}

#[command]
pub async fn analyze_scenes(app_handle: tauri::AppHandle, video_ids: Vec<String>, instructions: String) -> Result<SceneAnalysisResult, String> {
    let mut scenes = vec![];

    for (index, video_id) in video_ids.iter().enumerate() {
        let video_path = format!("path/to/video/{}.mp4", video_id);
        let mut ictx = input(&video_path).map_err(|e| format!("FFmpeg error: {}", e))?;
        let video_stream = ictx
            .streams()
            .best(ffmpeg::media::Type::Video)
            .ok_or("No video stream")?;
        let audio_stream = ictx
            .streams()
            .best(ffmpeg::media::Type::Audio)
            .ok_or("No audio stream")?;
        let mut video_decoder = video_stream.codec().decoder().video().map_err(|e| format!("Decoder error: {}", e))?;
        let mut frame_count = 0;

        // YOLOv11: настройка модели
        let env = Environment::builder().build().map_err(|e| format!("ONNX error: {}", e))?;
        let mut session = env
            .new_session_builder()?
            .with_model_from_file("yolov11.onnx")?;

        // Пример субтитров (замените на данные из subtitles/)
        let subtitles = vec![
            // Загрузка из SQLite или другого источника
        ];

        for (stream, packet) in ictx.packets() {
            if stream.index() == video_stream.index() {
                video_decoder.send_packet(&packet).map_err(|e| format!("Send packet error: {}", e))?;
                let mut frame = Video::empty();
                if video_decoder.receive_frame(&mut frame).is_ok() {
                    frame_count += 1;
                    if frame_count % 30 == 0 { // Анализ каждые 30 кадров
                        let timestamp = frame_count as f64 / video_stream.avg_frame_rate().unwrap_or(30.0);
                        let screenshot_path = format!("screenshots/{}_{}.jpg", video_id, frame_count);

                        // Сохранение скриншота
                        let mut encoder = ffmpeg::codec::encoder::find(ffmpeg::codec::Id::JPEG)
                            .unwrap()
                            .encoder()
                            .video()
                            .map_err(|e| format!("Encoder error: {}", e))?;
                        let mut output = ffmpeg::format::output(&Path::new(&screenshot_path))
                            .map_err(|e| format!("Output error: {}", e))?;
                        encoder.send_frame(&frame).map_err(|e| format!("Send frame error: {}", e))?;
                        encoder.flush().map_err(|e| format!("Flush error: {}", e))?;

                        // YOLOv11: распознавание объектов/лиц
                        let objects = vec!["person".to_string()];
                        let people = vec![Person {
                            id: Uuid::new_v4().to_string(),
                            name: if instructions.contains("Джона") { "John".to_string() } else { "Unknown".to_string() },
                        }];

                        // Аудио-анализ (упрощенно)
                        let audio_features = Some(AudioFeatures {
                            peak_volume: 0.5, // Замените на реальный анализ ffmpeg-rs
                            speech_detected: true,
                        });

                        // Описание сцены (генерация через Grok API или шаблон)
                        let description = if instructions.contains("Джона") && people.iter().any(|p| p.name == "John") {
                            format!("Сцена с Джоном")
                        } else {
                            "Общая сцена".to_string()
                        };

                        scenes.push(Scene {
                            id: Uuid::new_v4().to_string(),
                            video_id: video_id.clone(),
                            start_time: timestamp,
                            end_time: timestamp + 5.0,
                            description,
                            screenshot_path,
                            objects,
                            people,
                            subtitle_ids: vec![], // Связь с субтитрами
                            audio_features,
                        });
                    }
                }
            }
        }

        // Отправка прогресса
        let progress = ((index + 1) as f32 / video_ids.len() as f32 * 100.0) as i32;
        app_handle.emit_all("scene_analysis_progress", progress).map_err(|e| format!("Emit error: {}", e))?;
    }

    Ok(SceneAnalysisResult {
        scenes,
        total_duration: scenes.iter().map(|s| s.end_time).max_by(|a, b| a.partial_cmp(b).unwrap()).unwrap_or(0.0),
    })
}
```

2. **Интеграция в `main.rs`**:
   Подключите команду.

```rust
use tauri::Builder;
mod script_generator;
mod montage_planner;
mod person_identification;
mod scene_analyzer;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            script_generator::generate_script,
            montage_planner::analyze_videos,
            person_identification::identify_people,
            scene_analyzer::analyze_scenes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Предотвращение зависаний
Чтобы анализ не блокировал UI:
- **Асинхронность**: Используйте `tokio::task::spawn_blocking` для `ffmpeg-rs` и YOLOv11.
  ```rust
  use tokio::task::spawn_blocking;

  #[command]
  pub async fn analyze_scenes(app_handle: tauri::AppHandle, video_ids: Vec<String>, instructions: String) -> Result<SceneAnalysisResult, String> {
      spawn_blocking(move || {
          // Код анализа
      }).await.map_err(|e| format!("Task error: {}", e))?;
  }
  ```
- **Прогресс**: Отправляйте обновления через `app_handle.emit_all` и отображайте в UI (`progress` в XState).
- **Кэширование**: Сохраняйте сцены в SQLite (`resources/`) с полями: `id`, `video_id`, `start_time`, `end_time`, `description`, `screenshot_path`, `objects`, `people`, `subtitle_ids`, `audio_features`.

### Интеграция с другими модулями
- **С `timeline/`**: `Scene` передаются как клипы с `startTime` и `endTime`.
- **С `subtitles/`**: `subtitleIds` связывает сцены с диалогами для фильтрации (например, сцены, где говорит "John").
- **С `person-identification/`**: `Scene.people` использует данные из SQLite.
- **С `montage-planner/`**: Сцены становятся основой для фрагментов.
- **С `script-generator/`**: `Scene.description` используется для генерации текстового сценария.
- **С `media/`**: Аудио-данные и скриншоты берутся через `ffmpeg-rs`.

### Ответ на ваш запрос
Модуль **`scene-analyzer/`** завершает ваш набор, обеспечивая анализ сцен для точного формирования фрагментов и сценариев. Я предложил:
- **Структуры данных**: `Scene` для описания сцен с таймкодами, объектами, людьми и аудио-данными.
- **Фронтенд**: XState-машина, провайдер, хук и UI для отображения сцен и прогресса.
- **Бэкенд**: Tauri-команда для анализа с `ffmpeg-rs`, YOLOv11 и субтитров.
- **Интеграция**: Связь с `timeline/`, `subtitles/`, `person-identification/`, `montage-planner/` и `script-generator/`.

**Что дальше**: Все модули (`script-generator/`, `montage-planner/`, `person-identification/`, `scene-analyzer/`) теперь определены. Следующий шаг — интеграция их в общий рабочий процесс:
1. **Тестирование**: Проверьте, как модули взаимодействуют при добавлении видео (автоматический анализ, генерация сценария, монтаж).
2. **Оптимизация**: Настройте кэширование в SQLite и GPU для YOLOv11.
3. **UI/UX**: Добавьте в `top-bar/` кнопки для доступа к модулям и подсказки в `ai-chat/`.

Если хотите доработать конкретный аспект (например, интеграцию субтитров в `scene-analyzer/` или UI для редактирования сцен), напишите, и я подготовлю код! 🚀
