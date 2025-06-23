#[cfg(test)]
mod commands_tests {
  use super::super::commands::*;
  use super::super::*;
  use chrono::Utc;
  use serde_json::json;

  #[test]
  fn test_api_key_operation_result_serialization() {
    let result = ApiKeyOperationResult {
      success: true,
      message: "Operation successful".to_string(),
      data: Some(json!({"key": "value"})),
    };

    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("true"));
    assert!(serialized.contains("Operation successful"));
    assert!(serialized.contains("key"));

    let deserialized: ApiKeyOperationResult = serde_json::from_str(&serialized).unwrap();
    assert!(deserialized.success);
    assert_eq!(deserialized.message, "Operation successful");
    assert!(deserialized.data.is_some());
  }

  #[test]
  fn test_api_key_info_serialization() {
    let info = ApiKeyInfo {
      key_type: "openai".to_string(),
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      created_at: Some("2024-01-01 12:00:00".to_string()),
      last_validated: Some("2024-01-01 13:00:00".to_string()),
      is_valid: Some(true),
    };

    let serialized = serde_json::to_string(&info).unwrap();
    assert!(serialized.contains("openai"));
    assert!(serialized.contains("true"));

    let deserialized: ApiKeyInfo = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.key_type, "openai");
    assert!(deserialized.has_value);
    assert!(!deserialized.is_oauth);
    assert_eq!(deserialized.is_valid, Some(true));
  }

  #[test]
  fn test_save_simple_api_key_params_deserialization() {
    let json_data = json!({
        "key_type": "openai",
        "value": "sk-test123"
    });

    let params: SaveSimpleApiKeyParams = serde_json::from_value(json_data).unwrap();
    assert_eq!(params.key_type, "openai");
    assert_eq!(params.value, "sk-test123");
  }

  #[test]
  fn test_save_oauth_credentials_params_deserialization() {
    let json_data = json!({
        "key_type": "youtube",
        "client_id": "client123",
        "client_secret": "secret456",
        "access_token": "access789",
        "refresh_token": "refresh101"
    });

    let params: SaveOAuthCredentialsParams = serde_json::from_value(json_data).unwrap();
    assert_eq!(params.key_type, "youtube");
    assert_eq!(params.client_id, "client123");
    assert_eq!(params.client_secret, "secret456");
    assert_eq!(params.access_token, Some("access789".to_string()));
    assert_eq!(params.refresh_token, Some("refresh101".to_string()));
  }

  #[test]
  fn test_save_oauth_credentials_params_optional_fields() {
    let json_data = json!({
        "key_type": "youtube",
        "client_id": "client123",
        "client_secret": "secret456"
    });

    let params: SaveOAuthCredentialsParams = serde_json::from_value(json_data).unwrap();
    assert_eq!(params.key_type, "youtube");
    assert_eq!(params.client_id, "client123");
    assert_eq!(params.client_secret, "secret456");
    assert!(params.access_token.is_none());
    assert!(params.refresh_token.is_none());
  }

  #[test]
  fn test_api_key_info_oauth_fields() {
    // Test OAuth key info
    let oauth_info = ApiKeyInfo {
      key_type: "youtube".to_string(),
      has_value: true,
      is_oauth: true,
      has_access_token: true,
      created_at: Some("2024-01-01 12:00:00".to_string()),
      last_validated: None,
      is_valid: None,
    };

    assert!(oauth_info.is_oauth);
    assert!(oauth_info.has_access_token);
    assert!(oauth_info.last_validated.is_none());

    // Test simple API key info
    let simple_info = ApiKeyInfo {
      key_type: "openai".to_string(),
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      created_at: Some("2024-01-01 12:00:00".to_string()),
      last_validated: Some("2024-01-01 13:00:00".to_string()),
      is_valid: Some(true),
    };

    assert!(!simple_info.is_oauth);
    assert!(!simple_info.has_access_token);
    assert!(simple_info.last_validated.is_some());
    assert_eq!(simple_info.is_valid, Some(true));
  }

  #[test]
  fn test_api_key_operation_result_error_case() {
    let error_result = ApiKeyOperationResult {
      success: false,
      message: "Failed to save API key: Invalid format".to_string(),
      data: None,
    };

    assert!(!error_result.success);
    assert!(error_result.message.contains("Failed to save"));
    assert!(error_result.data.is_none());

    let serialized = serde_json::to_string(&error_result).unwrap();
    let deserialized: ApiKeyOperationResult = serde_json::from_str(&serialized).unwrap();

    assert!(!deserialized.success);
    assert_eq!(
      deserialized.message,
      "Failed to save API key: Invalid format"
    );
  }

  #[test]
  fn test_api_key_operation_result_with_data() {
    let result_with_data = ApiKeyOperationResult {
      success: true,
      message: "Import completed".to_string(),
      data: Some(json!({
          "imported_count": 3,
          "errors": ["error1", "error2"]
      })),
    };

    assert!(result_with_data.success);
    assert!(result_with_data.data.is_some());

    let data = result_with_data.data.unwrap();
    assert_eq!(data["imported_count"], 3);
    assert!(data["errors"].is_array());
  }

  #[test]
  fn test_api_key_info_datetime_formatting() {
    let created_time = Utc::now();
    let formatted_time = created_time.format("%Y-%m-%d %H:%M:%S").to_string();

    let info = ApiKeyInfo {
      key_type: "test".to_string(),
      has_value: true,
      is_oauth: false,
      has_access_token: false,
      created_at: Some(formatted_time.clone()),
      last_validated: Some(formatted_time.clone()),
      is_valid: Some(true),
    };

    assert_eq!(info.created_at, Some(formatted_time.clone()));
    assert_eq!(info.last_validated, Some(formatted_time));

    // Verify the format matches expected pattern
    assert!(info.created_at.as_ref().unwrap().contains("-"));
    assert!(info.created_at.as_ref().unwrap().contains(":"));
  }

  #[test]
  fn test_command_parameter_validation() {
    // Test invalid key type in SaveSimpleApiKeyParams
    let invalid_params = SaveSimpleApiKeyParams {
      key_type: "invalid_service".to_string(),
      value: "test_value".to_string(),
    };

    // This should be caught by ApiKeyType::from_str validation
    assert!(ApiKeyType::from_str(&invalid_params.key_type).is_none());

    // Test valid key type
    let valid_params = SaveSimpleApiKeyParams {
      key_type: "openai".to_string(),
      value: "sk-test123".to_string(),
    };

    assert!(ApiKeyType::from_str(&valid_params.key_type).is_some());
  }

  #[test]
  fn test_oauth_credentials_creation_from_params() {
    let params = SaveOAuthCredentialsParams {
      key_type: "youtube".to_string(),
      client_id: "client123".to_string(),
      client_secret: "secret456".to_string(),
      access_token: Some("access789".to_string()),
      refresh_token: Some("refresh101".to_string()),
    };

    // Simulate the logic from save_oauth_credentials command
    let oauth_data = OAuthCredentials {
      client_id: params.client_id.clone(),
      client_secret: params.client_secret,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      expires_at: None,
    };

    assert_eq!(oauth_data.client_id, "client123");
    assert_eq!(oauth_data.client_secret, "secret456");
    assert_eq!(oauth_data.access_token, Some("access789".to_string()));
    assert_eq!(oauth_data.refresh_token, Some("refresh101".to_string()));
    assert!(oauth_data.expires_at.is_none());
  }

  #[test]
  fn test_api_key_data_creation_from_oauth_params() {
    let params = SaveOAuthCredentialsParams {
      key_type: "youtube".to_string(),
      client_id: "client123".to_string(),
      client_secret: "secret456".to_string(),
      access_token: Some("access789".to_string()),
      refresh_token: Some("refresh101".to_string()),
    };

    let key_type = ApiKeyType::from_str(&params.key_type).unwrap();

    let oauth_data = OAuthCredentials {
      client_id: params.client_id.clone(),
      client_secret: params.client_secret,
      access_token: params.access_token,
      refresh_token: params.refresh_token,
      expires_at: None,
    };

    // Simulate the logic from save_oauth_credentials command
    let key_data = ApiKeyData {
      key_type: key_type.clone(),
      value: params.client_id, // Uses client_id as main value
      oauth_data: Some(oauth_data),
      created_at: Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    assert_eq!(key_data.key_type, ApiKeyType::YouTube);
    assert_eq!(key_data.value, "client123");
    assert!(key_data.oauth_data.is_some());
    assert!(key_data.last_validated.is_none());
    assert!(key_data.is_valid.is_none());
  }

  #[test]
  fn test_api_key_info_has_value_logic() {
    // Test empty value
    let info_empty = ApiKeyInfo {
      key_type: "test".to_string(),
      has_value: "".is_empty() == false, // Simulates !key_data.value.is_empty()
      is_oauth: false,
      has_access_token: false,
      created_at: None,
      last_validated: None,
      is_valid: None,
    };
    assert!(!info_empty.has_value);

    // Test non-empty value
    let info_filled = ApiKeyInfo {
      key_type: "test".to_string(),
      has_value: !"sk-test123".is_empty(),
      is_oauth: false,
      has_access_token: false,
      created_at: None,
      last_validated: None,
      is_valid: None,
    };
    assert!(info_filled.has_value);
  }

  #[test]
  fn test_oauth_callback_data_structure() {
    // Simulate the callback URL parsing result
    let callback_result = json!({
        "code": "auth_code_123",
        "state": "random_state",
        "error": null,
        "all_params": {
            "code": "auth_code_123",
            "state": "random_state",
            "scope": "read write"
        }
    });

    assert_eq!(callback_result["code"], "auth_code_123");
    assert_eq!(callback_result["state"], "random_state");
    assert!(callback_result["error"].is_null());
    assert!(callback_result["all_params"].is_object());
  }

  #[test]
  fn test_export_import_data_structure() {
    // Test the data structure used in import/export operations
    let export_result = ApiKeyOperationResult {
      success: true,
      message: "Successfully imported 2 API keys".to_string(),
      data: Some(json!({
          "imported_count": 2,
          "errors": []
      })),
    };

    assert!(export_result.success);
    assert!(export_result.message.contains("imported 2"));

    let data = export_result.data.unwrap();
    assert_eq!(data["imported_count"], 2);
    assert!(data["errors"].as_array().unwrap().is_empty());
  }
}
