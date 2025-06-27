//! Simplified comprehensive тесты для oauth_handler.rs - Фаза 2 улучшения покрытия
//!
//! Этот файл содержит тесты, которые не требуют доступа к приватным полям

use super::oauth_handler::*;
use super::{ApiKeyType, OAuthCredentials};

/// Создает тестовый OAuth handler
fn create_test_handler() -> OAuthHandler {
  OAuthHandler::new()
}

/// Создает OAuth handler с кастомным redirect URI
fn create_test_handler_with_redirect(redirect_uri: &str) -> OAuthHandler {
  OAuthHandler::with_redirect_uri(redirect_uri.to_string())
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

/// Создает истекшие OAuth credentials
fn create_expired_oauth_credentials() -> OAuthCredentials {
  OAuthCredentials {
    client_id: "test_client".to_string(),
    client_secret: "test_secret".to_string(),
    access_token: Some("expired_access_token".to_string()),
    refresh_token: Some("test_refresh_token".to_string()),
    expires_at: Some(chrono::Utc::now() - chrono::Duration::hours(1)),
  }
}

#[cfg(test)]
mod oauth_handler_basic_tests {
  use super::*;

  #[test]
  fn test_oauth_handler_creation() {
    let _handler = create_test_handler();
    // Handler создался успешно - если мы дошли до сюда, значит OK
  }

  #[test]
  fn test_oauth_handler_with_custom_redirect() {
    let custom_redirect = "https://myapp.com/callback";
    let _handler = create_test_handler_with_redirect(custom_redirect);
    // Handler создался успешно - если мы дошли до сюда, значит OK
  }

  #[test]
  fn test_oauth_handler_default_trait() {
    let _handler = OAuthHandler::default();
    // Default handler создался успешно - если мы дошли до сюда, значит OK
  }

  #[test]
  fn test_get_oauth_config_youtube() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::YouTube);

    assert!(config.is_some());
    let config = config.unwrap();

    assert_eq!(
      config.auth_url,
      "https://accounts.google.com/o/oauth2/v2/auth"
    );
    assert_eq!(config.token_url, "https://oauth2.googleapis.com/token");
    assert!(config
      .scopes
      .contains(&"https://www.googleapis.com/auth/youtube.upload".to_string()));
    assert!(config
      .scopes
      .contains(&"https://www.googleapis.com/auth/youtube".to_string()));
    assert!(config.redirect_uri.contains("localhost:3000"));
  }

  #[test]
  fn test_get_oauth_config_tiktok() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::TikTok);

    assert!(config.is_some());
    let config = config.unwrap();

    assert_eq!(config.auth_url, "https://www.tiktok.com/auth/authorize/");
    assert_eq!(
      config.token_url,
      "https://open-api.tiktok.com/oauth/access_token/"
    );
    assert!(config.scopes.contains(&"user.info.basic".to_string()));
    assert!(config.scopes.contains(&"video.upload".to_string()));
  }

  #[test]
  fn test_get_oauth_config_vimeo() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::Vimeo);

    assert!(config.is_some());
    let config = config.unwrap();

    assert_eq!(config.auth_url, "https://api.vimeo.com/oauth/authorize");
    assert_eq!(config.token_url, "https://api.vimeo.com/oauth/access_token");
    assert!(config.scopes.contains(&"public".to_string()));
    assert!(config.scopes.contains(&"private".to_string()));
    assert!(config.scopes.contains(&"upload".to_string()));
  }

  #[test]
  fn test_get_oauth_config_unsupported_service() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::OpenAI);

    assert!(config.is_none());
  }

  #[test]
  fn test_get_oauth_config_all_unsupported_services() {
    let handler = create_test_handler();
    let unsupported_services = vec![
      ApiKeyType::OpenAI,
      ApiKeyType::Claude,
      ApiKeyType::DeepSeek,
      ApiKeyType::Telegram,
      ApiKeyType::Codecov,
      ApiKeyType::TauriAnalytics,
    ];

    for service in unsupported_services {
      let config = handler.get_oauth_config(&service);
      assert!(
        config.is_none(),
        "Service {:?} should not support OAuth",
        service
      );
    }
  }
}

#[cfg(test)]
mod auth_url_generation_tests {
  use super::*;

  #[test]
  fn test_generate_auth_url_youtube_basic() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "test_client_id", None);

    assert!(result.is_ok());
    let url = result.unwrap();

    assert!(url.contains("https://accounts.google.com/o/oauth2/v2/auth"));
    assert!(url.contains("client_id=test_client_id"));
    assert!(url.contains("response_type=code"));
    assert!(url.contains("access_type=offline"));
    assert!(url.contains("prompt=consent"));
    assert!(url.contains("scope="));
  }

  #[test]
  fn test_generate_auth_url_youtube_with_state() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(
      ApiKeyType::YouTube,
      "test_client_id",
      Some("test_state_123"),
    );

    assert!(result.is_ok());
    let url = result.unwrap();

    assert!(url.contains("state=test_state_123"));
  }

  #[test]
  fn test_generate_auth_url_tiktok() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(ApiKeyType::TikTok, "tiktok_client", None);

    assert!(result.is_ok());
    let url = result.unwrap();

    assert!(url.contains("https://www.tiktok.com/auth/authorize/"));
    assert!(url.contains("client_id=tiktok_client"));
    assert!(url.contains("response_type=code"));
    assert!(url.contains("scope=user.info.basic"));
    assert!(url.contains("video.upload"));
  }

  #[test]
  fn test_generate_auth_url_vimeo() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(ApiKeyType::Vimeo, "vimeo_client", Some("state456"));

    assert!(result.is_ok());
    let url = result.unwrap();

    assert!(url.contains("https://api.vimeo.com/oauth/authorize"));
    assert!(url.contains("client_id=vimeo_client"));
    assert!(url.contains("state=state456"));
    assert!(url.contains("scope=public"));
    assert!(url.contains("private"));
    assert!(url.contains("upload"));
  }

  #[test]
  fn test_generate_auth_url_unsupported_service() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(ApiKeyType::OpenAI, "client_id", None);

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("OAuth not supported"));
  }

  #[test]
  fn test_generate_auth_url_empty_client_id() {
    let handler = create_test_handler();
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "", None);

    assert!(result.is_ok());
    let url = result.unwrap();
    assert!(url.contains("client_id="));
  }

  #[test]
  fn test_generate_auth_url_special_characters_in_state() {
    let handler = create_test_handler();
    let special_state = "test@#$%^&*()_+{}[]";
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "client_id", Some(special_state));

    assert!(result.is_ok());
    let url = result.unwrap();
    // URL должен быть корректно закодирован
    assert!(url.contains("state="));
  }

  #[test]
  fn test_generate_auth_url_all_supported_services() {
    let handler = create_test_handler();
    let supported_services = vec![ApiKeyType::YouTube, ApiKeyType::TikTok, ApiKeyType::Vimeo];

    for service in supported_services {
      let result = handler.generate_auth_url(service.clone(), "test_client", None);
      assert!(result.is_ok(), "Should support OAuth for {:?}", service);

      let url = result.unwrap();
      assert!(
        url.starts_with("https://"),
        "URL should be HTTPS for {:?}",
        service
      );
      assert!(
        url.contains("client_id=test_client"),
        "URL should contain client_id for {:?}",
        service
      );
    }
  }
}

#[cfg(test)]
mod oauth_credentials_tests {
  use super::*;

  #[test]
  fn test_create_oauth_credentials_with_expiry() {
    let handler = create_test_handler();
    let oauth_result = OAuthResult {
      access_token: "test_access".to_string(),
      refresh_token: Some("test_refresh".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("test_scope".to_string()),
    };

    let credentials = handler.create_oauth_credentials(
      "client_id".to_string(),
      "client_secret".to_string(),
      oauth_result,
    );

    assert_eq!(credentials.client_id, "client_id");
    assert_eq!(credentials.client_secret, "client_secret");
    assert_eq!(credentials.access_token, Some("test_access".to_string()));
    assert_eq!(credentials.refresh_token, Some("test_refresh".to_string()));
    assert!(credentials.expires_at.is_some());

    // Проверяем что время истечения установлено правильно (приблизительно +1 час)
    let expected_expiry = chrono::Utc::now() + chrono::Duration::seconds(3600);
    let actual_expiry = credentials.expires_at.unwrap();
    let diff = (actual_expiry - expected_expiry).num_seconds().abs();
    assert!(
      diff < 10,
      "Expiry time should be within 10 seconds of expected"
    );
  }

  #[test]
  fn test_create_oauth_credentials_without_expiry() {
    let handler = create_test_handler();
    let oauth_result = OAuthResult {
      access_token: "test_access".to_string(),
      refresh_token: None,
      expires_in: None,
      token_type: "Bearer".to_string(),
      scope: None,
    };

    let credentials = handler.create_oauth_credentials(
      "client_id".to_string(),
      "client_secret".to_string(),
      oauth_result,
    );

    assert_eq!(credentials.access_token, Some("test_access".to_string()));
    assert_eq!(credentials.refresh_token, None);
    assert!(credentials.expires_at.is_none());
  }

  #[test]
  fn test_needs_refresh_with_valid_token() {
    let handler = create_test_handler();
    let credentials = create_test_oauth_credentials();

    assert!(!handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_needs_refresh_with_expired_token() {
    let handler = create_test_handler();
    let credentials = create_expired_oauth_credentials();

    assert!(handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_needs_refresh_with_no_expiry() {
    let handler = create_test_handler();
    let mut credentials = create_test_oauth_credentials();
    credentials.expires_at = None;

    assert!(!handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_needs_refresh_threshold() {
    let handler = create_test_handler();
    let mut credentials = create_test_oauth_credentials();

    // Устанавливаем время истечения через 3 минуты (меньше порога в 5 минут)
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::minutes(3));

    assert!(handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_needs_refresh_boundary_conditions() {
    let handler = create_test_handler();
    let mut credentials = create_test_oauth_credentials();

    // Тест на границе порога (ровно 5 минут)
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::minutes(5));
    let _result_at_threshold = handler.needs_refresh(&credentials);

    // Тест за пределами порога (6 минут)
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::minutes(6));
    let result_beyond_threshold = handler.needs_refresh(&credentials);

    // На границе может зависеть от точной реализации, но за пределами определенно false
    assert!(!result_beyond_threshold);

    // В пределах порога должно быть true
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::minutes(2));
    assert!(handler.needs_refresh(&credentials));
  }
}

#[cfg(test)]
mod auto_refresh_tests {
  use super::*;

  #[tokio::test]
  async fn test_auto_refresh_if_needed_no_refresh_needed() {
    let handler = create_test_handler();
    let mut credentials = create_test_oauth_credentials();

    let result = handler
      .auto_refresh_if_needed(ApiKeyType::YouTube, &mut credentials)
      .await;

    assert!(result.is_ok());
    assert!(!result.unwrap()); // Refresh не выполнялся
  }

  #[tokio::test]
  async fn test_auto_refresh_if_needed_no_refresh_token() {
    let handler = create_test_handler();
    let mut credentials = create_expired_oauth_credentials();
    credentials.refresh_token = None;

    let result = handler
      .auto_refresh_if_needed(ApiKeyType::YouTube, &mut credentials)
      .await;

    assert!(result.is_ok());
    assert!(!result.unwrap()); // Refresh не выполнялся, т.к. нет refresh token
  }

  #[tokio::test]
  async fn test_auto_refresh_unsupported_service() {
    let handler = create_test_handler();
    let mut credentials = create_expired_oauth_credentials();

    let result = handler
      .auto_refresh_if_needed(
        ApiKeyType::OpenAI, // Не поддерживает OAuth
        &mut credentials,
      )
      .await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("OAuth not supported"));
  }

  #[tokio::test]
  async fn test_auto_refresh_with_network_error() {
    let handler = create_test_handler();
    let mut credentials = create_expired_oauth_credentials();

    // Используем TikTok для тестирования (должен отказать по сети)
    let result = handler
      .auto_refresh_if_needed(ApiKeyType::TikTok, &mut credentials)
      .await;

    // Ожидаем ошибку сети, но не падение программы
    assert!(result.is_err());
  }
}

#[cfg(test)]
mod user_info_tests {
  use super::*;

  #[tokio::test]
  async fn test_get_user_info_unsupported_service() {
    let handler = create_test_handler();

    let result = handler
      .get_user_info(ApiKeyType::OpenAI, "test_token")
      .await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("User info not supported"));
  }

  #[tokio::test]
  async fn test_get_user_info_supported_services() {
    let handler = create_test_handler();
    let supported_services = vec![ApiKeyType::YouTube, ApiKeyType::Vimeo, ApiKeyType::TikTok];

    for service in supported_services {
      // Тестируем только с очень коротким timeout или invalid token
      // Главное - убедиться что сервис поддерживается (не возвращает "not supported")
      let result = handler.get_user_info(service.clone(), "").await; // Empty token

      // Result может быть успешным или с ошибкой, но НЕ должен быть "unsupported"
      if let Err(e) = result {
        let error_msg = e.to_string().to_lowercase();
        assert!(
          !error_msg.contains("user info not supported"),
          "Service {:?} should support user info",
          service
        );
      }
      // Если успешно - то метод поддерживается для этого сервиса
    }
  }
}

#[cfg(test)]
mod callback_utils_tests {
  use super::callback_utils::*;
  use std::collections::HashMap;

  #[test]
  fn test_parse_callback_url_success() {
    let callback_url = "http://localhost:3000/oauth/callback?code=test_code&state=test_state";
    let result = parse_callback_url(callback_url);

    assert!(result.is_ok());
    let params = result.unwrap();

    assert_eq!(params.get("code"), Some(&"test_code".to_string()));
    assert_eq!(params.get("state"), Some(&"test_state".to_string()));
  }

  #[test]
  fn test_parse_callback_url_with_error() {
    let callback_url = "http://localhost:3000/oauth/callback?error=access_denied&error_description=User%20denied%20access";
    let result = parse_callback_url(callback_url);

    assert!(result.is_ok());
    let params = result.unwrap();

    assert_eq!(params.get("error"), Some(&"access_denied".to_string()));
    assert!(params.contains_key("error_description"));
  }

  #[test]
  fn test_parse_callback_url_invalid() {
    let callback_url = "not-a-valid-url";
    let result = parse_callback_url(callback_url);

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("Invalid callback URL"));
  }

  #[test]
  fn test_parse_callback_url_no_query_params() {
    let callback_url = "http://localhost:3000/oauth/callback";
    let result = parse_callback_url(callback_url);

    assert!(result.is_ok());
    let params = result.unwrap();
    assert!(params.is_empty());
  }

  #[test]
  fn test_extract_auth_code_success() {
    let mut params = HashMap::new();
    params.insert("code".to_string(), "test_auth_code".to_string());
    params.insert("state".to_string(), "test_state".to_string());

    let result = extract_auth_code(&params);
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "test_auth_code");
  }

  #[test]
  fn test_extract_auth_code_missing() {
    let mut params = HashMap::new();
    params.insert("state".to_string(), "test_state".to_string());

    let result = extract_auth_code(&params);
    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .to_string()
      .contains("No authorization code"));
  }

  #[test]
  fn test_extract_state_success() {
    let mut params = HashMap::new();
    params.insert("code".to_string(), "test_code".to_string());
    params.insert("state".to_string(), "test_state_value".to_string());

    let result = extract_state(&params);
    assert!(result.is_some());
    assert_eq!(result.unwrap(), "test_state_value");
  }

  #[test]
  fn test_extract_state_missing() {
    let mut params = HashMap::new();
    params.insert("code".to_string(), "test_code".to_string());

    let result = extract_state(&params);
    assert!(result.is_none());
  }

  #[test]
  fn test_extract_error_success() {
    let mut params = HashMap::new();
    params.insert("error".to_string(), "access_denied".to_string());
    params.insert(
      "error_description".to_string(),
      "User denied access".to_string(),
    );

    let result = extract_error(&params);
    assert!(result.is_some());
    assert_eq!(result.unwrap(), "access_denied");
  }

  #[test]
  fn test_extract_error_missing() {
    let mut params = HashMap::new();
    params.insert("code".to_string(), "test_code".to_string());

    let result = extract_error(&params);
    assert!(result.is_none());
  }

  #[test]
  fn test_full_callback_flow_success() {
    let callback_url =
      "http://localhost:3000/oauth/callback?code=success_code&state=csrf_token_123";

    let parse_result = parse_callback_url(callback_url);
    assert!(parse_result.is_ok());

    let params = parse_result.unwrap();

    // Проверяем отсутствие ошибки
    let error = extract_error(&params);
    assert!(error.is_none());

    // Извлекаем код
    let code = extract_auth_code(&params);
    assert!(code.is_ok());
    assert_eq!(code.unwrap(), "success_code");

    // Извлекаем state
    let state = extract_state(&params);
    assert!(state.is_some());
    assert_eq!(state.unwrap(), "csrf_token_123");
  }

  #[test]
  fn test_full_callback_flow_error() {
    let callback_url = "http://localhost:3000/oauth/callback?error=invalid_request&error_description=Missing%20client_id";

    let parse_result = parse_callback_url(callback_url);
    assert!(parse_result.is_ok());

    let params = parse_result.unwrap();

    // Проверяем наличие ошибки
    let error = extract_error(&params);
    assert!(error.is_some());
    assert_eq!(error.unwrap(), "invalid_request");

    // Код не должен присутствовать при ошибке
    let code = extract_auth_code(&params);
    assert!(code.is_err());
  }

  #[test]
  fn test_callback_with_special_characters() {
    let callback_url = "http://localhost:3000/oauth/callback?code=test%20code&state=state%40%23%24";

    let parse_result = parse_callback_url(callback_url);
    assert!(parse_result.is_ok());

    let params = parse_result.unwrap();

    // URL декодирование должно работать автоматически
    let code = extract_auth_code(&params).unwrap();
    assert_eq!(code, "test code");

    let state = extract_state(&params).unwrap();
    assert_eq!(state, "state@#$");
  }

  #[test]
  fn test_callback_utils_comprehensive() {
    // Тест множественных параметров
    let callback_url =
      "http://localhost:3000/oauth/callback?code=abc123&state=xyz789&extra_param=value&numeric=42";

    let parse_result = parse_callback_url(callback_url);
    assert!(parse_result.is_ok());

    let params = parse_result.unwrap();
    assert_eq!(params.len(), 4);

    assert_eq!(extract_auth_code(&params).unwrap(), "abc123");
    assert_eq!(extract_state(&params).unwrap(), "xyz789");
    assert_eq!(params.get("extra_param").unwrap(), "value");
    assert_eq!(params.get("numeric").unwrap(), "42");
  }
}

#[cfg(test)]
mod edge_cases_tests {
  use super::*;

  #[test]
  fn test_oauth_config_cloning() {
    let handler = create_test_handler();
    let config1 = handler.get_oauth_config(&ApiKeyType::YouTube).unwrap();
    let config2 = config1.clone();

    assert_eq!(config1.auth_url, config2.auth_url);
    assert_eq!(config1.token_url, config2.token_url);
    assert_eq!(config1.scopes, config2.scopes);
    assert_eq!(config1.redirect_uri, config2.redirect_uri);
  }

  #[test]
  fn test_oauth_config_debug_format() {
    let handler = create_test_handler();
    let config = handler.get_oauth_config(&ApiKeyType::YouTube).unwrap();

    let debug_string = format!("{:?}", config);
    assert!(debug_string.contains("auth_url"));
    assert!(debug_string.contains("token_url"));
    assert!(debug_string.contains("scopes"));
    assert!(debug_string.contains("redirect_uri"));
  }

  #[test]
  fn test_oauth_result_serialization() {
    let oauth_result = OAuthResult {
      access_token: "test_access".to_string(),
      refresh_token: Some("test_refresh".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("test_scope".to_string()),
    };

    let serialized = serde_json::to_string(&oauth_result);
    assert!(serialized.is_ok());

    let deserialized: Result<OAuthResult, _> = serde_json::from_str(&serialized.unwrap());
    assert!(deserialized.is_ok());

    let deserialized = deserialized.unwrap();
    assert_eq!(deserialized.access_token, oauth_result.access_token);
    assert_eq!(deserialized.refresh_token, oauth_result.refresh_token);
  }

  #[test]
  fn test_oauth_result_debug_format() {
    let oauth_result = OAuthResult {
      access_token: "test_access".to_string(),
      refresh_token: Some("test_refresh".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("test_scope".to_string()),
    };

    let debug_string = format!("{:?}", oauth_result);
    assert!(debug_string.contains("access_token"));
    assert!(debug_string.contains("refresh_token"));
  }

  #[test]
  fn test_large_scope_lists() {
    let handler = create_test_handler();

    // Проверяем что большие списки scopes обрабатываются корректно
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "client_id", None);
    assert!(result.is_ok());

    let url = result.unwrap();
    // YouTube имеет 2 scope, они должны быть объединены через пробел
    assert!(url.contains("scope="));
    assert!(url.contains("youtube.upload"));
    assert!(url.contains("youtube"));
  }

  #[test]
  fn test_empty_client_credentials() {
    let handler = create_test_handler();

    // Тестируем с пустыми credentials (должно работать, но будет invalid на сервере)
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "", None);
    assert!(result.is_ok());

    let url = result.unwrap();
    assert!(url.contains("client_id="));
  }

  #[test]
  fn test_unicode_in_parameters() {
    let handler = create_test_handler();

    // Тестируем с Unicode символами в state
    let unicode_state = "测试_пример_🚀";
    let result = handler.generate_auth_url(ApiKeyType::YouTube, "client_id", Some(unicode_state));

    assert!(result.is_ok());
    let url = result.unwrap();
    assert!(url.contains("state="));
  }

  #[test]
  fn test_very_long_parameters() {
    let handler = create_test_handler();

    // Тестируем с очень длинными параметрами
    let long_client_id = "a".repeat(1000);
    let long_state = "b".repeat(500);

    let result = handler.generate_auth_url(ApiKeyType::YouTube, &long_client_id, Some(&long_state));

    assert!(result.is_ok());
    let url = result.unwrap();
    assert!(url.len() > 1000);
    assert!(url.contains(&format!("client_id={}", long_client_id)));
  }

  #[test]
  fn test_oauth_credentials_boundary_times() {
    let handler = create_test_handler();

    // Тест с временем истечения точно сейчас
    let mut credentials = create_test_oauth_credentials();
    credentials.expires_at = Some(chrono::Utc::now());
    assert!(handler.needs_refresh(&credentials));

    // Тест с временем истечения в прошлом
    credentials.expires_at = Some(chrono::Utc::now() - chrono::Duration::seconds(1));
    assert!(handler.needs_refresh(&credentials));

    // Тест с временем истечения далеко в будущем
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::days(365));
    assert!(!handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_service_specific_parameters() {
    let handler = create_test_handler();

    // YouTube должен иметь специфичные параметры
    let youtube_url = handler
      .generate_auth_url(ApiKeyType::YouTube, "client", None)
      .unwrap();
    assert!(youtube_url.contains("access_type=offline"));
    assert!(youtube_url.contains("prompt=consent"));

    // TikTok должен иметь response_type=code (дублированный, но это нормально)
    let tiktok_url = handler
      .generate_auth_url(ApiKeyType::TikTok, "client", None)
      .unwrap();
    assert!(tiktok_url.contains("response_type=code"));

    // Vimeo не должен иметь специфичных параметров (только стандартные OAuth)
    let vimeo_url = handler
      .generate_auth_url(ApiKeyType::Vimeo, "client", None)
      .unwrap();
    assert!(vimeo_url.contains("response_type=code"));
    assert!(!vimeo_url.contains("access_type=offline"));
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[test]
  fn test_complete_oauth_flow_simulation() {
    let handler = create_test_handler();

    // 1. Генерируем authorization URL
    let auth_url = handler
      .generate_auth_url(
        ApiKeyType::YouTube,
        "test_client_id",
        Some("csrf_token_123"),
      )
      .unwrap();

    assert!(auth_url.contains("state=csrf_token_123"));

    // 2. Симулируем callback URL (success)
    let callback_url =
      "http://localhost:3000/oauth/callback?code=auth_code_456&state=csrf_token_123";
    let params = callback_utils::parse_callback_url(callback_url).unwrap();

    // 3. Проверяем state для CSRF защиты
    let returned_state = callback_utils::extract_state(&params).unwrap();
    assert_eq!(returned_state, "csrf_token_123");

    // 4. Извлекаем authorization code
    let auth_code = callback_utils::extract_auth_code(&params).unwrap();
    assert_eq!(auth_code, "auth_code_456");

    // 5. Создаем OAuth credentials из mock результата
    let mock_oauth_result = OAuthResult {
      access_token: "access_token_789".to_string(),
      refresh_token: Some("refresh_token_101112".to_string()),
      expires_in: Some(3600),
      token_type: "Bearer".to_string(),
      scope: Some("https://www.googleapis.com/auth/youtube".to_string()),
    };

    let credentials = handler.create_oauth_credentials(
      "test_client_id".to_string(),
      "test_client_secret".to_string(),
      mock_oauth_result,
    );

    // 6. Проверяем созданные credentials
    assert_eq!(
      credentials.access_token,
      Some("access_token_789".to_string())
    );
    assert_eq!(
      credentials.refresh_token,
      Some("refresh_token_101112".to_string())
    );
    assert!(credentials.expires_at.is_some());

    // 7. Проверяем что токен не требует обновления
    assert!(!handler.needs_refresh(&credentials));
  }

  #[test]
  fn test_error_flow_simulation() {
    let handler = create_test_handler();

    // 1. Генерируем authorization URL
    let auth_url = handler
      .generate_auth_url(
        ApiKeyType::YouTube,
        "test_client_id",
        Some("csrf_token_error"),
      )
      .unwrap();

    assert!(auth_url.contains("state=csrf_token_error"));

    // 2. Симулируем callback URL с ошибкой
    let error_callback_url = "http://localhost:3000/oauth/callback?error=access_denied&error_description=User%20denied%20the%20request&state=csrf_token_error";
    let params = callback_utils::parse_callback_url(error_callback_url).unwrap();

    // 3. Проверяем state
    let returned_state = callback_utils::extract_state(&params).unwrap();
    assert_eq!(returned_state, "csrf_token_error");

    // 4. Проверяем наличие ошибки
    let error = callback_utils::extract_error(&params).unwrap();
    assert_eq!(error, "access_denied");

    // 5. Попытка извлечь authorization code должна провалиться
    let auth_code_result = callback_utils::extract_auth_code(&params);
    assert!(auth_code_result.is_err());
  }

  #[test]
  fn test_multi_service_support() {
    let handler = create_test_handler();
    let services = vec![
      (ApiKeyType::YouTube, "google"),
      (ApiKeyType::TikTok, "tiktok"),
      (ApiKeyType::Vimeo, "vimeo"),
    ];

    for (service, expected_domain) in services {
      // Проверяем что config доступен
      let config = handler.get_oauth_config(&service);
      assert!(config.is_some());

      // Проверяем что auth URL генерируется
      let auth_url = handler.generate_auth_url(service.clone(), "client_id", None);
      assert!(auth_url.is_ok());

      let url = auth_url.unwrap();
      assert!(
        url.to_lowercase().contains(expected_domain),
        "URL should contain {} for service {:?}: {}",
        expected_domain,
        service,
        url
      );
    }
  }

  #[test]
  fn test_credentials_lifecycle() {
    let handler = create_test_handler();

    // Создаем credentials которые скоро истекут
    let mut credentials = OAuthCredentials {
      client_id: "test_client".to_string(),
      client_secret: "test_secret".to_string(),
      access_token: Some("access_token".to_string()),
      refresh_token: Some("refresh_token".to_string()),
      expires_at: Some(chrono::Utc::now() + chrono::Duration::minutes(3)),
    };

    // Проверяем что нужен refresh
    assert!(handler.needs_refresh(&credentials));

    // Симулируем обновление токена
    credentials.access_token = Some("new_access_token".to_string());
    credentials.expires_at = Some(chrono::Utc::now() + chrono::Duration::hours(1));

    // Проверяем что refresh больше не нужен
    assert!(!handler.needs_refresh(&credentials));
  }
}
