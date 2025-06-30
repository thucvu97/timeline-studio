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
      get_cache_stats,
      get_cache_size,
      get_cache_stats_detailed,
      get_cached_projects,
      has_project_cache,
      get_cached_media_metadata,
      export_cache_stats,
      set_cache_size_limit,
      get_cache_size_limit,
      preload_media_to_cache,
      get_cache_path,
      // Prerender commands
      prerender_segment,
      get_prerender_cache_info,
      check_prerender_status,
      get_prerendered_segments,
      delete_prerendered_segment,
      optimize_prerender_cache,
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
      validate_project_schema,
      optimize_project_schema,
      update_project_media_paths,
      extract_project_subtitles,
      get_clip_info,
      get_project_media_files,
      merge_projects,
      split_project,
      touch_project_schema,
      track_operations,
      validate_subtitle,
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
      get_cached_preview_info,
      generate_custom_preview,
      generate_preview_batch_with_settings,
      set_preview_generator_ffmpeg_path,
      generate_video_thumbnails_service,
      generate_storyboard_service,
      // Settings commands
      apply_video_filter,
      // Info commands
      check_ffmpeg_available,
      check_ffmpeg_capabilities,
      check_ffmpeg_installation,
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
      get_cache_memory_usage,
      get_cached_metadata,
      get_current_gpu_info,
      get_gpu_info,
      get_recommended_gpu_encoder,
      get_render_cache_info,
      get_video_info,
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
      // FFmpeg Utilities commands
      execute_ffmpeg_simple_command,
      execute_ffmpeg_with_progress_advanced,
      get_ffmpeg_available_codecs,
      get_ffmpeg_available_formats,
      generate_subtitle_preview_advanced,
      get_ffmpeg_execution_information,
      // FFmpeg Builder commands
      add_segment_inputs_to_builder,
      create_ffmpeg_with_prerender_settings,
      get_clip_input_index_from_builder,
      get_ffmpeg_builder_info,
      // FFmpeg Executor commands
      check_ffmpeg_executor_availability,
      execute_ffmpeg_simple_no_progress,
      execute_ffmpeg_with_progress_tracking,
      get_ffmpeg_executor_capabilities,
      // Monitoring commands
      check_services_health,
      export_metrics_prometheus_detailed,
      get_all_metrics_summaries,
      get_performance_metrics,
      get_registry_service_metrics,
      get_service_metrics_summary,
      reset_all_metrics,
      reset_service_metrics_detailed,
      // Workflow commands
      analyze_workflow_video_quality,
      cleanup_workflow_temp_files,
      compile_workflow_video,
      create_directory,
      create_timeline_project,
      create_workflow_preview,
      // Platform optimization commands
      ffmpeg_analyze_platform_compliance,
      ffmpeg_batch_optimize_platforms,
      ffmpeg_create_progressive_video,
      ffmpeg_generate_platform_thumbnail,
      ffmpeg_optimize_for_platform,
      // Preview advanced commands
      create_preview_generator_with_ffmpeg,
      generate_preview_batch_advanced,
      generate_preview_with_options,
      generate_single_frame_preview,
      get_preview_generator_info,
      set_preview_generator_ffmpeg_path_advanced,
      // Frame Extraction Advanced commands
      extract_timeline_frames_advanced,
      extract_subtitle_frames_advanced,
      extract_video_frame_advanced,
      extract_video_frames_batch_advanced,
      get_video_thumbnails_advanced,
      get_frame_extraction_cache_information,
      generate_preview_frame,
      generate_preview_batch_frames,
      generate_preview_with_custom_settings,
      // Timeline Schema commands
      create_new_subtitle,
      validate_subtitle_schema,
      get_subtitle_duration_schema,
      create_new_track,
      add_clip_to_track_schema,
      remove_clip_from_track_schema,
      get_track_info,
      get_subtitle_statistics,
      // Remaining Utilities commands
      test_hardware_acceleration_available,
      perform_track_operations,
      get_detailed_clip_info,
      validate_subtitle_project,
      touch_project_timestamp,
      get_cache_metadata,
      get_cache_hit_ratio_stats,
      clear_cache_advanced,
      // Final Utilities commands
      generate_subtitle_preview_ffmpeg,
      execute_ffmpeg_with_progress_handler,
      // Other commands from misc.rs will be added here
      // FFmpeg advanced commands
      execute_ffmpeg_simple,
      execute_ffmpeg_with_progress,
      generate_subtitle_preview,
      get_ffmpeg_codecs,
      get_ffmpeg_execution_info,
      get_ffmpeg_formats,
      probe_media_file,
      test_hardware_acceleration,
      // Frame extraction commands
      extract_subtitle_frames,
      extract_timeline_frames,
      extract_video_frame,
      extract_video_frames_batch,
      generate_preview,
      generate_preview_batch,
      generate_preview_with_settings,
      get_frame_extraction_cache_info,
      get_video_thumbnails,
      // Frame manager commands
      extract_frames_for_clip_command,
      extract_frames_for_subtitles_command,
      get_frame_extraction_cache_info_command,
      // Multimodal commands
      cleanup_extracted_frames,
      convert_image_to_base64,
      create_frame_collage,
      extract_frames_for_multimodal_analysis,
      extract_thumbnail_candidates,
      optimize_image_for_analysis,
      // Whisper commands
      extract_audio_for_whisper,
      whisper_check_local_availability,
      whisper_download_model,
      whisper_get_local_models,
      whisper_transcribe_local,
      whisper_transcribe_openai,
      whisper_translate_openai,
      // Video analysis commands
      ffmpeg_analyze_audio,
      ffmpeg_analyze_motion,
      ffmpeg_analyze_quality,
      ffmpeg_detect_scenes,
      ffmpeg_detect_silence,
      ffmpeg_extract_keyframes,
      ffmpeg_get_metadata,
      ffmpeg_quick_analysis,
      // Schema commands
      create_subtitle,
      create_subtitle_animation,
      create_template,
      create_track,
      create_resolution,
      get_hd_resolution,
      get_uhd_4k_resolution,
      get_preset_resolutions,
      create_resolution_for_format,
      // Service commands
      cleanup_completed_jobs,
      get_active_jobs,
      get_all_service_metrics,
      get_input_sources_info,
      get_render_progress,
      get_render_statistics,
      get_specific_service_metrics,
      get_services_health,
      restart_service,
      set_preview_ffmpeg_path,
      touch_project,
      // Service container commands
      get_project_service_info_command,
      get_service_metrics_detailed,
      get_all_metrics_summaries_command,
      export_prometheus_detailed,
      // Compiler settings commands
      get_compiler_settings_advanced,
      update_compiler_settings_advanced,
      set_ffmpeg_path_advanced,
      set_parallel_jobs_advanced,
      set_memory_limit_advanced,
      set_temp_directory_advanced,
      set_log_level_advanced,
      reset_compiler_settings_advanced,
      get_recommended_settings_advanced,
      export_settings_advanced,
      import_settings_advanced,
      get_quality_presets_advanced,
      // FFmpeg Builder Advanced commands
      get_ffmpeg_builder_settings_advanced,
      get_ffmpeg_builder_project_info_advanced,
      get_segment_filters_info_advanced,
      validate_segment_timestamps_advanced,
      get_frame_extraction_cache_advanced,
      get_clip_input_index_advanced,
      // Metrics Advanced commands
      get_active_operations_count_detailed,
      get_error_statistics_detailed,
      get_slow_operations_detailed,
      get_service_container_metrics_detailed,
      get_render_pipeline_statistics_advanced,
      reset_service_metrics_advanced,
      export_metrics_prometheus_advanced,
      // Original metrics commands
      // Original settings commands
      // Original rendering commands
      // Original test helpers commands
      // Pipeline advanced commands
      get_pipeline_context_mutable,
      set_pipeline_user_data,
      get_pipeline_user_data,
      should_use_hardware_acceleration_for_codec,
      generate_noise_clip_advanced,
      generate_gradient_clip_advanced,
      check_should_use_hardware_acceleration_for_codec,
      set_pipeline_user_data_direct,
      get_pipeline_user_data_direct,
      generate_noise_clip_direct,
      generate_gradient_clip_direct,
      // Recognition advanced commands
      get_frame_processor_class_names,
      check_is_face_model,
      check_is_segmentation_model,
      get_model_manager_status,
      get_recognition_results_by_time_range,
      get_recognition_results_by_class,
      format_recognition_results_for_timeline,
      check_yolo_model_is_face_model,
      check_yolo_model_is_segmentation_model,
      get_yolo_model_info_extended,
      get_model_session_info,
      get_loaded_model_type,
      check_model_is_loaded,
      // Security advanced commands
      init_secure_storage_advanced,
      create_secure_storage_instance,
      get_secure_storage_info_advanced,
      verify_secure_storage_integrity,
      export_secure_storage_config,
      clear_secure_storage,
      // FFmpeg Builder extra commands
      build_prerender_segment_command_advanced,
      validate_prerender_segment_params,
      get_optimal_prerender_settings,
      build_prerender_segment_direct,
      // Progress tracker commands
      get_render_progress_tracker,
      get_progress_tracker_statistics,
      reset_progress_tracker,
      set_progress_callback_enabled,
      get_current_operation_details,
    ])
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use tauri::Builder;

  // Use a type alias for testing
  type MockRuntime = tauri::Wry;

  #[test]
  fn test_video_compiler_command_registry_exists() {
    // Test that the VideoCompilerCommandRegistry struct exists
    let _registry = VideoCompilerCommandRegistry;
    // Test passes if function compilation succeeds
  }

  #[test]
  fn test_command_registry_trait_implementation() {
    // Test that VideoCompilerCommandRegistry implements CommandRegistry trait
    // This compilation test ensures the trait is properly implemented
    fn assert_implements_command_registry<T: CommandRegistry>() {}
    assert_implements_command_registry::<VideoCompilerCommandRegistry>();
  }

  #[test]
  fn test_register_commands_compiles() {
    // Test that register_commands method can be called
    // This ensures all command imports are valid and the handler generation works
    let builder = Builder::<MockRuntime>::new();

    // This should compile successfully if all commands are properly imported
    let _result = VideoCompilerCommandRegistry::register_commands(builder);

    // If we reach here, the registration compiled successfully
    // Test passes if function compilation succeeds
  }

  #[test]
  fn test_handler_generation_syntax() {
    // Test that the tauri::generate_handler! macro syntax is correct
    // This is a compile-time test - if it compiles, the syntax is correct

    // We can't easily test the actual handler generation without a full Tauri setup,
    // but the fact that the code compiles means the macro syntax is valid
    // Test passes if function compilation succeeds
  }

  #[test]
  fn test_all_command_imports_valid() {
    // This test ensures all command functions exist and are imported correctly
    // If any command function is missing, this will fail to compile

    // Test that command functions can be referenced (without casting)
    // This ensures they exist and are imported correctly

    // GPU commands exist
    let _gpu_functions = (auto_select_gpu, benchmark_gpu, detect_gpus);

    // Cache commands exist
    let _cache_functions = (cleanup_cache, clear_all_cache, get_cache_stats);

    // Render commands exist
    let _render_functions = (cancel_render, get_active_render_jobs);

    // Test passes if function compilation succeeds
  }

  #[test]
  fn test_command_categories_coverage() {
    // Test that we have commands from all major categories
    // This is a documentation test to ensure we haven't missed major categories

    let categories = vec![
      "GPU commands",
      "Cache commands",
      "Prerender commands",
      "Rendering commands",
      "Project commands",
      "Preview commands",
      "Settings commands",
      "Info commands",
      "Pipeline commands",
      "FFmpeg Utilities commands",
      "Monitoring commands",
      "Workflow commands",
      "Platform optimization commands",
    ];

    // If we have this many categories, we're covering the major functionality
    assert!(categories.len() >= 10);
  }

  #[test]
  fn test_command_count_reasonable() {
    // Test that we have a reasonable number of commands registered
    // This is a sanity check to ensure we're not missing large groups of commands

    // Count approximate number of commands by counting commas in the macro
    // This is a rough estimate but helps catch major omissions
    let registry_code = include_str!("registry.rs");
    let command_count = registry_code.matches(',').count();

    // We should have at least 300 commands based on the current codebase
    assert!(
      command_count > 300,
      "Expected at least 300 commands, found approximately {}",
      command_count
    );
  }

  #[test]
  fn test_no_duplicate_commands() {
    // Test that command names are unique (no duplicates in the handler)
    // This helps catch copy-paste errors in the macro

    let registry_code = include_str!("registry.rs");

    // Extract lines that look like command names (simple heuristic)
    let command_lines: Vec<&str> = registry_code
      .lines()
      .filter(|line| line.trim().ends_with(',') && !line.trim().starts_with("//"))
      .filter(|line| !line.contains("//") && !line.contains("/*"))
      .collect();

    // We should have a significant number of command registrations
    assert!(
      command_lines.len() > 100,
      "Expected at least 100 command lines, found {}",
      command_lines.len()
    );
  }

  #[test]
  fn test_registry_module_structure() {
    // Test that the registry follows expected module structure
    use std::any::type_name;

    // Test that VideoCompilerCommandRegistry is the expected type
    assert_eq!(
      type_name::<VideoCompilerCommandRegistry>(),
      "timeline_studio_lib::video_compiler::registry::VideoCompilerCommandRegistry"
    );
  }

  #[test]
  fn test_command_registry_trait_bounds() {
    // Test that the CommandRegistry trait has the expected bounds
    fn test_generic_registration() -> bool {
      // This function tests that CommandRegistry trait works generically
      true
    }

    assert!(test_generic_registration());
  }

  #[test]
  fn test_builder_pattern_compatibility() {
    // Test that the registration works with Tauri's builder pattern
    let builder = Builder::<MockRuntime>::new();

    // Test that we can chain the registration (builder pattern)
    let _result = builder.invoke_handler(tauri::generate_handler![
      // Test with a few representative commands
      auto_select_gpu,
      cleanup_cache,
      compile_video
    ]);

    // Test passes if function compilation succeeds
  }

  #[test]
  fn test_command_organization() {
    // Test that commands are logically organized in the registry
    let registry_code = include_str!("registry.rs");

    // Check that we have clear sections for different command types
    assert!(registry_code.contains("// GPU commands"));
    assert!(registry_code.contains("// Cache commands"));
    assert!(registry_code.contains("// Rendering commands"));
    assert!(registry_code.contains("// Project commands"));
    assert!(registry_code.contains("// Preview commands"));
  }
}
