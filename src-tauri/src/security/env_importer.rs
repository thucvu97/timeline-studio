use super::{ApiKeyData, ApiKeyType, OAuthCredentials};
use anyhow::{Context, Result};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::Path;

/// Импортер для загрузки API ключей из .env файлов
pub struct EnvImporter {
  env_file_path: Option<String>,
}

impl EnvImporter {
  /// Создает новый импортер
  pub fn new() -> Self {
    Self {
      env_file_path: None,
    }
  }

  /// Создает импортер с указанным путем к .env файлу
  pub fn with_env_file<P: AsRef<Path>>(env_file_path: P) -> Self {
    Self {
      env_file_path: Some(env_file_path.as_ref().to_string_lossy().to_string()),
    }
  }

  /// Загружает .env файл если указан путь
  pub fn load_env_file(&self) -> Result<()> {
    if let Some(env_path) = &self.env_file_path {
      if Path::new(env_path).exists() {
        let content = fs::read_to_string(env_path).context("Failed to read .env file")?;

        for line in content.lines() {
          let line = line.trim();
          if line.is_empty() || line.starts_with('#') {
            continue;
          }

          if let Some((key, value)) = line.split_once('=') {
            let key = key.trim();
            let value = value.trim().trim_matches('"').trim_matches('\'');
            env::set_var(key, value);
          }
        }

        log::info!("Loaded .env file: {}", env_path);
      } else {
        log::warn!(".env file not found: {}", env_path);
      }
    }

    Ok(())
  }

  /// Импортирует все доступные API ключи из переменных окружения
  pub fn import_all_api_keys(&self) -> Result<Vec<ApiKeyData>> {
    // Сначала загружаем .env файл если указан
    self.load_env_file()?;

    let mut imported_keys = Vec::new();

    // Карта переменных окружения для каждого типа ключа
    let env_mappings = self.get_env_mappings();

    for (key_type, env_vars) in env_mappings {
      if let Some(key_data) = self.import_single_api_key(key_type, &env_vars)? {
        imported_keys.push(key_data);
      }
    }

    log::info!("Imported {} API keys from environment", imported_keys.len());
    Ok(imported_keys)
  }

  /// Импортирует конкретный API ключ
  #[allow(dead_code)]
  pub fn import_api_key(&self, key_type: ApiKeyType) -> Result<Option<ApiKeyData>> {
    self.load_env_file()?;

    let env_mappings = self.get_env_mappings();
    if let Some(env_vars) = env_mappings.get(&key_type) {
      self.import_single_api_key(key_type, env_vars)
    } else {
      Ok(None)
    }
  }

  /// Получает карту переменных окружения для каждого типа ключа
  fn get_env_mappings(&self) -> HashMap<ApiKeyType, Vec<String>> {
    let mut mappings = HashMap::new();

    // AI сервисы
    mappings.insert(
      ApiKeyType::OpenAI,
      vec!["OPENAI_API_KEY".to_string(), "OPENAI_KEY".to_string()],
    );

    mappings.insert(
      ApiKeyType::Claude,
      vec![
        "CLAUDE_API_KEY".to_string(),
        "ANTHROPIC_API_KEY".to_string(),
        "CLAUDE_KEY".to_string(),
      ],
    );

    // Социальные сети - OAuth credentials
    mappings.insert(
      ApiKeyType::YouTube,
      vec![
        "YOUTUBE_CLIENT_ID".to_string(),
        "YOUTUBE_CLIENT_SECRET".to_string(),
        "GOOGLE_CLIENT_ID".to_string(),
        "GOOGLE_CLIENT_SECRET".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::TikTok,
      vec![
        "TIKTOK_CLIENT_ID".to_string(),
        "TIKTOK_CLIENT_SECRET".to_string(),
        "TIKTOK_CLIENT_KEY".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::Vimeo,
      vec![
        "VIMEO_CLIENT_ID".to_string(),
        "VIMEO_CLIENT_SECRET".to_string(),
        "VIMEO_ACCESS_TOKEN".to_string(),
      ],
    );

    mappings.insert(
      ApiKeyType::Telegram,
      vec![
        "TELEGRAM_BOT_TOKEN".to_string(),
        "TELEGRAM_CHAT_ID".to_string(),
        "TELEGRAM_CHANNEL_ID".to_string(),
      ],
    );

    // Разработка
    mappings.insert(
      ApiKeyType::Codecov,
      vec!["CODECOV_TOKEN".to_string(), "CODECOV_API_TOKEN".to_string()],
    );

    mappings.insert(
      ApiKeyType::TauriAnalytics,
      vec![
        "TAURI_ANALYTICS_KEY".to_string(),
        "TAURI_ANALYTICS_TOKEN".to_string(),
      ],
    );

    mappings
  }

  /// Импортирует один API ключ по типу и списку переменных
  fn import_single_api_key(
    &self,
    key_type: ApiKeyType,
    _env_vars: &[String],
  ) -> Result<Option<ApiKeyData>> {
    match key_type {
      // Простые API ключи
      ApiKeyType::OpenAI
      | ApiKeyType::Claude
      | ApiKeyType::Codecov
      | ApiKeyType::TauriAnalytics => {
        for env_var in _env_vars {
          if let Ok(value) = env::var(env_var) {
            if !value.is_empty() {
              return Ok(Some(ApiKeyData {
                key_type,
                value,
                oauth_data: None,
                created_at: chrono::Utc::now(),
                last_validated: None,
                is_valid: None,
              }));
            }
          }
        }
        Ok(None)
      }

      // OAuth сервисы
      ApiKeyType::YouTube => self.import_youtube_oauth(_env_vars),
      ApiKeyType::TikTok => self.import_tiktok_oauth(_env_vars),
      ApiKeyType::Vimeo => self.import_vimeo_oauth(_env_vars),
      ApiKeyType::Telegram => self.import_telegram_credentials(_env_vars),
    }
  }

  /// Импортирует YouTube OAuth credentials
  fn import_youtube_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["YOUTUBE_CLIENT_ID", "GOOGLE_CLIENT_ID"]);

    let client_secret = self.find_env_value(&["YOUTUBE_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"]);

    if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::YouTube,
        value: client_id, // Используем client_id как основное значение
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует TikTok OAuth credentials
  fn import_tiktok_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["TIKTOK_CLIENT_ID", "TIKTOK_CLIENT_KEY"]);

    let client_secret = self.find_env_value(&["TIKTOK_CLIENT_SECRET"]);

    if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::TikTok,
        value: client_id,
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует Vimeo credentials
  fn import_vimeo_oauth(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let client_id = self.find_env_value(&["VIMEO_CLIENT_ID"]);
    let client_secret = self.find_env_value(&["VIMEO_CLIENT_SECRET"]);
    let access_token = self.find_env_value(&["VIMEO_ACCESS_TOKEN"]);

    if let Some(access_token) = access_token {
      // Если есть access token, создаем OAuth credentials
      let oauth_data = if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
        Some(OAuthCredentials {
          client_id,
          client_secret,
          access_token: Some(access_token.clone()),
          refresh_token: None,
          expires_at: None,
        })
      } else {
        None
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Vimeo,
        value: access_token,
        oauth_data,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else if let (Some(client_id), Some(client_secret)) = (client_id, client_secret) {
      // Только OAuth credentials без access token
      let oauth_data = OAuthCredentials {
        client_id: client_id.clone(),
        client_secret,
        access_token: None,
        refresh_token: None,
        expires_at: None,
      };

      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Vimeo,
        value: client_id,
        oauth_data: Some(oauth_data),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Импортирует Telegram bot credentials
  fn import_telegram_credentials(&self, _env_vars: &[String]) -> Result<Option<ApiKeyData>> {
    let bot_token = self.find_env_value(&["TELEGRAM_BOT_TOKEN"]);

    if let Some(bot_token) = bot_token {
      Ok(Some(ApiKeyData {
        key_type: ApiKeyType::Telegram,
        value: bot_token,
        oauth_data: None,
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      }))
    } else {
      Ok(None)
    }
  }

  /// Ищет значение в списке переменных окружения
  fn find_env_value(&self, env_names: &[&str]) -> Option<String> {
    for env_name in env_names {
      if let Ok(value) = env::var(env_name) {
        if !value.is_empty() {
          return Some(value);
        }
      }
    }
    None
  }

  /// Экспортирует API ключи в .env формат
  pub fn export_to_env_format(&self, api_keys: &[ApiKeyData]) -> String {
    let mut env_content = String::new();
    env_content.push_str("# Timeline Studio API Keys\n");
    env_content.push_str("# Generated by EnvImporter\n");
    env_content.push_str(&format!(
      "# Generated at: {}\n\n",
      chrono::Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    ));

    for key_data in api_keys {
      match key_data.key_type {
        ApiKeyType::OpenAI => {
          env_content.push_str(&format!("OPENAI_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::Claude => {
          env_content.push_str(&format!("CLAUDE_API_KEY=\"{}\"\n", key_data.value));
        }
        ApiKeyType::YouTube => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("YOUTUBE_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "YOUTUBE_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
            if let Some(access_token) = &oauth_data.access_token {
              env_content.push_str(&format!("YOUTUBE_ACCESS_TOKEN=\"{}\"\n", access_token));
            }
          }
        }
        ApiKeyType::TikTok => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("TIKTOK_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "TIKTOK_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
          }
        }
        ApiKeyType::Vimeo => {
          if let Some(oauth_data) = &key_data.oauth_data {
            env_content.push_str(&format!("VIMEO_CLIENT_ID=\"{}\"\n", oauth_data.client_id));
            env_content.push_str(&format!(
              "VIMEO_CLIENT_SECRET=\"{}\"\n",
              oauth_data.client_secret
            ));
            if let Some(access_token) = &oauth_data.access_token {
              env_content.push_str(&format!("VIMEO_ACCESS_TOKEN=\"{}\"\n", access_token));
            }
          } else {
            env_content.push_str(&format!("VIMEO_ACCESS_TOKEN=\"{}\"\n", key_data.value));
          }
        }
        ApiKeyType::Telegram => {
          env_content.push_str(&format!("TELEGRAM_BOT_TOKEN=\"{}\"\n", key_data.value));
        }
        ApiKeyType::Codecov => {
          env_content.push_str(&format!("CODECOV_TOKEN=\"{}\"\n", key_data.value));
        }
        ApiKeyType::TauriAnalytics => {
          env_content.push_str(&format!("TAURI_ANALYTICS_KEY=\"{}\"\n", key_data.value));
        }
      }
      env_content.push('\n');
    }

    env_content
  }

  /// Проверяет наличие .env файла в стандартных местах
  #[allow(dead_code)]
  pub fn find_env_file() -> Option<String> {
    let possible_paths = [".env", ".env.local", "../.env", "../../.env"];

    for path in &possible_paths {
      if Path::new(path).exists() {
        return Some(path.to_string());
      }
    }

    None
  }
}

impl Default for EnvImporter {
  fn default() -> Self {
    Self::new()
  }
}
