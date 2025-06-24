//! Простой пример плагина для применения эффекта размытия

use crate::core::plugins::{
    context::PluginContext,
    plugin::{
        AppEventType, Plugin, PluginCommand, PluginMetadata,
        PluginResponse, PluginType, Version,
    },
};
use crate::core::AppEvent;
use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::json;

/// Параметры эффекта размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
struct BlurParameters {
    /// Интенсивность размытия (0-100)
    intensity: f32,
    /// Тип размытия
    blur_type: BlurType,
    /// Применить к краям
    edge_blur: bool,
}

/// Тип размытия
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum BlurType {
    Gaussian,
    Motion,
    Box,
    Median,
}

/// Простой плагин эффекта размытия
pub struct BlurEffectPlugin {
    context: Option<PluginContext>,
}

impl Default for BlurEffectPlugin {
    fn default() -> Self {
        Self {
            context: None,
        }
    }
}

#[async_trait]
impl Plugin for BlurEffectPlugin {
    fn metadata(&self) -> &PluginMetadata {
        static METADATA: std::sync::OnceLock<PluginMetadata> = std::sync::OnceLock::new();
        METADATA.get_or_init(|| PluginMetadata {
            id: "blur-effect".to_string(),
            name: "Blur Effect Plugin".to_string(),
            version: Version::new(1, 0, 0),
            author: "Timeline Studio Team".to_string(),
            description: "Apply various blur effects to video clips".to_string(),
            plugin_type: PluginType::Effect,
            homepage: Some("https://timeline.studio/plugins/blur-effect".to_string()),
            license: Some("MIT".to_string()),
            dependencies: vec![],
            min_app_version: Some(Version::new(1, 0, 0)),
        })
    }

    async fn initialize(&mut self, context: PluginContext) -> Result<()> {
        log::info!("Initializing Blur Effect Plugin");
        self.context = Some(context);
        Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
        log::info!("Shutting down Blur Effect Plugin");
        
        // Очищаем временные файлы
        if let Some(context) = &self.context {
            context.cleanup_temp_files().await.ok();
        }
        
        self.context = None;
        Ok(())
    }

    async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
        match command.command.as_str() {
            "apply_blur" => {
                // Парсим параметры
                let clip_id = command
                    .params
                    .get("clip_id")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| {
                        VideoCompilerError::InvalidParameter("Missing clip_id".to_string())
                    })?;

                let params = if let Some(params_value) = command.params.get("parameters") {
                    serde_json::from_value::<BlurParameters>(params_value.clone())
                        .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?
                } else {
                    // Используем параметры по умолчанию
                    BlurParameters {
                        intensity: 50.0,
                        blur_type: BlurType::Gaussian,
                        edge_blur: false,
                    }
                };

                // В реальном плагине здесь бы применялся эффект через API
                log::info!(
                    "Applying blur effect to clip {} with intensity {}",
                    clip_id,
                    params.intensity
                );

                Ok(PluginResponse {
                    command_id: command.id,
                    success: true,
                    data: Some(json!({
                        "message": "Blur effect applied successfully",
                        "clip_id": clip_id,
                        "parameters": params
                    })),
                    error: None,
                })
            }
            "get_presets" => {
                // Возвращаем доступные пресеты
                let presets = vec![
                    json!({
                        "name": "Subtle Blur",
                        "params": {
                            "intensity": 20.0,
                            "blur_type": "gaussian",
                            "edge_blur": false
                        }
                    }),
                    json!({
                        "name": "Heavy Blur",
                        "params": {
                            "intensity": 80.0,
                            "blur_type": "gaussian",
                            "edge_blur": true
                        }
                    }),
                    json!({
                        "name": "Motion Blur",
                        "params": {
                            "intensity": 50.0,
                            "blur_type": "motion",
                            "edge_blur": false
                        }
                    }),
                ];

                Ok(PluginResponse {
                    command_id: command.id,
                    success: true,
                    data: Some(json!({ "presets": presets })),
                    error: None,
                })
            }
            _ => Err(VideoCompilerError::InvalidParameter(format!(
                "Unknown command: {}",
                command.command
            ))),
        }
    }

    fn subscribed_events(&self) -> Vec<AppEventType> {
        vec![
            AppEventType::ProjectOpened,
            AppEventType::MediaImported,
        ]
    }

    async fn handle_event(&self, event: &AppEvent) -> Result<()> {
        match event {
            AppEvent::ProjectOpened { .. } => {
                log::info!("Blur Effect Plugin: Project opened");
            }
            AppEvent::MediaImported { .. } => {
                log::info!("Blur Effect Plugin: Media imported");
            }
            _ => {}
        }
        Ok(())
    }

    async fn suspend(&mut self) -> Result<()> {
        log::info!("Suspending Blur Effect Plugin");
        Ok(())
    }

    async fn resume(&mut self) -> Result<()> {
        log::info!("Resuming Blur Effect Plugin");
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_blur_parameters_serialization() {
        let params = BlurParameters {
            intensity: 50.0,
            blur_type: BlurType::Gaussian,
            edge_blur: true,
        };

        let json = serde_json::to_string(&params).unwrap();
        let deserialized: BlurParameters = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.intensity, params.intensity);
        assert!(deserialized.edge_blur);
    }
}