# Test Utilities

Специализированные утилиты для тестирования различных компонентов Timeline Studio, включая расширенную поддержку тестирования аудио функциональности в Tauri приложении.

## Основные возможности

### 🎵 Мокирование аудио данных

- Создание реалистичных MP3 данных для тестирования
- Мокирование Tauri API для чтения файлов
- Поддержка различных форматов аудио

### 🔊 Web Audio API моки

- Полная имитация AudioContext
- Мокирование MediaRecorder
- Поддержка аудио визуализации

### 🎮 Симуляция аудио событий

- Загрузка, воспроизведение, пауза
- Обработка ошибок
- Управление временем воспроизведения

## Использование

### Базовая настройка

```typescript
import { setupAudioTestEnvironment } from "@/test/utils/tauri-audio-test-utils";

describe("AudioComponent", () => {
  let testEnv: ReturnType<typeof setupAudioTestEnvironment>;

  beforeEach(() => {
    testEnv = setupAudioTestEnvironment();
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  // Ваши тесты здесь
});
```

### Создание тестовых данных

```typescript
import {
  createMockAudioFile,
  createMockAudioData,
} from "@/test/utils/tauri-audio-test-utils";

// Создание мок аудио файла
const audioFile = createMockAudioFile({
  name: "test-song.mp3",
  path: "/music/test-song.mp3",
  duration: 180,
});

// Создание мок аудио данных
const audioData = createMockAudioData(1024);
```

### Симуляция аудио событий

```typescript
import {
  simulateAudioLoad,
  simulateAudioPlay,
  simulateAudioPause,
  simulateAudioEnd,
  simulateAudioError,
} from "@/test/utils/tauri-audio-test-utils";

// Симуляция загрузки
await simulateAudioLoad(audioElement);

// Симуляция воспроизведения
await simulateAudioPlay(audioElement);

// Симуляция паузы
await simulateAudioPause(audioElement);

// Симуляция окончания
await simulateAudioEnd(audioElement);

// Симуляция ошибки
await simulateAudioError(audioElement, 4); // MEDIA_ELEMENT_ERROR
```

## API Reference

### setupAudioTestEnvironment()

Создает полную среду для тестирования аудио компонентов.

**Возвращает:**

```typescript
{
  webAudio: {
    AudioContext: MockedFunction,
    MediaRecorder: MockedFunction,
  },
  tauri: {
    readFile: MockedFunction,
    convertFileSrc: MockedFunction,
  },
  url: {
    createObjectURL: MockedFunction,
    revokeObjectURL: MockedFunction,
  },
  cleanup: () => void,
}
```

### createMockAudioFile(options?)

Создает мок объект аудио файла.

**Параметры:**

- `name?: string` - Имя файла (по умолчанию: "test-audio.mp3")
- `path?: string` - Путь к файлу (по умолчанию: "/path/to/test-audio.mp3")
- `duration?: number` - Длительность в секундах (по умолчанию: 180)
- `size?: number` - Размер файла в байтах (по умолчанию: 3MB)

### createMockAudioData(size?)

Создает реалистичные аудио данные в формате Uint8Array.

**Параметры:**

- `size?: number` - Размер данных в байтах (по умолчанию: 1024)

### createAudioElementMock()

Создает мок для HTMLAudioElement с полным набором методов и свойств.

### waitForAudioContextInit(delay?)

Ждет инициализации аудио контекста (имитирует setTimeout в компоненте).

**Параметры:**

- `delay?: number` - Задержка в миллисекундах (по умолчанию: 150)

## Примеры тестов

### Тестирование загрузки аудио

```typescript
it("should load audio file and create blob URL", async () => {
  render(<AudioPreview file={audioFile} />);

  await waitFor(() => {
    expect(testEnv.url.createObjectURL).toHaveBeenCalled();
  });

  const audioElement = document.querySelector("audio");
  expect(audioElement).not.toBeNull();
});
```

### Тестирование воспроизведения

```typescript
it("should play audio on click", async () => {
  const { container } = render(<AudioPreview file={audioFile} />);

  const audioElement = container.querySelector("audio") as HTMLAudioElement;
  const mockAudio = createAudioElementMock();

  audioElement.play = mockAudio.play;

  const containerDiv = container.firstChild as HTMLElement;
  fireEvent.click(containerDiv);

  expect(mockAudio.play).toHaveBeenCalled();
});
```

### Тестирование обработки ошибок

```typescript
it("should handle audio loading error", async () => {
  testEnv.tauri.readFile.mockRejectedValueOnce(new Error("File not found"));

  render(<AudioPreview file={audioFile} />);

  await waitFor(() => {
    expect(testEnv.tauri.convertFileSrc).toHaveBeenCalledWith(audioFile.path);
  });
});
```

## Интеграция с Context7

Утилиты совместимы с Context7 MCP и могут использоваться для тестирования компонентов, которые взаимодействуют с внешними API или сервисами.

### Мокирование внешних сервисов

```typescript
// Мокирование Context7 API
vi.mock("@context7/api", () => ({
  analyzeAudio: vi.fn().mockResolvedValue({
    duration: 180,
    format: "mp3",
    bitrate: 320,
  }),
}));
```

## Лучшие практики

1. **Всегда очищайте моки** после каждого теста с помощью `testEnv.cleanup()`
2. **Используйте waitFor** для асинхронных операций
3. **Мокайте только необходимые части** API для конкретного теста
4. **Тестируйте как успешные сценарии, так и ошибки**
5. **Проверяйте очистку ресурсов** при размонтировании компонентов

## Устранение неполадок

### Проблема: "AudioContext is not defined"

**Решение:** Убедитесь, что вы используете `setupAudioTestEnvironment()` в beforeEach

### Проблема: "MediaRecorder.isTypeSupported is not a function"

**Решение:** Моки в setup.ts уже включают этот метод

### Проблема: Тесты не ждут асинхронные операции

**Решение:** Используйте `waitFor` и `waitForAudioContextInit`

## Дополнительные утилиты

### Генераторы тестовых данных

```typescript
// Создание мок видео файла
export function createMockVideoFile(options?: {
  name?: string;
  path?: string;
  duration?: number;
  resolution?: { width: number; height: number };
}) {
  return {
    name: options?.name || 'test-video.mp4',
    path: options?.path || '/videos/test-video.mp4',
    duration: options?.duration || 120,
    resolution: options?.resolution || { width: 1920, height: 1080 },
    size: 10 * 1024 * 1024, // 10MB
    type: 'video/mp4'
  };
}

// Создание мок изображения
export function createMockImageFile(options?: {
  name?: string;
  path?: string;
  dimensions?: { width: number; height: number };
}) {
  return {
    name: options?.name || 'test-image.jpg',
    path: options?.path || '/images/test-image.jpg',
    dimensions: options?.dimensions || { width: 1920, height: 1080 },
    size: 2 * 1024 * 1024, // 2MB
    type: 'image/jpeg'
  };
}
```

### Утилиты для Timeline тестирования

```typescript
// Создание мок клипа
export function createMockClip(options?: Partial<TimelineClip>) {
  return {
    id: options?.id || `clip-${Math.random()}`,
    type: options?.type || 'video',
    start: options?.start || 0,
    end: options?.end || 5,
    duration: options?.duration || 5,
    sourceIn: options?.sourceIn || 0,
    sourceOut: options?.sourceOut || 5,
    mediaId: options?.mediaId || 'media-1',
    trackId: options?.trackId || 'video-1'
  };
}

// Создание мок трека
export function createMockTrack(options?: Partial<TimelineTrack>) {
  return {
    id: options?.id || `track-${Math.random()}`,
    type: options?.type || 'video',
    name: options?.name || 'Video Track 1',
    clips: options?.clips || [],
    muted: options?.muted || false,
    locked: options?.locked || false,
    height: options?.height || 60
  };
}
```

### Асинхронные хелперы

```typescript
// Ожидание загрузки медиа
export async function waitForMediaLoad(
  element: HTMLMediaElement,
  timeout = 5000
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Media load timeout'));
    }, timeout);

    element.addEventListener('loadeddata', () => {
      clearTimeout(timer);
      resolve(element);
    });

    element.addEventListener('error', () => {
      clearTimeout(timer);
      reject(new Error('Media load error'));
    });
  });
}

// Ожидание Tauri события
export async function waitForTauriEvent(
  eventName: string,
  timeout = 5000
) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Event ${eventName} timeout`));
    }, timeout);

    const unlisten = listen(eventName, (event) => {
      clearTimeout(timer);
      unlisten();
      resolve(event);
    });
  });
}
```

### Интеграционные тест-хелперы

```typescript
// Настройка полного тестового окружения
export function setupIntegrationTest() {
  const audioEnv = setupAudioTestEnvironment();
  const tauriMocks = setupTauriMocks();
  const browserMocks = setupBrowserMocks();

  return {
    ...audioEnv,
    tauri: tauriMocks,
    browser: browserMocks,
    cleanup: () => {
      audioEnv.cleanup();
      resetTauriMocks();
      resetBrowserMocks();
    }
  };
}
```

## Структура утилит

```
src/test/utils/
├── audio/                # Аудио-специфичные утилиты
│   ├── mock-data.ts      # Генераторы аудио данных
│   ├── mock-elements.ts  # Моки HTML аудио элементов
│   └── events.ts         # Симуляция аудио событий
├── media/                # Медиа утилиты
│   ├── video.ts          # Видео утилиты
│   └── image.ts          # Изображение утилиты
├── timeline/             # Timeline утилиты
│   ├── clips.ts          # Утилиты для клипов
│   └── tracks.ts         # Утилиты для треков
├── async/                # Асинхронные хелперы
│   └── wait.ts           # Функции ожидания
└── README.md             # Эта документация
```

## Связь с основной тестовой инфраструктурой

Эти утилиты работают совместно с:

- **`/src/test/setup.ts`** - Глобальная конфигурация тестов
- **`/src/test/test-utils.tsx`** - Основные утилиты рендеринга
- **`/src/test/mocks/`** - Централизованная система моков

### Использование с test-utils
```typescript
import { render } from '@/test/test-utils';
import { createMockAudioFile, setupAudioTestEnvironment } from '@/test/utils';

test('audio component with custom utils', () => {
  const audioEnv = setupAudioTestEnvironment();
  const audioFile = createMockAudioFile();
  
  render(<AudioPlayer file={audioFile} />);
  
  // Тест логика
  
  audioEnv.cleanup();
});
```

## Совместимость

- ✅ Vitest
- ✅ React Testing Library
- ✅ Tauri v2
- ✅ Web Audio API
- ✅ Context7 MCP
- ✅ TypeScript
- ✅ XState v5
- ✅ Next.js 15
