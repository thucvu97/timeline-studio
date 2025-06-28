//! Тесты для модуля кэширования Video Compiler

use super::*;
use std::time::Duration;

#[tokio::test]
async fn test_cache_creation() {
  let cache = RenderCache::new();
  let stats = cache.get_stats();
  assert_eq!(stats.preview_requests, 0);
  assert_eq!(stats.metadata_requests, 0);
  assert_eq!(stats.render_requests, 0);
}

#[tokio::test]
async fn test_cache_with_custom_settings() {
  let settings = CacheSettings {
    max_preview_entries: 50,
    max_metadata_entries: 25,
    max_render_entries: 10,
    max_memory_mb: 256,
    preview_ttl: Duration::from_secs(1800),
    metadata_ttl: Duration::from_secs(900),
    render_ttl: Duration::from_secs(3600),
  };
  let cache = RenderCache::with_settings(settings.clone());
  assert_eq!(cache.settings.max_preview_entries, 50);
  assert_eq!(cache.settings.max_memory_mb, 256);
}

#[tokio::test]
async fn test_preview_cache() {
  let mut cache = RenderCache::new();
  let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (640, 360), 75);
  let image_data = vec![1, 2, 3, 4, 5];

  // Сохраняем превью
  cache
    .store_preview(key.clone(), image_data.clone())
    .await
    .unwrap();

  // Получаем превью
  let cached_data = cache.get_preview(&key).await;
  assert!(cached_data.is_some());
  assert_eq!(cached_data.unwrap().image_data, image_data);

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.preview_requests, 1);
  assert_eq!(stats.preview_hits, 1);
  assert_eq!(stats.preview_misses, 0);
}

#[tokio::test]
async fn test_preview_cache_miss() {
  let mut cache = RenderCache::new();
  let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (640, 360), 75);

  // Пытаемся получить несуществующее превью
  let cached_data = cache.get_preview(&key).await;
  assert!(cached_data.is_none());

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.preview_requests, 1);
  assert_eq!(stats.preview_hits, 0);
  assert_eq!(stats.preview_misses, 1);
}

#[tokio::test]
async fn test_metadata_cache() {
  let mut cache = RenderCache::new();
  let file_path = "/test/video.mp4".to_string();
  let metadata = MediaMetadata {
    file_path: file_path.clone(),
    file_size: 1024000,
    modified_time: SystemTime::now(),
    duration: 120.0,
    resolution: Some((1920, 1080)),
    fps: Some(30.0),
    bitrate: Some(8000000),
    video_codec: Some("h264".to_string()),
    audio_codec: Some("aac".to_string()),
    cached_at: SystemTime::now(),
  };

  // Сохраняем метаданные
  cache
    .store_metadata(file_path.clone(), metadata.clone())
    .await
    .unwrap();

  // Получаем метаданные
  let cached_metadata = cache.get_metadata(&file_path).await;
  assert!(cached_metadata.is_some());
  assert_eq!(cached_metadata.unwrap().duration, 120.0);

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.metadata_requests, 1);
  assert_eq!(stats.metadata_hits, 1);
}

#[tokio::test]
async fn test_metadata_cache_miss() {
  let mut cache = RenderCache::new();

  // Пытаемся получить несуществующие метаданные
  let cached_metadata = cache.get_metadata("/nonexistent.mp4").await;
  assert!(cached_metadata.is_none());

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.metadata_requests, 1);
  assert_eq!(stats.metadata_hits, 0);
  assert_eq!(stats.metadata_misses, 1);
}

#[tokio::test]
async fn test_render_cache() {
  let mut cache = RenderCache::new();
  let cache_key = "render_job_123".to_string();
  let render_data = RenderCacheData {
    cache_key: cache_key.clone(),
    output_path: PathBuf::from("/output/render.mp4"),
    render_hash: "abc123def456".to_string(),
    created_at: SystemTime::now(),
    file_size: 5000000,
  };

  // Сохраняем данные рендеринга
  cache
    .store_render_data(cache_key.clone(), render_data.clone())
    .await
    .unwrap();

  // Получаем данные рендеринга
  let cached_render = cache.get_render_data(&cache_key).await;
  assert!(cached_render.is_some());
  assert_eq!(cached_render.unwrap().render_hash, "abc123def456");

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.render_requests, 1);
  assert_eq!(stats.render_hits, 1);
}

#[tokio::test]
async fn test_render_cache_miss() {
  let mut cache = RenderCache::new();

  // Пытаемся получить несуществующие данные рендеринга
  let cached_render = cache.get_render_data("nonexistent_job").await;
  assert!(cached_render.is_none());

  // Проверяем статистику
  let stats = cache.get_stats();
  assert_eq!(stats.render_requests, 1);
  assert_eq!(stats.render_hits, 0);
  assert_eq!(stats.render_misses, 1);
}

#[tokio::test]
async fn test_cache_expiration() {
  let settings = CacheSettings {
    preview_ttl: Duration::from_millis(10), // Очень короткий TTL для теста
    metadata_ttl: Duration::from_millis(10),
    render_ttl: Duration::from_millis(10),
    ..Default::default()
  };
  let mut cache = RenderCache::with_settings(settings);

  let key = PreviewKey::new("/test/video.mp4".to_string(), 5.0, (320, 180), 50);
  let image_data = vec![10, 20, 30];

  // Сохраняем превью
  cache.store_preview(key.clone(), image_data).await.unwrap();

  // Сразу должно быть доступно
  assert!(cache.get_preview(&key).await.is_some());

  // Ждем истечения TTL
  tokio::time::sleep(Duration::from_millis(20)).await;

  // Теперь должно быть недоступно
  assert!(cache.get_preview(&key).await.is_none());
}

#[tokio::test]
async fn test_metadata_expiration() {
  let settings = CacheSettings {
    metadata_ttl: Duration::from_millis(10),
    ..Default::default()
  };
  let mut cache = RenderCache::with_settings(settings);

  let metadata = MediaMetadata {
    file_path: "/test/video.mp4".to_string(),
    file_size: 1024,
    modified_time: SystemTime::now(),
    duration: 60.0,
    resolution: None,
    fps: None,
    bitrate: None,
    video_codec: None,
    audio_codec: None,
    cached_at: SystemTime::now(),
  };

  cache
    .store_metadata("/test/video.mp4".to_string(), metadata)
    .await
    .unwrap();
  assert!(cache.get_metadata("/test/video.mp4").await.is_some());

  tokio::time::sleep(Duration::from_millis(20)).await;
  assert!(cache.get_metadata("/test/video.mp4").await.is_none());
}

#[tokio::test]
async fn test_render_data_expiration() {
  let settings = CacheSettings {
    render_ttl: Duration::from_millis(10),
    ..Default::default()
  };
  let mut cache = RenderCache::with_settings(settings);

  let render_data = RenderCacheData {
    cache_key: "job_123".to_string(),
    output_path: PathBuf::from("/output.mp4"),
    render_hash: "hash123".to_string(),
    created_at: SystemTime::now(),
    file_size: 1000,
  };

  cache
    .store_render_data("job_123".to_string(), render_data)
    .await
    .unwrap();
  assert!(cache.get_render_data("job_123").await.is_some());

  tokio::time::sleep(Duration::from_millis(20)).await;
  assert!(cache.get_render_data("job_123").await.is_none());
}

#[tokio::test]
async fn test_cache_stats() {
  let mut cache = RenderCache::new();
  let key = PreviewKey::new("/test/video.mp4".to_string(), 1.0, (640, 360), 75);

  // Промах
  cache.get_preview(&key).await;

  // Сохраняем и попадание
  cache
    .store_preview(key.clone(), vec![1, 2, 3])
    .await
    .unwrap();
  cache.get_preview(&key).await;

  let stats = cache.get_stats();
  assert_eq!(stats.preview_requests, 2);
  assert_eq!(stats.preview_hits, 1);
  assert_eq!(stats.preview_misses, 1);
  assert_eq!(stats.preview_hit_ratio(), 0.5);
}

#[tokio::test]
async fn test_cache_stats_hit_ratios() {
  let cache = RenderCache::new();
  let stats = cache.get_stats();

  // При нулевых запросах hit ratio должен быть 0
  assert_eq!(stats.hit_ratio(), 0.0);
  assert_eq!(stats.preview_hit_ratio(), 0.0);
}

#[tokio::test]
async fn test_memory_usage() {
  let cache = RenderCache::new();
  let usage = cache.get_memory_usage();

  assert_eq!(
    usage.total_bytes,
    usage.preview_bytes + usage.metadata_bytes + usage.render_bytes
  );
  assert!(usage.total_mb() >= 0.0);
}

#[tokio::test]
async fn test_cache_clear() {
  let mut cache = RenderCache::new();
  let key = PreviewKey::new("/test/video.mp4".to_string(), 2.0, (640, 360), 75);

  // Добавляем данные
  cache
    .store_preview(key.clone(), vec![1, 2, 3])
    .await
    .unwrap();
  assert!(cache.get_preview(&key).await.is_some());

  // Очищаем превью
  cache.clear_previews().await;
  assert!(cache.get_preview(&key).await.is_none());
}

#[tokio::test]
async fn test_cache_clear_all() {
  let mut cache = RenderCache::new();

  // Добавляем различные данные
  let preview_key = PreviewKey::new("/test1.mp4".to_string(), 1.0, (640, 360), 75);
  cache
    .store_preview(preview_key.clone(), vec![1, 2, 3])
    .await
    .unwrap();

  let metadata = MediaMetadata {
    file_path: "/test2.mp4".to_string(),
    file_size: 1024,
    modified_time: SystemTime::now(),
    duration: 60.0,
    resolution: None,
    fps: None,
    bitrate: None,
    video_codec: None,
    audio_codec: None,
    cached_at: SystemTime::now(),
  };
  cache
    .store_metadata("/test2.mp4".to_string(), metadata)
    .await
    .unwrap();

  let render_data = RenderCacheData {
    cache_key: "job_456".to_string(),
    output_path: PathBuf::from("/output.mp4"),
    render_hash: "hash456".to_string(),
    created_at: SystemTime::now(),
    file_size: 2000,
  };
  cache
    .store_render_data("job_456".to_string(), render_data)
    .await
    .unwrap();

  // Проверяем что все данные есть
  assert!(cache.get_preview(&preview_key).await.is_some());
  assert!(cache.get_metadata("/test2.mp4").await.is_some());
  assert!(cache.get_render_data("job_456").await.is_some());

  // Очищаем весь кэш
  cache.clear_all().await;

  // Проверяем что все данные удалены
  assert!(cache.get_preview(&preview_key).await.is_none());
  assert!(cache.get_metadata("/test2.mp4").await.is_none());
  assert!(cache.get_render_data("job_456").await.is_none());

  // Статистика должна быть сброшена
  let stats = cache.get_stats();
  assert_eq!(stats.preview_requests, 1); // один после clear_all
  assert_eq!(stats.preview_hits, 0);
  assert_eq!(stats.preview_misses, 1);
}

#[tokio::test]
async fn test_cleanup_old_entries() {
  let settings = CacheSettings {
    preview_ttl: Duration::from_millis(10),
    metadata_ttl: Duration::from_millis(10),
    render_ttl: Duration::from_millis(10),
    ..Default::default()
  };
  let mut cache = RenderCache::with_settings(settings);

  // Добавляем данные
  let key1 = PreviewKey::new("/test1.mp4".to_string(), 1.0, (640, 360), 75);
  let key2 = PreviewKey::new("/test2.mp4".to_string(), 2.0, (640, 360), 75);
  cache
    .store_preview(key1.clone(), vec![1, 2, 3])
    .await
    .unwrap();

  // Ждем истечения TTL для первого элемента
  tokio::time::sleep(Duration::from_millis(15)).await;

  // Добавляем второй элемент
  cache
    .store_preview(key2.clone(), vec![4, 5, 6])
    .await
    .unwrap();

  // Вызываем очистку
  cache.cleanup_old_entries().await.unwrap();

  // Первый должен быть удален, второй остаться
  assert!(cache.get_preview(&key1).await.is_none());
  assert!(cache.get_preview(&key2).await.is_some());
}

#[tokio::test]
async fn test_cleanup_if_needed_with_memory_limit() {
  let settings = CacheSettings {
    max_memory_mb: 1, // Очень маленький лимит памяти для теста
    max_preview_entries: 10000,
    ..Default::default()
  };
  let mut cache = RenderCache::with_settings(settings);

  // Добавляем много больших превью чтобы превысить лимит памяти
  for i in 0..100 {
    let key = PreviewKey::new(format!("/test{i}.mp4"), i as f64, (1920, 1080), 90);
    let large_data = vec![0u8; 100000]; // 100KB на превью
    cache.store_preview(key, large_data).await.unwrap();
  }

  // cleanup_if_needed должен был быть вызван автоматически
  let usage = cache.get_memory_usage();
  // Проверяем что память не превышает сильно установленный лимит
  assert!(usage.total_mb() < 10.0); // Даем запас на накладные расходы
}

#[test]
fn test_preview_key_creation() {
  let key = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (1920, 1080), 90);
  assert_eq!(key.file_path, "/test/video.mp4");
  assert_eq!(key.timestamp, 10500); // 10.5 * 1000
  assert_eq!(key.resolution, (1920, 1080));
  assert_eq!(key.quality, 90);
}

#[test]
fn test_preview_key_equality_and_hash() {
  let key1 = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (1920, 1080), 90);
  let key2 = PreviewKey::new("/test/video.mp4".to_string(), 10.5, (1920, 1080), 90);
  let key3 = PreviewKey::new("/test/video.mp4".to_string(), 11.0, (1920, 1080), 90);

  assert_eq!(key1, key2);
  assert_ne!(key1, key3);

  // Проверяем что ключи можно использовать в HashMap
  let mut map = std::collections::HashMap::new();
  map.insert(key1.clone(), "value1");
  assert_eq!(map.get(&key2), Some(&"value1"));
}

#[test]
fn test_preview_data_is_expired() {
  let data = PreviewData {
    image_data: vec![1, 2, 3],
    timestamp: SystemTime::now() - Duration::from_secs(3600),
    _access_count: 5,
  };

  assert!(data.is_expired(Duration::from_secs(1800))); // 30 минут - истек
  assert!(!data.is_expired(Duration::from_secs(7200))); // 2 часа - не истек
}

#[test]
fn test_media_metadata_is_expired() {
  let metadata = MediaMetadata {
    file_path: "/test.mp4".to_string(),
    file_size: 1024,
    modified_time: SystemTime::now(),
    duration: 60.0,
    resolution: None,
    fps: None,
    bitrate: None,
    video_codec: None,
    audio_codec: None,
    cached_at: SystemTime::now() - Duration::from_secs(1800),
  };

  assert!(metadata.is_expired(Duration::from_secs(900))); // 15 минут - истек
  assert!(!metadata.is_expired(Duration::from_secs(3600))); // 1 час - не истек
}

#[test]
fn test_render_cache_data_is_expired() {
  let data = RenderCacheData {
    cache_key: "job_123".to_string(),
    output_path: PathBuf::from("/output.mp4"),
    render_hash: "hash123".to_string(),
    created_at: SystemTime::now() - Duration::from_secs(7200),
    file_size: 1000,
  };

  assert!(data.is_expired(Duration::from_secs(3600))); // 1 час - истек
  assert!(!data.is_expired(Duration::from_secs(14400))); // 4 часа - не истек
}

#[test]
fn test_cache_settings_default() {
  let settings = CacheSettings::default();
  assert_eq!(settings.max_preview_entries, 1000);
  assert_eq!(settings.max_metadata_entries, 500);
  assert_eq!(settings.max_render_entries, 100);
  assert_eq!(settings.max_memory_mb, 512);
  assert_eq!(settings.preview_ttl, Duration::from_secs(3600));
  assert_eq!(settings.metadata_ttl, Duration::from_secs(1800));
  assert_eq!(settings.render_ttl, Duration::from_secs(7200));
}

#[test]
fn test_render_cache_default() {
  let cache = RenderCache::default();
  assert_eq!(cache.settings.max_preview_entries, 1000);
}

#[test]
fn test_cache_memory_usage_total_mb() {
  let usage = CacheMemoryUsage {
    preview_bytes: 1024 * 1024 * 10, // 10 MB
    metadata_bytes: 1024 * 1024 * 5, // 5 MB
    render_bytes: 1024 * 1024 * 15,  // 15 MB
    total_bytes: 1024 * 1024 * 30,   // 30 MB
  };

  assert_eq!(usage.total_mb(), 30.0);
}

#[test]
fn test_lru_cache() {
  let mut lru = LruCache::new(2);

  lru.insert("key1".to_string(), "value1".to_string());
  lru.insert("key2".to_string(), "value2".to_string());

  assert_eq!(lru.get(&"key1".to_string()), Some("value1".to_string()));

  // Добавляем третий элемент, должен вытеснить самый старый
  lru.insert("key3".to_string(), "value3".to_string());

  // key3 должен быть доступен
  assert!(lru.get(&"key3".to_string()).is_some());
}

#[test]
fn test_lru_cache_remove() {
  let mut lru = LruCache::new(5);

  lru.insert("key1".to_string(), "value1".to_string());
  lru.insert("key2".to_string(), "value2".to_string());

  // Удаляем элемент
  let removed = lru.remove(&"key1".to_string());
  assert_eq!(removed, Some("value1".to_string()));

  // Проверяем что элемент удален
  assert_eq!(lru.get(&"key1".to_string()), None);
  assert_eq!(lru.get(&"key2".to_string()), Some("value2".to_string()));
}

#[test]
fn test_lru_cache_clear() {
  let mut lru = LruCache::new(5);

  lru.insert("key1".to_string(), "value1".to_string());
  lru.insert("key2".to_string(), "value2".to_string());
  lru.insert("key3".to_string(), "value3".to_string());

  lru.clear();

  assert_eq!(lru.get(&"key1".to_string()), None);
  assert_eq!(lru.get(&"key2".to_string()), None);
  assert_eq!(lru.get(&"key3".to_string()), None);
}

#[test]
fn test_lru_cache_retain() {
  let mut lru = LruCache::new(5);

  lru.insert(1, 10);
  lru.insert(2, 20);
  lru.insert(3, 30);
  lru.insert(4, 40);

  // Оставляем только четные значения
  lru.retain(|_k, v| v % 20 == 0);

  assert_eq!(lru.get(&1), None);
  assert_eq!(lru.get(&2), Some(20));
  assert_eq!(lru.get(&3), None);
  assert_eq!(lru.get(&4), Some(40));
}

#[test]
fn test_lru_cache_memory_estimate() {
  let lru: LruCache<String, String> = LruCache::new(100);
  let memory = lru.estimate_memory_usage();
  assert!(memory > 0);
}

#[test]
fn test_lru_cache_capacity_enforcement() {
  let mut lru = LruCache::new(3);

  lru.insert(1, "one");
  lru.insert(2, "two");
  lru.insert(3, "three");

  // Все три должны быть доступны
  assert_eq!(lru.get(&1), Some("one"));
  assert_eq!(lru.get(&2), Some("two"));
  assert_eq!(lru.get(&3), Some("three"));

  // Добавляем четвертый элемент
  lru.insert(4, "four");

  // Один из старых должен быть удален
  assert_eq!(lru.get(&4), Some("four"));

  // Проверяем что осталось только 3 элемента
  let mut count = 0;
  for i in 1..=4 {
    if lru.get(&i).is_some() {
      count += 1;
    }
  }
  assert_eq!(count, 3);
}

#[test]
fn test_cache_stats_serialization() {
  let stats = CacheStats {
    preview_requests: 100,
    preview_hits: 80,
    preview_misses: 20,
    metadata_requests: 50,
    metadata_hits: 45,
    metadata_misses: 5,
    render_requests: 10,
    render_hits: 8,
    render_misses: 2,
  };

  let json = serde_json::to_string(&stats).unwrap();
  assert!(json.contains("\"preview_requests\":100"));

  let deserialized: CacheStats = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.preview_hits, 80);
  assert_eq!(deserialized.metadata_hits, 45);
}

#[test]
fn test_media_metadata_serialization() {
  let metadata = MediaMetadata {
    file_path: "/test/video.mp4".to_string(),
    file_size: 1024000,
    modified_time: SystemTime::now(),
    duration: 120.5,
    resolution: Some((1920, 1080)),
    fps: Some(30.0),
    bitrate: Some(8000000),
    video_codec: Some("h264".to_string()),
    audio_codec: Some("aac".to_string()),
    cached_at: SystemTime::now(),
  };

  let json = serde_json::to_string(&metadata).unwrap();
  assert!(json.contains("1024000"));
  assert!(json.contains("120.5"));
  assert!(json.contains("1920"));
  assert!(json.contains("h264"));

  let deserialized: MediaMetadata = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.file_path, metadata.file_path);
  assert_eq!(deserialized.duration, metadata.duration);
  assert_eq!(deserialized.resolution, metadata.resolution);
}
