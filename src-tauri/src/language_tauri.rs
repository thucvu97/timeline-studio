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
  fn test_supported_languages_constant() {
    assert_eq!(SUPPORTED_LANGUAGES.len(), 11);
    assert!(SUPPORTED_LANGUAGES.contains(&"en"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ru"));
    assert!(SUPPORTED_LANGUAGES.contains(&"es"));
    assert!(SUPPORTED_LANGUAGES.contains(&"pt"));
    assert!(SUPPORTED_LANGUAGES.contains(&"fr"));
    assert!(SUPPORTED_LANGUAGES.contains(&"de"));
    assert!(SUPPORTED_LANGUAGES.contains(&"zh"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ja"));
    assert!(SUPPORTED_LANGUAGES.contains(&"ko"));
    assert!(SUPPORTED_LANGUAGES.contains(&"tr"));
    assert!(SUPPORTED_LANGUAGES.contains(&"th"));
  }

  #[test]
  fn test_default_language_constant() {
    assert_eq!(DEFAULT_LANGUAGE, "en");
    assert!(SUPPORTED_LANGUAGES.contains(&DEFAULT_LANGUAGE));
  }

  #[test]
  fn test_get_system_language() {
    let lang = get_system_language();
    // Should return a valid language code
    assert!(!lang.is_empty());
    assert!(SUPPORTED_LANGUAGES.contains(&lang.as_str()));
  }

  #[test]
  fn test_get_system_language_fallback() {
    // We can't easily test the case where sys_locale returns None,
    // but we can verify the returned language is always supported
    let lang = get_system_language();
    assert!(is_supported_language(&lang));
  }

  #[test]
  fn test_language_state_creation() {
    let state = LanguageState::new();
    // Should be able to lock and read
    let current = state.current_language.lock().unwrap();
    assert_eq!(*current, DEFAULT_LANGUAGE);
  }

  #[test]
  fn test_language_state_default() {
    let state = LanguageState::default();
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

  #[test]
  fn test_language_state_concurrent_access() {
    let state = std::sync::Arc::new(LanguageState::new());
    let state1 = state.clone();
    let state2 = state.clone();

    // Simulate concurrent access
    let handle1 = std::thread::spawn(move || {
      let mut current = state1.current_language.lock().unwrap();
      *current = "fr".to_string();
    });

    let handle2 = std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(10));
      let current = state2.current_language.lock().unwrap();
      current.clone()
    });

    handle1.join().unwrap();
    let result = handle2.join().unwrap();

    // One of the threads should have set it to "fr"
    assert_eq!(result, "fr");
  }

  #[test]
  fn test_language_response_serialization() {
    let response = LanguageResponse {
      language: "ru".to_string(),
      system_language: "en".to_string(),
    };

    let json = serde_json::to_string(&response).unwrap();
    assert!(json.contains("\"language\":\"ru\""));
    assert!(json.contains("\"system_language\":\"en\""));

    let deserialized: LanguageResponse = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.language, "ru");
    assert_eq!(deserialized.system_language, "en");
  }

  #[test]
  fn test_get_app_language_tauri_command() {
    // We can't easily test Tauri commands that require State in unit tests
    // These would be better tested as integration tests
    // For now, just test the LanguageState functionality directly
    let language_state = LanguageState::new();

    // Set a specific language
    {
      let mut current = language_state.current_language.lock().unwrap();
      *current = "fr".to_string();
    }

    // Verify it was set
    let current = language_state.current_language.lock().unwrap();
    assert_eq!(*current, "fr");
  }

  #[test]
  fn test_set_app_language_tauri_command_valid() {
    // Test validation logic
    assert!(is_supported_language("es"));

    // Test that setting a valid language works with LanguageState
    let language_state = LanguageState::new();
    {
      let mut current = language_state.current_language.lock().unwrap();
      *current = "es".to_string();
    }

    let current = language_state.current_language.lock().unwrap();
    assert_eq!(*current, "es");
  }

  #[test]
  fn test_set_app_language_tauri_command_invalid() {
    // Test validation logic
    assert!(!is_supported_language("invalid"));

    // The command would return an error for unsupported languages
    // We test the validation logic here
  }

  #[test]
  fn test_set_app_language_tauri_command_empty() {
    // Test validation logic for empty string
    assert!(!is_supported_language(""));
  }

  #[test]
  fn test_language_state_mutex_poisoning() {
    let state = std::sync::Arc::new(LanguageState::new());
    let state_clone = state.clone();

    // Simulate a panic while holding the lock
    let handle = std::thread::spawn(move || {
      let _guard = state_clone.current_language.lock().unwrap();
      panic!("Simulated panic");
    });

    // Wait for the thread to panic
    let _ = handle.join();

    // Try to access the poisoned mutex
    let result = state.current_language.lock();
    assert!(result.is_err());
  }

  #[test]
  fn test_all_supported_languages_valid() {
    // Verify each supported language is a valid 2-letter code
    for lang in SUPPORTED_LANGUAGES.iter() {
      assert_eq!(lang.len(), 2);
      assert!(lang.chars().all(|c| c.is_ascii_lowercase()));
    }
  }

  #[test]
  fn test_language_codes_unique() {
    // Verify no duplicate language codes
    use std::collections::HashSet;
    let unique_langs: HashSet<_> = SUPPORTED_LANGUAGES.iter().collect();
    assert_eq!(unique_langs.len(), SUPPORTED_LANGUAGES.len());
  }
}
