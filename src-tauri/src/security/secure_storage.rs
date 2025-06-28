use aes_gcm::{
  aead::{Aead, AeadCore, KeyInit, OsRng},
  Aes256Gcm, Key, Nonce,
};
use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::str::FromStr;
use tauri_plugin_store::{Store, StoreBuilder};

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
}

impl FromStr for ApiKeyType {
  type Err = String;

  fn from_str(s: &str) -> Result<Self, Self::Err> {
    match s {
      "openai" => Ok(ApiKeyType::OpenAI),
      "claude" => Ok(ApiKeyType::Claude),
      "deepseek" => Ok(ApiKeyType::DeepSeek),
      "youtube" => Ok(ApiKeyType::YouTube),
      "tiktok" => Ok(ApiKeyType::TikTok),
      "vimeo" => Ok(ApiKeyType::Vimeo),
      "telegram" => Ok(ApiKeyType::Telegram),
      "codecov" => Ok(ApiKeyType::Codecov),
      "tauri_analytics" => Ok(ApiKeyType::TauriAnalytics),
      _ => Err(format!("Unknown API key type: {s}")),
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

  /// Получает или создает ключ шифрования из локального файла
  pub fn get_or_create_encryption_key() -> Result<[u8; 32]> {
    use std::fs;

    // Получаем путь к директории конфигурации приложения
    let config_dir = dirs::config_dir()
      .ok_or_else(|| anyhow::anyhow!("Failed to get config directory"))?
      .join("timeline-studio");

    // Создаем директорию если не существует
    fs::create_dir_all(&config_dir)?;

    let key_file = config_dir.join(".encryption_key");

    if key_file.exists() {
      // Читаем существующий ключ
      let key_data = fs::read(&key_file).context("Failed to read encryption key file")?;

      if key_data.len() != 32 {
        return Err(anyhow::anyhow!("Invalid key file size"));
      }

      let mut key = [0u8; 32];
      key.copy_from_slice(&key_data);
      Ok(key)
    } else {
      // Создаем новый случайный ключ
      let key = Aes256Gcm::generate_key(&mut OsRng);

      // Сохраняем в файл
      fs::write(&key_file, key.as_slice()).context("Failed to write encryption key file")?;

      // Устанавливаем права доступа только для владельца (Unix-like системы)
      #[cfg(unix)]
      {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&key_file)?.permissions();
        perms.set_mode(0o600);
        fs::set_permissions(&key_file, perms)?;
      }

      Ok(key.into())
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
        if let Ok(key_type) = ApiKeyType::from_str(service_name) {
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
