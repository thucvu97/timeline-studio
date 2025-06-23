//! API Validator Service - пример интеграции с DI Container
//! 
//! Этот модуль демонстрирует как использовать DI Container для сервисов

use crate::core::{Service, EventBus, AppEvent};
use crate::video_compiler::error::Result;
use crate::security::api_validator::{ApiValidator, ServiceType};
use std::sync::Arc;
use tokio::sync::RwLock;

/// Сервис валидации API ключей с поддержкой DI
pub struct ApiValidatorService {
    validator: Arc<RwLock<ApiValidator>>,
    event_bus: Option<Arc<EventBus>>,
    initialized: bool,
}

impl ApiValidatorService {
    /// Создать новый экземпляр сервиса
    pub fn new() -> Self {
        Self {
            validator: Arc::new(RwLock::new(ApiValidator::new())),
            event_bus: None,
            initialized: false,
        }
    }
    
    /// Установить EventBus для публикации событий
    pub fn with_event_bus(mut self, event_bus: Arc<EventBus>) -> Self {
        self.event_bus = Some(event_bus);
        self
    }
    
    /// Валидировать API ключ
    pub async fn validate_key(&self, service: ServiceType, api_key: &str) -> Result<bool> {
        let validator = self.validator.read().await;
        let result = validator.validate_api_key(service, api_key).await;
        
        // Публикуем событие о валидации
        if let Some(event_bus) = &self.event_bus {
            let event = match &result {
                Ok(true) => AppEvent::ConfigChanged {
                    key: format!("api_key_valid_{:?}", service),
                    value: serde_json::json!(true),
                },
                Ok(false) => AppEvent::ConfigChanged {
                    key: format!("api_key_invalid_{:?}", service),
                    value: serde_json::json!(false),
                },
                Err(e) => AppEvent::ConfigChanged {
                    key: format!("api_key_error_{:?}", service),
                    value: serde_json::json!(e.to_string()),
                },
            };
            
            let _ = event_bus.publish_app_event(event).await;
        }
        
        result
    }
    
    /// Проверить доступность сервиса
    pub async fn check_service_availability(&self, service: ServiceType) -> Result<bool> {
        let validator = self.validator.read().await;
        match service {
            ServiceType::OpenAI => Ok(validator.check_openai_service().await.is_ok()),
            ServiceType::Claude => Ok(validator.check_claude_service().await.is_ok()),
            _ => Ok(true), // Для остальных сервисов предполагаем доступность
        }
    }
}

#[async_trait::async_trait]
impl Service for ApiValidatorService {
    async fn initialize(&mut self) -> Result<()> {
        if self.initialized {
            return Ok(());
        }
        
        log::info!("Initializing API Validator Service");
        
        // Здесь можно выполнить дополнительную инициализацию
        // Например, загрузить конфигурацию или проверить доступность сервисов
        
        self.initialized = true;
        
        // Публикуем событие об инициализации
        if let Some(event_bus) = &self.event_bus {
            let _ = event_bus.publish_app_event(AppEvent::SystemStartup).await;
        }
        
        Ok(())
    }
    
    async fn shutdown(&mut self) -> Result<()> {
        log::info!("Shutting down API Validator Service");
        
        // Очистка ресурсов если необходимо
        
        self.initialized = false;
        Ok(())
    }
    
    fn name(&self) -> &'static str {
        "ApiValidatorService"
    }
}

impl Default for ApiValidatorService {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_service_lifecycle() {
        let mut service = ApiValidatorService::new();
        
        // Тест инициализации
        assert!(service.initialize().await.is_ok());
        assert!(service.initialized);
        
        // Повторная инициализация не должна вызывать ошибку
        assert!(service.initialize().await.is_ok());
        
        // Тест остановки
        assert!(service.shutdown().await.is_ok());
        assert!(!service.initialized);
    }
    
    #[tokio::test]
    async fn test_with_event_bus() {
        let event_bus = Arc::new(EventBus::new());
        let service = ApiValidatorService::new()
            .with_event_bus(event_bus.clone());
        
        assert!(service.event_bus.is_some());
    }
}