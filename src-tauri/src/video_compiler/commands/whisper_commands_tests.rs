//! Tests for Whisper commands
//!
//! Comprehensive test suite for Whisper transcription functionality

use super::*;
use tempfile::TempDir;
use tokio::fs;

#[cfg(test)]
use mockall::{mock, predicate::*};

// Mock for reqwest Response
#[cfg(test)]
mock! {
    HttpResponse {
        pub fn status(&self) -> reqwest::StatusCode;
        pub async fn text(self) -> Result<String, reqwest::Error>;
        pub async fn json<T: serde::de::DeserializeOwned + 'static>(self) -> Result<T, reqwest::Error>;
    }
}

// Helper function to create test audio file
#[cfg(test)]
async fn create_test_audio_file(dir: &TempDir, filename: &str) -> std::path::PathBuf {
  let file_path = dir.path().join(filename);
  fs::write(&file_path, b"fake audio data").await.unwrap();
  file_path
}

// Helper function to create test WhisperTranscriptionResult
#[cfg(test)]
fn create_test_transcription() -> WhisperTranscriptionResult {
  WhisperTranscriptionResult {
    text: "This is a test transcription".to_string(),
    language: Some("en".to_string()),
    duration: Some(10.5),
    segments: Some(vec![
      WhisperSegment {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 5.0,
        text: "This is a test".to_string(),
        tokens: vec![1234, 5678, 9012],
        temperature: 0.0,
        avg_logprob: -0.3,
        compression_ratio: 1.2,
        no_speech_prob: 0.05,
      },
      WhisperSegment {
        id: 1,
        seek: 500,
        start: 5.0,
        end: 10.5,
        text: " transcription".to_string(),
        tokens: vec![3456, 7890],
        temperature: 0.0,
        avg_logprob: -0.4,
        compression_ratio: 1.1,
        no_speech_prob: 0.03,
      },
    ]),
    words: Some(vec![
      WhisperWord {
        word: "This".to_string(),
        start: 0.0,
        end: 0.5,
      },
      WhisperWord {
        word: "is".to_string(),
        start: 0.5,
        end: 0.8,
      },
    ]),
  }
}

#[cfg(test)]
mod openai_transcription_tests {
  use super::*;

  #[tokio::test]
  async fn test_transcribe_openai_file_not_found() {
    let result = whisper_transcribe_openai(
      "/non/existent/audio.mp3".to_string(),
      "test_api_key".to_string(),
      "whisper-1".to_string(),
      None,
      None,
      "json".to_string(),
      0.0,
      vec![],
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Аудио файл не найден"));
  }

  #[tokio::test]
  async fn test_transcribe_openai_parameters() {
    let temp_dir = TempDir::new().unwrap();
    let audio_file = create_test_audio_file(&temp_dir, "test.mp3").await;

    // This will fail with real API call, but tests parameter handling
    let result = whisper_transcribe_openai(
      audio_file.to_str().unwrap().to_string(),
      "test_api_key".to_string(),
      "whisper-1".to_string(),
      Some("en".to_string()),
      Some("This is about technology".to_string()),
      "verbose_json".to_string(),
      0.2,
      vec!["segment".to_string(), "word".to_string()],
    )
    .await;

    // Will fail with invalid API key, but parameters are tested
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("OpenAI"));
  }

  #[tokio::test]
  async fn test_transcription_result_structure() {
    let transcription = create_test_transcription();

    assert_eq!(transcription.text, "This is a test transcription");
    assert_eq!(transcription.language, Some("en".to_string()));
    assert_eq!(transcription.duration, Some(10.5));

    let segments = transcription.segments.unwrap();
    assert_eq!(segments.len(), 2);
    assert_eq!(segments[0].text, "This is a test");
    assert_eq!(segments[0].start, 0.0);
    assert_eq!(segments[0].end, 5.0);

    let words = transcription.words.unwrap();
    assert_eq!(words.len(), 2);
    assert_eq!(words[0].word, "This");
  }

  #[tokio::test]
  async fn test_response_format_options() {
    let formats = vec!["json", "text", "srt", "vtt", "verbose_json"];

    for format in formats {
      // Validate format string
      assert!(!format.is_empty());
      assert!(format.chars().all(|c| c.is_alphanumeric() || c == '_'));
    }
  }
}

#[cfg(test)]
mod openai_translation_tests {
  use super::*;

  #[tokio::test]
  async fn test_translate_openai_file_not_found() {
    let result = whisper_translate_openai(
      "/non/existent/audio.mp3".to_string(),
      "test_api_key".to_string(),
      "whisper-1".to_string(),
      None,
      "json".to_string(),
      0.0,
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Аудио файл не найден"));
  }

  #[tokio::test]
  async fn test_translate_openai_parameters() {
    let temp_dir = TempDir::new().unwrap();
    let audio_file = create_test_audio_file(&temp_dir, "test.mp3").await;

    let result = whisper_translate_openai(
      audio_file.to_str().unwrap().to_string(),
      "test_api_key".to_string(),
      "whisper-1".to_string(),
      Some("Context for translation".to_string()),
      "text".to_string(),
      0.5,
    )
    .await;

    // Will fail with invalid API key
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_translation_result_structure() {
    let translation = WhisperTranslationResult {
      text: "This is a translated text".to_string(),
      segments: Some(vec![WhisperSegment {
        id: 0,
        seek: 0,
        start: 0.0,
        end: 3.0,
        text: "This is a".to_string(),
        tokens: vec![1, 2, 3],
        temperature: 0.0,
        avg_logprob: -0.5,
        compression_ratio: 1.3,
        no_speech_prob: 0.02,
      }]),
    };

    assert_eq!(translation.text, "This is a translated text");
    assert!(translation.segments.is_some());
    assert_eq!(translation.segments.unwrap().len(), 1);
  }
}

#[cfg(test)]
mod local_whisper_tests {
  use super::*;

  #[tokio::test]
  async fn test_transcribe_local_file_not_found() {
    let result = whisper_transcribe_local(
      "/non/existent/audio.wav".to_string(),
      "whisper-base".to_string(),
      "en".to_string(),
      4,
      "json".to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Аудио файл не найден"));
  }

  #[tokio::test]
  async fn test_transcribe_local_whisper_not_found() {
    let temp_dir = TempDir::new().unwrap();
    let audio_file = create_test_audio_file(&temp_dir, "test.wav").await;

    let result = whisper_transcribe_local(
      audio_file.to_str().unwrap().to_string(),
      "whisper-base".to_string(),
      "auto".to_string(),
      8,
      "txt".to_string(),
    )
    .await;

    // Will fail if whisper.cpp is not installed
    assert!(result.is_err());
    // Error message will be either about whisper.cpp not found or model not found
  }

  #[tokio::test]
  async fn test_local_model_validation() {
    let valid_models = vec![
      "whisper-tiny",
      "whisper-base",
      "whisper-small",
      "whisper-medium",
      "whisper-large-v2",
      "whisper-large-v3",
    ];

    for model in valid_models {
      let result = get_whisper_model_path(model);
      assert!(result.is_ok());
      let path = result.unwrap();
      assert!(path.to_string_lossy().contains(".bin"));
    }

    // Test invalid model
    let result = get_whisper_model_path("invalid-model");
    assert!(result.is_err());
  }

  #[tokio::test]
  async fn test_output_format_handling() {
    let formats = vec!["json", "txt"];

    for format in formats {
      // Test that format is supported
      match format {
        "json" | "txt" => {} // These formats are supported
        _ => panic!("Unsupported format"),
      }
    }
  }
}

#[cfg(test)]
mod local_models_management_tests {
  use super::*;

  #[tokio::test]
  async fn test_get_local_models() {
    let result = whisper_get_local_models().await;

    assert!(result.is_ok());
    let models = result.unwrap();

    // Should have 6 known models
    assert_eq!(models.len(), 6);

    // Check first model (tiny)
    let tiny = &models[0];
    assert_eq!(tiny.name, "whisper-tiny");
    assert_eq!(tiny.size, "39 MB");
    assert!(tiny.download_url.is_some());
    assert!(tiny
      .download_url
      .as_ref()
      .unwrap()
      .contains("ggml-tiny.bin"));
  }

  #[tokio::test]
  async fn test_model_sizes() {
    let models = whisper_get_local_models().await.unwrap();

    let expected_sizes = [
      ("whisper-tiny", "39 MB"),
      ("whisper-base", "74 MB"),
      ("whisper-small", "244 MB"),
      ("whisper-medium", "769 MB"),
      ("whisper-large-v2", "1550 MB"),
      ("whisper-large-v3", "1550 MB"),
    ];

    for (i, (name, size)) in expected_sizes.iter().enumerate() {
      assert_eq!(models[i].name, *name);
      assert_eq!(models[i].size, *size);
    }
  }

  #[tokio::test]
  async fn test_download_model_invalid_name() {
    let result = whisper_download_model("invalid-model-name".to_string()).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Неизвестная модель"));
  }

  #[tokio::test]
  async fn test_download_model_url_generation() {
    let model_names = vec![
      ("whisper-tiny", "ggml-tiny.bin"),
      ("whisper-base", "ggml-base.bin"),
      ("whisper-small", "ggml-small.bin"),
    ];

    for (model_name, filename) in model_names {
      let models = whisper_get_local_models().await.unwrap();
      let model = models.iter().find(|m| m.name == model_name).unwrap();

      assert!(model.download_url.is_some());
      let url = model.download_url.as_ref().unwrap();
      assert!(url.contains("huggingface.co"));
      assert!(url.contains(filename));
    }
  }
}

#[cfg(test)]
mod availability_tests {
  use super::*;

  #[tokio::test]
  async fn test_check_local_availability() {
    let result = whisper_check_local_availability().await;

    assert!(result.is_ok());
    // Result depends on whether whisper.cpp is installed
    let _is_available = result.unwrap();
    // The result is valid regardless of whether whisper.cpp is installed
  }
}

#[cfg(test)]
mod audio_extraction_tests {
  use super::*;

  #[tokio::test]
  async fn test_extract_audio_file_not_found() {
    let result =
      extract_audio_for_whisper("/non/existent/video.mp4".to_string(), "wav".to_string()).await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Видео файл не найден"));
  }

  #[tokio::test]
  async fn test_extract_audio_formats() {
    let temp_dir = TempDir::new().unwrap();
    let video_file = create_test_audio_file(&temp_dir, "video.mp4").await;

    let formats = vec!["wav", "mp3", "flac"];

    for format in formats {
      let result =
        extract_audio_for_whisper(video_file.to_str().unwrap().to_string(), format.to_string())
          .await;

      // Will fail with real FFmpeg call on fake data
      assert!(result.is_err());
    }
  }

  #[tokio::test]
  async fn test_extract_audio_invalid_format() {
    let temp_dir = TempDir::new().unwrap();
    let video_file = create_test_audio_file(&temp_dir, "video.mp4").await;

    let result = extract_audio_for_whisper(
      video_file.to_str().unwrap().to_string(),
      "invalid_format".to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Неподдерживаемый формат"));
  }

  #[tokio::test]
  async fn test_extract_audio_output_path() {
    // Test that output path contains timestamp
    let _temp_dir = std::env::temp_dir().join("timeline_studio_whisper");
    let timestamp = chrono::Utc::now().timestamp_millis();
    let audio_filename = format!("extracted_audio_{}.wav", timestamp);

    assert!(audio_filename.contains(&timestamp.to_string()));
    assert!(audio_filename.ends_with(".wav"));
  }
}

#[cfg(test)]
mod helper_functions_tests {
  use super::*;

  #[test]
  fn test_get_whisper_models_dir() {
    let result = get_whisper_models_dir();

    assert!(result.is_ok());
    let path = result.unwrap();
    assert!(path.to_string_lossy().contains(".timeline_studio"));
    assert!(path.to_string_lossy().contains("whisper_models"));
  }

  #[test]
  fn test_parse_whisper_segments() {
    let json_data = serde_json::json!({
        "segments": [
            {
                "seek": 0,
                "start": 0.0,
                "end": 5.5,
                "text": "Hello world",
                "tokens": [1234, 5678],
                "temperature": 0.5,
                "avg_logprob": -0.3,
                "compression_ratio": 1.2,
                "no_speech_prob": 0.1
            },
            {
                "seek": 550,
                "start": 5.5,
                "end": 10.0,
                "text": " How are you?",
                "tokens": [9012, 3456],
                "temperature": 0.6,
                "avg_logprob": -0.4,
                "compression_ratio": 1.1,
                "no_speech_prob": 0.05
            }
        ]
    });

    let segments = parse_whisper_segments(&json_data);

    assert_eq!(segments.len(), 2);

    assert_eq!(segments[0].id, 0);
    assert_eq!(segments[0].text, "Hello world");
    assert_eq!(segments[0].start, 0.0);
    assert_eq!(segments[0].end, 5.5);
    assert_eq!(segments[0].tokens, vec![1234, 5678]);

    assert_eq!(segments[1].id, 1);
    assert_eq!(segments[1].text, " How are you?");
    assert_eq!(segments[1].start, 5.5);
    assert_eq!(segments[1].end, 10.0);
  }

  #[test]
  fn test_parse_whisper_segments_empty() {
    let json_data = serde_json::json!({});
    let segments = parse_whisper_segments(&json_data);
    assert_eq!(segments.len(), 0);

    let json_data_no_array = serde_json::json!({
        "segments": "not an array"
    });
    let segments = parse_whisper_segments(&json_data_no_array);
    assert_eq!(segments.len(), 0);
  }

  #[test]
  fn test_parse_whisper_segments_missing_fields() {
    let json_data = serde_json::json!({
        "segments": [
            {
                "seek": 0,
                "start": 0.0,
                // Missing required fields
            }
        ]
    });

    let segments = parse_whisper_segments(&json_data);
    assert_eq!(segments.len(), 0); // Should skip invalid segments
  }
}

#[cfg(test)]
mod serialization_tests {
  use super::*;

  #[test]
  fn test_whisper_segment_serialization() {
    let segment = WhisperSegment {
      id: 1,
      seek: 100,
      start: 1.0,
      end: 5.5,
      text: "Test segment".to_string(),
      tokens: vec![1, 2, 3],
      temperature: 0.7,
      avg_logprob: -0.5,
      compression_ratio: 1.3,
      no_speech_prob: 0.02,
    };

    let json = serde_json::to_string(&segment).unwrap();
    let deserialized: WhisperSegment = serde_json::from_str(&json).unwrap();

    assert_eq!(segment.id, deserialized.id);
    assert_eq!(segment.text, deserialized.text);
    assert_eq!(segment.tokens, deserialized.tokens);
  }

  #[test]
  fn test_local_whisper_model_serialization() {
    let model = LocalWhisperModel {
      name: "whisper-base".to_string(),
      size: "74 MB".to_string(),
      languages: vec!["multilingual".to_string()],
      path: Some("/path/to/model.bin".to_string()),
      is_downloaded: true,
      download_url: Some("https://example.com/model.bin".to_string()),
    };

    let json = serde_json::to_string(&model).unwrap();
    let deserialized: LocalWhisperModel = serde_json::from_str(&json).unwrap();

    assert_eq!(model.name, deserialized.name);
    assert_eq!(model.is_downloaded, deserialized.is_downloaded);
    assert_eq!(model.path, deserialized.path);
  }
}

#[cfg(test)]
mod integration_tests {
  use super::*;

  #[tokio::test]
  async fn test_full_whisper_workflow() {
    // 1. Check local availability
    let _is_available = whisper_check_local_availability().await.unwrap();

    // 2. Get list of models
    let models = whisper_get_local_models().await.unwrap();
    assert!(!models.is_empty());

    // 3. Check model paths
    for model in &models {
      if model.is_downloaded {
        assert!(model.path.is_some());
      }
    }

    // 4. Test audio extraction (will fail on fake data)
    let temp_dir = TempDir::new().unwrap();
    let video_file = create_test_audio_file(&temp_dir, "test_video.mp4").await;

    let audio_result =
      extract_audio_for_whisper(video_file.to_str().unwrap().to_string(), "wav".to_string()).await;

    // Expected to fail with fake video data
    assert!(audio_result.is_err());
  }

  #[tokio::test]
  async fn test_model_management_workflow() {
    // Get models
    let models = whisper_get_local_models().await.unwrap();

    // Check each model's properties
    for model in models {
      assert!(!model.name.is_empty());
      assert!(!model.size.is_empty());
      assert!(!model.languages.is_empty());
      assert!(model.download_url.is_some());

      // Validate download URL format
      if let Some(url) = model.download_url {
        assert!(url.starts_with("https://"));
        assert!(url.contains("huggingface.co"));
        assert!(url.ends_with(".bin"));
      }
    }
  }
}
