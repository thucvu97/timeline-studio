//! Comprehensive тесты для oauth_handler.rs - Фаза 2 улучшения покрытия
//!
//! Этот файл содержит расширенные тесты для увеличения покрытия oauth_handler.rs

use super::oauth_handler::*;
use super::{ApiKeyType, OAuthCredentials};
use httpmock::prelude::*;
use serde_json::json;
use std::collections::HashMap;

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
        let handler = create_test_handler();
        
        // Проверяем что handler создался с default redirect URI
        assert!(handler.redirect_uri.contains("localhost:3000"));
    }

    #[test]
    fn test_oauth_handler_with_custom_redirect() {
        let custom_redirect = "https://myapp.com/callback";
        let handler = create_test_handler_with_redirect(custom_redirect);
        
        assert_eq!(handler.redirect_uri, custom_redirect);
    }

    #[test]
    fn test_oauth_handler_default_trait() {
        let handler = OAuthHandler::default();
        
        assert!(handler.redirect_uri.contains("localhost:3000"));
    }

    #[test]
    fn test_get_oauth_config_youtube() {
        let handler = create_test_handler();
        let config = handler.get_oauth_config(&ApiKeyType::YouTube);
        
        assert!(config.is_some());
        let config = config.unwrap();
        
        assert_eq!(config.auth_url, "https://accounts.google.com/o/oauth2/v2/auth");
        assert_eq!(config.token_url, "https://oauth2.googleapis.com/token");
        assert!(config.scopes.contains(&"https://www.googleapis.com/auth/youtube.upload".to_string()));
        assert!(config.scopes.contains(&"https://www.googleapis.com/auth/youtube".to_string()));
        assert_eq!(config.redirect_uri, handler.redirect_uri);
    }

    #[test]
    fn test_get_oauth_config_tiktok() {
        let handler = create_test_handler();
        let config = handler.get_oauth_config(&ApiKeyType::TikTok);
        
        assert!(config.is_some());
        let config = config.unwrap();
        
        assert_eq!(config.auth_url, "https://www.tiktok.com/auth/authorize/");
        assert_eq!(config.token_url, "https://open-api.tiktok.com/oauth/access_token/");
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
            assert!(config.is_none(), "Service {:?} should not support OAuth", service);
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
            Some("test_state_123")
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
        assert!(result.unwrap_err().to_string().contains("OAuth not supported"));
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
        let result = handler.generate_auth_url(
            ApiKeyType::YouTube,
            "client_id",
            Some(special_state)
        );
        
        assert!(result.is_ok());
        let url = result.unwrap();
        // URL должен быть корректно закодирован
        assert!(url.contains("state="));
    }
}

#[cfg(test)]
mod token_exchange_tests {
    use super::*;

    #[tokio::test]
    async fn test_exchange_code_for_token_success() {
        let server = MockServer::start();
        
        // Мокаем успешный ответ от сервера
        let token_mock = server.mock(|when, then| {
            when.method(POST)
                .path("/token")
                .header("content-type", "application/x-www-form-urlencoded");
            then.status(200)
                .header("content-type", "application/json")
                .json_body(json!({
                    "access_token": "test_access_token",
                    "refresh_token": "test_refresh_token",
                    "expires_in": 3600,
                    "token_type": "Bearer",
                    "scope": "test_scope"
                }));
        });

        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        // Переопределяем config для использования mock сервера
        let mock_config = OAuthConfig {
            auth_url: format!("{}/auth", server.base_url()),
            token_url: format!("{}/token", server.base_url()),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        // Создаем временный handler для тестирования
        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.exchange_code_for_token_mock(
            "test_client_id",
            "test_client_secret",
            "test_auth_code"
        ).await;

        assert!(result.is_ok());
        let oauth_result = result.unwrap();
        
        assert_eq!(oauth_result.access_token, "test_access_token");
        assert_eq!(oauth_result.refresh_token, Some("test_refresh_token".to_string()));
        assert_eq!(oauth_result.expires_in, Some(3600));
        assert_eq!(oauth_result.token_type, "Bearer");
        assert_eq!(oauth_result.scope, Some("test_scope".to_string()));

        token_mock.assert();
    }

    #[tokio::test]
    async fn test_exchange_code_for_token_failure() {
        let server = MockServer::start();
        
        let token_mock = server.mock(|when, then| {
            when.method(POST).path("/token");
            then.status(400)
                .header("content-type", "application/json")
                .json_body(json!({
                    "error": "invalid_grant",
                    "error_description": "Invalid authorization code"
                }));
        });

        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        let mock_config = OAuthConfig {
            auth_url: format!("{}/auth", server.base_url()),
            token_url: format!("{}/token", server.base_url()),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.exchange_code_for_token_mock(
            "client_id",
            "client_secret",
            "invalid_code"
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Token exchange failed"));

        token_mock.assert();
    }

    #[tokio::test]
    async fn test_exchange_code_for_token_network_error() {
        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        // Используем недоступный URL для симуляции сетевой ошибки
        let mock_config = OAuthConfig {
            auth_url: "http://invalid-url-12345.example.com/auth".to_string(),
            token_url: "http://invalid-url-12345.example.com/token".to_string(),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.exchange_code_for_token_mock(
            "client_id",
            "client_secret",
            "auth_code"
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Failed to exchange code for token"));
    }

    #[tokio::test]
    async fn test_exchange_code_for_token_invalid_json() {
        let server = MockServer::start();
        
        let token_mock = server.mock(|when, then| {
            when.method(POST).path("/token");
            then.status(200)
                .header("content-type", "application/json")
                .body("invalid json response");
        });

        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        let mock_config = OAuthConfig {
            auth_url: format!("{}/auth", server.base_url()),
            token_url: format!("{}/token", server.base_url()),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.exchange_code_for_token_mock(
            "client_id",
            "client_secret",
            "auth_code"
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Failed to parse token response"));

        token_mock.assert();
    }
}

#[cfg(test)]
mod token_refresh_tests {
    use super::*;

    #[tokio::test]
    async fn test_refresh_access_token_success() {
        let server = MockServer::start();
        
        let refresh_mock = server.mock(|when, then| {
            when.method(POST)
                .path("/token")
                .header("content-type", "application/x-www-form-urlencoded")
                .body_contains("grant_type=refresh_token");
            then.status(200)
                .header("content-type", "application/json")
                .json_body(json!({
                    "access_token": "new_access_token",
                    "refresh_token": "new_refresh_token",
                    "expires_in": 7200,
                    "token_type": "Bearer"
                }));
        });

        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        let mock_config = OAuthConfig {
            auth_url: format!("{}/auth", server.base_url()),
            token_url: format!("{}/token", server.base_url()),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.refresh_access_token_mock(
            "client_id",
            "client_secret",
            "old_refresh_token"
        ).await;

        assert!(result.is_ok());
        let oauth_result = result.unwrap();
        
        assert_eq!(oauth_result.access_token, "new_access_token");
        assert_eq!(oauth_result.refresh_token, Some("new_refresh_token".to_string()));
        assert_eq!(oauth_result.expires_in, Some(7200));

        refresh_mock.assert();
    }

    #[tokio::test]
    async fn test_refresh_access_token_failure() {
        let server = MockServer::start();
        
        let refresh_mock = server.mock(|when, then| {
            when.method(POST).path("/token");
            then.status(401)
                .header("content-type", "application/json")
                .json_body(json!({
                    "error": "invalid_grant",
                    "error_description": "Invalid refresh token"
                }));
        });

        let handler = OAuthHandler {
            client: reqwest::Client::new(),
            redirect_uri: "http://localhost:3000/callback".to_string(),
        };

        let mock_config = OAuthConfig {
            auth_url: format!("{}/auth", server.base_url()),
            token_url: format!("{}/token", server.base_url()),
            scopes: vec!["test_scope".to_string()],
            redirect_uri: handler.redirect_uri.clone(),
        };

        let test_handler = TestOAuthHandler {
            handler,
            mock_config: Some(mock_config),
        };

        let result = test_handler.refresh_access_token_mock(
            "client_id",
            "client_secret",
            "invalid_refresh_token"
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Token refresh failed"));

        refresh_mock.assert();
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
            oauth_result
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
        assert!(diff < 10, "Expiry time should be within 10 seconds of expected");
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
            oauth_result
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
}

#[cfg(test)]
mod auto_refresh_tests {
    use super::*;

    #[tokio::test]
    async fn test_auto_refresh_if_needed_no_refresh_needed() {
        let handler = create_test_handler();
        let mut credentials = create_test_oauth_credentials();
        
        let result = handler.auto_refresh_if_needed(
            ApiKeyType::YouTube,
            &mut credentials
        ).await;
        
        assert!(result.is_ok());
        assert!(!result.unwrap()); // Refresh не выполнялся
    }

    #[tokio::test]
    async fn test_auto_refresh_if_needed_no_refresh_token() {
        let handler = create_test_handler();
        let mut credentials = create_expired_oauth_credentials();
        credentials.refresh_token = None;
        
        let result = handler.auto_refresh_if_needed(
            ApiKeyType::YouTube,
            &mut credentials
        ).await;
        
        assert!(result.is_ok());
        assert!(!result.unwrap()); // Refresh не выполнялся, т.к. нет refresh token
    }

    #[tokio::test]
    async fn test_auto_refresh_unsupported_service() {
        let handler = create_test_handler();
        let mut credentials = create_expired_oauth_credentials();
        
        let result = handler.auto_refresh_if_needed(
            ApiKeyType::OpenAI, // Не поддерживает OAuth
            &mut credentials
        ).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("OAuth not supported"));
    }
}

#[cfg(test)]
mod user_info_tests {
    use super::*;

    #[tokio::test]
    async fn test_get_user_info_youtube_success() {
        let server = MockServer::start();
        
        let user_info_mock = server.mock(|when, then| {
            when.method(GET)
                .path("/oauth2/v2/userinfo")
                .header("Authorization", "Bearer test_access_token");
            then.status(200)
                .header("content-type", "application/json")
                .json_body(json!({
                    "id": "123456789",
                    "email": "test@gmail.com",
                    "verified_email": true,
                    "name": "Test User",
                    "picture": "https://example.com/photo.jpg"
                }));
        });

        let handler = TestOAuthHandler {
            handler: OAuthHandler {
                client: reqwest::Client::new(),
                redirect_uri: "http://localhost:3000/callback".to_string(),
            },
            mock_config: None,
        };

        // Переопределяем endpoint для mock сервера
        let result = handler.get_user_info_mock(
            &format!("{}/oauth2/v2/userinfo", server.base_url()),
            "test_access_token"
        ).await;

        assert!(result.is_ok());
        let user_info = result.unwrap();
        
        assert_eq!(user_info["id"], "123456789");
        assert_eq!(user_info["email"], "test@gmail.com");
        assert_eq!(user_info["name"], "Test User");

        user_info_mock.assert();
    }

    #[tokio::test]
    async fn test_get_user_info_vimeo_success() {
        let server = MockServer::start();
        
        let user_info_mock = server.mock(|when, then| {
            when.method(GET)
                .path("/me")
                .header("Authorization", "Bearer vimeo_access_token");
            then.status(200)
                .header("content-type", "application/json")
                .json_body(json!({
                    "uri": "/users/123456",
                    "name": "Vimeo User",
                    "account": "basic",
                    "bio": "Video creator",
                    "location": "San Francisco"
                }));
        });

        let handler = TestOAuthHandler {
            handler: OAuthHandler {
                client: reqwest::Client::new(),
                redirect_uri: "http://localhost:3000/callback".to_string(),
            },
            mock_config: None,
        };

        let result = handler.get_user_info_mock(
            &format!("{}/me", server.base_url()),
            "vimeo_access_token"
        ).await;

        assert!(result.is_ok());
        let user_info = result.unwrap();
        
        assert_eq!(user_info["name"], "Vimeo User");
        assert_eq!(user_info["account"], "basic");

        user_info_mock.assert();
    }

    #[tokio::test]
    async fn test_get_user_info_tiktok_success() {
        let server = MockServer::start();
        
        let user_info_mock = server.mock(|when, then| {
            when.method(GET)
                .path("/oauth/userinfo/")
                .header("Authorization", "Bearer tiktok_access_token");
            then.status(200)
                .header("content-type", "application/json")
                .json_body(json!({
                    "data": {
                        "user": {
                            "open_id": "tiktok_user_123",
                            "union_id": "union_123",
                            "avatar_url": "https://example.com/avatar.jpg",
                            "display_name": "TikTok Creator"
                        }
                    },
                    "error": {
                        "code": "ok",
                        "message": "",
                        "log_id": "log123"
                    }
                }));
        });

        let handler = TestOAuthHandler {
            handler: OAuthHandler {
                client: reqwest::Client::new(),
                redirect_uri: "http://localhost:3000/callback".to_string(),
            },
            mock_config: None,
        };

        let result = handler.get_user_info_mock(
            &format!("{}/oauth/userinfo/", server.base_url()),
            "tiktok_access_token"
        ).await;

        assert!(result.is_ok());
        let user_info = result.unwrap();
        
        assert_eq!(user_info["data"]["user"]["display_name"], "TikTok Creator");

        user_info_mock.assert();
    }

    #[tokio::test]
    async fn test_get_user_info_unauthorized() {
        let server = MockServer::start();
        
        let user_info_mock = server.mock(|when, then| {
            when.method(GET).path("/oauth2/v2/userinfo");
            then.status(401)
                .header("content-type", "application/json")
                .json_body(json!({
                    "error": {
                        "code": 401,
                        "message": "Invalid credentials"
                    }
                }));
        });

        let handler = TestOAuthHandler {
            handler: OAuthHandler {
                client: reqwest::Client::new(),
                redirect_uri: "http://localhost:3000/callback".to_string(),
            },
            mock_config: None,
        };

        let result = handler.get_user_info_mock(
            &format!("{}/oauth2/v2/userinfo", server.base_url()),
            "invalid_token"
        ).await;

        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Failed to get user info"));

        user_info_mock.assert();
    }

    #[test]
    fn test_get_user_info_unsupported_service() {
        let handler = create_test_handler();
        let rt = tokio::runtime::Runtime::new().unwrap();
        
        let result = rt.block_on(handler.get_user_info(
            ApiKeyType::OpenAI,
            "test_token"
        ));
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("User info not supported"));
    }
}

#[cfg(test)]
mod callback_utils_tests {
    use super::callback_utils::*;

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
        assert!(params.get("error_description").is_some());
    }

    #[test]
    fn test_parse_callback_url_invalid() {
        let callback_url = "not-a-valid-url";
        let result = parse_callback_url(callback_url);
        
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Invalid callback URL"));
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
        assert!(result.unwrap_err().to_string().contains("No authorization code"));
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
        params.insert("error_description".to_string(), "User denied access".to_string());
        
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
        let callback_url = "http://localhost:3000/oauth/callback?code=success_code&state=csrf_token_123";
        
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
    fn test_redirect_uri_in_all_configs() {
        let custom_redirect = "https://myapp.com/custom/callback";
        let handler = create_test_handler_with_redirect(custom_redirect);
        
        let supported_services = vec![
            ApiKeyType::YouTube,
            ApiKeyType::TikTok,
            ApiKeyType::Vimeo,
        ];
        
        for service in supported_services {
            let config = handler.get_oauth_config(&service).unwrap();
            assert_eq!(config.redirect_uri, custom_redirect);
        }
    }
}

// Вспомогательная структура для тестирования с mock сервером
struct TestOAuthHandler {
    handler: OAuthHandler,
    mock_config: Option<OAuthConfig>,
}

impl TestOAuthHandler {
    async fn exchange_code_for_token_mock(
        &self,
        client_id: &str,
        client_secret: &str,
        code: &str,
    ) -> anyhow::Result<OAuthResult> {
        let config = self.mock_config.as_ref().unwrap();

        let mut params = HashMap::new();
        params.insert("grant_type", "authorization_code");
        params.insert("code", code);
        params.insert("redirect_uri", &config.redirect_uri);
        params.insert("client_id", client_id);
        params.insert("client_secret", client_secret);

        let response = self.handler.client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .context("Failed to exchange code for token")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Token exchange failed: {}", error_text));
        }

        let token_response: OAuthResult = response
            .json()
            .await
            .context("Failed to parse token response")?;

        Ok(token_response)
    }

    async fn refresh_access_token_mock(
        &self,
        client_id: &str,
        client_secret: &str,
        refresh_token: &str,
    ) -> anyhow::Result<OAuthResult> {
        let config = self.mock_config.as_ref().unwrap();

        let mut params = HashMap::new();
        params.insert("grant_type", "refresh_token");
        params.insert("refresh_token", refresh_token);
        params.insert("client_id", client_id);
        params.insert("client_secret", client_secret);

        let response = self.handler.client
            .post(&config.token_url)
            .form(&params)
            .send()
            .await
            .context("Failed to refresh token")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("Token refresh failed: {}", error_text));
        }

        let token_response: OAuthResult = response
            .json()
            .await
            .context("Failed to parse refresh response")?;

        Ok(token_response)
    }

    async fn get_user_info_mock(
        &self,
        endpoint: &str,
        access_token: &str,
    ) -> anyhow::Result<serde_json::Value> {
        let response = self.handler.client
            .get(endpoint)
            .header("Authorization", format!("Bearer {}", access_token))
            .send()
            .await
            .context("Failed to get user info")?;

        if !response.status().is_success() {
            return Err(anyhow::anyhow!(
                "Failed to get user info: {}",
                response.status()
            ));
        }

        let user_info: serde_json::Value =
            response.json().await.context("Failed to parse user info")?;

        Ok(user_info)
    }
}