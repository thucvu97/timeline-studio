//! Core infrastructure modules for Timeline Studio

pub mod di;
pub mod events;
pub mod plugins;

// Re-export only when fully implemented
#[allow(unused_imports)]
pub use di::{ServiceContainer, Service, ServiceProvider};
#[allow(unused_imports)]
pub use events::{EventBus, EventHandler, AppEvent};