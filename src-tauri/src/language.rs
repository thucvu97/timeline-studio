use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// Поддерживаемые языки
const SUPPORTED_LANGUAGES: [&str; 11] = [
  "en", "ru", "es", "pt", "fr", "de", "zh", "ja", "ko", "tr", "th",
];
const DEFAULT_LANGUAGE: &str = "en";

// Глобальное состояние для хранения текущего языка
static APP_LANGUAGE: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(DEFAULT_LANGUAGE.to_string()));

#[derive(Debug, Serialize, Deserialize)]
pub struct LanguageResponse {
  pub language: String,
  pub system_language: String,
}

/// Получение системного языка
fn get_system_language() -> String {
  // Получаем системную локаль
  let locale = match sys_locale::get_locale() {
    Some(loc) => loc,
    None => DEFAULT_LANGUAGE.to_string(),
  };

  // Извлекаем код языка (первые 2 символа)
  let lang_code = locale.chars().take(2).collect::<String>().to_lowercase();

  // Проверяем, поддерживается ли язык, иначе возвращаем значение по умолчанию
  if SUPPORTED_LANGUAGES.contains(&lang_code.as_str()) {
    lang_code
  } else {
    DEFAULT_LANGUAGE.to_string()
  }
}

/// Проверка, поддерживается ли язык
fn is_supported_language(lang: &str) -> bool {
  SUPPORTED_LANGUAGES.contains(&lang)
}

/// Получение текущего языка приложения
#[tauri::command]
pub fn get_app_language() -> LanguageResponse {
  let system_language = get_system_language();
  let app_language = APP_LANGUAGE.lock().unwrap().clone();

  LanguageResponse {
    language: app_language,
    system_language,
  }
}

/// Установка языка приложения
#[tauri::command]
pub fn set_app_language(lang: String) -> Result<LanguageResponse, String> {
  // Проверяем, поддерживается ли язык
  if !is_supported_language(&lang) {
    return Err(format!("Unsupported language: {}", lang));
  }

  // Устанавливаем новый язык
  let mut app_language = APP_LANGUAGE.lock().unwrap();
  *app_language = lang;

  Ok(LanguageResponse {
    language: app_language.clone(),
    system_language: get_system_language(),
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_is_supported_language() {
    // Test supported languages
    assert!(is_supported_language("en"));
    assert!(is_supported_language("ru"));
    assert!(is_supported_language("es"));
    assert!(is_supported_language("pt"));
    assert!(is_supported_language("fr"));
    assert!(is_supported_language("de"));

    // Test supported languages (extended)
    assert!(is_supported_language("zh"));
    assert!(is_supported_language("ja"));
    assert!(is_supported_language("ko"));
    assert!(is_supported_language("tr"));
    assert!(is_supported_language("th"));

    // Test unsupported languages
    assert!(!is_supported_language("it"));
    assert!(!is_supported_language("pl"));
    assert!(!is_supported_language(""));
  }

  #[test]
  fn test_get_system_language() {
    let lang = get_system_language();
    // Should return a valid language code
    assert!(!lang.is_empty());
    assert!(SUPPORTED_LANGUAGES.contains(&lang.as_str()));
  }

  #[test]
  fn test_get_app_language() {
    let response = get_app_language();
    // Should return default language initially
    assert!(!response.language.is_empty());
    assert!(!response.system_language.is_empty());
    assert!(is_supported_language(&response.language));
    assert!(is_supported_language(&response.system_language));
  }

  #[test]
  fn test_set_app_language_valid() {
    // Test setting a valid language
    let result = set_app_language("ru".to_string());
    assert!(result.is_ok());

    let response = result.unwrap();
    assert_eq!(response.language, "ru");
    assert!(!response.system_language.is_empty());

    // Verify the language was actually set
    let current = get_app_language();
    assert_eq!(current.language, "ru");

    // Reset to default
    let _ = set_app_language(DEFAULT_LANGUAGE.to_string());
  }

  #[test]
  fn test_set_app_language_invalid() {
    // Test setting an invalid language
    let result = set_app_language("xyz".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Unsupported language"));
  }

  #[test]
  fn test_supported_languages_constant() {
    // Verify the constant is properly defined
    assert_eq!(SUPPORTED_LANGUAGES.len(), 11);
    assert_eq!(DEFAULT_LANGUAGE, "en");
  }

  #[test]
  fn test_language_response_serialization() {
    let response = LanguageResponse {
      language: "en".to_string(),
      system_language: "en".to_string(),
    };

    let json = serde_json::to_string(&response).unwrap();
    assert!(json.contains("\"language\":\"en\""));
    assert!(json.contains("\"system_language\":\"en\""));
  }
}
