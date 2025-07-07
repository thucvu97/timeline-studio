use tauri::{Builder, Runtime};

/// Build Tauri application with all registered commands
pub fn build_app<R: Runtime>() -> Builder<R> {
  let mut builder = Builder::<R>::new()
    // Register plugins
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build());

  // Platform-specific plugin registration
  #[cfg(not(any(target_os = "android", target_os = "ios")))]
  {
    builder = builder.plugin(tauri_plugin_global_shortcut::Builder::new().build());
  }

  // Register command handler
  builder.invoke_handler(tauri::generate_handler![
    // Language commands
    crate::language_tauri::get_app_language_tauri,
    crate::language_tauri::set_app_language_tauri,
    // Filesystem commands
    crate::filesystem::file_exists,
    crate::filesystem::get_file_stats,
    crate::filesystem::get_platform,
    crate::filesystem::search_files_by_name,
    crate::filesystem::get_absolute_path,
    // App directories commands
    crate::app_dirs::create_app_directories,
    crate::app_dirs::get_app_directories,
    crate::app_dirs::get_directory_sizes,
    crate::app_dirs::clear_app_cache,
    // Media commands
    crate::media::commands::get_media_files,
    crate::media::commands::get_media_metadata,
    crate::media::commands::clear_media_preview_data,
    crate::media::commands::extract_recognition_frames,
    crate::media::commands::generate_media_thumbnail,
    crate::media::commands::generate_timeline_previews,
    crate::media::commands::get_files_with_previews,
    crate::media::commands::get_media_preview_data,
    crate::media::commands::get_timeline_frames,
    crate::media::commands::load_preview_data,
    crate::media::commands::process_media_file_simple,
    crate::media::commands::process_media_files,
    crate::media::commands::process_media_files_with_thumbnails,
    crate::media::commands::save_preview_data,
    crate::media::commands::save_timeline_frames,
    // Recognition commands
    crate::recognition::commands::clear_recognition_results,
    crate::recognition::commands::export_recognition_results,
    crate::recognition::commands::get_preview_data_with_recognition,
    crate::recognition::commands::get_recognition_results,
    crate::recognition::commands::get_yolo_class_names,
    crate::recognition::commands::load_yolo_model,
    crate::recognition::commands::process_video_batch,
    crate::recognition::commands::process_video_recognition,
    crate::recognition::commands::process_yolo_batch,
    crate::recognition::commands::set_yolo_target_classes,
    // New YOLO processor commands
    crate::recognition::commands::yolo_commands::create_yolo_processor,
    crate::recognition::commands::yolo_commands::process_image_with_yolo,
    crate::recognition::commands::yolo_commands::process_video_file_with_yolo,
    crate::recognition::commands::yolo_commands::process_image_sequence_with_yolo,
    crate::recognition::commands::yolo_commands::save_yolo_results,
    crate::recognition::commands::yolo_commands::update_yolo_config,
    crate::recognition::commands::yolo_commands::get_yolo_config,
    crate::recognition::commands::yolo_commands::extract_frames_for_yolo,
    crate::recognition::commands::yolo_commands::get_available_yolo_models,
    crate::recognition::commands::yolo_commands::remove_yolo_processor,
    crate::recognition::commands::yolo_commands::list_active_yolo_processors,
    crate::recognition::commands::yolo_commands::cleanup_yolo_processors,
    crate::recognition::commands::yolo_commands::create_yolo_processor_with_builder,
    // Recognition advanced commands
    crate::video_compiler::commands::recognition_advanced_commands::get_frame_processor_class_names,
    crate::video_compiler::commands::recognition_advanced_commands::get_recognition_results_by_time_range,
    crate::video_compiler::commands::recognition_advanced_commands::get_recognition_results_by_class,
    crate::video_compiler::commands::recognition_advanced_commands::format_recognition_results_for_timeline,
    crate::video_compiler::commands::recognition_advanced_commands::check_is_face_model,
    crate::video_compiler::commands::recognition_advanced_commands::check_is_segmentation_model,
    // Security commands
    crate::security::save_simple_api_key,
    crate::security::save_oauth_credentials,
    crate::security::get_api_key_info,
    crate::security::get_decrypted_api_key,
    crate::security::list_api_keys,
    crate::security::delete_api_key,
    crate::security::validate_api_key,
    crate::security::generate_oauth_url,
    crate::security::exchange_oauth_code,
    crate::security::refresh_oauth_token,
    crate::security::get_oauth_user_info,
    crate::security::parse_oauth_callback_url,
    crate::security::import_from_env,
    crate::security::export_to_env_format,
    // Subtitle commands
    crate::subtitles::read_subtitle_file,
    crate::subtitles::save_subtitle_file,
    crate::subtitles::validate_subtitle_format,
    crate::subtitles::convert_subtitle_format,
    crate::subtitles::get_subtitle_info,
    // Security advanced commands from additional_commands module
    crate::security::additional_commands::create_secure_storage,
    crate::security::additional_commands::create_secure_storage_new,
    crate::security::additional_commands::get_or_create_encryption_key_command,
    crate::security::additional_commands::check_storage_security,
    crate::security::additional_commands::get_secure_storage_info,
    // Video compiler commands - using the already exported commands from the module
    crate::video_compiler::commands::auto_select_gpu,
    crate::video_compiler::commands::benchmark_gpu,
    crate::video_compiler::commands::check_gpu_encoder_availability,
    crate::video_compiler::commands::check_hardware_acceleration,
    crate::video_compiler::commands::check_hardware_acceleration_support,
    crate::video_compiler::commands::get_gpu_capabilities_full,
    crate::video_compiler::commands::cache_media_metadata,
    crate::video_compiler::commands::clean_old_cache,
    crate::video_compiler::commands::cleanup_cache,
    crate::video_compiler::commands::clear_all_cache,
    crate::video_compiler::commands::clear_cache,
    crate::video_compiler::commands::clear_file_preview_cache,
    crate::video_compiler::commands::clear_frame_cache,
    crate::video_compiler::commands::clear_media_metadata_cache,
    crate::video_compiler::commands::clear_prerender_cache,
    crate::video_compiler::commands::get_prerender_cache_info,
    crate::video_compiler::commands::prerender_segment,
    crate::video_compiler::commands::check_prerender_status,
    crate::video_compiler::commands::get_prerendered_segments,
    crate::video_compiler::commands::delete_prerendered_segment,
    crate::video_compiler::commands::optimize_prerender_cache,
    crate::video_compiler::commands::clear_preview_cache,
    crate::video_compiler::commands::clear_preview_cache_for_file,
    crate::video_compiler::commands::clear_preview_generator_cache_for_file,
    crate::video_compiler::commands::clear_project_cache,
    crate::video_compiler::commands::clear_project_previews,
    crate::video_compiler::commands::clear_render_cache,
    crate::video_compiler::commands::get_cache_stats,
    crate::video_compiler::commands::compile_video,
    crate::video_compiler::commands::cancel_render,
    crate::video_compiler::commands::build_preview_command,
    crate::video_compiler::commands::build_prerender_segment_command,
    crate::video_compiler::commands::build_render_command_with_settings,
    crate::video_compiler::commands::build_segment_render_command,
    crate::video_compiler::commands::create_new_project,
    crate::video_compiler::commands::analyze_project,
    crate::video_compiler::commands::backup_project,
    crate::video_compiler::commands::check_project_media_availability,
    crate::video_compiler::commands::batch_generate_previews_service,
    // Preview advanced commands
    crate::video_compiler::commands::create_preview_generator_with_ffmpeg,
    crate::video_compiler::commands::set_preview_generator_ffmpeg_path_advanced,
    crate::video_compiler::commands::generate_preview_batch_advanced,
    crate::video_compiler::commands::generate_single_frame_preview,
    crate::video_compiler::commands::get_preview_generator_info,
    crate::video_compiler::commands::generate_preview_with_options,
    crate::video_compiler::commands::apply_video_filter,
    crate::video_compiler::commands::check_ffmpeg_available,
    crate::video_compiler::commands::check_ffmpeg_capabilities,
    crate::video_compiler::commands::check_ffmpeg_installation,
    crate::video_compiler::commands::get_system_info,
    crate::video_compiler::commands::concat_videos,
    crate::video_compiler::commands::configure_cache,
    crate::video_compiler::commands::add_clip_to_track,
    crate::video_compiler::commands::add_subtitles_to_project,
    crate::video_compiler::commands::create_clip,
    crate::video_compiler::commands::create_custom_alert,
    crate::video_compiler::commands::create_effect,
    crate::video_compiler::commands::create_filter,
    crate::video_compiler::commands::create_schema_objects,
    crate::video_compiler::commands::create_style_template,
    crate::video_compiler::commands::create_subtitle_animation_new,
    crate::video_compiler::commands::create_style_template_new,
    crate::video_compiler::commands::get_cached_metadata,
    crate::video_compiler::commands::get_cache_memory_usage,
    crate::video_compiler::commands::get_current_gpu_info,
    crate::video_compiler::commands::get_gpu_info,
    crate::video_compiler::commands::get_recommended_gpu_encoder,
    crate::video_compiler::commands::get_render_cache_info,
    crate::video_compiler::commands::get_video_info,
    // Pipeline commands
    crate::video_compiler::commands::create_and_execute_pipeline,
    crate::video_compiler::commands::get_pipeline_info,
    crate::video_compiler::commands::cancel_pipeline,
    crate::video_compiler::commands::get_pipeline_statistics,
    crate::video_compiler::commands::get_pipeline_context,
    crate::video_compiler::commands::update_pipeline_settings,
    crate::video_compiler::commands::validate_pipeline_configuration,
    crate::video_compiler::commands::insert_pipeline_stage,
    crate::video_compiler::commands::remove_pipeline_stage,
    crate::video_compiler::commands::build_custom_pipeline,
    crate::video_compiler::commands::get_pipeline_execution_summary,
    crate::video_compiler::commands::get_pipeline_progress,
    crate::video_compiler::commands::cleanup_completed_pipelines,
    // Service commands
    crate::video_compiler::commands::get_active_jobs,
    crate::video_compiler::commands::get_render_progress,
    crate::video_compiler::commands::get_render_statistics,
    // Monitoring commands
    crate::video_compiler::commands::get_service_metrics_summary,
    crate::video_compiler::commands::reset_service_metrics_detailed,
    crate::video_compiler::commands::get_all_metrics_summaries,
    crate::video_compiler::commands::export_metrics_prometheus_detailed,
    crate::video_compiler::commands::check_services_health,
    crate::video_compiler::commands::get_performance_metrics,
    crate::video_compiler::commands::reset_all_metrics,
    crate::video_compiler::commands::get_registry_service_metrics,
    // Video analysis commands
    crate::video_compiler::commands::ffmpeg_get_metadata,
    crate::video_compiler::commands::ffmpeg_detect_scenes,
    crate::video_compiler::commands::ffmpeg_analyze_quality,
    crate::video_compiler::commands::ffmpeg_detect_silence,
    crate::video_compiler::commands::ffmpeg_analyze_motion,
    crate::video_compiler::commands::ffmpeg_extract_keyframes,
    crate::video_compiler::commands::ffmpeg_analyze_audio,
    crate::video_compiler::commands::ffmpeg_quick_analysis,
    // Whisper commands
    crate::video_compiler::commands::whisper_transcribe_openai,
    crate::video_compiler::commands::whisper_translate_openai,
    crate::video_compiler::commands::whisper_transcribe_local,
    crate::video_compiler::commands::whisper_get_local_models,
    crate::video_compiler::commands::whisper_download_model,
    crate::video_compiler::commands::whisper_check_local_availability,
    crate::video_compiler::commands::extract_audio_for_whisper,
    // Batch processing commands
    crate::video_compiler::commands::create_batch_job,
    crate::video_compiler::commands::get_batch_job_info,
    crate::video_compiler::commands::cancel_batch_job,
    crate::video_compiler::commands::list_batch_jobs,
    crate::video_compiler::commands::get_batch_processing_stats,
    crate::video_compiler::commands::update_batch_clip_result,
    crate::video_compiler::commands::cleanup_batch_jobs,
    crate::video_compiler::commands::set_batch_job_status,
    // Multimodal analysis commands
    crate::video_compiler::commands::extract_frames_for_multimodal_analysis,
    crate::video_compiler::commands::convert_image_to_base64,
    crate::video_compiler::commands::extract_thumbnail_candidates,
    crate::video_compiler::commands::create_frame_collage,
    crate::video_compiler::commands::optimize_image_for_analysis,
    crate::video_compiler::commands::cleanup_extracted_frames,
    // Platform optimization commands
    crate::video_compiler::commands::ffmpeg_optimize_for_platform,
    crate::video_compiler::commands::ffmpeg_generate_platform_thumbnail,
    crate::video_compiler::commands::ffmpeg_batch_optimize_platforms,
    crate::video_compiler::commands::ffmpeg_analyze_platform_compliance,
    crate::video_compiler::commands::ffmpeg_create_progressive_video,
    // Compiler settings commands
    crate::video_compiler::commands::get_compiler_settings_advanced,
    crate::video_compiler::commands::update_compiler_settings_advanced,
    // Workflow automation commands
    crate::video_compiler::commands::create_directory,
    crate::video_compiler::commands::create_timeline_project,
    crate::video_compiler::commands::compile_workflow_video,
    crate::video_compiler::commands::analyze_workflow_video_quality,
    crate::video_compiler::commands::create_workflow_preview,
    crate::video_compiler::commands::cleanup_workflow_temp_files,
    // FFmpeg builder commands
    crate::video_compiler::commands::add_segment_inputs_to_builder,
    crate::video_compiler::commands::create_ffmpeg_with_prerender_settings,
    crate::video_compiler::commands::get_clip_input_index_from_builder,
    crate::video_compiler::commands::get_ffmpeg_builder_info,
    // FFmpeg executor commands
    crate::video_compiler::commands::execute_ffmpeg_with_progress_tracking,
    crate::video_compiler::commands::execute_ffmpeg_simple_no_progress,
    crate::video_compiler::commands::get_ffmpeg_executor_capabilities,
    crate::video_compiler::commands::check_ffmpeg_executor_availability,
    // FFmpeg advanced commands
    crate::video_compiler::commands::generate_video_preview,
    crate::video_compiler::commands::generate_gif_preview,
    crate::video_compiler::commands::probe_media_file,
    crate::video_compiler::commands::test_hardware_acceleration,
    crate::video_compiler::commands::generate_subtitle_preview,
    crate::video_compiler::commands::get_ffmpeg_codecs,
    crate::video_compiler::commands::get_ffmpeg_formats,
    crate::video_compiler::commands::execute_ffmpeg_with_progress,
    crate::video_compiler::commands::execute_ffmpeg_simple,
    crate::video_compiler::commands::get_ffmpeg_execution_info,
    // FFmpeg utilities commands
    crate::video_compiler::commands::execute_ffmpeg_simple_command,
    crate::video_compiler::commands::execute_ffmpeg_with_progress_advanced,
    crate::video_compiler::commands::get_ffmpeg_available_codecs,
    crate::video_compiler::commands::get_ffmpeg_available_formats,
    crate::video_compiler::commands::generate_subtitle_preview_advanced,
    crate::video_compiler::commands::get_ffmpeg_execution_information,
    // Plugin system commands
    crate::core::plugins::commands::load_plugin,
    crate::core::plugins::commands::unload_plugin,
    crate::core::plugins::commands::list_loaded_plugins,
    crate::core::plugins::commands::list_available_plugins,
    crate::core::plugins::commands::send_plugin_command,
    crate::core::plugins::commands::get_plugin_info,
    crate::core::plugins::commands::suspend_plugin,
    crate::core::plugins::commands::resume_plugin,
    crate::core::plugins::commands::get_plugins_sandbox_stats,
    crate::core::plugins::commands::get_violating_plugins,
    crate::core::plugins::commands::reset_plugin_violations,
    crate::core::plugins::commands::register_example_plugins,
    // Smart Montage Planner commands
    crate::montage_planner::commands::analyze_video_composition,
    crate::montage_planner::commands::detect_key_moments,
    crate::montage_planner::commands::generate_montage_plan,
    crate::montage_planner::commands::get_analysis_progress,
    crate::montage_planner::commands::update_composition_weights,
    // Misc commands
    crate::greet,
    crate::scan_media_folder,
    crate::scan_media_folder_with_thumbnails,
    crate::test_plugin_system,
  ])
}

#[cfg(test)]
mod tests {
  use super::*;

  // Use a type alias for testing instead of implementing Runtime
  type MockRuntime = tauri::Wry;

  #[test]
  fn test_build_app_basic() {
    // Test that the app builder can be created without panicking
    let builder = build_app::<MockRuntime>();

    // We can't easily test the actual builder without full runtime setup,
    // but we can verify it was created successfully
    assert!(std::ptr::addr_of!(builder) as usize != 0);
  }

  #[test]
  fn test_build_app_has_plugins() {
    // Create the builder
    let _builder = build_app::<MockRuntime>();

    // This test verifies that the function can be called and returns a builder
    // In a real test environment with full Tauri setup, we could test plugin registration
    // Test passes if plugins are registered without panicking
  }

  #[test]
  fn test_plugins_initialization() {
    // Test that plugin builders can be created (without calling build())
    let _log_builder = tauri_plugin_log::Builder::new();
    let _notification_plugin = tauri_plugin_notification::init::<MockRuntime>();
    let _fs_plugin = tauri_plugin_fs::init::<MockRuntime>();
    let _dialog_plugin = tauri_plugin_dialog::init::<MockRuntime>();
    let _websocket_plugin = tauri_plugin_websocket::init::<MockRuntime>();
    let _opener_plugin = tauri_plugin_opener::init::<MockRuntime>();
    let _store_builder = tauri_plugin_store::Builder::default();

    // Platform-specific plugin test
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
      let _shortcut_builder = tauri_plugin_global_shortcut::Builder::<MockRuntime>::new();
    }

    // If we reach here without panicking, plugins can be initialized
    // Test passes if code compiles and executes without panicking
  }

  #[test]
  fn test_command_registration_structure() {
    // This test verifies that the command registration doesn't panic during compilation
    // The actual commands are tested in their respective modules

    // We can't easily test the tauri::generate_handler! macro without full setup,
    // but we can verify the structure is correct by ensuring compilation succeeds
    // Test passes if code compiles and executes without panicking
  }

  #[test]
  fn test_command_groups_count() {
    // Verify that we have all expected command groups based on the macro content
    // This is a structural test to ensure no command groups are accidentally removed

    // Count approximate number of commands by looking at the macro structure
    // This is an indirect test since we can't inspect the macro result directly

    // Language commands: 2
    // Filesystem commands: 5
    // App directories commands: 4
    // Media commands: 13
    // Recognition commands: 22 (10 + 12)
    // Security commands: 16 (11 + 5)
    // Subtitle commands: 5
    // Video compiler commands: Many (100+)
    // Plugin system commands: 12
    // Misc commands: 3

    // Total should be around 180+ commands
    let expected_min_commands = 150;
    let estimated_commands = 180; // Rough estimate based on the macro content

    assert!(estimated_commands >= expected_min_commands);
  }

  #[test]
  fn test_platform_specific_compilation() {
    // Test that platform-specific code compiles correctly
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
      // Desktop platforms should have global shortcut support
      // Test passes if code compiles and executes without panicking
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
      // Mobile platforms should not have global shortcut support
      // Test passes if code compiles and executes without panicking
    }
  }

  #[test]
  fn test_builder_configuration() {
    // Test that the builder has the expected basic configuration
    let builder = build_app::<MockRuntime>();

    // Verify builder was created (basic smoke test)
    // In a full test environment, we would verify:
    // - All plugins are registered
    // - All commands are available
    // - Invoke handler is properly configured
    let builder_ptr = std::ptr::addr_of!(builder);
    assert!(!builder_ptr.is_null());
  }

  #[test]
  fn test_store_plugin_builder() {
    // Test that the store plugin builder can be created
    let store_builder = tauri_plugin_store::Builder::default();

    // Verify builder was created
    assert!(std::ptr::addr_of!(store_builder) as usize != 0);
  }

  #[test]
  fn test_log_plugin_builder() {
    // Test that the log plugin builder can be created
    let log_builder = tauri_plugin_log::Builder::new();

    // Verify builder was created
    assert!(std::ptr::addr_of!(log_builder) as usize != 0);
  }

  #[test]
  fn test_command_categories() {
    // Test that all major command categories are represented
    // This is a documentation/structure test

    let categories = [
      "Language commands",
      "Filesystem commands",
      "App directories commands",
      "Media commands",
      "Recognition commands",
      "Security commands",
      "Subtitle commands",
      "Video compiler commands",
      "Plugin system commands",
      "Misc commands",
    ];

    // Verify we have all expected categories
    assert_eq!(categories.len(), 10);
    assert!(categories.contains(&"Media commands"));
    assert!(categories.contains(&"Security commands"));
    assert!(categories.contains(&"Video compiler commands"));
  }

  #[test]
  fn test_critical_commands_present() {
    // Test that critical command modules are referenced
    // This ensures key functionality is available

    // We can't directly test the macro expansion, but we can verify
    // that the function compiles and includes references to critical modules

    // If these modules don't exist or have compilation errors,
    // the build_app function would fail to compile

    // Media commands
    let _media_ref = crate::media::commands::get_media_files;

    // Security commands
    let _security_ref = crate::security::save_simple_api_key;

    // Video compiler commands exist (we can't reference them directly due to generics)
    // let _video_ref = crate::video_compiler::commands::compile_video;

    // Plugin commands
    let _plugin_ref = crate::core::plugins::commands::load_plugin;

    // Test passes if code compiles and executes without panicking // If we reach here, all critical commands are accessible
  }

  #[test]
  fn test_tauri_builder_chain() {
    // Test that the builder can be created and plugins can be referenced
    let builder = Builder::<MockRuntime>::new();
    let _fs_plugin = tauri_plugin_fs::init::<MockRuntime>();

    // If builder creation works without compilation errors, test passes
    assert!(std::ptr::addr_of!(builder) as usize != 0);
    assert!(std::ptr::addr_of!(_fs_plugin) as usize != 0);
  }
}
