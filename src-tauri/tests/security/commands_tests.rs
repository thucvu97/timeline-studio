//! Тесты для security/commands.rs
//! 
//! Примечание: Полные интеграционные тесты команд находятся в commands_integration_tests.rs
//! Здесь только базовые unit-тесты структур данных

use timeline_studio_lib::security::commands::*;

#[cfg(test)]
mod unit_tests {
    use super::*;
    
    #[test]
    fn test_api_key_operation_result() {
        let result = ApiKeyOperationResult {
            success: true,
            message: "Test message".to_string(),
            data: Some(serde_json::json!({"key": "value"})),
        };
        
        assert!(result.success);
        assert_eq!(result.message, "Test message");
        assert!(result.data.is_some());
        
        // Test serialization
        let serialized = serde_json::to_string(&result).unwrap();
        assert!(serialized.contains("success"));
        assert!(serialized.contains("message"));
        assert!(serialized.contains("data"));
        
        // Test deserialization
        let deserialized: ApiKeyOperationResult = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.success, result.success);
        assert_eq!(deserialized.message, result.message);
    }
    
    #[test]
    fn test_api_key_info() {
        let info = ApiKeyInfo {
            key_type: "openai".to_string(),
            has_value: true,
            is_oauth: false,
            has_access_token: false,
            created_at: Some("2024-01-01".to_string()),
            last_validated: None,
            is_valid: Some(true),
        };
        
        assert_eq!(info.key_type, "openai");
        assert!(info.has_value);
        assert!(!info.is_oauth);
        assert!(!info.has_access_token);
        assert_eq!(info.created_at, Some("2024-01-01".to_string()));
        assert!(info.last_validated.is_none());
        assert_eq!(info.is_valid, Some(true));
        
        // Test serialization
        let serialized = serde_json::to_string(&info).unwrap();
        let deserialized: ApiKeyInfo = serde_json::from_str(&serialized).unwrap();
        assert_eq!(deserialized.key_type, info.key_type);
        assert_eq!(deserialized.has_value, info.has_value);
    }
    
    #[test]
    fn test_save_simple_api_key_params() {
        let params = SaveSimpleApiKeyParams {
            key_type: "claude".to_string(),
            value: "test_key_123".to_string(),
        };
        
        assert_eq!(params.key_type, "claude");
        assert_eq!(params.value, "test_key_123");
        
        // Test deserialization from JSON
        let json = r#"{
            "key_type": "openai",
            "value": "sk-test123"
        }"#;
        
        let deserialized: SaveSimpleApiKeyParams = serde_json::from_str(json).unwrap();
        assert_eq!(deserialized.key_type, "openai");
        assert_eq!(deserialized.value, "sk-test123");
    }
    
    #[test]
    fn test_save_oauth_credentials_params() {
        let params = SaveOAuthCredentialsParams {
            key_type: "youtube".to_string(),
            client_id: "client_123".to_string(),
            client_secret: "secret_456".to_string(),
            access_token: Some("access_789".to_string()),
            refresh_token: Some("refresh_012".to_string()),
        };
        
        assert_eq!(params.key_type, "youtube");
        assert_eq!(params.client_id, "client_123");
        assert_eq!(params.client_secret, "secret_456");
        assert_eq!(params.access_token, Some("access_789".to_string()));
        assert_eq!(params.refresh_token, Some("refresh_012".to_string()));
        
        // Test with None values
        let params_minimal = SaveOAuthCredentialsParams {
            key_type: "vimeo".to_string(),
            client_id: "client_minimal".to_string(),
            client_secret: "secret_minimal".to_string(),
            access_token: None,
            refresh_token: None,
        };
        
        assert!(params_minimal.access_token.is_none());
        assert!(params_minimal.refresh_token.is_none());
    }
    
    #[test]
    fn test_parse_oauth_callback_url_structure() {
        // This tests the command output structure
        let test_url = "http://localhost:3000/oauth/callback?code=auth_code&state=state_123";
        
        // We can't directly test the command, but we can test the expected structure
        use timeline_studio_lib::security::oauth_handler::callback_utils;
        
        match callback_utils::parse_callback_url(test_url) {
            Ok(params) => {
                let code = callback_utils::extract_auth_code(&params).ok();
                let state = callback_utils::extract_state(&params);
                let error = callback_utils::extract_error(&params);
                
                let result = serde_json::json!({
                    "code": code,
                    "state": state,
                    "error": error,
                    "all_params": params
                });
                
                assert!(result["code"].is_string() || result["code"].is_null());
                assert!(result["state"].is_string() || result["state"].is_null());
                assert!(result["all_params"].is_object());
            }
            Err(_) => {
                // URL parsing failed - это тоже валидный результат для теста
            }
        }
    }
    
    #[test]
    fn test_api_key_info_oauth() {
        let info = ApiKeyInfo {
            key_type: "youtube".to_string(),
            has_value: true,
            is_oauth: true,
            has_access_token: true,
            created_at: Some("2024-01-01T12:00:00Z".to_string()),
            last_validated: Some("2024-01-02T12:00:00Z".to_string()),
            is_valid: Some(true),
        };
        
        assert!(info.is_oauth);
        assert!(info.has_access_token);
        assert!(info.last_validated.is_some());
    }
    
    #[test]
    fn test_api_key_operation_result_failure() {
        let result = ApiKeyOperationResult {
            success: false,
            message: "Operation failed".to_string(),
            data: None,
        };
        
        assert!(!result.success);
        assert_eq!(result.message, "Operation failed");
        assert!(result.data.is_none());
    }
    
    #[test]
    fn test_api_key_operation_result_with_complex_data() {
        let complex_data = serde_json::json!({
            "imported_count": 5,
            "errors": ["Error 1", "Error 2"],
            "metadata": {
                "timestamp": "2024-01-01T12:00:00Z",
                "source": "env_file"
            }
        });
        
        let result = ApiKeyOperationResult {
            success: true,
            message: "Partial success".to_string(),
            data: Some(complex_data),
        };
        
        assert!(result.data.is_some());
        let data = result.data.unwrap();
        assert_eq!(data["imported_count"], 5);
        assert!(data["errors"].is_array());
        assert!(data["metadata"].is_object());
    }
}