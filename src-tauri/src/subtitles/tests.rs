use crate::subtitles::commands::*;
use std::fs;
use tempfile::TempDir;

#[tokio::test]
async fn test_read_subtitle_file_srt() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("test.srt");

  let srt_content = "1\n00:00:01,000 --> 00:00:04,000\nHello world!\n\n2\n00:00:05,000 --> 00:00:08,000\nThis is a test.";
  fs::write(&file_path, srt_content).unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_ok());

  let import_result = result.unwrap();
  assert_eq!(import_result.format, "srt");
  assert_eq!(import_result.file_name, "test.srt");
  assert_eq!(import_result.content, srt_content);
}

#[tokio::test]
async fn test_read_subtitle_file_vtt() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("test.vtt");

  let vtt_content = "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world!\n\n00:00:05.000 --> 00:00:08.000\nThis is a test.";
  fs::write(&file_path, vtt_content).unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_ok());

  let import_result = result.unwrap();
  assert_eq!(import_result.format, "vtt");
  assert_eq!(import_result.file_name, "test.vtt");
  assert_eq!(import_result.content, vtt_content);
}

#[tokio::test]
async fn test_read_subtitle_file_ass() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("test.ass");

  let ass_content = "[Script Info]\nTitle: Test\n\n[Events]\nDialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,Hello world!";
  fs::write(&file_path, ass_content).unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_ok());

  let import_result = result.unwrap();
  assert_eq!(import_result.format, "ass");
  assert_eq!(import_result.file_name, "test.ass");
  assert_eq!(import_result.content, ass_content);
}

#[tokio::test]
async fn test_read_subtitle_file_not_found() {
  let result = read_subtitle_file("/nonexistent/file.srt".to_string()).await;
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("File not found"));
}

#[tokio::test]
async fn test_read_subtitle_file_unsupported_format() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("test.txt");
  fs::write(&file_path, "some content").unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Unsupported subtitle format"));
}

#[tokio::test]
async fn test_save_subtitle_file() {
  let temp_dir = TempDir::new().unwrap();
  let output_path = temp_dir.path().join("output.srt");

  let options = SubtitleExportOptions {
    format: "srt".to_string(),
    content: "1\n00:00:01,000 --> 00:00:04,000\nTest subtitle".to_string(),
    output_path: output_path.to_str().unwrap().to_string(),
  };

  let result = save_subtitle_file(options).await;
  assert!(result.is_ok());

  // Verify file was created
  assert!(output_path.exists());
  let saved_content = fs::read_to_string(&output_path).unwrap();
  assert_eq!(
    saved_content,
    "1\n00:00:01,000 --> 00:00:04,000\nTest subtitle"
  );
}

#[tokio::test]
async fn test_save_subtitle_file_creates_directory() {
  let temp_dir = TempDir::new().unwrap();
  let output_path = temp_dir.path().join("nested/dir/output.srt");

  let options = SubtitleExportOptions {
    format: "srt".to_string(),
    content: "test content".to_string(),
    output_path: output_path.to_str().unwrap().to_string(),
  };

  let result = save_subtitle_file(options).await;
  assert!(result.is_ok());
  assert!(output_path.exists());
}

#[tokio::test]
async fn test_validate_subtitle_format_srt_valid() {
  let srt_content = "1\n00:00:01,000 --> 00:00:04,000\nHello world!";
  let result = validate_subtitle_format(srt_content.to_string(), "srt".to_string()).await;
  assert!(result.is_ok());
  assert!(result.unwrap());
}

#[tokio::test]
async fn test_validate_subtitle_format_srt_invalid() {
  let invalid_content = "This is not a valid SRT file";
  let result = validate_subtitle_format(invalid_content.to_string(), "srt".to_string()).await;
  assert!(result.is_ok());
  assert!(!result.unwrap());
}

#[tokio::test]
async fn test_validate_subtitle_format_vtt_valid() {
  let vtt_content = "WEBVTT\n\n00:00:01.000 --> 00:00:04.000\nHello world!";
  let result = validate_subtitle_format(vtt_content.to_string(), "vtt".to_string()).await;
  assert!(result.is_ok());
  assert!(result.unwrap());
}

#[tokio::test]
async fn test_validate_subtitle_format_vtt_invalid() {
  let invalid_content = "00:00:01.000 --> 00:00:04.000\nMissing WEBVTT header";
  let result = validate_subtitle_format(invalid_content.to_string(), "vtt".to_string()).await;
  assert!(result.is_ok());
  assert!(!result.unwrap());
}

#[tokio::test]
async fn test_validate_subtitle_format_ass_valid() {
  let ass_content = "[Script Info]\nTitle: Test\n\n[Events]\nDialogue: ...";
  let result = validate_subtitle_format(ass_content.to_string(), "ass".to_string()).await;
  assert!(result.is_ok());
  assert!(result.unwrap());
}

#[tokio::test]
async fn test_validate_subtitle_format_unknown() {
  let result = validate_subtitle_format("content".to_string(), "xyz".to_string()).await;
  assert!(result.is_err());
  assert!(result.unwrap_err().contains("Unknown format"));
}

#[tokio::test]
async fn test_convert_subtitle_format_same() {
  let content = "test content";
  let result =
    convert_subtitle_format(content.to_string(), "srt".to_string(), "srt".to_string()).await;
  assert!(result.is_ok());
  assert_eq!(result.unwrap(), content);
}

#[tokio::test]
async fn test_get_subtitle_info_srt() {
  let srt_content =
    "1\n00:00:01,000 --> 00:00:04,000\nFirst\n\n2\n00:00:05,000 --> 00:00:08,000\nSecond";
  let result = get_subtitle_info(srt_content.to_string(), "srt".to_string()).await;

  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info.format, "srt");
  assert_eq!(info.subtitle_count, 2);
  assert!(!info.has_styling);
  assert!(info.duration.is_none());
}

#[tokio::test]
async fn test_get_subtitle_info_vtt_with_styling() {
  let vtt_content = "WEBVTT\n\nNOTE\nSome note\n\nSTYLE\n::cue { color: red; }\n\n00:00:01.000 --> 00:00:04.000\nStyled text";
  let result = get_subtitle_info(vtt_content.to_string(), "vtt".to_string()).await;

  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info.format, "vtt");
  assert_eq!(info.subtitle_count, 1);
  assert!(info.has_styling);
}

#[tokio::test]
async fn test_get_subtitle_info_ass() {
  let ass_content = "[Events]\nDialogue: 0,0:00:01.00,0:00:04.00,Default,,0,0,0,,First\nDialogue: 0,0:00:05.00,0:00:08.00,Default,,0,0,0,,Second";
  let result = get_subtitle_info(ass_content.to_string(), "ass".to_string()).await;

  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info.format, "ass");
  assert_eq!(info.subtitle_count, 2);
  assert!(info.has_styling); // ASS всегда имеет стилизацию
}

#[tokio::test]
async fn test_get_subtitle_info_empty() {
  let result = get_subtitle_info("".to_string(), "srt".to_string()).await;

  assert!(result.is_ok());
  let info = result.unwrap();
  assert_eq!(info.subtitle_count, 0);
}

// Тесты для граничных случаев
#[tokio::test]
async fn test_read_subtitle_file_empty() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("empty.srt");
  fs::write(&file_path, "").unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_ok());

  let import_result = result.unwrap();
  assert_eq!(import_result.content, "");
}

#[tokio::test]
async fn test_save_subtitle_file_empty_content() {
  let temp_dir = TempDir::new().unwrap();
  let output_path = temp_dir.path().join("empty.srt");

  let options = SubtitleExportOptions {
    format: "srt".to_string(),
    content: "".to_string(),
    output_path: output_path.to_str().unwrap().to_string(),
  };

  let result = save_subtitle_file(options).await;
  assert!(result.is_ok());

  let saved_content = fs::read_to_string(&output_path).unwrap();
  assert_eq!(saved_content, "");
}

#[tokio::test]
async fn test_validate_subtitle_format_empty_content() {
  let result = validate_subtitle_format("".to_string(), "srt".to_string()).await;
  assert!(result.is_ok());
  assert!(!result.unwrap()); // Пустой контент невалиден
}

#[tokio::test]
async fn test_ssa_extension_recognized_as_ass() {
  let temp_dir = TempDir::new().unwrap();
  let file_path = temp_dir.path().join("test.ssa");

  let ssa_content = "[Script Info]\nTitle: SSA Test";
  fs::write(&file_path, ssa_content).unwrap();

  let result = read_subtitle_file(file_path.to_str().unwrap().to_string()).await;
  assert!(result.is_ok());

  let import_result = result.unwrap();
  assert_eq!(import_result.format, "ass"); // SSA обрабатывается как ASS
}
