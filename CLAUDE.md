# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `bun run test src/features/timeline/hooks/use-timeline.test.ts` - Run a single test file
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
- `*.test.ts` - Tests colocated with implementation

### State Management Architecture
The application uses XState state machines for complex state management:
- **app-settings-machine** - Application preferences and configuration
- **media-machine** - Media file management and favorites
- **timeline-machine** - Timeline editing state
- **player-machine** - Video playback control
- **chat-machine** - AI assistant integration

State machines are created using XState's `setup` method for better type safety and should be provided through React context providers.

### Key Features Overview
- **timeline** - Core video editing timeline with tracks, clips, and sections
- **media-studio** - Main editing interface with multiple layout options
- **video-player** - Custom video playback with frame-accurate control
- **browser** - Media file browser with tabbed interface
- **effects/filters/transitions** - Video effect system with CSS-based processing
- **ai-chat** - Integrated AI assistant (Claude/OpenAI)
- **recognition** - Scene/object recognition using YOLO models

### Media Processing
- Video processing is handled through FFmpeg integration
- Media files are referenced by path, not embedded
- Project files use a custom schema for timeline data persistence
- Missing file restoration is handled through the MediaRestorationService

### Testing Strategy
- Unit tests use Vitest with Testing Library
- Tests are colocated with implementation files
- Use custom render function from `@/test/test-utils.tsx` for component tests
- XState machines are tested using actor model and snapshot testing
- All external dependencies (Tauri API, localStorage) are mocked in tests

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

### State Management
- Simple state: useState/useReducer
- Complex state: XState machines with proper typing
- Global state: Context providers with custom hooks
- Async operations: Use XState services or React Query patterns

### File Naming
- Components: PascalCase (e.g., `VideoPlayer.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useTimeline.ts`)
- Utilities: camelCase (e.g., `media-utils.ts`)
- Tests: Same name with `.test.ts` suffix