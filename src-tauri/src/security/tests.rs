use super::*;
use chrono::Utc;
use tempfile::TempDir;

/// Mock Tauri AppHandle for testing
struct MockAppHandle {
  _temp_dir: TempDir,
}

impl MockAppHandle {
  fn new() -> Self {
    let temp_dir = TempDir::new().expect("Failed to create temp dir");
    Self {
      _temp_dir: temp_dir,
    }
  }
}

/// Creates a mock app handle for testing
fn create_mock_app_handle() -> MockAppHandle {
  MockAppHandle::new()
}

#[cfg(test)]
mod secure_storage_tests {
  use super::*;
  use chrono::Utc;

  fn create_test_api_key_data(key_type: ApiKeyType, value: &str) -> ApiKeyData {
    ApiKeyData {
      key_type,
      value: value.to_string(),
      oauth_data: None,
      created_at: Utc::now(),
      last_validated: None,
      is_valid: None,
    }
  }

  fn create_test_oauth_credentials() -> OAuthCredentials {
    OAuthCredentials {
      client_id: "test_client_id".to_string(),
      client_secret: "test_client_secret".to_string(),
      access_token: Some("test_access_token".to_string()),
      refresh_token: Some("test_refresh_token".to_string()),
      expires_at: Some(Utc::now() + chrono::Duration::hours(1)),
    }
  }

  #[test]
  fn test_api_key_type_conversions() {
    // Test as_str
    assert_eq!(ApiKeyType::OpenAI.as_str(), "openai");
    assert_eq!(ApiKeyType::Claude.as_str(), "claude");
    assert_eq!(ApiKeyType::YouTube.as_str(), "youtube");
    assert_eq!(ApiKeyType::TikTok.as_str(), "tiktok");
    assert_eq!(ApiKeyType::Vimeo.as_str(), "vimeo");
    assert_eq!(ApiKeyType::Telegram.as_str(), "telegram");
    assert_eq!(ApiKeyType::Codecov.as_str(), "codecov");
    assert_eq!(ApiKeyType::TauriAnalytics.as_str(), "tauri_analytics");

    // Test from_str
    assert_eq!(ApiKeyType::from_str("openai"), Some(ApiKeyType::OpenAI));
    assert_eq!(ApiKeyType::from_str("claude"), Some(ApiKeyType::Claude));
    assert_eq!(ApiKeyType::from_str("youtube"), Some(ApiKeyType::YouTube));
    assert_eq!(ApiKeyType::from_str("tiktok"), Some(ApiKeyType::TikTok));
    assert_eq!(ApiKeyType::from_str("vimeo"), Some(ApiKeyType::Vimeo));
    assert_eq!(ApiKeyType::from_str("telegram"), Some(ApiKeyType::Telegram));
    assert_eq!(ApiKeyType::from_str("codecov"), Some(ApiKeyType::Codecov));
    assert_eq!(
      ApiKeyType::from_str("tauri_analytics"),
      Some(ApiKeyType::TauriAnalytics)
    );
    assert_eq!(ApiKeyType::from_str("invalid"), None);
  }

  #[test]
  fn test_api_key_data_serialization() {
    let key_data = create_test_api_key_data(ApiKeyType::OpenAI, "sk-test123");

    // Test serialization
    let serialized = serde_json::to_string(&key_data).unwrap();
    assert!(serialized.contains("OpenAI"));
    assert!(serialized.contains("sk-test123"));

    // Test deserialization
    let deserialized: ApiKeyData = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.key_type, ApiKeyType::OpenAI);
    assert_eq!(deserialized.value, "sk-test123");
  }

  #[test]
  fn test_oauth_credentials_serialization() {
    let oauth_creds = create_test_oauth_credentials();

    // Test serialization
    let serialized = serde_json::to_string(&oauth_creds).unwrap();
    assert!(serialized.contains("test_client_id"));
    assert!(serialized.contains("test_access_token"));

    // Test deserialization
    let deserialized: OAuthCredentials = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.client_id, "test_client_id");
    assert_eq!(deserialized.access_token.unwrap(), "test_access_token");
  }

  // Note: EncryptedApiKey is private, so we test the concept without direct access
  #[test]
  fn test_encrypted_data_concept() {
    // Test the general concept of encrypted data structure
    let nonce = vec![1, 2, 3, 4, 5];
    let ciphertext = vec![6, 7, 8, 9, 10];
    let created_at = Utc::now();

    // Verify basic properties
    assert_eq!(nonce.len(), 5);
    assert_eq!(ciphertext.len(), 5);
    assert!(created_at <= Utc::now());
  }

  #[test]
  fn test_api_key_type_hash_and_eq() {
    use std::collections::HashMap;

    let mut map = HashMap::new();
    map.insert(ApiKeyType::OpenAI, "value1");
    map.insert(ApiKeyType::Claude, "value2");

    assert_eq!(map.get(&ApiKeyType::OpenAI), Some(&"value1"));
    assert_eq!(map.get(&ApiKeyType::Claude), Some(&"value2"));
    assert_eq!(map.get(&ApiKeyType::YouTube), None);
  }

  #[test]
  fn test_api_key_data_with_oauth() {
    let oauth_data = create_test_oauth_credentials();
    let mut key_data = create_test_api_key_data(ApiKeyType::YouTube, "youtube_key");
    key_data.oauth_data = Some(oauth_data);
    key_data.is_valid = Some(true);
    key_data.last_validated = Some(Utc::now());

    // Test serialization with OAuth data
    let serialized = serde_json::to_string(&key_data).unwrap();
    let deserialized: ApiKeyData = serde_json::from_str(&serialized).unwrap();

    assert_eq!(deserialized.key_type, ApiKeyType::YouTube);
    assert!(deserialized.oauth_data.is_some());
    assert_eq!(deserialized.is_valid, Some(true));
    assert!(deserialized.last_validated.is_some());
  }

  // Note: Full SecureStorage tests would require a working Tauri AppHandle
  // For now, we test the individual components and data structures
  #[test]
  fn test_secure_storage_key_generation_logic() {
    // Test the key generation logic without actual keyring
    let service_key = format!("api_key_{}", ApiKeyType::OpenAI.as_str());
    assert_eq!(service_key, "api_key_openai");

    let service_key = format!("api_key_{}", ApiKeyType::TauriAnalytics.as_str());
    assert_eq!(service_key, "api_key_tauri_analytics");
  }

  #[test]
  fn test_api_key_data_validation_fields() {
    let mut key_data = create_test_api_key_data(ApiKeyType::OpenAI, "sk-test123");

    // Initially no validation
    assert!(key_data.is_valid.is_none());
    assert!(key_data.last_validated.is_none());

    // Update validation status
    key_data.is_valid = Some(true);
    key_data.last_validated = Some(Utc::now());

    assert_eq!(key_data.is_valid, Some(true));
    assert!(key_data.last_validated.is_some());
  }
}

#[cfg(test)]
mod api_validator_tests {
  use super::*;
  use crate::security::api_validator::*;

  #[test]
  fn test_validation_result_serialization() {
    let result = ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("Test service".to_string()),
      rate_limits: None,
    };

    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("true"));
    assert!(serialized.contains("Test service"));
  }

  #[test]
  fn test_rate_limit_info_serialization() {
    let rate_limit = RateLimitInfo {
      requests_remaining: Some(100),
      reset_time: Some(Utc::now()),
      daily_limit: Some(1000),
    };

    let serialized = serde_json::to_string(&rate_limit).unwrap();
    assert!(serialized.contains("100"));
    assert!(serialized.contains("1000"));
  }

  #[test]
  fn test_api_validator_creation() {
    let validator = ApiValidator::new();
    // Can't test private field directly, but ensure creation succeeds
    assert!(std::mem::size_of_val(&validator) > 0);
  }

  #[test]
  fn test_api_validator_default() {
    let validator = ApiValidator::default();
    // Can't test private field directly, but ensure creation succeeds
    assert!(std::mem::size_of_val(&validator) > 0);
  }

  // Mock tests for validation logic (without actual API calls)
  #[test]
  fn test_validation_result_error_case() {
    let result = ValidationResult {
      is_valid: false,
      error_message: Some("Invalid API key".to_string()),
      service_info: None,
      rate_limits: None,
    };

    assert!(!result.is_valid);
    assert_eq!(result.error_message.unwrap(), "Invalid API key");
    assert!(result.service_info.is_none());
  }

  #[test]
  fn test_validation_result_success_case() {
    let result = ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("API access confirmed".to_string()),
      rate_limits: Some(RateLimitInfo {
        requests_remaining: Some(50),
        reset_time: None,
        daily_limit: Some(100),
      }),
    };

    assert!(result.is_valid);
    assert!(result.error_message.is_none());
    assert!(result.service_info.is_some());
    assert!(result.rate_limits.is_some());
  }
}

#[cfg(test)]
mod oauth_handler_tests {
  use super::*;
  use crate::security::oauth_handler::*;

  #[test]
  fn test_oauth_config_creation() {
    let config = OAuthConfig {
      auth_url: "https://example.com/auth".to_string(),
      token_url: "https://example.com/token".to_string(),
      scopes: vec!["read".to_string(), "write".to_string()],
      redirect_uri: "http://localhost:3000/callback".to_string(),
    };

    assert_eq!(config.auth_url, "https://example.com/auth");
    assert_eq!(config.scopes.len(), 2);
    assert!(config.scopes.contains(&"read".to_string()));
  }

  #[test]
  fn test_oauth_result_serialization() {
    let result = OAuthResult {
      access_token: "test_token".to_string(),
      refresh_token: Some("refresh_token".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("read write".to_string()),
    };

    let serialized = serde_json::to_string(&result).unwrap();
    let deserialized: OAuthResult = serde_json::from_str(&serialized).unwrap();

    assert_eq!(deserialized.access_token, "test_token");
    assert_eq!(deserialized.refresh_token.unwrap(), "refresh_token");
    assert_eq!(deserialized.expires_in.unwrap(), 3600);
  }

  #[test]
  fn test_oauth_handler_creation() {
    let handler = OAuthHandler::new();
    // Can't test private field directly, but ensure creation succeeds
    assert!(std::mem::size_of_val(&handler) > 0);

    let custom_handler = OAuthHandler::with_redirect_uri("custom://callback".to_string());
    assert!(std::mem::size_of_val(&custom_handler) > 0);
  }

  #[test]
  fn test_oauth_handler_default() {
    let handler = OAuthHandler::default();
    assert!(std::mem::size_of_val(&handler) > 0);
  }

  #[test]
  fn test_get_oauth_config() {
    let handler = OAuthHandler::new();

    // Test supported services
    let youtube_config = handler.get_oauth_config(&ApiKeyType::YouTube);
    assert!(youtube_config.is_some());
    let config = youtube_config.unwrap();
    assert!(config.auth_url.contains("google.com"));
    assert!(config.scopes.len() > 0);

    let tiktok_config = handler.get_oauth_config(&ApiKeyType::TikTok);
    assert!(tiktok_config.is_some());

    let vimeo_config = handler.get_oauth_config(&ApiKeyType::Vimeo);
    assert!(vimeo_config.is_some());

    // Test unsupported services
    let openai_config = handler.get_oauth_config(&ApiKeyType::OpenAI);
    assert!(openai_config.is_none());
  }

  #[test]
  fn test_generate_auth_url() {
    let handler = OAuthHandler::new();

    // Test with YouTube
    let auth_url =
      handler.generate_auth_url(ApiKeyType::YouTube, "test_client_id", Some("test_state"));

    assert!(auth_url.is_ok());
    let url = auth_url.unwrap();
    assert!(url.contains("client_id=test_client_id"));
    assert!(url.contains("state=test_state"));
    assert!(url.contains("access_type=offline"));
    assert!(url.contains("prompt=consent"));
  }

  #[test]
  fn test_generate_auth_url_without_state() {
    let handler = OAuthHandler::new();

    let auth_url = handler.generate_auth_url(ApiKeyType::YouTube, "test_client_id", None);

    assert!(auth_url.is_ok());
    let url = auth_url.unwrap();
    assert!(url.contains("client_id=test_client_id"));
    assert!(!url.contains("state="));
  }

  #[test]
  fn test_generate_auth_url_unsupported_service() {
    let handler = OAuthHandler::new();

    let auth_url = handler.generate_auth_url(ApiKeyType::OpenAI, "test_client_id", None);

    assert!(auth_url.is_err());
  }

  #[test]
  fn test_create_oauth_credentials() {
    let handler = OAuthHandler::new();
    let oauth_result = OAuthResult {
      access_token: "access_token".to_string(),
      refresh_token: Some("refresh_token".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: None,
    };

    let credentials = handler.create_oauth_credentials(
      "client_id".to_string(),
      "client_secret".to_string(),
      oauth_result,
    );

    assert_eq!(credentials.client_id, "client_id");
    assert_eq!(credentials.client_secret, "client_secret");
    assert_eq!(credentials.access_token.unwrap(), "access_token");
    assert_eq!(credentials.refresh_token.unwrap(), "refresh_token");
    assert!(credentials.expires_at.is_some());
  }

  #[test]
  fn test_needs_refresh() {
    let handler = OAuthHandler::new();

    // Test with no expiration
    let oauth_no_expiry = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: Some("refresh".to_string()),
      expires_at: None,
    };
    assert!(!handler.needs_refresh(&oauth_no_expiry));

    // Test with future expiration
    let oauth_future = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: Some("refresh".to_string()),
      expires_at: Some(Utc::now() + chrono::Duration::hours(1)),
    };
    assert!(!handler.needs_refresh(&oauth_future));

    // Test with past expiration
    let oauth_past = OAuthCredentials {
      client_id: "test".to_string(),
      client_secret: "test".to_string(),
      access_token: Some("token".to_string()),
      refresh_token: Some("refresh".to_string()),
      expires_at: Some(Utc::now() - chrono::Duration::hours(1)),
    };
    assert!(handler.needs_refresh(&oauth_past));
  }

  #[test]
  fn test_callback_utils() {
    use crate::security::oauth_handler::callback_utils::*;

    // Test parse_callback_url
    let callback_url = "http://localhost:3000/callback?code=test_code&state=test_state";
    let params = parse_callback_url(callback_url).unwrap();

    assert_eq!(params.get("code"), Some(&"test_code".to_string()));
    assert_eq!(params.get("state"), Some(&"test_state".to_string()));

    // Test extract_auth_code
    let auth_code = extract_auth_code(&params).unwrap();
    assert_eq!(auth_code, "test_code");

    // Test extract_state
    let state = extract_state(&params);
    assert_eq!(state, Some("test_state".to_string()));

    // Test extract_error
    let error = extract_error(&params);
    assert!(error.is_none());
  }

  #[test]
  fn test_callback_utils_with_error() {
    use crate::security::oauth_handler::callback_utils::*;

    let error_url =
      "http://localhost:3000/callback?error=access_denied&error_description=User+denied";
    let params = parse_callback_url(error_url).unwrap();

    let error = extract_error(&params);
    assert_eq!(error, Some("access_denied".to_string()));

    let auth_code = extract_auth_code(&params);
    assert!(auth_code.is_err());
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[test]
  fn test_api_key_type_roundtrip() {
    let all_types = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::YouTube,
      ApiKeyType::TikTok,
      ApiKeyType::Vimeo,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for key_type in all_types {
      let as_str = key_type.as_str();
      let from_str = ApiKeyType::from_str(as_str).unwrap();
      assert_eq!(key_type, from_str);
    }
  }

  #[test]
  fn test_oauth_and_api_key_integration() {
    let oauth_creds = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: Some("access_token".to_string()),
      refresh_token: Some("refresh_token".to_string()),
      expires_at: Some(Utc::now() + chrono::Duration::hours(1)),
    };

    let api_key_data = ApiKeyData {
      key_type: ApiKeyType::YouTube,
      value: "youtube_key".to_string(),
      oauth_data: Some(oauth_creds),
      created_at: Utc::now(),
      last_validated: Some(Utc::now()),
      is_valid: Some(true),
    };

    // Test serialization/deserialization
    let serialized = serde_json::to_string(&api_key_data).unwrap();
    let deserialized: ApiKeyData = serde_json::from_str(&serialized).unwrap();

    assert_eq!(deserialized.key_type, ApiKeyType::YouTube);
    assert!(deserialized.oauth_data.is_some());
    assert_eq!(deserialized.is_valid, Some(true));

    let oauth_data = deserialized.oauth_data.unwrap();
    assert_eq!(oauth_data.client_id, "test_client");
    assert!(oauth_data.access_token.is_some());
  }

  #[test]
  fn test_validation_workflow() {
    // Simulate a validation workflow
    let mut api_key_data = ApiKeyData {
      key_type: ApiKeyType::OpenAI,
      value: "sk-test123".to_string(),
      oauth_data: None,
      created_at: Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    // Initial state - not validated
    assert!(api_key_data.is_valid.is_none());
    assert!(api_key_data.last_validated.is_none());

    // Simulate validation success
    api_key_data.is_valid = Some(true);
    api_key_data.last_validated = Some(Utc::now());

    assert_eq!(api_key_data.is_valid, Some(true));
    assert!(api_key_data.last_validated.is_some());
  }
}
