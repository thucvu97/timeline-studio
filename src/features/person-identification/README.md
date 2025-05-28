Круто, что вам понравилось! 😎 Следующий модуль, который логично реализовать, — это **`person-identification/`**, так как он критически важен для вашей задачи: вы хотите, чтобы AI учитывал конкретных людей (например, "чаще добавляй Джона") при генерации сценария и плана монтажа. Этот модуль позволит идентифицировать и именовать людей в видео с помощью YOLOv11 (или дополнительной модели для лиц, например, FaceNet), связывать их с субтитрами и интегрировать с `script-generator/` и `montage-planner/`. Это обеспечит точное распознавание персонажей и их использование в сценариях/монтаже, что вы упомянули ранее.

### Почему `person-identification/` следующий?
1. **Ключевая зависимость**: Ваши инструкции вроде "чаще добавляй Джона" требуют, чтобы система знала, кто есть кто в видео. Без этого `script-generator/` и `montage-planner/` не смогут правильно фильтровать фрагменты по персонажам.
2. **Интеграция с YOLOv11**: Вы уже используете YOLOv11 в Rust, и этот модуль позволит настроить распознавание лиц/людей, что дополнит анализ объектов.
3. **Синхронизация с субтитрами**: Модуль свяжет имена людей с субтитрами (например, кто говорит в определенном фрагменте), что улучшит точность `montage-planner/`.
4. **Готовность стека**: С `ffmpeg-rs` для скриншотов и YOLOv11 для распознавания у вас есть всё, чтобы начать.

### Концепция `person-identification/`
- **Цель**: Распознавать людей в видео (с помощью YOLOv11 или FaceNet), присваивать им имена (вручную или автоматически), хранить данные в SQLite и предоставлять их для `script-generator/` и `montage-planner/`.
- **Фронтенд**:
  - React-компоненты для отображения распознанных лиц и ввода имен.
  - XState-машина для управления процессом (распознавание, именование, редактирование).
  - Хук для взаимодействия с машиной и вызова Tauri-команд.
- **Бэкенд**:
  - Rust-модуль для анализа скриншотов с YOLOv11 (или FaceNet) и хранения данных о людях.
  - Tauri-команда для передачи результатов на фронтенд.
- **Синхронизация**:
  - Асинхронный анализ лиц с отправкой прогресса через `tauri-plugin-websocket`.
  - Кэширование данных в SQLite (`resources/`) для повторного использования.

### Структуры данных
Структуры должны поддерживать:
- Данные о людях (ID, имя, таймкоды, скриншоты).
- Интеграцию с `montage-planner/` и `script-generator/`.
- Связь с субтитрами для определения спикеров.

#### 1. Структура данных (JSON/TS)
```typescript
// src/features/person-identification/types.ts
export interface Person {
  id: string; // Уникальный ID (UUID)
  name: string; // Имя человека (например, "John")
  thumbnailPath: string; // Путь к скриншоту лица
  timestamps: { startTime: number; endTime: number }[]; // Таймкоды появления в видео
  subtitleIds: string[]; // ID субтитров, связанных с человеком
}

export interface PersonIdentificationResult {
  people: Person[]; // Список распознанных людей
}
```

- **Использование**:
  - `Person` хранит данные о людях, которые используются в `montage-planner/` и `script-generator/`.
  - `thumbnailPath` отображается в UI для ручного именования.
  - `subtitleIds` связывает людей с субтитрами для фильтрации фрагментов.

#### 2. XState Context
Контекст машины хранит данные о людях, прогресс анализа и ошибки.

```typescript
// src/features/person-identification/machine.ts
import { createMachine } from 'xstate';
import { Person } from './types';

interface PersonIdentificationContext {
  videoIds: string[]; // ID видео для анализа
  people: Person[]; // Распознанные люди
  progress: number; // Прогресс анализа (0-100%)
  error: string | null; // Ошибка
  isAnalyzing: boolean; // Статус анализа
}

type PersonIdentificationEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_PERSON'; personId: string; name: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PEOPLE_IDENTIFIED'; people: Person[] }
  | { type: 'ERROR'; message: string };
```

#### 3. Бэкенд (Rust)
Структура для бэкенда сериализует данные о людях.

```rust
// src-tauri/src/person_identification.rs
use serde::{Serialize, Deserialize};
use uuid::Uuid;

#[derive(Serialize, Deserialize)]
pub struct Person {
    pub id: String,
    pub name: String,
    pub thumbnail_path: String,
    pub timestamps: Vec<Timestamp>,
    pub subtitle_ids: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Timestamp {
    pub start_time: f64,
    pub end_time: f64,
}

#[derive(Serialize, Deserialize)]
pub struct PersonIdentificationResult {
    pub people: Vec<Person>,
}
```

### Реализация `person-identification/`

#### Фронтенд
1. **Типы (`src/features/person-identification/types.ts`)**:
   Определены выше (`Person`, `PersonIdentificationResult`).

2. **XState-машина (`src/features/person-identification/machine.ts`)**:
   Управляет анализом и именованием людей.

```typescript
import { createMachine, assign } from 'xstate';
import { Person } from './types';

interface PersonIdentificationContext {
  videoIds: string[];
  people: Person[];
  progress: number;
  error: string | null;
  isAnalyzing: boolean;
}

type PersonIdentificationEvent =
  | { type: 'ADD_VIDEO'; videoId: string }
  | { type: 'UPDATE_PERSON'; personId: string; name: string }
  | { type: 'START_ANALYSIS' }
  | { type: 'UPDATE_PROGRESS'; progress: number }
  | { type: 'PEOPLE_IDENTIFIED'; people: Person[] }
  | { type: 'ERROR'; message: string };

export const personIdentificationMachine = createMachine<PersonIdentificationContext, PersonIdentificationEvent>({
  id: 'personIdentification',
  initial: 'idle',
  context: {
    videoIds: [],
    people: [],
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
        UPDATE_PERSON: {
          actions: assign({
            people: (ctx, event) =>
              ctx.people.map((p) =>
                p.id === event.personId ? { ...p, name: event.name } : p
              ),
          }),
        },
      },
    },
    analyzing: {
      entry: assign({ isAnalyzing: true }),
      invoke: {
        src: 'identifyPeople',
        onDone: {
          target: 'idle',
          actions: assign({
            people: (_, event) => event.data,
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
        UPDATE_PERSON: {
          actions: assign({
            people: (ctx, event) =>
              ctx.people.map((p) =>
                p.id === event.personId ? { ...p, name: event.name } : p
              ),
          }),
        },
      },
    },
  },
});
```

3. **Провайдер (`src/features/person-identification/PersonIdentificationProvider.tsx`)**:
   Оборачивает компоненты и предоставляет машину.

```typescript
import React from 'react';
import { useMachine } from '@xstate/react';
import { personIdentificationMachine } from './machine';
import { PersonIdentificationResult } from './types';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

interface PersonIdentificationProviderProps {
  children: React.ReactNode;
}

export const PersonIdentificationContext = React.createContext<any>(null);

export const PersonIdentificationProvider: React.FC<PersonIdentificationProviderProps> = ({ children }) => {
  const [state, send] = useMachine(personIdentificationMachine, {
    services: {
      identifyPeople: async (context) => {
        try {
          const result: PersonIdentificationResult = await invoke('identify_people', {
            videoIds: context.videoIds,
          });
          send({ type: 'PEOPLE_IDENTIFIED', people: result.people });
          return result.people;
        } catch (error) {
          send({ type: 'ERROR', message: error.message });
          throw error;
        }
      },
    },
  });

  // Слушаем прогресс анализа
  React.useEffect(() => {
    const unsubscribe = listen('identification_progress', (event: { payload: number }) => {
      send({ type: 'UPDATE_PROGRESS', progress: event.payload });
    });
    return () => unsubscribe.then((f) => f());
  }, [send]);

  return (
    <PersonIdentificationContext.Provider value={{ state, send }}>
      {children}
    </PersonIdentificationContext.Provider>
  );
};
```

4. **Хук (`src/features/person-identification/usePersonIdentification.ts`)**:
   Упрощает доступ к машине.

```typescript
import { useContext } from 'react';
import { PersonIdentificationContext } from './PersonIdentificationProvider';

export const usePersonIdentification = () => {
  const { state, send } = useContext(PersonIdentificationContext);

  const addVideo = (videoId: string) => {
    send({ type: 'ADD_VIDEO', videoId });
  };

  const updatePerson = (personId: string, name: string) => {
    send({ type: 'UPDATE_PERSON', personId, name });
  };

  return {
    videoIds: state.context.videoIds,
    people: state.context.people,
    progress: state.context.progress,
    error: state.context.error,
    isAnalyzing: state.context.isAnalyzing,
    addVideo,
    updatePerson,
  };
};
```

5. **Компонент (`src/features/person-identification/PersonIdentification.tsx`)**:
   UI для отображения распознанных лиц и ввода имен.

```typescript
import React from 'react';
import { usePersonIdentification } from './usePersonIdentification';

export const PersonIdentification: React.FC = () => {
  const { people, progress, error, isAnalyzing, updatePerson } = usePersonIdentification();

  return (
    <div className="p-4">
      <h2 className="text-xl">Идентификация людей</h2>
      {isAnalyzing && <p>Прогресс: {progress}%</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="mt-4">
        {people.map((person) => (
          <div key={person.id} className="border p-2 my-2 flex items-center">
            <img src={person.thumbnailPath} alt="Face" className="w-16 h-16 mr-4" />
            <input
              type="text"
              value={person.name}
              onChange={(e) => updatePerson(person.id, e.target.value)}
              placeholder="Введите имя"
              className="p-2 border rounded"
            />
            <p className="ml-4">
              <strong>Время:</strong>{' '}
              {person.timestamps.map((t) => `${t.startTime}s - ${t.endTime}s`).join(', ')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Бэкенд
1. **Tauri-команда (`src-tauri/src/person_identification.rs`)**:
   Анализирует скриншоты с помощью YOLOv11 и сохраняет данные о людях.

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
pub struct Person {
    pub id: String,
    pub name: String,
    pub thumbnail_path: String,
    pub timestamps: Vec<Timestamp>,
    pub subtitle_ids: Vec<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Timestamp {
    pub start_time: f64,
    pub end_time: f64,
}

#[derive(Serialize, Deserialize)]
pub struct PersonIdentificationResult {
    pub people: Vec<Person>,
}

#[command]
pub async fn identify_people(app_handle: tauri::AppHandle, video_ids: Vec<String>) -> Result<PersonIdentificationResult, String> {
    let mut people = vec![];

    for (index, video_id) in video_ids.iter().enumerate() {
        let video_path = format!("path/to/video/{}.mp4", video_id);
        let mut ictx = input(&video_path).map_err(|e| format!("FFmpeg error: {}", e))?;
        let video_stream = ictx
            .streams()
            .best(ffmpeg::media::Type::Video)
            .ok_or("No video stream")?;
        let mut decoder = video_stream.codec().decoder().video().map_err(|e| format!("Decoder error: {}", e))?;
        let mut frame_count = 0;

        // YOLOv11: настройка модели
        let env = Environment::builder().build().map_err(|e| format!("ONNX error: {}", e))?;
        let mut session = env
            .new_session_builder()?
            .with_model_from_file("yolov11.onnx")?;

        for (stream, packet) in ictx.packets() {
            if stream.index() == video_stream.index() {
                decoder.send_packet(&packet).map_err(|e| format!("Send packet error: {}", e))?;
                let mut frame = Video::empty();
                if decoder.receive_frame(&mut frame).is_ok() {
                    frame_count += 1;
                    if frame_count % 30 == 0 { // Анализ каждые 30 кадров
                        let timestamp = frame_count as f64 / video_stream.avg_frame_rate().unwrap_or(30.0);
                        let thumbnail_path = format!("thumbnails/{}_{}.jpg", video_id, frame_count);

                        // Сохранение скриншота
                        let mut encoder = ffmpeg::codec::encoder::find(ffmpeg::codec::Id::JPEG)
                            .unwrap()
                            .encoder()
                            .video()
                            .map_err(|e| format!("Encoder error: {}", e))?;
                        let mut output = ffmpeg::format::output(&Path::new(&thumbnail_path))
                            .map_err(|e| format!("Output error: {}", e))?;
                        encoder.send_frame(&frame).map_err(|e| format!("Send frame error: {}", e))?;
                        encoder.flush().map_err(|e| format!("Flush error: {}", e))?;

                        // YOLOv11: распознавание лиц (пример, замените на реальный код)
                        let person = Person {
                            id: Uuid::new_v4().to_string(),
                            name: "Unknown".to_string(),
                            thumbnail_path,
                            timestamps: vec![Timestamp {
                                start_time: timestamp,
                                end_time: timestamp + 5.0,
                            }],
                            subtitle_ids: vec![], // Связь с субтитрами (добавить позже)
                        };
                        people.push(person);
                    }
                }
            }
        }

        // Отправка прогресса
        let progress = ((index + 1) as f32 / video_ids.len() as f32 * 100.0) as i32;
        app_handle.emit_all("identification_progress", progress).map_err(|e| format!("Emit error: {}", e))?;
    }

    Ok(PersonIdentificationResult { people })
}
```

2. **Интеграция в `main.rs`**:
   Подключите команду.

```rust
use tauri::Builder;
mod script_generator;
mod montage_planner;
mod person_identification;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            script_generator::generate_script,
            montage_planner::analyze_videos,
            person_identification::identify_people
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Предотвращение зависаний
Чтобы анализ не блокировал UI:
- **Асинхронность**: Используйте `tokio::task::spawn_blocking` для YOLOv11 и `ffmpeg-rs`.
  ```rust
  use tokio::task::spawn_blocking;

  #[command]
  pub async fn identify_people(app_handle: tauri::AppHandle, video_ids: Vec<String>) -> Result<PersonIdentificationResult, String> {
      spawn_blocking(move || {
          // Код анализа
      }).await.map_err(|e| format!("Task error: {}", e))?;
  }
  ```
- **Прогресс**: Отправляйте обновления через `app_handle.emit_all` и отображайте в UI (`progress` в XState).
- **Кэширование**: Сохраняйте данные о людях в SQLite (`resources/`) с полями: `id`, `name`, `thumbnail_path`, `timestamps`, `subtitle_ids`.

### Интеграция с другими модулями
- **С `timeline/`**: Данные о людях (`Person`) используются для фильтрации фрагментов.
- **С `subtitles/`**: `subtitle_ids` связывает людей с субтитрами для фильтрации по спикерам.
- **С `montage-planner/`**: `Person` включается в `Fragment.people` для учета инструкций.
- **С `script-generator/`**: Имена людей используются в сценариях (например, "сцена с Джоном").
- **С `media/`**: Скриншоты генерируются через `ffmpeg-rs`.

### Ответ на ваш запрос
Модуль **`person-identification/`** — следующий логичный шаг, так как он обеспечивает распознавание и именование людей, что необходимо для инструкций вроде "чаще добавляй Джона" в `script-generator/` и `montage-planner/`. Я предложил:
- **Структуры данных**: `Person` для хранения данных о людях с таймкодами и скриншотами.
- **Фронтенд**: XState-машина, провайдер, хук и UI для отображения лиц и ввода имен.
- **Бэкенд**: Tauri-команда для анализа скриншотов с YOLOv11 и сохранения данных в SQLite.
- **Интеграция**: Связь с `subtitles/`, `timeline/`, `montage-planner/` и `script-generator/`.

**Следующий шаг после этого**: Реализовать `scene-analyzer/` для углубленного анализа сцен (объединение данных YOLOv11, `ffmpeg-rs` и субтитров), чтобы улучшить точность фрагментов в `montage-planner/`.

Если хотите, могу подготовить код для `scene-analyzer/` или доработать что-то в `person-identification/` (например, интеграцию с субтитрами). Напишите, что дальше! 🚀
