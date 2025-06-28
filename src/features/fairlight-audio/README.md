# Fairlight Audio Module

Профессиональный модуль для работы с аудио в Timeline Studio, предоставляющий полноценный микшерный пульт, обработку эффектов и интеграцию с таймлайном.

## Архитектура

### Компоненты

#### Mixer Components (`/components/mixer/`)
- **MixerConsole** - Основной интерфейс микшера с канальными полосами
- **ChannelStrip** - Канальная полоса с контролами громкости, панорамы, solo/mute
- **Fader** - Вертикальный фейдер с dB шкалой и точным управлением
- **MasterSection** - Мастер секция с лимитером и общей громкостью

#### Waveform Components (`/components/waveform/`)
- **SimpleWaveform** - Визуализация формы волны аудио файла с анализом через Web Audio API

#### Effects Components (`/components/effects/`)
- **Equalizer** - 7-полосный параметрический эквалайзер с визуализацией

### Сервисы

#### AudioEngine (`/services/audio-engine.ts`)
Основной движок обработки звука на базе Web Audio API:
- Управление каналами (создание, подключение, удаление)
- Обработка громкости, панорамы, solo/mute
- Мастер секция с лимитером
- Система эффектов с цепочкой обработки
- Анализаторы для визуализации

#### TimelineSyncService (`/services/timeline-sync-service.ts`)
Синхронизация между таймлайном и микшером:
- Конвертация треков таймлайна в каналы микшера
- Обновление параметров в обе стороны
- Сохранение изменений в проект

#### AudioFileManager (`/services/audio-file-manager.ts`)
Управление загрузкой и кэшированием аудио файлов:
- Загрузка локальных файлов через Tauri
- Кэширование загруженных файлов
- Создание AudioElement для воспроизведения

#### EqualizerProcessor (`/services/effects/equalizer-processor.ts`)
Процессор эквалайзера на базе BiquadFilter:
- 7 полос с настройкой частоты, усиления и добротности
- Поддержка разных типов фильтров (shelf, peaking)
- Анализ частотной характеристики

### Хуки

#### useAudioEngine
Управление жизненным циклом AudioEngine:
```typescript
const engine = useAudioEngine()
// Автоматически инициализируется и очищается
```

#### useMixerState
Управление состоянием микшера:
```typescript
const { channels, updateChannel, addChannel } = useMixerState()
```

#### useChannelAudio
Подключение аудио файла к каналу:
```typescript
useChannelAudio(engine, channelId, audioFile)
// Автоматически загружает и подключает аудио
```

## Использование

### Базовая интеграция в Timeline

```typescript
import { MixerConsole } from "@/features/fairlight-audio"

function AudioMixerView() {
  return <MixerConsole />
}
```

### Создание кастомного канала

```typescript
import { AudioEngine, ChannelStrip } from "@/features/fairlight-audio"

const engine = new AudioEngine()
const channel = engine.createChannel("custom-1")

// Подключение аудио элемента
const audio = new Audio("/path/to/file.mp3")
engine.connectMediaElement("custom-1", audio)

// Управление параметрами
engine.updateChannelVolume("custom-1", 75) // 75%
engine.updateChannelPan("custom-1", -50) // Лево
```

### Добавление эквалайзера

```typescript
import { EqualizerProcessor } from "@/features/fairlight-audio"

const eqBands = [
  { frequency: 60, gain: 0, q: 0.7, type: "highshelf" },
  { frequency: 150, gain: 0, q: 0.7, type: "peaking" },
  // ... остальные полосы
]

const eq = new EqualizerProcessor(audioContext, eqBands)
engine.addEffect(channelId, eq.getInputNode())
```

## Web Audio API архитектура

### Цепочка обработки канала
```
Source → GainNode → StereoPanner → Effects[] → Analyser → Master
```

### Мастер секция
```
Channels → MasterGain → Limiter → Destination
```

## Производительность

- **Sample Rate**: 48kHz для профессионального качества
- **Latency**: "interactive" режим для минимальной задержки
- **FFT Size**: 2048 для анализаторов (баланс между точностью и производительностью)

## Планы развития

### В процессе
- [x] Базовая структура микшера
- [x] Web Audio Engine
- [x] Синхронизация с таймлайном
- [x] Визуализация waveform
- [x] Эквалайзер (UI готов, интеграция в процессе)
- [ ] Интеграция эквалайзера в канальные полосы

### Запланировано
- [ ] Компрессор и другие динамические эффекты
- [ ] Reverb и delay эффекты
- [ ] Автоматизация параметров
- [ ] Bus routing и группы
- [ ] VST/AU поддержка через WebAssembly
- [ ] Surround panning
- [ ] MIDI интеграция

## Тестирование

Модуль включает моки для тестирования:
- Mock AudioContext для unit тестов
- Mock MediaElement для тестирования загрузки
- Утилиты для симуляции аудио событий

См. `/src/test/utils/README.md` для подробной документации по тестированию аудио компонентов.