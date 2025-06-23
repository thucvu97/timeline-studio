use crate::command_registry::CommandRegistry;
use tauri::{Builder, Runtime};

use super::commands::*;

/// Video Compiler module command registry
pub struct VideoCompilerCommandRegistry;

impl CommandRegistry for VideoCompilerCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      // GPU commands
      auto_select_gpu,
      benchmark_gpu,
      check_gpu_encoder_availability,
      check_hardware_acceleration,
      check_hardware_acceleration_support,
      // Cache commands
      cache_media_metadata,
      clean_old_cache,
      cleanup_cache,
      clear_all_cache,
      clear_cache,
      clear_file_preview_cache,
      clear_frame_cache,
      clear_media_metadata_cache,
      clear_prerender_cache,
      clear_preview_cache,
      clear_preview_cache_for_file,
      clear_preview_generator_cache_for_file,
      clear_project_cache,
      clear_project_previews,
      clear_render_cache,
      configure_cache,
      // Rendering commands
      compile_video,
      cancel_render,
      build_preview_command,
      build_prerender_segment_command,
      build_render_command_with_settings,
      build_segment_render_command,
      // Project commands
      create_new_project,
      analyze_project,
      backup_project,
      check_project_media_availability,
      // Preview commands
      batch_generate_previews_service,
      // Settings commands
      apply_quality_preset,
      apply_video_filter,
      // Info commands
      check_ffmpeg_available,
      check_ffmpeg_capabilities,
      check_ffmpeg_installation,
      check_render_job_timeouts,
      // Misc commands - TODO: These will be moved to specialized modules
      add_clip_to_track,
      add_subtitles_to_project,
      concat_videos,
      create_clip,
      create_custom_alert,
      create_effect,
      create_filter,
      create_schema_objects,
      create_style_template,
      // Other commands from misc.rs will be added here
    ])
  }
}
