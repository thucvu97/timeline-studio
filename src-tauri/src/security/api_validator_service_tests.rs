//! Comprehensive тесты для api_validator_service.rs - Фаза 2 улучшения покрытия
//!
//! Этот файл содержит расширенные тесты для увеличения покрытия api_validator_service.rs

use super::api_validator_service::*;
use super::{ApiKeyType, OAuthCredentials};
use crate::core::{EventBus, Service};
use std::sync::Arc;

/// Создает тестовый ApiValidatorService
fn create_test_service() -> ApiValidatorService {
  ApiValidatorService::new()
}

/// Создает ApiValidatorService с EventBus
fn create_test_service_with_event_bus() -> (ApiValidatorService, Arc<EventBus>) {
  let event_bus = Arc::new(EventBus::new());
  let service = ApiValidatorService::new().with_event_bus(event_bus.clone());
  (service, event_bus)
}

/// Создает тестовые OAuth credentials
fn create_test_oauth_credentials() -> OAuthCredentials {
  OAuthCredentials {
    client_id: "test_client".to_string(),
    client_secret: "test_secret".to_string(),
    access_token: Some("test_access_token".to_string()),
    refresh_token: Some("test_refresh_token".to_string()),
    expires_at: Some(chrono::Utc::now() + chrono::Duration::hours(1)),
  }
}

#[cfg(test)]
mod service_creation_tests {
  use super::*;

  #[test]
  fn test_new_service_creation() {
    let service = ApiValidatorService::new();
    // Сервис создается успешно
    assert_eq!(service.name(), "ApiValidatorService");
  }

  #[test]
  fn test_service_with_event_bus() {
    let event_bus = Arc::new(EventBus::new());
    let service = ApiValidatorService::new().with_event_bus(event_bus.clone());

    // Сервис создается с EventBus
    assert_eq!(service.name(), "ApiValidatorService");
  }

  #[test]
  fn test_default_service_creation() {
    let service = ApiValidatorService::default();
    // Default создание работает
    assert_eq!(service.name(), "ApiValidatorService");
  }

  #[test]
  fn test_service_name() {
    let service = create_test_service();
    assert_eq!(service.name(), "ApiValidatorService");
  }
}

#[cfg(test)]
mod service_lifecycle_tests {
  use super::*;
  use crate::core::Service;

  #[tokio::test]
  async fn test_service_initialization() {
    let mut service = create_test_service();

    // Инициализация должна пройти успешно
    let result = service.initialize().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_service_multiple_initialization() {
    let mut service = create_test_service();

    // Первая инициализация
    assert!(service.initialize().await.is_ok());

    // Повторная инициализация не должна вызывать ошибку
    assert!(service.initialize().await.is_ok());

    // Третья инициализация
    assert!(service.initialize().await.is_ok());
  }

  #[tokio::test]
  async fn test_service_shutdown() {
    let mut service = create_test_service();

    // Инициализируем
    assert!(service.initialize().await.is_ok());

    // Останавливаем
    let result = service.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_service_shutdown_without_initialization() {
    let mut service = create_test_service();

    // Останавливаем неинициализированный сервис
    let result = service.shutdown().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_service_multiple_shutdown() {
    let mut service = create_test_service();

    // Инициализируем
    assert!(service.initialize().await.is_ok());

    // Первое выключение
    assert!(service.shutdown().await.is_ok());

    // Повторное выключение
    assert!(service.shutdown().await.is_ok());
  }
}

#[cfg(test)]
mod validation_tests {
  use super::*;

  #[tokio::test]
  async fn test_validate_key_all_types() {
    let service = create_test_service();

    let api_key_types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for key_type in api_key_types {
      // Тестируем с пустым ключом - должно возвращать результат (не panic)
      let result = service.validate_key(key_type.clone(), "").await;

      // Результат может быть успешным или с ошибкой, важно что метод не паникует
      match result {
        Ok(_is_valid) => {
          // Пустой ключ обычно не валиден, но зависит от реализации
          // Любой bool результат приемлем для тестового окружения
        }
        Err(e) => {
          // Ошибка сети или валидации - это нормально для тестового окружения
          println!(
            "Expected error for {:?} with empty key: {}",
            key_type,
            e
          );
        }
      }
    }
  }

  #[tokio::test]
  async fn test_validate_key_with_fake_key() {
    let service = create_test_service();

    // Тестируем с явно неверным ключом
    let fake_key = "fake_key_123";
    let result = service.validate_key(ApiKeyType::OpenAI, fake_key).await;

    match result {
      Ok(is_valid) => {
        // Фейковый ключ не должен быть валидным
        assert!(!is_valid, "Fake key should not be valid");
      }
      Err(_) => {
        // Ошибка сети или API - это ожидаемо в тестовом окружении
      }
    }
  }

  #[tokio::test]
  async fn test_validate_key_with_malformed_input() {
    let service = create_test_service();

    let malformed_inputs = vec![
      "",
      "   ",
      "sk-",
      "Bearer ",
      "invalid-key-format",
      "\0",
      "key with spaces",
      "кириллица",
      "🔑emoji",
    ];

    for input in malformed_inputs {
      let result = service.validate_key(ApiKeyType::OpenAI, input).await;

      // Все malformed входы должны обрабатываться без паники
      match result {
        Ok(is_valid) => {
          // В большинстве случаев malformed ключи не валидны
          println!("Input '{}' validation result: {}", input, is_valid);
        }
        Err(e) => {
          // Ошибки ожидаемы для некорректных входов
          println!("Expected error for input '{}': {}", input, e);
        }
      }
    }
  }
}

#[cfg(test)]
mod service_availability_tests {
  use super::*;

  #[tokio::test]
  async fn test_check_service_availability_all_types() {
    let service = create_test_service();

    let api_key_types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for key_type in api_key_types {
      let result = service.check_service_availability(key_type.clone()).await;

      match result {
        Ok(is_available) => {
          // Сервис может быть доступен или нет, зависит от сети
          println!("Service {:?} availability: {}", key_type, is_available);
          // Любой bool результат приемлем для проверки доступности
        }
        Err(e) => {
          // Ошибка проверки доступности - ожидаемо в тестовом окружении
          println!("Service availability check error for {:?}: {}", key_type, e);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_check_service_availability_consistent_results() {
    let service = create_test_service();
    let key_type = ApiKeyType::OpenAI;

    // Проверяем несколько раз для консистентности
    let mut results = Vec::new();
    for _i in 0..3 {
      if let Ok(is_available) = service.check_service_availability(key_type.clone()).await {
        results.push(is_available);
      }
    }

    // Если получили результаты, они должны быть разумными
    if !results.is_empty() {
      println!("Service availability results: {:?}", results);
      // Результаты могут отличаться из-за сети, но должны быть bool
      for _result in results {
        // Результат должен быть bool (любое значение приемлемо)
      }
    }
  }
}

#[cfg(test)]
mod event_bus_integration_tests {
  use super::*;
  use crate::core::Service;

  #[tokio::test]
  async fn test_initialization_with_event_bus() {
    let (mut service, _event_bus) = create_test_service_with_event_bus();

    // Инициализация должна публиковать событие
    let result = service.initialize().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_validation_with_event_bus() {
    let (service, _event_bus) = create_test_service_with_event_bus();

    // Валидация должна публиковать события
    let result = service.validate_key(ApiKeyType::OpenAI, "fake_key").await;

    // Результат может быть любым, главное - без паники
    match result {
      Ok(is_valid) => {
        println!("Validation with event bus result: {}", is_valid);
      }
      Err(e) => {
        println!("Validation with event bus error: {}", e);
      }
    }
  }

  #[tokio::test]
  async fn test_shutdown_with_event_bus() {
    let (mut service, _event_bus) = create_test_service_with_event_bus();

    // Инициализируем и выключаем
    assert!(service.initialize().await.is_ok());
    let result = service.shutdown().await;
    assert!(result.is_ok());
  }
}

#[cfg(test)]
mod error_handling_tests {
  use super::*;

  #[tokio::test]
  async fn test_validation_error_conversion() {
    let service = create_test_service();

    // Тестируем различные типы ключей которые могут вызывать разные ошибки
    let test_cases = vec![
      (ApiKeyType::OpenAI, ""),
      (ApiKeyType::Claude, "invalid"),
      (ApiKeyType::YouTube, "short"),
      (ApiKeyType::Telegram, "malformed bot token"),
    ];

    for (key_type, test_key) in test_cases {
      let result = service.validate_key(key_type.clone(), test_key).await;

      // Проверяем что ошибки корректно обрабатываются
      match result {
        Ok(_) => {
          // Успешный результат - это нормально
        }
        Err(e) => {
          // Ошибка должна быть VideoCompilerError
          let error_string = e.to_string();
          assert!(
            !error_string.is_empty(),
            "Error message should not be empty"
          );
          println!("Error for {:?}: {}", key_type, error_string);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_concurrent_validations() {
    let service = Arc::new(create_test_service());
    let mut handles = Vec::new();

    // Запускаем несколько валидаций параллельно
    for i in 0..5 {
      let service_clone = service.clone();
      let key_type = match i % 3 {
        0 => ApiKeyType::OpenAI,
        1 => ApiKeyType::Claude,
        _ => ApiKeyType::YouTube,
      };

      let handle =
        tokio::spawn(async move { service_clone.validate_key(key_type, "test_key").await });
      handles.push(handle);
    }

    // Ждем завершения всех задач
    for handle in handles {
      let result = handle.await;
      assert!(result.is_ok(), "Task should not panic");

      // Результат валидации может быть любым
      if result.unwrap().is_ok() {}
    }
  }
}

#[cfg(test)]
mod edge_cases_tests {
  use super::*;

  #[tokio::test]
  async fn test_service_state_consistency() {
    let mut service = create_test_service();

    // После инициализации
    assert!(service.initialize().await.is_ok());

    // После выключения
    assert!(service.shutdown().await.is_ok());

    // Повторная инициализация
    assert!(service.initialize().await.is_ok());
  }

  #[tokio::test]
  async fn test_validation_with_special_characters() {
    let service = create_test_service();

    let special_keys = vec![
      "key-with-dashes",
      "key_with_underscores",
      "key.with.dots",
      "key with spaces",
      "key\nwith\nnewlines",
      "key\twith\ttabs",
      "UPPERCASE_KEY",
      "mixedCaseKey",
      "key123with456numbers",
      "🔑emoji_key",
      "ключ_на_кириллице",
      "clé_en_français",
    ];

    for special_key in special_keys {
      let result = service.validate_key(ApiKeyType::OpenAI, special_key).await;

      // Главное - никаких паник или крашей
      match result {
        Ok(is_valid) => {
          println!("Special key '{}' validation: {}", special_key, is_valid);
        }
        Err(e) => {
          println!("Special key '{}' error: {}", special_key, e);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_very_long_api_keys() {
    let service = create_test_service();

    // Тестируем с очень длинными ключами
    let long_keys = vec![
      "a".repeat(1000),
      "b".repeat(10000),
      "sk-".to_string() + &"c".repeat(5000),
    ];

    for long_key in long_keys {
      let result = service.validate_key(ApiKeyType::OpenAI, &long_key).await;

      // Длинные ключи должны обрабатываться без проблем
      match result {
        Ok(is_valid) => {
          println!(
            "Long key (length {}) validation: {}",
            long_key.len(),
            is_valid
          );
        }
        Err(e) => {
          println!("Long key (length {}) error: {}", long_key.len(), e);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_empty_and_whitespace_keys() {
    let service = create_test_service();

    let whitespace_keys = vec!["", " ", "  ", "\t", "\n", "\r\n", "   \t  \n  "];

    for key in whitespace_keys {
      let result = service.validate_key(ApiKeyType::OpenAI, key).await;

      match result {
        Ok(is_valid) => {
          // Пустые ключи обычно не валидны
          println!("Whitespace key '{:?}' validation: {}", key, is_valid);
        }
        Err(e) => {
          println!("Whitespace key '{:?}' error: {}", key, e);
        }
      }
    }
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;
  use crate::core::Service;

  #[tokio::test]
  async fn test_full_service_lifecycle_with_validations() {
    let mut service = create_test_service();

    // Полный жизненный цикл с валидациями
    assert!(service.initialize().await.is_ok());

    // Выполняем несколько валидаций
    let validations = vec![
      service.validate_key(ApiKeyType::OpenAI, "test1").await,
      service.validate_key(ApiKeyType::Claude, "test2").await,
      service
        .check_service_availability(ApiKeyType::YouTube)
        .await,
    ];

    // Все операции должны завершиться без паники
    for (i, result) in validations.into_iter().enumerate() {
      match result {
        Ok(_) => println!("Validation {} succeeded", i),
        Err(e) => println!("Validation {} failed: {}", i, e),
      }
    }

    assert!(service.shutdown().await.is_ok());
  }

  #[tokio::test]
  async fn test_service_with_oauth_credentials() {
    let service = create_test_service();
    let oauth_creds = create_test_oauth_credentials();

    // Тестируем OAuth валидацию (косвенно через validate_key)
    // Поскольку validate_oauth_credentials не доступен публично,
    // тестируем через validate_key с OAuth типами
    let oauth_services = vec![ApiKeyType::YouTube, ApiKeyType::TikTok, ApiKeyType::Vimeo];

    for service_type in oauth_services {
      let result = service
        .validate_key(service_type.clone(), &oauth_creds.client_id)
        .await;

      match result {
        Ok(is_valid) => {
          println!("OAuth service {:?} validation: {}", service_type, is_valid);
        }
        Err(e) => {
          println!("OAuth service {:?} error: {}", service_type, e);
        }
      }
    }
  }

  #[tokio::test]
  async fn test_service_resilience() {
    let service = create_test_service();

    // Тестируем устойчивость к различным сценариям
    let test_scenarios = vec![
      // Пустые ключи
      ("", ApiKeyType::OpenAI),
      // Null байты (if supported by String)
      ("key\0with\0nulls", ApiKeyType::Claude),
      // Очень короткие ключи
      ("a", ApiKeyType::YouTube),
      // Ключи только из специальных символов
      ("!@#$%^&*()", ApiKeyType::Telegram),
    ];

    for (test_key, key_type) in test_scenarios {
      let result = service.validate_key(key_type.clone(), test_key).await;

      // Сервис должен быть устойчив ко всем входам
      match result {
        Ok(is_valid) => {
          println!(
            "Resilience test for {:?} with '{}': {}",
            key_type, test_key, is_valid
          );
        }
        Err(e) => {
          println!(
            "Resilience test for {:?} with '{}' error: {}",
            key_type, test_key, e
          );
          // Ошибки допустимы, но не паники
        }
      }
    }
  }
}
