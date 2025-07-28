/**
 * Updates module for Timeline Studio
 * Handles application updates using tauri-plugin-updater
 */
use serde::{Deserialize, Serialize};
use specta::Type;
use tauri_plugin_updater::UpdaterExt;

/// Information about an available update
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UpdateInfo {
  pub version: String,
  pub notes: Option<String>,
  pub pub_date: Option<String>,
  pub signature: String,
  pub url: String,
}

/// Update check result
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UpdateCheckResult {
  pub available: bool,
  pub current_version: String,
  pub update_info: Option<UpdateInfo>,
}

/// Update download progress
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct UpdateProgress {
  pub chunk_length: u64,
  pub content_length: Option<u64>,
  pub downloaded: u64,
}

/// Update status
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub enum UpdateStatus {
  Idle,
  Checking,
  Available,
  Downloading,
  Downloaded,
  Installing,
  Installed,
  Error(String),
}

/// Check for available updates
#[tauri::command]
#[specta::specta]
pub async fn check_for_update<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
) -> Result<UpdateCheckResult, String> {
  log::info!("Checking for updates...");

  let current_version = app.package_info().version.to_string();

  match app.updater() {
    Ok(updater) => match updater.check().await {
      Ok(Some(update)) => {
        log::info!("Update available: {}", update.version);

        Ok(UpdateCheckResult {
          available: true,
          current_version,
          update_info: Some(UpdateInfo {
            version: update.version,
            notes: update.body,
            pub_date: update.date.map(|d| d.to_string()),
            signature: update.signature,
            url: update.download_url.to_string(),
          }),
        })
      }
      Ok(None) => {
        log::info!("No updates available");
        Ok(UpdateCheckResult {
          available: false,
          current_version,
          update_info: None,
        })
      }
      Err(e) => {
        log::error!("Failed to check for updates: {}", e);
        Err(format!("Failed to check for updates: {}", e))
      }
    },
    Err(e) => {
      log::warn!("Updater not available: {}", e);
      Err(format!("Updater not available: {}", e))
    }
  }
}

/// Download and install update
#[tauri::command]
#[specta::specta]
pub async fn download_and_install_update<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
) -> Result<(), String> {
  log::info!("Starting update download and installation...");

  match app.updater() {
    Ok(updater) => {
      match updater.check().await {
        Ok(Some(update)) => {
          log::info!("Downloading update: {}", update.version);

          // Download and install
          match update
            .download_and_install(
              |chunk_length, content_length| {
                log::debug!("Download progress: {}/{:?}", chunk_length, content_length);
              },
              || {
                log::info!("Download completed, installing...");
              },
            )
            .await
          {
            Ok(_) => {
              log::info!("Update installed successfully");
              Ok(())
            }
            Err(e) => {
              log::error!("Failed to download/install update: {}", e);
              Err(format!("Failed to download/install update: {}", e))
            }
          }
        }
        Ok(None) => {
          log::info!("No updates available for download");
          Err("No updates available".to_string())
        }
        Err(e) => {
          log::error!("Failed to check for updates during download: {}", e);
          Err(format!("Failed to check for updates: {}", e))
        }
      }
    }
    Err(e) => {
      log::warn!("Updater not available for download: {}", e);
      Err(format!("Updater not available: {}", e))
    }
  }
}

/// Get current application version
#[tauri::command]
#[specta::specta]
pub fn get_current_version<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> String {
  app.package_info().version.to_string()
}

/// Check if updater is available
#[tauri::command]
#[specta::specta]
pub fn is_updater_available<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> bool {
  app.updater().is_ok()
}
