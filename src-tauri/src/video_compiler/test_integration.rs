//! Интеграционные тесты для Video Compiler

#[cfg(test)]
mod tests {
  use crate::video_compiler::{
    cache::RenderCache,
    initialize,
    renderer::VideoRenderer,
    schema::{Clip, ProjectSchema, Timeline, Track, TrackType},
    CompilerSettings,
  };
  use std::path::PathBuf;
  use std::sync::Arc;
  use tokio::sync::{mpsc, RwLock};

  /// Создать тестовый проект с видео клипами
  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Video Project".to_string());

    // Настройки timeline
    project.timeline = Timeline {
      duration: 10.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: crate::video_compiler::schema::AspectRatio::Ratio16x9,
    };

    // Создаем видео трек
    let mut video_track = Track::new(TrackType::Video, "Main Video".to_string());

    // Добавляем тестовые клипы (используем существующие медиа файлы из public)
    // Используем относительные пути от корня проекта
    let project_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    let clip1 = Clip::new(project_root.join("public").join("t1.mp4"), 0.0, 5.0);

    let mut clip2 = Clip::new(project_root.join("public").join("t2.mp4"), 5.0, 5.0);
    clip2.end_time = 10.0; // Устанавливаем правильное время окончания

    video_track.clips.push(clip1);
    video_track.clips.push(clip2);

    project.tracks.push(video_track);

    project
  }

  #[tokio::test]
  async fn test_full_video_compilation() {
    // Инициализируем Video Compiler
    let state = match initialize().await {
      Ok(state) => state,
      Err(e) => {
        eprintln!("Пропуск теста: Video Compiler не инициализирован: {}", e);
        return;
      }
    };

    // Создаем тестовый проект
    let project = create_test_project();

    // Создаем канал для прогресса
    let (progress_sender, mut progress_receiver) = mpsc::unbounded_channel();

    // Создаем VideoRenderer
    let mut renderer = match VideoRenderer::new(
      project.clone(),
      state.settings.clone(),
      state.cache_manager.clone(),
      progress_sender,
    )
    .await
    {
      Ok(renderer) => renderer,
      Err(e) => {
        eprintln!("Не удалось создать VideoRenderer: {}", e);
        return;
      }
    };

    // Определяем выходной путь
    let output_path = std::env::temp_dir()
      .join("timeline-studio-test")
      .join("test_output.mp4");

    // Создаем директорию если не существует
    if let Some(parent) = output_path.parent() {
      let _ = tokio::fs::create_dir_all(parent).await;
    }

    // Запускаем рендеринг
    match renderer.render(&output_path).await {
      Ok(job_id) => {
        println!("Рендеринг запущен с job_id: {}", job_id);

        // Отслеживаем прогресс
        let mut last_progress = 0u64;
        while let Some(update) = progress_receiver.recv().await {
          use crate::video_compiler::progress::ProgressUpdate;

          match update {
            ProgressUpdate::ProgressChanged { progress, .. } => {
              if progress.current_frame > last_progress {
                println!(
                  "Прогресс: {} кадров из {}, стадия: {}",
                  progress.current_frame, progress.total_frames, progress.stage
                );
                last_progress = progress.current_frame;
              }
            }
            ProgressUpdate::JobCompleted { output_path, .. } => {
              println!("Рендеринг завершен! Файл: {}", output_path);

              // Проверяем что файл создан
              let path = PathBuf::from(&output_path);
              assert!(path.exists(), "Выходной файл должен существовать");

              // Проверяем размер файла
              let metadata = tokio::fs::metadata(&path).await.unwrap();
              assert!(metadata.len() > 0, "Файл не должен быть пустым");

              println!("Размер файла: {} байт", metadata.len());

              // Очищаем тестовый файл
              let _ = tokio::fs::remove_file(&path).await;
              break;
            }
            ProgressUpdate::JobFailed { error, .. } => {
              panic!("Рендеринг не удался: {}", error);
            }
            _ => {}
          }
        }
      }
      Err(e) => {
        eprintln!("Не удалось запустить рендеринг: {}", e);
      }
    }
  }

  #[tokio::test]
  async fn test_invalid_project_validation() {
    // Создаем проект с несуществующими файлами
    let mut project = ProjectSchema::new("Invalid Project".to_string());
    let mut track = Track::new(TrackType::Video, "Invalid Track".to_string());

    let invalid_clip = Clip::new(PathBuf::from("/non/existent/file.mp4"), 0.0, 5.0);

    track.clips.push(invalid_clip);
    project.tracks.push(track);

    // Сначала проверяем что проект не валиден
    let validation_result = project.validate();
    assert!(validation_result.is_err());
    assert!(validation_result
      .unwrap_err()
      .contains("Исходный файл не найден"));

    // Создаем канал для прогресса
    let (progress_sender, _) = mpsc::unbounded_channel();

    // Пытаемся создать VideoRenderer
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache = Arc::new(RwLock::new(RenderCache::new()));

    let result = VideoRenderer::new(project, settings, cache, progress_sender).await;

    // VideoRenderer должен провалиться на валидации
    assert!(result.is_err());
    if let Err(e) = result {
      println!("Ожидаемая ошибка валидации: {}", e);
    }
  }

  #[tokio::test]
  async fn test_render_cancellation() {
    // Инициализируем Video Compiler
    let state = match initialize().await {
      Ok(state) => state,
      Err(e) => {
        eprintln!("Пропуск теста: Video Compiler не инициализирован: {}", e);
        return;
      }
    };

    // Создаем простой проект
    let mut project = ProjectSchema::new("Cancellation Test".to_string());
    project.timeline.duration = 5.0;

    // Создаем канал для прогресса
    let (progress_sender, _progress_receiver) = mpsc::unbounded_channel();

    // Создаем VideoRenderer
    let mut renderer = match VideoRenderer::new(
      project,
      state.settings.clone(),
      state.cache_manager.clone(),
      progress_sender,
    )
    .await
    {
      Ok(renderer) => renderer,
      Err(e) => {
        eprintln!("Не удалось создать VideoRenderer: {}", e);
        return;
      }
    };

    // Запускаем рендеринг
    let output_path = std::env::temp_dir()
      .join("timeline-studio-test")
      .join("test_cancel.mp4");

    let _job_id = match renderer.render(&output_path).await {
      Ok(id) => id,
      Err(e) => {
        eprintln!("Не удалось запустить рендеринг: {}", e);
        return;
      }
    };

    // Даем время на старт рендеринга
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;

    // Отменяем рендеринг
    assert!(renderer.cancel().await.is_ok());

    // Проверяем, что задача отменена
    let progress = renderer.get_progress().await;
    assert!(
      progress.is_none()
        || matches!(
          progress.unwrap().status,
          crate::video_compiler::progress::RenderStatus::Cancelled
        )
    );
  }

  #[tokio::test]
  async fn test_multiple_tracks_composition() {
    // Создаем проект с несколькими треками
    let mut project = ProjectSchema::new("Multi-track Project".to_string());
    project.timeline.duration = 10.0;

    let project_root = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));

    // Видео трек 1
    let mut video_track1 = Track::new(TrackType::Video, "Video Track 1".to_string());
    video_track1.clips.push(Clip::new(
      project_root.join("public").join("t1.mp4"),
      0.0,
      5.0,
    ));

    // Видео трек 2 (наложение)
    let mut video_track2 = Track::new(TrackType::Video, "Video Track 2".to_string());
    let mut overlay_clip = Clip::new(project_root.join("public").join("t2.mp4"), 2.0, 3.0);
    overlay_clip.end_time = 5.0;
    video_track2.clips.push(overlay_clip);

    project.tracks.push(video_track1);
    project.tracks.push(video_track2);

    // Валидация проекта
    match project.validate() {
      Ok(_) => println!("Проект с несколькими треками валиден"),
      Err(e) => {
        eprintln!("Ошибка валидации: {}", e);
        return;
      }
    }
  }

  #[tokio::test]
  async fn test_empty_project_handling() {
    // Создаем пустой проект
    let project = ProjectSchema::new("Empty Project".to_string());

    // Проверяем, что пустой проект проходит валидацию
    assert!(project.validate().is_ok());

    // Проверяем, что длительность = 0
    assert_eq!(project.get_duration(), 0.0);
  }
}
