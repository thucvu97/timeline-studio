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
    }
  }

  // Run the default Tauri build script
  tauri_build::build();
}
