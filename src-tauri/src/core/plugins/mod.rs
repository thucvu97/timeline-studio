//! Plugin System для Timeline Studio
//!
//! Система плагинов позволяет расширять функциональность приложения
//! без изменения основного кода.

pub mod api;
pub mod context;
pub mod loader;
pub mod manager;
pub mod permissions;
pub mod plugin;
pub mod sandbox;

pub use api::{PluginApi, PluginApiImpl};
pub use context::PluginContext;
pub use loader::{PluginLoader, PluginRegistry};
pub use manager::{PluginHandle, PluginManager};
pub use permissions::{FileSystemPermissions, NetworkPermissions, PluginPermissions};
pub use plugin::{Plugin, PluginCommand, PluginMetadata, PluginResponse, PluginType};
pub use sandbox::{PluginSandbox, ResourceLimits, SandboxManager, SandboxStats};
