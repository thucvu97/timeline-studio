//! Модули для оптимизации производительности

pub mod cache;
pub mod memory;
pub mod runtime;
pub mod zerocopy;

pub use cache::CacheManager;
pub use memory::MemoryManager;
pub use runtime::RuntimeManager;
