# Project Version Control - Версионирование и восстановление проектов

## 📋 Обзор

Project Version Control - это система управления версиями проектов в Timeline Studio, интегрированная с существующей backend архитектурой состояния. Система расширяет текущий `ProjectState` и `PersistenceService`, добавляя версионирование, историю изменений, восстановление после сбоев и базовую совместную работу.

**⚠️ СТАТУС**: Активная разработка - адаптация под существующую backend архитектуру

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

### Backend интеграция (Rust):
```
# РАСШИРЕНИЕ СУЩЕСТВУЮЩИХ МОДУЛЕЙ:
src-tauri/src/state/
├── project_state.rs          # ✅ РАСШИРИТЬ: добавить VersionInfo
├── commands.rs               # ✅ РАСШИРИТЬ: добавить команды версионирования
├── persistence.rs            # ✅ РАСШИРИТЬ: методы версионирования
└── event_bus.rs              # ✅ РАСШИРИТЬ: события версионирования

# НОВЫЙ МОДУЛЬ ВЕРСИОНИРОВАНИЯ:
src-tauri/src/version_control/
├── mod.rs                    # Главный модуль
├── repository.rs             # Репозиторий версий
├── snapshot.rs               # Создание снимков ProjectState
├── diff.rs                   # Различия между ProjectState
├── merge.rs                  # Слияние версий ProjectState
├── storage/                  # Эффективное хранилище
│   ├── delta_store.rs        # Дельта-сжатие ProjectState
│   ├── media_dedup.rs        # Дедупликация медиа (интеграция с MediaPool)
│   └── compression.rs        # Сжатие данных
└── commands.rs               # Tauri команды версионирования
```

## 📐 Функциональные требования

### 1. Автосохранение

#### Параметры:
- **Интервал** - настраиваемый (30 сек по умолчанию)
- **Триггеры** - после важных действий
- **Фоновый режим** - без блокировки UI
- **Умное сохранение** - только при изменениях

#### Сохраняемые данные (интеграция с ProjectState):
```rust
// Расширение существующего ProjectState
pub struct ProjectState {
    pub project: Option<Project>,
    pub ui_state: UiState,
    pub playback_state: PlaybackState,
    pub version: u32,
    // ✅ НОВОЕ: информация о версионировании
    pub version_info: VersionInfo,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct VersionInfo {
    pub current_version_id: String,
    pub branch_name: String,
    pub has_uncommitted_changes: bool,
    pub last_snapshot_time: DateTime<Utc>,
    pub auto_save_enabled: bool,
}

// Снимок версии основан на полном ProjectState
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSnapshot {
    pub id: String,
    pub timestamp: DateTime<Utc>,
    pub author: String,
    pub message: Option<String>,
    
    // Полное состояние проекта (используем существующий ProjectState)
    pub project_state: ProjectState,
    
    // Дельта от предыдущей версии (для экономии места)
    pub parent_id: Option<String>,
    pub delta: Option<ProjectStateDelta>,
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

#### Типы изменений (на основе ProjectEvent):
```rust
// Используем существующую систему событий, расширяя ProjectEvent
pub enum ProjectEvent {
    // ... существующие события ...
    
    // ✅ НОВЫЕ: события версионирования
    SnapshotCreated { 
        version_id: String, 
        message: Option<String>,
        parent_version: Option<String> 
    },
    VersionRestored { 
        version_id: String, 
        previous_version: String 
    },
    BranchCreated { 
        branch_name: String, 
        base_version: String 
    },
    AutoSaveTriggered { 
        snapshot_id: String 
    },
}

// Дельта изменений между ProjectState
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectStateDelta {
    pub timeline_changes: Vec<TimelineChange>,
    pub media_pool_changes: Vec<MediaPoolChange>,
    pub settings_changes: Vec<SettingsChange>,
    pub ui_state_changes: Vec<UiStateChange>,
    pub playback_changes: Vec<PlaybackChange>,
}
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

## 📊 План реализации (адаптирован под существующую архитектуру)

### Фаза 1: Интеграция с существующим State (1 неделя)
- [ ] Расширить `ProjectState` добавив `VersionInfo`
- [ ] Добавить команды версионирования в `ProjectCommand` enum
- [ ] Расширить `ProjectEvent` событиями версионирования
- [ ] Обновить `CommandHandler` для обработки новых команд
- [ ] Базовые unit тесты интеграции

### Фаза 2: Расширение PersistenceService (1 неделя)
- [ ] Добавить методы версионирования в `PersistenceService`
- [ ] Интеграция с существующим автосохранением (`save_checkpoint`)
- [ ] Расширить систему cleanup для версионированных файлов
- [ ] История версий через расширенные checkpoints
- [ ] Тестирование совместимости с существующими проектами

### Фаза 3: Отдельный модуль version_control (2 недели)
- [ ] Создать модуль `src-tauri/src/version_control/`
- [ ] `VersionRepository` для управления снимками `ProjectState`
- [ ] Дельта-сжатие между состояниями проекта
- [ ] Интеграция с `MediaPool` для дедупликации медиа
- [ ] Advanced функции: merge, diff, branches
- [ ] Оптимизация производительности

### Фаза 4: Frontend интеграция (2 недели)
- [ ] Расширить `BackendSync` методами версионирования
- [ ] Создать хуки: `useVersionControl`, `useProjectHistory`
- [ ] UI компоненты: история версий, diff viewer
- [ ] Интеграция с существующими провайдерами состояния
- [ ] Recovery механизм через существующий error handling
- [ ] Тестирование E2E с существующими workflow

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

### С существующими модулями:
- **StateManager** - координация версионирования с общим состоянием
- **PersistenceService** - расширение автосохранения для версионирования  
- **EventBus** - публикация событий версионирования
- **CommandHandler** - обработка команд версионирования
- **MediaPool** - дедупликация медиафайлов между версиями
- **Timeline Provider** - уведомления о восстановлении версий
- **BackendSync** - синхронизация версионирования с frontend

### API интеграция с BackendSync:
```typescript
// ✅ РАСШИРИТЬ существующий BackendSync
export class BackendSync {
    // ... существующие методы ...
    
    // ✅ НОВЫЕ: методы версионирования
    async createSnapshot(message?: string): Promise<string> {
        return this.executeCommand({
            type: "CreateSnapshot",
            params: { message }
        })
    }
    
    async restoreVersion(versionId: string): Promise<void> {
        return this.executeCommand({
            type: "RestoreVersion", 
            params: { version_id: versionId }
        })
    }
    
    async getVersionHistory(limit?: number): Promise<VersionInfo[]> {
        return this.executeCommand({
            type: "GetVersionHistory",
            params: { limit }
        })
    }
    
    // События версионирования (расширение существующих)
    onVersionCreated(handler: (version: VersionInfo) => void): () => void
    onVersionRestored(handler: (version: VersionInfo) => void): () => void
}

// ✅ НОВЫЕ команды в ProjectCommand enum
pub enum ProjectCommand {
    // ... существующие команды ...
    
    CreateSnapshot { message: Option<String> },
    RestoreVersion { version_id: String },
    GetVersionHistory { limit: Option<u32> },
    CompareVersions { version_a: String, version_b: String },
}
```

## 📚 Справочные материалы

- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Apple Final Cut Pro X Libraries](https://support.apple.com/guide/final-cut-pro/)
- [Adobe Premiere Auto-Save](https://helpx.adobe.com/premiere-pro/using/auto-save.html)
- [DaVinci Resolve Project Management](https://documents.blackmagicdesign.com/)

---

## 🔄 Статус интеграции

**Текущий статус**: Активная разработка  
**Приоритет**: Средний  
**Зависимости**: 
- ✅ Существующая backend архитектура (ProjectState, PersistenceService)
- ✅ Система команд и событий (ProjectCommand, ProjectEvent) 
- ✅ BackendSync для frontend интеграции

**Ключевые преимущества интеграции**:
- Использование существующей архитектуры состояния
- Минимальные breaking changes
- Совместимость с текущими проектами
- Расширение, а не замена существующего автосохранения

---

*Обновлено: 28 июля 2025 - адаптировано под существующую backend архитектуру*  
*Следующее обновление: после завершения Фазы 1*