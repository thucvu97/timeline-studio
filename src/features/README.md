# Timeline Studio Features

## 📊 Общая готовность проекта: **78.2%**

Timeline Studio - профессиональный видеоредактор с современной архитектурой на базе React/Next.js для frontend и Rust/Tauri для backend.

## 🚀 Быстрый старт

### Структура features

```
feature-name/
├── components/     # React компоненты
├── hooks/         # Custom React hooks
├── services/      # Бизнес-логика и XState машины
├── types/         # TypeScript типы
├── utils/         # Вспомогательные функции
├── __tests__/     # Тесты
├── __mocks__/     # Моки для тестов
└── README.md      # Документация модуля
```

## 🎬 Основные модули

### ✅ Готовые модули (100%)

#### [`timeline`](timeline/README.md)
Центральный модуль видеоредактора с треками, клипами и секциями. Поддерживает drag & drop, масштабирование и синхронизацию с плеером.
- **Покрытие тестами**: 85.16% (components), 85.01% (hooks), 98.6% (utils)
- **Статус**: Готов к использованию

#### [`video-player`](video-player/README.md)
Кастомный видеоплеер с покадровой навигацией и управлением скоростью.
- **Покрытие тестами**: 92.66% (components), 96.34% (hooks), 96.78% (services)
- **Статус**: Полностью функционален

#### [`video-compiler`](video-compiler/README.md)
Система рендеринга через FFmpeg с GPU-ускорением (NVENC, QuickSync, VideoToolbox).
- **Покрытие тестами**: 97.54% (components), 87.65% (hooks), 85.47% (services)
- **Особенности**: Пререндеринг, кэширование, отслеживание прогресса

#### [`media-studio`](media-studio/README.md)
Главный интерфейс с 4 вариантами раскладки и настраиваемыми панелями.
- **Покрытие тестами**: 100% (components), 99.34% (layout), 50.2% (hooks)
- **Особенности**: Мульти-дисплей поддержка, автосохранение настроек

#### [`browser`](browser/README.md)
Браузер медиафайлов с табами, превью и фильтрацией.
- **Покрытие тестами**: 68.9% (components), 89.65% (services), 98.5% (utils)

#### [`media`](media/README.md)
Сервисы для работы с медиафайлами, метаданными и превью.
- **Покрытие тестами**: 90.24% (components), 87.44% (hooks), 85.78% (services)

#### [`app-state`](app-state/README.md)
Глобальное управление состоянием через XState машины.
- **Покрытие тестами**: 100% (hooks), 97% (components), 85.46% (services)

#### [`project-settings`](project-settings/README.md)
Настройки проекта (разрешение, FPS, аудио).
- **Покрытие тестами**: 68.56% (components), 80% (hooks), 100% (services)

#### [`user-settings`](user-settings/README.md)
Пользовательские настройки и персонализация.
- **Покрытие тестами**: 92.85% (components), 100% (hooks), 83.33% (services)

#### [`modals`](modals/README.md)
Система модальных окон с поддержкой стека.
- **Покрытие тестами**: 92.7% (components), 100% (services)

#### [`recognition`](recognition/README.md)
Интеграция с YOLO для распознавания объектов.
- **Покрытие тестами**: 90.59% (services)

#### [`fairlight-audio`](fairlight-audio/README.md)
Профессиональный аудио микшер с AI шумоподавлением.
- **Покрытие тестами**: 84.74% (hooks), 77.87% (mixer) ⚠️ Низкое: 3.19% (meters), 2.83% (waveform)
- **Особенности**: MIDI, Surround 5.1/7.1, LUFS метры, AudioWorklet API

#### [`color-grading`](color-grading/README.md)
Профессиональная цветокоррекция уровня DaVinci Resolve.
- **Покрытие тестами**: 100% (components), 98.26% (curves), 79.5% (hooks) ⚠️ Низкое: 35.71% (services)
- **Особенности**: Color Wheels, RGB Curves, LUT, Scopes

#### [`drag-drop`](drag-drop/README.md)
Система drag & drop для всего приложения.
- **Покрытие тестами**: 59.52% (hooks) ⚠️ Низкое: 26.78% (services)

#### [`export`](export/README.md)
Полностью готовый модуль экспорта с поддержкой социальных сетей.
- **Покрытие тестами**: 100% (constants), 86.74% (hooks), 73.9% (services), 70.52% (components)
- **Особенности**: OAuth интеграция, пресеты устройств, batch экспорт

#### [`ai-chat`](ai-chat/README.md)
AI ассистент на базе Claude/OpenAI с полной интеграцией.
- **Покрытие тестами**: 97.58% (hooks), 96.61% (utils), 86.54% (components), 82.99% (services)
- **Особенности**: 82 инструмента AI, Timeline контекст, потоковые ответы

### 🚧 В разработке (50-90%)

#### [`effects`](effects/README.md) - 80%
CSS-based видеоэффекты с предпросмотром в реальном времени.
- **Покрытие тестами**: 84.61%
- **TODO**: GPU ускорение через WebGL

#### [`filters`](filters/README.md) - 80%
Фильтры изображения (яркость, контраст, цветокоррекция).
- **Покрытие тестами**: 81.48%
- **TODO**: Пользовательские LUT

#### [`transitions`](transitions/README.md) - 75%
30+ типов переходов между клипами.
- **Покрытие тестами**: 75.43%
- **TODO**: 3D переходы

#### [`subtitles`](subtitles/README.md) - 75%
12 профессиональных стилей субтитров с анимациями.
- **Покрытие тестами**: 8.41% ❗
- **TODO**: Импорт/экспорт SRT/VTT

#### [`templates`](templates/README.md) - 70%
Многокамерные шаблоны для split-screen.
- **Покрытие тестами**: 9.63% ❗
- **TODO**: Анимированные шаблоны

#### [`style-templates`](style-templates/README.md) - 85%
Анимированные intro/outro и титры.
- **Покрытие тестами**: 65.51%

#### [`camera-capture`](camera-capture/README.md) - 75%
Захват видео с веб-камеры.
- **Покрытие тестами**: 70.0%

#### [`music`](music/README.md) - 60%
Управление музыкальными треками.
- **Покрытие тестами**: 55.0%

### 🚧 В разработке (50-90%)

#### [`keyboard-shortcuts`](keyboard-shortcuts/README.md) - 75%
Система горячих клавиш с предустановками.
- **Покрытие тестами**: 80%
- **TODO**: Персистентность, разрешение конфликтов

#### [`resources`](resources/README.md) - 80%
Управление ресурсами проекта с UI панелью.
- **Покрытие тестами**: 66.7%
- **TODO**: Drag & drop функциональность

### 📝 Планируемые модули (0-40%)

#### [`voice-recording`](voice-recording/README.md) - 35%
Запись голоса для озвучки.

### 🔮 Новые модули (0%)

- [`scene-analyzer`](scene-analyzer/README.md) - Анализ сцен
- [`person-identification`](person-identification/README.md) - Идентификация людей
- [`script-generator`](script-generator/README.md) - AI генерация сценариев
- [`montage-planner`](montage-planner/README.md) - Планировщик монтажа

## 🧪 Тестирование

### Общая статистика
- **Всего тестов**: 9000+
- **Успешно**: 99.5%
- **Frontend покрытие**: >80% для большинства модулей
- **Backend покрытие**: >80%

### Отличное покрытие (>90%)
- **export**: 98%
- **ai-chat**: 95%
- **color-grading**: 90%
- **modals**: 88.88%
- **browser**: 85.71%
- **fairlight-audio**: 85%
- **effects**: 84.61%

## 🛠 Технический стек

### Frontend
- React 19 + Next.js 15
- TypeScript (strict mode)
- XState v5 для управления состоянием
- Tailwind CSS v4
- shadcn/ui компоненты

### Backend (Tauri)
- Rust
- FFmpeg через ffmpeg-rs
- ONNX Runtime для ML моделей
- SQLite для кэширования

### Интеграции
- Claude API для AI функций
- YOLOv11 для распознавания
- WebGL для GPU эффектов

## 📋 Стандарты разработки

1. **Структура кода**
   - TypeScript strict mode обязателен
   - Следуйте существующим паттернам
   - Предпочитайте named exports

2. **Компоненты**
   - Используйте shadcn/ui компоненты
   - kebab-case для имен файлов
   - PascalCase для имен компонентов

3. **State Management**
   - Простое состояние: useState/useReducer
   - Сложное состояние: XState машины
   - Глобальное состояние: Context + custom hooks

4. **Тестирование**
   - Минимум 70% покрытия для новых модулей
   - Используйте custom render из test-utils
   - Тестируйте XState машины через actor model

## 🔗 Полезные ссылки

- [Подробный план разработки](DEV.md)
- [Список всех модулей с описаниями](DEV-README.md)
- [Дорожная карта проекта](docs-ru/ROADMAP.md)

---

*Последнее обновление: 30 декабря 2024*