use super::{ApiKeyType, OAuthCredentials};
use anyhow::{Context, Result};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use url::Url;

/// Конфигурация OAuth для каждого сервиса
#[derive(Debug, Clone)]
pub struct OAuthConfig {
  pub auth_url: String,
  pub token_url: String,
  pub scopes: Vec<String>,
  pub redirect_uri: String,
}

/// Результат OAuth авторизации
#[derive(Debug, Serialize, Deserialize)]
pub struct OAuthResult {
  pub access_token: String,
  pub refresh_token: Option<String>,
  pub expires_in: Option<u64>,
  pub token_type: String,
  pub scope: Option<String>,
}

/// OAuth handler для различных сервисов
pub struct OAuthHandler {
  client: Client,
  redirect_uri: String,
}

impl OAuthHandler {
  pub fn new() -> Self {
    Self {
      client: Client::new(),
      redirect_uri: "http://localhost:3000/oauth/callback".to_string(),
    }
  }

  #[allow(dead_code)]
  pub fn with_redirect_uri(redirect_uri: String) -> Self {
    Self {
      client: Client::new(),
      redirect_uri,
    }
  }

  /// Получает конфигурацию OAuth для указанного сервиса
  pub fn get_oauth_config(&self, service: &ApiKeyType) -> Option<OAuthConfig> {
    match service {
      ApiKeyType::YouTube => Some(OAuthConfig {
        auth_url: "https://accounts.google.com/o/oauth2/v2/auth".to_string(),
        token_url: "https://oauth2.googleapis.com/token".to_string(),
        scopes: vec![
          "https://www.googleapis.com/auth/youtube.upload".to_string(),
          "https://www.googleapis.com/auth/youtube".to_string(),
        ],
        redirect_uri: self.redirect_uri.clone(),
      }),

      ApiKeyType::TikTok => Some(OAuthConfig {
        auth_url: "https://www.tiktok.com/auth/authorize/".to_string(),
        token_url: "https://open-api.tiktok.com/oauth/access_token/".to_string(),
        scopes: vec!["user.info.basic".to_string(), "video.upload".to_string()],
        redirect_uri: self.redirect_uri.clone(),
      }),

      ApiKeyType::Vimeo => Some(OAuthConfig {
        auth_url: "https://api.vimeo.com/oauth/authorize".to_string(),
        token_url: "https://api.vimeo.com/oauth/access_token".to_string(),
        scopes: vec![
          "public".to_string(),
          "private".to_string(),
          "upload".to_string(),
        ],
        redirect_uri: self.redirect_uri.clone(),
      }),

      _ => None,
    }
  }

  /// Генерирует URL для OAuth авторизации
  pub fn generate_auth_url(
    &self,
    service: ApiKeyType,
    client_id: &str,
    state: Option<&str>,
  ) -> Result<String> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut url = Url::parse(&config.auth_url).context("Invalid auth URL")?;

    let scopes_joined = config.scopes.join(" ");
    let mut query_params = vec![
      ("client_id", client_id),
      ("redirect_uri", &config.redirect_uri),
      ("response_type", "code"),
      ("scope", &scopes_joined),
    ];

    if let Some(state_value) = state {
      query_params.push(("state", state_value));
    }

    // Добавляем специфичные для сервиса параметры
    match &service {
      ApiKeyType::YouTube => {
        query_params.push(("access_type", "offline"));
        query_params.push(("prompt", "consent"));
      }
      ApiKeyType::TikTok => {
        query_params.push(("response_type", "code"));
      }
      _ => {}
    }

    url.query_pairs_mut().extend_pairs(query_params);

    Ok(url.to_string())
  }

  /// Обменивает authorization code на access token
  pub async fn exchange_code_for_token(
    &self,
    service: ApiKeyType,
    client_id: &str,
    client_secret: &str,
    code: &str,
  ) -> Result<OAuthResult> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut params = HashMap::new();
    params.insert("grant_type", "authorization_code");
    params.insert("code", code);
    params.insert("redirect_uri", &config.redirect_uri);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);

    let response = self
      .client
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

  /// Обновляет access token используя refresh token
  pub async fn refresh_access_token(
    &self,
    service: ApiKeyType,
    client_id: &str,
    client_secret: &str,
    refresh_token: &str,
  ) -> Result<OAuthResult> {
    let config = self
      .get_oauth_config(&service)
      .context("OAuth not supported for this service")?;

    let mut params = HashMap::new();
    params.insert("grant_type", "refresh_token");
    params.insert("refresh_token", refresh_token);
    params.insert("client_id", client_id);
    params.insert("client_secret", client_secret);

    let response = self
      .client
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

  /// Создает OAuthCredentials из результата обмена
  pub fn create_oauth_credentials(
    &self,
    client_id: String,
    client_secret: String,
    oauth_result: OAuthResult,
  ) -> OAuthCredentials {
    let expires_at = oauth_result
      .expires_in
      .map(|expires_in| chrono::Utc::now() + chrono::Duration::seconds(expires_in as i64));

    OAuthCredentials {
      client_id,
      client_secret,
      access_token: Some(oauth_result.access_token),
      refresh_token: oauth_result.refresh_token,
      expires_at,
    }
  }

  /// Проверяет, нужно ли обновить access token
  pub fn needs_refresh(&self, oauth_data: &OAuthCredentials) -> bool {
    if let Some(expires_at) = oauth_data.expires_at {
      // Обновляем за 5 минут до истечения
      let refresh_threshold = chrono::Utc::now() + chrono::Duration::minutes(5);
      expires_at <= refresh_threshold
    } else {
      false
    }
  }

  /// Автоматически обновляет токен если нужно
  pub async fn auto_refresh_if_needed(
    &self,
    service: ApiKeyType,
    oauth_data: &mut OAuthCredentials,
  ) -> Result<bool> {
    if !self.needs_refresh(oauth_data) {
      return Ok(false);
    }

    if let Some(refresh_token) = &oauth_data.refresh_token {
      match self
        .refresh_access_token(
          service.clone(),
          &oauth_data.client_id,
          &oauth_data.client_secret,
          refresh_token,
        )
        .await
      {
        Ok(new_token) => {
          oauth_data.access_token = Some(new_token.access_token);
          if let Some(new_refresh) = new_token.refresh_token {
            oauth_data.refresh_token = Some(new_refresh);
          }
          oauth_data.expires_at = new_token
            .expires_in
            .map(|expires_in| chrono::Utc::now() + chrono::Duration::seconds(expires_in as i64));
          Ok(true)
        }
        Err(e) => {
          log::warn!("Failed to auto-refresh token for {service:?}: {e}");
          Err(e)
        }
      }
    } else {
      Ok(false)
    }
  }

  /// Получает информацию о пользователе через OAuth API
  pub async fn get_user_info(
    &self,
    service: ApiKeyType,
    access_token: &str,
  ) -> Result<serde_json::Value> {
    let endpoint = match service {
      ApiKeyType::YouTube => "https://www.googleapis.com/oauth2/v2/userinfo",
      ApiKeyType::Vimeo => "https://api.vimeo.com/me",
      ApiKeyType::TikTok => "https://open-api.tiktok.com/oauth/userinfo/",
      _ => return Err(anyhow::anyhow!("User info not supported for this service")),
    };

    let response = self
      .client
      .get(endpoint)
      .header("Authorization", format!("Bearer {access_token}"))
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

impl Default for OAuthHandler {
  fn default() -> Self {
    Self::new()
  }
}

/// Утилиты для работы с OAuth callback URL
pub mod callback_utils {
  use super::*;
  use std::collections::HashMap;

  /// Парсит параметры из OAuth callback URL
  pub fn parse_callback_url(url: &str) -> Result<HashMap<String, String>> {
    let parsed_url = Url::parse(url).context("Invalid callback URL")?;

    let mut params = HashMap::new();

    for (key, value) in parsed_url.query_pairs() {
      params.insert(key.to_string(), value.to_string());
    }

    Ok(params)
  }

  /// Извлекает authorization code из callback параметров
  pub fn extract_auth_code(params: &HashMap<String, String>) -> Result<String> {
    params
      .get("code")
      .cloned()
      .context("No authorization code in callback")
  }

  /// Извлекает state параметр из callback
  pub fn extract_state(params: &HashMap<String, String>) -> Option<String> {
    params.get("state").cloned()
  }

  /// Проверяет наличие ошибки в callback
  pub fn extract_error(params: &HashMap<String, String>) -> Option<String> {
    params.get("error").cloned()
  }
}
