# Timeline Studio Project Structure

[← Back to section](README.md) | [← To contents](../README.md)

## 📋 Contents

- [Structure Overview](#structure-overview)
- [Frontend (React/Next.js)](#frontend-reactnextjs)
- [Backend (Rust/Tauri)](#backend-rusttauri)
- [Configuration Files](#configuration-files)
- [Supporting Directories](#supporting-directories)

## 🏗️ Structure Overview

```
timeline-studio/
├── src/                  # Frontend code (React/Next.js)
│   ├── app/              # Next.js App Router
│   ├── components/       # Common UI components
│   ├── features/         # Feature modules
│   ├── i18n/             # Internationalization
│   ├── lib/              # Utilities and helpers
│   ├── styles/           # Global styles
│   └── test/             # Test utilities
│
├── src-tauri/            # Backend code (Rust)
│   ├── src/              # Rust source code
│   ├── Cargo.toml        # Rust configuration
│   └── tauri.conf.json   # Tauri configuration
│
├── public/               # Static files
├── docs-ru/              # Russian documentation
├── e2e/                  # End-to-end tests
└── ...configuration files
```

## ⚛️ Frontend (React/Next.js)

### `/src/app/`
Next.js 15 App Router - application entry point.

```
app/
├── layout.tsx           # Root layout
├── page.tsx             # Main page
├── globals.css          # Global styles
└── providers.tsx        # React providers
```

### `/src/features/`
Main business logic organized by feature modules.

```
features/
├── timeline/          # Timeline editor
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   ├── utils/         # Utilities
│   ├── __tests__/     # Tests
│   └── README.md      # Module documentation
│
├── video-player/      # Video player
├── browser/           # Media file browser
├── effects/           # Visual effects
├── export/            # Video export
└── ...other modules
```

#### Key Modules:

1. **`timeline`** - Central component for editing
2. **`video-player`** - Custom player with frame-accurate control
3. **`browser`** - File manager for media
4. **`effects`** - Effects and filters system
5. **`export`** - UI for video export

### `/src/components/`
Reusable UI components based on shadcn/ui.

```
components/
├── ui/                # Base UI components
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
└── layout/            # Layout components
    ├── header.tsx
    ├── sidebar.tsx
    └── ...
```

### `/src/lib/`
Common utilities and helpers.

```
lib/
├── utils.ts          # Common utilities
├── cn.ts             # Class utility
├── date.ts           # Date operations
└── validation.ts     # Data validation
```

### `/src/i18n/`
Internationalization system (10 languages).

```
i18n/
├── index.ts         # i18next configuration
├── constants.ts     # Language constants
├── locales/         # Translation files
│   ├── en.json      # English
│   ├── ru.json      # Russian
│   └── ...9 other languages
└── services/         # i18n provider
```

## 🦀 Backend (Rust/Tauri)

### `/src-tauri/src/`
Backend logic in Rust.

```
src-tauri/src/
├── main.rs             # Tauri entry point
├── lib.rs              # Root library module
├── commands.rs         # Tauri commands
│
├── media/             # Media handling module
│   ├── mod.rs         # Main module file
│   ├── scanner.rs     # File scanning
│   ├── metadata.rs    # Metadata extraction
│   └── cache.rs       # Caching
│
├── video_compiler/    # Video compilation
│   ├── mod.rs
│   ├── ffmpeg.rs      # FFmpeg integration
│   ├── encoder.rs     # Video encoding
│   └── progress.rs    # Progress tracking
│
├── recognition/       # ML recognition
│   ├── mod.rs
│   ├── yolo.rs        # YOLO integration
│   └── tracker.rs     # Object tracking
│
├── project/           # Project management
├── export/            # Export functionality
└── utils/             # Common utilities
```

### Key Rust Modules:

1. **`media`** - Media file handling, metadata, previews
2. **`video_compiler`** - FFmpeg integration for rendering
3. **`recognition`** - YOLO models for object recognition
4. **`project`** - Project save/load

### Tauri Commands
Commands for frontend-backend interaction:

```rust
#[tauri::command]
async fn get_media_metadata(path: String) -> Result<MediaMetadata> {
    // Implementation
}

#[tauri::command]
async fn export_video(settings: ExportSettings) -> Result<String> {
    // Implementation
}
```

## ⚙️ Configuration Files

### Root Configs

```
├── package.json        # NPM dependencies and scripts
├── bun.lockb           # Bun lock file
├── tsconfig.json       # TypeScript configuration
├── next.config.ts      # Next.js configuration
├── tailwind.config.ts  # Tailwind CSS settings
├── vitest.config.ts    # Test configuration
└── .env.example        # Environment variables example
```

### Tauri Configuration

```
src-tauri/
├── tauri.conf.json     # Main configuration
├── Cargo.toml          # Rust dependencies
└── build.rs            # Build script
```

### Important settings in `tauri.conf.json`:

```json
{
  "productName": "Timeline Studio",
  "version": "1.0.0",
  "identifier": "com.timeline.studio",
  "build": {
    "features": ["gpu-acceleration", "ml-recognition"]
  },
  "bundle": {
    "active": true,
    "targets": ["dmg", "msi", "appimage"],
    "resources": ["models/*", "assets/*"]
  }
}
```

## 📁 Supporting Directories

### `/public/`
Static resources, directly accessible.

```
public/
├── icons/              # Application icons
├── models/             # YOLO models
└── samples/            # Sample media files
```

### `/e2e/`
End-to-end tests with Playwright.

```
e2e/
├── tests/              # Test scenarios
├── fixtures/           # Test data
└── playwright.config.ts
```

### `/docs-ru/`
Project documentation (you are here!).

## 🔧 Development Scripts

### Main Commands

```bash
# Development
bun run dev              # Frontend only
bun run tauri dev        # Frontend + Backend

# Testing
bun run test            # Unit tests
bun run test:e2e        # E2E tests
bun run test:coverage   # Code coverage

# Building
bun run build           # Production build
bun run tauri build     # Application build

# Code quality
bun run lint            # ESLint check
bun run lint:fix        # Auto-fix
bun run type-check      # TypeScript check
```

## 📊 Architectural Principles

1. **Feature-based structure** - code organized by functionality
2. **Separation of concerns** - UI, business logic and data are separated
3. **Type Safety** - strict typing in TypeScript and Rust
4. **Modularity** - each module is independent and reusable
5. **Testability** - code written with testing in mind

## 🎯 What's Next?

Now that you understand the project structure:

1. [Study the architecture](../02-architecture/README.md) - how components interact
2. [Choose a module to study](../03-features/README.md) - implementation details
3. [Set up development environment](../05-development/setup.md) - optimal configuration
4. [Start developing](../05-development/README.md) - best practices

---

[← First project](first-project.md) | [Next: Architecture →](../02-architecture/README.md)