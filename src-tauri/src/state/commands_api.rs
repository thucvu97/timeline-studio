/// Tauri commands for state management
use super::{CommandResult, EventEnvelope, ProjectCommand, ProjectState, StateManager};
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri::State;

/// Batch command execution request
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BatchCommandRequest {
  /// List of commands to execute in sequence
  pub commands: Vec<ProjectCommand>,
  /// Whether to stop on first error or continue
  pub stop_on_error: bool,
  /// Optional transaction name for debugging
  pub transaction_name: Option<String>,
}

/// Result of batch command execution
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct BatchCommandResult {
  /// Results of each command (may be shorter than input if stopped on error)
  pub results: Vec<CommandResult>,
  /// Number of successfully executed commands
  pub success_count: usize,
  /// Number of failed commands
  pub error_count: usize,
  /// Total execution time in milliseconds
  pub execution_time_ms: u64,
  /// Whether the entire batch was successful
  pub success: bool,
  /// Error message if batch failed
  pub error_message: Option<String>,
}

/// Execute a project command
#[tauri::command]
#[specta::specta]
pub async fn execute_command(
  state_manager: State<'_, StateManager>,
  command: ProjectCommand,
) -> Result<CommandResult, String> {
  Ok(state_manager.execute_command(command).await)
}

/// Execute multiple commands in a batch for better performance
#[tauri::command]
#[specta::specta]
pub async fn execute_batch_commands(
  state_manager: State<'_, StateManager>,
  request: BatchCommandRequest,
) -> Result<BatchCommandResult, String> {
  let start_time = std::time::Instant::now();
  
  let mut results = Vec::new();
  let mut success_count = 0;
  let mut error_count = 0;
  let mut batch_error = None;

  log::info!(
    "Executing batch of {} commands: {}",
    request.commands.len(),
    request.transaction_name.as_deref().unwrap_or("unnamed")
  );

  // Execute commands sequentially (could be parallelized for independent commands)
  for (index, command) in request.commands.iter().enumerate() {
    log::debug!("Executing command {}/{}: {:?}", index + 1, request.commands.len(), command);
    
    let result = state_manager.execute_command(command.clone()).await;
    
    if result.success {
      success_count += 1;
    } else {
      error_count += 1;
      
      if request.stop_on_error {
        batch_error = Some(format!(
          "Batch stopped at command {} due to error: {}", 
          index + 1, 
          result.message
        ));
        results.push(result);
        break;
      }
    }
    
    results.push(result);
  }

  let execution_time_ms = start_time.elapsed().as_millis() as u64;
  let overall_success = error_count == 0 && batch_error.is_none();

  log::info!(
    "Batch execution completed: {}/{} success, {} errors, {}ms",
    success_count,
    request.commands.len(),
    error_count,
    execution_time_ms
  );

  Ok(BatchCommandResult {
    results,
    success_count,
    error_count,
    execution_time_ms,
    success: overall_success,
    error_message: batch_error,
  })
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
