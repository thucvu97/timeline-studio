# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Requirements

Before working with this codebase, ensure you have the following dependencies installed:

### Required Dependencies
- **Node.js 18+** and **Bun** - JavaScript runtime and package manager
- **Rust 1.81.0+** - Backend runtime for Tauri
- **FFmpeg** - Video processing library (required for compilation)
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt-get install ffmpeg libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev pkg-config
  
  # Windows
  choco install ffmpeg
  ```
- **ONNX Runtime** - Machine learning inference (for recognition features)
  ```bash
  # macOS
  brew install onnxruntime
  
  # Add to your shell profile:
  # For bash/zsh (~/.zshrc or ~/.bashrc):
  export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
  
  # For fish (~/.config/fish/config.fish):
  set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib
  ```

### Platform-specific Tools
- **macOS**: Xcode Command Line Tools
- **Windows**: Visual Studio 2022 with C++ tools
- **Linux**: `build-essential`, `libgtk-3-dev`, `libwebkit2gtk-4.1-dev`

## Common Development Commands

### Development
- `bun run dev` - Start Next.js development server with hot reload
- `bun run tauri dev` - Run the full Tauri desktop application in development mode

### Building
- `bun run build` - Build the Next.js frontend
- `bun run tauri build` - Build the production Tauri desktop application

### Testing
- `bun run test` - Run all tests
- `bun run test:watch` - Run tests in watch mode
- `bun run test src/features/timeline/__tests__/use-timeline.test.ts` - Run a single test file
- `bun run test:coverage` - Generate test coverage report
- `bun run test:rust` - Run Rust backend tests
- `bun run test:e2e` - Run Playwright end-to-end tests

### Code Quality
- `bun run lint` - Lint TypeScript/JavaScript files
- `bun run lint:fix` - Auto-fix linting issues
- `bun run check:all` - Run all linting and tests
- `bun run fix:all` - Fix all auto-fixable issues

## High-Level Architecture

Timeline Studio is a desktop video editing application with a feature-based architecture. Key architectural decisions:

### Technology Stack
- **Frontend**: Next.js 15 (React 19) with TypeScript, using static export for Tauri integration
- **Desktop Runtime**: Tauri v2 (Rust) for native desktop capabilities
- **State Management**: XState v5 for complex state machines
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming

### Feature-Based Organization
Each feature in `/src/features/` is self-contained with:
- `components/` - React components
- `hooks/` - Custom React hooks
- `services/` - Business logic and state machines
- `types/` - TypeScript type definitions
- `utils/` - Helper functions
- `__tests__/` - Test files for the feature
- `__mocks__/` - Mock implementations for testing

### State Management Architecture
The application uses XState state machines for complex state management:
- **app-settings-machine** - Application preferences and configuration
- **browser-state-machine** - Media browser state and file selection
- **timeline-machine** - Timeline editing state
- **player-machine** - Video playback control
- **chat-machine** - AI assistant integration
- **modal-machine** - Modal dialog state management
- **project-settings-machine** - Project-specific settings
- **resources-machine** - Resource management (effects, filters, etc.)
- **user-settings-machine** - User preferences and settings

State machines are created using XState's `setup` method for better type safety and should be provided through React context providers.

### Key Features Overview
- **timeline** - Core video editing timeline with tracks, clips, and sections
- **media-studio** - Main editing interface with multiple layout options
- **video-player** - Custom video playback with frame-accurate control
- **browser** - Media file browser with tabbed interface
- **effects/filters/transitions** - Video effect system with CSS-based processing
- **templates** - Multi-camera layout templates for split-screen editing
- **style-templates** - Animated intro/outro and title templates
- **ai-chat** - Integrated AI assistant (Claude/OpenAI)
- **recognition** - Scene/object recognition using YOLO models

### Media Processing
- Video processing is handled through FFmpeg integration
- Media files are referenced by path, not embedded
- Project files use a custom schema for timeline data persistence
- Missing file restoration is handled through the MediaRestorationService

### Testing Strategy
- Unit tests use Vitest with Testing Library
- Tests are organized in `__tests__/` directories within each feature
- Mocks are organized in `__mocks__/` directories within each feature
- Use custom render function from `@/test/test-utils.tsx` for component tests
- XState machines are tested using actor model and snapshot testing
- All external dependencies (Tauri API, localStorage) are mocked in tests

### Test Environment Setup
The project includes a comprehensive test environment setup:

#### Test Configuration (`src/test/`)
- **`setup.ts`** - Global test setup and essential mocks
  - Configures Jest DOM matchers
  - Sets up cleanup between tests
  - Mocks common providers (UserSettings, Modals, AppState)
  - Configures console methods for test environment
  - Provides TypeScript declarations for custom matchers

- **`mocks/index.ts`** - Centralized mock management
  - Exports commonly used mocks (Tauri, Browser, Libraries)
  - Provides `resetAllMocks()` function for cleanup
  - Offers `setupEssentialMocks()` for initial configuration

- **`utils/README.md`** - Specialized audio testing utilities
  - Complete documentation for Tauri audio component testing
  - Audio mocking utilities (AudioContext, MediaRecorder, HTMLAudioElement)
  - Test data generators for audio files and streams
  - Event simulation helpers for audio lifecycle
  - Integration patterns with Context7 MCP
  - Best practices and troubleshooting guide

#### Testing Utilities Available
- **Audio Testing**: Mock AudioContext, MediaRecorder, audio file operations
- **Tauri API Mocking**: File system, commands, dialogs, notifications
- **Browser API Mocking**: URL, Blob, fetch, localStorage
- **Library Mocking**: External dependencies and services
- **Test Data Creation**: Realistic mock data generators
- **Event Simulation**: User interactions and system events

## Code Style Guidelines

### TypeScript/JavaScript
- Use TypeScript strict mode, avoid `any` types
- Import order: builtin → external → internal → sibling/parent → CSS
- Semicolons as needed, double quotes for strings
- Prefer named exports over default exports

### Component Patterns
- Follow existing patterns in the codebase
- Use shadcn/ui components from `/src/components/ui/`
- Create feature-specific components in `/src/features/[feature]/components/`
- Use CSS variables for theming (defined in globals.css)
- Component names use PascalCase but files use kebab-case

### State Management
- Simple state: useState/useReducer
- Complex state: XState machines with proper typing
- Global state: Context providers with custom hooks
- Async operations: Use XState services or React Query patterns

### File Naming
- Components: kebab-case (e.g., `video-player.tsx`)
- Hooks: kebab-case with `use` prefix (e.g., `use-timeline.ts`)
- Utilities: kebab-case (e.g., `media-utils.ts`)
- Services: kebab-case (e.g., `timeline-machine.ts`)
- Types: kebab-case (e.g., `timeline.ts`)
- Test files: Located in `__tests__/` with `.test.ts` or `.test.tsx` suffix
- Mock files: Located in `__mocks__/` with same name as mocked module