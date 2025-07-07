fn main() {
  // Clear any FFmpeg environment variables that might be incorrectly set
  // This prevents cross-platform build issues where Windows paths might leak into Linux builds
  if std::env::var("CI").is_ok() {
    // In CI environment, ensure we use system FFmpeg via pkg-config
    std::env::remove_var("FFMPEG_DIR");
    std::env::remove_var("FFMPEG_INCLUDE_DIR");
    std::env::remove_var("FFMPEG_LIB_DIR");

    // Set PKG_CONFIG to use system libraries
    if cfg!(target_os = "linux") {
      std::env::set_var("PKG_CONFIG_ALLOW_SYSTEM_LIBS", "1");
      std::env::set_var("PKG_CONFIG_ALLOW_SYSTEM_CFLAGS", "1");

      // Help bindgen find system headers
      if std::env::var("BINDGEN_EXTRA_CLANG_ARGS").is_err() {
        std::env::set_var(
          "BINDGEN_EXTRA_CLANG_ARGS",
          "-I/usr/include -I/usr/include/x86_64-linux-gnu",
        );
      }
    }

    // Clean up test binaries that should not be included in release builds
    cleanup_test_binaries();
  }

  // Run the default Tauri build script
  tauri_build::build();
}

fn cleanup_test_binaries() {
  use std::fs;
  use std::path::Path;

  // List of test binaries to remove before bundling
  let test_binaries = [
    "test_specta",
    "test_specta.exe", // Windows
  ];

  // Check common target directories
  let target_dirs = [
    "target/debug",
    "target/release",
    "target/universal-apple-darwin/debug",
    "target/universal-apple-darwin/release",
    "target/x86_64-apple-darwin/debug",
    "target/x86_64-apple-darwin/release",
    "target/aarch64-apple-darwin/debug",
    "target/aarch64-apple-darwin/release",
  ];

  for target_dir in &target_dirs {
    let target_path = Path::new(target_dir);
    if target_path.exists() {
      for binary in &test_binaries {
        let binary_path = target_path.join(binary);
        if binary_path.exists() {
          if let Err(e) = fs::remove_file(&binary_path) {
            eprintln!("Warning: Failed to remove test binary {:?}: {}", binary_path, e);
          } else {
            println!("Removed test binary: {:?}", binary_path);
          }
        }
      }
    }
  }
}
