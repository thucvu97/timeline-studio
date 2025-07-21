use super::ProjectState;
use serde_json;
use std::path::{Path, PathBuf};
use tokio::fs;
use tauri::{AppHandle, Manager};

/// Service for persisting project state
pub struct PersistenceService {
    app_handle: AppHandle,
    autosave_dir: PathBuf,
}

impl PersistenceService {
    pub fn new(app_handle: AppHandle) -> Result<Self, String> {
        // Get app data directory for autosaves
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .map_err(|e| format!("Failed to get app data dir: {}", e))?;
        
        let autosave_dir = app_dir.join("autosave");
        
        // Create autosave directory if it doesn't exist
        std::fs::create_dir_all(&autosave_dir)
            .map_err(|e| format!("Failed to create autosave dir: {}", e))?;
        
        Ok(Self {
            app_handle,
            autosave_dir,
        })
    }
    
    /// Save project to file
    pub async fn save_project(&self, state: &ProjectState, path: &str) -> Result<(), String> {
        let content = serde_json::to_string_pretty(state)
            .map_err(|e| format!("Failed to serialize project: {}", e))?;
        
        fs::write(path, content)
            .await
            .map_err(|e| format!("Failed to write project file: {}", e))?;
        
        log::info!("Project saved to: {}", path);
        Ok(())
    }
    
    /// Load project from file
    pub async fn load_project(&self, path: &str) -> Result<ProjectState, String> {
        let content = fs::read_to_string(path)
            .await
            .map_err(|e| format!("Failed to read project file: {}", e))?;
        
        let state = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to deserialize project: {}", e))?;
        
        log::info!("Project loaded from: {}", path);
        Ok(state)
    }
    
    /// Save autosave checkpoint
    pub async fn save_checkpoint(&self, state: &ProjectState) -> Result<(), String> {
        let timestamp = chrono::Utc::now().timestamp();
        let filename = format!("checkpoint_{}.tlsp", timestamp);
        let path = self.autosave_dir.join(filename);
        
        self.save_project(state, path.to_str().unwrap()).await?;
        
        // Clean up old checkpoints (keep last 10)
        self.cleanup_old_checkpoints().await?;
        
        Ok(())
    }
    
    /// Load the latest checkpoint
    pub async fn load_latest(&self) -> Result<ProjectState, String> {
        let mut entries = fs::read_dir(&self.autosave_dir)
            .await
            .map_err(|e| format!("Failed to read autosave dir: {}", e))?;
        
        let mut checkpoints = Vec::new();
        
        while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("tlsp") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    if name.starts_with("checkpoint_") {
                        checkpoints.push(path);
                    }
                }
            }
        }
        
        // Sort by timestamp (newest first)
        checkpoints.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        
        if let Some(latest) = checkpoints.first() {
            self.load_project(latest.to_str().unwrap()).await
        } else {
            Err("No checkpoints found".to_string())
        }
    }
    
    /// Clean up old checkpoint files
    async fn cleanup_old_checkpoints(&self) -> Result<(), String> {
        let mut entries = fs::read_dir(&self.autosave_dir)
            .await
            .map_err(|e| format!("Failed to read autosave dir: {}", e))?;
        
        let mut checkpoints = Vec::new();
        
        while let Some(entry) = entries.next_entry().await.map_err(|e| e.to_string())? {
            let path = entry.path();
            if path.extension().and_then(|s| s.to_str()) == Some("tlsp") {
                if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                    if name.starts_with("checkpoint_") {
                        checkpoints.push(path);
                    }
                }
            }
        }
        
        // Sort by timestamp (newest first)
        checkpoints.sort_by(|a, b| b.file_name().cmp(&a.file_name()));
        
        // Remove all but the last 10
        for path in checkpoints.iter().skip(10) {
            fs::remove_file(path)
                .await
                .map_err(|e| format!("Failed to remove old checkpoint: {}", e))?;
        }
        
        Ok(())
    }
    
    /// Export project in different formats
    pub async fn export_project(
        &self,
        state: &ProjectState,
        path: &str,
        format: ExportFormat,
    ) -> Result<(), String> {
        match format {
            ExportFormat::TimelineStudio => {
                self.save_project(state, path).await
            }
            ExportFormat::FinalCutXML => {
                // TODO: Implement FCPXML export
                Err("FCPXML export not implemented yet".to_string())
            }
            ExportFormat::AAF => {
                // TODO: Implement AAF export
                Err("AAF export not implemented yet".to_string())
            }
            ExportFormat::EDL => {
                // TODO: Implement EDL export
                Err("EDL export not implemented yet".to_string())
            }
        }
    }
}

/// Supported export formats
#[derive(Debug, Clone, Copy)]
pub enum ExportFormat {
    TimelineStudio,
    FinalCutXML,
    AAF,
    EDL,
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_checkpoint_naming() {
        let timestamp = chrono::Utc::now().timestamp();
        let filename = format!("checkpoint_{}.tlsp", timestamp);
        assert!(filename.starts_with("checkpoint_"));
        assert!(filename.ends_with(".tlsp"));
    }
}