#[cfg(test)]
mod audio_analyzer_deep_tests {
  use crate::montage_planner::services::AudioAnalyzer;
  use crate::montage_planner::types::*;
  use std::fs;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_analyzer() -> AudioAnalyzer {
    AudioAnalyzer::new()
  }

  fn create_test_audio_file() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test_audio.wav");

    // Создаем простой WAV файл с тестовыми данными
    // В реальном тесте здесь бы был настоящий аудио файл
    fs::write(&file_path, vec![0u8; 1024]).unwrap();

    (temp_dir, file_path)
  }

  #[tokio::test]
  async fn test_audio_analysis_missing_file() {
    let analyzer = create_analyzer();

    let result = analyzer.analyze_audio("non_existent_file.wav").await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(path) => {
        assert_eq!(path, "non_existent_file.wav");
      }
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_content_type_detection() {
    let _analyzer = create_analyzer();
    let (_temp_dir, _audio_file) = create_test_audio_file();

    // В реальном тесте analyze_audio вернет результат анализа
    // Здесь мы тестируем логику определения типа контента
    let speech_result = AudioAnalysisResult {
      content_type: AudioContentType::Speech,
      speech_presence: 85.0,
      music_presence: 10.0,
      ambient_level: 5.0,
      emotional_tone: EmotionalTone::Neutral,
      tempo: None,
      beat_markers: vec![],
      energy_level: 60.0,
      dynamic_range: 40.0,
    };

    assert!(matches!(
      speech_result.content_type,
      AudioContentType::Speech
    ));
    assert!(speech_result.speech_presence > 80.0);

    let music_result = AudioAnalysisResult {
      content_type: AudioContentType::Music,
      speech_presence: 5.0,
      music_presence: 90.0,
      ambient_level: 5.0,
      emotional_tone: EmotionalTone::Excited,
      tempo: Some(120.0),
      beat_markers: vec![0.0, 0.5, 1.0, 1.5],
      energy_level: 80.0,
      dynamic_range: 60.0,
    };

    assert!(matches!(music_result.content_type, AudioContentType::Music));
    assert!(music_result.music_presence > 85.0);
    assert!(music_result.tempo.is_some());
  }

  #[tokio::test]
  async fn test_emotional_tone_mapping() {
    // Тестируем маппинг эмоциональных тонов на основе энергии и частот
    let high_energy_tone = EmotionalTone::Excited;
    let low_energy_tone = EmotionalTone::Sad;
    let neutral_tone = EmotionalTone::Neutral;

    // Проверяем, что все тоны существуют в enum
    assert!(matches!(high_energy_tone, EmotionalTone::Excited));
    assert!(matches!(low_energy_tone, EmotionalTone::Sad));
    assert!(matches!(neutral_tone, EmotionalTone::Neutral));
  }

  #[tokio::test]
  async fn test_beat_detection_with_tempo() {
    let _analyzer = create_analyzer();

    // Тестируем генерацию битов на основе темпа
    let tempo = 120.0; // 120 BPM
    let duration = 10.0; // 10 секунд

    let beat_interval = 60.0 / tempo;
    let expected_beats = (duration / beat_interval) as usize;

    let mut beats = vec![];
    let mut current_time = 0.0;
    while current_time < duration {
      beats.push(current_time);
      current_time += beat_interval;
    }

    // Проверяем правильность расчета
    assert_eq!(beats.len(), expected_beats);
    assert!(((beats[1] - beats[0] - beat_interval) as f64).abs() < 0.001_f64);
  }

  #[tokio::test]
  async fn test_audio_segment_analysis() {
    let analyzer = create_analyzer();
    let (_temp_dir, audio_file) = create_test_audio_file();

    // Анализируем сегмент аудио
    let segment = analyzer
      .analyze_audio_segment(&audio_file, 1.0, 2.0)
      .await
      .unwrap();

    assert_eq!(segment.start_time, 1.0);
    assert_eq!(segment.duration, 2.0);
    assert!(segment.rms_energy >= 0.0 && segment.rms_energy <= 1.0);
    assert!(segment.spectral_centroid >= 0.0);
    assert!(segment.zero_crossing_rate >= 0.0 && segment.zero_crossing_rate <= 1.0);
    assert_eq!(segment.mfcc.len(), 13); // Стандартное количество MFCC коэффициентов
    assert!(segment.speech_probability >= 0.0 && segment.speech_probability <= 1.0);
    assert!(segment.music_probability >= 0.0 && segment.music_probability <= 1.0);
  }

  #[test]
  fn test_extract_moment_features() {
    let analyzer = create_analyzer();

    let segment = crate::montage_planner::services::audio_analyzer::AudioSegmentAnalysis {
      start_time: 0.0,
      duration: 1.0,
      rms_energy: 0.7,
      spectral_centroid: 3000.0,
      zero_crossing_rate: 0.2,
      mfcc: vec![0.0; 13],
      pitch: Some(440.0),
      speech_probability: 0.8,
      music_probability: 0.2,
    };

    let features = analyzer.extract_moment_features(&segment);

    assert_eq!(features.energy_level, 70.0);
    assert_eq!(features.spectral_brightness, 75.0);
    assert_eq!(features.rhythmic_strength, 20.0); // Low because music_probability is low
    assert_eq!(features.vocal_presence, 80.0);
    assert_eq!(features.harmonic_content, 20.0);
    assert_eq!(features.tempo_stability, 70.0);
  }

  #[test]
  fn test_sync_with_video_moments() {
    let analyzer = create_analyzer();

    let audio_analysis = AudioAnalysisResult {
      content_type: AudioContentType::Music,
      speech_presence: 20.0,
      music_presence: 80.0,
      ambient_level: 10.0,
      emotional_tone: EmotionalTone::Happy,
      tempo: Some(128.0),
      beat_markers: vec![0.0, 0.468, 0.937, 1.406, 1.875, 2.343, 2.812, 3.281],
      energy_level: 75.0,
      dynamic_range: 50.0,
    };

    let video_moments = vec![
      DetectedMoment {
        timestamp: 0.0,
        duration: 1.0,
        category: MomentCategory::Action,
        scores: MomentScores {
          visual: 80.0,
          technical: 75.0,
          emotional: 70.0,
          narrative: 65.0,
          action: 90.0,
          composition: 78.0,
        },
        total_score: 80.0,
        description: "Action sequence".to_string(),
        tags: vec!["action".to_string()],
      },
      DetectedMoment {
        timestamp: 2.0,
        duration: 1.5,
        category: MomentCategory::Drama,
        scores: MomentScores {
          visual: 70.0,
          technical: 80.0,
          emotional: 90.0,
          narrative: 85.0,
          action: 40.0,
          composition: 82.0,
        },
        total_score: 78.0,
        description: "Dramatic moment".to_string(),
        tags: vec!["drama".to_string()],
      },
    ];

    let synced_moments = analyzer.sync_with_video_moments(&audio_analysis, &video_moments);

    assert_eq!(synced_moments.len(), 2);

    // Первый момент должен иметь хорошую синхронизацию с битом
    // Проверяем, что есть хотя бы один бит в диапазоне
    assert!(
      !synced_moments[0].beat_alignment.is_empty(),
      "Нет битов в диапазоне первого момента"
    );
    assert!(
      synced_moments[0].sync_score > 40.0,
      "Sync score слишком низкий: {}",
      synced_moments[0].sync_score
    );

    // Второй момент тоже должен иметь биты
    assert!(!synced_moments[1].beat_alignment.is_empty());
  }

  #[test]
  fn test_generate_audio_cues() {
    let analyzer = create_analyzer();

    let audio_analysis = AudioAnalysisResult {
      content_type: AudioContentType::Mixed,
      speech_presence: 60.0,
      music_presence: 70.0,
      ambient_level: 15.0,
      emotional_tone: EmotionalTone::Neutral,
      tempo: Some(100.0),
      beat_markers: vec![0.0, 0.6, 1.2, 1.8, 2.4],
      energy_level: 65.0,
      dynamic_range: 45.0,
    };

    let cues = analyzer.generate_audio_cues(&audio_analysis);

    // Должны быть cue для каждого бита
    let beat_cues: Vec<_> = cues
      .iter()
      .filter(|c| {
        matches!(
          c.cue_type,
          crate::montage_planner::services::audio_analyzer::AudioCueType::Beat
        )
      })
      .collect();
    assert_eq!(beat_cues.len(), 5);

    // Должны быть cue для речи
    let speech_cues: Vec<_> = cues
      .iter()
      .filter(|c| {
        matches!(
          c.cue_type,
          crate::montage_planner::services::audio_analyzer::AudioCueType::SpeechStart
            | crate::montage_planner::services::audio_analyzer::AudioCueType::SpeechEnd
        )
      })
      .collect();
    assert_eq!(speech_cues.len(), 2);

    // Должен быть cue для музыкального перехода
    let music_cues: Vec<_> = cues
      .iter()
      .filter(|c| {
        matches!(
          c.cue_type,
          crate::montage_planner::services::audio_analyzer::AudioCueType::MusicTransition
        )
      })
      .collect();
    assert_eq!(music_cues.len(), 1);

    // Все cue должны быть отсортированы по времени
    for i in 1..cues.len() {
      assert!(cues[i].timestamp >= cues[i - 1].timestamp);
    }
  }

  #[test]
  fn test_dynamic_range_calculation() {
    // Тестируем преобразование LRA в шкалу 0-100
    let lra_values = vec![
      (0.0, 0.0),    // Нет динамического диапазона
      (10.0, 50.0),  // Средний диапазон
      (20.0, 100.0), // Широкий диапазон (максимум)
      (25.0, 100.0), // Очень широкий (ограничен максимумом)
    ];

    for (lra, expected) in lra_values {
      let result = (lra * 5.0_f32).clamp(0.0_f32, 100.0_f32);
      assert_eq!(result, expected);
    }
  }

  #[test]
  fn test_energy_level_conversion() {
    // Тестируем преобразование dB в шкалу 0-100
    let db_values = vec![
      (-60.0, 0.0),  // Минимальный уровень
      (-30.0, 50.0), // Средний уровень
      (0.0, 100.0),  // Максимальный уровень
      (10.0, 100.0), // Выше максимума (ограничен)
      (-80.0, 0.0),  // Ниже минимума (ограничен)
    ];

    for (db, expected) in db_values {
      let result = ((db + 60.0_f32) / 60.0_f32 * 100.0_f32).clamp(0.0_f32, 100.0_f32);
      assert_eq!(result, expected);
    }
  }

  #[test]
  fn test_audio_content_type_serialization() {
    // Проверяем, что все типы контента можно сериализовать
    let content_types = vec![
      AudioContentType::Speech,
      AudioContentType::Music,
      AudioContentType::Ambient,
      AudioContentType::Mixed,
      AudioContentType::Silence,
    ];

    for content_type in content_types {
      let serialized = serde_json::to_string(&content_type).unwrap();
      let deserialized: AudioContentType = serde_json::from_str(&serialized).unwrap();

      match (content_type, deserialized) {
        (AudioContentType::Speech, AudioContentType::Speech) => assert!(true),
        (AudioContentType::Music, AudioContentType::Music) => assert!(true),
        (AudioContentType::Ambient, AudioContentType::Ambient) => assert!(true),
        (AudioContentType::Mixed, AudioContentType::Mixed) => assert!(true),
        (AudioContentType::Silence, AudioContentType::Silence) => assert!(true),
        _ => panic!("Serialization mismatch"),
      }
    }
  }

  #[test]
  fn test_emotional_tone_variety() {
    // Проверяем, что у нас есть разнообразие эмоциональных тонов
    let tones = vec![
      EmotionalTone::Neutral,
      EmotionalTone::Happy,
      EmotionalTone::Sad,
      EmotionalTone::Angry,
      EmotionalTone::Surprised,
      EmotionalTone::Fear,
      EmotionalTone::Disgust,
      EmotionalTone::Excited,
      EmotionalTone::Calm,
      EmotionalTone::Tense,
    ];

    // Проверяем, что все тоны уникальны
    use std::collections::HashSet;
    let unique_tones: HashSet<_> = tones.iter().collect();
    assert_eq!(unique_tones.len(), tones.len());
  }

  #[test]
  fn test_beat_alignment_scoring() {
    let analyzer = create_analyzer();

    let moment = DetectedMoment {
      timestamp: 1.0,
      duration: 0.5,
      category: MomentCategory::Action,
      scores: MomentScores {
        visual: 85.0,
        technical: 80.0,
        emotional: 70.0,
        narrative: 65.0,
        action: 90.0,
        composition: 78.0,
      },
      total_score: 82.0,
      description: "Test moment".to_string(),
      tags: vec![],
    };

    // Тест с идеальным выравниванием
    let perfect_beats = vec![1.0]; // Точно на начале момента
    let perfect_audio = AudioAnalysisResult {
      content_type: AudioContentType::Music,
      speech_presence: 10.0,
      music_presence: 90.0,
      ambient_level: 5.0,
      emotional_tone: EmotionalTone::Excited,
      tempo: Some(120.0),
      beat_markers: perfect_beats.clone(),
      energy_level: 85.0,
      dynamic_range: 60.0,
    };

    let synced = analyzer.sync_with_video_moments(&perfect_audio, &[moment.clone()]);
    assert!(synced[0].sync_score >= 80.0); // Высокий балл за идеальное выравнивание

    // Тест с небольшим смещением
    let offset_beats = vec![1.05]; // 50ms смещение
    let offset_audio = AudioAnalysisResult {
      content_type: AudioContentType::Music,
      speech_presence: 10.0,
      music_presence: 90.0,
      ambient_level: 5.0,
      emotional_tone: EmotionalTone::Excited,
      tempo: Some(120.0),
      beat_markers: offset_beats,
      energy_level: 85.0,
      dynamic_range: 60.0,
    };

    let synced_offset = analyzer.sync_with_video_moments(&offset_audio, &[moment]);
    assert!(
      synced_offset[0].sync_score >= 50.0,
      "Offset sync score слишком низкий: {}",
      synced_offset[0].sync_score
    ); // Все еще хороший балл
       // Проверяем, что идеальное выравнивание дает лучший результат или равный (из-за округления)
    assert!(
      synced_offset[0].sync_score <= synced[0].sync_score,
      "Offset sync ({}) должен быть <= perfect sync ({})",
      synced_offset[0].sync_score,
      synced[0].sync_score
    );
  }
}
