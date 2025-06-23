use aes_gcm::{
  aead::{Aead, AeadCore, KeyInit, OsRng},
  Aes256Gcm, Key, Nonce,
};
use anyhow::{Context, Result};
use argon2::Argon2;
use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri_plugin_store::{Store, StoreBuilder};
use uuid::Uuid;

/// Тип API ключа для определения сервиса
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum ApiKeyType {
  // AI сервисы
  OpenAI,
  Claude,
  DeepSeek,

  // Социальные сети
  YouTube,
  TikTok,
  Vimeo,
  Telegram,

  // Разработка
  Codecov,
  TauriAnalytics,
}

impl ApiKeyType {
  pub fn as_str(&self) -> &'static str {
    match self {
      ApiKeyType::OpenAI => "openai",
      ApiKeyType::Claude => "claude",
      ApiKeyType::DeepSeek => "deepseek",
      ApiKeyType::YouTube => "youtube",
      ApiKeyType::TikTok => "tiktok",
      ApiKeyType::Vimeo => "vimeo",
      ApiKeyType::Telegram => "telegram",
      ApiKeyType::Codecov => "codecov",
      ApiKeyType::TauriAnalytics => "tauri_analytics",
    }
  }

  pub fn from_str(s: &str) -> Option<Self> {
    match s {
      "openai" => Some(ApiKeyType::OpenAI),
      "claude" => Some(ApiKeyType::Claude),
      "deepseek" => Some(ApiKeyType::DeepSeek),
      "youtube" => Some(ApiKeyType::YouTube),
      "tiktok" => Some(ApiKeyType::TikTok),
      "vimeo" => Some(ApiKeyType::Vimeo),
      "telegram" => Some(ApiKeyType::Telegram),
      "codecov" => Some(ApiKeyType::Codecov),
      "tauri_analytics" => Some(ApiKeyType::TauriAnalytics),
      _ => None,
    }
  }
}

/// Структура для хранения OAuth данных
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OAuthCredentials {
  pub client_id: String,
  pub client_secret: String,
  pub access_token: Option<String>,
  pub refresh_token: Option<String>,
  pub expires_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Структура для хранения API ключа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApiKeyData {
  pub key_type: ApiKeyType,
  pub value: String,
  pub oauth_data: Option<OAuthCredentials>,
  pub created_at: chrono::DateTime<chrono::Utc>,
  pub last_validated: Option<chrono::DateTime<chrono::Utc>>,
  pub is_valid: Option<bool>,
}

/// Зашифрованная структура для хранения
#[derive(Debug, Serialize, Deserialize)]
struct EncryptedApiKey {
  pub nonce: Vec<u8>,
  pub ciphertext: Vec<u8>,
  pub created_at: chrono::DateTime<chrono::Utc>,
}

/// Основной класс для безопасного хранения API ключей
pub struct SecureStorage {
  store: std::sync::Arc<Store<tauri::Wry>>,
  cipher: Aes256Gcm,
  #[allow(dead_code)]
  app_handle: tauri::AppHandle,
}

impl SecureStorage {
  /// Создает новый экземпляр SecureStorage
  pub fn new(app_handle: tauri::AppHandle) -> Result<Self> {
    // Создаем или получаем ключ шифрования из keyring
    let encryption_key = Self::get_or_create_encryption_key()?;

    // Инициализируем шифр
    let key = Key::<Aes256Gcm>::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);

    // Создаем store для хранения зашифрованных данных
    let store = StoreBuilder::new(&app_handle, "api_keys.dat").build()?;

    Ok(Self {
      store,
      cipher,
      app_handle,
    })
  }

  /// Получает или создает ключ шифрования через keyring
  pub fn get_or_create_encryption_key() -> Result<[u8; 32]> {
    let entry = Entry::new("timeline-studio", "api-encryption-key")
      .context("Failed to create keyring entry")?;

    match entry.get_password() {
      Ok(password) => {
        // Используем существующий ключ
        let mut key = [0u8; 32];
        let salt = b"timeline-studio-salt"; // Фиксированная соль для детерминированного ключа

        let argon2 = Argon2::default();
        argon2
          .hash_password_into(password.as_bytes(), salt, &mut key)
          .map_err(|e| anyhow::anyhow!("Failed to derive key: {:?}", e))?;

        Ok(key)
      }
      Err(_) => {
        // Создаем новый ключ
        let password = Uuid::new_v4().to_string();
        entry
          .set_password(&password)
          .context("Failed to store encryption key")?;

        let mut key = [0u8; 32];
        let salt = b"timeline-studio-salt";

        let argon2 = Argon2::default();
        argon2
          .hash_password_into(password.as_bytes(), salt, &mut key)
          .map_err(|e| anyhow::anyhow!("Failed to derive key: {:?}", e))?;

        Ok(key)
      }
    }
  }

  /// Сохраняет API ключ с шифрованием
  pub async fn save_api_key(&mut self, key_data: ApiKeyData) -> Result<()> {
    let service_key = format!("api_key_{}", key_data.key_type.as_str());

    // Сериализуем данные ключа
    let json_data = serde_json::to_vec(&key_data).context("Failed to serialize key data")?;

    // Генерируем случайный nonce
    let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

    // Шифруем данные
    let ciphertext = self
      .cipher
      .encrypt(&nonce, json_data.as_ref())
      .map_err(|e| anyhow::anyhow!("Encryption failed: {:?}", e))?;

    // Создаем зашифрованную структуру
    let encrypted = EncryptedApiKey {
      nonce: nonce.to_vec(),
      ciphertext,
      created_at: chrono::Utc::now(),
    };

    // Сохраняем в store
    self
      .store
      .set(service_key, serde_json::to_value(encrypted)?);

    self
      .store
      .save()
      .map_err(|e| anyhow::anyhow!("Failed to save store: {:?}", e))?;

    log::info!("API key saved for service: {}", key_data.key_type.as_str());
    Ok(())
  }

  /// Получает API ключ с расшифровкой
  pub async fn get_api_key(&mut self, key_type: ApiKeyType) -> Result<Option<ApiKeyData>> {
    let service_key = format!("api_key_{}", key_type.as_str());

    // Получаем зашифрованные данные из store
    let encrypted_value = match self.store.get(service_key) {
      Some(value) => value,
      None => return Ok(None),
    };

    // Десериализуем зашифрованную структуру
    let encrypted: EncryptedApiKey =
      serde_json::from_value(encrypted_value).context("Failed to deserialize encrypted data")?;

    // Восстанавливаем nonce
    let nonce = Nonce::from_slice(&encrypted.nonce);

    // Расшифровываем данные
    let decrypted_data = self
      .cipher
      .decrypt(nonce, encrypted.ciphertext.as_ref())
      .map_err(|e| anyhow::anyhow!("Decryption failed: {:?}", e))?;

    // Десериализуем данные ключа
    let key_data: ApiKeyData =
      serde_json::from_slice(&decrypted_data).context("Failed to deserialize key data")?;

    Ok(Some(key_data))
  }

  /// Удаляет API ключ
  pub async fn delete_api_key(&mut self, key_type: ApiKeyType) -> Result<()> {
    let service_key = format!("api_key_{}", key_type.as_str());

    self.store.delete(service_key);

    self
      .store
      .save()
      .map_err(|e| anyhow::anyhow!("Failed to save store: {:?}", e))?;

    log::info!("API key deleted for service: {}", key_type.as_str());
    Ok(())
  }

  /// Получает список всех сохраненных API ключей (без расшифровки значений)
  pub async fn list_api_keys(&mut self) -> Result<Vec<ApiKeyType>> {
    let mut keys = Vec::new();

    for (key, _) in self.store.entries() {
      if let Some(service_name) = key.strip_prefix("api_key_") {
        if let Some(key_type) = ApiKeyType::from_str(service_name) {
          keys.push(key_type);
        }
      }
    }

    Ok(keys)
  }

  /// Обновляет статус валидации для API ключа
  pub async fn update_validation_status(
    &mut self,
    key_type: ApiKeyType,
    is_valid: bool,
  ) -> Result<()> {
    if let Some(mut key_data) = self.get_api_key(key_type.clone()).await? {
      key_data.is_valid = Some(is_valid);
      key_data.last_validated = Some(chrono::Utc::now());
      self.save_api_key(key_data).await?;
    }
    Ok(())
  }

  /// Получает только значение API ключа (для простых случаев)
  #[allow(dead_code)]
  pub async fn get_api_key_value(&mut self, key_type: ApiKeyType) -> Result<Option<String>> {
    if let Some(key_data) = self.get_api_key(key_type).await? {
      Ok(Some(key_data.value))
    } else {
      Ok(None)
    }
  }

  /// Сохраняет простой API ключ (без OAuth данных)
  pub async fn save_simple_api_key(&mut self, key_type: ApiKeyType, value: String) -> Result<()> {
    let key_data = ApiKeyData {
      key_type,
      value,
      oauth_data: None,
      created_at: chrono::Utc::now(),
      last_validated: None,
      is_valid: None,
    };

    self.save_api_key(key_data).await
  }

  /// Экспортирует все API ключи в HashMap (для миграции или backup)
  pub async fn export_all_keys(&mut self) -> Result<HashMap<String, ApiKeyData>> {
    let mut exported = HashMap::new();
    let key_types = self.list_api_keys().await?;

    for key_type in key_types {
      if let Some(key_data) = self.get_api_key(key_type.clone()).await? {
        exported.insert(key_type.as_str().to_string(), key_data);
      }
    }

    Ok(exported)
  }
}

#[cfg(test)]
mod tests {
  use tempfile::TempDir;

  #[allow(dead_code)]
  fn create_test_app_handle() -> (tauri::AppHandle, TempDir) {
    let _temp_dir = TempDir::new().unwrap();
    // Тест заглушка - в реальности нужен настоящий AppHandle
    todo!("Implement test app handle creation")
  }

  #[tokio::test]
  async fn test_save_and_get_simple_api_key() {
    // let (app_handle, _temp_dir) = create_test_app_handle();
    // let mut storage = SecureStorage::new(app_handle).unwrap();

    // let test_key = "sk-test123456789";
    // storage.save_simple_api_key(ApiKeyType::OpenAI, test_key.to_string()).await.unwrap();

    // let retrieved = storage.get_api_key_value(ApiKeyType::OpenAI).await.unwrap();
    // assert_eq!(retrieved, Some(test_key.to_string()));

    // TODO: Реализовать полноценные тесты с mock AppHandle
  }
}
