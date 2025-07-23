/// Tauri commands for state management
use super::{CommandResult, EventEnvelope, ProjectCommand, ProjectState, StateManager};
use tauri::State;

/// Execute a project command
#[tauri::command]
#[specta::specta]
pub async fn execute_command(
  state_manager: State<'_, StateManager>,
  command: ProjectCommand,
) -> Result<CommandResult, String> {
  Ok(state_manager.execute_command(command).await)
}

/// Get current project state
#[tauri::command]
#[specta::specta]
pub async fn get_project_state(
  state_manager: State<'_, StateManager>,
) -> Result<ProjectState, String> {
  let state = state_manager.get_state().await;
  Ok(state.clone())
}

/// Get event history since a specific version
#[tauri::command]
#[specta::specta]
pub async fn get_event_history(
  state_manager: State<'_, StateManager>,
  since_version: Option<u32>,
) -> Result<Vec<EventEnvelope>, String> {
  let events = state_manager.event_bus().get_history(since_version).await;
  Ok(events)
}

// Subscribe to project events (handled automatically by Tauri event system)
// Frontend should listen to "project:event" events
