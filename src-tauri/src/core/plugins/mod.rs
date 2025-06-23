//! Plugin System для Timeline Studio
//!
//! Система плагинов позволяет расширять функциональность приложения
//! без изменения основного кода.

pub mod plugin;
pub mod loader;
pub mod manager;
pub mod context;
pub mod permissions;
pub mod api;

pub use plugin::{Plugin, PluginMetadata, PluginType, PluginCommand, PluginResponse};
pub use loader::{PluginLoader, PluginRegistry};
pub use manager::{PluginManager, PluginHandle};
pub use context::PluginContext;
pub use permissions::{PluginPermissions, FileSystemPermissions, NetworkPermissions};
pub use api::{PluginApi, PluginApiImpl};