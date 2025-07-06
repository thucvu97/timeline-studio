# Plugin Development Guide

Complete guide for creating plugins for Timeline Studio with code examples, best practices and step-by-step instructions.

## 📋 Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [Creating Your First Plugin](#creating-your-first-plugin)
3. [Plugin Architecture](#plugin-architecture)
4. [API Reference](#api-reference)
5. [Permission System](#permission-system)
6. [Plugin Testing](#plugin-testing)
7. [Performance Optimization](#performance-optimization)
8. [Publishing Plugins](#publishing-plugins)

## 🛠️ Development Environment Setup

### Installing Tools

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# 2. Install wasm-pack
cargo install wasm-pack

# 3. Add WebAssembly target
rustup target add wasm32-unknown-unknown

# 4. Install additional tools
cargo install cargo-generate    # For templates
cargo install basic-http-server # For testing
```

### Plugin Project Structure

```
my-video-plugin/
├── Cargo.toml              # Rust configuration
├── plugin.json             # Plugin metadata
├── src/
│   ├── lib.rs              # Main logic
│   ├── video.rs            # Video processing
│   └── utils.rs            # Helper functions
├── schemas/                # JSON schemas
│   ├── input.json
│   └── output.json
├── examples/               # Usage examples
│   └── sample_usage.json
├── tests/                  # Tests
│   └── integration.rs
└── README.md
```

### Cargo.toml Setup

```toml
[package]
name = "my-video-plugin"
version = "1.0.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
js-sys = "0.3"
web-sys = "0.3"

[dependencies.wasm-bindgen]
version = "0.2"
features = [
  "serde-serialize",
]

[package.metadata.wasm-pack.profile.release]
wee_alloc = false
```

## 🎯 Creating Your First Plugin

### 1. Basic Plugin Structure

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

// Main plugin structure
#[wasm_bindgen]
pub struct VideoBlurPlugin {
    initialized: bool,
}

#[wasm_bindgen]
impl VideoBlurPlugin {
    #[wasm_bindgen(constructor)]
    pub fn new() -> VideoBlurPlugin {
        VideoBlurPlugin {
            initialized: false,
        }
    }
    
    // Plugin initialization
    #[wasm_bindgen]
    pub fn initialize(&mut self) -> Result<(), JsValue> {
        if self.initialized {
            return Err(JsValue::from_str("Plugin already initialized"));
        }
        
        // Initialization logic
        console_log("VideoBlurPlugin initialized");
        self.initialized = true;
        Ok(())
    }
    
    // Main plugin command
    #[wasm_bindgen]
    pub fn apply_blur(&self, input_json: &str) -> Result<String, JsValue> {
        if !self.initialized {
            return Err(JsValue::from_str("Plugin not initialized"));
        }
        
        // Parse input data
        let input: BlurInput = serde_json::from_str(input_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;
        
        // Apply blur
        let result = self.process_blur(&input)?;
        
        // Serialize result
        serde_json::to_string(&result)
            .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
    }
    
    // Cleanup on plugin unload
    #[wasm_bindgen]
    pub fn cleanup(&mut self) {
        if self.initialized {
            console_log("VideoBlurPlugin cleanup");
            self.initialized = false;
        }
    }
}

// Input data for blur command
#[derive(Deserialize)]
struct BlurInput {
    intensity: f32,
    frame_data: Vec<u8>,
    width: u32,
    height: u32,
    format: String,
}

// Processing result
#[derive(Serialize)]
struct BlurOutput {
    processed_frame: Vec<u8>,
    processing_time_ms: f64,
    metadata: BlurMetadata,
}

#[derive(Serialize)]
struct BlurMetadata {
    applied_intensity: f32,
    algorithm: String,
    performance_stats: PerformanceStats,
}

#[derive(Serialize)]
struct PerformanceStats {
    pixels_processed: u32,
    memory_used_kb: u32,
    cpu_time_ms: f64,
}

impl VideoBlurPlugin {
    fn process_blur(&self, input: &BlurInput) -> Result<BlurOutput, JsValue> {
        let start_time = js_sys::Date::now();
        
        // Validate input data
        if input.intensity < 0.0 || input.intensity > 10.0 {
            return Err(JsValue::from_str("Intensity must be between 0.0 and 10.0"));
        }
        
        if input.frame_data.len() != (input.width * input.height * 3) as usize {
            return Err(JsValue::from_str("Frame data size doesn't match dimensions"));
        }
        
        // Apply blur algorithm
        let blurred_frame = apply_gaussian_blur(
            &input.frame_data,
            input.width,
            input.height,
            input.intensity
        )?;
        
        let processing_time = js_sys::Date::now() - start_time;
        
        Ok(BlurOutput {
            processed_frame: blurred_frame,
            processing_time_ms: processing_time,
            metadata: BlurMetadata {
                applied_intensity: input.intensity,
                algorithm: "Gaussian".to_string(),
                performance_stats: PerformanceStats {
                    pixels_processed: input.width * input.height,
                    memory_used_kb: (input.frame_data.len() * 2) as u32 / 1024,
                    cpu_time_ms: processing_time,
                },
            },
        })
    }
}

// Blur algorithm (simplified version)
fn apply_gaussian_blur(
    data: &[u8],
    width: u32,
    height: u32,
    intensity: f32
) -> Result<Vec<u8>, JsValue> {
    let mut result = data.to_vec();
    let kernel_size = ((intensity * 2.0) as usize + 1).max(3);
    
    // Simple blur implementation
    for y in 1..(height - 1) {
        for x in 1..(width - 1) {
            for c in 0..3 {
                let idx = ((y * width + x) * 3 + c) as usize;
                
                // Average with neighboring pixels
                let mut sum = 0u32;
                let mut count = 0u32;
                
                for dy in -(kernel_size as i32 / 2)..=(kernel_size as i32 / 2) {
                    for dx in -(kernel_size as i32 / 2)..=(kernel_size as i32 / 2) {
                        let ny = y as i32 + dy;
                        let nx = x as i32 + dx;
                        
                        if ny >= 0 && ny < height as i32 && nx >= 0 && nx < width as i32 {
                            let neighbor_idx = ((ny as u32 * width + nx as u32) * 3 + c) as usize;
                            sum += data[neighbor_idx] as u32;
                            count += 1;
                        }
                    }
                }
                
                result[idx] = (sum / count) as u8;
            }
        }
    }
    
    Ok(result)
}

// Plugin metadata
#[wasm_bindgen]
pub fn get_plugin_metadata() -> String {
    serde_json::json!({
        "name": "Video Blur Plugin",
        "version": "1.0.0",
        "author": "Timeline Studio Developer",
        "description": "Professional Gaussian blur filter for video frames",
        "license": "MIT",
        "keywords": ["video", "blur", "filter", "gaussian"],
        
        "commands": [
            {
                "name": "apply_blur",
                "description": "Apply Gaussian blur to video frame",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "intensity": {
                            "type": "number",
                            "minimum": 0.0,
                            "maximum": 10.0,
                            "description": "Blur intensity (0.0 = no blur, 10.0 = maximum blur)"
                        },
                        "frame_data": {
                            "type": "array",
                            "items": {"type": "integer", "minimum": 0, "maximum": 255},
                            "description": "RGB frame data as byte array"
                        },
                        "width": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "Frame width in pixels"
                        },
                        "height": {
                            "type": "integer", 
                            "minimum": 1,
                            "description": "Frame height in pixels"
                        },
                        "format": {
                            "type": "string",
                            "enum": ["RGB24", "RGBA32"],
                            "description": "Pixel format"
                        }
                    },
                    "required": ["intensity", "frame_data", "width", "height", "format"]
                },
                "output_schema": {
                    "type": "object",
                    "properties": {
                        "processed_frame": {
                            "type": "array",
                            "items": {"type": "integer"},
                            "description": "Processed frame data"
                        },
                        "processing_time_ms": {
                            "type": "number",
                            "description": "Processing time in milliseconds"
                        },
                        "metadata": {
                            "type": "object",
                            "description": "Processing metadata and statistics"
                        }
                    }
                }
            }
        ],
        
        "capabilities": [
            "VideoProcessing",
            "FrameManipulation"
        ],
        
        "permissions": {
            "filesystem": "TempAccess",
            "network": "NoAccess",
            "system": "TimeAccess",
            "resources": {
                "max_memory_mb": 128,
                "max_cpu_percent": 50,
                "max_execution_time": "30s",
                "max_file_size_mb": 100
            }
        },
        
        "runtime_requirements": {
            "min_timeline_studio_version": "1.0.0",
            "wasm_features": ["bulk-memory", "simd"],
            "memory_pages": 256
        }
    }).to_string()
}

// Helper functions
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

fn console_log(s: &str) {
    log(s);
}

// Initialize panic hook for debugging
#[wasm_bindgen(start)]
pub fn main() {
    console_error_panic_hook::set_once();
}
```

### 2. Plugin Compilation

```bash
# Compile to WebAssembly
wasm-pack build --target web --out-dir pkg

# Result will be in pkg/ folder
ls pkg/
# my_video_plugin.js
# my_video_plugin_bg.wasm  
# my_video_plugin.d.ts
# package.json
```

### 3. Plugin Metadata (plugin.json)

```json
{
  "manifest_version": "1.0",
  "plugin_info": {
    "id": "video-blur-plugin",
    "name": "Video Blur Plugin",
    "version": "1.0.0", 
    "author": "Timeline Studio Developer",
    "description": "Professional Gaussian blur filter for video frames",
    "license": "MIT",
    "homepage": "https://github.com/timeline-studio/plugins/video-blur",
    "repository": "https://github.com/timeline-studio/plugins/video-blur.git",
    "keywords": ["video", "blur", "filter", "gaussian", "professional"]
  },
  
  "runtime": {
    "wasm_file": "my_video_plugin_bg.wasm",
    "js_binding": "my_video_plugin.js",
    "initialization_function": "new",
    "cleanup_function": "cleanup"
  },
  
  "api_version": "1.0.0",
  "target_timeline_studio_version": ">=1.0.0",
  
  "capabilities": [
    "VideoProcessing",
    "FrameManipulation"
  ],
  
  "permissions": {
    "filesystem": {
      "type": "TempAccess",
      "description": "Access to temporary files for processing"
    },
    "network": {
      "type": "NoAccess"
    },
    "system": {
      "type": "TimeAccess",
      "description": "Access to system time for performance measurement"
    },
    "resources": {
      "max_memory_mb": 128,
      "max_cpu_percent": 50,
      "max_execution_time": "30s",
      "max_file_size_mb": 100
    }
  },
  
  "commands": [
    {
      "name": "apply_blur",
      "function": "apply_blur", 
      "description": "Apply Gaussian blur to video frame",
      "category": "filter",
      "input_schema_file": "schemas/apply_blur_input.json",
      "output_schema_file": "schemas/apply_blur_output.json",
      "example_file": "examples/apply_blur_example.json"
    }
  ],
  
  "configuration": {
    "schema_file": "schemas/config.json",
    "default_config": {
      "default_intensity": 2.0,
      "performance_mode": "balanced",
      "quality_preset": "high"
    }
  }
}
```

## 🏗️ Plugin Architecture

### Plugin Lifecycle

```rust
// Typical plugin lifecycle
pub trait PluginLifecycle {
    // 1. Creation and initialization
    fn new() -> Self;
    fn initialize(&mut self) -> Result<(), PluginError>;
    
    // 2. Command registration and setup
    fn register_commands(&self) -> Vec<CommandDescriptor>;
    fn configure(&mut self, config: PluginConfig) -> Result<(), PluginError>;
    
    // 3. Command execution
    fn execute_command(&self, command: &str, input: &str) -> Result<String, PluginError>;
    
    // 4. Monitoring and statistics
    fn get_status(&self) -> PluginStatus;
    fn get_metrics(&self) -> PluginMetrics;
    
    // 5. Cleanup and destruction
    fn cleanup(&mut self);
}

// Implementation for our plugin
impl PluginLifecycle for VideoBlurPlugin {
    fn new() -> Self {
        VideoBlurPlugin {
            initialized: false,
            config: Default::default(),
            metrics: PluginMetrics::new(),
        }
    }
    
    fn initialize(&mut self) -> Result<(), PluginError> {
        if self.initialized {
            return Err(PluginError::AlreadyInitialized);
        }
        
        // Initialize internal structures
        self.setup_blur_kernels()?;
        self.validate_environment()?;
        
        self.initialized = true;
        self.metrics.initialization_time = Some(js_sys::Date::now());
        
        Ok(())
    }
    
    fn register_commands(&self) -> Vec<CommandDescriptor> {
        vec![
            CommandDescriptor {
                name: "apply_blur".to_string(),
                description: "Apply Gaussian blur to video frame".to_string(),
                input_schema: self.get_blur_input_schema(),
                output_schema: self.get_blur_output_schema(),
                examples: vec![self.get_blur_example()],
            }
        ]
    }
    
    fn execute_command(&self, command: &str, input: &str) -> Result<String, PluginError> {
        self.metrics.commands_executed.fetch_add(1, Ordering::Relaxed);
        
        match command {
            "apply_blur" => {
                let start_time = js_sys::Date::now();
                let result = self.apply_blur(input);
                let execution_time = js_sys::Date::now() - start_time;
                
                self.metrics.total_execution_time.fetch_add(
                    execution_time as u64, 
                    Ordering::Relaxed
                );
                
                result
            },
            _ => Err(PluginError::UnknownCommand(command.to_string()))
        }
    }
}
```

### Configuration System

```rust
// Plugin configuration
#[derive(Deserialize, Clone)]
pub struct PluginConfig {
    pub performance_mode: PerformanceMode,
    pub quality_preset: QualityPreset,
    pub default_intensity: f32,
    pub enable_gpu_acceleration: bool,
    pub cache_processed_frames: bool,
    pub max_frame_cache_size: usize,
}

#[derive(Deserialize, Clone)]
pub enum PerformanceMode {
    Speed,      // Speed priority
    Balanced,   // Speed and quality balance
    Quality,    // Quality priority
}

#[derive(Deserialize, Clone)]
pub enum QualityPreset {
    Draft,      // Fast processing for preview
    Standard,   // Standard quality
    High,       // High quality
    Ultra,      // Maximum quality
}

impl Default for PluginConfig {
    fn default() -> Self {
        Self {
            performance_mode: PerformanceMode::Balanced,
            quality_preset: QualityPreset::Standard,
            default_intensity: 2.0,
            enable_gpu_acceleration: false, // Not available in WebAssembly yet
            cache_processed_frames: true,
            max_frame_cache_size: 100,
        }
    }
}

// Apply configuration
impl VideoBlurPlugin {
    pub fn configure(&mut self, config: PluginConfig) -> Result<(), PluginError> {
        // Validate configuration
        if config.default_intensity < 0.0 || config.default_intensity > 10.0 {
            return Err(PluginError::InvalidConfiguration(
                "default_intensity must be between 0.0 and 10.0".to_string()
            ));
        }
        
        // Configure algorithms based on configuration
        self.kernel_size = match config.quality_preset {
            QualityPreset::Draft => 3,
            QualityPreset::Standard => 5,
            QualityPreset::High => 7,
            QualityPreset::Ultra => 9,
        };
        
        self.use_fast_approximation = matches!(config.performance_mode, PerformanceMode::Speed);
        
        // Configure cache
        if config.cache_processed_frames {
            self.frame_cache = Some(FrameCache::new(config.max_frame_cache_size));
        } else {
            self.frame_cache = None;
        }
        
        self.config = config;
        Ok(())
    }
}
```

## 🔒 Permission System

### Defining Permissions

```rust
// Request permissions in plugin
#[wasm_bindgen]
pub fn request_permissions() -> String {
    serde_json::json!({
        "filesystem": {
            "type": "ReadWrite",
            "paths": ["/tmp/video_processing"],
            "justification": "Need to read input video files and write processed output"
        },
        "network": {
            "type": "AllowHttps", 
            "domains": ["api.video-enhancement.com"],
            "justification": "Optional cloud-based enhancement API"
        },
        "system": {
            "type": "TimeAccess",
            "justification": "Performance measurement and timestamping"
        },
        "resources": {
            "max_memory_mb": 256,
            "max_cpu_percent": 70,
            "max_execution_time": "120s",
            "max_file_size_mb": 500,
            "justification": "Processing high-resolution video requires more resources"
        }
    }).to_string()
}

// Check permissions at runtime
impl VideoBlurPlugin {
    fn check_file_access(&self, path: &str) -> Result<(), PluginError> {
        // This function will be called by Host environment
        // to check permissions before file access
        
        // In real implementation this will be host function call
        let has_permission = check_filesystem_permission(path);
        
        if !has_permission {
            return Err(PluginError::PermissionDenied(
                format!("No permission to access file: {}", path)
            ));
        }
        
        Ok(())
    }
    
    fn make_http_request(&self, url: &str) -> Result<String, PluginError> {
        // Check network permissions
        let has_permission = check_network_permission(url);
        
        if !has_permission {
            return Err(PluginError::PermissionDenied(
                format!("No permission to access URL: {}", url)
            ));
        }
        
        // Execute request through host function
        host_http_get(url)
    }
}

// Host functions for secure resource access
#[wasm_bindgen]
extern "C" {
    fn check_filesystem_permission(path: &str) -> bool;
    fn check_network_permission(url: &str) -> bool;
    fn host_http_get(url: &str) -> Result<String, JsValue>;
    fn host_read_file(path: &str) -> Result<Vec<u8>, JsValue>;
    fn host_write_file(path: &str, data: &[u8]) -> Result<(), JsValue>;
}
```

### Secure File Operations

```rust
// Wrapper for secure file operations
pub struct SecureFileAccess;

impl SecureFileAccess {
    pub fn read_video_frame(path: &str) -> Result<VideoFrame, PluginError> {
        // Validate path
        if !Self::is_safe_path(path) {
            return Err(PluginError::UnsafePath(path.to_string()));
        }
        
        // Check permissions
        if !check_filesystem_permission(path) {
            return Err(PluginError::PermissionDenied(
                format!("No read permission for: {}", path)
            ));
        }
        
        // Read through host function
        let data = host_read_file(path)
            .map_err(|e| PluginError::FileError(format!("Failed to read file: {:?}", e)))?;
        
        // Parse video data
        Self::parse_video_frame(&data)
    }
    
    pub fn write_processed_frame(path: &str, frame: &VideoFrame) -> Result<(), PluginError> {
        // Validate output path
        if !Self::is_safe_output_path(path) {
            return Err(PluginError::UnsafePath(path.to_string()));
        }
        
        // Check write permissions
        if !check_filesystem_permission(path) {
            return Err(PluginError::PermissionDenied(
                format!("No write permission for: {}", path)
            ));
        }
        
        // Serialize frame
        let data = Self::serialize_video_frame(frame)?;
        
        // Check file size
        if data.len() > self.config.max_file_size_bytes {
            return Err(PluginError::FileTooLarge(data.len()));
        }
        
        // Write through host function
        host_write_file(path, &data)
            .map_err(|e| PluginError::FileError(format!("Failed to write file: {:?}", e)))
    }
    
    fn is_safe_path(path: &str) -> bool {
        // Check for path traversal attacks
        !path.contains("..") && 
        !path.starts_with("/") && 
        !path.contains("~") &&
        path.chars().all(|c| c.is_ascii() && !c.is_control())
    }
    
    fn is_safe_output_path(path: &str) -> bool {
        Self::is_safe_path(path) && 
        (path.starts_with("tmp/") || path.starts_with("output/"))
    }
}
```

## 🧪 Plugin Testing

### Unit Tests

```rust
// tests/unit_tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;
    
    wasm_bindgen_test_configure!(run_in_browser);
    
    #[wasm_bindgen_test]
    fn test_plugin_initialization() {
        let mut plugin = VideoBlurPlugin::new();
        assert!(!plugin.initialized);
        
        let result = plugin.initialize();
        assert!(result.is_ok());
        assert!(plugin.initialized);
        
        // Second initialization should fail
        let result = plugin.initialize();
        assert!(result.is_err());
    }
    
    #[wasm_bindgen_test]
    fn test_blur_input_validation() {
        let plugin = VideoBlurPlugin::new();
        
        // Invalid intensity
        let invalid_input = serde_json::json!({
            "intensity": 15.0,  // Above maximum
            "frame_data": vec![255u8; 1920 * 1080 * 3],
            "width": 1920,
            "height": 1080,
            "format": "RGB24"
        }).to_string();
        
        let result = plugin.apply_blur(&invalid_input);
        assert!(result.is_err());
        
        // Invalid data size
        let invalid_input = serde_json::json!({
            "intensity": 5.0,
            "frame_data": vec![255u8; 100],  // Wrong size
            "width": 1920,
            "height": 1080,
            "format": "RGB24"
        }).to_string();
        
        let result = plugin.apply_blur(&invalid_input);
        assert!(result.is_err());
    }
    
    #[wasm_bindgen_test]
    fn test_blur_algorithm() {
        let mut plugin = VideoBlurPlugin::new();
        plugin.initialize().unwrap();
        
        // Create test frame (black and white stripes)
        let mut frame_data = vec![0u8; 100 * 100 * 3];
        for y in 0..100 {
            for x in 0..100 {
                let color = if (x / 10) % 2 == 0 { 255 } else { 0 };
                let idx = (y * 100 + x) * 3;
                frame_data[idx] = color;     // R
                frame_data[idx + 1] = color; // G
                frame_data[idx + 2] = color; // B
            }
        }
        
        let input = serde_json::json!({
            "intensity": 3.0,
            "frame_data": frame_data,
            "width": 100,
            "height": 100,
            "format": "RGB24"
        }).to_string();
        
        let result = plugin.apply_blur(&input);
        assert!(result.is_ok());
        
        let output: BlurOutput = serde_json::from_str(&result.unwrap()).unwrap();
        
        // Check that blur was applied
        assert_eq!(output.processed_frame.len(), frame_data.len());
        assert!(output.processing_time_ms > 0.0);
        assert_eq!(output.metadata.applied_intensity, 3.0);
        
        // Check that sharp edges became softer
        // (simplified check, real testing needs more complex verification)
        assert_ne!(output.processed_frame, frame_data);
    }
    
    #[wasm_bindgen_test]
    fn test_performance_metrics() {
        let mut plugin = VideoBlurPlugin::new();
        plugin.initialize().unwrap();
        
        let small_frame = create_test_frame(10, 10);
        let large_frame = create_test_frame(1000, 1000);
        
        // Process small frame
        let start = js_sys::Date::now();
        let result1 = plugin.apply_blur(&small_frame);
        let time1 = js_sys::Date::now() - start;
        
        // Process large frame
        let start = js_sys::Date::now();
        let result2 = plugin.apply_blur(&large_frame);
        let time2 = js_sys::Date::now() - start;
        
        assert!(result1.is_ok());
        assert!(result2.is_ok());
        
        // Large frame should take longer to process
        assert!(time2 > time1);
    }
    
    fn create_test_frame(width: u32, height: u32) -> String {
        let frame_data = vec![128u8; (width * height * 3) as usize]; // Gray color
        
        serde_json::json!({
            "intensity": 2.0,
            "frame_data": frame_data,
            "width": width,
            "height": height,
            "format": "RGB24"
        }).to_string()
    }
}
```

### Integration Tests

```rust
// tests/integration_tests.rs
#[cfg(test)]
mod integration_tests {
    use super::*;
    use wasm_bindgen_test::*;
    
    #[wasm_bindgen_test]
    async fn test_plugin_lifecycle() {
        // Test complete plugin lifecycle
        let mut plugin = VideoBlurPlugin::new();
        
        // 1. Initialization
        assert!(plugin.initialize().is_ok());
        
        // 2. Configuration
        let config = PluginConfig {
            performance_mode: PerformanceMode::Quality,
            quality_preset: QualityPreset::High,
            default_intensity: 3.0,
            ..Default::default()
        };
        assert!(plugin.configure(config).is_ok());
        
        // 3. Command execution
        let test_input = create_test_frame(256, 256);
        let result = plugin.execute_command("apply_blur", &test_input);
        assert!(result.is_ok());
        
        // 4. Check metrics
        let metrics = plugin.get_metrics();
        assert_eq!(metrics.commands_executed.load(Ordering::Relaxed), 1);
        assert!(metrics.total_execution_time.load(Ordering::Relaxed) > 0);
        
        // 5. Cleanup
        plugin.cleanup();
        assert!(!plugin.initialized);
    }
    
    #[wasm_bindgen_test]
    async fn test_error_handling() {
        let mut plugin = VideoBlurPlugin::new();
        plugin.initialize().unwrap();
        
        // Test error handling
        let invalid_command = plugin.execute_command("nonexistent_command", "{}");
        assert!(invalid_command.is_err());
        
        let invalid_json = plugin.execute_command("apply_blur", "invalid json");
        assert!(invalid_json.is_err());
        
        let invalid_params = plugin.execute_command("apply_blur", r#"{"intensity": "not_a_number"}"#);
        assert!(invalid_params.is_err());
        
        // Plugin should remain functional after errors
        let valid_input = create_test_frame(64, 64);
        let result = plugin.execute_command("apply_blur", &valid_input);
        assert!(result.is_ok());
    }
    
    #[wasm_bindgen_test]
    async fn test_resource_limits() {
        let mut plugin = VideoBlurPlugin::new();
        plugin.initialize().unwrap();
        
        // Configuration with strict limits
        let strict_config = PluginConfig {
            max_file_size_mb: 1, // 1MB limit
            ..Default::default()
        };
        plugin.configure(strict_config).unwrap();
        
        // Test memory limit exceeded
        let huge_frame = create_test_frame(5000, 5000); // ~75MB
        let result = plugin.execute_command("apply_blur", &huge_frame);
        
        // Should error due to limit exceeded
        assert!(result.is_err());
    }
}
```

### Benchmark Tests

```rust
// benches/performance.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};

fn benchmark_blur_algorithms(c: &mut Criterion) {
    let mut plugin = VideoBlurPlugin::new();
    plugin.initialize().unwrap();
    
    let small_frame = create_test_frame(256, 256);
    let medium_frame = create_test_frame(512, 512);
    let large_frame = create_test_frame(1024, 1024);
    
    c.bench_function("blur_256x256", |b| {
        b.iter(|| {
            plugin.execute_command("apply_blur", black_box(&small_frame))
        })
    });
    
    c.bench_function("blur_512x512", |b| {
        b.iter(|| {
            plugin.execute_command("apply_blur", black_box(&medium_frame))
        })
    });
    
    c.bench_function("blur_1024x1024", |b| {
        b.iter(|| {
            plugin.execute_command("apply_blur", black_box(&large_frame))
        })
    });
}

criterion_group!(benches, benchmark_blur_algorithms);
criterion_main!(benches);
```

## 🚀 Performance Optimization

### SIMD Optimizations

```rust
#[cfg(target_arch = "wasm32")]
use std::arch::wasm32::*;

// Optimized blur version with SIMD
fn apply_gaussian_blur_simd(
    data: &[u8],
    width: u32,
    height: u32,
    intensity: f32
) -> Result<Vec<u8>, JsValue> {
    let mut result = data.to_vec();
    let kernel_size = ((intensity * 2.0) as usize + 1).max(3);
    
    // Process 16 pixels at a time (SIMD)
    for y in 1..(height - 1) {
        for x in (1..(width - 1)).step_by(16) {
            let pixels_to_process = ((width - 1) - x).min(16);
            
            // Load 16 pixels into SIMD registers
            let mut r_values = v128_load(&data[((y * width + x) * 3) as usize..]);
            let mut g_values = v128_load(&data[((y * width + x) * 3 + 1) as usize..]);
            let mut b_values = v128_load(&data[((y * width + x) * 3 + 2) as usize..]);
            
            // Apply blur through SIMD operations
            apply_blur_kernel_simd(&mut r_values, &mut g_values, &mut b_values, kernel_size);
            
            // Store result
            v128_store(&mut result[((y * width + x) * 3) as usize..], r_values);
            v128_store(&mut result[((y * width + x) * 3 + 1) as usize..], g_values);
            v128_store(&mut result[((y * width + x) * 3 + 2) as usize..], b_values);
        }
    }
    
    Ok(result)
}

#[inline]
fn apply_blur_kernel_simd(
    r_values: &mut v128,
    g_values: &mut v128, 
    b_values: &mut v128,
    kernel_size: usize
) {
    // SIMD operations for fast averaging
    let divisor = v128_splat((kernel_size * kernel_size) as u8);
    
    *r_values = u8x16_avgr(*r_values, divisor);
    *g_values = u8x16_avgr(*g_values, divisor);
    *b_values = u8x16_avgr(*b_values, divisor);
}
```

### Memory Pooling

```rust
// Memory pool for buffer reuse
struct MemoryPool {
    buffers: Vec<Vec<u8>>,
    buffer_size: usize,
}

impl MemoryPool {
    fn new(buffer_size: usize, initial_capacity: usize) -> Self {
        let mut buffers = Vec::with_capacity(initial_capacity);
        for _ in 0..initial_capacity {
            buffers.push(vec![0u8; buffer_size]);
        }
        
        Self {
            buffers,
            buffer_size,
        }
    }
    
    fn get_buffer(&mut self) -> Vec<u8> {
        self.buffers.pop().unwrap_or_else(|| vec![0u8; self.buffer_size])
    }
    
    fn return_buffer(&mut self, mut buffer: Vec<u8>) {
        if buffer.len() == self.buffer_size {
            buffer.clear();
            self.buffers.push(buffer);
        }
    }
}

// Usage in plugin
impl VideoBlurPlugin {
    fn process_with_memory_pool(&mut self, input: &BlurInput) -> Result<BlurOutput, JsValue> {
        // Get buffer from pool
        let mut working_buffer = self.memory_pool.get_buffer();
        working_buffer.resize(input.frame_data.len(), 0);
        working_buffer.copy_from_slice(&input.frame_data);
        
        // Processing
        let result = self.apply_blur_in_place(&mut working_buffer, input.width, input.height, input.intensity)?;
        
        // Return buffer to pool
        let output_data = working_buffer.clone();
        self.memory_pool.return_buffer(working_buffer);
        
        Ok(BlurOutput {
            processed_frame: output_data,
            // ... other fields
        })
    }
}
```

### Asynchronous Processing

```rust
// Asynchronous processing for large frames
#[wasm_bindgen]
impl VideoBlurPlugin {
    #[wasm_bindgen]
    pub async fn apply_blur_async(&self, input_json: &str) -> Result<String, JsValue> {
        let input: BlurInput = serde_json::from_str(input_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid input: {}", e)))?;
        
        // Split large frames for asynchronous processing
        if input.width * input.height > 1024 * 1024 {
            self.process_large_frame_async(&input).await
        } else {
            // Process small frames synchronously
            self.process_blur(&input).map(|r| serde_json::to_string(&r).unwrap())
        }
    }
    
    async fn process_large_frame_async(&self, input: &BlurInput) -> Result<String, JsValue> {
        let tile_size = 512;
        let tiles_x = (input.width + tile_size - 1) / tile_size;
        let tiles_y = (input.height + tile_size - 1) / tile_size;
        
        let mut result_tiles = Vec::new();
        
        // Process tiles asynchronously
        for ty in 0..tiles_y {
            for tx in 0..tiles_x {
                let tile = self.extract_tile(input, tx, ty, tile_size);
                
                // Yield control periodically
                if (ty * tiles_x + tx) % 4 == 0 {
                    yield_to_browser().await;
                }
                
                let processed_tile = self.process_tile_blur(&tile)?;
                result_tiles.push(processed_tile);
            }
        }
        
        // Combine result from tiles
        let final_result = self.combine_tiles(&result_tiles, input.width, input.height, tile_size)?;
        
        Ok(serde_json::to_string(&final_result).unwrap())
    }
}

// Yield control back to browser
async fn yield_to_browser() {
    let promise = js_sys::Promise::resolve(&JsValue::NULL);
    let _ = wasm_bindgen_futures::JsFuture::from(promise).await;
}
```

## 📦 Publishing Plugins

### Package Structure

```
my-video-plugin-v1.0.0/
├── plugin.json                    # Plugin manifest
├── my_video_plugin_bg.wasm        # Compiled WASM
├── my_video_plugin.js             # JS bindings  
├── my_video_plugin.d.ts           # TypeScript types
├── schemas/                       # JSON schemas
│   ├── apply_blur_input.json
│   ├── apply_blur_output.json
│   └── config.json
├── examples/                      # Usage examples
│   ├── apply_blur_example.json
│   └── sample_config.json
├── docs/                          # Documentation
│   ├── README.md
│   ├── API.md
│   └── CHANGELOG.md
├── tests/                         # Tests
│   ├── unit_tests.js
│   └── integration_tests.js  
└── LICENSE                        # License
```

### Creating Release

```bash
# 1. Compile final version
wasm-pack build --target web --release --out-dir dist

# 2. Copy additional files
cp plugin.json dist/
cp -r schemas dist/
cp -r examples dist/
cp -r docs dist/
cp LICENSE dist/

# 3. Create archive
cd dist
tar -czf ../my-video-plugin-v1.0.0.tar.gz .
cd ..

# 4. Generate checksums
sha256sum my-video-plugin-v1.0.0.tar.gz > my-video-plugin-v1.0.0.sha256

# 5. Sign release (optional)
gpg --armor --detach-sign my-video-plugin-v1.0.0.tar.gz
```

### Publication Metadata

```json
{
  "release_info": {
    "version": "1.0.0",
    "release_date": "2025-06-24",
    "release_notes": "Initial release with Gaussian blur filter",
    "compatibility": {
      "min_timeline_studio_version": "1.0.0",
      "max_timeline_studio_version": "2.0.0",
      "platforms": ["web", "desktop"],
      "architectures": ["wasm32"]
    }
  },
  
  "distribution": {
    "download_url": "https://plugins.timeline-studio.com/video-blur/1.0.0/download",
    "checksum_sha256": "a1b2c3d4e5f6...",
    "signature_file": "my-video-plugin-v1.0.0.tar.gz.asc",
    "size_bytes": 524288
  },
  
  "verification": {
    "signed_by": "Timeline Studio Developer <dev@timeline-studio.com>",
    "signing_key_fingerprint": "1234 5678 9ABC DEF0 1234 5678 9ABC DEF0 1234 5678",
    "build_reproducible": true,
    "source_code_url": "https://github.com/timeline-studio/plugins/video-blur/tree/v1.0.0"
  }
}
```

---

## 📚 Additional Resources

- [**WebAssembly Reference**](https://webassembly.github.io/spec/)
- [**wasm-bindgen Guide**](https://rustwasm.github.io/wasm-bindgen/)
- [**Rust WASM Book**](https://rustwasm.github.io/docs/book/)
- [**Plugin API Reference**](api-reference.md)
- [**Security Guidelines**](security.md)

---

*Last updated: June 24, 2025*