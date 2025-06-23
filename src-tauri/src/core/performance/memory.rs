//! Memory pool для эффективного управления памятью

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::alloc::{alloc, dealloc, Layout};
use std::collections::{HashMap, VecDeque};
use std::ptr::NonNull;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

/// Размеры блоков памяти (в байтах)
const SMALL_BLOCK_SIZE: usize = 4 * 1024; // 4KB
const MEDIUM_BLOCK_SIZE: usize = 64 * 1024; // 64KB
const LARGE_BLOCK_SIZE: usize = 1024 * 1024; // 1MB
const HUGE_BLOCK_SIZE: usize = 16 * 1024 * 1024; // 16MB

/// Максимальное количество блоков в pool
const MAX_BLOCKS_PER_POOL: usize = 1000;

/// Блок памяти
pub struct MemoryBlock {
  ptr: NonNull<u8>,
  size: usize,
  layout: Layout,
}

impl MemoryBlock {
  /// Создать новый блок памяти
  fn new(size: usize) -> Result<Self> {
    let layout = Layout::from_size_align(size, 8)
      .map_err(|_| VideoCompilerError::InternalError("Invalid memory layout".to_string()))?;

    let ptr = unsafe { alloc(layout) };
    if ptr.is_null() {
      return Err(VideoCompilerError::InternalError(
        "Memory allocation failed".to_string(),
      ));
    }

    Ok(Self {
      ptr: NonNull::new(ptr).unwrap(),
      size,
      layout,
    })
  }

  /// Получить указатель на данные
  pub fn as_ptr(&self) -> *mut u8 {
    self.ptr.as_ptr()
  }

  /// Получить размер блока
  pub fn size(&self) -> usize {
    self.size
  }

  /// Обнулить блок
  pub fn zero(&mut self) {
    unsafe {
      std::ptr::write_bytes(self.ptr.as_ptr(), 0, self.size);
    }
  }
}

impl Drop for MemoryBlock {
  fn drop(&mut self) {
    unsafe {
      dealloc(self.ptr.as_ptr(), self.layout);
    }
  }
}

unsafe impl Send for MemoryBlock {}
unsafe impl Sync for MemoryBlock {}

/// Pool для блоков определенного размера
struct BlockPool {
  blocks: VecDeque<MemoryBlock>,
  block_size: usize,
  allocated_count: AtomicUsize,
  recycled_count: AtomicUsize,
}

impl BlockPool {
  fn new(block_size: usize) -> Self {
    Self {
      blocks: VecDeque::new(),
      block_size,
      allocated_count: AtomicUsize::new(0),
      recycled_count: AtomicUsize::new(0),
    }
  }

  /// Получить блок из pool или создать новый
  fn acquire(&mut self) -> Result<MemoryBlock> {
    if let Some(block) = self.blocks.pop_front() {
      self.recycled_count.fetch_add(1, Ordering::Relaxed);
      Ok(block)
    } else {
      let block = MemoryBlock::new(self.block_size)?;
      self.allocated_count.fetch_add(1, Ordering::Relaxed);
      Ok(block)
    }
  }

  /// Вернуть блок в pool
  fn release(&mut self, mut block: MemoryBlock) -> Result<()> {
    if block.size() != self.block_size {
      return Err(VideoCompilerError::InvalidParameter(
        "Block size mismatch".to_string(),
      ));
    }

    // Проверяем лимит
    if self.blocks.len() >= MAX_BLOCKS_PER_POOL {
      // Просто drop блок
      return Ok(());
    }

    // Обнуляем блок для безопасности
    block.zero();

    self.blocks.push_back(block);
    Ok(())
  }

  /// Получить статистику pool
  fn get_stats(&self) -> PoolStats {
    PoolStats {
      block_size: self.block_size,
      available_blocks: self.blocks.len(),
      total_allocated: self.allocated_count.load(Ordering::Relaxed),
      total_recycled: self.recycled_count.load(Ordering::Relaxed),
    }
  }
}

/// Статистика pool блоков
#[derive(Debug, Clone)]
pub struct PoolStats {
  pub block_size: usize,
  pub available_blocks: usize,
  pub total_allocated: usize,
  pub total_recycled: usize,
}

/// Буфер из memory pool
pub struct PooledBuffer {
  block: Option<MemoryBlock>,
  pool: Arc<Mutex<BlockPool>>,
  size: usize,
}

impl PooledBuffer {
  /// Создать новый буфер из pool
  async fn new(pool: Arc<Mutex<BlockPool>>, size: usize) -> Result<Self> {
    let mut pool_guard = pool.lock().await;
    let block = pool_guard.acquire()?;

    Ok(Self {
      block: Some(block),
      pool,
      size,
    })
  }

  /// Получить слайс данных
  pub fn as_slice(&self) -> &[u8] {
    if let Some(block) = &self.block {
      unsafe { std::slice::from_raw_parts(block.as_ptr(), self.size.min(block.size())) }
    } else {
      &[]
    }
  }

  /// Получить mutable слайс данных
  pub fn as_mut_slice(&mut self) -> &mut [u8] {
    if let Some(block) = &mut self.block {
      unsafe { std::slice::from_raw_parts_mut(block.as_ptr(), self.size.min(block.size())) }
    } else {
      &mut []
    }
  }

  /// Получить размер буфера
  pub fn len(&self) -> usize {
    self.size
  }

  /// Проверить пустой ли буфер
  pub fn is_empty(&self) -> bool {
    self.size == 0
  }

  /// Получить указатель на данные
  pub fn as_ptr(&self) -> *const u8 {
    if let Some(block) = &self.block {
      block.as_ptr()
    } else {
      std::ptr::null()
    }
  }

  /// Получить mutable указатель на данные
  pub fn as_mut_ptr(&mut self) -> *mut u8 {
    if let Some(block) = &mut self.block {
      block.as_ptr()
    } else {
      std::ptr::null_mut()
    }
  }
}

impl Drop for PooledBuffer {
  fn drop(&mut self) {
    if let Some(block) = self.block.take() {
      // Возвращаем блок в pool асинхронно
      let pool = self.pool.clone();
      tokio::spawn(async move {
        if let Ok(mut pool_guard) = pool.lock().await {
          let _ = pool_guard.release(block);
        }
      });
    }
  }
}

/// Memory pool manager
pub struct MemoryPool {
  small_pool: Arc<Mutex<BlockPool>>,
  medium_pool: Arc<Mutex<BlockPool>>,
  large_pool: Arc<Mutex<BlockPool>>,
  huge_pool: Arc<Mutex<BlockPool>>,
  custom_pools: Arc<RwLock<HashMap<usize, Arc<Mutex<BlockPool>>>>>,
}

impl MemoryPool {
  /// Создать новый memory pool
  pub fn new() -> Self {
    Self {
      small_pool: Arc::new(Mutex::new(BlockPool::new(SMALL_BLOCK_SIZE))),
      medium_pool: Arc::new(Mutex::new(BlockPool::new(MEDIUM_BLOCK_SIZE))),
      large_pool: Arc::new(Mutex::new(BlockPool::new(LARGE_BLOCK_SIZE))),
      huge_pool: Arc::new(Mutex::new(BlockPool::new(HUGE_BLOCK_SIZE))),
      custom_pools: Arc::new(RwLock::new(HashMap::new())),
    }
  }

  /// Получить буфер указанного размера
  pub async fn allocate(&self, size: usize) -> Result<PooledBuffer> {
    let pool = self.select_pool(size).await?;
    PooledBuffer::new(pool, size).await
  }

  /// Выбрать подходящий pool для размера
  async fn select_pool(&self, size: usize) -> Result<Arc<Mutex<BlockPool>>> {
    if size <= SMALL_BLOCK_SIZE {
      Ok(self.small_pool.clone())
    } else if size <= MEDIUM_BLOCK_SIZE {
      Ok(self.medium_pool.clone())
    } else if size <= LARGE_BLOCK_SIZE {
      Ok(self.large_pool.clone())
    } else if size <= HUGE_BLOCK_SIZE {
      Ok(self.huge_pool.clone())
    } else {
      // Ищем подходящий custom pool или создаем новый
      self.get_or_create_custom_pool(size).await
    }
  }

  /// Получить или создать custom pool
  async fn get_or_create_custom_pool(&self, size: usize) -> Result<Arc<Mutex<BlockPool>>> {
    // Округляем размер до ближайшей степени двойки
    let pool_size = size.next_power_of_two();

    // Проверяем существующие pools
    {
      let pools = self.custom_pools.read().await;
      if let Some(pool) = pools.get(&pool_size) {
        return Ok(pool.clone());
      }
    }

    // Создаем новый pool
    {
      let mut pools = self.custom_pools.write().await;
      // Проверяем еще раз на случай race condition
      if let Some(pool) = pools.get(&pool_size) {
        return Ok(pool.clone());
      }

      let new_pool = Arc::new(Mutex::new(BlockPool::new(pool_size)));
      pools.insert(pool_size, new_pool.clone());

      log::info!("Created custom memory pool for size {}", pool_size);
      Ok(new_pool)
    }
  }

  /// Получить статистику всех pools
  pub async fn get_stats(&self) -> MemoryPoolStats {
    let small_stats = self.small_pool.lock().await.get_stats();
    let medium_stats = self.medium_pool.lock().await.get_stats();
    let large_stats = self.large_pool.lock().await.get_stats();
    let huge_stats = self.huge_pool.lock().await.get_stats();

    let mut custom_stats = HashMap::new();
    let custom_pools = self.custom_pools.read().await;
    for (size, pool) in custom_pools.iter() {
      let stats = pool.lock().await.get_stats();
      custom_stats.insert(*size, stats);
    }

    MemoryPoolStats {
      small_pool: small_stats,
      medium_pool: medium_stats,
      large_pool: large_stats,
      huge_pool: huge_stats,
      custom_pools: custom_stats,
    }
  }

  /// Очистить неиспользуемые custom pools
  pub async fn cleanup_custom_pools(&self) {
    let mut pools = self.custom_pools.write().await;
    let mut to_remove = Vec::new();

    for (size, pool) in pools.iter() {
      let stats = pool.lock().await.get_stats();

      // Удаляем pool если в нем нет блоков и он не используется
      if stats.available_blocks == 0 && Arc::strong_count(pool) == 1 {
        to_remove.push(*size);
      }
    }

    for size in to_remove {
      pools.remove(&size);
      log::info!("Removed unused custom memory pool for size {}", size);
    }
  }
}

impl Default for MemoryPool {
  fn default() -> Self {
    Self::new()
  }
}

/// Статистика memory pool
#[derive(Debug)]
pub struct MemoryPoolStats {
  pub small_pool: PoolStats,
  pub medium_pool: PoolStats,
  pub large_pool: PoolStats,
  pub huge_pool: PoolStats,
  pub custom_pools: HashMap<usize, PoolStats>,
}

impl MemoryPoolStats {
  /// Получить общее количество выделенных блоков
  pub fn total_allocated(&self) -> usize {
    let mut total = 0;
    total += self.small_pool.total_allocated;
    total += self.medium_pool.total_allocated;
    total += self.large_pool.total_allocated;
    total += self.huge_pool.total_allocated;

    for stats in self.custom_pools.values() {
      total += stats.total_allocated;
    }

    total
  }

  /// Получить общее количество переиспользованных блоков
  pub fn total_recycled(&self) -> usize {
    let mut total = 0;
    total += self.small_pool.total_recycled;
    total += self.medium_pool.total_recycled;
    total += self.large_pool.total_recycled;
    total += self.huge_pool.total_recycled;

    for stats in self.custom_pools.values() {
      total += stats.total_recycled;
    }

    total
  }

  /// Получить эффективность переиспользования
  pub fn recycling_efficiency(&self) -> f64 {
    let allocated = self.total_allocated() as f64;
    let recycled = self.total_recycled() as f64;

    if allocated > 0.0 {
      recycled / allocated
    } else {
      0.0
    }
  }
}

/// Memory manager для координации pools
pub struct MemoryManager {
  pool: Arc<MemoryPool>,
  stats_collector: Arc<RwLock<MemoryManagerStats>>,
}

/// Статистика memory manager
#[derive(Debug, Default)]
pub struct MemoryManagerStats {
  pub allocations: u64,
  pub deallocations: u64,
  pub bytes_allocated: u64,
  pub bytes_deallocated: u64,
  pub peak_memory_usage: u64,
  pub current_memory_usage: u64,
}

impl MemoryManager {
  /// Создать новый memory manager
  pub fn new() -> Self {
    Self {
      pool: Arc::new(MemoryPool::new()),
      stats_collector: Arc::new(RwLock::new(MemoryManagerStats::default())),
    }
  }

  /// Получить memory pool
  pub fn pool(&self) -> Arc<MemoryPool> {
    self.pool.clone()
  }

  /// Выделить буфер
  pub async fn allocate(&self, size: usize) -> Result<PooledBuffer> {
    // Обновляем статистику
    {
      let mut stats = self.stats_collector.write().await;
      stats.allocations += 1;
      stats.bytes_allocated += size as u64;
      stats.current_memory_usage += size as u64;

      if stats.current_memory_usage > stats.peak_memory_usage {
        stats.peak_memory_usage = stats.current_memory_usage;
      }
    }

    self.pool.allocate(size).await
  }

  /// Получить статистику manager
  pub async fn get_manager_stats(&self) -> MemoryManagerStats {
    let stats = self.stats_collector.read().await;
    stats.clone()
  }

  /// Получить полную статистику
  pub async fn get_full_stats(&self) -> (MemoryManagerStats, MemoryPoolStats) {
    let manager_stats = self.get_manager_stats().await;
    let pool_stats = self.pool.get_stats().await;
    (manager_stats, pool_stats)
  }

  /// Запустить фоновую очистку
  pub async fn start_background_cleanup(&self) {
    let pool = self.pool.clone();

    tokio::spawn(async move {
      let mut interval = tokio::time::interval(std::time::Duration::from_secs(300)); // 5 минут

      loop {
        interval.tick().await;
        pool.cleanup_custom_pools().await;
      }
    });
  }
}

impl Default for MemoryManager {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_memory_pool() {
    let pool = MemoryPool::new();

    // Тестируем различные размеры
    let small_buf = pool.allocate(1024).await.unwrap();
    assert_eq!(small_buf.len(), 1024);

    let medium_buf = pool.allocate(32 * 1024).await.unwrap();
    assert_eq!(medium_buf.len(), 32 * 1024);

    let large_buf = pool.allocate(512 * 1024).await.unwrap();
    assert_eq!(large_buf.len(), 512 * 1024);

    // Проверяем статистику
    let stats = pool.get_stats().await;
    assert!(stats.total_allocated() > 0);
  }

  #[tokio::test]
  async fn test_pooled_buffer() {
    let pool = MemoryPool::new();
    let mut buffer = pool.allocate(1024).await.unwrap();

    // Тестируем запись и чтение
    let data = buffer.as_mut_slice();
    data[0] = 42;
    data[1] = 24;

    assert_eq!(data[0], 42);
    assert_eq!(data[1], 24);
    assert_eq!(buffer.len(), 1024);
  }

  #[tokio::test]
  async fn test_memory_manager() {
    let manager = MemoryManager::new();

    // Выделяем несколько буферов
    let _buf1 = manager.allocate(1024).await.unwrap();
    let _buf2 = manager.allocate(2048).await.unwrap();

    // Проверяем статистику
    let stats = manager.get_manager_stats().await;
    assert_eq!(stats.allocations, 2);
    assert_eq!(stats.bytes_allocated, 3072);
  }
}
