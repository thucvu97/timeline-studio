//! Модули для оптимизации производительности

pub mod runtime;
pub mod memory;
pub mod cache;
pub mod zerocopy;

pub use runtime::{RuntimeManager, RuntimeConfig, WorkerPool};
pub use memory::{MemoryPool, MemoryManager, PooledBuffer};
pub use cache::{CacheManager, MemoryCache, LruCache};
pub use zerocopy::{ZeroCopyBuffer, ZeroCopyManager, ZeroCopyRef, ZeroCopyView, DataType, VideoZeroCopy, AudioZeroCopy};