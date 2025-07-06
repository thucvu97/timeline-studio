# FFmpeg Integration

## Overview

FFmpeg is the main tool for video processing in Timeline Studio. This document describes the integration, command building, and best practices.

## Command Building

### Builder Pattern

Use the builder pattern for FFmpeg commands:

```rust
let command = FfmpegCommandBuilder::new()
    .input(video_path)
    .video_codec("libx264")
    .audio_codec("aac")
    .output(output_path)
    .build();
```

### Command Structure

```rust
pub struct FfmpegCommand {
    inputs: Vec<Input>,
    outputs: Vec<Output>,
    global_options: Vec<String>,
    filters: Option<FilterGraph>,
}
```

## Hardware Acceleration

### Detecting Available Encoders

```rust
pub async fn detect_hardware_encoders() -> Vec<HardwareEncoder> {
    let mut encoders = vec![];
    
    // NVIDIA NVENC
    if check_encoder_available("h264_nvenc").await {
        encoders.push(HardwareEncoder::Nvenc);
    }
    
    // Intel Quick Sync
    if check_encoder_available("h264_qsv").await {
        encoders.push(HardwareEncoder::QuickSync);
    }
    
    // AMD AMF
    if check_encoder_available("h264_amf").await {
        encoders.push(HardwareEncoder::Amf);
    }
    
    // Apple VideoToolbox
    if check_encoder_available("h264_videotoolbox").await {
        encoders.push(HardwareEncoder::VideoToolbox);
    }
    
    encoders
}
```

### Encoder Selection Strategy

1. Prefer hardware encoding when available
2. Automatic fallback to software encoding
3. Quality settings based on encoder

## Video Processing

### Frame Extraction

```rust
pub async fn extract_frame(
    video_path: &Path,
    timestamp: f64,
    output_format: ImageFormat,
) -> Result<Vec<u8>> {
    let mut cmd = Command::new("ffmpeg");
    
    cmd.args(&[
        "-ss", &timestamp.to_string(),
        "-i", video_path.to_str().unwrap(),
        "-frames:v", "1",
        "-f", "image2pipe",
        "-vcodec", output_format.to_codec(),
        "-",
    ]);
    
    let output = cmd.output().await?;
    
    if !output.status.success() {
        return Err(VideoCompilerError::FFmpegError {
            exit_code: output.status.code(),
            stderr: String::from_utf8_lossy(&output.stderr).to_string(),
            command: format!("{:?}", cmd),
        });
    }
    
    Ok(output.stdout)
}
```

### Preview Generation

```rust
pub async fn generate_preview(
    video_path: &Path,
    output_path: &Path,
    duration: f64,
    scale: Option<(u32, u32)>,
) -> Result<()> {
    let mut builder = FfmpegCommandBuilder::new()
        .input(video_path)
        .duration(duration);
    
    if let Some((width, height)) = scale {
        builder = builder.video_filter(&format!("scale={}:{}", width, height));
    }
    
    builder
        .video_codec("libx264")
        .preset("ultrafast")
        .output(output_path)
        .execute()
        .await
}
```

### Project Rendering

```rust
pub async fn render_project(
    project: &ProjectSchema,
    output_path: &Path,
    progress_callback: impl Fn(f32),
) -> Result<()> {
    let pipeline = RenderPipeline::new(project);
    
    // Stage 1: Media preparation
    pipeline.prepare_media().await?;
    progress_callback(0.2);
    
    // Stage 2: Apply effects
    pipeline.apply_effects().await?;
    progress_callback(0.4);
    
    // Stage 3: Compositing
    pipeline.composite_layers().await?;
    progress_callback(0.6);
    
    // Stage 4: Final encoding
    pipeline.encode_output(output_path).await?;
    progress_callback(1.0);
    
    Ok(())
}
```

## Filters and Effects

### Building Filter Graph

```rust
pub struct FilterGraph {
    nodes: Vec<FilterNode>,
    connections: Vec<Connection>,
}

impl FilterGraph {
    pub fn to_string(&self) -> String {
        // Generate filter string for FFmpeg
        let mut parts = vec![];
        
        for node in &self.nodes {
            parts.push(node.to_string());
        }
        
        parts.join(",")
    }
}
```

### Filter Examples

```rust
// Scale
filter_graph.add_filter("scale", &["640:480"]);

// Color correction
filter_graph.add_filter("eq", &["brightness=0.1:contrast=1.2"]);

// Text overlay
filter_graph.add_filter("drawtext", &[
    "text='Timeline Studio'",
    "fontsize=24",
    "fontcolor=white",
    "x=(w-text_w)/2",
    "y=h-50"
]);

// Transitions
filter_graph.add_filter("xfade", &[
    "transition=fade",
    "duration=1",
    "offset=5"
]);
```

## Error Handling

### FFmpeg Error Types

```rust
pub enum FFmpegError {
    NotFound,
    InvalidInput(String),
    CodecNotSupported(String),
    OutOfMemory,
    InvalidParameters(String),
    Unknown(String),
}
```

### Parsing FFmpeg Output

```rust
pub fn parse_ffmpeg_error(stderr: &str) -> FFmpegError {
    if stderr.contains("No such file") {
        FFmpegError::InvalidInput("File not found".to_string())
    } else if stderr.contains("Unknown encoder") {
        FFmpegError::CodecNotSupported("Codec not supported".to_string())
    } else if stderr.contains("out of memory") {
        FFmpegError::OutOfMemory
    } else {
        FFmpegError::Unknown(stderr.to_string())
    }
}
```

## Performance Optimization

### Multithreading

```rust
// Use all available cores
builder.add_option("-threads", "0");

// Or specific count
let cpu_count = num_cpus::get();
builder.add_option("-threads", &cpu_count.to_string());
```

### Encoding Presets

```rust
pub enum EncodingPreset {
    UltraFast,  // Fast render, larger size
    Fast,       // Balance of speed and quality
    Medium,     // Default
    Slow,       // Better quality, slower
    VerySlow,   // Maximum quality
}

impl EncodingPreset {
    pub fn to_ffmpeg_preset(&self) -> &'static str {
        match self {
            Self::UltraFast => "ultrafast",
            Self::Fast => "fast",
            Self::Medium => "medium",
            Self::Slow => "slow",
            Self::VerySlow => "veryslow",
        }
    }
}
```

### Streaming Optimization

```rust
// For web streaming
builder
    .add_option("-movflags", "+faststart")
    .add_option("-pix_fmt", "yuv420p")
    .video_codec("libx264")
    .add_option("-profile:v", "baseline")
    .add_option("-level", "3.0");
```

## Progress Monitoring

### Progress Parsing

```rust
pub fn parse_progress(line: &str) -> Option<Progress> {
    // frame=  123 fps=45.6 q=28.0 size=    1024kB time=00:00:05.12 bitrate=1638.4kbits/s
    
    let time_regex = Regex::new(r"time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})").unwrap();
    
    if let Some(captures) = time_regex.captures(line) {
        let hours: f64 = captures[1].parse().unwrap_or(0.0);
        let minutes: f64 = captures[2].parse().unwrap_or(0.0);
        let seconds: f64 = captures[3].parse().unwrap_or(0.0);
        let centiseconds: f64 = captures[4].parse().unwrap_or(0.0);
        
        let current_time = hours * 3600.0 + minutes * 60.0 + seconds + centiseconds / 100.0;
        
        return Some(Progress {
            current_time,
            percent: current_time / total_duration,
        });
    }
    
    None
}
```

## Environment Variables

- `FFMPEG_PATH=/custom/path` - Override FFmpeg location
- `FFMPEG_THREADS=8` - Number of threads
- `FFMPEG_LOGLEVEL=debug` - Logging level

## Best Practices

1. **Input validation** - Verify files before processing
2. **Resource management** - Limit parallel operations
3. **Temporary files** - Use unique names and clean up after use
4. **Logging** - Log FFmpeg commands for debugging
5. **Testing** - Mock FFmpeg in unit tests