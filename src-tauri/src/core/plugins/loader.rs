//! Загрузчик плагинов

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use crate::video_compiler::error::{Result, VideoCompilerError};
use super::plugin::{Plugin, PluginMetadata, PluginValidationResult, PluginDependency, Version};

/// Тип функции-фабрики для создания плагинов
pub type PluginFactory = Box<dyn Fn() -> Box<dyn Plugin> + Send + Sync>;

/// Регистрация плагина
pub struct PluginRegistration {
    pub metadata: PluginMetadata,
    pub factory: PluginFactory,
}

/// Реестр плагинов для статической регистрации
pub struct PluginRegistry {
    registrations: Arc<RwLock<HashMap<String, PluginRegistration>>>,
}

impl PluginRegistry {
    /// Создать новый реестр
    pub fn new() -> Self {
        Self {
            registrations: Arc::new(RwLock::new(HashMap::new())),
        }
    }
    
    /// Зарегистрировать плагин
    pub async fn register(&self, registration: PluginRegistration) -> Result<()> {
        let mut registrations = self.registrations.write().await;
        let plugin_id = registration.metadata.id.clone();
        
        if registrations.contains_key(&plugin_id) {
            return Err(VideoCompilerError::InvalidParameter(
                format!("Plugin '{}' is already registered", plugin_id)
            ));
        }
        
        log::info!("Registered plugin: {} v{}", 
                   registration.metadata.name, 
                   registration.metadata.version);
        
        registrations.insert(plugin_id, registration);
        Ok(())
    }
    
    /// Получить список всех зарегистрированных плагинов
    pub async fn list_plugins(&self) -> Vec<PluginMetadata> {
        let registrations = self.registrations.read().await;
        registrations.values()
            .map(|reg| reg.metadata.clone())
            .collect()
    }
    
    /// Найти регистрацию плагина по ID
    pub async fn find_plugin(&self, plugin_id: &str) -> Option<PluginMetadata> {
        let registrations = self.registrations.read().await;
        registrations.get(plugin_id)
            .map(|reg| reg.metadata.clone())
    }
    
    /// Создать экземпляр плагина
    pub async fn create_plugin(&self, plugin_id: &str) -> Result<Box<dyn Plugin>> {
        let registrations = self.registrations.read().await;
        
        match registrations.get(plugin_id) {
            Some(registration) => {
                let plugin = (registration.factory)();
                Ok(plugin)
            }
            None => Err(VideoCompilerError::InvalidParameter(
                format!("Plugin '{}' not found", plugin_id)
            )),
        }
    }
}

impl Default for PluginRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Загрузчик плагинов
pub struct PluginLoader {
    registry: Arc<PluginRegistry>,
    app_version: Version,
}

impl PluginLoader {
    /// Создать новый загрузчик
    pub fn new(app_version: Version) -> Self {
        Self {
            registry: Arc::new(PluginRegistry::new()),
            app_version,
        }
    }
    
    /// Получить реестр плагинов
    pub fn registry(&self) -> Arc<PluginRegistry> {
        self.registry.clone()
    }
    
    /// Валидировать плагин
    pub async fn validate_plugin(&self, metadata: &PluginMetadata) -> PluginValidationResult {
        let mut result = PluginValidationResult::valid();
        
        // Проверка ID
        if metadata.id.is_empty() {
            result.add_error("Plugin ID cannot be empty".to_string());
        } else if !metadata.id.chars().all(|c| c.is_alphanumeric() || c == '-' || c == '_') {
            result.add_error("Plugin ID can only contain alphanumeric characters, hyphens, and underscores".to_string());
        }
        
        // Проверка имени
        if metadata.name.is_empty() {
            result.add_error("Plugin name cannot be empty".to_string());
        }
        
        // Проверка версии приложения
        if let Some(min_version) = &metadata.min_app_version {
            if !self.is_version_compatible(min_version) {
                result.add_error(format!(
                    "Plugin requires Timeline Studio version {} or higher, current version is {}",
                    min_version, self.app_version
                ));
            }
        }
        
        // Проверка зависимостей
        for dep in &metadata.dependencies {
            if let Err(e) = self.validate_dependency(dep).await {
                result.add_error(format!("Dependency validation failed: {}", e));
            }
        }
        
        // Предупреждения
        if metadata.author.is_empty() {
            result.add_warning("Plugin author is not specified".to_string());
        }
        
        if metadata.description.is_empty() {
            result.add_warning("Plugin description is not specified".to_string());
        }
        
        result
    }
    
    /// Проверить совместимость версий
    fn is_version_compatible(&self, required: &Version) -> bool {
        // Простая проверка: текущая версия должна быть >= требуемой
        if self.app_version.major > required.major {
            return true;
        }
        if self.app_version.major < required.major {
            return false;
        }
        
        if self.app_version.minor > required.minor {
            return true;
        }
        if self.app_version.minor < required.minor {
            return false;
        }
        
        self.app_version.patch >= required.patch
    }
    
    /// Валидировать зависимость
    async fn validate_dependency(&self, dependency: &PluginDependency) -> Result<()> {
        // Проверяем что зависимость существует
        let dep_metadata = self.registry.find_plugin(&dependency.plugin_id).await
            .ok_or_else(|| VideoCompilerError::InvalidParameter(
                format!("Dependency '{}' not found", dependency.plugin_id)
            ))?;
        
        // Проверяем версию
        if let Some(min_version) = &dependency.min_version {
            if !self.is_dependency_version_satisfied(&dep_metadata.version, min_version, true) {
                return Err(VideoCompilerError::InvalidParameter(
                    format!("Dependency '{}' version {} is too old, requires >= {}",
                            dependency.plugin_id, dep_metadata.version, min_version)
                ));
            }
        }
        
        if let Some(max_version) = &dependency.max_version {
            if !self.is_dependency_version_satisfied(&dep_metadata.version, max_version, false) {
                return Err(VideoCompilerError::InvalidParameter(
                    format!("Dependency '{}' version {} is too new, requires <= {}",
                            dependency.plugin_id, dep_metadata.version, max_version)
                ));
            }
        }
        
        Ok(())
    }
    
    /// Проверить удовлетворяет ли версия зависимости требованиям
    fn is_dependency_version_satisfied(&self, actual: &Version, required: &Version, is_min: bool) -> bool {
        match actual.major.cmp(&required.major) {
            std::cmp::Ordering::Greater => is_min,
            std::cmp::Ordering::Less => !is_min,
            std::cmp::Ordering::Equal => {
                match actual.minor.cmp(&required.minor) {
                    std::cmp::Ordering::Greater => is_min,
                    std::cmp::Ordering::Less => !is_min,
                    std::cmp::Ordering::Equal => {
                        if is_min {
                            actual.patch >= required.patch
                        } else {
                            actual.patch <= required.patch
                        }
                    }
                }
            }
        }
    }
    
    /// Загрузить плагин
    pub async fn load_plugin(&self, plugin_id: &str) -> Result<Box<dyn Plugin>> {
        // Получаем метаданные
        let metadata = self.registry.find_plugin(plugin_id).await
            .ok_or_else(|| VideoCompilerError::InvalidParameter(
                format!("Plugin '{}' not found", plugin_id)
            ))?;
        
        // Валидируем
        let validation = self.validate_plugin(&metadata).await;
        if !validation.is_valid {
            return Err(VideoCompilerError::ValidationError(
                format!("Plugin validation failed: {}", validation.errors.join("; "))
            ));
        }
        
        // Создаем экземпляр
        let plugin = self.registry.create_plugin(plugin_id).await?;
        
        log::info!("Loaded plugin: {} v{}", metadata.name, metadata.version);
        
        Ok(plugin)
    }
    
    /// Загрузить все зарегистрированные плагины
    pub async fn load_all_plugins(&self) -> Result<Vec<(String, Box<dyn Plugin>)>> {
        let plugin_ids: Vec<String> = {
            let registrations = self.registry.registrations.read().await;
            registrations.keys().cloned().collect()
        };
        
        let mut loaded_plugins = Vec::new();
        
        for plugin_id in plugin_ids {
            match self.load_plugin(&plugin_id).await {
                Ok(plugin) => {
                    loaded_plugins.push((plugin_id, plugin));
                }
                Err(e) => {
                    log::error!("Failed to load plugin '{}': {}", plugin_id, e);
                }
            }
        }
        
        Ok(loaded_plugins)
    }
}

/// Макрос для упрощения регистрации плагинов
#[macro_export]
macro_rules! register_plugin {
    ($registry:expr, $plugin_type:ty) => {
        {
            let plugin = <$plugin_type>::default();
            let metadata = plugin.metadata().clone();
            let factory: PluginFactory = Box::new(|| {
                Box::new(<$plugin_type>::default())
            });
            
            let registration = PluginRegistration {
                metadata,
                factory,
            };
            
            $registry.register(registration).await
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::plugins::plugin::{PluginMetadata, PluginType};
    
    #[tokio::test]
    async fn test_plugin_registry() {
        let registry = PluginRegistry::new();
        
        let metadata = PluginMetadata {
            id: "test-plugin".to_string(),
            name: "Test Plugin".to_string(),
            version: Version::new(1, 0, 0),
            author: "Test Author".to_string(),
            description: "Test Description".to_string(),
            plugin_type: PluginType::Effect,
            homepage: None,
            license: None,
            dependencies: vec![],
            min_app_version: None,
        };
        
        let factory: PluginFactory = Box::new(|| {
            panic!("This is just a test factory");
        });
        
        let registration = PluginRegistration {
            metadata: metadata.clone(),
            factory,
        };
        
        // Регистрация должна быть успешной
        assert!(registry.register(registration).await.is_ok());
        
        // Повторная регистрация должна вернуть ошибку
        let factory2: PluginFactory = Box::new(|| {
            panic!("This is just a test factory");
        });
        let registration2 = PluginRegistration {
            metadata: metadata.clone(),
            factory: factory2,
        };
        assert!(registry.register(registration2).await.is_err());
        
        // Проверка списка плагинов
        let plugins = registry.list_plugins().await;
        assert_eq!(plugins.len(), 1);
        assert_eq!(plugins[0].id, "test-plugin");
    }
    
    #[tokio::test]
    async fn test_plugin_validation() {
        let loader = PluginLoader::new(Version::new(1, 0, 0));
        
        // Валидный плагин
        let valid_metadata = PluginMetadata {
            id: "valid-plugin".to_string(),
            name: "Valid Plugin".to_string(),
            version: Version::new(1, 0, 0),
            author: "Author".to_string(),
            description: "Description".to_string(),
            plugin_type: PluginType::Effect,
            homepage: None,
            license: None,
            dependencies: vec![],
            min_app_version: None,
        };
        
        let result = loader.validate_plugin(&valid_metadata).await;
        assert!(result.is_valid);
        
        // Невалидный ID
        let invalid_id = PluginMetadata {
            id: "invalid plugin!".to_string(),
            name: "Invalid Plugin".to_string(),
            ..valid_metadata.clone()
        };
        
        let result = loader.validate_plugin(&invalid_id).await;
        assert!(!result.is_valid);
        assert!(!result.errors.is_empty());
    }
    
    #[test]
    fn test_version_compatibility() {
        let loader = PluginLoader::new(Version::new(2, 1, 0));
        
        // Совместимые версии
        assert!(loader.is_version_compatible(&Version::new(1, 0, 0)));
        assert!(loader.is_version_compatible(&Version::new(2, 0, 0)));
        assert!(loader.is_version_compatible(&Version::new(2, 1, 0)));
        
        // Несовместимые версии
        assert!(!loader.is_version_compatible(&Version::new(2, 2, 0)));
        assert!(!loader.is_version_compatible(&Version::new(3, 0, 0)));
    }
}