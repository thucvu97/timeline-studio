use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::str::FromStr;
use tauri::{AppHandle, State};
use tokio::sync::Mutex;

use super::api_validator::{ApiValidator, ValidationResult};
use super::env_importer::EnvImporter;
use super::oauth_handler::OAuthHandler;
use super::{ApiKeyData, ApiKeyType, OAuthCredentials, SecureStorage};

/// State для хранения SecureStorage
pub type SecureStorageState<'a> = State<'a, Mutex<SecureStorage>>;

/// Результат операции с API ключом
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyOperationResult {
  pub success: bool,
  pub message: String,
  pub data: Option<serde_json::Value>,
}

/// Информация об API ключе для frontend
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyInfo {
  pub key_type: String,
  pub has_value: bool,
  pub is_oauth: bool,
  pub has_access_token: bool,
  pub created_at: Option<String>,
  pub last_validated: Option<String>,
  pub is_valid: Option<bool>,
}

/// Параметры для сохранения простого API ключа
#[derive(Debug, Deserialize)]
pub struct SaveSimpleApiKeyParams {
  pub key_type: String,
  pub value: String,
}

/// Параметры для сохранения OAuth credentials
#[derive(Debug, Deserialize)]
pub struct SaveOAuthCredentialsParams {
  pub key_type: String,
  pub client_id: String,
  pub client_secret: String,
  pub access_token: Option<String>,
  pub refresh_token: Option<String>,
}

/// Сохраняет простой API ключ
#[tauri::command]
pub async fn save_simple_api_key(
  storage: SecureStorageState<'_>,
  params: SaveSimpleApiKeyParams,
) -> Result<ApiKeyOperationResult, String> {
  let key_type =
    ApiKeyType::from_str(&params.key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard
    .save_simple_api_key(key_type, params.value)
    .await
  {
    Ok(_) => Ok(ApiKeyOperationResult {
      success: true,
      message: "API key saved successfully".to_string(),
      data: None,
    }),
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("Failed to save API key: {}", e),
      data: None,
    }),
  }
}

/// Сохраняет OAuth credentials
#[tauri::command]
pub async fn save_oauth_credentials(
  storage: SecureStorageState<'_>,
  params: SaveOAuthCredentialsParams,
) -> Result<ApiKeyOperationResult, String> {
  let key_type =
    ApiKeyType::from_str(&params.key_type).map_err(|_| "Invalid key type".to_string())?;

  let oauth_data = OAuthCredentials {
    client_id: params.client_id.clone(),
    client_secret: params.client_secret,
    access_token: params.access_token,
    refresh_token: params.refresh_token,
    expires_at: None,
  };

  let key_data = ApiKeyData {
    key_type,
    value: params.client_id, // Используем client_id как основное значение
    oauth_data: Some(oauth_data),
    created_at: chrono::Utc::now(),
    last_validated: None,
    is_valid: None,
  };

  let mut storage_guard = storage.lock().await;

  match storage_guard.save_api_key(key_data).await {
    Ok(_) => Ok(ApiKeyOperationResult {
      success: true,
      message: "OAuth credentials saved successfully".to_string(),
      data: None,
    }),
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("Failed to save OAuth credentials: {}", e),
      data: None,
    }),
  }
}

/// Получает информацию об API ключе
#[tauri::command]
pub async fn get_api_key_info(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<Option<ApiKeyInfo>, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.get_api_key(key_type.clone()).await {
    Ok(Some(key_data)) => {
      let info = ApiKeyInfo {
        key_type: key_type.as_str().to_string(),
        has_value: !key_data.value.is_empty(),
        is_oauth: key_data.oauth_data.is_some(),
        has_access_token: key_data
          .oauth_data
          .as_ref()
          .and_then(|oauth| oauth.access_token.as_ref())
          .is_some(),
        created_at: Some(key_data.created_at.format("%Y-%m-%d %H:%M:%S").to_string()),
        last_validated: key_data
          .last_validated
          .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string()),
        is_valid: key_data.is_valid,
      };
      Ok(Some(info))
    }
    Ok(None) => Ok(None),
    Err(e) => Err(format!("Failed to get API key info: {}", e)),
  }
}

/// Получает расшифрованное значение API ключа для использования в сервисах
#[tauri::command]
pub async fn get_decrypted_api_key(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<Option<String>, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.get_api_key(key_type).await {
    Ok(Some(key_data)) => Ok(Some(key_data.value)),
    Ok(None) => Ok(None),
    Err(e) => Err(format!("Failed to get API key: {}", e)),
  }
}

/// Получает список всех API ключей
#[tauri::command]
pub async fn list_api_keys(storage: SecureStorageState<'_>) -> Result<Vec<ApiKeyInfo>, String> {
  let mut storage_guard = storage.lock().await;

  match storage_guard.list_api_keys().await {
    Ok(key_types) => {
      let mut result = Vec::new();

      for key_type in key_types {
        if let Ok(Some(key_data)) = storage_guard.get_api_key(key_type.clone()).await {
          let info = ApiKeyInfo {
            key_type: key_type.as_str().to_string(),
            has_value: !key_data.value.is_empty(),
            is_oauth: key_data.oauth_data.is_some(),
            has_access_token: key_data
              .oauth_data
              .as_ref()
              .and_then(|oauth| oauth.access_token.as_ref())
              .is_some(),
            created_at: Some(key_data.created_at.format("%Y-%m-%d %H:%M:%S").to_string()),
            last_validated: key_data
              .last_validated
              .map(|dt| dt.format("%Y-%m-%d %H:%M:%S").to_string()),
            is_valid: key_data.is_valid,
          };
          result.push(info);
        }
      }

      Ok(result)
    }
    Err(e) => Err(format!("Failed to list API keys: {}", e)),
  }
}

/// Удаляет API ключ
#[tauri::command]
pub async fn delete_api_key(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<ApiKeyOperationResult, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.delete_api_key(key_type).await {
    Ok(_) => Ok(ApiKeyOperationResult {
      success: true,
      message: "API key deleted successfully".to_string(),
      data: None,
    }),
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("Failed to delete API key: {}", e),
      data: None,
    }),
  }
}

/// Валидирует API ключ
#[tauri::command]
pub async fn validate_api_key(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<ValidationResult, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.get_api_key(key_type.clone()).await {
    Ok(Some(key_data)) => {
      let validator = ApiValidator::new();

      let result = if let Some(oauth_data) = &key_data.oauth_data {
        validator
          .validate_oauth_credentials(key_type.clone(), oauth_data)
          .await
      } else {
        validator
          .validate_api_key(key_type.clone(), &key_data.value)
          .await
      };

      match result {
        Ok(validation_result) => {
          // Обновляем статус валидации в storage
          if let Err(e) = storage_guard
            .update_validation_status(key_type, validation_result.is_valid)
            .await
          {
            log::warn!("Failed to update validation status: {}", e);
          }

          Ok(validation_result)
        }
        Err(e) => Err(format!("Validation failed: {}", e)),
      }
    }
    Ok(None) => Err("API key not found".to_string()),
    Err(e) => Err(format!("Failed to get API key: {}", e)),
  }
}

/// Генерирует OAuth URL для авторизации
#[tauri::command]
pub fn generate_oauth_url(
  key_type: String,
  client_id: String,
  state: Option<String>,
) -> Result<String, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let oauth_handler = OAuthHandler::new();

  match oauth_handler.generate_auth_url(key_type, &client_id, state.as_deref()) {
    Ok(url) => Ok(url),
    Err(e) => Err(format!("Failed to generate OAuth URL: {}", e)),
  }
}

/// Обменивает authorization code на access token
#[tauri::command]
pub async fn exchange_oauth_code(
  storage: SecureStorageState<'_>,
  key_type: String,
  client_id: String,
  client_secret: String,
  code: String,
) -> Result<ApiKeyOperationResult, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let oauth_handler = OAuthHandler::new();

  match oauth_handler
    .exchange_code_for_token(key_type.clone(), &client_id, &client_secret, &code)
    .await
  {
    Ok(oauth_result) => {
      // Создаем OAuth credentials
      let oauth_credentials =
        oauth_handler.create_oauth_credentials(client_id, client_secret, oauth_result);

      // Сохраняем в storage
      let key_data = ApiKeyData {
        key_type,
        value: oauth_credentials.client_id.clone(),
        oauth_data: Some(oauth_credentials),
        created_at: chrono::Utc::now(),
        last_validated: None,
        is_valid: None,
      };

      let mut storage_guard = storage.lock().await;

      match storage_guard.save_api_key(key_data).await {
        Ok(_) => Ok(ApiKeyOperationResult {
          success: true,
          message: "OAuth token exchange successful".to_string(),
          data: None,
        }),
        Err(e) => Ok(ApiKeyOperationResult {
          success: false,
          message: format!("Failed to save OAuth token: {}", e),
          data: None,
        }),
      }
    }
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("OAuth token exchange failed: {}", e),
      data: None,
    }),
  }
}

/// Импортирует API ключи из .env файла
#[tauri::command]
pub async fn import_from_env(
  storage: SecureStorageState<'_>,
  env_file_path: Option<String>,
) -> Result<ApiKeyOperationResult, String> {
  let importer = if let Some(path) = env_file_path {
    EnvImporter::with_env_file(path)
  } else {
    EnvImporter::new()
  };

  match importer.import_all_api_keys() {
    Ok(imported_keys) => {
      let mut storage_guard = storage.lock().await;
      let mut saved_count = 0;
      let mut errors = Vec::new();

      for key_data in imported_keys {
        match storage_guard.save_api_key(key_data.clone()).await {
          Ok(_) => saved_count += 1,
          Err(e) => {
            errors.push(format!("{}: {}", key_data.key_type.as_str(), e));
          }
        }
      }

      let message = if errors.is_empty() {
        format!("Successfully imported {} API keys", saved_count)
      } else {
        format!(
          "Imported {} API keys with {} errors: {}",
          saved_count,
          errors.len(),
          errors.join(", ")
        )
      };

      Ok(ApiKeyOperationResult {
        success: errors.is_empty(),
        message,
        data: Some(serde_json::json!({
            "imported_count": saved_count,
            "errors": errors
        })),
      })
    }
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("Failed to import from .env: {}", e),
      data: None,
    }),
  }
}

/// Экспортирует API ключи в .env формат
#[tauri::command]
pub async fn export_to_env_format(storage: SecureStorageState<'_>) -> Result<String, String> {
  let mut storage_guard = storage.lock().await;

  match storage_guard.export_all_keys().await {
    Ok(keys_map) => {
      let keys_vec: Vec<ApiKeyData> = keys_map.into_values().collect();
      let importer = EnvImporter::new();
      Ok(importer.export_to_env_format(&keys_vec))
    }
    Err(e) => Err(format!("Failed to export keys: {}", e)),
  }
}

/// Обновляет OAuth access token используя refresh token
#[tauri::command]
pub async fn refresh_oauth_token(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<ApiKeyOperationResult, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.get_api_key(key_type.clone()).await {
    Ok(Some(mut key_data)) => {
      if let Some(mut oauth_data) = key_data.oauth_data {
        let oauth_handler = OAuthHandler::new();

        match oauth_handler
          .auto_refresh_if_needed(key_type.clone(), &mut oauth_data)
          .await
        {
          Ok(refreshed) => {
            if refreshed {
              // Обновляем данные в storage
              key_data.oauth_data = Some(oauth_data);
              key_data.last_validated = Some(chrono::Utc::now());
              key_data.is_valid = Some(true);

              if let Err(e) = storage_guard.save_api_key(key_data).await {
                return Ok(ApiKeyOperationResult {
                  success: false,
                  message: format!("Failed to save refreshed token: {}", e),
                  data: None,
                });
              }

              Ok(ApiKeyOperationResult {
                success: true,
                message: "OAuth token refreshed successfully".to_string(),
                data: None,
              })
            } else {
              Ok(ApiKeyOperationResult {
                success: true,
                message: "Token refresh not needed".to_string(),
                data: None,
              })
            }
          }
          Err(e) => Ok(ApiKeyOperationResult {
            success: false,
            message: format!("Token refresh failed: {}", e),
            data: None,
          }),
        }
      } else {
        Ok(ApiKeyOperationResult {
          success: false,
          message: "Not an OAuth key".to_string(),
          data: None,
        })
      }
    }
    Ok(None) => Ok(ApiKeyOperationResult {
      success: false,
      message: "API key not found".to_string(),
      data: None,
    }),
    Err(e) => Ok(ApiKeyOperationResult {
      success: false,
      message: format!("Failed to get API key: {}", e),
      data: None,
    }),
  }
}

/// Получает информацию о пользователе через OAuth API
#[tauri::command]
pub async fn get_oauth_user_info(
  storage: SecureStorageState<'_>,
  key_type: String,
) -> Result<serde_json::Value, String> {
  let key_type = ApiKeyType::from_str(&key_type).map_err(|_| "Invalid key type".to_string())?;

  let mut storage_guard = storage.lock().await;

  match storage_guard.get_api_key(key_type.clone()).await {
    Ok(Some(key_data)) => {
      if let Some(oauth_data) = &key_data.oauth_data {
        if let Some(access_token) = &oauth_data.access_token {
          let oauth_handler = OAuthHandler::new();

          match oauth_handler.get_user_info(key_type, access_token).await {
            Ok(user_info) => Ok(user_info),
            Err(e) => Err(format!("Failed to get user info: {}", e)),
          }
        } else {
          Err("No access token available".to_string())
        }
      } else {
        Err("Not an OAuth key".to_string())
      }
    }
    Ok(None) => Err("API key not found".to_string()),
    Err(e) => Err(format!("Failed to get API key: {}", e)),
  }
}

/// Парсит OAuth callback URL и извлекает параметры
#[tauri::command]
pub fn parse_oauth_callback_url(url: String) -> Result<serde_json::Value, String> {
  use super::oauth_handler::callback_utils;

  match callback_utils::parse_callback_url(&url) {
    Ok(params) => {
      let result = serde_json::json!({
        "code": callback_utils::extract_auth_code(&params).ok(),
        "state": callback_utils::extract_state(&params),
        "error": callback_utils::extract_error(&params),
        "all_params": params
      });
      Ok(result)
    }
    Err(e) => Err(format!("Failed to parse callback URL: {}", e)),
  }
}

/// Инициализирует SecureStorage
#[allow(dead_code)]
pub async fn init_secure_storage(app_handle: AppHandle) -> Result<SecureStorage, String> {
  SecureStorage::new(app_handle).map_err(|e| format!("Failed to initialize secure storage: {}", e))
}
