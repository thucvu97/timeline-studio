# Camera Capture - Руководство разработчика

## 📊 Текущий статус: 75% готовности

### ✅ Что сделано
- Полная архитектура модуля
- Выбор устройств (камера/микрофон)
- Управление разрешениями
- Настройки качества видео
- Запись и превью
- UI/UX и локализация

### ❌ Что нужно доделать
1. **Сохранение записи** (критично!)
   - Раскомментировать `handleVideoRecorded` в `camera-capture-modal.tsx`
   - Интегрировать с `useMediaImport` для добавления в медиатеку
   - Добавить прогресс загрузки файла

2. **Фильтры и эффекты**
   - Интеграция с модулем effects
   - Применение в реальном времени через Canvas API
   - UI для выбора эффектов

3. **Расширенные настройки**
   - Выбор битрейта видео/аудио
   - Поддержка других форматов (MP4, MOV)
   - Выбор кодеков

## 🏗️ Архитектура

### Поток данных
```
User → CameraCaptureModal → useCameraStream → MediaStream
                         ↓
                    useRecording → MediaRecorder → Blob
                         ↓
                  handleVideoRecorded → importMedia → Timeline
```

### Ключевые компоненты

#### CameraCaptureModal
Главный компонент-контейнер. Управляет состоянием и координирует работу дочерних компонентов.

```tsx
// Основные состояния
const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string>()
const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>()
const [stream, setStream] = useState<MediaStream | null>(null)
```

#### useCameraStream
Хук для управления MediaStream. Обрабатывает разрешения и ограничения.

```tsx
// Ключевая логика
const startStream = async () => {
  // 1. Проверка разрешений
  // 2. Создание constraints на основе capabilities
  // 3. Запрос getUserMedia
  // 4. Обработка ошибок и fallback
}
```

#### useRecording
Хук для записи видео через MediaRecorder API.

```tsx
// Поддерживаемые форматы
const mimeTypes = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm'
]
```

## 🐛 Известные проблемы

1. **Сохранение не работает**
   ```tsx
   // В camera-capture-modal.tsx строка ~80
   const handleVideoRecorded = async (blob: Blob) => {
     // TODO: Эта функция закомментирована!
     // Нужно раскомментировать и доработать
   }
   ```

2. **Нет обработки больших файлов**
   - Длинные записи могут вызвать проблемы с памятью
   - Нужно добавить streaming upload

3. **Ограниченная поддержка форматов**
   - Только WebM
   - На Safari могут быть проблемы

## 🔧 Как доработать

### 1. Исправить сохранение записи

```tsx
// camera-capture-modal.tsx
const handleVideoRecorded = async (blob: Blob) => {
  try {
    setIsSaving(true)
    
    // Создаем File из Blob
    const fileName = `camera-recording-${Date.now()}.webm`
    const file = new File([blob], fileName, { 
      type: blob.type || 'video/webm' 
    })
    
    // Импортируем в медиатеку
    const importedFiles = await importMedia([file])
    
    if (importedFiles.length > 0) {
      toast.success(t('cameraCapture.recordingSaved'))
      onClose() // Закрываем модальное окно
    }
  } catch (error) {
    console.error('Failed to save recording:', error)
    toast.error(t('cameraCapture.saveFailed'))
  } finally {
    setIsSaving(false)
  }
}
```

### 2. Добавить поддержку эффектов

```tsx
// Новый хук use-camera-effects.ts
export function useCameraEffects(stream: MediaStream) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedEffect, setSelectedEffect] = useState<string>()
  
  useEffect(() => {
    if (!stream || !canvasRef.current) return
    
    const video = document.createElement('video')
    video.srcObject = stream
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const drawFrame = () => {
      ctx.drawImage(video, 0, 0)
      
      // Применяем эффект
      if (selectedEffect) {
        applyEffect(ctx, selectedEffect)
      }
      
      requestAnimationFrame(drawFrame)
    }
    
    video.play()
    drawFrame()
  }, [stream, selectedEffect])
  
  return { canvasRef, selectedEffect, setSelectedEffect }
}
```

### 3. Расширить настройки

```tsx
// Добавить в CameraSettings
<Select value={bitrate} onValueChange={setBitrate}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1000000">1 Mbps</SelectItem>
    <SelectItem value="2500000">2.5 Mbps</SelectItem>
    <SelectItem value="5000000">5 Mbps</SelectItem>
    <SelectItem value="10000000">10 Mbps</SelectItem>
  </SelectContent>
</Select>
```

## 📝 Чеклист для завершения модуля

- [ ] Раскомментировать и доработать `handleVideoRecorded`
- [ ] Добавить состояние `isSaving` и индикатор загрузки
- [ ] Протестировать сохранение на разных размерах файлов
- [ ] Добавить поддержку MP4 (через Tauri FFmpeg)
- [ ] Реализовать базовые эффекты (яркость, контраст)
- [ ] Добавить настройки битрейта
- [ ] Обновить тесты для новой функциональности
- [ ] Добавить e2e тест для полного флоу записи

## 🧪 Тестирование

### Unit тесты
```bash
# Запустить существующие тесты
bun test src/features/camera-capture

# Тесты для новой функциональности
bun test src/features/camera-capture/use-camera-effects.test.ts
```

### Ручное тестирование
1. Открыть модальное окно камеры
2. Выбрать камеру и микрофон
3. Начать запись
4. Остановить запись
5. **Проверить, что видео сохранилось в медиатеку** ← не работает!

## 💡 Советы

1. **MediaRecorder API** имеет ограничения:
   - Не все браузеры поддерживают паузу
   - Форматы зависят от браузера
   - На мобильных устройствах могут быть проблемы

2. **Производительность**:
   - Для эффектов используйте OffscreenCanvas если возможно
   - Ограничивайте разрешение на слабых устройствах
   - Используйте Web Workers для обработки

3. **UX улучшения**:
   - Добавить обратный отсчет 3-2-1 перед записью
   - Показывать уровень звука в реальном времени
   - Добавить возможность делать фото

## 🔗 Связанные модули

- `media` - для импорта записанных видео
- `effects` - для применения эффектов
- `timeline` - куда добавляются записи
- `top-bar` - откуда вызывается модуль