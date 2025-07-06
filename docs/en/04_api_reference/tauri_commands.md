# TAURI COMMANDS API REFERENCE

## Overview

This document describes all available Tauri commands that can be invoked from the frontend.

## Command Structure

```typescript
import { invoke } from '@tauri-apps/api/core';

// Basic invocation
const result = await invoke('command_name', { 
  param1: value1,
  param2: value2 
});
```

## 📁 File System Commands

### `read_file`
Reads a file from the filesystem.

```typescript
const content = await invoke<string>('read_file', {
  path: string
});
```

### `write_file`
Writes content to a file.

```typescript
await invoke('write_file', {
  path: string,
  content: string
});
```

### `list_directory`
Lists files in a directory.

```typescript
interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

const files = await invoke<FileInfo[]>('list_directory', {
  path: string
});
```

## 🎥 Media Commands

### `analyze_media`
Analyzes media file metadata using FFmpeg.

```typescript
interface MediaMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  codec: string;
  bitrate: number;
  audio_tracks: AudioTrack[];
}

const metadata = await invoke<MediaMetadata>('analyze_media', {
  path: string
});
```

### `generate_thumbnail`
Generates a thumbnail for a video file.

```typescript
const thumbnailPath = await invoke<string>('generate_thumbnail', {
  video_path: string,
  output_path: string,
  timestamp: number // in seconds
});
```

### `extract_frame`
Extracts a single frame from video.

```typescript
const framePath = await invoke<string>('extract_frame', {
  video_path: string,
  output_path: string,
  frame_number: number
});
```

## 🎬 Video Processing Commands

### `start_render`
Starts video rendering process.

```typescript
interface RenderOptions {
  timeline: TimelineData;
  output_path: string;
  format: 'mp4' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high' | 'ultra';
  resolution: { width: number; height: number };
  fps: number;
  gpu_acceleration: boolean;
}

const taskId = await invoke<string>('start_render', {
  options: RenderOptions
});
```

### `get_render_progress`
Gets progress of ongoing render.

```typescript
interface RenderProgress {
  task_id: string;
  progress: number; // 0-100
  eta: number; // seconds
  fps: number;
  status: 'rendering' | 'encoding' | 'complete' | 'error';
}

const progress = await invoke<RenderProgress>('get_render_progress', {
  task_id: string
});
```

### `cancel_render`
Cancels ongoing render task.

```typescript
await invoke('cancel_render', {
  task_id: string
});
```

## 🔐 Security Commands

### `store_api_key`
Securely stores an API key.

```typescript
await invoke('store_api_key', {
  service: 'openai' | 'claude' | 'youtube' | 'tiktok',
  key: string
});
```

### `get_api_key`
Retrieves a stored API key.

```typescript
const key = await invoke<string>('get_api_key', {
  service: string
});
```

### `validate_api_key`
Validates an API key with the service.

```typescript
const isValid = await invoke<boolean>('validate_api_key', {
  service: string,
  key: string
});
```

## 🌐 OAuth Commands

### `start_oauth_flow`
Initiates OAuth authentication flow.

```typescript
interface OAuthResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

const tokens = await invoke<OAuthResult>('start_oauth_flow', {
  provider: 'youtube' | 'tiktok' | 'vimeo' | 'telegram'
});
```

### `refresh_oauth_token`
Refreshes an expired OAuth token.

```typescript
const newTokens = await invoke<OAuthResult>('refresh_oauth_token', {
  provider: string,
  refresh_token: string
});
```

## 📤 Export Commands

### `export_to_social`
Exports video directly to social media.

```typescript
interface SocialExportOptions {
  video_path: string;
  platform: 'youtube' | 'tiktok' | 'vimeo' | 'telegram';
  title: string;
  description: string;
  tags: string[];
  privacy: 'public' | 'private' | 'unlisted';
}

const uploadId = await invoke<string>('export_to_social', {
  options: SocialExportOptions
});
```

## 🤖 AI Commands

### `analyze_scene`
Performs AI scene analysis.

```typescript
interface SceneAnalysis {
  scenes: Array<{
    start: number;
    end: number;
    type: string;
    confidence: number;
    objects: string[];
  }>;
}

const analysis = await invoke<SceneAnalysis>('analyze_scene', {
  video_path: string
});
```

### `detect_objects`
Detects objects in video using YOLO.

```typescript
interface Detection {
  frame: number;
  objects: Array<{
    label: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

const detections = await invoke<Detection[]>('detect_objects', {
  video_path: string,
  model: 'yolov8' | 'yolov11'
});
```

### `transcribe_audio`
Transcribes audio using Whisper.

```typescript
interface Transcription {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  language: string;
}

const transcription = await invoke<Transcription>('transcribe_audio', {
  audio_path: string,
  language: string | null // null for auto-detect
});
```

## 📊 Project Commands

### `save_project`
Saves the current project.

```typescript
await invoke('save_project', {
  project_data: ProjectSchema,
  path: string
});
```

### `load_project`
Loads a project file.

```typescript
const project = await invoke<ProjectSchema>('load_project', {
  path: string
});
```

### `get_recent_projects`
Gets list of recent projects.

```typescript
interface RecentProject {
  path: string;
  name: string;
  last_modified: number;
  thumbnail: string;
}

const projects = await invoke<RecentProject[]>('get_recent_projects');
```

## 🎛️ System Commands

### `get_system_info`
Gets system information.

```typescript
interface SystemInfo {
  os: string;
  arch: string;
  cpu_cores: number;
  memory_total: number;
  gpu: {
    name: string;
    vram: number;
    cuda: boolean;
    nvenc: boolean;
  };
}

const info = await invoke<SystemInfo>('get_system_info');
```

### `get_app_version`
Gets application version.

```typescript
const version = await invoke<string>('get_app_version');
```

## Error Handling

All commands can throw errors that should be handled:

```typescript
try {
  const result = await invoke('command_name', { /* params */ });
} catch (error) {
  console.error('Command failed:', error);
  // Handle error appropriately
}
```

Common error types:
- `FileNotFound` - File or directory doesn't exist
- `PermissionDenied` - Insufficient permissions
- `InvalidInput` - Invalid parameters
- `ProcessingError` - Error during processing
- `NetworkError` - Network-related errors

## Events

Some commands emit events for progress updates:

```typescript
import { listen } from '@tauri-apps/api/event';

// Listen for render progress
const unlisten = await listen('render-progress', (event) => {
  console.log('Progress:', event.payload);
});

// Clean up when done
unlisten();
```

---

*For implementation details, see the Rust source code in `src-tauri/src/commands/`*