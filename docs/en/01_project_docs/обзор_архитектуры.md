# TIMELINE STUDIO ARCHITECTURE OVERVIEW

## 🏗️ General Architecture

Timeline Studio is built on a modern modular architecture that combines the power of native desktop applications with the convenience of web technologies.

```
┌─────────────────────────────────────────────────────────────┐
│                      Timeline Studio                         │
├─────────────────────────┬───────────────────────────────────┤
│      Frontend          │           Backend                  │
│    (Next.js 15)        │         (Rust + Tauri)           │
├─────────────────────────┼───────────────────────────────────┤
│  • React 19            │  • Video Compiler (FFmpeg)        │
│  • XState v5           │  • GPU Acceleration               │
│  • shadcn/ui           │  • Media Processing               │
│  • Tailwind CSS v4     │  • Plugin System                  │
│  • Feature-based       │  • Security Layer                 │
└─────────────────────────┴───────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Feature-based Organization

Each feature in `/src/features/` is a self-contained module:

```
src/features/
├── timeline/           # Main editor
│   ├── components/    # React components
│   ├── hooks/         # Custom hooks
│   ├── services/      # Business logic and XState machines
│   ├── types/         # TypeScript types
│   ├── utils/         # Helper functions
│   └── __tests__/     # Tests
├── video-player/      # Video player
├── media-studio/      # Main interface
├── ai-chat/          # AI assistant
└── ...               # Other features
```

### State Management

- **XState v5** for complex logic (timeline, player, browser)
- **React Context** for global state
- **React Query** for server data
- **Local Storage** for user settings

### UI Architecture

- **shadcn/ui** - ready components based on Radix UI
- **Tailwind CSS v4** - utility-first styling
- **CSS Variables** - theming
- **Framer Motion** - animations

## ⚙️ Backend Architecture

### Modular Structure

```
src-tauri/src/
├── core/              # Core infrastructure
│   ├── di/           # Dependency Injection
│   ├── events/       # EventBus system
│   ├── performance/  # Memory management
│   ├── plugins/      # Plugin system
│   └── telemetry/    # Metrics and monitoring
├── security/          # Security
│   ├── secure_storage.rs    # Data encryption
│   ├── oauth_handler.rs     # OAuth for social media
│   └── api_validator.rs     # API key validation
├── media/             # Media processing
│   ├── metadata.rs   # File analysis
│   ├── ffmpeg.rs     # FFmpeg integration
│   └── preview.rs    # Preview generation
├── video_compiler/    # Video compilation
│   ├── core/         # GPU, pipeline, codecs
│   ├── services/     # Service layer
│   └── cache/        # LRU cache
└── recognition/       # AI recognition
    └── yolo_processor.rs  # YOLO models
```

### Key Components

1. **Video Compiler** - FFmpeg-based video processing core
2. **GPU Service** - Hardware acceleration (NVENC, QuickSync)
3. **Plugin System** - Extensibility through plugins
4. **Security Layer** - Secure storage and OAuth
5. **Media Pipeline** - Media processing pipeline

## 🔌 Frontend ↔ Backend Communication

### Tauri Commands

```rust
// Backend
#[tauri::command]
async fn process_video(path: String, options: VideoOptions) -> Result<VideoOutput> {
    // Process video
}

// Frontend
import { invoke } from '@tauri-apps/api/core';

const result = await invoke('process_video', {
    path: '/path/to/video.mp4',
    options: { format: 'mp4', quality: 'high' }
});
```

### Event System

```typescript
// Frontend subscription
import { listen } from '@tauri-apps/api/event';

const unlisten = await listen('render-progress', (event) => {
    console.log('Progress:', event.payload.percent);
});

// Backend emission
window.emit("render-progress", ProgressPayload { percent: 75.0 });
```

## 🔐 Security

### API Keys
- Stored in system keychain (macOS), Credential Store (Windows), Secret Service (Linux)
- Encrypted with AES-256 before saving
- Never transmitted in plaintext

### OAuth Tokens
- PKCE flow used for security
- Tokens refreshed automatically
- Support for YouTube, TikTok, Vimeo, Telegram

## 🚀 Performance

### Frontend Optimizations
- Code splitting by routes
- Lazy loading of components
- Memoization of expensive calculations
- Virtualization of large lists

### Backend Optimizations
- GPU acceleration for rendering
- LRU cache for previews
- Parallel processing via tokio
- Zero-copy operations where possible

## 🧪 Testing

### Frontend
- **Vitest** for unit tests
- **Testing Library** for components
- **Playwright** for E2E tests
- **80%+** code coverage

### Backend
- **Cargo test** for unit tests
- **Integration tests** for commands
- **Mockall** for mocks
- **Proptest** for property-based tests

## 📦 Build System

### Development
```bash
bun run tauri dev  # Hot reload for frontend and backend
```

### Production
```bash
bun run tauri build  # Optimized build
```

### Platforms
- **Windows**: MSI/NSIS installer
- **macOS**: DMG/App bundle
- **Linux**: AppImage/deb/rpm

---

*For detailed information, see specialized documents in architecture sections*