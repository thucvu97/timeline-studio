//! Система кэширования для оптимизации производительности

use crate::video_compiler::error::{Result, VideoCompilerError};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, LinkedList};
use std::hash::Hash;
use std::sync::Arc;
use std::time::{Duration, Instant};
use tokio::sync::RwLock;

/// Trait для кэшируемых объектов
pub trait Cacheable: Clone + Send + Sync + 'static {
  /// Получить размер объекта в байтах для учета лимитов памяти
  fn size(&self) -> usize;
}

impl Cacheable for Vec<u8> {
  fn size(&self) -> usize {
    self.len()
  }
}

impl Cacheable for String {
  fn size(&self) -> usize {
    self.len()
  }
}

impl<T: Clone + Send + Sync + 'static> Cacheable for Arc<T> {
  fn size(&self) -> usize {
    std::mem::size_of::<T>()
  }
}

/// Элемент кэша
#[derive(Debug, Clone)]
struct CacheEntry<V> {
  value: V,
  created_at: Instant,
  last_accessed: Instant,
  access_count: u64,
  size: usize,
}

impl<V: Cacheable> CacheEntry<V> {
  fn new(value: V) -> Self {
    let now = Instant::now();
    let size = value.size();

    Self {
      value,
      created_at: now,
      last_accessed: now,
      access_count: 1,
      size,
    }
  }

  fn access(&mut self) -> &V {
    self.last_accessed = Instant::now();
    self.access_count += 1;
    &self.value
  }

  fn is_expired(&self, ttl: Duration) -> bool {
    self.created_at.elapsed() > ttl
  }
}

/// Конфигурация кэша
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheConfig {
  /// Максимальное количество элементов
  pub max_entries: usize,

  /// Максимальный размер в байтах
  pub max_size_bytes: usize,

  /// TTL (время жизни) для элементов
  pub ttl: Duration,

  /// Интервал очистки истекших элементов
  pub cleanup_interval: Duration,

  /// Стратегия вытеснения
  pub eviction_policy: EvictionPolicy,
}

impl Default for CacheConfig {
  fn default() -> Self {
    Self {
      max_entries: 10000,
      max_size_bytes: 100 * 1024 * 1024,          // 100MB
      ttl: Duration::from_secs(3600),             // 1 час
      cleanup_interval: Duration::from_secs(300), // 5 минут
      eviction_policy: EvictionPolicy::LRU,
    }
  }
}

/// Стратегия вытеснения элементов
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub enum EvictionPolicy {
  /// Least Recently Used
  LRU,
  /// Least Frequently Used  
  LFU,
  /// First In First Out
  FIFO,
  /// Random
  Random,
}

/// Статистика кэша
#[derive(Debug, Clone, Default)]
pub struct CacheStats {
  pub hits: u64,
  pub misses: u64,
  pub entries: usize,
  pub size_bytes: usize,
  pub hit_rate: f64,
  pub evictions: u64,
  pub expired_removals: u64,
}

impl CacheStats {
  fn update_hit_rate(&mut self) {
    let total = self.hits + self.misses;
    self.hit_rate = if total > 0 {
      self.hits as f64 / total as f64
    } else {
      0.0
    };
  }
}

/// Универсальный LRU кэш
pub struct LruCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  entries: HashMap<K, CacheEntry<V>>,
  access_order: LinkedList<K>,
  config: CacheConfig,
  stats: CacheStats,
  current_size: usize,
}

impl<K, V> LruCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  /// Создать новый LRU кэш
  pub fn new(config: CacheConfig) -> Self {
    Self {
      entries: HashMap::new(),
      access_order: LinkedList::new(),
      config,
      stats: CacheStats::default(),
      current_size: 0,
    }
  }

  /// Получить элемент из кэша
  pub fn get(&mut self, key: &K) -> Option<V> {
    if let Some(entry) = self.entries.get_mut(key) {
      if entry.is_expired(self.config.ttl) {
        // Элемент истек
        self.remove_key(key);
        self.stats.misses += 1;
        self.stats.expired_removals += 1;
        None
      } else {
        // Обновляем порядок доступа
        self.update_access_order(key);

        let value = entry.access().clone();
        self.stats.hits += 1;
        self.stats.update_hit_rate();
        Some(value)
      }
    } else {
      self.stats.misses += 1;
      self.stats.update_hit_rate();
      None
    }
  }

  /// Поместить элемент в кэш
  pub fn put(&mut self, key: K, value: V) -> Option<V> {
    let entry = CacheEntry::new(value);
    let entry_size = entry.size;

    // Проверяем лимиты и освобождаем место если нужно
    self.ensure_capacity(entry_size);

    // Вставляем новый элемент
    let old_value = if let Some(old_entry) = self.entries.insert(key.clone(), entry) {
      self.current_size -= old_entry.size;
      Some(old_entry.value)
    } else {
      None
    };

    self.current_size += entry_size;

    // Обновляем порядок доступа
    self.update_access_order(&key);

    // Обновляем статистику
    self.stats.entries = self.entries.len();
    self.stats.size_bytes = self.current_size;

    old_value
  }

  /// Удалить элемент из кэша
  pub fn remove(&mut self, key: &K) -> Option<V> {
    self.remove_key(key).map(|entry| entry.value)
  }

  /// Очистить кэш
  pub fn clear(&mut self) {
    self.entries.clear();
    self.access_order.clear();
    self.current_size = 0;
    self.stats.entries = 0;
    self.stats.size_bytes = 0;
  }

  /// Получить статистику
  pub fn stats(&self) -> &CacheStats {
    &self.stats
  }

  /// Получить количество элементов
  pub fn len(&self) -> usize {
    self.entries.len()
  }

  /// Проверить пустой ли кэш
  pub fn is_empty(&self) -> bool {
    self.entries.is_empty()
  }

  /// Очистить истекшие элементы
  pub fn cleanup_expired(&mut self) {
    let mut expired_keys = Vec::new();

    for (key, entry) in &self.entries {
      if entry.is_expired(self.config.ttl) {
        expired_keys.push(key.clone());
      }
    }

    for key in expired_keys {
      self.remove_key(&key);
      self.stats.expired_removals += 1;
    }

    self.stats.entries = self.entries.len();
    self.stats.size_bytes = self.current_size;
  }

  /// Обеспечить емкость для нового элемента
  fn ensure_capacity(&mut self, new_entry_size: usize) {
    // Проверяем лимит по количеству
    while self.entries.len() >= self.config.max_entries {
      if !self.evict_one() {
        break;
      }
    }

    // Проверяем лимит по размеру
    while self.current_size + new_entry_size > self.config.max_size_bytes {
      if !self.evict_one() {
        break;
      }
    }
  }

  /// Вытеснить один элемент
  fn evict_one(&mut self) -> bool {
    match self.config.eviction_policy {
      EvictionPolicy::LRU => self.evict_lru(),
      EvictionPolicy::LFU => self.evict_lfu(),
      EvictionPolicy::FIFO => self.evict_fifo(),
      EvictionPolicy::Random => self.evict_random(),
    }
  }

  /// Вытеснить LRU элемент
  fn evict_lru(&mut self) -> bool {
    if let Some(key) = self.access_order.back().cloned() {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить LFU элемент
  fn evict_lfu(&mut self) -> bool {
    let key_to_remove = self
      .entries
      .iter()
      .min_by_key(|(_, entry)| entry.access_count)
      .map(|(k, _)| k.clone());

    if let Some(key) = key_to_remove {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить FIFO элемент
  fn evict_fifo(&mut self) -> bool {
    let key_to_remove = self
      .entries
      .iter()
      .min_by_key(|(_, entry)| entry.created_at)
      .map(|(k, _)| k.clone());

    if let Some(key) = key_to_remove {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Вытеснить случайный элемент
  fn evict_random(&mut self) -> bool {
    if let Some(key) = self.entries.keys().next().cloned() {
      self.remove_key(&key);
      self.stats.evictions += 1;
      true
    } else {
      false
    }
  }

  /// Обновить порядок доступа
  fn update_access_order(&mut self, key: &K) {
    // Удаляем из текущей позиции
    if let Some(pos) = self.access_order.iter().position(|k| k == key) {
      let mut split = self.access_order.split_off(pos);
      split.pop_front(); // Удаляем найденный элемент
      self.access_order.append(&mut split);
    }

    // Добавляем в начало (самый недавно использованный)
    self.access_order.push_front(key.clone());
  }

  /// Удалить ключ и обновить структуры данных
  fn remove_key(&mut self, key: &K) -> Option<CacheEntry<V>> {
    let entry = self.entries.remove(key)?;
    self.current_size -= entry.size;

    // Удаляем из порядка доступа
    if let Some(pos) = self.access_order.iter().position(|k| k == key) {
      let mut split = self.access_order.split_off(pos);
      split.pop_front();
      self.access_order.append(&mut split);
    }

    Some(entry)
  }
}

/// Потокобезопасный кэш
#[derive(Clone)]
pub struct MemoryCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  inner: Arc<RwLock<LruCache<K, V>>>,
  _cleanup_handle: Arc<tokio::task::JoinHandle<()>>,
}

impl<K, V> MemoryCache<K, V>
where
  K: Clone + Eq + Hash + Send + Sync + 'static,
  V: Cacheable,
{
  /// Создать новый потокобезопасный кэш
  pub fn new(config: CacheConfig) -> Self {
    let inner = Arc::new(RwLock::new(LruCache::new(config.clone())));

    // Запускаем фоновую очистку
    let cleanup_inner = inner.clone();
    let cleanup_interval = config.cleanup_interval;
    let cleanup_handle = tokio::spawn(async move {
      let mut interval = tokio::time::interval(cleanup_interval);

      loop {
        interval.tick().await;

        if let Ok(mut cache) = cleanup_inner.try_write() {
          cache.cleanup_expired();
        }
      }
    });

    Self {
      inner,
      _cleanup_handle: Arc::new(cleanup_handle),
    }
  }

  /// Получить элемент из кэша
  pub async fn get(&self, key: &K) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.get(key)
  }

  /// Поместить элемент в кэш
  pub async fn put(&self, key: K, value: V) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.put(key, value)
  }

  /// Удалить элемент из кэша
  pub async fn remove(&self, key: &K) -> Option<V> {
    let mut cache = self.inner.write().await;
    cache.remove(key)
  }

  /// Очистить кэш
  pub async fn clear(&self) {
    let mut cache = self.inner.write().await;
    cache.clear();
  }

  /// Получить статистику
  pub async fn stats(&self) -> CacheStats {
    let cache = self.inner.read().await;
    cache.stats().clone()
  }

  /// Получить количество элементов
  pub async fn len(&self) -> usize {
    let cache = self.inner.read().await;
    cache.len()
  }

  /// Проверить пустой ли кэш
  pub async fn is_empty(&self) -> bool {
    let cache = self.inner.read().await;
    cache.is_empty()
  }
}

/// Менеджер кэшей
pub struct CacheManager {
  caches: Arc<RwLock<HashMap<String, Box<dyn std::any::Any + Send + Sync>>>>,
}

impl CacheManager {
  /// Создать новый менеджер кэшей
  pub fn new() -> Self {
    Self {
      caches: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Добавить кэш
  pub async fn add_cache<K, V>(&self, name: String, cache: MemoryCache<K, V>)
  where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Cacheable,
  {
    let mut caches = self.caches.write().await;
    caches.insert(name.clone(), Box::new(cache));
    log::info!("Added cache '{}'", name);
  }

  /// Получить кэш по имени
  pub async fn get_cache<K, V>(&self, name: &str) -> Option<MemoryCache<K, V>>
  where
    K: Clone + Eq + Hash + Send + Sync + 'static,
    V: Cacheable,
  {
    let caches = self.caches.read().await;
    caches
      .get(name)?
      .downcast_ref::<MemoryCache<K, V>>()
      .cloned()
  }

  /// Удалить кэш
  pub async fn remove_cache(&self, name: &str) -> bool {
    let mut caches = self.caches.write().await;
    if caches.remove(name).is_some() {
      log::info!("Removed cache '{}'", name);
      true
    } else {
      false
    }
  }

  /// Получить список кэшей
  pub async fn list_caches(&self) -> Vec<String> {
    let caches = self.caches.read().await;
    caches.keys().cloned().collect()
  }

  /// Очистить все кэши
  pub async fn clear_all(&self) {
    let caches = self.caches.read().await;
    log::info!("Clearing all {} caches", caches.len());
    // TODO: Implement clear for all caches
  }
}

impl Default for CacheManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_lru_cache() {
    let config = CacheConfig {
      max_entries: 3,
      max_size_bytes: 1000,
      ttl: Duration::from_secs(10),
      cleanup_interval: Duration::from_secs(5),
      eviction_policy: EvictionPolicy::LRU,
    };

    let mut cache = LruCache::new(config);

    // Добавляем элементы
    cache.put("key1".to_string(), "value1".to_string());
    cache.put("key2".to_string(), "value2".to_string());
    cache.put("key3".to_string(), "value3".to_string());

    assert_eq!(cache.len(), 3);

    // Доступ к элементу
    assert_eq!(cache.get(&"key1".to_string()), Some("value1".to_string()));

    // Добавляем четвертый элемент - должен вытеснить LRU
    cache.put("key4".to_string(), "value4".to_string());

    assert_eq!(cache.len(), 3);
    assert!(cache.get(&"key2".to_string()).is_none()); // key2 должен быть вытеснен

    // Проверяем статистику
    let stats = cache.stats();
    assert!(stats.hits > 0);
    assert!(stats.evictions > 0);
  }

  #[tokio::test]
  async fn test_memory_cache() {
    let config = CacheConfig::default();
    let cache = MemoryCache::new(config);

    // Тестируем базовые операции
    cache
      .put("test_key".to_string(), "test_value".to_string())
      .await;

    let value = cache.get(&"test_key".to_string()).await;
    assert_eq!(value, Some("test_value".to_string()));

    let removed = cache.remove(&"test_key".to_string()).await;
    assert_eq!(removed, Some("test_value".to_string()));

    let value = cache.get(&"test_key".to_string()).await;
    assert!(value.is_none());
  }

  #[tokio::test]
  async fn test_cache_manager() {
    let manager = CacheManager::new();

    let config = CacheConfig::default();
    let cache: MemoryCache<String, String> = MemoryCache::new(config);

    manager.add_cache("test_cache".to_string(), cache).await;

    let caches = manager.list_caches().await;
    assert!(caches.contains(&"test_cache".to_string()));

    let removed = manager.remove_cache("test_cache").await;
    assert!(removed);
  }
}
