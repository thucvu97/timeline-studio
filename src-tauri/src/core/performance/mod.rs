//! Модули для оптимизации производительности

pub mod cache;
pub mod memory;
pub mod runtime;
pub mod zerocopy;

pub use cache::{CacheManager, LruCache, MemoryCache};
pub use memory::{MemoryManager, MemoryPool, PooledBuffer};
pub use runtime::{RuntimeConfig, RuntimeManager, WorkerPool};
pub use zerocopy::{
  AudioZeroCopy, DataType, VideoZeroCopy, ZeroCopyBuffer, ZeroCopyManager, ZeroCopyRef,
  ZeroCopyView,
};
