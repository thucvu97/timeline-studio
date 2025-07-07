# Project Version Control

## 📋 Overview

Project Version Control is a version management system for Timeline Studio projects, providing auto-save, change history, crash recovery, and collaborative work. The system works similar to Git but is optimized for video projects with large media files.

## 🎯 Goals and Objectives

### Primary Goals:
1. **Data Safety** - never lose work
2. **Change History** - ability to rollback
3. **Collaboration** - merge changes from different users
4. **Efficiency** - minimal disk usage

### Key Features:
- Automatic saving every 30 seconds
- Incremental state snapshots
- Visual timeline history
- Smart media file management
- Crash recovery

## 🏗️ Technical Architecture

### Frontend Structure:
```
src/features/project-version-control/
├── components/
│   ├── version-timeline/      # Visual history
│   ├── version-browser/       # Version browser
│   ├── diff-viewer/          # Change viewer
│   ├── merge-tool/           # Merge tool
│   └── recovery-wizard/      # Recovery wizard
├── hooks/
│   ├── use-version-control.ts # Main hook
│   ├── use-auto-save.ts      # Auto-save
│   └── use-history.ts        # Change history
├── services/
│   ├── version-manager.ts    # Version management
│   ├── diff-engine.ts        # Diff calculation
│   ├── merge-engine.ts       # Version merging
│   └── storage-optimizer.ts  # Storage optimization
└── types/
    └── version.ts            # Data types
```

### Backend Structure (Rust):
```
src-tauri/src/version_control/
├── mod.rs                    # Main module
├── repository.rs             # Version repository
├── snapshot.rs               # Snapshot creation
├── diff.rs                   # Diff calculation
├── merge.rs                  # Version merging
├── storage/                  # Storage
│   ├── object_store.rs       # Object storage
│   ├── media_dedup.rs        # Media deduplication
│   └── compression.rs        # Data compression
└── commands.rs               # Tauri commands
```

## 📐 Functional Requirements

### 1. Auto-save

#### Parameters:
- **Interval** - configurable (30 sec default)
- **Triggers** - after important actions
- **Background mode** - without blocking UI
- **Smart saving** - only on changes

#### Saved Data:
```typescript
interface ProjectSnapshot {
    id: string;
    timestamp: Date;
    author: string;
    message?: string;
    
    // Project state
    timeline: TimelineState;
    effects: EffectsState;
    audio: AudioState;
    
    // Metadata
    mediaReferences: MediaRef[];
    projectSettings: Settings;
    
    // Delta from previous version
    parentId?: string;
    changes: Change[];
}
```

### 2. Version History

#### Visualization:
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

#### Functions:
- **Preview** - preview any version
- **Compare** - diff between versions
- **Rollback** - restore version
- **Branching** - create alternative versions

### 3. Change Management

#### Change Types:
```typescript
type Change = 
    | TimelineChange     // Timeline changes
    | EffectChange       // Add/remove effects
    | AudioChange        // Audio changes
    | MediaChange        // Media file replacement
    | SettingsChange;    // Project settings
```

#### Delta Saving:
- Only changes, not entire project
- Compressed binary diff
- Smart change grouping
- Data deduplication

### 4. Media Files

#### Storage Strategy:
- **References** - links to originals
- **Copies** - optional copying
- **Proxies** - low resolution versions
- **Deduplication** - one file for all versions

#### Media pool:
```
project-media/
├── originals/          # Original files
│   └── hash-based/     # By hash for deduplication
├── proxies/           # Proxy versions
│   ├── 720p/
│   └── thumbnail/
└── cache/             # Temporary files
```

### 5. Crash Recovery

#### Automatic Recovery:
- Detect unfinished session
- Offer recovery
- Restore to last auto-save
- Report lost changes

#### Recovery Files:
```
.timeline-studio/
├── recovery/
│   ├── session.lock      # Session lock
│   ├── current.snapshot  # Current state
│   └── undo.history      # Undo/redo history
└── logs/
    └── crash.log         # Crash logs
```

### 6. Collaboration

#### Model:
- **Check out/in** - lock for editing
- **Merge** - merge parallel changes
- **Conflicts** - visual resolution
- **Comments** - on versions

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

### 7. Project Archiving

#### Functions:
- **Full archive** - project + all media
- **Incremental** - only changes
- **Compression** - size optimization
- **Export** - for transfer

#### Formats:
- `.tsproj` - project without media
- `.tspkg` - project with media
- `.tsarchive` - archive with history

### 8. Settings and Policies

#### Parameters:
- Auto-save frequency
- Maximum versions
- Auto-cleanup of old versions
- Compression level
- Storage location

#### Retention Policies:
```typescript
interface RetentionPolicy {
    keepAllVersions: boolean;
    maxVersions?: number;
    maxAge?: Duration;
    keepMilestones: boolean;
    compressOldVersions: boolean;
}
```

## 🎨 UI/UX Design

### Version History UI:
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

### Status Indicator:
```
Status Bar:
[●] Saved | Last save: 2 min ago | Version: v2.5 | ↑ Cloud synced
```

## 🔧 Technical Details

### Efficient Storage:

```rust
// Delta compression for timeline
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

// Apply delta
impl Timeline {
    pub fn apply_delta(&mut self, delta: TimelineDelta) {
        for op in delta.operations {
            match op {
                Operation::AddClip { track, position, clip } => {
                    self.tracks[track].add_clip(position, clip);
                }
                // ... other operations
            }
        }
    }
}
```

### Media Deduplication:

```rust
use blake3::Hasher;

pub struct MediaStore {
    storage_path: PathBuf,
}

impl MediaStore {
    pub fn store_media(&self, file_path: &Path) -> Result<MediaRef> {
        // Compute file hash
        let hash = self.compute_hash(file_path)?;
        
        // Check if file already exists
        let target_path = self.storage_path.join(&hash);
        if !target_path.exists() {
            // Copy only if not exists
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

## 📊 Implementation Plan

### Phase 1: Basic Versioning (2 weeks)
- [ ] Snapshot structure
- [ ] Save/load versions
- [ ] Simple history
- [ ] Auto-save

### Phase 2: Storage Optimization (2 weeks)
- [ ] Delta saving
- [ ] Media deduplication
- [ ] Data compression
- [ ] Cache management

### Phase 3: UI and Recovery (2 weeks)
- [ ] Version history UI
- [ ] Diff viewer
- [ ] Recovery mechanism
- [ ] Archiving

### Phase 4: Collaboration (2 weeks)
- [ ] Merge engine
- [ ] Conflict resolution
- [ ] Cloud sync (optional)
- [ ] Access rights

## 🎯 Success Metrics

### Performance:
- Auto-save <500ms
- Version load <2s
- Delta size <1MB

### Reliability:
- 0% data loss
- 99.9% recovery rate
- 95% successful merge

### Usability:
- Transparent auto-save
- Intuitive history
- Quick rollback

## 🔗 Integration

### With Other Modules:
- **Timeline** - change tracking
- **Media** - file management
- **Export** - export versions
- **Cloud** - synchronization

### Plugin API:
```typescript
interface VersionControlAPI {
    // Create versions
    createSnapshot(message?: string): Promise<Version>;
    
    // History
    getHistory(limit?: number): Promise<Version[]>;
    restoreVersion(versionId: string): Promise<void>;
    
    // Compare
    compareVersions(v1: string, v2: string): Promise<Diff>;
    
    // Auto-save
    enableAutoSave(interval: number): void;
}
```

## 📚 References

- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Apple Final Cut Pro X Libraries](https://support.apple.com/guide/final-cut-pro/)
- [Adobe Premiere Auto-Save](https://helpx.adobe.com/premiere-pro/using/auto-save.html)
- [DaVinci Resolve Project Management](https://documents.blackmagicdesign.com/)

---

*Document will be updated as the module develops*