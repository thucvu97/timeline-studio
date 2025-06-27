//! Comprehensive тесты для secure_storage.rs - Фаза 2 улучшения покрытия
//!
//! Этот файл содержит расширенные тесты для увеличения покрытия secure_storage.rs

use super::secure_storage::*;
use std::str::FromStr;

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

/// Создает тестовые ApiKeyData
fn create_test_api_key_data(key_type: ApiKeyType) -> ApiKeyData {
  ApiKeyData {
    key_type,
    value: "test_api_key_value".to_string(),
    oauth_data: None,
    created_at: chrono::Utc::now(),
    last_validated: None,
    is_valid: None,
  }
}

/// Создает ApiKeyData с OAuth данными
fn create_api_key_data_with_oauth(key_type: ApiKeyType) -> ApiKeyData {
  ApiKeyData {
    key_type,
    value: "test_api_key_value".to_string(),
    oauth_data: Some(create_test_oauth_credentials()),
    created_at: chrono::Utc::now(),
    last_validated: Some(chrono::Utc::now()),
    is_valid: Some(true),
  }
}

#[cfg(test)]
mod api_key_type_tests {
  use super::*;

  #[test]
  fn test_api_key_type_as_str() {
    let test_cases = vec![
      (ApiKeyType::OpenAI, "openai"),
      (ApiKeyType::Claude, "claude"),
      (ApiKeyType::DeepSeek, "deepseek"),
      (ApiKeyType::YouTube, "youtube"),
      (ApiKeyType::TikTok, "tiktok"),
      (ApiKeyType::Vimeo, "vimeo"),
      (ApiKeyType::Telegram, "telegram"),
      (ApiKeyType::Codecov, "codecov"),
      (ApiKeyType::TauriAnalytics, "tauri_analytics"),
    ];

    for (key_type, expected_str) in test_cases {
      assert_eq!(key_type.as_str(), expected_str);
    }
  }

  #[test]
  fn test_api_key_type_from_str() {
    let test_cases = vec![
      ("openai", Ok(ApiKeyType::OpenAI)),
      ("claude", Ok(ApiKeyType::Claude)),
      ("deepseek", Ok(ApiKeyType::DeepSeek)),
      ("youtube", Ok(ApiKeyType::YouTube)),
      ("tiktok", Ok(ApiKeyType::TikTok)),
      ("vimeo", Ok(ApiKeyType::Vimeo)),
      ("telegram", Ok(ApiKeyType::Telegram)),
      ("codecov", Ok(ApiKeyType::Codecov)),
      ("tauri_analytics", Ok(ApiKeyType::TauriAnalytics)),
    ];

    for (input_str, expected_result) in test_cases {
      let result = ApiKeyType::from_str(input_str);
      assert_eq!(result, expected_result);
    }
  }

  #[test]
  fn test_api_key_type_from_str_invalid() {
    let invalid_inputs = vec![
      "invalid",
      "unknown",
      "",
      "OPENAI",
      "open_ai",
      "youtube_api",
      " youtube ",
      "null",
    ];

    for invalid_input in invalid_inputs {
      let result = ApiKeyType::from_str(invalid_input);
      assert!(result.is_err());

      let error_msg = result.unwrap_err();
      assert!(error_msg.contains("Unknown API key type"));
      assert!(error_msg.contains(invalid_input));
    }
  }

  #[test]
  fn test_api_key_type_roundtrip() {
    let all_types = vec![
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

    for key_type in all_types {
      let str_repr = key_type.as_str();
      let parsed_back = ApiKeyType::from_str(str_repr).unwrap();
      assert_eq!(key_type, parsed_back);
    }
  }

  #[test]
  fn test_api_key_type_hash_and_eq() {
    use std::collections::HashMap;

    let mut map = HashMap::new();
    map.insert(ApiKeyType::OpenAI, "openai_value");
    map.insert(ApiKeyType::Claude, "claude_value");

    assert_eq!(map.get(&ApiKeyType::OpenAI), Some(&"openai_value"));
    assert_eq!(map.get(&ApiKeyType::Claude), Some(&"claude_value"));
    assert_eq!(map.get(&ApiKeyType::DeepSeek), None);
  }

  #[test]
  fn test_api_key_type_serialization() {
    let key_type = ApiKeyType::YouTube;

    // Тестируем сериализацию
    let serialized = serde_json::to_string(&key_type);
    assert!(serialized.is_ok());

    let json_str = serialized.unwrap();
    assert!(json_str.contains("YouTube"));

    // Тестируем десериализацию
    let deserialized: Result<ApiKeyType, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok());
    assert_eq!(deserialized.unwrap(), ApiKeyType::YouTube);
  }
}

#[cfg(test)]
mod oauth_credentials_tests {
  use super::*;

  #[test]
  fn test_oauth_credentials_creation() {
    let creds = create_test_oauth_credentials();

    assert_eq!(creds.client_id, "test_client");
    assert_eq!(creds.client_secret, "test_secret");
    assert_eq!(creds.access_token, Some("test_access_token".to_string()));
    assert_eq!(creds.refresh_token, Some("test_refresh_token".to_string()));
    assert!(creds.expires_at.is_some());
    assert!(creds.expires_at.unwrap() > chrono::Utc::now());
  }

  #[test]
  fn test_oauth_credentials_without_tokens() {
    let creds = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: None,
      refresh_token: None,
      expires_at: None,
    };

    assert_eq!(creds.client_id, "test_client");
    assert_eq!(creds.client_secret, "test_secret");
    assert!(creds.access_token.is_none());
    assert!(creds.refresh_token.is_none());
    assert!(creds.expires_at.is_none());
  }

  #[test]
  fn test_oauth_credentials_serialization() {
    let creds = create_test_oauth_credentials();

    let serialized = serde_json::to_string(&creds);
    assert!(serialized.is_ok());

    let json_str = serialized.unwrap();
    assert!(json_str.contains("\"client_id\":\"test_client\""));
    assert!(json_str.contains("\"client_secret\":\"test_secret\""));

    // Десериализация
    let deserialized: Result<OAuthCredentials, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok());

    let deserialized_creds = deserialized.unwrap();
    assert_eq!(deserialized_creds.client_id, creds.client_id);
    assert_eq!(deserialized_creds.client_secret, creds.client_secret);
  }

  #[test]
  fn test_oauth_credentials_clone() {
    let creds = create_test_oauth_credentials();
    let cloned = creds.clone();

    assert_eq!(creds.client_id, cloned.client_id);
    assert_eq!(creds.client_secret, cloned.client_secret);
    assert_eq!(creds.access_token, cloned.access_token);
    assert_eq!(creds.refresh_token, cloned.refresh_token);
    assert_eq!(creds.expires_at, cloned.expires_at);
  }

  #[test]
  fn test_oauth_credentials_with_special_characters() {
    let creds = OAuthCredentials {
      client_id: "client_with_special_chars_!@#$%".to_string(),
      client_secret: "secret_with_unicode_🔑".to_string(),
      access_token: Some("token_with_newline\nand_tab\t".to_string()),
      refresh_token: Some("refresh_кириллица".to_string()),
      expires_at: Some(chrono::Utc::now()),
    };

    // Сериализация должна работать с специальными символами
    let serialized = serde_json::to_string(&creds);
    assert!(serialized.is_ok());

    let deserialized: Result<OAuthCredentials, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());
  }
}

#[cfg(test)]
mod api_key_data_tests {
  use super::*;

  #[test]
  fn test_api_key_data_creation() {
    let key_data = create_test_api_key_data(ApiKeyType::OpenAI);

    assert_eq!(key_data.key_type, ApiKeyType::OpenAI);
    assert_eq!(key_data.value, "test_api_key_value");
    assert!(key_data.oauth_data.is_none());
    assert!(key_data.last_validated.is_none());
    assert!(key_data.is_valid.is_none());
    assert!(key_data.created_at <= chrono::Utc::now());
  }

  #[test]
  fn test_api_key_data_with_oauth() {
    let key_data = create_api_key_data_with_oauth(ApiKeyType::YouTube);

    assert_eq!(key_data.key_type, ApiKeyType::YouTube);
    assert!(key_data.oauth_data.is_some());
    assert!(key_data.last_validated.is_some());
    assert_eq!(key_data.is_valid, Some(true));

    let oauth_data = key_data.oauth_data.unwrap();
    assert_eq!(oauth_data.client_id, "test_client");
  }

  #[test]
  fn test_api_key_data_serialization() {
    let key_data = create_api_key_data_with_oauth(ApiKeyType::Claude);

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let json_str = serialized.unwrap();
    assert!(json_str.contains("\"key_type\":\"Claude\""));
    assert!(json_str.contains("\"value\":\"test_api_key_value\""));

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok());
    assert_eq!(deserialized.unwrap().key_type, ApiKeyType::Claude);
  }

  #[test]
  fn test_api_key_data_validation_states() {
    let mut key_data = create_test_api_key_data(ApiKeyType::Telegram);

    // Не валидированный
    assert!(key_data.is_valid.is_none());
    assert!(key_data.last_validated.is_none());

    // Помечаем как валидный
    key_data.is_valid = Some(true);
    key_data.last_validated = Some(chrono::Utc::now());

    assert_eq!(key_data.is_valid, Some(true));
    assert!(key_data.last_validated.is_some());

    // Помечаем как не валидный
    key_data.is_valid = Some(false);
    assert_eq!(key_data.is_valid, Some(false));
  }

  #[test]
  fn test_api_key_data_clone() {
    let key_data = create_api_key_data_with_oauth(ApiKeyType::TikTok);
    let cloned = key_data.clone();

    assert_eq!(key_data.key_type, cloned.key_type);
    assert_eq!(key_data.value, cloned.value);
    assert_eq!(key_data.created_at, cloned.created_at);
    assert_eq!(key_data.is_valid, cloned.is_valid);
  }
}

#[cfg(test)]
mod encryption_key_tests {
  use super::*;

  #[test]
  fn test_get_or_create_encryption_key() {
    // Этот тест проверяет что функция возвращает валидный ключ
    let key1 = SecureStorage::get_or_create_encryption_key();
    assert!(key1.is_ok());
    let key1 = key1.unwrap();
    assert_eq!(key1.len(), 32);

    // Второй вызов должен вернуть тот же ключ
    let key2 = SecureStorage::get_or_create_encryption_key();
    assert!(key2.is_ok());
    let key2 = key2.unwrap();
    assert_eq!(key1.len(), 32);

    // Ключи должны быть одинаковыми (для одной системы)
    assert_eq!(key1, key2);
  }

  #[test]
  fn test_encryption_key_properties() {
    // Тестируем свойства ключа шифрования
    let key = SecureStorage::get_or_create_encryption_key().unwrap();
    
    // Ключ должен быть 32 байта для AES-256
    assert_eq!(key.len(), 32);
    
    // Ключ не должен быть нулевым
    assert_ne!(key, [0u8; 32]);
    
    // Повторный вызов должен вернуть тот же ключ
    let key2 = SecureStorage::get_or_create_encryption_key().unwrap();
    assert_eq!(key, key2);
  }

  #[test]
  fn test_encryption_key_consistency() {
    // Проверяем что multiple вызовы возвращают консистентные результаты
    let keys: Vec<_> = (0..3)
      .map(|_| SecureStorage::get_or_create_encryption_key().unwrap())
      .collect();

    // Все ключи должны быть одинаковыми
    let first_key = &keys[0];
    for key in &keys[1..] {
      assert_eq!(first_key, key, "Encryption keys should be consistent");
    }
  }

  #[test]
  fn test_encryption_key_format() {
    let key = SecureStorage::get_or_create_encryption_key().unwrap();
    
    // Проверяем формат ключа
    assert_eq!(key.len(), 32, "Key should be 32 bytes for AES-256");
    
    // Проверяем что ключ содержит не только нули
    let has_non_zero = key.iter().any(|&b| b != 0);
    assert!(has_non_zero, "Key should not be all zeros");
  }
}

#[cfg(test)]
mod encrypted_api_key_tests {
  use super::*;

  #[test]
  fn test_encrypted_api_key_basic() {
    // Тестируем только публичные API, так как EncryptedApiKey приватная
    let key_data = create_test_api_key_data(ApiKeyType::OpenAI);

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let json_str = serialized.unwrap();
    assert!(json_str.contains("\"key_type\":\"OpenAI\""));
    assert!(json_str.contains("\"value\":\"test_api_key_value\""));

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&json_str);
    assert!(deserialized.is_ok());

    let deserialized_data = deserialized.unwrap();
    assert_eq!(deserialized_data.key_type, ApiKeyType::OpenAI);
    assert_eq!(deserialized_data.value, "test_api_key_value");
  }

  #[test]
  fn test_api_key_data_with_large_values() {
    // Тестируем работу с большими объемами данных
    let large_value = "x".repeat(5000);
    let key_data = ApiKeyData {
      key_type: ApiKeyType::Claude,
      value: large_value.clone(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized_data = deserialized.unwrap();
    assert_eq!(deserialized_data.value.len(), 5000);
    assert_eq!(deserialized_data.key_type, ApiKeyType::Claude);
  }

  #[test]
  fn test_api_key_data_with_empty_value() {
    let key_data = ApiKeyData {
      key_type: ApiKeyType::Telegram,
      value: String::new(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized_data = deserialized.unwrap();
    assert!(deserialized_data.value.is_empty());
    assert_eq!(deserialized_data.key_type, ApiKeyType::Telegram);
  }
}

#[cfg(test)]
mod edge_cases_tests {
  use super::*;

  #[test]
  fn test_api_key_data_with_unicode_values() {
    let key_data = ApiKeyData {
      key_type: ApiKeyType::OpenAI,
      value: "ключ_на_русском_🔑".to_string(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());
    assert_eq!(deserialized.unwrap().value, "ключ_на_русском_🔑");
  }

  #[test]
  fn test_api_key_data_with_very_long_values() {
    let very_long_value = "a".repeat(10000);
    let key_data = ApiKeyData {
      key_type: ApiKeyType::Claude,
      value: very_long_value.clone(),
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());
    assert_eq!(deserialized.unwrap().value.len(), 10000);
  }

  #[test]
  fn test_oauth_credentials_with_control_characters() {
    let creds = OAuthCredentials {
      client_id: "client\nwith\nnewlines".to_string(),
      client_secret: "secret\twith\ttabs".to_string(),
      access_token: Some("token\rwith\rcarriage\rreturns".to_string()),
      refresh_token: Some("refresh\x00with\x00nulls".to_string()),
      expires_at: Some(chrono::Utc::now()),
    };

    // Сериализация должна работать с контрольными символами
    let serialized = serde_json::to_string(&creds);
    assert!(serialized.is_ok());

    let deserialized: Result<OAuthCredentials, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());
  }

  #[test]
  fn test_api_key_type_case_sensitivity() {
    // Тестируем что from_str чувствителен к регистру
    let case_variations = vec![
      "OpenAI", "OPENAI", "openAI", "YOUTUBE", "YouTube", "TikTok", "TIKTOK",
    ];

    for variation in case_variations {
      let result = ApiKeyType::from_str(variation);
      // Все должны быть невалидными из-за неправильного регистра
      assert!(
        result.is_err(),
        "Should fail for case variation: {}",
        variation
      );
    }
  }

  #[test]
  fn test_oauth_credentials_with_future_expiry() {
    let far_future = chrono::Utc::now() + chrono::Duration::days(365 * 10); // 10 лет

    let creds = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: Some("test_token".to_string()),
      refresh_token: Some("test_refresh".to_string()),
      expires_at: Some(far_future),
    };

    // Сериализация должна работать с далекими датами
    let serialized = serde_json::to_string(&creds);
    assert!(serialized.is_ok());

    let deserialized: Result<OAuthCredentials, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized_creds = deserialized.unwrap();
    assert!(deserialized_creds.expires_at.unwrap() > chrono::Utc::now());
  }

  #[test]
  fn test_oauth_credentials_with_past_expiry() {
    let past_date = chrono::Utc::now() - chrono::Duration::days(365); // год назад

    let creds = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: Some("expired_token".to_string()),
      refresh_token: Some("test_refresh".to_string()),
      expires_at: Some(past_date),
    };

    // Сериализация должна работать с прошедшими датами
    let serialized = serde_json::to_string(&creds);
    assert!(serialized.is_ok());

    let deserialized: Result<OAuthCredentials, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized_creds = deserialized.unwrap();
    assert!(deserialized_creds.expires_at.unwrap() < chrono::Utc::now());
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[test]
  fn test_full_api_key_data_workflow() {
    // Создаем ключ без OAuth
    let mut key_data = create_test_api_key_data(ApiKeyType::OpenAI);

    // Помечаем как валидный
    key_data.is_valid = Some(true);
    key_data.last_validated = Some(chrono::Utc::now());

    // Сериализуем
    let serialized = serde_json::to_string(&key_data).unwrap();

    // Десериализуем
    let deserialized: ApiKeyData = serde_json::from_str(&serialized).unwrap();

    // Проверяем что все данные сохранились
    assert_eq!(deserialized.key_type, ApiKeyType::OpenAI);
    assert_eq!(deserialized.value, "test_api_key_value");
    assert_eq!(deserialized.is_valid, Some(true));
    assert!(deserialized.last_validated.is_some());
    assert!(deserialized.oauth_data.is_none());
  }

  #[test]
  fn test_oauth_workflow_with_key_data() {
    // Создаем ключ с OAuth данными
    let key_data = create_api_key_data_with_oauth(ApiKeyType::YouTube);

    // Сериализуем полную структуру
    let serialized = serde_json::to_string(&key_data).unwrap();

    // Десериализуем
    let deserialized: ApiKeyData = serde_json::from_str(&serialized).unwrap();

    // Проверяем OAuth данные
    assert!(deserialized.oauth_data.is_some());
    let oauth_data = deserialized.oauth_data.unwrap();
    assert_eq!(oauth_data.client_id, "test_client");
    assert_eq!(oauth_data.client_secret, "test_secret");
    assert!(oauth_data.access_token.is_some());
    assert!(oauth_data.refresh_token.is_some());
    assert!(oauth_data.expires_at.is_some());
  }

  #[test]
  fn test_all_api_key_types_serialization() {
    let all_types = vec![
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

    for key_type in all_types {
      let key_data = create_test_api_key_data(key_type.clone());

      // Сериализация должна работать для всех типов
      let serialized = serde_json::to_string(&key_data);
      assert!(serialized.is_ok(), "Failed to serialize {:?}", key_type);

      // Десериализация должна работать для всех типов
      let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
      assert!(deserialized.is_ok(), "Failed to deserialize {:?}", key_type);

      let deserialized_data = deserialized.unwrap();
      assert_eq!(deserialized_data.key_type, key_type);
    }
  }

  #[test]
  fn test_multiple_encryption_key_calls() {
    // Проверяем что множественные вызовы работают корректно
    let keys: Vec<_> = (0..5)
      .map(|_| SecureStorage::get_or_create_encryption_key().unwrap())
      .collect();

    // Все ключи должны быть одинаковыми для одной системы
    let first_key = &keys[0];
    for key in &keys[1..] {
      assert_eq!(first_key, key, "Encryption keys should be consistent");
    }
  }

  #[test]
  fn test_complex_oauth_credentials_serialization() {
    let complex_creds = OAuthCredentials {
      client_id: "complex_client_123!@#$%^&*()".to_string(),
      client_secret: "secret_with_unicode_символы_🔐".to_string(),
      access_token: Some("token_very_long_".repeat(100)),
      refresh_token: Some("refresh_with\nnewlines\tand\ttabs".to_string()),
      expires_at: Some(chrono::Utc::now() + chrono::Duration::minutes(30)),
    };

    let key_data = ApiKeyData {
      key_type: ApiKeyType::TikTok,
      value: "complex_api_key_value_with_special_chars_🗝️".to_string(),
      oauth_data: Some(complex_creds),
      created_at: chrono::Utc::now(),
      last_validated: Some(chrono::Utc::now() - chrono::Duration::minutes(5)),
      is_valid: Some(true),
    };

    // Полная сериализация сложной структуры
    let serialized = serde_json::to_string(&key_data);
    assert!(serialized.is_ok());

    let deserialized: Result<ApiKeyData, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized_data = deserialized.unwrap();
    assert_eq!(deserialized_data.key_type, ApiKeyType::TikTok);
    assert!(deserialized_data.value.contains("🗝️"));
    assert!(deserialized_data.oauth_data.is_some());

    let oauth_data = deserialized_data.oauth_data.unwrap();
    assert!(oauth_data.client_secret.contains("символы"));
    assert!(oauth_data.access_token.unwrap().len() > 1000);
  }
}
