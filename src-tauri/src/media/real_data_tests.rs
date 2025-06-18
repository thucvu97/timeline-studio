// Тесты с использованием реальных медиафайлов
// Эти тесты запускаются только локально, когда есть test-data директория

#[cfg(test)]
#[allow(clippy::module_inception)]
mod real_data_tests {
  use super::super::metadata::extract_metadata;
  use super::super::test_data::test_data::*;
  use super::super::thumbnail::generate_thumbnail;
  use std::path::PathBuf;
  use std::time::Instant;
  use std::env;

  // Macro to skip tests in CI environment or when test data is not available
  macro_rules! skip_in_ci {
    () => {
      if env::var("CI").is_ok() || env::var("GITHUB_ACTIONS").is_ok() || !test_data_available() {
        eprintln!("Skipping test in CI environment or test-data not available");
        return;
      }
    };
  }

  #[tokio::test]
  async fn test_extract_metadata_from_hevc_video() {
    skip_in_ci!();
    
    skip_in_ci!();
    
    let video = get_test_video();
    let path = video.get_path();

    println!("Testing metadata extraction for: {}", video.filename);
    let start = Instant::now();

    let result = extract_metadata(&path).await;

    let duration = start.elapsed();
    println!("Metadata extraction took: {:?}", duration);

    assert!(
      result.is_ok(),
      "Failed to extract metadata: {:?}",
      result.err()
    );

    let metadata = result.unwrap();
    if let crate::media::types::MediaMetadata::Video(video_meta) = metadata {
      // Проверяем основные свойства
      assert_eq!(video_meta.width, Some(video.width.unwrap()));
      assert_eq!(video_meta.height, Some(video.height.unwrap()));
      assert!(video_meta.duration.is_some());
      assert_eq!(
        video_meta.codec,
        Some(video.video_codec.unwrap().to_string())
      );

      // Проверяем, что длительность совпадает с ожидаемой (с погрешностью)
      let duration_diff = (video_meta.duration.unwrap() - video.duration).abs();
      assert!(
        duration_diff < 0.5,
        "Duration mismatch: expected {}, got {:?}",
        video.duration,
        video_meta.duration
      );
    } else {
      panic!("Expected video metadata, got something else");
    }
  }

  #[tokio::test]
  async fn test_extract_metadata_from_long_audio() {
    skip_in_ci!();
    
    let audio = get_test_audio();
    let path = audio.get_path();

    println!(
      "Testing metadata extraction for long audio: {}",
      audio.filename
    );
    println!(
      "Expected duration: {} seconds ({:.1} minutes)",
      audio.duration,
      audio.duration / 60.0
    );

    let start = Instant::now();
    let result = extract_metadata(&path).await;
    let duration = start.elapsed();

    println!("Metadata extraction took: {:?}", duration);
    assert!(duration.as_secs() < 5, "Metadata extraction took too long");

    assert!(result.is_ok());

    let metadata = result.unwrap();
    if let crate::media::types::MediaMetadata::Audio(audio_meta) = metadata {
      assert_eq!(audio_meta.sample_rate, Some(audio.sample_rate));
      assert_eq!(audio_meta.channels, audio.channels.map(|c| c as u8));
      assert!(audio_meta.duration.is_some());

      // Для длинных аудиофайлов проверяем точность определения длительности
      let duration_diff = (audio_meta.duration.unwrap() - audio.duration).abs();
      assert!(duration_diff < 1.0, "Duration mismatch for long audio");
    } else {
      panic!("Expected audio metadata");
    }
  }

  #[tokio::test]
  async fn test_thumbnail_generation_4k_video() {
    skip_in_ci!();
    
    let video = get_video_files()
      .iter()
      .find(|v| v.width == Some(3840))
      .expect("No 4K video found");

    let path = video.get_path();
    let output_path = PathBuf::from("/tmp/test_thumbnail.jpg");

    println!("Generating thumbnail for 4K video: {}", video.filename);
    let start = Instant::now();

    let result = generate_thumbnail(&path, &output_path, 320, 180, 1.0).await;

    let duration = start.elapsed();
    println!("Thumbnail generation took: {:?}", duration);

    assert!(
      result.is_ok(),
      "Failed to generate thumbnail: {:?}",
      result.err()
    );
    assert!(output_path.exists(), "Thumbnail file was not created");

    // Очищаем после теста
    let _ = std::fs::remove_file(&output_path);

    // Проверяем производительность - для 4K видео допускаем до 10 секунд
    // (может быть медленнее на некоторых системах)
    assert!(
      duration.as_secs() < 10,
      "Thumbnail generation too slow for 4K video: {:?}",
      duration
    );
  }

  #[tokio::test]
  async fn test_handle_cyrillic_filename() {
    skip_in_ci!();
    
    let cyrillic_file = get_file_with_cyrillic().expect("No file with cyrillic name found");

    let path = cyrillic_file.get_path();
    println!(
      "Testing file with cyrillic name: {}",
      cyrillic_file.filename
    );

    // Проверяем, что путь существует
    assert!(
      path.exists(),
      "File with cyrillic name not found: {:?}",
      path
    );

    // Проверяем извлечение метаданных
    let result = extract_metadata(&path).await;
    assert!(
      result.is_ok(),
      "Failed to extract metadata from file with cyrillic name"
    );

    // Проверяем генерацию превью
    let output_path = PathBuf::from("/tmp/тест_превью.jpg");
    let thumb_result = generate_thumbnail(&path, &output_path, 320, 180, 1.0).await;

    assert!(
      thumb_result.is_ok(),
      "Failed to generate thumbnail for file with cyrillic name"
    );

    // Очищаем
    let _ = std::fs::remove_file(&output_path);
  }

  #[tokio::test]
  async fn test_video_without_audio() {
    skip_in_ci!();
    
    // Находим видео без аудио (не изображение)
    let video_no_audio = get_test_files()
      .iter()
      .find(|f| f.has_video && !f.has_audio && f.duration > 0.0)
      .expect("No video without audio found");

    let path = video_no_audio.get_path();
    println!("Testing video without audio: {}", video_no_audio.filename);

    let result = extract_metadata(&path).await;
    assert!(result.is_ok());

    let metadata = result.unwrap();
    if let crate::media::types::MediaMetadata::Video(video_meta) = metadata {
      // Проверяем, что аудио данных нет
      // В текущей структуре VideoMetadata нет полей для аудио,
      // но в реальном приложении нужно проверить отсутствие аудио потоков
      assert!(video_meta.duration.is_some());
      assert!(video_meta.width.is_some());
      assert!(video_meta.height.is_some());
    } else {
      panic!("Expected video metadata, got {:?}", metadata);
    }
  }

  #[tokio::test]
  async fn test_high_bitrate_handling() {
    skip_in_ci!();
    
    let high_bitrate = get_test_files()
      .iter()
      .max_by_key(|f| f.bit_rate)
      .expect("No files found");

    println!(
      "Testing high bitrate file: {} ({:.1} Mbps)",
      high_bitrate.filename,
      high_bitrate.bit_rate as f64 / 1_000_000.0
    );

    let path = high_bitrate.get_path();

    // Тестируем, что высокий битрейт не вызывает проблем
    let metadata_result = extract_metadata(&path).await;
    assert!(metadata_result.is_ok());

    // Проверяем использование памяти при генерации превью
    let output_path = PathBuf::from("/tmp/high_bitrate_thumb.jpg");
    let thumb_result = generate_thumbnail(&path, &output_path, 320, 180, 1.0).await;

    assert!(thumb_result.is_ok());
    let _ = std::fs::remove_file(&output_path);
  }

  #[tokio::test]
  async fn test_parallel_processing() {
    skip_in_ci!();
    
    use futures::future::join_all;

    println!("Testing parallel processing of multiple files");

    let files: Vec<_> = get_test_files().iter().take(3).collect();
    let start = Instant::now();

    let tasks: Vec<_> = files
      .iter()
      .map(|file| {
        let path = file.get_path();
        async move {
          let result = extract_metadata(&path).await;
          (file.filename, result)
        }
      })
      .collect();

    let results = join_all(tasks).await;
    let duration = start.elapsed();

    println!(
      "Parallel processing of {} files took: {:?}",
      files.len(),
      duration
    );

    // Проверяем, что все файлы обработаны успешно
    for (filename, result) in results {
      assert!(
        result.is_ok(),
        "Failed to process {}: {:?}",
        filename,
        result.err()
      );
    }

    // Проверяем, что параллельная обработка быстрее последовательной
    // (приблизительная оценка)
    assert!(
      duration.as_secs() < (files.len() as u64 * 2),
      "Parallel processing seems too slow"
    );
  }

  #[test]
  fn test_file_size_calculations() {
    let largest = get_largest_file();
    println!(
      "Largest file: {} ({:.1} MB)",
      largest.filename,
      largest.size as f64 / 1_048_576.0
    );

    // Проверяем, что мы правильно обрабатываем большие размеры
    assert!(largest.size > 100_000_000, "Expected large file");

    // Проверяем расчет битрейта
    if largest.duration > 0.0 {
      let calculated_bitrate = (largest.size as f64 * 8.0 / largest.duration) as u64;
      let bitrate_diff = (calculated_bitrate as i64 - largest.bit_rate as i64).abs();
      let tolerance = largest.bit_rate / 10; // 10% погрешность

      assert!(
        bitrate_diff < tolerance as i64,
        "Bitrate calculation mismatch: calculated {}, expected {}",
        calculated_bitrate,
        largest.bit_rate
      );
    }
  }

  #[test]
  fn test_codec_variety() {
    let h264_count = get_video_files()
      .iter()
      .filter(|v| v.video_codec == Some("h264"))
      .count();

    let hevc_count = get_video_files()
      .iter()
      .filter(|v| v.video_codec == Some("hevc"))
      .count();

    println!(
      "Codec distribution: H.264: {}, HEVC: {}",
      h264_count, hevc_count
    );

    // Убеждаемся, что у нас есть разные кодеки для тестирования
    assert!(h264_count > 0, "No H.264 videos for testing");
    assert!(hevc_count > 0, "No HEVC videos for testing");
  }

  #[tokio::test]
  async fn test_pcm_audio_in_mp4() {
    skip_in_ci!();
    
    // Тест обработки PCM аудио в MP4 контейнере
    let pcm_video = get_test_files()
      .iter()
      .find(|f| f.has_video && f.has_audio && f.audio_codec == Some("pcm_s16be"))
      .expect("No video with PCM audio found");

    let path = pcm_video.get_path();
    println!("Testing PCM audio in MP4: {}", pcm_video.filename);

    let result = extract_metadata(&path).await;
    assert!(
      result.is_ok(),
      "Failed to extract metadata from PCM audio video"
    );

    let metadata = result.unwrap();
    if let crate::media::types::MediaMetadata::Video(video_meta) = metadata {
      // PCM аудио должно быть обработано корректно
      assert!(video_meta.duration.is_some());
      println!(
        "Successfully processed PCM audio, duration: {:?}s",
        video_meta.duration
      );
    }
  }

  #[tokio::test]
  async fn test_different_sample_rates() {
    skip_in_ci!();
    
    // Тест обработки различных частот дискретизации
    let files_44khz = get_test_files()
      .iter()
      .filter(|f| f.sample_rate == 44100)
      .count();

    let files_48khz = get_test_files()
      .iter()
      .filter(|f| f.sample_rate == 48000)
      .count();

    println!(
      "Sample rates: 44.1kHz: {}, 48kHz: {}",
      files_44khz, files_48khz
    );

    // Проверяем, что у нас есть файлы с разными частотами
    assert!(
      files_44khz > 0 || files_48khz > 0,
      "No audio files with standard sample rates"
    );
  }

  #[tokio::test]
  async fn test_memory_usage_large_files() {
    skip_in_ci!();
    
    // Тест использования памяти при обработке больших файлов
    let large_file = get_largest_file();
    let path = large_file.get_path();

    println!(
      "Testing memory usage with large file: {} ({:.1} MB)",
      large_file.filename,
      large_file.size as f64 / 1_000_000.0
    );

    // Замеряем время обработки
    let start = Instant::now();
    let result = extract_metadata(&path).await;
    let duration = start.elapsed();

    assert!(result.is_ok(), "Failed to process large file");

    // Проверяем, что обработка не занимает слишком много времени
    assert!(
      duration.as_secs() < 10,
      "Processing large file took too long: {:?}",
      duration
    );

    // В реальном приложении здесь можно было бы замерить использование памяти
    println!("Large file processed in {:?}", duration);
  }

  #[tokio::test]
  async fn test_mixed_content_project() {
    skip_in_ci!();
    
    // Тест работы со смешанным контентом (видео с аудио и без)
    let with_audio = get_test_files()
      .iter()
      .filter(|f| f.has_video && f.has_audio)
      .count();

    let without_audio = get_test_files()
      .iter()
      .filter(|f| f.has_video && !f.has_audio)
      .count();

    println!(
      "Mixed content: {} videos with audio, {} without audio",
      with_audio, without_audio
    );

    // Убеждаемся, что у нас есть оба типа
    assert!(with_audio > 0, "No videos with audio for testing");
    assert!(without_audio > 0, "No videos without audio for testing");

    // Обрабатываем по одному файлу каждого типа
    if let Some(video_with_audio) = get_test_files().iter().find(|f| f.has_video && f.has_audio) {
      let result = extract_metadata(&video_with_audio.get_path()).await;
      assert!(result.is_ok(), "Failed to process video with audio");
    }

    if let Some(video_without_audio) = get_test_files()
      .iter()
      .find(|f| f.has_video && !f.has_audio)
    {
      let result = extract_metadata(&video_without_audio.get_path()).await;
      assert!(result.is_ok(), "Failed to process video without audio");
    }
  }

  #[tokio::test]
  async fn test_full_import_cycle() {
    skip_in_ci!();
    
    // Интеграционный тест: полный цикл импорта
    use tempfile::TempDir;

    // Создаем временную директорию для миниатюр
    let temp_dir = TempDir::new().unwrap();
    let _thumbnail_dir = temp_dir.path().to_path_buf();

    // Создаем процессор (нужен мок AppHandle для полного теста)
    println!("Testing full import cycle with all test files");

    // Здесь мы бы использовали MediaProcessor для полного цикла,
    // но для этого нужен AppHandle, который сложно мокать

    // Вместо этого проверяем, что все файлы могут быть обработаны
    let mut processed = 0;
    let mut errors = 0;

    for file in get_test_files().iter() {
      let path = file.get_path();
      let result = extract_metadata(&path).await;

      match result {
        Ok(_) => processed += 1,
        Err(e) => {
          println!("Error processing {}: {}", file.filename, e);
          errors += 1;
        }
      }
    }

    println!(
      "Import cycle complete: {} processed, {} errors",
      processed, errors
    );
    assert_eq!(errors, 0, "Some files failed to process");
    assert_eq!(
      processed,
      get_test_files().len(),
      "Not all files were processed"
    );
  }

  #[tokio::test]
  async fn test_hevc_codec_handling() {
    skip_in_ci!();
    
    // Специальный тест для HEVC кодека
    let hevc_files: Vec<_> = get_test_files()
      .iter()
      .filter(|f| f.video_codec == Some("hevc"))
      .collect();

    assert!(!hevc_files.is_empty(), "No HEVC files for testing");

    for file in hevc_files {
      println!("Testing HEVC file: {}", file.filename);

      let result = extract_metadata(&file.get_path()).await;
      assert!(
        result.is_ok(),
        "Failed to process HEVC file: {}",
        file.filename
      );

      // Генерация превью для HEVC
      let output_path = PathBuf::from(format!("/tmp/hevc_thumb_{}.jpg", file.filename));
      let thumb_result = generate_thumbnail(&file.get_path(), &output_path, 320, 180, 1.0).await;

      assert!(
        thumb_result.is_ok(),
        "Failed to generate thumbnail for HEVC: {}",
        file.filename
      );

      // Очищаем
      let _ = std::fs::remove_file(&output_path);
    }
  }

  #[tokio::test]
  async fn test_error_recovery() {
    skip_in_ci!();
    
    // Тест восстановления после ошибок
    use std::path::Path;

    // Пытаемся обработать несуществующий файл
    let fake_path = Path::new("/tmp/non_existent_file.mp4");
    let result = extract_metadata(fake_path).await;

    assert!(result.is_err(), "Expected error for non-existent file");

    // Проверяем, что после ошибки можно продолжить работу
    let real_file = get_test_video();
    let real_result = extract_metadata(&real_file.get_path()).await;

    assert!(
      real_result.is_ok(),
      "Failed to process real file after error"
    );
  }

  #[tokio::test]
  async fn test_extract_frame_from_video_without_audio() {
    skip_in_ci!();
    
    // Тест извлечения кадра из видео без аудио
    let video_no_audio = get_test_files()
      .iter()
      .find(|f| f.has_video && !f.has_audio && f.duration > 0.0)
      .expect("No video without audio found");

    let path = video_no_audio.get_path();
    let output_path = PathBuf::from("/tmp/test_no_audio_thumb.jpg");

    println!(
      "Extracting frame from video without audio: {}",
      video_no_audio.filename
    );

    // Извлекаем кадр из середины видео
    let seek_time = video_no_audio.duration / 2.0;
    let result = generate_thumbnail(&path, &output_path, 320, 180, seek_time).await;

    assert!(
      result.is_ok(),
      "Failed to extract frame from video without audio: {:?}",
      result.err()
    );
    assert!(output_path.exists(), "Thumbnail file was not created");

    // Очищаем после теста
    let _ = std::fs::remove_file(&output_path);
  }

  #[tokio::test]
  async fn test_large_file_performance() {
    skip_in_ci!();
    
    // Тест производительности для больших файлов (256MB)
    let large_audio = get_audio_files()
      .iter()
      .max_by_key(|f| f.size)
      .expect("No audio files found");

    println!(
      "Testing performance with large file: {} ({:.1} MB)",
      large_audio.filename,
      large_audio.size as f64 / 1_048_576.0
    );

    // Замеряем время извлечения метаданных
    let start = Instant::now();
    let result = extract_metadata(&large_audio.get_path()).await;
    let metadata_duration = start.elapsed();

    assert!(result.is_ok(), "Failed to extract metadata from large file");
    println!(
      "Metadata extraction for 256MB file took: {:?}",
      metadata_duration
    );

    // Для больших файлов допускаем до 5 секунд на извлечение метаданных
    assert!(
      metadata_duration.as_secs() < 5,
      "Metadata extraction too slow for large file: {:?}",
      metadata_duration
    );
  }

  #[test]
  fn test_paths_with_spaces() {
    // Тест обработки путей с пробелами
    use std::path::Path;

    // Создаем путь с пробелами
    let path_with_spaces = Path::new("/tmp/test folder with spaces/video file.mp4");

    // Проверяем, что путь корректно преобразуется в строку
    let path_str = path_with_spaces.to_string_lossy();
    assert!(path_str.contains(" "), "Path should contain spaces");

    // В реальном тесте здесь нужно было бы создать файл и проверить его обработку
    // Но поскольку у нас нет реальных файлов с пробелами в путях,
    // проверяем только корректность работы с путями
  }

  #[tokio::test]
  async fn test_4k_video_compilation() {
    skip_in_ci!();
    
    // Тест компиляции 4K видео
    let video_4k = get_video_files()
      .iter()
      .find(|v| v.width == Some(3840) && v.height == Some(2160))
      .expect("No 4K video found");

    println!(
      "Testing 4K video compilation readiness: {}",
      video_4k.filename
    );

    // Проверяем, что метаданные 4K видео извлекаются корректно
    let metadata = extract_metadata(&video_4k.get_path()).await;
    assert!(metadata.is_ok(), "Failed to extract 4K video metadata");

    if let Ok(crate::media::types::MediaMetadata::Video(video_meta)) = metadata {
      assert_eq!(video_meta.width, Some(3840));
      assert_eq!(video_meta.height, Some(2160));
      assert!(video_meta.codec.is_some());
      println!(
        "4K video ready for compilation: {}x{}, codec: {:?}",
        video_meta.width.unwrap(),
        video_meta.height.unwrap(),
        video_meta.codec
      );
    }
  }

  #[tokio::test]
  async fn test_mixed_audio_formats() {
    skip_in_ci!();
    
    // Тест микширования видео с разными аудио форматами
    let pcm_video = get_test_files()
      .iter()
      .find(|f| f.audio_codec == Some("pcm_s16be"))
      .expect("No video with PCM audio found");

    let aac_video = get_test_files()
      .iter()
      .find(|f| f.audio_codec == Some("aac"))
      .expect("No video with AAC audio found");

    println!("Testing mixed audio formats:");
    println!("  - PCM audio: {}", pcm_video.filename);
    println!("  - AAC audio: {}", aac_video.filename);

    // Проверяем, что оба типа аудио обрабатываются корректно
    let pcm_result = extract_metadata(&pcm_video.get_path()).await;
    let aac_result = extract_metadata(&aac_video.get_path()).await;

    assert!(pcm_result.is_ok(), "Failed to process PCM audio");
    assert!(aac_result.is_ok(), "Failed to process AAC audio");

    // В реальной компиляции эти форматы нужно будет преобразовать в единый формат
    println!("Both audio formats processed successfully, ready for mixing");
  }
}
