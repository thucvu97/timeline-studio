# Color Grading System - Профессиональная цветокоррекция

## 📋 Обзор

Color Grading System - это профессиональный модуль цветокоррекции для Timeline Studio, обеспечивающий возможности уровня DaVinci Resolve. Система предоставляет полный контроль над цветом, контрастом и стилизацией видео с использованием индустриальных стандартов и инструментов.

## 🎯 Цели и задачи

### Основные цели:
1. **Профессиональная цветокоррекция** - полный набор инструментов для работы с цветом
2. **Реальное время** - мгновенный preview всех изменений
3. **Совместимость** - поддержка LUT, HDR, широкого цветового охвата
4. **Эффективность** - GPU ускорение для 4K/8K контента

### Ключевые возможности:
- Первичная и вторичная цветокоррекция
- Работа с масками и выделениями
- Профессиональные scopes
- Узловая система обработки
- Поддержка HDR и широкого цветового охвата

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/color-grading/
├── components/
│   ├── color-wheels/          # Цветовые колеса Lift/Gamma/Gain
│   ├── curves/                # RGB и тональные кривые
│   ├── scopes/                # Waveform, Vectorscope, Histogram
│   ├── masks/                 # Power windows и маски
│   ├── nodes/                 # Узловой редактор
│   └── panels/                # UI панели
├── hooks/
│   ├── use-color-grading.ts   # Основной хук
│   ├── use-scopes.ts          # Анализ изображения
│   └── use-lut.ts             # Работа с LUT
├── services/
│   ├── color-engine.ts        # Движок цветокоррекции
│   ├── gpu-processor.ts       # GPU обработка
│   └── color-space.ts         # Конверсия цветовых пространств
├── shaders/                   # WebGL шейдеры
└── types/                     # TypeScript типы
```

### Backend структура (Rust):
```
src-tauri/src/color_grading/
├── mod.rs                     # Главный модуль
├── color_processor.rs         # Обработка цвета
├── lut_manager.rs            # Управление LUT файлами
├── hdr_processor.rs          # HDR обработка
├── gpu_acceleration.rs       # GPU ускорение через wgpu
└── commands.rs               # Tauri команды
```

## 📐 Функциональные требования

### 1. Первичная цветокоррекция

#### Цветовые колеса (Color Wheels):
- **Lift** - тени
- **Gamma** - средние тона  
- **Gain** - света
- **Offset** - общий сдвиг

#### Параметры:
- **Temperature** - цветовая температура
- **Tint** - оттенок
- **Contrast** - контраст
- **Pivot** - точка контраста
- **Saturation** - насыщенность
- **Hue** - сдвиг оттенка
- **Luminance** - яркость

### 2. Кривые (Curves)

#### Типы кривых:
- **Master** - общая тональная кривая
- **RGB** - раздельные каналы R, G, B
- **Hue vs Hue** - изменение оттенка
- **Hue vs Saturation** - насыщенность по оттенку
- **Hue vs Luminance** - яркость по оттенку
- **Luminance vs Saturation** - насыщенность по яркости
- **Saturation vs Saturation** - усиление насыщенности

#### Функции:
- Безье интерполяция
- Множественные контрольные точки
- Сохранение пресетов кривых
- Копирование между клипами

### 3. Вторичная цветокоррекция

#### Инструменты выделения:
- **HSL Qualifier** - выделение по цвету
- **Power Windows** - геометрические маски
- **Magic Mask** - AI выделение объектов
- **Tracking** - отслеживание масок

#### Параметры масок:
- Feather - растушевка
- Opacity - прозрачность
- Invert - инверсия
- Combine - комбинирование масок

### 4. Профессиональные Scopes

#### Waveform:
- RGB parade
- YUV parade
- Luminance only
- Векторная/растровая отрисовка

#### Vectorscope:
- Стандартный
- Skin tone indicator
- Цветовые targets

#### Histogram:
- RGB раздельно
- Luminance
- Логарифмическая шкала

#### Parade:
- RGB channels
- YUV channels

### 5. Узловая система (Node-based)

#### Типы узлов:
- **Serial** - последовательная обработка
- **Parallel** - параллельные ветки
- **Layer** - наложение с режимами
- **Splitter/Combiner** - разделение/объединение

#### Возможности:
- Drag & drop интерфейс
- Копирование узлов
- Группировка
- Пресеты узловых деревьев

### 6. LUT поддержка

#### Форматы:
- .cube (стандарт)
- .3dl
- .mga
- .m3d

#### Функции:
- Импорт/экспорт LUT
- Preview LUT
- Создание собственных LUT
- LUT browser с превью

### 7. HDR и цветовые пространства

#### Поддержка:
- **SDR** - Rec.709
- **HDR10** - Rec.2020, PQ
- **HDR10+** - динамические метаданные
- **Dolby Vision** - профили 5, 8.1
- **HLG** - Hybrid Log-Gamma

#### Цветовые пространства:
- sRGB
- Rec.709
- Rec.2020
- DCI-P3
- ACES
- ProPhoto RGB

### 8. Интеграция с Timeline

#### Применение:
- К отдельным клипам
- К целым трекам
- К группам клипов
- Adjustment layers

#### Workflow:
- Копирование настроек
- Сохранение пресетов
- A/B сравнение
- Версии коррекции

## 🎨 UI/UX дизайн

### Макет интерфейса:
```
┌─────────────────────────────────────────────────────┐
│  Color Wheels    │    Curves       │    Scopes      │
├──────────────────┼─────────────────┼────────────────┤
│ ◯ Lift          │  ╱╱╱╱╱         │ ████████████   │
│ ◯ Gamma         │ ╱    ╱         │ ████████████   │
│ ◯ Gain          │╱____╱          │ ████████████   │
├──────────────────┴─────────────────┴────────────────┤
│                   Video Preview                      │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Nodes Editor                    │ Inspector        │
│  [Input]→[Node1]→[Node2]→[Out]  │ Properties...    │
└──────────────────────────────────────────────────────┘
```

### Принципы дизайна:
1. **Темная тема** - для точной оценки цвета
2. **Настраиваемый layout** - панели можно перемещать
3. **Полноэкранный режим** - для детальной работы
4. **Горячие клавиши** - быстрый доступ к функциям

## 🔧 Технические детали

### GPU обработка:

#### WebGL шейдеры:
```glsl
// Пример шейдера для цветовых колес
uniform vec3 lift;
uniform vec3 gamma;
uniform vec3 gain;

vec3 colorGrade(vec3 color) {
    // Lift (shadows)
    color = color * (1.0 - lift) + lift;
    
    // Gamma (midtones)
    color = pow(color, vec3(1.0) / (gamma + vec3(1.0)));
    
    // Gain (highlights)
    color = color * (gain + vec3(1.0));
    
    return clamp(color, 0.0, 1.0);
}
```

#### Оптимизации:
- Кэширование промежуточных результатов
- Многопоточная обработка
- SIMD инструкции
- GPU compute shaders

### Интеграция с Video Compiler:

```rust
// Применение цветокоррекции при рендеринге
pub struct ColorGradingFilter {
    lift: [f32; 3],
    gamma: [f32; 3],
    gain: [f32; 3],
    lut: Option<Lut3D>,
}

impl ColorGradingFilter {
    pub fn apply_to_frame(&self, frame: &mut VideoFrame) {
        // GPU обработка через wgpu
        self.gpu_process(frame);
    }
}
```

## 📊 План реализации

### Фаза 1: Базовая функциональность (2 недели)
- [ ] Цветовые колеса Lift/Gamma/Gain
- [ ] Базовые параметры (contrast, saturation)
- [ ] Simple RGB curves
- [ ] Waveform scope

### Фаза 2: Расширенные инструменты (3 недели)
- [ ] Все типы кривых
- [ ] HSL qualifier
- [ ] Power windows
- [ ] Все виды scopes

### Фаза 3: Профессиональные функции (3 недели)
- [ ] Узловая система
- [ ] LUT поддержка
- [ ] HDR обработка
- [ ] AI маски

### Фаза 4: Оптимизация и интеграция (2 недели)
- [ ] GPU ускорение
- [ ] Интеграция с timeline
- [ ] Пресеты и templates
- [ ] Тестирование производительности

## 🎯 Метрики успеха

### Производительность:
- Real-time preview для 4K при 30fps
- <100ms применение LUT
- <50ms обновление scopes

### Качество:
- 32-bit float обработка
- Без видимых артефактов
- Точное соответствие эталонным LUT

### Удобство:
- <5 минут на базовую коррекцию
- Интуитивный интерфейс
- Совместимость с DaVinci горячими клавишами

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - применение к клипам
- **Effects** - комбинирование с эффектами
- **Export** - цветовые профили при экспорте
- **AI** - автоматическая коррекция

### API для плагинов:
```typescript
interface ColorGradingAPI {
    applyLUT(lutPath: string): void;
    getScopes(): ScopesData;
    setColorWheels(lift: RGB, gamma: RGB, gain: RGB): void;
    createNode(type: NodeType): ColorNode;
}
```

## 📚 Справочные материалы

- [DaVinci Resolve Color Manual](https://www.blackmagicdesign.com/products/davinciresolve)
- [Color Grading Central](https://www.colorgradingcentral.com/)
- [Lift Gamma Gain](https://liftgammagain.com/)
- [ACES Workflow](https://acescentral.com/)

---

*Документ будет обновляться по мере разработки модуля*