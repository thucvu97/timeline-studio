pub mod commands;
pub mod commands_api;
pub mod events;
pub mod persistence;
/// State management module for Timeline Studio
///
/// This module implements a centralized state management system
/// where the backend is the single source of truth for all application state.
///
/// Architecture:
/// - ProjectState: Holds the current project state
/// - EventBus: Publishes state changes to all subscribers
/// - CommandHandler: Processes commands that modify state
/// - PersistenceService: Handles saving/loading state
pub mod project_state;

pub use commands::{CommandHandler, CommandResult, ProjectCommand};
pub use events::{EventBus, EventEnvelope, EventMetadata, ProjectEvent};
pub use persistence::PersistenceService;
pub use project_state::ProjectState;

use std::sync::Arc;
use tokio::sync::RwLock;

/// Main state manager that coordinates all state operations
pub struct StateManager {
  project_state: Arc<RwLock<ProjectState>>,
  event_bus: Arc<EventBus>,
  command_handler: Arc<CommandHandler>,
  persistence: Arc<PersistenceService>,
}

impl StateManager {
  pub async fn new(app_handle: tauri::AppHandle) -> Result<Self, String> {
    let event_bus = Arc::new(EventBus::new(app_handle.clone()));
    let persistence = Arc::new(PersistenceService::new(app_handle)?);

    // Load or create initial project state
    let project_state = match persistence.load_latest().await {
      Ok(state) => Arc::new(RwLock::new(state)),
      Err(_) => {
        // Create a default project state with a temporary project
        let mut state = ProjectState::default();

        // Create a temporary project with default settings
        let default_settings = project_state::ProjectSettings {
          resolution: project_state::Resolution {
            width: 1920,
            height: 1080,
          },
          frame_rate: 30.0,
          audio_sample_rate: 48000,
          audio_channels: 2,
        };

        state.create_project("Untitled Project".to_string(), default_settings);

        Arc::new(RwLock::new(state))
      }
    };

    let command_handler = Arc::new(CommandHandler::new(
      project_state.clone(),
      event_bus.clone(),
      persistence.clone(),
    ));

    Ok(Self {
      project_state,
      event_bus,
      command_handler,
      persistence,
    })
  }

  /// Execute a command that modifies the project state
  pub async fn execute_command(&self, command: ProjectCommand) -> CommandResult {
    self.command_handler.execute(command).await
  }

  /// Get a read-only view of the current project state
  pub async fn get_state(&self) -> tokio::sync::RwLockReadGuard<'_, ProjectState> {
    self.project_state.read().await
  }

  /// Subscribe to project events
  pub fn event_bus(&self) -> &Arc<EventBus> {
    &self.event_bus
  }

  /// Save current state to disk
  pub async fn save_state(&self, path: Option<String>) -> Result<(), String> {
    let state = self.project_state.read().await;
    let save_path = path.or_else(|| state.project.as_ref()?.metadata.file_path.clone());

    if let Some(path) = save_path {
      self.persistence.save_project(&state, &path).await
    } else {
      Err("No save path specified".to_string())
    }
  }
}

#[cfg(test)]
mod tests {
  #[tokio::test]
  async fn test_state_manager_creation() {
    // This test would require a mock AppHandle
    // For now, we just ensure the module compiles
  }
}
