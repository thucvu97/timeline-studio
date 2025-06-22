# Error Handling Documentation

## Overview

Timeline Studio backend uses a comprehensive error handling system based on the `VideoCompilerError` enum, providing detailed error information and recovery suggestions.

## Error Types

### Core Error Types (`video_compiler/core/error.rs`)

```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum VideoCompilerError {
    // Validation and Schema Errors
    ValidationError(String),
    
    // FFmpeg Related
    FFmpegError {
        exit_code: Option<i32>,
        stderr: String,
        command: String,
    },
    
    // Dependencies
    DependencyMissing(String),
    
    // I/O Operations
    IoError(String),
    
    // Media Processing
    MediaFileError { path: String, reason: String },
    UnsupportedFormat { format: String, file_path: String },
    
    // Rendering
    RenderError {
        job_id: String,
        stage: String,
        message: String,
    },
    
    // Preview Generation
    PreviewError { timestamp: f64, reason: String },
    
    // Cache Operations
    CacheError(String),
    
    // Configuration
    ConfigError(String),
    
    // Resource Management
    ResourceError {
        resource_type: String,
        available: String,
        required: String,
    },
    
    // Timeouts
    TimeoutError {
        operation: String,
        timeout_seconds: u64,
    },
    
    // User Actions
    CancelledError(String),
    
    // GPU Processing
    GpuError(String),
    GpuUnavailable(String),
    
    // Template Processing
    TemplateNotFound(String),
    
    // Invalid Parameters
    InvalidParameter(String),
    
    // Not Implemented
    NotImplemented(String),
    
    // Path Validation
    InvalidPath(String),
    
    // Concurrency Limits
    TooManyActiveJobs(String),
}
```

## Error Handling Patterns

### 1. Service Layer Error Handling

Services use Result<T> type with VideoCompilerError:

```rust
pub async fn generate_preview(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // Validate inputs
    if !video_path.exists() {
        return Err(VideoCompilerError::MediaFileError {
            path: video_path.to_string_lossy().to_string(),
            reason: "File not found".to_string(),
        });
    }
    
    // Process with error conversion
    let result = ffmpeg_operation().await
        .map_err(|e| VideoCompilerError::FFmpegError {
            exit_code: e.code(),
            stderr: e.stderr(),
            command: "generate_preview".to_string(),
        })?;
    
    Ok(result)
}
```

### 2. Command Layer Error Handling

Commands convert errors to user-friendly messages:

```rust
#[tauri::command]
pub async fn render_video(
    state: State<'_, VideoCompilerState>,
    project_id: String,
) -> Result<String> {
    match state.render_service.render(&project_id).await {
        Ok(job_id) => Ok(job_id),
        Err(e) => {
            log::error!("Render failed: {}", e);
            match e {
                VideoCompilerError::TooManyActiveJobs(_) => {
                    Err("Please wait for current renders to complete".into())
                }
                VideoCompilerError::MediaFileError { path, .. } => {
                    Err(format!("Media file missing: {}", path).into())
                }
                _ => Err(format!("Render failed: {}", e).into())
            }
        }
    }
}
```

### 3. FFmpeg Error Handling

Special handling for FFmpeg operations:

```rust
impl FFmpegExecutor {
    pub async fn execute(&self, command: Command) -> Result<FFmpegExecutionResult> {
        let output = command.output().await
            .map_err(|e| VideoCompilerError::DependencyMissing(
                format!("FFmpeg not found: {}", e)
            ))?;
        
        if !output.status.success() {
            return Err(VideoCompilerError::FFmpegError {
                exit_code: output.status.code(),
                stderr: String::from_utf8_lossy(&output.stderr).to_string(),
                command: format!("{:?}", command),
            });
        }
        
        Ok(FFmpegExecutionResult { ... })
    }
}
```

## Error Recovery Strategies

### 1. Automatic Retry

For transient errors:

```rust
async fn with_retry<T, F>(
    operation: F,
    max_attempts: u32,
) -> Result<T>
where
    F: Fn() -> Future<Output = Result<T>>,
{
    let mut last_error = None;
    
    for attempt in 1..=max_attempts {
        match operation().await {
            Ok(result) => return Ok(result),
            Err(e) => {
                log::warn!("Attempt {} failed: {}", attempt, e);
                last_error = Some(e);
                
                // Only retry certain error types
                match &e {
                    VideoCompilerError::IoError(_) |
                    VideoCompilerError::TimeoutError { .. } => {
                        tokio::time::sleep(Duration::from_secs(attempt as u64)).await;
                    }
                    _ => break, // Don't retry other errors
                }
            }
        }
    }
    
    Err(last_error.unwrap())
}
```

### 2. Fallback Strategies

For preview generation:

```rust
async fn generate_preview_with_fallback(
    &self,
    video_path: &Path,
    timestamp: f64,
) -> Result<Vec<u8>> {
    // Try hardware-accelerated preview
    match self.generate_hw_preview(video_path, timestamp).await {
        Ok(data) => return Ok(data),
        Err(VideoCompilerError::GpuUnavailable(_)) => {
            log::info!("GPU unavailable, falling back to software rendering");
        }
        Err(e) => return Err(e),
    }
    
    // Fallback to software rendering
    self.generate_sw_preview(video_path, timestamp).await
}
```

### 3. Resource Cleanup

Ensure cleanup on errors:

```rust
pub async fn render_with_cleanup(
    &self,
    project: &ProjectSchema,
) -> Result<String> {
    let temp_dir = create_temp_dir().await?;
    
    let result = async {
        // Rendering operations
        render_internal(project, &temp_dir).await
    }.await;
    
    // Always cleanup, even on error
    if let Err(e) = remove_temp_dir(&temp_dir).await {
        log::warn!("Failed to cleanup temp dir: {}", e);
    }
    
    result
}
```

## Error Monitoring

Errors are automatically tracked by the monitoring system:

```rust
let tracker = self.metrics.start_operation("render");
match self.render_internal().await {
    Ok(result) => {
        tracker.complete().await;
        Ok(result)
    }
    Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[RenderService] Error: {}", e);
        
        // Update error statistics
        self.metrics.increment_error_count("render", &e);
        
        Err(e)
    }
}
```

## Best Practices

### 1. Use Specific Error Types

Prefer specific error variants over generic ones:

```rust
// Good
Err(VideoCompilerError::MediaFileError {
    path: video_path.to_string(),
    reason: "Unsupported codec: h265".to_string(),
})

// Bad
Err(VideoCompilerError::Unknown("Failed to process video".to_string()))
```

### 2. Include Context

Always provide context in error messages:

```rust
// Good
Err(VideoCompilerError::RenderError {
    job_id: job_id.clone(),
    stage: "encoding".to_string(),
    message: format!("Failed to encode segment {} of {}", current, total),
})

// Bad
Err(VideoCompilerError::RenderError {
    job_id: "".to_string(),
    stage: "".to_string(),
    message: "Encoding failed".to_string(),
})
```

### 3. Log Errors Appropriately

Use appropriate log levels:

```rust
match operation().await {
    Ok(result) => Ok(result),
    Err(e) => {
        match &e {
            VideoCompilerError::CancelledError(_) => {
                log::info!("Operation cancelled by user: {}", e);
            }
            VideoCompilerError::ValidationError(_) => {
                log::warn!("Validation error: {}", e);
            }
            VideoCompilerError::FFmpegError { .. } |
            VideoCompilerError::IoError(_) => {
                log::error!("Critical error: {}", e);
            }
            _ => {
                log::error!("Unexpected error: {}", e);
            }
        }
        Err(e)
    }
}
```

### 4. User-Friendly Messages

Convert technical errors to user-friendly messages at the command layer:

```rust
fn user_message_for_error(error: &VideoCompilerError) -> String {
    match error {
        VideoCompilerError::DependencyMissing(_) => {
            "Required software is not installed. Please check the installation guide.".to_string()
        }
        VideoCompilerError::MediaFileError { path, .. } => {
            format!("Cannot access media file: {}", path.file_name().unwrap_or_default())
        }
        VideoCompilerError::ResourceError { resource_type, available, required } => {
            format!("Insufficient {}: {} available, {} required", resource_type, available, required)
        }
        _ => "An error occurred. Please check the logs for details.".to_string()
    }
}
```

## Testing Error Handling

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_missing_file_error() {
        let service = PreviewService::new();
        let result = service.generate_preview(
            Path::new("/non/existent/file.mp4"),
            0.0
        ).await;
        
        assert!(matches!(
            result,
            Err(VideoCompilerError::MediaFileError { .. })
        ));
    }
    
    #[tokio::test]
    async fn test_invalid_timestamp_error() {
        let service = PreviewService::new();
        let result = service.generate_preview(
            Path::new("test.mp4"),
            -5.0  // Invalid timestamp
        ).await;
        
        assert!(matches!(
            result,
            Err(VideoCompilerError::InvalidParameter(_))
        ));
    }
}
```

### Integration Tests

Test error propagation through layers:

```rust
#[tokio::test]
async fn test_command_error_handling() {
    let state = create_test_state().await;
    
    // Test with invalid project
    let result = generate_preview_command(
        State(&state),
        "invalid_project_id".to_string(),
        0.0
    ).await;
    
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Project not found"));
}
```

## Common Error Scenarios

### 1. Missing Media Files

When project references files that have been moved/deleted:
- Use MediaRestorationService to locate files
- Provide clear error messages with original paths
- Offer to update project with new paths

### 2. FFmpeg Failures

Common FFmpeg errors and handling:
- Missing codecs: Suggest installation instructions
- Invalid parameters: Validate before execution
- Out of memory: Reduce quality/resolution settings

### 3. Resource Exhaustion

Handle system resource limits:
- Disk space: Check before rendering
- Memory: Monitor and limit concurrent operations
- GPU: Fallback to CPU processing

### 4. Concurrent Operation Limits

Prevent system overload:
- Queue excess operations
- Provide queue position feedback
- Allow operation cancellation

## Future Improvements

1. **Error Recovery Database**: Store common errors and their solutions
2. **Automatic Error Reporting**: Opt-in telemetry for error tracking
3. **Smart Retry Logic**: ML-based retry decisions based on error patterns
4. **Error Aggregation**: Group similar errors for batch resolution
5. **Self-Healing**: Automatic fixes for common issues (cache cleanup, temp file removal)