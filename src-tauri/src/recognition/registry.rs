use super::commands::*;
use crate::command_registry::CommandRegistry;
use tauri::{Builder, Runtime};

/// Recognition module command registry
pub struct RecognitionCommandRegistry;

impl CommandRegistry for RecognitionCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      // YOLO model management
      load_yolo_model,
      get_yolo_class_names,
      set_yolo_target_classes,
      // Recognition processing
      process_video_recognition,
      process_video_batch,
      process_yolo_batch,
      // Results management
      get_recognition_results,
      get_preview_data_with_recognition,
      clear_recognition_results,
      export_recognition_results,
    ])
  }
}
