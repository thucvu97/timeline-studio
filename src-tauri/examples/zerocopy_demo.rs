//! Демонстрация zero-copy операций для видео и аудио обработки

use std::time::Instant;
use timeline_studio_lib::core::performance::{
  AudioZeroCopy, DataType, VideoZeroCopy, ZeroCopyManager,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
  println!("🚀 Zero-Copy Operations Demo - Timeline Studio Backend");
  println!("======================================================\n");

  // 1. Создаем менеджер zero-copy операций
  println!("📦 Creating ZeroCopyManager...");
  let manager = ZeroCopyManager::new();

  // 2. Демонстрируем работу с видео кадрами
  println!("\n🎬 Video Frame Operations:");

  // Создаем RGB кадр 1920x1080
  println!("  Creating 1920x1080 RGB frame...");
  let start = Instant::now();
  let rgb_frame = manager
    .get_frame_buffer(1920, 1080, DataType::Rgb24)
    .await?;
  println!(
    "  ✅ RGB frame created in {:?} (size: {} bytes)",
    start.elapsed(),
    rgb_frame.size()
  );

  // Конвертируем RGB в RGBA без лишних копирований
  println!("  Converting RGB to RGBA...");
  let start = Instant::now();
  let rgba_frame = VideoZeroCopy::rgb_to_rgba_inplace(&rgb_frame)?;
  println!(
    "  ✅ RGB->RGBA conversion in {:?} (size: {} bytes)",
    start.elapsed(),
    rgba_frame.size()
  );

  // Создаем view на часть кадра (ROI - Region of Interest)
  println!("  Creating ROI view (top-left 960x540)...");
  let roi_size = 960 * 540 * 4; // RGBA
  let roi_view = manager.create_view(&rgba_frame, 0, roi_size).await?;
  println!("  ✅ ROI view created (size: {} bytes)", roi_view.size());

  // 3. Демонстрируем работу с YUV данными
  println!("\n📺 YUV Operations:");

  let yuv_frame = manager
    .get_frame_buffer(1920, 1080, DataType::Yuv420p)
    .await?;
  println!("  Created YUV420p frame (size: {} bytes)", yuv_frame.size());

  // Извлекаем Y, U, V плоскости без копирования
  let (y_plane, u_plane, v_plane) = VideoZeroCopy::extract_yuv_planes(&yuv_frame)?;
  println!(
    "  ✅ Extracted YUV planes: Y={} U={} V={} bytes",
    y_plane.size(),
    u_plane.size(),
    v_plane.size()
  );

  // 4. Демонстрируем аудио операции
  println!("\n🎵 Audio Operations:");

  // Создаем стерео каналы
  let samples = 48000; // 1 секунда при 48kHz
  let left_channel = manager
    .get_audio_buffer(samples, DataType::AudioF32)
    .await?;
  let right_channel = manager
    .get_audio_buffer(samples, DataType::AudioF32)
    .await?;

  println!(
    "  Created stereo channels: L={} R={} bytes",
    left_channel.size(),
    right_channel.size()
  );

  // Интерлив каналов
  let start = Instant::now();
  let interleaved = AudioZeroCopy::interleave_stereo(&left_channel, &right_channel)?;
  println!(
    "  ✅ Interleaved stereo in {:?} (size: {} bytes)",
    start.elapsed(),
    interleaved.size()
  );

  // 5. Демонстрируем пулинг буферов
  println!("\n♻️  Buffer Pooling Demo:");

  // Создаем несколько буферов
  let mut buffers = Vec::new();
  for i in 0..5 {
    let buffer = manager.get_buffer(1024 * 1024, DataType::Raw).await?; // 1MB
    buffers.push(buffer);
    println!("  Created buffer #{} (1MB)", i + 1);
  }

  // Возвращаем буферы в пул
  for (i, buffer) in buffers.into_iter().enumerate() {
    manager.return_buffer(buffer).await;
    println!("  Returned buffer #{} to pool", i + 1);
  }

  // Получаем буферы снова (должны переиспользоваться)
  for i in 0..3 {
    let _buffer = manager.get_buffer(1024 * 1024, DataType::Raw).await?;
    println!("  Reused buffer #{}", i + 1);
  }

  // 6. Показываем статистику
  println!("\n📊 Zero-Copy Statistics:");
  let stats = manager.get_stats().await;
  println!("  Buffers created: {}", stats.buffers_created);
  println!("  Buffers reused: {}", stats.buffers_reused);
  println!("  Active buffers: {}", stats.active_buffers);
  println!(
    "  Total memory: {:.2} MB",
    stats.total_memory as f64 / 1024.0 / 1024.0
  );
  println!("  Zero-copy operations: {}", stats.zero_copy_operations);
  println!(
    "  Bytes saved: {:.2} MB",
    stats.bytes_saved as f64 / 1024.0 / 1024.0
  );

  // Показываем информацию о пулах
  let pools = manager.get_pool_info().await;
  println!("\n🏊 Pool Information:");
  for ((size, data_type), count) in pools {
    println!(
      "  {:?} buffers ({}KB): {} in pool",
      data_type,
      size / 1024,
      count
    );
  }

  // 7. Демонстрируем эффективность zero-copy
  println!("\n⚡ Performance Comparison:");

  let test_size = 1920 * 1080 * 3; // RGB frame
  let iterations = 100;

  // Тест с копированием
  println!("  Testing WITH copying...");
  let start = Instant::now();
  for _ in 0..iterations {
    let buffer1 = vec![0u8; test_size];
    let buffer2 = buffer1.clone(); // Копирование!
    std::hint::black_box(buffer2);
  }
  let with_copy_time = start.elapsed();

  // Тест с zero-copy
  println!("  Testing WITHOUT copying (zero-copy)...");
  let start = Instant::now();
  for _ in 0..iterations {
    let buffer = manager.get_buffer(test_size, DataType::Rgb24).await?;
    let reference = buffer.clone_ref(); // Без копирования!
    std::hint::black_box(reference);
    manager.return_buffer(buffer).await;
  }
  let zero_copy_time = start.elapsed();

  println!("  📈 Results for {} iterations:", iterations);
  println!("    With copying: {:?}", with_copy_time);
  println!("    Zero-copy: {:?}", zero_copy_time);

  if with_copy_time > zero_copy_time {
    let speedup = with_copy_time.as_nanos() as f64 / zero_copy_time.as_nanos() as f64;
    println!("    🚀 Zero-copy is {:.1}x faster!", speedup);
  }

  // 8. Демонстрируем практический пример: обработка видео
  println!("\n🎮 Practical Example: Video Processing Pipeline");

  // Симулируем видео pipeline
  let frame_count = 30; // 30 кадров
  let width = 1280;
  let height = 720;

  println!(
    "  Processing {} frames ({}x{})...",
    frame_count, width, height
  );
  let pipeline_start = Instant::now();

  for frame_num in 0..frame_count {
    // 1. Декодируем кадр (симуляция)
    let raw_frame = manager
      .get_frame_buffer(width, height, DataType::Yuv420p)
      .await?;

    // 2. Применяем эффект (создаем view)
    let effect_roi = manager
      .create_view(&raw_frame, 0, raw_frame.size() / 2)
      .await?;

    // 3. Конвертируем в RGB для отображения
    let rgb_frame = manager
      .get_frame_buffer(width, height, DataType::Rgb24)
      .await?;

    // 4. Создаем reference для отправки в UI (zero-copy)
    let ui_ref = rgb_frame.clone_ref();

    // 5. Кодируем кадр (симуляция)
    let encoded_view = manager.create_view(&rgb_frame, 0, rgb_frame.size()).await?;

    // Освобождаем ресурсы
    manager.return_buffer(raw_frame).await;
    manager.return_buffer(rgb_frame).await;

    if frame_num % 10 == 0 {
      println!("    Processed frame {}/{}", frame_num + 1, frame_count);
    }

    std::hint::black_box((effect_roi, ui_ref, encoded_view));
  }

  let pipeline_time = pipeline_start.elapsed();
  println!("  ✅ Pipeline completed in {:?}", pipeline_time);
  println!(
    "    Average: {:.2}ms per frame",
    pipeline_time.as_millis() as f64 / frame_count as f64
  );

  // Финальная статистика
  println!("\n📈 Final Statistics:");
  let final_stats = manager.get_stats().await;
  println!("  Total operations: {}", final_stats.zero_copy_operations);
  println!(
    "  Memory saved: {:.2} MB",
    final_stats.bytes_saved as f64 / 1024.0 / 1024.0
  );
  println!(
    "  Peak memory usage: {:.2} MB",
    final_stats.total_memory as f64 / 1024.0 / 1024.0
  );

  println!("\n✨ Zero-Copy Demo completed successfully!");
  println!("\n🎯 Key Benefits Demonstrated:");
  println!("  • Eliminated unnecessary memory copies");
  println!("  • Efficient buffer pooling and reuse");
  println!("  • Fast video/audio data processing");
  println!("  • Memory-aligned allocations for SIMD");
  println!("  • Reference counting for safe sharing");
  println!("  • Views for zero-copy data slicing");

  Ok(())
}
