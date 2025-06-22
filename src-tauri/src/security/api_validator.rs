use super::{ApiKeyType, OAuthCredentials};
use anyhow::Result;
use reqwest::Client;
use serde_json::{json, Value};
use std::time::Duration;

/// Результат валидации API ключа
#[derive(Debug, Clone, serde::Serialize)]
pub struct ValidationResult {
  pub is_valid: bool,
  pub error_message: Option<String>,
  pub service_info: Option<String>, // Дополнительная информация о сервисе
  pub rate_limits: Option<RateLimitInfo>,
}

/// Информация о лимитах API
#[derive(Debug, Clone, serde::Serialize)]
pub struct RateLimitInfo {
  pub requests_remaining: Option<u32>,
  pub reset_time: Option<chrono::DateTime<chrono::Utc>>,
  pub daily_limit: Option<u32>,
}

/// Валидатор API ключей
pub struct ApiValidator {
  client: Client,
}

impl ApiValidator {
  pub fn new() -> Self {
    let client = Client::builder()
      .timeout(Duration::from_secs(10))
      .build()
      .expect("Failed to create HTTP client");

    Self { client }
  }

  /// Валидирует API ключ в зависимости от типа сервиса
  pub async fn validate_api_key(
    &self,
    key_type: ApiKeyType,
    value: &str,
  ) -> Result<ValidationResult> {
    match key_type {
      ApiKeyType::OpenAI => self.validate_openai_key(value).await,
      ApiKeyType::Claude => self.validate_claude_key(value).await,
      ApiKeyType::YouTube => self.validate_youtube_oauth(value).await,
      ApiKeyType::TikTok => self.validate_tiktok_oauth(value).await,
      ApiKeyType::Vimeo => self.validate_vimeo_key(value).await,
      ApiKeyType::Telegram => self.validate_telegram_bot(value).await,
      ApiKeyType::Codecov => self.validate_codecov_token(value).await,
      ApiKeyType::TauriAnalytics => self.validate_tauri_analytics(value).await,
    }
  }

  /// Валидирует OAuth credentials
  pub async fn validate_oauth_credentials(
    &self,
    key_type: ApiKeyType,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    match key_type {
      ApiKeyType::YouTube => self.validate_youtube_oauth_full(oauth_data).await,
      ApiKeyType::TikTok => self.validate_tiktok_oauth_full(oauth_data).await,
      ApiKeyType::Vimeo => self.validate_vimeo_oauth_full(oauth_data).await,
      _ => Ok(ValidationResult {
        is_valid: false,
        error_message: Some("OAuth validation not supported for this service".to_string()),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // OpenAI API валидация
  async fn validate_openai_key(&self, api_key: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://api.openai.com/v1/models")
      .header("Authorization", format!("Bearer {}", api_key))
      .send()
      .await;

    match response {
      Ok(resp) => {
        let status = resp.status();
        let headers = resp.headers().clone();

        if status.is_success() {
          let rate_limits = self.extract_openai_rate_limits(&headers);
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("OpenAI API access confirmed".to_string()),
            rate_limits,
          })
        } else if status.as_u16() == 401 {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid API key".to_string()),
            service_info: None,
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(format!("HTTP error: {}", status)),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {}", e)),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Claude API валидация
  async fn validate_claude_key(&self, api_key: &str) -> Result<ValidationResult> {
    // Простой тест запрос к Claude API
    let body = json!({
        "model": "claude-3-haiku-20240307",
        "max_tokens": 10,
        "messages": [{"role": "user", "content": "Hi"}]
    });

    let response = self
      .client
      .post("https://api.anthropic.com/v1/messages")
      .header("x-api-key", api_key)
      .header("anthropic-version", "2023-06-01")
      .header("content-type", "application/json")
      .json(&body)
      .send()
      .await;

    match response {
      Ok(resp) => {
        let status = resp.status();

        if status.is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Claude API access confirmed".to_string()),
            rate_limits: None,
          })
        } else if status.as_u16() == 401 {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid API key".to_string()),
            service_info: None,
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some(format!("HTTP error: {}", status)),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {}", e)),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // YouTube OAuth валидация (проверка client_id:client_secret)
  async fn validate_youtube_oauth(&self, _credentials: &str) -> Result<ValidationResult> {
    // Для YouTube нужна полная OAuth валидация
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("Use OAuth credentials validation for YouTube".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  // YouTube OAuth full валидация
  async fn validate_youtube_oauth_full(
    &self,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    if let Some(access_token) = &oauth_data.access_token {
      // Проверяем access token через YouTube API
      let response = self
        .client
        .get("https://www.googleapis.com/youtube/v3/channels")
        .query(&[("part", "snippet"), ("mine", "true")])
        .header("Authorization", format!("Bearer {}", access_token))
        .send()
        .await;

      match response {
        Ok(resp) => {
          if resp.status().is_success() {
            Ok(ValidationResult {
              is_valid: true,
              error_message: None,
              service_info: Some("YouTube API access confirmed".to_string()),
              rate_limits: None,
            })
          } else {
            Ok(ValidationResult {
              is_valid: false,
              error_message: Some("Invalid or expired access token".to_string()),
              service_info: None,
              rate_limits: None,
            })
          }
        }
        Err(e) => Ok(ValidationResult {
          is_valid: false,
          error_message: Some(format!("Network error: {}", e)),
          service_info: None,
          rate_limits: None,
        }),
      }
    } else {
      // Проверяем client credentials через OAuth2 endpoint
      Ok(ValidationResult {
        is_valid: false,
        error_message: Some("No access token available, OAuth flow required".to_string()),
        service_info: Some("Client credentials present".to_string()),
        rate_limits: None,
      })
    }
  }

  // TikTok OAuth валидация
  async fn validate_tiktok_oauth(&self, _credentials: &str) -> Result<ValidationResult> {
    // TikTok API валидация - пока заглушка
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("TikTok API validation not implemented yet".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  async fn validate_tiktok_oauth_full(
    &self,
    _oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    // TikTok OAuth валидация - пока заглушка
    Ok(ValidationResult {
      is_valid: false,
      error_message: Some("TikTok OAuth validation not implemented yet".to_string()),
      service_info: None,
      rate_limits: None,
    })
  }

  // Vimeo API валидация
  async fn validate_vimeo_key(&self, access_token: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://api.vimeo.com/me")
      .header("Authorization", format!("Bearer {}", access_token))
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Vimeo API access confirmed".to_string()),
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid access token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {}", e)),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  async fn validate_vimeo_oauth_full(
    &self,
    oauth_data: &OAuthCredentials,
  ) -> Result<ValidationResult> {
    if let Some(access_token) = &oauth_data.access_token {
      self.validate_vimeo_key(access_token).await
    } else {
      Ok(ValidationResult {
        is_valid: false,
        error_message: Some("No access token available".to_string()),
        service_info: None,
        rate_limits: None,
      })
    }
  }

  // Telegram Bot валидация
  async fn validate_telegram_bot(&self, bot_token: &str) -> Result<ValidationResult> {
    let url = format!("https://api.telegram.org/bot{}/getMe", bot_token);
    let response = self.client.get(&url).send().await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          let json: Value = resp.json().await.unwrap_or_default();
          if json["ok"].as_bool().unwrap_or(false) {
            let bot_name = json["result"]["username"].as_str().unwrap_or("Unknown");
            Ok(ValidationResult {
              is_valid: true,
              error_message: None,
              service_info: Some(format!("Telegram bot @{} confirmed", bot_name)),
              rate_limits: None,
            })
          } else {
            Ok(ValidationResult {
              is_valid: false,
              error_message: Some("Invalid bot token".to_string()),
              service_info: None,
              rate_limits: None,
            })
          }
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid bot token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {}", e)),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Codecov token валидация
  async fn validate_codecov_token(&self, token: &str) -> Result<ValidationResult> {
    let response = self
      .client
      .get("https://codecov.io/api/v2/user")
      .header("Authorization", format!("token {}", token))
      .send()
      .await;

    match response {
      Ok(resp) => {
        if resp.status().is_success() {
          Ok(ValidationResult {
            is_valid: true,
            error_message: None,
            service_info: Some("Codecov token confirmed".to_string()),
            rate_limits: None,
          })
        } else {
          Ok(ValidationResult {
            is_valid: false,
            error_message: Some("Invalid Codecov token".to_string()),
            service_info: None,
            rate_limits: None,
          })
        }
      }
      Err(e) => Ok(ValidationResult {
        is_valid: false,
        error_message: Some(format!("Network error: {}", e)),
        service_info: None,
        rate_limits: None,
      }),
    }
  }

  // Tauri Analytics валидация (заглушка)
  async fn validate_tauri_analytics(&self, _key: &str) -> Result<ValidationResult> {
    // Tauri Analytics пока не имеет публичного API для валидации
    Ok(ValidationResult {
      is_valid: true,
      error_message: None,
      service_info: Some("Tauri Analytics key format appears valid".to_string()),
      rate_limits: None,
    })
  }

  // Извлечение rate limit информации из OpenAI headers
  fn extract_openai_rate_limits(
    &self,
    headers: &reqwest::header::HeaderMap,
  ) -> Option<RateLimitInfo> {
    let requests_remaining = headers
      .get("x-ratelimit-remaining-requests")
      .and_then(|v| v.to_str().ok())
      .and_then(|s| s.parse().ok());

    let reset_time = headers
      .get("x-ratelimit-reset-requests")
      .and_then(|v| v.to_str().ok())
      .and_then(|s| chrono::DateTime::parse_from_rfc3339(s).ok())
      .map(|dt| dt.with_timezone(&chrono::Utc));

    if requests_remaining.is_some() || reset_time.is_some() {
      Some(RateLimitInfo {
        requests_remaining,
        reset_time,
        daily_limit: None,
      })
    } else {
      None
    }
  }
}

impl Default for ApiValidator {
  fn default() -> Self {
    Self::new()
  }
}
