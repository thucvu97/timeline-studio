# Camera Capture Module

Модуль для захвата видео с камеры с поддержкой выбора устройств, настройки качества и записи.

## 🎥 Возможности

### ✅ Реализовано
- **Выбор устройств** - Выбор камеры и микрофона из доступных
- **Разрешения** - Запрос и управление разрешениями на доступ к камере/микрофону
- **Настройки качества** - Выбор разрешения и FPS с учетом возможностей устройства
- **Запись видео** - Запись в формате WebM с превью в реальном времени
- **Запись экрана** - Захват экрана, окна или вкладки браузера
- **UI/UX** - Полноценный интерфейс с превью и настройками
- **Локализация** - Поддержка 15 языков

### ⏳ В разработке
- **Сохранение записи** - Интеграция с медиатекой приложения
- **Фильтры и эффекты** - Применение эффектов в реальном времени
- **Расширенные настройки** - Битрейт, кодеки, форматы

## 📁 Структура модуля

```
camera-capture/
├── components/
│   ├── camera-capture-modal.tsx    # Главное модальное окно
│   ├── camera-preview.tsx          # Компонент превью видео
│   ├── camera-settings.tsx         # Панель настроек
│   ├── recording-controls.tsx      # Кнопки управления записью
│   └── camera-permission-request.tsx # Запрос разрешений
├── hooks/
│   ├── use-camera-stream.ts        # Управление видеопотоком
│   ├── use-devices.ts              # Работа с устройствами
│   ├── use-recording.ts            # Логика записи
│   ├── use-screen-capture.ts       # Запись экрана
│   └── camera-capture-hooks.ts     # Дополнительные хуки
├── __tests__/                      # Тесты
└── index.ts                        # Экспорт
```

## 🔧 Использование

### Основной компонент

```tsx
import { CameraCaptureModal } from '@/features/camera-capture'

function App() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <CameraCaptureModal 
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
    />
  )
}
```

### Хуки

#### useDevices - Управление устройствами
```tsx
const {
  videoDevices,      // Список камер
  audioDevices,      // Список микрофонов
  selectedVideoId,   // ID выбранной камеры
  selectedAudioId,   // ID выбранного микрофона
  setSelectedVideoId,
  setSelectedAudioId,
  refreshDevices     // Обновить список устройств
} = useDevices()
```

#### useCameraStream - Управление видеопотоком
```tsx
const {
  stream,           // MediaStream
  isLoading,        // Загрузка потока
  error,            // Ошибка
  startStream,      // Запустить поток
  stopStream        // Остановить поток
} = useCameraStream({ 
  videoDeviceId, 
  audioDeviceId,
  constraints       // MediaStreamConstraints
})
```

#### useRecording - Запись видео
```tsx
const {
  isRecording,      // Идет запись
  isPaused,         // Пауза
  recordingTime,    // Время записи в секундах
  startRecording,   // Начать запись
  stopRecording,    // Остановить и получить Blob
  pauseRecording,   // Пауза
  resumeRecording   // Продолжить
} = useRecording(mediaStream)
```

#### useScreenCapture - Запись экрана
```tsx
const {
  screenStream,       // MediaStream экрана
  isScreenSharing,    // Идет запись экрана
  error,              // Ошибка
  startScreenCapture, // Начать запись экрана
  stopScreenCapture,  // Остановить запись
  getSourceInfo       // Получить информацию об источнике
} = useScreenCapture()
```

## 🎨 Компоненты

### CameraPreview
Отображает видеопоток с камеры
```tsx
<CameraPreview 
  stream={mediaStream}
  isRecording={true}
  recordingTime={45}
/>
```

### CameraSettings
Панель настроек камеры
```tsx
<CameraSettings
  videoDevices={devices}
  audioDevices={audioDevices}
  selectedVideoId={videoId}
  selectedAudioId={audioId}
  onVideoChange={setVideoId}
  onAudioChange={setAudioId}
  capabilities={capabilities}
/>
```

### RecordingControls
Кнопки управления записью
```tsx
<RecordingControls
  isRecording={isRecording}
  isPaused={isPaused}
  canStart={!!stream}
  onStart={startRecording}
  onStop={stopRecording}
  onPause={pauseRecording}
  onResume={resumeRecording}
/>
```

## 🔌 Интеграция

Модуль интегрирован в TopBar через кнопку с иконкой камеры:
```tsx
// src/features/top-bar/components/top-bar.tsx
<Button onClick={() => setIsCameraCaptureOpen(true)}>
  <Camera className="h-4 w-4" />
</Button>
```

## 🌐 Локализация

Все тексты локализованы через i18n:
```json
{
  "cameraCapture": {
    "title": "Запись с камеры",
    "selectCamera": "Выберите камеру",
    "selectMicrophone": "Выберите микрофон",
    "startRecording": "Начать запись",
    "stopRecording": "Остановить",
    ...
  }
}
```

## 🧪 Тестирование

### Покрытие тестами
- **Компоненты**: 95.39% покрытие
- **Хуки**: 72.9% покрытие
- **Общее количество тестов**: 68 тестов
- **Время выполнения**: ~1.4 секунд

```bash
# Запустить тесты модуля
bun test src/features/camera-capture

# С покрытием
bun test:coverage src/features/camera-capture
```

## 📝 Примечания

- Запись происходит в формате WebM (VP8/VP9)
- Поддерживаются только современные браузеры с MediaRecorder API
- Для работы требуется HTTPS или localhost
- Разрешения запрашиваются при первом использовании