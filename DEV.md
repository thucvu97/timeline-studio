# Timeline Studio Development Guide

## Overview

Timeline Studio is a desktop video editing application built with Next.js, React, and Tauri. This guide provides essential information for developers working on the project.

## Application Directories

Timeline Studio automatically creates and manages a directory structure for storing user data and application resources. On first launch, the following directories are created:

### Base Directory Location
- **macOS**: `~/Movies/Timeline Studio`
- **Windows**: `~/Videos/Timeline Studio`
- **Linux**: `~/Videos/Timeline Studio`

### Directory Structure
```
Timeline Studio/
├── Media/                  # User media files and resources
│   ├── Videos/            # Video files
│   ├── Images/            # Image files
│   ├── Music/             # Audio/music files
│   ├── Effects/           # Custom video effects
│   ├── Transitions/       # Custom transitions
│   ├── Filters/           # Custom filters
│   ├── StyleTemplates/    # Style templates
│   ├── Subtitles/         # Subtitle files
│   └── Templates/         # Layout templates
├── Projects/              # Saved project files
├── Snapshot/              # Screenshots and frame captures
├── Cinematic/             # Cinematic presets and LUTs
├── Output/                # Rendered/exported videos
├── Render/                # Temporary render files
├── Recognition/           # AI recognition data (YOLO, etc.)
├── Backup/                # Project backups
├── MediaProxy/            # Proxy media for performance
├── Caches/                # Application caches
│   ├── Previews/          # Video preview cache
│   ├── Renders/           # Render cache
│   ├── Frames/            # Frame extraction cache
│   └── Temp/              # Temporary files
├── Recorded/              # Screen/camera recordings
├── Audio/                 # Audio recordings and processing
├── Cloud Project/         # Cloud sync projects
└── Upload/                # Files pending upload
```

### Accessing Directories in Code

**Rust (Backend):**
```rust
use crate::app_dirs::AppDirectories;

// Get or create app directories
let app_dirs = AppDirectories::get_or_create()?;

// Access specific directories
let media_dir = &app_dirs.media_dir;
let snapshot_dir = &app_dirs.snapshot_dir;

// Get cache directories
let preview_cache = app_dirs.get_preview_cache_dir();
```

**TypeScript (Frontend):**
```typescript
import { appDirectoriesService } from '@/features/app-state/services';

// Get app directories
const dirs = await appDirectoriesService.getAppDirectories();

// Access specific subdirectory
const videosPath = appDirectoriesService.getMediaSubdirectory('videos');

// Clear cache
await appDirectoriesService.clearAppCache();
```

## Architecture

### Technology Stack
- **Frontend**: Next.js 15 (React 19) with TypeScript
- **Desktop Runtime**: Tauri v2 (Rust)
- **State Management**: XState v5
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Video Processing**: FFmpeg

### Feature-Based Organization
Each feature in `/src/features/` is self-contained:
- `components/` - React components
- `hooks/` - Custom React hooks
- `services/` - Business logic and state machines
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
- `__tests__/` - Test files
- `__mocks__/` - Mock implementations

## Development Commands

### Setup
```bash
# Install dependencies
bun install

# Install Rust dependencies
cargo build --manifest-path src-tauri/Cargo.toml
```

### Development
```bash
# Start Next.js dev server
bun run dev

# Run Tauri desktop app
bun run tauri dev
```

### Testing
```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Test coverage
bun run test:coverage

# Run Rust tests
bun run test:rust

# E2E tests
bun run test:e2e
```

### Building
```bash
# Build Next.js
bun run build

# Build Tauri app
bun run tauri build
```

### Code Quality
```bash
# Lint code
bun run lint

# Fix linting issues
bun run lint:fix

# Run all checks
bun run check:all

# Fix all auto-fixable issues
bun run fix:all
```

## Video Processing

### Video Compiler Module
The video compiler module (`src-tauri/src/video_compiler/`) handles all video processing operations:

- **FFmpeg Integration**: All video operations use FFmpeg
- **GPU Acceleration**: Support for NVENC, QuickSync, VideoToolbox, etc.
- **Caching**: Multi-level caching for previews and renders
- **Frame Extraction**: Extract frames for timeline, recognition, and analysis

### Video Server
A built-in HTTP server (`src-tauri/src/video_server/`) provides video streaming:
- Runs on `http://localhost:4567`
- Supports range requests for video scrubbing
- Handles CORS for web preview

## State Management

### XState Machines
Complex state is managed using XState v5:
- `app-settings-machine` - Application preferences
- `browser-state-machine` - Media browser state
- `timeline-machine` - Timeline editing state
- `player-machine` - Video playback control
- `chat-machine` - AI assistant integration

### Creating a New State Machine
```typescript
import { setup } from 'xstate';

const myMachine = setup({
  types: {} as {
    context: MyContext;
    events: MyEvents;
  },
  actions: {
    // Define actions
  },
  guards: {
    // Define guards
  }
}).createMachine({
  id: 'myMachine',
  initial: 'idle',
  context: {
    // Initial context
  },
  states: {
    idle: {
      on: {
        START: 'active'
      }
    },
    active: {
      // State definition
    }
  }
});
```

## Testing Strategy

### Unit Tests
- Use Vitest with Testing Library
- Tests in `__tests__/` directories
- Mocks in `__mocks__/` directories
- Use custom render from `@/test/test-utils.tsx`

### Testing XState Machines
```typescript
import { createActor } from 'xstate';
import { myMachine } from './my-machine';

const actor = createActor(myMachine);
actor.start();

// Send events
actor.send({ type: 'START' });

// Check state
expect(actor.getSnapshot().value).toBe('active');
```

## Performance Considerations

### Media Loading
- Use lazy loading for media files
- Implement virtual scrolling for large lists
- Cache previews aggressively
- Use proxy media for 4K+ content

### Memory Management
- Monitor cache sizes
- Implement LRU eviction
- Use streaming for large files
- Clean up temporary files

## Debugging

### Frontend Debugging
- Use React DevTools
- Enable XState Inspector
- Check Network tab for API calls
- Use `console.log` with clear prefixes

### Rust Debugging
- Use `log` crate for logging
- Check Tauri console output
- Use `RUST_LOG=debug` for verbose logs
- Profile with `cargo flamegraph`

## Common Issues

### FFmpeg Not Found
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
```

### Permission Errors
- Check file permissions
- Ensure app has access to directories
- Run with appropriate privileges

### Build Failures
- Clear caches: `bun run clean`
- Rebuild dependencies
- Check Rust toolchain version

## Contributing

1. Create feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

## Resources

- [Tauri Docs](https://tauri.app/v1/guides/)
- [XState Docs](https://xstate.js.org/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)