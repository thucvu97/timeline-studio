# ORT Build Issue - Temporary Fix Applied

## Problem
The build was failing with the following error:
```
ld: library 'add_ort_library_path_or_enable_feature_download-binaries_see_ort_docs' not found
```

This is because the ONNX Runtime (ORT) library wasn't properly configured for linking.

## Temporary Solution Applied
1. **Disabled ORT dependencies** in `src-tauri/Cargo.toml`:
   ```toml
   # ort = { version = "2.0.0-rc.10", features = ["load-dynamic"] }
   # ort-sys = { version = "2.0.0-rc.10", features = ["load-dynamic"] }
   # ndarray = "0.15"
   ```

2. **Commented out yolo_processor module** in `src-tauri/src/recognition/mod.rs`:
   ```rust
   // pub mod yolo_processor; // Temporarily disabled - ORT linking issue
   ```

3. **Created stub implementations** in `recognition_service.rs` to maintain API compatibility.

## To Re-enable ORT

When you're ready to use the YOLO recognition features again:

### Option 1: Download Binaries (Recommended for development)
```toml
ort = { version = "2.0.0-rc.10", features = ["download-binaries"] }
ort-sys = { version = "2.0.0-rc.10" }
ndarray = "0.15"
```

### Option 2: Dynamic Loading (Recommended for production)
1. Install ONNX Runtime on your system:
   ```bash
   brew install onnxruntime
   ```

2. Use the load-dynamic feature:
   ```toml
   ort = { version = "2.0.0-rc.10", features = ["load-dynamic"] }
   ort-sys = { version = "2.0.0-rc.10", features = ["load-dynamic"] }
   ndarray = "0.15"
   ```

3. Set the library path if needed:
   ```bash
   export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
   ```

### Option 3: Static Linking
For bundled builds, you might need to use static linking with proper configuration.

## Current Status
- The build should now complete successfully without ORT
- Recognition features are temporarily disabled but won't break the build
- All other features remain functional

## Files Modified
1. `/src-tauri/Cargo.toml` - Commented out ORT dependencies
2. `/src-tauri/src/recognition/mod.rs` - Disabled yolo_processor module
3. `/src-tauri/src/recognition/recognition_service.rs` - Added stub implementations
4. `/src-tauri/src/recognition/commands.rs` - Fixed enum variant name
5. `/src-tauri/.cargo/config.toml` - Optimized build configuration