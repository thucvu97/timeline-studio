# Project Version Control - Версионирование и восстановление проектов

## 📋 Обзор

Project Version Control - это система управления версиями проектов в Timeline Studio, обеспечивающая автосохранение, историю изменений, восстановление после сбоев и совместную работу. Система работает подобно Git, но оптимизирована для видеопроектов с большими медиафайлами.

## 🎯 Цели и задачи

### Основные цели:
1. **Безопасность данных** - никогда не терять работу
2. **История изменений** - возможность откатиться
3. **Совместная работа** - merge изменений от разных пользователей
4. **Эффективность** - минимальное использование диска

### Ключевые возможности:
- Автоматическое сохранение каждые 30 секунд
- Инкрементальные снимки состояния
- Визуальная timeline история
- Умное управление медиафайлами
- Восстановление после сбоев

## 🏗️ Техническая архитектура

### Frontend структура:
```
src/features/project-version-control/
├── components/
│   ├── version-timeline/      # Визуальная история
│   ├── version-browser/       # Браузер версий
│   ├── diff-viewer/          # Просмотр изменений
│   ├── merge-tool/           # Инструмент слияния
│   └── recovery-wizard/      # Мастер восстановления
├── hooks/
│   ├── use-version-control.ts # Основной хук
│   ├── use-auto-save.ts      # Автосохранение
│   └── use-history.ts        # История изменений
├── services/
│   ├── version-manager.ts    # Управление версиями
│   ├── diff-engine.ts        # Вычисление различий
│   ├── merge-engine.ts       # Слияние версий
│   └── storage-optimizer.ts  # Оптимизация хранения
└── types/
    └── version.ts            # Типы данных
```

### Backend структура (Rust):
```
src-tauri/src/version_control/
├── mod.rs                    # Главный модуль
├── repository.rs             # Репозиторий версий
├── snapshot.rs               # Создание снимков
├── diff.rs                   # Вычисление различий
├── merge.rs                  # Слияние версий
├── storage/                  # Хранилище
│   ├── object_store.rs       # Объектное хранилище
│   ├── media_dedup.rs        # Дедупликация медиа
│   └── compression.rs        # Сжатие данных
└── commands.rs               # Tauri команды
```

## 📐 Функциональные требования

### 1. Автосохранение

#### Параметры:
- **Интервал** - настраиваемый (30 сек по умолчанию)
- **Триггеры** - после важных действий
- **Фоновый режим** - без блокировки UI
- **Умное сохранение** - только при изменениях

#### Сохраняемые данные:
```typescript
interface ProjectSnapshot {
    id: string;
    timestamp: Date;
    author: string;
    message?: string;
    
    // Состояние проекта
    timeline: TimelineState;
    effects: EffectsState;
    audio: AudioState;
    
    // Метаданные
    mediaReferences: MediaRef[];
    projectSettings: Settings;
    
    // Дельта от предыдущей версии
    parentId?: string;
    changes: Change[];
}
```

### 2. История версий

#### Визуализация:
```
Timeline History
═══════════════════════════════════════════════════
    │
    ├─● v1.0 "Initial import" (2 hours ago)
    │
    ├─● v1.1 "Added intro" (1 hour ago)
    │ │
    │ ├─○ Auto-save
    │ ├─○ Auto-save
    │ │
    ├─● v1.2 "Color correction" (30 min ago)
    │ │
    │ └─◆ Current (unsaved changes)
    │
    └─● v1.3 "Final cut" (Just now)
```

#### Функции:
- **Просмотр** - preview любой версии
- **Сравнение** - diff между версиями
- **Откат** - восстановление версии
- **Ветвление** - создание альтернативных версий

### 3. Управление изменениями

#### Типы изменений:
```typescript
type Change = 
    | TimelineChange     // Изменения на timeline
    | EffectChange       // Добавление/удаление эффектов
    | AudioChange        // Аудио изменения
    | MediaChange        // Замена медиафайлов
    | SettingsChange;    // Настройки проекта
```

#### Дельта-сохранение:
- Только изменения, не весь проект
- Сжатие binary diff
- Умная группировка изменений
- Дедупликация данных

### 4. Медиафайлы

#### Стратегия хранения:
- **Референсы** - ссылки на оригиналы
- **Копии** - опциональное копирование
- **Прокси** - версии низкого разрешения
- **Дедупликация** - один файл для всех версий

#### Media pool:
```
project-media/
├── originals/          # Оригинальные файлы
│   └── hash-based/     # По хешу для дедупликации
├── proxies/           # Прокси версии
│   ├── 720p/
│   └── thumbnail/
└── cache/             # Временные файлы
```

### 5. Восстановление после сбоев

#### Автоматическое восстановление:
- Обнаружение незавершенной сессии
- Предложение восстановления
- Восстановление до последнего автосохранения
- Отчет о потерянных изменениях

#### Recovery файлы:
```
.timeline-studio/
├── recovery/
│   ├── session.lock      # Блокировка сессии
│   ├── current.snapshot  # Текущее состояние
│   └── undo.history      # История undo/redo
└── logs/
    └── crash.log         # Логи сбоев
```

### 6. Совместная работа

#### Модель:
- **Check out/in** - блокировка на редактирование
- **Merge** - слияние параллельных изменений
- **Конфликты** - визуальное разрешение
- **Комментарии** - к версиям

#### Merge tool:
```
┌─────────────────────────────────────────────────┐
│  Merge Conflict Resolution                      │
├─────────────────────────────────────────────────┤
│  Your Version    │ Base Version │ Their Version │
├──────────────────┼──────────────┼───────────────┤
│  ███████████     │ ███████      │ ████████████  │
│  Clip A (5s)     │ Clip A (3s)  │ Clip A (4s)   │
├──────────────────┴──────────────┴───────────────┤
│  Resolution: [Use Yours] [Use Theirs] [Manual]  │
└─────────────────────────────────────────────────┘
```

### 7. Архивирование проектов

#### Функции:
- **Полный архив** - проект + все медиа
- **Инкрементальный** - только изменения
- **Сжатие** - оптимизация размера
- **Экспорт** - для переноса

#### Форматы:
- `.tsproj` - проект без медиа
- `.tspkg` - проект с медиа
- `.tsarchive` - архив с историей

### 8. Настройки и политики

#### Параметры:
- Частота автосохранения
- Максимум версий
- Автоочистка старых версий
- Уровень сжатия
- Локация хранения

#### Политики хранения:
```typescript
interface RetentionPolicy {
    keepAllVersions: boolean;
    maxVersions?: number;
    maxAge?: Duration;
    keepMilestones: boolean;
    compressOldVersions: boolean;
}
```

## 🎨 UI/UX дизайн

### История версий UI:
```
┌─────────────────────────────────────────────────┐
│  Project History                    [Settings]  │
├─────────────────────────────────────────────────┤
│  Today                                          │
│  ├─● 14:30 "Added transitions" (You)           │
│  ├─○ 14:15 Auto-save                          │
│  ├─● 14:00 "Color grading complete" (You)     │
│  │                                             │
│  Yesterday                                      │
│  ├─● 18:45 "Final review changes" (John)      │
│  └─● 17:30 "Audio mixing" (Sarah)             │
├─────────────────────────────────────────────────┤
│ [Compare] [Restore] [Branch] [Export]          │
└─────────────────────────────────────────────────┘
```

### Индикатор статуса:
```
Status Bar:
[●] Saved | Last save: 2 min ago | Version: v2.5 | ↑ Cloud synced
```

## 🔧 Технические детали

### Эффективное хранение:

```rust
// Дельта-сжатие для timeline
pub struct TimelineDelta {
    version: u32,
    parent_version: u32,
    operations: Vec<Operation>,
}

pub enum Operation {
    AddClip { track: u32, position: f64, clip: Clip },
    RemoveClip { clip_id: String },
    MoveClip { clip_id: String, new_position: f64 },
    ModifyClip { clip_id: String, changes: ClipChanges },
}

// Применение дельты
impl Timeline {
    pub fn apply_delta(&mut self, delta: TimelineDelta) {
        for op in delta.operations {
            match op {
                Operation::AddClip { track, position, clip } => {
                    self.tracks[track].add_clip(position, clip);
                }
                // ... другие операции
            }
        }
    }
}
```

### Медиа дедупликация:

```rust
use blake3::Hasher;

pub struct MediaStore {
    storage_path: PathBuf,
}

impl MediaStore {
    pub fn store_media(&self, file_path: &Path) -> Result<MediaRef> {
        // Вычисляем хеш файла
        let hash = self.compute_hash(file_path)?;
        
        // Проверяем, есть ли уже такой файл
        let target_path = self.storage_path.join(&hash);
        if !target_path.exists() {
            // Копируем только если нет
            fs::copy(file_path, &target_path)?;
        }
        
        Ok(MediaRef {
            hash,
            original_path: file_path.to_owned(),
            size: fs::metadata(file_path)?.len(),
        })
    }
}
```

## 📊 План реализации

### Фаза 1: Базовое версионирование (2 недели)
- [ ] Структура снимков
- [ ] Сохранение/загрузка версий
- [ ] Простая история
- [ ] Автосохранение

### Фаза 2: Оптимизация хранения (2 недели)
- [ ] Дельта-сохранение
- [ ] Медиа дедупликация
- [ ] Сжатие данных
- [ ] Управление кэшем

### Фаза 3: UI и восстановление (2 недели)
- [ ] UI истории версий
- [ ] Diff viewer
- [ ] Recovery механизм
- [ ] Архивирование

### Фаза 4: Совместная работа (2 недели)
- [ ] Merge engine
- [ ] Conflict resolution
- [ ] Cloud sync (опционально)
- [ ] Права доступа

## 🎯 Метрики успеха

### Производительность:
- Автосохранение <500ms
- Загрузка версии <2s
- Размер дельты <1MB

### Надежность:
- 0% потери данных
- Восстановление 99.9%
- Успешный merge 95%

### Удобство:
- Прозрачное автосохранение
- Интуитивная история
- Быстрый откат

## 🔗 Интеграция

### С другими модулями:
- **Timeline** - отслеживание изменений
- **Media** - управление файлами
- **Export** - версии для экспорта
- **Cloud** - синхронизация

### API для плагинов:
```typescript
interface VersionControlAPI {
    // Создание версий
    createSnapshot(message?: string): Promise<Version>;
    
    // История
    getHistory(limit?: number): Promise<Version[]>;
    restoreVersion(versionId: string): Promise<void>;
    
    // Сравнение
    compareVersions(v1: string, v2: string): Promise<Diff>;
    
    // Автосохранение
    enableAutoSave(interval: number): void;
}
```

## 📚 Справочные материалы

- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Apple Final Cut Pro X Libraries](https://support.apple.com/guide/final-cut-pro/)
- [Adobe Premiere Auto-Save](https://helpx.adobe.com/premiere-pro/using/auto-save.html)
- [DaVinci Resolve Project Management](https://documents.blackmagicdesign.com/)

---

*Документ будет обновляться по мере разработки модуля*