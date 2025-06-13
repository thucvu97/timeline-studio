// Тесты для процессора медиафайлов

#[cfg(test)]
mod tests {
  use super::super::processor::*;
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_scan_folder_empty() {
    // Создаем временную директорию
    let _temp_dir = TempDir::new().unwrap();

    // Создаем фиктивный AppHandle (в реальных тестах нужен мок)
    // let app_handle = create_mock_app_handle();

    // TODO: Добавить полноценные тесты после создания моков для AppHandle
  }

  #[test]
  fn test_discovered_file_creation() {
    let file = DiscoveredFile {
      id: "test-id".to_string(),
      path: "/path/to/test.mp4".to_string(),
      name: "test.mp4".to_string(),
      extension: "mp4".to_string(),
      size: 1024,
    };

    assert_eq!(file.id, "test-id");
    assert_eq!(file.name, "test.mp4");
    assert_eq!(file.extension, "mp4");
    assert_eq!(file.size, 1024);
  }

  #[test]
  fn test_processor_event_metadata_ready() {
    use crate::media::types::{FfprobeFormat, FfprobeStream, MediaFile, ProbeData};

    let media_file = MediaFile {
      id: "test-id".to_string(),
      name: "test.mp4".to_string(),
      path: "/path/to/test.mp4".to_string(),
      is_video: true,
      is_audio: false,
      is_image: false,
      size: 1024000,
      duration: Some(120.0),
      start_time: 0,
      creation_time: "2023-01-01T00:00:00Z".to_string(),
      probe_data: ProbeData {
        streams: vec![FfprobeStream {
          index: 0,
          codec_type: "video".to_string(),
          codec_name: Some("h264".to_string()),
          width: Some(1920),
          height: Some(1080),
          bit_rate: Some("5000000".to_string()),
          r_frame_rate: Some("30/1".to_string()),
          sample_rate: None,
          channels: None,
          display_aspect_ratio: Some("16:9".to_string()),
        }],
        format: FfprobeFormat {
          duration: Some(120.0),
          size: Some(1024000),
          bit_rate: Some("5000000".to_string()),
          format_name: Some("mp4".to_string()),
        },
      },
    };

    let event = ProcessorEvent::MetadataReady {
      file_id: "test-id".to_string(),
      file_path: "/path/to/test.mp4".to_string(),
      metadata: media_file,
    };

    let json = serde_json::to_string(&event).unwrap();
    assert!(json.contains("MetadataReady"));
    assert!(json.contains("test-id"));
    assert!(json.contains("test.mp4"));
  }

  #[test]
  fn test_resize_calculations() {
    // Тест для проверки логики изменения размера
    let original_width = 1920u32;
    let original_height = 1080u32;
    let max_width = 320u32;
    let max_height = 180u32;

    let width_ratio = max_width as f32 / original_width as f32;
    let height_ratio = max_height as f32 / original_height as f32;
    let ratio = width_ratio.min(height_ratio);

    let new_width = (original_width as f32 * ratio) as u32;
    let new_height = (original_height as f32 * ratio) as u32;

    assert_eq!(new_width, 320);
    assert_eq!(new_height, 180);
  }
}
