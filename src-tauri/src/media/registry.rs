use super::commands::*;
use crate::command_registry::CommandRegistry;
use tauri::{Builder, Runtime};

/// Media module command registry
pub struct MediaCommandRegistry;

impl CommandRegistry for MediaCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      // Media file operations
      get_media_files,
      get_media_metadata,
      process_media_file_simple,
      // Preview operations
      generate_media_thumbnail,
      generate_timeline_previews,
      get_media_preview_data,
      clear_media_preview_data,
      // Timeline frame operations
      get_timeline_frames,
      save_timeline_frames,
      extract_recognition_frames,
      // Preview data management
      load_preview_data,
      save_preview_data,
      get_files_with_previews,
    ])
  }
}
