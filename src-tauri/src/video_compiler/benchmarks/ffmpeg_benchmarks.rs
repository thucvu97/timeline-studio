//! Бенчмарки производительности для FFmpeg операций
//!
//! Этот модуль содержит бенчмарки для измерения производительности
//! различных FFmpeg операций, включая генерацию превью, конвертацию
//! и применение фильтров.

#![cfg(test)]

use super::super::{
  ffmpeg_builder::FFmpegBuilder,
  ffmpeg_executor::FFmpegExecutor,
  schema::ProjectSchema,
  services::preview_service::{PreviewService, PreviewServiceImpl, PreviewType},
  services::FfmpegService,
};
use criterion::{black_box, criterion_group, criterion_main, BenchmarkId, Criterion};
use std::path::PathBuf;
use std::sync::Arc;
use tempfile::TempDir;
use tokio::runtime::Runtime;

/// Мок FFmpeg сервис для бенчмарков
struct MockFfmpegService;

impl FfmpegService for MockFfmpegService {
  fn get_ffmpeg_path(&self) -> &str {
    "echo"
  }
}

/// Создать тестовый проект для бенчмарков
fn create_benchmark_project(num_clips: usize) -> ProjectSchema {
  let mut project = ProjectSchema::new("benchmark_project".to_string());

  // Добавляем трек
  let mut track = super::super::schema::timeline::Track::new(
    super::super::schema::timeline::TrackType::Video,
    "Video Track".to_string(),
  );

  // Добавляем клипы
  for i in 0..num_clips {
    let clip = super::super::schema::timeline::Clip::new(
      PathBuf::from(format!("/test/video_{}.mp4", i)),
      i as f64 * 10.0,
      10.0,
    );
    track.add_clip(clip);
  }

  project.tracks.push(track);
  project
}

/// Бенчмарк построения команд FFmpeg
fn benchmark_ffmpeg_builder(c: &mut Criterion) {
  let rt = Runtime::new().unwrap();
  let project = create_benchmark_project(10);
  let builder = FFmpegBuilder::new(project);

  let mut group = c.benchmark_group("ffmpeg_builder");

  // Бенчмарк построения команды миниатюр
  group.bench_function("build_thumbnails_command", |b| {
    b.iter(|| {
      rt.block_on(async {
        builder
          .build_thumbnails_command(
            black_box(&PathBuf::from("/test/video.mp4")),
            black_box("/tmp/thumb_%03d.jpg"),
            black_box(5),
            black_box(Some((320, 180))),
          )
          .await
      })
    })
  });

  // Бенчмарк построения команды waveform
  group.bench_function("build_waveform_command", |b| {
    b.iter(|| {
      rt.block_on(async {
        builder
          .build_waveform_command(
            black_box(&PathBuf::from("/test/audio.mp3")),
            black_box(&PathBuf::from("/tmp/waveform.png")),
            black_box((1920, 200)),
            black_box("#00FF00"),
          )
          .await
      })
    })
  });

  // Бенчмарк построения команды GIF превью
  group.bench_function("build_gif_preview_command", |b| {
    b.iter(|| {
      rt.block_on(async {
        builder
          .build_gif_preview_command(
            black_box(&PathBuf::from("/test/video.mp4")),
            black_box(&PathBuf::from("/tmp/preview.gif")),
            black_box(5.0),
            black_box(10.0),
            black_box(Some((320, 180))),
            black_box(Some(10)),
          )
          .await
      })
    })
  });

  group.finish();
}

/// Бенчмарк парсинга прогресса FFmpeg
fn benchmark_progress_parsing(c: &mut Criterion) {
  let executor = FFmpegExecutor::new();
  let regex = regex::Regex::new(super::super::ffmpeg_executor::PROGRESS_REGEX).unwrap();

  let mut group = c.benchmark_group("progress_parsing");

  let test_lines = vec![
        "frame=  100 fps=25.0 q=28.0 size=     512kB time=00:00:03.33 bitrate=1258.3kbits/s speed=0.83x",
        "frame= 1000 fps=30.5 q=28.0 size=    5120kB time=00:00:33.33 bitrate=1258.3kbits/s speed=1.04x",
        "frame=10000 fps=32.1 q=28.0 size=   51200kB time=00:05:33.33 bitrate=1258.3kbits/s speed=1.07x",
    ];

  for line in test_lines {
    group.bench_with_input(
      BenchmarkId::new("parse_line", line.len()),
      line,
      |b, line| {
        b.iter(|| {
          // Используем приватный метод parse_progress_line через отражение
          // В реальном коде этот метод должен быть публичным для бенчмарков
          regex.captures(black_box(line))
        })
      },
    );
  }

  group.finish();
}

/// Бенчмарк работы с кэшем превью
fn benchmark_preview_cache(c: &mut Criterion) {
  let rt = Runtime::new().unwrap();
  let ffmpeg_service: Arc<dyn FfmpegService> = Arc::new(MockFfmpegService);
  let preview_service = PreviewServiceImpl::new(ffmpeg_service);

  let mut group = c.benchmark_group("preview_cache");

  // Подготовка тестовых данных
  let test_result = super::super::services::preview_service::PreviewResult {
    preview_type: PreviewType::Frame,
    data: vec![0u8; 100_000], // 100KB данных
    format: "jpeg".to_string(),
    resolution: (1920, 1080),
    timestamp: Some(10.0),
  };

  // Бенчмарк записи в кэш
  group.bench_function("cache_write", |b| {
    b.iter(|| {
      rt.block_on(async {
        preview_service
          .cache_preview(black_box("test_key"), black_box(&test_result))
          .await
      })
    })
  });

  // Предварительно заполняем кэш
  rt.block_on(async {
    for i in 0..1000 {
      let key = format!("key_{}", i);
      preview_service
        .cache_preview(&key, &test_result)
        .await
        .unwrap();
    }
  });

  // Бенчмарк чтения из кэша
  group.bench_function("cache_read", |b| {
    b.iter(|| {
      rt.block_on(async {
        preview_service
          .get_cached_preview(black_box("key_500"))
          .await
      })
    })
  });

  group.finish();
}

/// Бенчмарк пакетной генерации превью
fn benchmark_batch_operations(c: &mut Criterion) {
  let rt = Runtime::new().unwrap();
  let ffmpeg_service: Arc<dyn FfmpegService> = Arc::new(MockFfmpegService);
  let preview_service = PreviewServiceImpl::new(ffmpeg_service);

  let mut group = c.benchmark_group("batch_operations");

  for batch_size in [1, 5, 10, 20].iter() {
    group.bench_with_input(
      BenchmarkId::new("batch_preview_generation", batch_size),
      batch_size,
      |b, &size| {
        let requests: Vec<_> = (0..size)
          .map(
            |i| super::super::services::preview_service::PreviewRequest {
              preview_type: PreviewType::Frame,
              source_path: PathBuf::from(format!("/test/video_{}.mp4", i)),
              timestamp: Some(i as f64 * 5.0),
              resolution: Some((320, 180)),
              quality: Some(85),
            },
          )
          .collect();

        b.iter(|| {
          rt.block_on(async {
            // В реальном бенчмарке это вызовет ошибку из-за отсутствия файлов,
            // но для измерения производительности самой операции это допустимо
            let _ = preview_service
              .batch_generate_previews(black_box(requests.clone()))
              .await;
          })
        })
      },
    );
  }

  group.finish();
}

/// Бенчмарк генерации кэш-ключей
fn benchmark_cache_key_generation(c: &mut Criterion) {
  let ffmpeg_service: Arc<dyn FfmpegService> = Arc::new(MockFfmpegService);
  let preview_service = PreviewServiceImpl::new(ffmpeg_service);

  let mut group = c.benchmark_group("cache_key_generation");

  let test_cases = vec![
    ("short_path", PathBuf::from("/video.mp4")),
    (
      "medium_path",
      PathBuf::from("/home/user/videos/project/video.mp4"),
    ),
    (
      "long_path",
      PathBuf::from(
        "/very/long/path/to/deeply/nested/directory/structure/with/many/levels/video.mp4",
      ),
    ),
  ];

  for (name, path) in test_cases {
    group.bench_with_input(BenchmarkId::new("generate_key", name), &path, |b, path| {
      b.iter(|| {
        preview_service.generate_cache_key(
          black_box(PreviewType::Frame),
          black_box(path),
          black_box(Some(10.0)),
          black_box(Some((1920, 1080))),
        )
      })
    });
  }

  group.finish();
}

/// Бенчмарк работы с временными файлами
fn benchmark_temp_file_operations(c: &mut Criterion) {
  let rt = Runtime::new().unwrap();

  let mut group = c.benchmark_group("temp_file_operations");

  // Бенчмарк создания временной директории
  group.bench_function("create_temp_dir", |b| {
    b.iter(|| {
      let _temp_dir = TempDir::new().unwrap();
      // TempDir автоматически удаляется при выходе из области видимости
    })
  });

  // Бенчмарк записи и чтения временного файла
  group.bench_function("temp_file_write_read", |b| {
    let data = vec![0u8; 10_000]; // 10KB данных

    b.iter(|| {
      rt.block_on(async {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.bin");

        // Запись
        tokio::fs::write(&file_path, &data).await.unwrap();

        // Чтение
        let _read_data = tokio::fs::read(&file_path).await.unwrap();
      })
    })
  });

  group.finish();
}

criterion_group!(
  benches,
  benchmark_ffmpeg_builder,
  benchmark_progress_parsing,
  benchmark_preview_cache,
  benchmark_batch_operations,
  benchmark_cache_key_generation,
  benchmark_temp_file_operations
);

criterion_main!(benches);
