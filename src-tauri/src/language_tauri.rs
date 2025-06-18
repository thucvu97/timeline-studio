// Правильная реализация управления языком для Tauri v2
// Использует встроенное управление состоянием Tauri вместо глобальных статических переменных

use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

// Поддерживаемые языки
const SUPPORTED_LANGUAGES: [&str; 11] = [
  "en", "ru", "es", "pt", "fr", "de", "zh", "ja", "ko", "tr", "th",
];
const DEFAULT_LANGUAGE: &str = "en";

/// Состояние языка приложения, управляемое Tauri
#[derive(Debug)]
pub struct LanguageState {
  current_language: Mutex<String>,
}

impl LanguageState {
  pub fn new() -> Self {
    Self {
      current_language: Mutex::new(DEFAULT_LANGUAGE.to_string()),
    }
  }
}

impl Default for LanguageState {
  fn default() -> Self {
    Self::new()
  }
}

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

/// Получение текущего языка приложения (Tauri v2 way)
#[tauri::command]
pub fn get_app_language_tauri(
  language_state: State<'_, LanguageState>,
) -> Result<LanguageResponse, String> {
  let system_language = get_system_language();

  // Получаем текущий язык из состояния Tauri
  let language = language_state
    .current_language
    .lock()
    .map_err(|e| format!("Failed to lock language state: {}", e))?
    .clone();

  Ok(LanguageResponse {
    language,
    system_language,
  })
}

/// Установка языка приложения (Tauri v2 way)
#[tauri::command]
pub fn set_app_language_tauri(
  lang: String,
  language_state: State<'_, LanguageState>,
) -> Result<LanguageResponse, String> {
  // Проверяем, поддерживается ли язык
  if !is_supported_language(&lang) {
    return Err(format!("Unsupported language: {}", lang));
  }

  // Устанавливаем новый язык в состоянии Tauri
  *language_state
    .current_language
    .lock()
    .map_err(|e| format!("Failed to lock language state: {}", e))? = lang.clone();

  Ok(LanguageResponse {
    language: lang,
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
  fn test_language_state_creation() {
    let state = LanguageState::new();
    // Should be able to lock and read
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, DEFAULT_LANGUAGE);
  }

  #[test]
  fn test_language_state_modification() {
    let state = LanguageState::new();

    // Set a new language
    {
      let mut current = state.current_language.lock().unwrap();
      *current = "ru".to_string();
    }

    // Verify it was set
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, "ru");
  }
}
