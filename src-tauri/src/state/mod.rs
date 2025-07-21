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
pub mod events;
pub mod commands;
pub mod persistence;
pub mod commands_api;

pub use project_state::ProjectState;
pub use events::{ProjectEvent, EventBus, EventEnvelope, EventMetadata};
pub use commands::{ProjectCommand, CommandHandler, CommandResult};
pub use persistence::PersistenceService;

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
            Err(_) => Arc::new(RwLock::new(ProjectState::default())),
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
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_state_manager_creation() {
        // This test would require a mock AppHandle
        // For now, we just ensure the module compiles
    }
}