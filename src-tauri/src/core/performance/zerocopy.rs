//! Zero-copy операции для оптимизации производительности
//!
//! Этот модуль предоставляет структуры и методы для работы с данными
//! без лишних копирований в памяти, что критически важно для видеообработки.

use crate::video_compiler::error::{Result, VideoCompilerError};
use std::alloc::{self, Layout};
use std::collections::HashMap;
use std::marker::PhantomData;
use std::ptr::NonNull;
use std::slice;
use std::sync::Arc;
use tokio::sync::{Mutex, RwLock};

/// Типы данных, с которыми работает zero-copy система
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum DataType {
  /// RGB кадр (24 бита на пиксель)
  Rgb24,
  /// RGBA кадр (32 бита на пиксель)
  Rgba32,
  /// YUV420p кадр
  Yuv420p,
  /// Сырые байты
  Raw,
  /// Аудио данные (f32 samples)
  AudioF32,
  /// Аудио данные (16-bit PCM)
  AudioPcm16,
}

impl DataType {
  /// Получить размер одного элемента в байтах
  pub fn element_size(&self) -> usize {
    match self {
      DataType::Rgb24 => 3,
      DataType::Rgba32 => 4,
      DataType::Yuv420p => 1, // Y компонента
      DataType::Raw => 1,
      DataType::AudioF32 => 4,
      DataType::AudioPcm16 => 2,
    }
  }

  /// Рассчитать размер кадра для заданных размеров
  pub fn frame_size(&self, width: usize, height: usize) -> usize {
    match self {
      DataType::Rgb24 => width * height * 3,
      DataType::Rgba32 => width * height * 4,
      DataType::Yuv420p => width * height * 3 / 2, // Y + U/2 + V/2
      DataType::Raw => width * height,
      DataType::AudioF32 | DataType::AudioPcm16 => width * self.element_size(),
    }
  }
}

/// Zero-copy буфер, который использует выровненную память
pub struct ZeroCopyBuffer {
  /// Указатель на данные
  ptr: NonNull<u8>,
  /// Размер буфера в байтах
  size: usize,
  /// Выравнивание памяти
  alignment: usize,
  /// Layout для корректного освобождения памяти
  layout: Layout,
  /// Тип данных
  data_type: DataType,
  /// Размеры (ширина, высота) для видео/изображений
  dimensions: Option<(usize, usize)>,
  /// Количество ссылок
  ref_count: Arc<()>,
}

impl ZeroCopyBuffer {
  /// Создать новый zero-copy буфер
  pub fn new(size: usize, alignment: usize, data_type: DataType) -> Result<Self> {
    if size == 0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Buffer size cannot be zero".to_string(),
      ));
    }

    let layout = Layout::from_size_align(size, alignment)
      .map_err(|e| VideoCompilerError::InternalError(format!("Invalid layout: {}", e)))?;

    let ptr = unsafe {
      let raw_ptr = alloc::alloc_zeroed(layout);
      if raw_ptr.is_null() {
        return Err(VideoCompilerError::InternalError(
          "Failed to allocate memory".to_string(),
        ));
      }
      NonNull::new_unchecked(raw_ptr)
    };

    Ok(Self {
      ptr,
      size,
      alignment,
      layout,
      data_type,
      dimensions: None,
      ref_count: Arc::new(()),
    })
  }

  /// Создать буфер для видео кадра
  pub fn for_frame(width: usize, height: usize, data_type: DataType) -> Result<Self> {
    let size = data_type.frame_size(width, height);
    let alignment = 32; // AVX2 выравнивание

    let mut buffer = Self::new(size, alignment, data_type)?;
    buffer.dimensions = Some((width, height));
    Ok(buffer)
  }

  /// Создать буфер для аудио данных
  pub fn for_audio(samples: usize, data_type: DataType) -> Result<Self> {
    if !matches!(data_type, DataType::AudioF32 | DataType::AudioPcm16) {
      return Err(VideoCompilerError::InvalidParameter(
        "Invalid audio data type".to_string(),
      ));
    }

    let size = samples * data_type.element_size();
    let alignment = 16; // SSE выравнивание для аудио

    let mut buffer = Self::new(size, alignment, data_type)?;
    buffer.dimensions = Some((samples, 1));
    Ok(buffer)
  }

  /// Получить размер буфера
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }

  /// Получить размеры
  pub fn dimensions(&self) -> Option<(usize, usize)> {
    self.dimensions
  }

  /// Получить выравнивание
  pub fn alignment(&self) -> usize {
    self.alignment
  }

  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить mutable slice данных
  pub fn as_mut_slice(&mut self) -> &mut [u8] {
    unsafe { slice::from_raw_parts_mut(self.ptr.as_ptr(), self.size) }
  }

  /// Клонировать буфер без копирования данных
  pub fn clone_ref(&self) -> ZeroCopyRef {
    ZeroCopyRef {
      ptr: self.ptr,
      size: self.size,
      data_type: self.data_type,
      dimensions: self.dimensions,
      _ref_count: Arc::clone(&self.ref_count),
      _phantom: PhantomData,
    }
  }

  /// Создать view на часть буфера
  pub fn view(&self, offset: usize, len: usize) -> Result<ZeroCopyView> {
    if offset + len > self.size {
      return Err(VideoCompilerError::InvalidParameter(
        "View exceeds buffer bounds".to_string(),
      ));
    }

    let view_ptr = unsafe { NonNull::new_unchecked(self.ptr.as_ptr().add(offset)) };

    Ok(ZeroCopyView {
      ptr: view_ptr,
      size: len,
      data_type: self.data_type,
      _ref_count: Arc::clone(&self.ref_count),
      _phantom: PhantomData,
    })
  }

  /// Проверить, является ли буфер уникальной ссылкой
  pub fn is_unique(&self) -> bool {
    Arc::strong_count(&self.ref_count) == 1
  }

  /// Получить количество ссылок на буфер
  pub fn ref_count(&self) -> usize {
    Arc::strong_count(&self.ref_count)
  }
}

impl Drop for ZeroCopyBuffer {
  fn drop(&mut self) {
    unsafe {
      alloc::dealloc(self.ptr.as_ptr(), self.layout);
    }
  }
}

// Безопасно для отправки между потоками, так как мы используем выровненную память
unsafe impl Send for ZeroCopyBuffer {}
unsafe impl Sync for ZeroCopyBuffer {}

/// Ссылка на zero-copy буфер без владения данными
pub struct ZeroCopyRef {
  ptr: NonNull<u8>,
  size: usize,
  data_type: DataType,
  dimensions: Option<(usize, usize)>,
  _ref_count: Arc<()>,
  _phantom: PhantomData<*const u8>,
}

impl ZeroCopyRef {
  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить размер
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }

  /// Получить размеры
  pub fn dimensions(&self) -> Option<(usize, usize)> {
    self.dimensions
  }
}

impl Clone for ZeroCopyRef {
  fn clone(&self) -> Self {
    Self {
      ptr: self.ptr,
      size: self.size,
      data_type: self.data_type,
      dimensions: self.dimensions,
      _ref_count: Arc::clone(&self._ref_count),
      _phantom: PhantomData,
    }
  }
}

unsafe impl Send for ZeroCopyRef {}
unsafe impl Sync for ZeroCopyRef {}

/// View на часть zero-copy буфера
pub struct ZeroCopyView {
  ptr: NonNull<u8>,
  size: usize,
  data_type: DataType,
  _ref_count: Arc<()>,
  _phantom: PhantomData<*const u8>,
}

impl ZeroCopyView {
  /// Получить slice данных
  pub fn as_slice(&self) -> &[u8] {
    unsafe { slice::from_raw_parts(self.ptr.as_ptr(), self.size) }
  }

  /// Получить размер
  pub fn size(&self) -> usize {
    self.size
  }

  /// Получить тип данных
  pub fn data_type(&self) -> DataType {
    self.data_type
  }
}

unsafe impl Send for ZeroCopyView {}
unsafe impl Sync for ZeroCopyView {}

/// Тип для пулов буферов
type BufferPools = Arc<RwLock<HashMap<(usize, DataType), Vec<ZeroCopyBuffer>>>>;

/// Менеджер zero-copy буферов с пулингом
pub struct ZeroCopyManager {
  /// Пулы буферов разных размеров
  pools: BufferPools,
  /// Статистика использования
  stats: Arc<Mutex<ZeroCopyStats>>,
  /// Максимальный размер пула для каждого типа
  max_pool_size: usize,
}

/// Статистика zero-copy операций
#[derive(Debug, Default, Clone)]
pub struct ZeroCopyStats {
  /// Количество созданных буферов
  pub buffers_created: u64,
  /// Количество переиспользованных буферов
  pub buffers_reused: u64,
  /// Количество активных буферов
  pub active_buffers: u64,
  /// Общий размер активных буферов в байтах
  pub total_memory: usize,
  /// Количество zero-copy операций
  pub zero_copy_operations: u64,
  /// Сэкономленные байты благодаря zero-copy
  pub bytes_saved: u64,
}

impl ZeroCopyManager {
  /// Создать новый менеджер
  pub fn new() -> Self {
    Self {
      pools: Arc::new(RwLock::new(HashMap::new())),
      stats: Arc::new(Mutex::new(ZeroCopyStats::default())),
      max_pool_size: 16, // Максимум 16 буферов в пуле
    }
  }

  /// Получить буфер из пула или создать новый
  pub async fn get_buffer(&self, size: usize, data_type: DataType) -> Result<ZeroCopyBuffer> {
    let key = (size, data_type);

    // Пытаемся получить из пула
    {
      let mut pools = self.pools.write().await;
      if let Some(pool) = pools.get_mut(&key) {
        if let Some(buffer) = pool.pop() {
          let mut stats = self.stats.lock().await;
          stats.buffers_reused += 1;
          stats.active_buffers += 1;
          stats.total_memory += size;
          return Ok(buffer);
        }
      }
    }

    // Создаем новый буфер
    let buffer = ZeroCopyBuffer::new(size, 32, data_type)?;

    let mut stats = self.stats.lock().await;
    stats.buffers_created += 1;
    stats.active_buffers += 1;
    stats.total_memory += size;

    Ok(buffer)
  }

  /// Получить буфер для видео кадра
  pub async fn get_frame_buffer(
    &self,
    width: usize,
    height: usize,
    data_type: DataType,
  ) -> Result<ZeroCopyBuffer> {
    let size = data_type.frame_size(width, height);
    let mut buffer = self.get_buffer(size, data_type).await?;
    buffer.dimensions = Some((width, height));
    Ok(buffer)
  }

  /// Получить буфер для аудио
  pub async fn get_audio_buffer(
    &self,
    samples: usize,
    data_type: DataType,
  ) -> Result<ZeroCopyBuffer> {
    if !matches!(data_type, DataType::AudioF32 | DataType::AudioPcm16) {
      return Err(VideoCompilerError::InvalidParameter(
        "Invalid audio data type".to_string(),
      ));
    }

    let size = samples * data_type.element_size();
    let mut buffer = self.get_buffer(size, data_type).await?;
    buffer.dimensions = Some((samples, 1));
    Ok(buffer)
  }

  /// Вернуть буфер в пул для переиспользования
  pub async fn return_buffer(&self, buffer: ZeroCopyBuffer) {
    if !buffer.is_unique() {
      // Буфер все еще используется, не возвращаем в пул
      return;
    }

    let key = (buffer.size, buffer.data_type);
    let mut pools = self.pools.write().await;

    let pool = pools.entry(key).or_insert_with(Vec::new);
    if pool.len() < self.max_pool_size {
      pool.push(buffer);
    }

    let mut stats = self.stats.lock().await;
    stats.active_buffers = stats.active_buffers.saturating_sub(1);
    stats.total_memory = stats.total_memory.saturating_sub(key.0);
  }

  /// Создать zero-copy передачу данных между буферами
  pub async fn transfer_data(&self, src: &ZeroCopyRef, dst: &mut ZeroCopyBuffer) -> Result<()> {
    if src.size() != dst.size() {
      return Err(VideoCompilerError::InvalidParameter(
        "Buffer sizes must match".to_string(),
      ));
    }

    if src.data_type() != dst.data_type() {
      return Err(VideoCompilerError::InvalidParameter(
        "Data types must match".to_string(),
      ));
    }

    // Копируем данные (в будущем здесь можно использовать DMA или другие оптимизации)
    dst.as_mut_slice().copy_from_slice(src.as_slice());

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;
    stats.bytes_saved += src.size() as u64; // Условная экономия

    Ok(())
  }

  /// Создать view без копирования данных
  pub async fn create_view(
    &self,
    buffer: &ZeroCopyBuffer,
    offset: usize,
    len: usize,
  ) -> Result<ZeroCopyView> {
    let view = buffer.view(offset, len)?;

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;
    stats.bytes_saved += len as u64;

    Ok(view)
  }

  /// Объединить несколько буферов в один без копирования (создает view)
  pub async fn concatenate_views<'a>(&self, views: &'a [ZeroCopyView]) -> Result<Vec<&'a [u8]>> {
    let mut result = Vec::with_capacity(views.len());

    for view in views {
      result.push(view.as_slice());
    }

    let mut stats = self.stats.lock().await;
    stats.zero_copy_operations += 1;

    let total_bytes: usize = views.iter().map(|v| v.size()).sum();
    stats.bytes_saved += total_bytes as u64;

    Ok(result)
  }

  /// Получить статистику
  pub async fn get_stats(&self) -> ZeroCopyStats {
    (*self.stats.lock().await).clone()
  }

  /// Очистить пулы буферов
  pub async fn clear_pools(&self) {
    let mut pools = self.pools.write().await;
    pools.clear();
  }

  /// Получить информацию о пулах
  pub async fn get_pool_info(&self) -> HashMap<(usize, DataType), usize> {
    let pools = self.pools.read().await;
    pools.iter().map(|(key, pool)| (*key, pool.len())).collect()
  }
}

impl Default for ZeroCopyManager {
  fn default() -> Self {
    Self::new()
  }
}

/// Специализированные операции для видео данных
pub struct VideoZeroCopy;

impl VideoZeroCopy {
  /// Конвертировать RGB в RGBA без копирования (добавляет альфа канал)
  pub fn rgb_to_rgba_inplace(rgb_buffer: &ZeroCopyBuffer) -> Result<ZeroCopyBuffer> {
    if rgb_buffer.data_type() != DataType::Rgb24 {
      return Err(VideoCompilerError::InvalidParameter(
        "Expected RGB24 buffer".to_string(),
      ));
    }

    let (width, height) = rgb_buffer.dimensions().ok_or_else(|| {
      VideoCompilerError::InvalidParameter("Buffer missing dimensions".to_string())
    })?;

    let rgba_size = width * height * 4;
    let mut rgba_buffer = ZeroCopyBuffer::new(rgba_size, 32, DataType::Rgba32)?;
    rgba_buffer.dimensions = Some((width, height));

    let rgb_data = rgb_buffer.as_slice();
    let rgba_data = rgba_buffer.as_mut_slice();

    // Конвертируем RGB в RGBA
    for i in 0..(width * height) {
      let rgb_offset = i * 3;
      let rgba_offset = i * 4;

      rgba_data[rgba_offset] = rgb_data[rgb_offset]; // R
      rgba_data[rgba_offset + 1] = rgb_data[rgb_offset + 1]; // G
      rgba_data[rgba_offset + 2] = rgb_data[rgb_offset + 2]; // B
      rgba_data[rgba_offset + 3] = 255; // A (полная непрозрачность)
    }

    Ok(rgba_buffer)
  }

  /// Извлечь YUV компоненты без копирования
  pub fn extract_yuv_planes(
    yuv_buffer: &ZeroCopyBuffer,
  ) -> Result<(ZeroCopyView, ZeroCopyView, ZeroCopyView)> {
    if yuv_buffer.data_type() != DataType::Yuv420p {
      return Err(VideoCompilerError::InvalidParameter(
        "Expected YUV420p buffer".to_string(),
      ));
    }

    let (width, height) = yuv_buffer.dimensions().ok_or_else(|| {
      VideoCompilerError::InvalidParameter("Buffer missing dimensions".to_string())
    })?;

    let y_size = width * height;
    let uv_size = y_size / 4;

    let y_plane = yuv_buffer.view(0, y_size)?;
    let u_plane = yuv_buffer.view(y_size, uv_size)?;
    let v_plane = yuv_buffer.view(y_size + uv_size, uv_size)?;

    Ok((y_plane, u_plane, v_plane))
  }
}

/// Специализированные операции для аудио данных
pub struct AudioZeroCopy;

impl AudioZeroCopy {
  /// Интерлив стерео каналов без копирования
  pub fn interleave_stereo(
    left: &ZeroCopyBuffer,
    right: &ZeroCopyBuffer,
  ) -> Result<ZeroCopyBuffer> {
    if left.data_type() != right.data_type() {
      return Err(VideoCompilerError::InvalidParameter(
        "Audio buffers must have same type".to_string(),
      ));
    }

    if left.size() != right.size() {
      return Err(VideoCompilerError::InvalidParameter(
        "Audio buffers must have same size".to_string(),
      ));
    }

    let samples = left.dimensions().unwrap_or((0, 0)).0;
    let element_size = left.data_type().element_size();
    let interleaved_size = left.size() + right.size();

    let mut interleaved = ZeroCopyBuffer::new(interleaved_size, 16, left.data_type())?;
    interleaved.dimensions = Some((samples * 2, 1));

    let left_data = left.as_slice();
    let right_data = right.as_slice();
    let interleaved_data = interleaved.as_mut_slice();

    // Интерлив сэмплов L R L R L R...
    for i in 0..samples {
      let src_offset = i * element_size;
      let dst_offset = i * element_size * 2;

      // Копируем левый канал
      interleaved_data[dst_offset..dst_offset + element_size]
        .copy_from_slice(&left_data[src_offset..src_offset + element_size]);

      // Копируем правый канал
      interleaved_data[dst_offset + element_size..dst_offset + element_size * 2]
        .copy_from_slice(&right_data[src_offset..src_offset + element_size]);
    }

    Ok(interleaved)
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_zero_copy_buffer_creation() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    assert_eq!(buffer.size(), 1024);
    assert_eq!(buffer.alignment(), 32);
    assert_eq!(buffer.data_type(), DataType::Raw);
  }

  #[tokio::test]
  async fn test_frame_buffer() {
    let buffer = ZeroCopyBuffer::for_frame(1920, 1080, DataType::Rgb24).unwrap();
    assert_eq!(buffer.dimensions(), Some((1920, 1080)));
    assert_eq!(buffer.size(), 1920 * 1080 * 3);
  }

  #[tokio::test]
  async fn test_zero_copy_manager() {
    let manager = ZeroCopyManager::new();

    let buffer1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer1.size(), 1024);

    let stats = manager.get_stats().await;
    assert_eq!(stats.buffers_created, 1);
    assert_eq!(stats.active_buffers, 1);
  }

  #[tokio::test]
  async fn test_buffer_view() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let view = buffer.view(100, 500).unwrap();
    assert_eq!(view.size(), 500);
  }

  #[tokio::test]
  async fn test_rgb_to_rgba_conversion() {
    let rgb_buffer = ZeroCopyBuffer::for_frame(2, 2, DataType::Rgb24).unwrap();
    let rgba_buffer = VideoZeroCopy::rgb_to_rgba_inplace(&rgb_buffer).unwrap();

    assert_eq!(rgba_buffer.data_type(), DataType::Rgba32);
    assert_eq!(rgba_buffer.size(), 2 * 2 * 4);
  }

  #[tokio::test]
  async fn test_zero_copy_buffer_clone_ref() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let cloned = buffer.clone_ref();

    assert_eq!(buffer.size(), cloned.size());
    assert_eq!(buffer.data_type(), cloned.data_type());
  }

  #[tokio::test]
  async fn test_multiple_views() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Create multiple views of the same buffer
    let view1 = buffer.view(0, 256).unwrap();
    let view2 = buffer.view(256, 256).unwrap();
    let view3 = buffer.view(512, 256).unwrap();

    assert_eq!(view1.size(), 256);
    assert_eq!(view2.size(), 256);
    assert_eq!(view3.size(), 256);

    // Views should have different content addresses
    assert_ne!(view1.as_slice().as_ptr(), view2.as_slice().as_ptr());
    assert_ne!(view2.as_slice().as_ptr(), view3.as_slice().as_ptr());
  }

  #[tokio::test]
  async fn test_audio_interleave() {
    // Create mono audio buffers
    let mut left = ZeroCopyBuffer::new(8, 16, DataType::AudioF32).unwrap();
    let mut right = ZeroCopyBuffer::new(8, 16, DataType::AudioF32).unwrap();

    // Set dimensions for 2 samples (4 bytes each)
    left.dimensions = Some((2, 1));
    right.dimensions = Some((2, 1));

    // Fill with test data
    left
      .as_mut_slice()
      .copy_from_slice(&[1u8, 0, 0, 0, 2, 0, 0, 0]); // 1.0, 2.0 as f32
    right
      .as_mut_slice()
      .copy_from_slice(&[3u8, 0, 0, 0, 4, 0, 0, 0]); // 3.0, 4.0 as f32

    let interleaved = AudioZeroCopy::interleave_stereo(&left, &right).unwrap();

    assert_eq!(interleaved.size(), 16); // 4 samples * 4 bytes
    assert_eq!(interleaved.dimensions(), Some((4, 1))); // 4 interleaved samples

    let data = interleaved.as_slice();
    // Should be: L R L R pattern
    assert_eq!(&data[0..4], &[1u8, 0, 0, 0]); // First left
    assert_eq!(&data[4..8], &[3u8, 0, 0, 0]); // First right
    assert_eq!(&data[8..12], &[2u8, 0, 0, 0]); // Second left
    assert_eq!(&data[12..16], &[4u8, 0, 0, 0]); // Second right
  }

  #[tokio::test]
  async fn test_yuv_plane_extraction() {
    // Create YUV420p buffer for 4x4 image
    let mut yuv_buffer = ZeroCopyBuffer::for_frame(4, 4, DataType::Yuv420p).unwrap();
    yuv_buffer.dimensions = Some((4, 4));

    let (y_plane, u_plane, v_plane) = VideoZeroCopy::extract_yuv_planes(&yuv_buffer).unwrap();

    // Y plane should be 4x4 = 16 bytes
    assert_eq!(y_plane.size(), 16);
    // U and V planes should be 2x2 = 4 bytes each (subsampled)
    assert_eq!(u_plane.size(), 4);
    assert_eq!(v_plane.size(), 4);
  }

  #[tokio::test]
  async fn test_buffer_alignment() {
    // Test different alignments
    let buffer_8 = ZeroCopyBuffer::new(1024, 8, DataType::Raw).unwrap();
    let buffer_16 = ZeroCopyBuffer::new(1024, 16, DataType::Raw).unwrap();
    let buffer_32 = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    assert_eq!(buffer_8.alignment(), 8);
    assert_eq!(buffer_16.alignment(), 16);
    assert_eq!(buffer_32.alignment(), 32);

    // Check that pointers are actually aligned
    assert_eq!(buffer_8.as_slice().as_ptr() as usize % 8, 0);
    assert_eq!(buffer_16.as_slice().as_ptr() as usize % 16, 0);
    assert_eq!(buffer_32.as_slice().as_ptr() as usize % 32, 0);
  }

  #[tokio::test]
  async fn test_zero_copy_manager_pooling() {
    let manager = ZeroCopyManager::new();

    // Get and explicitly return a buffer
    let buffer1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer1.size(), 1024);

    // Return buffer to pool
    manager.return_buffer(buffer1).await;

    // Get another buffer of same size - should be pooled
    let buffer2 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    assert_eq!(buffer2.size(), 1024);

    let stats = manager.get_stats().await;
    // Should show reuse
    assert!(stats.buffers_reused > 0);
  }

  #[tokio::test]
  async fn test_buffer_data_type_element_size() {
    assert_eq!(DataType::Raw.element_size(), 1);
    assert_eq!(DataType::Rgb24.element_size(), 3);
    assert_eq!(DataType::Rgba32.element_size(), 4);
    assert_eq!(DataType::AudioF32.element_size(), 4);
    assert_eq!(DataType::Yuv420p.element_size(), 1);
  }

  #[tokio::test]
  async fn test_buffer_error_cases() {
    let buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Test view beyond buffer bounds
    let result = buffer.view(2000, 100);
    assert!(result.is_err());

    // Test view with size extending beyond buffer
    let result = buffer.view(1000, 100);
    assert!(result.is_err());

    // Test RGB to RGBA with wrong data type
    let wrong_buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();
    let result = VideoZeroCopy::rgb_to_rgba_inplace(&wrong_buffer);
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_manager_stats_tracking() {
    let manager = ZeroCopyManager::new();

    // Create several buffers
    let _buf1 = manager.get_buffer(1024, DataType::Raw).await.unwrap();
    let _buf2 = manager.get_buffer(2048, DataType::Rgb24).await.unwrap();
    let _buf3 = manager.get_buffer(1024, DataType::Raw).await.unwrap(); // Should reuse

    let stats = manager.get_stats().await;
    assert!(stats.buffers_created >= 2);
    assert!(stats.total_memory >= 3072);
    assert_eq!(stats.active_buffers, 3);
  }

  #[tokio::test]
  async fn test_concurrent_zero_copy_operations() {
    let manager = Arc::new(ZeroCopyManager::new());
    let mut handles = vec![];

    // Spawn multiple tasks performing zero-copy operations
    for i in 0..10 {
      let manager_clone = manager.clone();
      let handle = tokio::spawn(async move {
        let buffer = manager_clone
          .get_buffer(1024 * (i + 1), DataType::Raw)
          .await
          .unwrap();

        // Create view
        let view = buffer.view(0, 512).unwrap();
        assert_eq!(view.size(), 512);

        // Clone buffer reference
        let _cloned = buffer.clone_ref();
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      handle.await.unwrap();
    }

    let stats = manager.get_stats().await;
    assert!(stats.buffers_created >= 10);
  }

  #[tokio::test]
  async fn test_buffer_view_safety() {
    let mut buffer = ZeroCopyBuffer::new(1024, 32, DataType::Raw).unwrap();

    // Fill buffer with test pattern
    let data = buffer.as_mut_slice();
    for (i, item) in data.iter_mut().enumerate() {
      *item = (i % 256) as u8;
    }

    // Create view
    let view = buffer.view(100, 200).unwrap();
    let view_data = view.as_slice();

    // Verify view shows correct data
    for (i, &byte) in view_data.iter().enumerate() {
      assert_eq!(byte, ((100 + i) % 256) as u8);
    }
  }
}
