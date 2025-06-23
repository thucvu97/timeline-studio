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
      detect_gpus,
      get_gpu_capabilities,
      get_recommended_gpu,
      set_preferred_gpu,
      set_hardware_acceleration,
      get_gpu_usage_status,
      get_gpu_supported_codecs,
      get_gpu_encoder_details,
      get_gpu_capabilities_full,
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
      get_active_render_jobs,
      get_render_job,
      pause_render,
      resume_render,
      export_with_preset,
      // Project commands
      create_new_project,
      analyze_project,
      backup_project,
      check_project_media_availability,
      // Preview commands
      batch_generate_previews_service,
      generate_frame_preview,
      generate_video_thumbnails,
      generate_project_preview,
      generate_effect_preview,
      generate_transition_preview,
      generate_storyboard,
      generate_animated_preview,
      generate_waveform_preview,
      // Settings commands
      apply_quality_preset,
      apply_video_filter,
      // Info commands
      check_ffmpeg_available,
      check_ffmpeg_capabilities,
      check_ffmpeg_installation,
      check_render_job_timeouts,
      get_ffmpeg_version,
      get_supported_formats,
      get_supported_video_codecs,
      get_supported_audio_codecs,
      get_system_info,
      get_disk_space,
      get_compiler_config,
      get_performance_stats,
      get_available_filters,
      get_media_file_info,
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
      // Pipeline commands
      create_and_execute_pipeline,
      get_pipeline_info,
      cancel_pipeline,
      get_pipeline_statistics,
      get_pipeline_context,
      update_pipeline_settings,
      validate_pipeline_configuration,
      insert_pipeline_stage,
      remove_pipeline_stage,
      build_custom_pipeline,
      get_pipeline_execution_summary,
      get_pipeline_progress,
      cleanup_completed_pipelines,
      // Other commands from misc.rs will be added here
    ])
  }
}
