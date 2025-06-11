# Timeline Studio - Tauri Backend Development Guide

## Overview

This document provides comprehensive information about the Timeline Studio Tauri backend development, including architecture, testing strategies, capabilities, and code coverage guidelines.

## Architecture

The Tauri backend is built with Rust and provides native desktop capabilities for the Timeline Studio application. Key architectural components:

### Core Modules

1. **Filesystem Module** (`src/filesystem.rs`)
   - File operations: reading, writing, searching
   - Directory management
   - File metadata retrieval
   - Cross-platform path handling

2. **Media Module** (`src/media/`)
   - `metadata.rs` - FFmpeg-based media file analysis
   - `ffmpeg.rs` - FFmpeg integration and validation
   - `types.rs` - Media data structures

3. **Video Compiler** (`src/video_compiler/`)
   - `commands.rs` - Tauri command handlers
   - `cache.rs` - LRU cache for previews and metadata
   - `frame_extraction.rs` - Frame extraction for various purposes
   - `preview.rs` - Video preview generation
   - `builder.rs` - FFmpeg command building
   - `progress.rs` - Render progress tracking
   - `schema.rs` - Project schema definitions

4. **Video Server** (`src/video_server/`)
   - HTTP server for video streaming
   - Range request support
   - CORS configuration
   - Video file registration

## Development Setup

### Prerequisites

- Rust 1.70+ with cargo
- FFmpeg installed and accessible in PATH
- Node.js 18+ (for frontend integration)
- Tauri CLI: `cargo install tauri-cli`

### Running in Development

```bash
# Run tests
cargo test

# Run with coverage
cargo tarpaulin --workspace

# Run specific test
cargo test test_name

# Run Tauri in development mode
cargo tauri dev
```

## Testing Strategy

### Unit Tests

Each module should have comprehensive unit tests covering:

1. **Happy path scenarios** - Normal expected behavior
2. **Edge cases** - Boundary conditions, empty inputs
3. **Error handling** - Invalid inputs, system failures
4. **Serialization** - JSON serialization/deserialization
5. **State management** - Concurrent access, mutations

### Test Organization

Tests are organized in two ways:

1. **Inline tests** - Small modules have tests at the bottom of the file
   ```rust
   #[cfg(test)]
   mod tests {
       use super::*;
       // tests here
   }
   ```

2. **Separate test files** - Larger modules use `tests.rs` in the same directory
   ```
   src/
   ├── media/
   │   ├── metadata.rs
   │   └── metadata/
   │       └── tests.rs
   ```

### Mocking Guidelines

- Use conditional compilation for platform-specific tests
- Mock external dependencies (FFmpeg, file system)
- Create test fixtures with `tempfile` crate
- Avoid hardcoded paths - use temporary directories

## Code Coverage

### Current Status

As of the latest measurement:
- Overall coverage: 42.62%
- Target coverage: 90%
- Total lines covered: 1464/3435

### Coverage by Module

| Module | Coverage | Lines Covered | Priority |
|--------|----------|---------------|----------|
| filesystem.rs | 90.74% | 49/54 | Completed |
| language.rs | 90.91% | 20/22 | Completed |
| media/metadata.rs | 69.66% | 62/89 | High |
| media/ffmpeg.rs | 80.00% | 4/5 | Low |
| media/files.rs | 100.00% | 11/11 | Completed |
| video_compiler/commands.rs | 20.34% | 72/354 | Critical |
| video_compiler/cache.rs | 95.31% | 122/128 | Completed |
| video_compiler/error.rs | 98.52% | 133/135 | Completed |
| video_compiler/ffmpeg_builder.rs | 21.71% | 208/958 | Critical |
| video_compiler/frame_extraction.rs | 45.32% | 92/203 | Medium |
| video_compiler/gpu.rs | 40.96% | 77/188 | Medium |
| video_compiler/pipeline.rs | 32.10% | 147/458 | High |
| video_compiler/preview.rs | 40.77% | 95/233 | Medium |
| video_compiler/progress.rs | 74.49% | 146/196 | Low |
| video_compiler/renderer.rs | 82.86% | 58/70 | Low |
| video_compiler/schema.rs | 71.43% | 95/133 | Low |
| video_server/server.rs | 68.92% | 51/74 | Low |
| lib.rs | 4.60% | 4/87 | Critical |
| main.rs | 0.00% | 0/2 | N/A |

### Improving Coverage

1. **Identify untested code**
   ```bash
   cargo tarpaulin --workspace --ignore-tests
   ```

2. **Generate HTML report**
   ```bash
   cargo tarpaulin --workspace --html
   ```

3. **Focus areas**
   - Command handlers
   - Error paths
   - Async operations
   - Cache operations

## Tauri Capabilities

### Security Capabilities

The application uses Tauri's capability system for security. Key capabilities:

1. **File System Access**
   - Read/write to user-selected directories
   - Project file management
   - Media file imports

2. **Shell Commands**
   - FFmpeg execution for video processing
   - System information queries

3. **HTTP Client**
   - API communications
   - Update checking

4. **Window Management**
   - Multi-window support
   - Custom window controls

### Command Structure

Tauri commands follow this pattern:

```rust
#[tauri::command]
pub async fn command_name(
    state: State<'_, AppState>,
    param1: String,
    param2: Option<i32>
) -> Result<ReturnType, String> {
    // Implementation
}
```

### State Management

- Use `Arc<RwLock<T>>` for shared mutable state
- Implement `Default` for state types
- Keep state minimal and focused

## Performance Considerations

### Caching Strategy

1. **Preview Cache**
   - LRU eviction
   - TTL: 1 hour
   - Max entries: 1000

2. **Metadata Cache**
   - TTL: 30 minutes
   - Max entries: 500

3. **Render Cache**
   - TTL: 2 hours
   - Max entries: 100

### Memory Management

- Monitor cache memory usage
- Implement cleanup on memory pressure
- Use streaming for large files
- Batch operations when possible

## Error Handling

### Error Types

1. **User Errors** - Invalid input, missing files
2. **System Errors** - FFmpeg failures, I/O errors
3. **Network Errors** - API timeouts, connection issues

### Error Propagation

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum VideoError {
    #[error("FFmpeg not found")]
    FfmpegNotFound,
    
    #[error("Invalid video format: {0}")]
    InvalidFormat(String),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
}
```

## FFmpeg Integration

### Command Building

Use the builder pattern for FFmpeg commands:

```rust
let command = FfmpegCommandBuilder::new()
    .input(video_path)
    .video_codec("libx264")
    .audio_codec("aac")
    .output(output_path)
    .build();
```

### Hardware Acceleration

- Detect available encoders
- Prefer hardware encoding when available
- Fallback to software encoding

## Debugging

### Logging

```rust
use log::{debug, info, warn, error};

info!("Processing video: {}", path);
debug!("FFmpeg command: {:?}", command);
warn!("Fallback to software encoding");
error!("Failed to extract frame: {}", e);
```

### Environment Variables

- `RUST_LOG=debug` - Enable debug logging
- `TAURI_DEBUG=1` - Enable Tauri debug mode
- `FFMPEG_PATH=/custom/path` - Override FFmpeg location

## CI/CD Considerations

### Pre-commit Checks

1. `cargo fmt -- --check`
2. `cargo clippy -- -D warnings`
3. `cargo test`
4. `cargo tarpaulin --fail-under 80`

### Release Process

1. Update version in `Cargo.toml`
2. Run full test suite
3. Generate release build
4. Sign with appropriate certificates

## Common Patterns

### Async Command Pattern

```rust
#[tauri::command]
pub async fn async_operation(
    state: State<'_, AppState>
) -> Result<String, String> {
    let state = state.0.clone();
    
    tokio::spawn(async move {
        // Long running operation
    });
    
    Ok("Started".to_string())
}
```

### Progress Reporting

```rust
pub struct Progress {
    tx: mpsc::Sender<ProgressUpdate>,
}

impl Progress {
    pub async fn update(&self, percent: f32) {
        let _ = self.tx.send(ProgressUpdate {
            percent,
            message: None,
        }).await;
    }
}
```

## Resources

- [Tauri Documentation](https://tauri.app/docs)
- [Rust Book](https://doc.rust-lang.org/book/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [Tokio Documentation](https://tokio.rs/tokio/tutorial)

## Contributing

1. Follow Rust naming conventions
2. Add tests for new functionality
3. Update documentation
4. Ensure coverage doesn't decrease
5. Run formatter before committing