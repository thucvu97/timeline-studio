# Advanced Timeline Features - Профессиональные функции монтажа

## 📋 Обзор

Advanced Timeline Features - это набор профессиональных инструментов редактирования для Timeline Studio, предоставляющий возможности точного и эффективного монтажа на уровне индустриальных стандартов. Модуль включает продвинутые режимы редактирования, группировку клипов, вложенные таймлайны и другие функции для профессионального workflow.

## 🎯 Цели и задачи

### Основные цели:
1. **Профессиональный монтаж** - инструменты уровня Avid/Premiere
2. **Скорость работы** - минимум кликов для операций
3. **Точность** - frame-perfect редактирование
4. **Гибкость** - адаптация под разные workflow

### Ключевые возможности:
- Ripple, Roll, Slip, Slide режимы
- Группировка и вложенные клипы
- J/L cuts для аудио
- Временные маркеры и главы
- Multi-cam редактирование

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/advanced-timeline/
├── components/
│   ├── edit-modes/            # Режимы редактирования
│   │   ├── ripple-tool.tsx    # Ripple edit
│   │   ├── roll-tool.tsx      # Roll edit
│   │   ├── slip-tool.tsx      # Slip edit
│   │   └── slide-tool.tsx     # Slide edit
│   ├── clip-groups/           # Группировка
│   │   ├── group-manager.tsx  # Управление группами
│   │   └── nested-timeline.tsx # Вложенные sequences
│   ├── advanced-cuts/         # Продвинутые cuts
│   │   ├── jl-cut-tool.tsx   # J/L cuts
│   │   └── split-edit.tsx    # Split edits
│   ├── markers/              # Маркеры
│   │   ├── marker-panel.tsx  # Панель маркеров
│   │   └── chapter-editor.tsx # Редактор глав
│   └── multicam/             # Мультикамера
│       ├── sync-tool.tsx     # Синхронизация
│       └── angle-viewer.tsx  # Просмотр углов
├── hooks/
│   ├── use-edit-mode.ts      # Режимы редактирования
│   ├── use-clip-groups.ts    # Группировка
│   └── use-markers.ts        # Маркеры
├── services/
│   ├── edit-engine.ts        # Движок редактирования
│   ├── sync-service.ts       # Синхронизация
│   └── ripple-calculator.ts  # Расчеты ripple
└── types/
    └── advanced-edits.ts     # Типы операций
```

### Интеграция с Timeline:
```
src/features/timeline/
└── extensions/
    ├── advanced-tools.ts     # Расширение инструментов
    ├── edit-modes.ts        # Интеграция режимов
    └── group-handler.ts     # Обработка групп
```

## 📐 Функциональные требования

### 1. Режимы редактирования (Trim Modes)

#### Ripple Edit (Q):
```
Before:
[Clip A][Clip B][Clip C]

After Ripple (trim B start):
[Clip A][B][Clip C]
         ↑ Gap closed
```

**Функции:**
- Автоматическое закрытие gaps
- Сохранение sync relationships
- Ripple across all tracks опция
- Asymmetric ripple

#### Roll Edit (W):
```
Before:
[Clip A][Clip B][Clip C]

After Roll (A/B edit point):
[Clip A  ][B][Clip C]
        ↑ Both adjusted
```

**Функции:**
- Одновременная корректировка двух клипов
- Сохранение общей длительности
- Preview обеих сторон
- Numeric input

#### Slip Edit (Y):
```
Before:
[Clip Content>>>>>>>>]
 ↑        Visible      ↑

After Slip:
[<<Clip Content>>>>>>]
   ↑    Visible    ↑
```

**Функции:**
- Изменение содержимого без позиции
- Real-time preview
- Waveform display для аудио
- Frame-accurate control

#### Slide Edit (U):
```
Before:
[Clip A][Target][Clip B]

After Slide:
[Clip A    ][Target][B]
            ↑ Moved
```

**Функции:**
- Перемещение без изменения длины
- Автоматическая подстройка соседей
- Magnetic timeline опция
- Collision detection

### 2. Группировка клипов

#### Clip Groups:
```typescript
interface ClipGroup {
    id: string;
    name: string;
    clips: ClipReference[];
    locked: boolean;
    color: string;
    
    // Вложенность
    parent?: GroupId;
    children?: GroupId[];
    
    // Синхронизация
    syncMode: 'none' | 'relative' | 'absolute';
    syncOffset?: number;
}
```

#### Операции с группами:
- **Create** - из выбранных клипов
- **Ungroup** - разбить группу
- **Nest** - создать вложенный sequence
- **Expand/Collapse** - свернуть группу
- **Lock** - защита от изменений

#### UI группировки:
```
Timeline View:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▼ Group: Interview Scene
  ├─ Camera 1 ████████████
  ├─ Camera 2 ████████████
  └─ Audio    ════════════
▶ Group: B-Roll (collapsed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. Вложенные таймлайны (Nested Sequences)

#### Создание:
- Из выбранных клипов
- Из целого timeline
- Drag & drop из проекта
- Template-based

#### Возможности:
```typescript
interface NestedSequence {
    sourceTimeline: TimelineId;
    instanceId: string;
    
    // Параметры вложения
    scale: number;
    position: Point;
    rotation: number;
    opacity: number;
    
    // Режим обновления
    updateMode: 'live' | 'snapshot' | 'manual';
    
    // Рендеринг
    renderCache?: RenderData;
}
```

#### Редактирование:
- **Double-click** - открыть для редактирования
- **Live update** - изменения видны сразу
- **Render & Replace** - преобразовать в видео
- **Break apart** - развернуть содержимое

### 4. J-Cut и L-Cut

#### J-Cut (аудио опережает видео):
```
Video: |████████████|          |
Audio: |════════════════════|  |
              ↑ Audio starts earlier
```

#### L-Cut (видео опережает аудио):
```
Video: |████████████████████|  |
Audio: |          |═════════|  |
                   ↑ Audio continues
```

#### Инструменты:
- **Quick J/L** - горячие клавиши
- **Визуализация** - отдельные края
- **Link/Unlink** - разрыв связи
- **Adjust** - точная настройка

### 5. Временные маркеры

#### Типы маркеров:
```typescript
enum MarkerType {
    Standard = 'standard',      // Простая метка
    Chapter = 'chapter',        // Глава для навигации
    Comment = 'comment',        // Комментарий
    ToDo = 'todo',             // Задача
    ColorCorrection = 'cc',     // Метка цветокоррекции
    Audio = 'audio',           // Аудио метка
    Subtitle = 'subtitle'       // Субтитры
}

interface Marker {
    id: string;
    type: MarkerType;
    timecode: Timecode;
    duration?: Duration;
    name: string;
    description?: string;
    color: string;
    
    // Дополнительные данные
    metadata?: Record<string, any>;
}
```

#### Marker Panel:
```
┌─────────────────────────────────────────┐
│ Markers                    [+] [Filter] │
├─────────────────────────────────────────┤
│ 00:01:30 📍 Opening titles             │
│ 00:05:42 📝 Fix color here             │
│ 00:10:15 🔊 Audio sync issue           │
│ 00:15:00 📖 Chapter: Main Interview    │
│ 00:25:30 ✅ Approved by client         │
└─────────────────────────────────────────┘
```

### 6. Скорость воспроизведения

#### Speed Ramping:
- **Constant** - постоянная скорость
- **Variable** - кривые скорости
- **Speed ramp** - плавное изменение
- **Freeze frame** - остановка кадра

#### Кривые скорости:
```
Speed Graph:
200% ┤      ╱╲
150% ┤     ╱  ╲
100% ┼────╯    ╲────
 50% ┤          ╲╱
  0% └─────────────────
     0s   5s   10s  15s
```

#### Параметры:
- Frame blending
- Optical flow
- Time remapping
- Reverse speed

### 7. Multi-camera редактирование

#### Синхронизация:
- **По звуку** - автоматическая
- **По timecode** - если есть
- **По clapperboard** - визуальная
- **Вручную** - точки синхронизации

#### Angle Viewer:
```
┌─────────────┬─────────────┐
│  Camera 1   │  Camera 2   │
│  (Active)   │             │
├─────────────┼─────────────┤
│  Camera 3   │  Camera 4   │
│             │             │
└─────────────┴─────────────┘
[1] [2] [3] [4] [Cut] [Switch]
```

#### Функции:
- Live switching
- After-the-fact editing
- Audio follows video
- Color match между камерами

### 8. Расширенные операции

#### Three-Point Editing:
- Source In/Out
- Timeline In
- Автоматический расчет Out

#### Four-Point Editing:
- Fit to fill
- Fit with speed change
- Backtiming

#### Insert/Overwrite Modes:
- Smart insert
- Replace edit
- Fit to gap

## 🎨 UI/UX дизайн

### Toolbar режимов:
```
┌──────────────────────────────────────┐
│ [▶] [Q] [W] [E] [R] [T] [Y] [U] [I] │
│ Select Ripple Roll Rate Razor Slip  │
└──────────────────────────────────────┘
```

### Контекстное меню:
```
Right-click on edit point:
┌─────────────────────┐
│ Roll Edit          W │
│ Ripple to Left    Q │
│ Ripple to Right  ⇧Q │
│ ─────────────────── │
│ Add J-Cut         J │
│ Add L-Cut         L │
│ ─────────────────── │
│ Match Frame       F │
│ Reveal in Project  │
└─────────────────────┘
```

## 🔧 Технические детали

### Edit Engine Implementation:

```typescript
class AdvancedEditEngine {
    private timeline: Timeline;
    private history: EditHistory;
    
    performRippleEdit(
        editPoint: EditPoint,
        delta: number,
        options: RippleOptions
    ): EditResult {
        // Рассчитываем affected клипы
        const affected = this.calculateRippleEffect(editPoint, delta);
        
        // Проверяем коллизии
        const collisions = this.checkCollisions(affected);
        if (collisions.length > 0 && !options.force) {
            return { success: false, collisions };
        }
        
        // Применяем изменения
        this.history.beginTransaction();
        
        affected.forEach(clip => {
            if (clip.rippleType === 'move') {
                clip.position += delta;
            } else if (clip.rippleType === 'trim') {
                clip.duration += delta;
            }
        });
        
        this.history.commitTransaction();
        
        return { success: true, affected };
    }
}
```

### Sync Detection Algorithm:

```typescript
class AudioSyncDetector {
    async findSyncPoints(
        tracks: AudioTrack[]
    ): Promise<SyncPoint[]> {
        const syncPoints: SyncPoint[] = [];
        
        // Извлекаем audio fingerprints
        const fingerprints = await Promise.all(
            tracks.map(track => this.extractFingerprint(track))
        );
        
        // Находим совпадения
        for (let i = 0; i < fingerprints.length - 1; i++) {
            for (let j = i + 1; j < fingerprints.length; j++) {
                const offset = this.findBestMatch(
                    fingerprints[i],
                    fingerprints[j]
                );
                
                if (offset.confidence > 0.8) {
                    syncPoints.push({
                        track1: i,
                        track2: j,
                        offset: offset.time,
                        confidence: offset.confidence
                    });
                }
            }
        }
        
        return syncPoints;
    }
}
```

## 📊 План реализации

### Фаза 1: Trim Modes (2 недели)
- [ ] Ripple edit
- [ ] Roll edit
- [ ] Slip/Slide tools
- [ ] UI интеграция

### Фаза 2: Группировка (2 недели)
- [ ] Создание/разбор групп
- [ ] Вложенные sequences
- [ ] UI для групп
- [ ] Операции с группами

### Фаза 3: Advanced Cuts (1 неделя)
- [ ] J/L cuts
- [ ] Split edits
- [ ] Audio/video unlink
- [ ] Визуализация

### Фаза 4: Markers & Speed (2 недели)
- [ ] Marker система
- [ ] Speed ramping
- [ ] Кривые скорости
- [ ] Chapter export

### Фаза 5: Multi-cam (2 недели)
- [ ] Sync detection
- [ ] Angle viewer
- [ ] Switching tools
- [ ] Color match

## 🎯 Метрики успеха

### Производительность:
- Ripple 1000 клипов <100ms
- Instant preview для всех операций
- Smooth playback с группами

### Точность:
- Frame-accurate все операции
- Сохранение sync при ripple
- Без дрейфа при speed changes

### Удобство:
- <3 клика для common операций
- Запоминание последних настроек
- Отмена любой операции

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - расширение базового функционала
- **Keyboard Shortcuts** - горячие клавиши для всех операций
- **Effects** - применение к группам
- **Export** - поддержка markers/chapters

### API для расширений:
```typescript
interface AdvancedTimelineAPI {
    // Edit modes
    setEditMode(mode: EditMode): void;
    performEdit(type: EditType, params: EditParams): EditResult;
    
    // Groups
    createGroup(clips: Clip[]): Group;
    nestSequence(clips: Clip[]): NestedSequence;
    
    // Markers
    addMarker(marker: Marker): void;
    exportMarkers(format: 'fcpxml' | 'edl' | 'csv'): string;
    
    // Multi-cam
    createMulticam(angles: Clip[]): Multicam;
    switchAngle(angle: number, cut: boolean): void;
}
```

## 📚 Справочные материалы

- [Avid Trim Modes](https://avid.secure.force.com/pkb/articles/en_US/User_Guide/Trim-Mode)
- [Premiere Pro Advanced Editing](https://helpx.adobe.com/premiere-pro/using/edit-sequences.html)
- [Final Cut Pro X Editing](https://support.apple.com/guide/final-cut-pro/advanced-editing)
- [DaVinci Resolve Edit Page](https://documents.blackmagicdesign.com/UserManuals/DaVinci-Resolve-17-Edit-Reference.pdf)

---

*Документ будет обновляться по мере разработки модуля*