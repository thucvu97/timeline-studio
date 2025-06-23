//! Core infrastructure modules for Timeline Studio

pub mod di;
pub mod events;
pub mod performance;
pub mod plugins;
pub mod telemetry;

// Re-export only when fully implemented
#[allow(unused_imports)]
pub use di::{Service, ServiceContainer, ServiceProvider};
#[allow(unused_imports)]
pub use events::{AppEvent, EventBus, EventHandler};
#[allow(unused_imports)]
pub use performance::{CacheManager, MemoryManager, RuntimeManager};
#[allow(unused_imports)]
pub use plugins::PluginManager;
#[allow(unused_imports)]
pub use telemetry::{MetricsCollector, TelemetryConfig, TelemetryManager, Tracer};
