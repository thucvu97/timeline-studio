//! Module for exporting TypeScript types using Specta
//! This module generates TypeScript bindings for Tauri commands and types

// Re-export types that will be exported to TypeScript
// These are available for use in the TypeScript frontend
#[allow(unused_imports)]
pub use crate::core::events::AppEvent;
#[allow(unused_imports)]
pub use crate::core::plugins::plugin::{
  PluginCommand, PluginDependency, PluginMetadata, PluginResponse, PluginState, PluginType, Version,
};

// Simple command for demonstration
#[tauri::command]
#[specta::specta]
pub fn get_app_version() -> String {
  env!("CARGO_PKG_VERSION").to_string()
}

/// Export TypeScript bindings
pub fn export_typescript_bindings() {
  #[cfg(debug_assertions)]
  {
    let builder = tauri_specta::Builder::<tauri::Wry>::new()
      .commands(tauri_specta::collect_commands![get_app_version])
      .events(tauri_specta::collect_events![]);

    // Create directory if it doesn't exist
    std::fs::create_dir_all("../src/types/generated").ok();

    builder
      .export(
        specta_typescript::Typescript::default(),
        "../src/types/generated/tauri-bindings.ts",
      )
      .expect("Failed to export TypeScript bindings");

    println!("TypeScript bindings exported successfully!");
  }
}
