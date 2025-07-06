# PLUGIN API REFERENCE

## Overview

Timeline Studio provides a comprehensive plugin system that allows developers to extend functionality without modifying the core application.

## Plugin Structure

### Basic Plugin Template

```typescript
// plugin.ts
export interface TimelinePlugin {
  metadata: PluginMetadata;
  initialize(): Promise<void>;
  execute(context: PluginContext): Promise<PluginResult>;
  cleanup?(): Promise<void>;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: 'effect' | 'transition' | 'generator' | 'analyzer' | 'export';
  permissions: PluginPermission[];
}
```

### Plugin Manifest

```json
{
  "id": "com.example.my-plugin",
  "name": "My Amazing Plugin",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "Adds amazing features to Timeline Studio",
  "main": "dist/index.js",
  "category": "effect",
  "permissions": ["filesystem:read", "media:write"],
  "dependencies": {
    "timeline-studio-api": "^1.0.0"
  }
}
```

## Core APIs

### Timeline API

Access and manipulate the timeline.

```typescript
interface TimelineAPI {
  // Get current timeline state
  getTimeline(): Timeline;
  
  // Add clip to timeline
  addClip(clip: Clip, trackId: string, position: number): string;
  
  // Remove clip
  removeClip(clipId: string): void;
  
  // Apply effect to clip
  applyEffect(clipId: string, effect: Effect): void;
  
  // Get selected clips
  getSelectedClips(): Clip[];
  
  // Set playhead position
  setPlayhead(time: number): void;
  
  // Get current playhead position
  getPlayhead(): number;
}
```

### Media API

Work with media files and processing.

```typescript
interface MediaAPI {
  // Import media file
  importMedia(path: string): Promise<MediaFile>;
  
  // Get media metadata
  getMetadata(mediaId: string): Promise<MediaMetadata>;
  
  // Generate thumbnail
  generateThumbnail(mediaId: string, time: number): Promise<string>;
  
  // Process media with custom filter
  processMedia(
    input: MediaFile,
    processor: MediaProcessor
  ): Promise<MediaFile>;
  
  // Export media
  exportMedia(
    timeline: Timeline,
    options: ExportOptions
  ): Promise<ExportResult>;
}
```

### UI API

Create custom UI elements and panels.

```typescript
interface UIAPI {
  // Register custom panel
  registerPanel(panel: PanelDefinition): void;
  
  // Show dialog
  showDialog(options: DialogOptions): Promise<DialogResult>;
  
  // Show notification
  showNotification(message: string, type?: 'info' | 'warning' | 'error'): void;
  
  // Register toolbar button
  registerToolbarButton(button: ToolbarButton): void;
  
  // Register context menu item
  registerContextMenu(menu: ContextMenuItem): void;
  
  // Get theme
  getTheme(): 'light' | 'dark';
}
```

### Effects API

Create custom effects and filters.

```typescript
interface EffectsAPI {
  // Register custom effect
  registerEffect(effect: EffectDefinition): void;
  
  // Process frame
  processFrame(
    frame: VideoFrame,
    parameters: EffectParameters
  ): Promise<VideoFrame>;
  
  // Get available effects
  getAvailableEffects(): EffectDefinition[];
  
  // Create effect chain
  createEffectChain(effects: Effect[]): EffectChain;
}

interface EffectDefinition {
  id: string;
  name: string;
  category: string;
  parameters: ParameterDefinition[];
  process: FrameProcessor;
}
```

### Storage API

Persistent storage for plugin data.

```typescript
interface StorageAPI {
  // Get value
  get<T>(key: string): Promise<T | null>;
  
  // Set value
  set<T>(key: string, value: T): Promise<void>;
  
  // Remove value
  remove(key: string): Promise<void>;
  
  // Clear all plugin data
  clear(): Promise<void>;
  
  // Get all keys
  keys(): Promise<string[]>;
}
```

## Plugin Lifecycle

### Initialization

```typescript
export async function initialize(context: PluginContext): Promise<void> {
  // Access APIs
  const { timeline, media, ui, storage } = context.apis;
  
  // Register event listeners
  context.events.on('timeline:change', handleTimelineChange);
  
  // Register UI components
  ui.registerPanel({
    id: 'my-panel',
    title: 'My Plugin Panel',
    icon: 'plugin-icon',
    component: MyPanelComponent
  });
}
```

### Event Handling

```typescript
interface PluginEvents {
  // Timeline events
  'timeline:change': (timeline: Timeline) => void;
  'timeline:play': () => void;
  'timeline:pause': () => void;
  'timeline:seek': (time: number) => void;
  
  // Selection events
  'selection:change': (items: SelectableItem[]) => void;
  
  // Media events
  'media:import': (media: MediaFile) => void;
  'media:delete': (mediaId: string) => void;
  
  // Export events
  'export:start': (options: ExportOptions) => void;
  'export:progress': (progress: number) => void;
  'export:complete': (result: ExportResult) => void;
}
```

## Advanced Features

### Custom Transitions

```typescript
interface TransitionPlugin extends TimelinePlugin {
  createTransition(
    from: VideoFrame,
    to: VideoFrame,
    progress: number,
    parameters: TransitionParameters
  ): VideoFrame;
}

// Example: Fade transition
export const fadeTransition: TransitionPlugin = {
  metadata: {
    id: 'fade-transition',
    name: 'Fade',
    category: 'transition',
    // ...
  },
  
  createTransition(from, to, progress) {
    return blendFrames(from, to, progress);
  }
};
```

### AI Integration

```typescript
interface AIPlugin extends TimelinePlugin {
  analyzeContent(media: MediaFile): Promise<AnalysisResult>;
  generateSuggestions(timeline: Timeline): Promise<Suggestion[]>;
  processWithAI(input: any): Promise<any>;
}
```

### Export Plugins

```typescript
interface ExportPlugin extends TimelinePlugin {
  export(
    timeline: Timeline,
    options: CustomExportOptions
  ): Promise<ExportResult>;
  
  getExportFormats(): ExportFormat[];
  validateOptions(options: any): ValidationResult;
}
```

## Security & Permissions

### Permission Types

```typescript
type PluginPermission = 
  | 'filesystem:read'
  | 'filesystem:write'
  | 'media:read'
  | 'media:write'
  | 'network:request'
  | 'system:info'
  | 'ui:modify';
```

### Sandboxing

Plugins run in a sandboxed environment with restricted access:

```typescript
// ❌ Not allowed
import fs from 'fs'; // Direct filesystem access

// ✅ Use provided APIs
const { filesystem } = context.apis;
const content = await filesystem.readFile(path);
```

## Testing Plugins

### Test Framework

```typescript
import { createTestContext } from '@timeline-studio/plugin-test';

describe('My Plugin', () => {
  let context: PluginContext;
  
  beforeEach(() => {
    context = createTestContext();
  });
  
  test('should process frames correctly', async () => {
    const result = await myPlugin.execute(context);
    expect(result.success).toBe(true);
  });
});
```

## Publishing Plugins

### Package Structure
```
my-plugin/
├── package.json
├── manifest.json
├── README.md
├── LICENSE
├── dist/
│   └── index.js
└── assets/
    └── icon.png
```

### Publishing to Marketplace

```bash
# Build plugin
npm run build

# Validate plugin
timeline-studio validate-plugin .

# Publish
timeline-studio publish-plugin
```

## Examples

### Simple Effect Plugin

```typescript
export const vintageEffect: TimelinePlugin = {
  metadata: {
    id: 'vintage-effect',
    name: 'Vintage Film',
    version: '1.0.0',
    category: 'effect',
    permissions: ['media:write']
  },
  
  async initialize() {
    console.log('Vintage effect initialized');
  },
  
  async execute(context) {
    const { media, timeline } = context.apis;
    const selectedClips = timeline.getSelectedClips();
    
    for (const clip of selectedClips) {
      await media.processMedia(clip.mediaId, async (frame) => {
        // Apply vintage effect
        return applyVintageFilter(frame);
      });
    }
    
    return { success: true };
  }
};
```

---

*For more examples and templates, visit the [Plugin Development Guide](../05_DEVELOPMENT/PLUGIN_development.md)*