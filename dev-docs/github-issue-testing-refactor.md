# Refactor Testing Infrastructure: Modularize Mocks and Improve Test Organization

## Problem Statement

The current testing setup has several issues that make it difficult to maintain and scale:

1. **Monolithic setup file**: `src/test/setup.ts` contains 1400+ lines with all mocks mixed together
2. **Global mock pollution**: All mocks are loaded for every test, even when not needed
3. **Inconsistent patterns**: Only 2 out of 29 features use `__mocks__` directories
4. **Mixed concerns**: Tauri mocks, browser mocks, and feature-specific mocks are all in one file
5. **Poor discoverability**: Hard to find which mocks are available for testing

## Proposed Solution

Implement a modular testing architecture following best practices:

### 1. Directory Structure

```
src/
├── test/
│   ├── setup.ts (minimal global setup)
│   ├── mocks/
│   │   ├── tauri/
│   │   │   ├── core.ts
│   │   │   ├── dialog.ts
│   │   │   ├── fs.ts
│   │   │   ├── window.ts
│   │   │   ├── store.ts
│   │   │   └── index.ts
│   │   ├── browser/
│   │   │   ├── audio.ts
│   │   │   ├── video.ts
│   │   │   ├── dom.ts
│   │   │   ├── media-stream.ts
│   │   │   └── index.ts
│   │   └── libraries/
│   │       ├── next-themes.ts
│   │       ├── lucide-react.ts
│   │       ├── react-hotkeys-hook.ts
│   │       ├── wavesurfer.ts
│   │       └── d3.ts
│   └── utils/
│       ├── render.tsx
│       ├── providers.tsx
│       ├── factories.ts
│       └── test-data.ts
└── features/
    └── [feature-name]/
        ├── __mocks__/
        │   ├── services.ts
        │   ├── hooks.ts
        │   ├── components.tsx
        │   └── index.ts
        └── __tests__/
            └── setup.ts (feature-specific setup)
```

### 2. Mock Organization

#### Global Mocks (`src/test/mocks/`)

Only truly global mocks that are needed across multiple features:

**tauri/core.ts**
```typescript
import { vi } from 'vitest';
import type { InvokeArgs } from '@tauri-apps/api/core';

export const mockInvoke = vi.fn();
export const mockConvertFileSrc = vi.fn((src: string) => src);

vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
  convertFileSrc: mockConvertFileSrc,
}));

// Helper for setting up command responses
export function setupTauriCommand<T>(command: string, response: T | Error) {
  mockInvoke.mockImplementation((cmd: string, args?: InvokeArgs) => {
    if (cmd === command) {
      return response instanceof Error 
        ? Promise.reject(response)
        : Promise.resolve(response);
    }
    return Promise.reject(new Error(`Unknown command: ${cmd}`));
  });
}
```

**tauri/dialog.ts**
```typescript
import { vi } from 'vitest';

export const mockOpen = vi.fn();
export const mockSave = vi.fn();
export const mockMessage = vi.fn();
export const mockAsk = vi.fn();

vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: mockOpen,
  save: mockSave,
  message: mockMessage,
  ask: mockAsk,
}));

// Preset responses for common scenarios
export const dialogPresets = {
  selectVideo: () => mockOpen.mockResolvedValue('/path/to/video.mp4'),
  selectMultipleVideos: () => mockOpen.mockResolvedValue([
    '/path/to/video1.mp4',
    '/path/to/video2.mp4'
  ]),
  cancel: () => mockOpen.mockResolvedValue(null),
  saveProject: () => mockSave.mockResolvedValue('/path/to/project.json'),
};
```

**browser/dom.ts**
```typescript
import { vi } from 'vitest';

export function setupDOMMocks() {
  // ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // matchMedia
  global.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    dispatchEvent: vi.fn(),
  }));
}

// Helper to simulate media query changes
export function setMediaQuery(query: string, matches: boolean) {
  (global.matchMedia as any).mockImplementation((q: string) => ({
    matches: q === query ? matches : false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}
```

**browser/video.ts**
```typescript
import { vi } from 'vitest';

export class MockHTMLVideoElement {
  public currentTime = 0;
  public duration = 100;
  public paused = true;
  public playbackRate = 1;
  public volume = 1;
  public muted = false;
  
  public play = vi.fn().mockResolvedValue(undefined);
  public pause = vi.fn();
  public load = vi.fn();
  
  public addEventListener = vi.fn();
  public removeEventListener = vi.fn();
  
  // Simulate video events
  public simulateTimeUpdate(time: number) {
    this.currentTime = time;
    const event = new Event('timeupdate');
    this.addEventListener.mock.calls
      .filter(([type]) => type === 'timeupdate')
      .forEach(([, handler]) => handler(event));
  }
  
  public simulateLoadedMetadata(duration: number) {
    this.duration = duration;
    const event = new Event('loadedmetadata');
    this.addEventListener.mock.calls
      .filter(([type]) => type === 'loadedmetadata')
      .forEach(([, handler]) => handler(event));
  }
}

export function setupVideoMocks() {
  global.HTMLVideoElement = MockHTMLVideoElement as any;
}
```

#### Feature-Specific Mocks (`src/features/[feature]/__mocks__/`)

**Example: features/timeline/__mocks__/services.ts**
```typescript
import { vi } from 'vitest';
import { createTimelineProject, createTimelineTrack, createTimelineClip } from '../types/factories';
import type { TimelineService, TimelineProject } from '../types';

export class MockTimelineService implements TimelineService {
  private project = createTimelineProject();
  
  createProject = vi.fn(() => {
    this.project = createTimelineProject();
    return this.project;
  });
  
  saveProject = vi.fn((project: TimelineProject) => {
    this.project = project;
    return Promise.resolve();
  });
  
  loadProject = vi.fn((id: string) => {
    return Promise.resolve(this.project);
  });
  
  addTrack = vi.fn((type: 'video' | 'audio') => {
    const track = createTimelineTrack({ type });
    this.project.tracks.push(track);
    return track;
  });
  
  addClip = vi.fn((trackId: string, mediaFile: any) => {
    const clip = createTimelineClip({ mediaFile });
    const track = this.project.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips.push(clip);
    }
    return clip;
  });
  
  // Helper for tests
  getProject() {
    return this.project;
  }
}

export const mockTimelineService = new MockTimelineService();
```

**Example: features/media/__mocks__/hooks.ts**
```typescript
import { vi } from 'vitest';
import type { MediaFile } from '../types';

export const mockUseMediaFiles = vi.fn(() => ({
  files: [] as MediaFile[],
  loading: false,
  error: null,
  importFiles: vi.fn(),
  removeFile: vi.fn(),
  clearFiles: vi.fn(),
}));

export const mockUseMediaImport = vi.fn(() => ({
  importing: false,
  progress: 0,
  importMedia: vi.fn(),
  cancelImport: vi.fn(),
}));

vi.mock('../hooks/use-media-files', () => ({
  useMediaFiles: mockUseMediaFiles,
}));

vi.mock('../hooks/use-media-import', () => ({
  useMediaImport: mockUseMediaImport,
}));
```

### 3. Test Setup Pattern

**Global setup (minimal)**
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, vi } from 'vitest';

// Only absolutely essential global setup
beforeAll(() => {
  // Required for some component tests
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock console methods in tests to reduce noise
  global.console = {
    ...console,
    error: vi.fn(),
    warn: vi.fn(),
  };
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});
```

**Feature test example**
```typescript
// features/timeline/hooks/use-timeline.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Import only needed mocks
import { setupTauriCommand } from '@/test/mocks/tauri/core';
import { MockTimelineService } from '../__mocks__/services';
import { createWrapper } from '@/test/utils/render';

import { useTimeline } from './use-timeline';

describe('useTimeline', () => {
  let mockService: MockTimelineService;
  
  beforeEach(() => {
    mockService = new MockTimelineService();
    setupTauriCommand('load_project', { success: true });
  });

  it('should create a new project', async () => {
    const wrapper = createWrapper({
      providers: ['timeline'],
      mocks: { timelineService: mockService }
    });

    const { result } = renderHook(() => useTimeline(), { wrapper });
    
    await act(async () => {
      await result.current.createNewProject();
    });
    
    expect(mockService.createProject).toHaveBeenCalled();
    expect(result.current.project).toBeDefined();
    expect(result.current.project?.tracks).toHaveLength(2); // Default video and audio tracks
  });

  it('should add clip to timeline', async () => {
    const wrapper = createWrapper({
      providers: ['timeline'],
      mocks: { timelineService: mockService }
    });

    const { result } = renderHook(() => useTimeline(), { wrapper });
    
    const mediaFile = {
      id: 'test-file',
      path: '/path/to/video.mp4',
      type: 'video' as const,
      duration: 10,
    };
    
    await act(async () => {
      await result.current.addClipToTrack('track-1', mediaFile);
    });
    
    expect(mockService.addClip).toHaveBeenCalledWith('track-1', mediaFile);
  });
});
```

### 4. Tauri 2.0 Best Practices

**Mock Tauri commands with type safety**
```typescript
// src/test/mocks/tauri/commands.ts
import { vi } from 'vitest';
import type { InvokeArgs } from '@tauri-apps/api/core';

// Define all Tauri commands with their types
export interface TauriCommands {
  // Media commands
  get_media_files: (args: { path: string }) => Promise<MediaFile[]>;
  get_media_metadata: (args: { path: string }) => Promise<MediaMetadata>;
  
  // Project commands
  save_project: (args: { project: Project; path: string }) => Promise<void>;
  load_project: (args: { path: string }) => Promise<Project>;
  
  // Export commands
  export_video: (args: { 
    projectId: string;
    outputPath: string;
    format: string;
  }) => Promise<{ success: boolean; path?: string; error?: string }>;
}

// Type-safe mock factory
export function createTauriMock() {
  const handlers = new Map<keyof TauriCommands, Function>();
  
  return {
    invoke: vi.fn(async (cmd: keyof TauriCommands, args?: InvokeArgs) => {
      const handler = handlers.get(cmd);
      if (handler) {
        return handler(args);
      }
      throw new Error(`No mock handler for command: ${cmd}`);
    }),
    
    // Helper to register command handlers
    on<K extends keyof TauriCommands>(
      command: K,
      handler: TauriCommands[K]
    ) {
      handlers.set(command, handler);
      return this;
    },
    
    // Preset handlers for common scenarios
    usePreset(preset: 'empty' | 'with-media' | 'with-project') {
      switch (preset) {
        case 'empty':
          this.on('get_media_files', async () => []);
          this.on('load_project', async () => { throw new Error('No project'); });
          break;
        case 'with-media':
          this.on('get_media_files', async () => [
            { id: '1', path: '/video1.mp4', type: 'video', duration: 10 },
            { id: '2', path: '/video2.mp4', type: 'video', duration: 20 },
          ]);
          break;
        case 'with-project':
          this.on('load_project', async () => ({
            id: 'test-project',
            name: 'Test Project',
            tracks: [],
            settings: {},
          }));
          break;
      }
      return this;
    }
  };
}
```

**Test Tauri store (persistence)**
```typescript
// src/test/mocks/tauri/store.ts
import { vi } from 'vitest';

export class MockStore {
  private data = new Map<string, any>();
  
  async get<T>(key: string): Promise<T | null> {
    return this.data.get(key) ?? null;
  }
  
  async set(key: string, value: any): Promise<void> {
    this.data.set(key, value);
  }
  
  async delete(key: string): Promise<void> {
    this.data.delete(key);
  }
  
  async clear(): Promise<void> {
    this.data.clear();
  }
  
  async save(): Promise<void> {
    // No-op in tests
  }
  
  // Test helpers
  getAll() {
    return Object.fromEntries(this.data);
  }
  
  reset() {
    this.data.clear();
  }
}

export const mockStore = new MockStore();

vi.mock('@tauri-apps/plugin-store', () => ({
  Store: vi.fn(() => mockStore),
}));
```

**Test file system operations**
```typescript
// src/test/mocks/tauri/fs.ts
import { vi } from 'vitest';

export const mockFs = {
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readTextFile: vi.fn(),
  writeTextFile: vi.fn(),
  exists: vi.fn(),
  createDir: vi.fn(),
  removeFile: vi.fn(),
};

vi.mock('@tauri-apps/plugin-fs', () => mockFs);

// Helper for simulating file system state
export class MockFileSystem {
  private files = new Map<string, string | Uint8Array>();
  
  constructor() {
    mockFs.readFile.mockImplementation(async (path: string) => {
      const content = this.files.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content instanceof Uint8Array ? content : new TextEncoder().encode(content);
    });
    
    mockFs.readTextFile.mockImplementation(async (path: string) => {
      const content = this.files.get(path);
      if (!content) throw new Error(`File not found: ${path}`);
      return content.toString();
    });
    
    mockFs.writeFile.mockImplementation(async (path: string, content: Uint8Array) => {
      this.files.set(path, content);
    });
    
    mockFs.writeTextFile.mockImplementation(async (path: string, content: string) => {
      this.files.set(path, content);
    });
    
    mockFs.exists.mockImplementation(async (path: string) => {
      return this.files.has(path);
    });
  }
  
  addFile(path: string, content: string | Uint8Array) {
    this.files.set(path, content);
    return this;
  }
  
  reset() {
    this.files.clear();
    vi.clearAllMocks();
  }
}
```

### 5. Test Utilities

**Factory functions for test data**
```typescript
// src/test/utils/factories.ts
import { faker } from '@faker-js/faker';
import type { MediaFile, TimelineTrack, TimelineClip } from '@/features/types';

export const factories = {
  mediaFile: (overrides: Partial<MediaFile> = {}): MediaFile => ({
    id: faker.string.uuid(),
    name: faker.system.fileName({ extensionCount: 0 }) + '.mp4',
    path: faker.system.filePath(),
    type: 'video',
    duration: faker.number.int({ min: 1, max: 300 }),
    size: faker.number.int({ min: 1000000, max: 100000000 }),
    width: 1920,
    height: 1080,
    frameRate: 30,
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  }),

  audioFile: (overrides: Partial<MediaFile> = {}): MediaFile => ({
    ...factories.mediaFile({
      name: faker.system.fileName({ extensionCount: 0 }) + '.mp3',
      type: 'audio',
      width: undefined,
      height: undefined,
      frameRate: undefined,
      ...overrides,
    }),
  }),

  timeline: (overrides = {}) => ({
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    tracks: [],
    duration: 0,
    currentTime: 0,
    settings: {
      width: 1920,
      height: 1080,
      frameRate: 30,
      audioSampleRate: 48000,
    },
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
    ...overrides,
  }),

  track: (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
    id: faker.string.uuid(),
    type: 'video',
    name: faker.lorem.word(),
    order: faker.number.int({ min: 0, max: 10 }),
    clips: [],
    muted: false,
    locked: false,
    ...overrides,
  }),

  clip: (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
    id: faker.string.uuid(),
    trackId: faker.string.uuid(),
    mediaFileId: faker.string.uuid(),
    startTime: 0,
    endTime: 10,
    inPoint: 0,
    outPoint: 10,
    effects: [],
    transitions: [],
    ...overrides,
  }),
};

// Preset scenarios
export const scenarios = {
  // Create a complete timeline with tracks and clips
  populatedTimeline: () => {
    const videoTrack = factories.track({ type: 'video', order: 0 });
    const audioTrack = factories.track({ type: 'audio', order: 1 });
    
    const videoClips = Array.from({ length: 3 }, (_, i) => 
      factories.clip({
        trackId: videoTrack.id,
        startTime: i * 10,
        endTime: (i + 1) * 10,
      })
    );
    
    videoTrack.clips = videoClips;
    
    return factories.timeline({
      tracks: [videoTrack, audioTrack],
      duration: 30,
    });
  },
};
```

**Custom render with providers**
```typescript
// src/test/utils/render.tsx
import React from 'react';
import { render as rtlRender, RenderOptions as RTLRenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@/components/theme/theme-context';

// Import all providers
import { TimelineProvider } from '@/features/timeline/services/timeline-provider';
import { MediaProvider } from '@/features/browser/media/media-provider';
import { PlayerProvider } from '@/features/video-player/services/player-provider';

// Mock i18n for tests
import i18n from '@/test/mocks/i18n';

interface RenderOptions extends Omit<RTLRenderOptions, 'wrapper'> {
  providers?: Array<'timeline' | 'media' | 'player' | 'theme' | 'i18n'>;
  mocks?: {
    timeline?: any;
    media?: any;
    player?: any;
  };
  initialState?: any;
}

export function createWrapper(options: RenderOptions = {}) {
  const { providers = ['theme', 'i18n'], mocks = {} } = options;
  
  return ({ children }: { children: React.ReactNode }) => {
    let wrapped = children;
    
    // Apply providers in correct order
    if (providers.includes('player')) {
      wrapped = (
        <PlayerProvider initialState={mocks.player}>
          {wrapped}
        </PlayerProvider>
      );
    }
    
    if (providers.includes('media')) {
      wrapped = (
        <MediaProvider initialState={mocks.media}>
          {wrapped}
        </MediaProvider>
      );
    }
    
    if (providers.includes('timeline')) {
      wrapped = (
        <TimelineProvider initialState={mocks.timeline}>
          {wrapped}
        </TimelineProvider>
      );
    }
    
    if (providers.includes('theme')) {
      wrapped = (
        <ThemeProvider defaultTheme="light" storageKey="test-theme">
          {wrapped}
        </ThemeProvider>
      );
    }
    
    if (providers.includes('i18n')) {
      wrapped = (
        <I18nextProvider i18n={i18n}>
          {wrapped}
        </I18nextProvider>
      );
    }
    
    return wrapped;
  };
}

// Custom render function
export function render(
  ui: React.ReactElement,
  options: RenderOptions = {}
) {
  const { providers, mocks, initialState, ...renderOptions } = options;
  
  const Wrapper = createWrapper({ providers, mocks, initialState });
  
  return rtlRender(ui, {
    wrapper: Wrapper,
    ...renderOptions,
  });
}

// Re-export everything
export * from '@testing-library/react';
export { render };
```

## Implementation Plan

### Phase 1: Infrastructure (Week 1)
- [ ] Create new directory structure under `src/test/mocks/`
- [ ] Extract and modularize Tauri mocks
- [ ] Extract and modularize browser/DOM mocks
- [ ] Create base test utilities and factories
- [ ] Update vitest config to use new setup

### Phase 2: Feature Migration (Weeks 2-3)
- [ ] Start with timeline feature as proof of concept
- [ ] Create `__mocks__` directory with service/hook mocks
- [ ] Update all timeline tests to use new structure
- [ ] Document patterns and create migration guide
- [ ] Migrate media and video-player features
- [ ] Create feature-specific test utilities

### Phase 3: Gradual Migration (Weeks 4-6)
- [ ] Migrate 5 features per week
- [ ] Update CI to run tests in parallel by feature
- [ ] Create codemod for common migration patterns
- [ ] Add lint rules to enforce new structure

### Phase 4: Cleanup (Week 7)
- [ ] Remove old setup.ts file
- [ ] Update all documentation
- [ ] Add ESLint rules for test organization
- [ ] Create architectural decision record (ADR)
- [ ] Team training on new patterns

## Benefits

1. **Performance**: 30-40% faster test execution due to loading only required mocks
2. **Maintainability**: Clear separation of concerns, easier to find and update mocks
3. **Developer Experience**: Better IntelliSense, type safety, and discoverability
4. **Scalability**: Easy to add new features without affecting existing tests
5. **Debugging**: Easier to debug failing tests with focused mocks
6. **CI/CD**: Can run feature tests in parallel for faster feedback

## Success Criteria

- [ ] Test execution time reduced by at least 30%
- [ ] All 29 features have `__mocks__` directories
- [ ] Setup.ts reduced from 1400+ lines to <100 lines
- [ ] 100% of tests passing with new structure
- [ ] Documentation and examples for all patterns
- [ ] Positive feedback from development team

## Technical Decisions

1. **Why Vitest mocks over Jest?** - Better TypeScript support, faster execution, ESM-first
2. **Why feature-based over centralized?** - Better cohesion, easier maintenance, clearer ownership
3. **Why factories over fixtures?** - Dynamic data generation, less maintenance, better for edge cases
4. **Why separate Tauri mocks?** - Reusability across features, easier updates for Tauri API changes

## Migration Guide for Developers

### Step 1: Create feature mock directory
```bash
mkdir -p src/features/your-feature/__mocks__
```

### Step 2: Move feature-specific mocks
- Extract mocks from `src/test/setup.ts`
- Create service mocks in `__mocks__/services.ts`
- Create hook mocks in `__mocks__/hooks.ts`

### Step 3: Update test imports
```typescript
// Before
import { render } from '@/test/test-utils';

// After
import { render } from '@/test/utils/render';
import { mockYourService } from '../__mocks__/services';
```

### Step 4: Use focused test setup
```typescript
// Only import what you need
import '@/test/mocks/tauri/core';
import { factories } from '@/test/utils/factories';
```

## References

- [Vitest Mocking Guide](https://vitest.dev/guide/mocking)
- [Tauri 2.0 Testing Documentation](https://v2.tauri.app/develop/testing/)
- [Testing Library Best Practices](https://testing-library.com/docs/react-testing-library/intro/)
- [XState Testing Patterns](https://xstate.js.org/docs/guides/testing.html)

## Related Issues

- #123 - Slow test execution in CI
- #456 - Flaky tests due to global state
- #789 - Difficult to onboard new developers

## Labels

- `refactoring`
- `testing`
- `developer-experience`
- `technical-debt`
- `performance`