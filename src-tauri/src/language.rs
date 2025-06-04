use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

// Поддерживаемые языки
const SUPPORTED_LANGUAGES: [&str; 6] = ["en", "ru", "es", "pt", "fr", "de"];
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
