//! Основные типы и trait для системы плагинов

use async_trait::async_trait;
use serde::{Serialize, Deserialize};
use std::path::PathBuf;
use uuid::Uuid;
use crate::video_compiler::error::Result;
use crate::core::AppEvent;
use super::context::PluginContext;

/// Типы плагинов
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PluginType {
    /// Видео эффекты и фильтры
    Effect,
    /// Переходы между клипами
    Transition,
    /// Генераторы контента (титры, фоны)
    Generator,
    /// Анализаторы медиа
    Analyzer,
    /// Экспортеры в различные форматы
    Exporter,
    /// Интеграции с внешними сервисами
    Service,
    /// Инструменты UI
    Tool,
    /// Универсальный тип
    Universal,
}

/// Версия плагина
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Version {
    pub major: u32,
    pub minor: u32,
    pub patch: u32,
    pub pre_release: Option<String>,
}

impl Version {
    pub fn new(major: u32, minor: u32, patch: u32) -> Self {
        Self {
            major,
            minor,
            patch,
            pre_release: None,
        }
    }
}

impl std::fmt::Display for Version {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}.{}.{}", self.major, self.minor, self.patch)?;
        if let Some(pre) = &self.pre_release {
            write!(f, "-{}", pre)?;
        }
        Ok(())
    }
}

/// Зависимость плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDependency {
    pub plugin_id: String,
    pub min_version: Option<Version>,
    pub max_version: Option<Version>,
}

/// Метаданные плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginMetadata {
    /// Уникальный идентификатор плагина
    pub id: String,
    /// Человекочитаемое имя
    pub name: String,
    /// Версия плагина
    pub version: Version,
    /// Автор плагина
    pub author: String,
    /// Описание
    pub description: String,
    /// Тип плагина
    pub plugin_type: PluginType,
    /// URL домашней страницы
    pub homepage: Option<String>,
    /// Лицензия
    pub license: Option<String>,
    /// Зависимости
    pub dependencies: Vec<PluginDependency>,
    /// Минимальная версия Timeline Studio
    pub min_app_version: Option<Version>,
}

/// Команда для плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginCommand {
    pub id: Uuid,
    pub command: String,
    pub params: serde_json::Value,
}

/// Ответ от плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginResponse {
    pub command_id: Uuid,
    pub success: bool,
    pub data: Option<serde_json::Value>,
    pub error: Option<String>,
}

/// Типы событий на которые может подписаться плагин
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum AppEventType {
    ProjectCreated,
    ProjectOpened,
    ProjectSaved,
    ProjectClosed,
    MediaImported,
    MediaProcessed,
    RenderStarted,
    RenderProgress,
    RenderCompleted,
    RenderFailed,
    TimelineChanged,
    SettingsChanged,
    All, // Подписка на все события
}

/// Состояние плагина
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum PluginState {
    /// Плагин загружен но не инициализирован
    Loaded,
    /// Плагин инициализируется
    Initializing,
    /// Плагин активен и работает
    Active,
    /// Плагин приостановлен
    Suspended,
    /// Плагин останавливается
    Stopping,
    /// Плагин остановлен
    Stopped,
    /// Произошла ошибка
    Error(String),
}

/// Основной trait для плагинов
#[async_trait]
pub trait Plugin: Send + Sync + 'static {
    /// Получить метаданные плагина
    fn metadata(&self) -> &PluginMetadata;
    
    /// Инициализация плагина
    async fn initialize(&mut self, context: PluginContext) -> Result<()>;
    
    /// Остановка плагина
    async fn shutdown(&mut self) -> Result<()>;
    
    /// Обработка команды
    async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse>;
    
    /// Типы событий на которые подписан плагин
    fn subscribed_events(&self) -> Vec<AppEventType> {
        vec![]
    }
    
    /// Обработка события
    async fn handle_event(&self, event: &AppEvent) -> Result<()> {
        // По умолчанию игнорируем события
        let _ = event;
        Ok(())
    }
    
    /// Получить текущее состояние плагина
    fn state(&self) -> PluginState {
        PluginState::Active
    }
    
    /// Приостановить работу плагина
    async fn suspend(&mut self) -> Result<()> {
        Ok(())
    }
    
    /// Возобновить работу плагина
    async fn resume(&mut self) -> Result<()> {
        Ok(())
    }
}

/// Результат валидации плагина
#[derive(Debug)]
pub struct PluginValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

impl PluginValidationResult {
    pub fn valid() -> Self {
        Self {
            is_valid: true,
            errors: vec![],
            warnings: vec![],
        }
    }
    
    pub fn invalid(error: String) -> Self {
        Self {
            is_valid: false,
            errors: vec![error],
            warnings: vec![],
        }
    }
    
    pub fn add_error(&mut self, error: String) {
        self.errors.push(error);
        self.is_valid = false;
    }
    
    pub fn add_warning(&mut self, warning: String) {
        self.warnings.push(warning);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_version_display() {
        let version = Version::new(1, 2, 3);
        assert_eq!(version.to_string(), "1.2.3");
        
        let version_pre = Version {
            major: 2,
            minor: 0,
            patch: 0,
            pre_release: Some("beta.1".to_string()),
        };
        assert_eq!(version_pre.to_string(), "2.0.0-beta.1");
    }
    
    #[test]
    fn test_plugin_validation_result() {
        let mut result = PluginValidationResult::valid();
        assert!(result.is_valid);
        
        result.add_warning("This is a warning".to_string());
        assert!(result.is_valid);
        
        result.add_error("This is an error".to_string());
        assert!(!result.is_valid);
    }
}