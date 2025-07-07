//! Команды для работы с Whisper API
//!
//! Поддерживает транскрипцию и перевод через OpenAI Whisper API,
//! а также работу с локальными моделями whisper.cpp

use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use reqwest::multipart::{Form, Part};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperSegment {
  pub id: u32,
  pub seek: u32,
  pub start: f64,
  pub end: f64,
  pub text: String,
  pub tokens: Vec<u32>,
  pub temperature: f64,
  pub avg_logprob: f64,
  pub compression_ratio: f64,
  pub no_speech_prob: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperWord {
  pub word: String,
  pub start: f64,
  pub end: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperTranscriptionResult {
  pub text: String,
  pub language: Option<String>,
  pub duration: Option<f64>,
  pub segments: Option<Vec<WhisperSegment>>,
  pub words: Option<Vec<WhisperWord>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WhisperTranslationResult {
  pub text: String,
  pub segments: Option<Vec<WhisperSegment>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalWhisperModel {
  pub name: String,
  pub size: String,
  pub languages: Vec<String>,
  pub path: Option<String>,
  pub is_downloaded: bool,
  pub download_url: Option<String>,
}

/// Транскрипция аудио через OpenAI Whisper API
#[tauri::command]
pub async fn whisper_transcribe_openai(
  audio_file_path: String,
  api_key: String,
  model: String,
  language: Option<String>,
  prompt: Option<String>,
  response_format: String,
  temperature: f64,
  timestamp_granularities: Vec<String>,
) -> Result<WhisperTranscriptionResult, String> {
  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(format!("Аудио файл не найден: {audio_file_path}"));
  }

  // Читаем файл
  let file_content = fs::read(&file_path)
    .await
    .map_err(|e| format!("Ошибка чтения файла: {e}"))?;

  let file_name = file_path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("audio.wav");

  // Создаем multipart form
  let mut form = Form::new()
    .text("model", model)
    .text("response_format", response_format)
    .text("temperature", temperature.to_string())
    .part(
      "file",
      Part::bytes(file_content).file_name(file_name.to_string()),
    );

  if let Some(lang) = language {
    form = form.text("language", lang);
  }

  if let Some(prompt_text) = prompt {
    form = form.text("prompt", prompt_text);
  }

  if !timestamp_granularities.is_empty() {
    form = form.text(
      "timestamp_granularities[]",
      timestamp_granularities.join(","),
    );
  }

  // Отправляем запрос
  let client = reqwest::Client::new();
  let response = client
    .post("https://api.openai.com/v1/audio/transcriptions")
    .header("Authorization", format!("Bearer {api_key}"))
    .multipart(form)
    .send()
    .await
    .map_err(|e| format!("Ошибка запроса к OpenAI: {e}"))?;

  let status = response.status();
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_default();
    return Err(format!("OpenAI API error {status}: {error_text}"));
  }

  let transcription: WhisperTranscriptionResult = response
    .json()
    .await
    .map_err(|e| format!("Ошибка парсинга ответа: {e}"))?;

  Ok(transcription)
}

/// Перевод аудио на английский через OpenAI Whisper API
#[tauri::command]
pub async fn whisper_translate_openai(
  audio_file_path: String,
  api_key: String,
  model: String,
  prompt: Option<String>,
  response_format: String,
  temperature: f64,
) -> Result<WhisperTranslationResult, String> {
  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(format!("Аудио файл не найден: {audio_file_path}"));
  }

  // Читаем файл
  let file_content = fs::read(&file_path)
    .await
    .map_err(|e| format!("Ошибка чтения файла: {e}"))?;

  let file_name = file_path
    .file_name()
    .and_then(|n| n.to_str())
    .unwrap_or("audio.wav");

  // Создаем multipart form
  let mut form = Form::new()
    .text("model", model)
    .text("response_format", response_format)
    .text("temperature", temperature.to_string())
    .part(
      "file",
      Part::bytes(file_content).file_name(file_name.to_string()),
    );

  if let Some(prompt_text) = prompt {
    form = form.text("prompt", prompt_text);
  }

  // Отправляем запрос
  let client = reqwest::Client::new();
  let response = client
    .post("https://api.openai.com/v1/audio/translations")
    .header("Authorization", format!("Bearer {api_key}"))
    .multipart(form)
    .send()
    .await
    .map_err(|e| format!("Ошибка запроса к OpenAI: {e}"))?;

  let status = response.status();
  if !status.is_success() {
    let error_text = response.text().await.unwrap_or_default();
    return Err(format!("OpenAI API error {status}: {error_text}"));
  }

  let translation: WhisperTranslationResult = response
    .json()
    .await
    .map_err(|e| format!("Ошибка парсинга ответа: {e}"))?;

  Ok(translation)
}

/// Транскрипция через локальную модель Whisper
#[tauri::command]
pub async fn whisper_transcribe_local(
  audio_file_path: String,
  model_name: String,
  language: String,
  threads: u32,
  output_format: String,
) -> Result<WhisperTranscriptionResult, String> {
  let file_path = Path::new(&audio_file_path);
  if !file_path.exists() {
    return Err(format!("Аудио файл не найден: {audio_file_path}"));
  }

  // Проверяем наличие whisper.cpp
  let whisper_executable = which::which("whisper")
    .or_else(|_| which::which("whisper.cpp"))
    .map_err(|_| "Whisper.cpp не найден в системе")?;

  // Получаем путь к модели
  let model_path = get_whisper_model_path(&model_name)?;
  if !model_path.exists() {
    return Err(format!("Модель {model_name} не найдена: {model_path:?}"));
  }

  // Создаем временный файл для вывода
  let temp_dir = std::env::temp_dir();
  let output_file = temp_dir.join(format!(
    "whisper_output_{}.{}",
    chrono::Utc::now().timestamp_millis(),
    &output_format
  ));

  // Подготавливаем команду whisper.cpp
  let mut cmd = tokio::process::Command::new(whisper_executable);
  cmd.args([
    "-m",
    &model_path.to_string_lossy(),
    "-f",
    &audio_file_path,
    "-t",
    &threads.to_string(),
    "-of",
    &output_format,
    "-o",
    &output_file.to_string_lossy(),
  ]);

  if language != "auto" {
    cmd.args(["-l", &language]);
  }

  // Выполняем команду
  let output = cmd
    .output()
    .await
    .map_err(|e| format!("Ошибка выполнения whisper.cpp: {e}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("Whisper.cpp завершился с ошибкой: {stderr}"));
  }

  // Читаем результат
  match output_format.as_str() {
    "json" => {
      let json_file = output_file.with_extension("json");
      let content = fs::read_to_string(&json_file)
        .await
        .map_err(|e| format!("Ошибка чтения результата: {e}"))?;

      // Парсим JSON результат whisper.cpp
      let whisper_result: serde_json::Value =
        serde_json::from_str(&content).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

      let text = whisper_result["text"].as_str().unwrap_or("").to_string();
      let segments = parse_whisper_segments(&whisper_result);

      // Удаляем временный файл
      let _ = fs::remove_file(&json_file).await;

      Ok(WhisperTranscriptionResult {
        text,
        language: Some(language),
        duration: None,
        segments: Some(segments),
        words: None,
      })
    }
    "txt" => {
      let txt_file = output_file.with_extension("txt");
      let text = fs::read_to_string(&txt_file)
        .await
        .map_err(|e| format!("Ошибка чтения результата: {e}"))?;

      // Удаляем временный файл
      let _ = fs::remove_file(&txt_file).await;

      Ok(WhisperTranscriptionResult {
        text,
        language: Some(language),
        duration: None,
        segments: None,
        words: None,
      })
    }
    _ => Err(format!("Неподдерживаемый формат вывода: {output_format}")),
  }
}

/// Получить список доступных локальных моделей
#[tauri::command]
pub async fn whisper_get_local_models() -> Result<Vec<LocalWhisperModel>, String> {
  let models_dir = get_whisper_models_dir()?;
  let mut models = Vec::new();

  // Список известных моделей
  let known_models = [
    ("whisper-tiny", "39 MB", "ggml-tiny.bin"),
    ("whisper-base", "74 MB", "ggml-base.bin"),
    ("whisper-small", "244 MB", "ggml-small.bin"),
    ("whisper-medium", "769 MB", "ggml-medium.bin"),
    ("whisper-large-v2", "1550 MB", "ggml-large-v2.bin"),
    ("whisper-large-v3", "1550 MB", "ggml-large-v3.bin"),
  ];

  for (name, size, filename) in known_models {
    let model_path = models_dir.join(filename);
    let is_downloaded = model_path.exists();

    models.push(LocalWhisperModel {
      name: name.to_string(),
      size: size.to_string(),
      languages: vec!["multilingual".to_string()],
      path: if is_downloaded {
        Some(model_path.to_string_lossy().to_string())
      } else {
        None
      },
      is_downloaded,
      download_url: Some(format!(
        "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{filename}"
      )),
    });
  }

  Ok(models)
}

/// Скачать локальную модель Whisper
#[tauri::command]
pub async fn whisper_download_model(model_name: String) -> Result<bool, String> {
  let models_dir = get_whisper_models_dir()?;

  // Создаем директорию если её нет
  fs::create_dir_all(&models_dir)
    .await
    .map_err(|e| format!("Ошибка создания директории моделей: {e}"))?;

  // Определяем имя файла модели
  let filename = match model_name.as_str() {
    "whisper-tiny" => "ggml-tiny.bin",
    "whisper-base" => "ggml-base.bin",
    "whisper-small" => "ggml-small.bin",
    "whisper-medium" => "ggml-medium.bin",
    "whisper-large-v2" => "ggml-large-v2.bin",
    "whisper-large-v3" => "ggml-large-v3.bin",
    _ => return Err(format!("Неизвестная модель: {model_name}")),
  };

  let model_path = models_dir.join(filename);

  // Проверяем, не скачана ли уже модель
  if model_path.exists() {
    return Ok(true);
  }

  // URL для скачивания
  let download_url =
    format!("https://huggingface.co/ggerganov/whisper.cpp/resolve/main/{filename}");

  // Скачиваем модель
  let client = reqwest::Client::new();
  let response = client
    .get(&download_url)
    .send()
    .await
    .map_err(|e| format!("Ошибка скачивания модели: {e}"))?;

  if !response.status().is_success() {
    return Err(format!("Ошибка скачивания: HTTP {}", response.status()));
  }

  // Сохраняем файл
  let content = response
    .bytes()
    .await
    .map_err(|e| format!("Ошибка получения данных: {e}"))?;

  fs::write(&model_path, content)
    .await
    .map_err(|e| format!("Ошибка сохранения модели: {e}"))?;

  Ok(true)
}

/// Проверить доступность локального Whisper
#[tauri::command]
pub async fn whisper_check_local_availability() -> Result<bool, String> {
  // Проверяем наличие whisper.cpp в системе
  let whisper_available = which::which("whisper").is_ok() || which::which("whisper.cpp").is_ok();
  Ok(whisper_available)
}

/// Извлечь аудио из видео для Whisper
#[tauri::command]
pub async fn extract_audio_for_whisper(
  video_file_path: String,
  output_format: String,
) -> Result<String, String> {
  let video_path = Path::new(&video_file_path);
  if !video_path.exists() {
    return Err(format!("Видео файл не найден: {video_file_path}"));
  }

  // Создаем временную директорию
  let temp_dir = std::env::temp_dir().join("timeline_studio_whisper");
  fs::create_dir_all(&temp_dir)
    .await
    .map_err(|e| format!("Ошибка создания временной директории: {e}"))?;

  // Генерируем имя выходного файла
  let timestamp = chrono::Utc::now().timestamp_millis();
  let audio_filename = format!("extracted_audio_{timestamp}.{output_format}");
  let audio_path = temp_dir.join(&audio_filename);

  // Используем FFmpeg для извлечения аудио
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  // Настройки для оптимального качества для Whisper
  match output_format.as_str() {
    "wav" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn", // без видео
        "-acodec",
        "pcm_s16le", // 16-bit PCM
        "-ar",
        "16000", // 16kHz - оптимально для Whisper
        "-ac",
        "1",  // моно
        "-y", // перезаписать файл
        &audio_path.to_string_lossy(),
      ]);
    }
    "mp3" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn",
        "-acodec",
        "mp3",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-b:a",
        "128k",
        "-y",
        &audio_path.to_string_lossy(),
      ]);
    }
    "flac" => {
      cmd.args([
        "-i",
        &video_file_path,
        "-vn",
        "-acodec",
        "flac",
        "-ar",
        "16000",
        "-ac",
        "1",
        "-y",
        &audio_path.to_string_lossy(),
      ]);
    }
    _ => {
      return Err(format!("Неподдерживаемый формат аудио: {output_format}"));
    }
  }

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка извлечения аудио: {e}"))?;

  if result.exit_code != 0 {
    return Err(format!("FFmpeg завершился с ошибкой: {}", result.stderr));
  }

  Ok(audio_path.to_string_lossy().to_string())
}

// Вспомогательные функции

fn get_whisper_models_dir() -> Result<PathBuf, String> {
  let home_dir = dirs::home_dir().ok_or("Не удалось определить домашнюю директорию")?;

  Ok(home_dir.join(".timeline_studio").join("whisper_models"))
}

fn get_whisper_model_path(model_name: &str) -> Result<PathBuf, String> {
  let models_dir = get_whisper_models_dir()?;

  let filename = match model_name {
    "whisper-tiny" => "ggml-tiny.bin",
    "whisper-base" => "ggml-base.bin",
    "whisper-small" => "ggml-small.bin",
    "whisper-medium" => "ggml-medium.bin",
    "whisper-large-v2" => "ggml-large-v2.bin",
    "whisper-large-v3" => "ggml-large-v3.bin",
    _ => return Err(format!("Неизвестная модель: {model_name}")),
  };

  Ok(models_dir.join(filename))
}

fn parse_whisper_segments(whisper_json: &serde_json::Value) -> Vec<WhisperSegment> {
  let segments_array = match whisper_json.get("segments") {
    Some(serde_json::Value::Array(arr)) => arr,
    _ => return Vec::new(),
  };

  segments_array
    .iter()
    .enumerate()
    .filter_map(|(i, segment)| {
      Some(WhisperSegment {
        id: i as u32,
        seek: segment.get("seek")?.as_u64()? as u32,
        start: segment.get("start")?.as_f64()?,
        end: segment.get("end")?.as_f64()?,
        text: segment.get("text")?.as_str()?.to_string(),
        tokens: segment
          .get("tokens")?
          .as_array()?
          .iter()
          .filter_map(|t| t.as_u64().map(|n| n as u32))
          .collect(),
        temperature: segment.get("temperature")?.as_f64()?,
        avg_logprob: segment.get("avg_logprob")?.as_f64()?,
        compression_ratio: segment.get("compression_ratio")?.as_f64()?,
        no_speech_prob: segment.get("no_speech_prob")?.as_f64()?,
      })
    })
    .collect()
}

#[cfg(test)]
#[path = "whisper_commands_tests.rs"]
mod whisper_commands_tests;
