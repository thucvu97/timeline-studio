# Timeline Studio - Tauri Backend

## Overview

This is the Rust backend for Timeline Studio, built with Tauri v2. It provides native functionality for video processing, file management, and a local HTTP server for video streaming.

## Architecture

### Modules

- **`video_server`** - HTTP server for video streaming with Range request support
- **`video_compiler`** - FFmpeg-based video rendering and processing
- **`media`** - Media file metadata extraction using FFprobe
- **`filesystem`** - File system operations and path utilities
- **`language`** - Localization and language detection

### Key Features

1. **Video Streaming Server**
   - Runs on `http://localhost:4567`
   - Supports Range requests for video seeking
   - Handles Cyrillic and special characters in file paths
   - CORS enabled for web access

2. **Video Compiler**
   - Hardware acceleration support (NVENC, QuickSync, VideoToolbox)
   - Frame extraction for thumbnails
   - Preview generation
   - Render caching

3. **Media Processing**
   - FFprobe integration for metadata extraction
   - Support for various video formats (MP4, WebM, MOV, AVI, MKV)
   - Audio track detection

## Development

### Prerequisites

- Rust 1.70+
- FFmpeg 7.0+ (for video processing)
- Node.js 18+ (for frontend)

### Setup

```bash
# Install dependencies
cargo build

# Run tests
cargo test

# Run with coverage
cargo tarpaulin --out Html --output-dir coverage
```

### Testing

We use `tarpaulin` for code coverage:

```bash
# Install tarpaulin
cargo install cargo-tarpaulin

# Run tests with coverage
cargo tarpaulin --out Html --output-dir coverage

# Generate coverage report in different formats
cargo tarpaulin --out Xml --out Lcov --output-dir coverage

# Exclude certain files from coverage
cargo tarpaulin --exclude-files "*/tests/*" --exclude-files "*/build.rs"
```

### Project Structure

```
src-tauri/
├── src/
│   ├── main.rs              # Entry point
│   ├── lib.rs               # Tauri app configuration
│   ├── video_server.rs      # HTTP video streaming server
│   ├── media/               # Media processing module
│   ├── filesystem/          # File system utilities
│   ├── language/            # Localization
│   └── video_compiler/      # Video rendering engine
├── tests/                   # Integration tests
├── Cargo.toml              # Dependencies
└── tauri.conf.json         # Tauri configuration
```

## API Commands

### Video Server

- `register_video(path: String)` - Register a video file and get streaming URL

### Media

- `get_media_metadata(file_path: String)` - Extract video metadata using FFprobe
- `get_media_files(directory: String)` - List media files in directory

### File System

- `file_exists(path: String)` - Check if file exists
- `get_file_stats(path: String)` - Get file statistics
- `search_files_by_name(directory: String, query: String)` - Search files

### Video Compiler

- `compile_video(project: Project, output_path: String)` - Render video project
- `generate_preview(file_path: String, timestamp: f64)` - Generate video thumbnail
- `get_gpu_capabilities()` - Check available GPU encoders

## Configuration

### Video Server Port

The video server runs on port 4567 by default. To change:

```rust
// In video_server.rs
let listener = tokio::net::TcpListener::bind("127.0.0.1:4567").await?;
```

### FFmpeg Path

Set custom FFmpeg path:

```rust
invoke('set_ffmpeg_path', { path: '/usr/local/bin/ffmpeg' })
```

## Error Handling

All commands return `Result<T, String>` where errors are serialized as strings for frontend consumption.

## Performance Considerations

1. **Video Streaming**
   - Uses tokio for async I/O
   - Supports partial content for efficient streaming
   - Files are not loaded into memory

2. **Caching**
   - Preview images are cached
   - Render outputs can be cached
   - LRU eviction policy

3. **Concurrency**
   - Video server runs in separate tokio task
   - Multiple concurrent video streams supported
   - Thread pool for CPU-intensive tasks

## Security

- Video server only binds to localhost
- File paths are validated before access
- CORS configured for local development

## Troubleshooting

### Video Server Not Starting

Check if port 4567 is already in use:
```bash
lsof -i :4567
```

### FFmpeg Not Found

Ensure FFmpeg is in PATH or set explicitly:
```rust
invoke('set_ffmpeg_path', { path: '/path/to/ffmpeg' })
```

### Coverage Reports

If tarpaulin fails, try:
```bash
# Clean build
cargo clean

# Run with specific features
cargo tarpaulin --features "custom-protocol"
```

## Contributing

1. Write tests for new features
2. Maintain >90% code coverage
3. Run `cargo fmt` before committing
4. Update this README for new modules