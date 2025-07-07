#[cfg(test)]
mod tests {
  use crate::montage_planner::services::audio_analyzer::{
    AudioAnalysisConfig, AudioAnalyzer, AudioCue, AudioCueType, AudioMomentFeatures,
    AudioSegmentAnalysis, SyncedAudioVideoMoment,
  };
  use crate::montage_planner::types::*;
  use std::fs;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_analyzer() -> AudioAnalyzer {
    AudioAnalyzer::new()
  }

  fn create_analyzer_with_config(config: AudioAnalysisConfig) -> AudioAnalyzer {
    AudioAnalyzer::with_config(config)
  }

  fn create_test_audio_file() -> (TempDir, PathBuf) {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test_audio.wav");

    // Create a minimal mock audio file
    fs::write(&file_path, b"mock audio content").unwrap();

    (temp_dir, file_path)
  }

  fn create_test_audio_segment(start_time: f64, duration: f64) -> AudioSegmentAnalysis {
    AudioSegmentAnalysis {
      start_time,
      duration,
      rms_energy: 0.25,
      spectral_centroid: 2500.0,
      zero_crossing_rate: 0.1,
      mfcc: vec![
        0.5, -0.2, 0.8, -0.1, 0.3, -0.6, 0.7, -0.4, 0.2, -0.9, 0.6, -0.3, 0.1,
      ],
      pitch: Some(440.0),
      speech_probability: 0.7,
      music_probability: 0.3,
    }
  }

  fn create_test_moment(timestamp: f64) -> DetectedMoment {
    DetectedMoment {
      timestamp,
      duration: 2.0,
      category: MomentCategory::Action,
      scores: MomentScores {
        visual: 75.0,
        technical: 80.0,
        emotional: 70.0,
        narrative: 85.0,
        action: 60.0,
        composition: 78.0,
      },
      total_score: 75.0,
      description: "Test action moment".to_string(),
      tags: vec!["action".to_string(), "test".to_string()],
    }
  }

  fn create_test_audio_analysis() -> AudioAnalysisResult {
    AudioAnalysisResult {
      content_type: AudioContentType::Mixed,
      speech_presence: 0.7,
      music_presence: 0.4,
      ambient_level: 0.15,
      emotional_tone: EmotionalTone::Happy,
      tempo: Some(120.0),
      beat_markers: vec![0.0, 0.5, 1.0, 1.5, 2.0],
      energy_level: 0.8,
      dynamic_range: 24.0,
    }
  }

  #[test]
  fn test_analyzer_creation() {
    let _analyzer = create_analyzer();
    // Should create successfully with default config

    let config = AudioAnalysisConfig {
      sample_rate: 48000,
      frame_size: 4096,
      hop_length: 1024,
      enable_speech_detection: false,
      enable_music_detection: true,
      enable_beat_detection: true,
      enable_emotion_detection: false,
    };
    let _analyzer_with_config = create_analyzer_with_config(config.clone());
    // Should create successfully with custom config
  }

  #[test]
  fn test_default_config() {
    let config = AudioAnalysisConfig::default();
    assert_eq!(config.sample_rate, 44100);
    assert_eq!(config.frame_size, 2048);
    assert_eq!(config.hop_length, 512);
    assert!(config.enable_speech_detection);
    assert!(config.enable_music_detection);
    assert!(config.enable_beat_detection);
    assert!(config.enable_emotion_detection);
  }

  #[tokio::test]
  async fn test_analyze_audio_nonexistent_file() {
    let analyzer = create_analyzer();
    let result = analyzer.analyze_audio("nonexistent_audio.wav").await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(path) => {
        assert_eq!(path, "nonexistent_audio.wav");
      }
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_analyze_audio_existing_file() {
    let analyzer = create_analyzer();
    let (_temp_dir, audio_path) = create_test_audio_file();

    // FFmpeg commands will fail on mock files, so we expect an error
    let result = analyzer.analyze_audio(&audio_path).await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::AudioAnalysisError(_) => {
        // Expected: FFmpeg analysis fails on mock files
      }
      _ => panic!("Expected AudioAnalysisError"),
    }
  }

  #[tokio::test]
  async fn test_analyze_audio_segment_nonexistent_file() {
    let analyzer = create_analyzer();
    let result = analyzer
      .analyze_audio_segment("nonexistent.wav", 0.0, 5.0)
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      MontageError::FileNotFound(path) => {
        assert_eq!(path, "nonexistent.wav");
      }
      _ => panic!("Expected FileNotFound error"),
    }
  }

  #[tokio::test]
  async fn test_analyze_audio_segment_existing_file() {
    let analyzer = create_analyzer();
    let (_temp_dir, audio_path) = create_test_audio_file();

    let result = analyzer.analyze_audio_segment(&audio_path, 2.0, 3.0).await;

    assert!(result.is_ok());
    let segment = result.unwrap();

    assert_eq!(segment.start_time, 2.0);
    assert_eq!(segment.duration, 3.0);
    assert!(segment.rms_energy >= 0.0);
    assert!(segment.spectral_centroid > 0.0);
    assert!(segment.zero_crossing_rate >= 0.0);
    assert_eq!(segment.mfcc.len(), 13);
    assert!(segment.speech_probability >= 0.0 && segment.speech_probability <= 1.0);
    assert!(segment.music_probability >= 0.0 && segment.music_probability <= 1.0);
  }

  #[tokio::test]
  async fn test_analyze_audio_segment_different_timestamps() {
    let analyzer = create_analyzer();
    let (_temp_dir, audio_path) = create_test_audio_file();

    // Test different timestamps to verify mock data variation
    let segment1 = analyzer
      .analyze_audio_segment(&audio_path, 0.0, 1.0)
      .await
      .unwrap();
    let segment2 = analyzer
      .analyze_audio_segment(&audio_path, 5.0, 1.0)
      .await
      .unwrap();

    // Should have different values due to timestamp-based variation
    assert_ne!(segment1.rms_energy, segment2.rms_energy);
    assert_ne!(segment1.spectral_centroid, segment2.spectral_centroid);
  }

  #[test]
  fn test_extract_moment_features() {
    let analyzer = create_analyzer();
    let segment = create_test_audio_segment(1.0, 2.0);

    let features = analyzer.extract_moment_features(&segment);

    assert!(features.energy_level >= 0.0 && features.energy_level <= 100.0);
    assert!(features.spectral_brightness >= 0.0 && features.spectral_brightness <= 100.0);
    assert!(features.rhythmic_strength >= 0.0 && features.rhythmic_strength <= 100.0);
    assert!(features.vocal_presence >= 0.0 && features.vocal_presence <= 100.0);
    assert!(features.harmonic_content >= 0.0 && features.harmonic_content <= 100.0);
    assert!(features.tempo_stability >= 0.0 && features.tempo_stability <= 100.0);
  }

  #[test]
  fn test_extract_moment_features_different_segments() {
    let analyzer = create_analyzer();

    let mut speech_segment = create_test_audio_segment(1.0, 2.0);
    speech_segment.speech_probability = 0.9;
    speech_segment.music_probability = 0.1;

    let mut music_segment = create_test_audio_segment(1.0, 2.0);
    music_segment.speech_probability = 0.1;
    music_segment.music_probability = 0.9;

    let speech_features = analyzer.extract_moment_features(&speech_segment);
    let music_features = analyzer.extract_moment_features(&music_segment);

    // Speech should have higher vocal presence
    assert!(speech_features.vocal_presence > music_features.vocal_presence);

    // Music should have higher harmonic content
    assert!(music_features.harmonic_content > speech_features.harmonic_content);
  }

  #[test]
  fn test_sync_with_video_moments() {
    let analyzer = create_analyzer();
    let video_moments = vec![
      create_test_moment(1.0),
      create_test_moment(5.0),
      create_test_moment(10.0),
    ];

    let audio_analysis = create_test_audio_analysis();

    let synced_moments = analyzer.sync_with_video_moments(&audio_analysis, &video_moments);

    assert_eq!(synced_moments.len(), 3);

    // Check first synced moment
    let first_synced = &synced_moments[0];
    assert_eq!(first_synced.video_moment.timestamp, 1.0);
    assert!(first_synced.sync_score > 0.0);
    assert!(!first_synced.beat_alignment.is_empty());

    // Check sync scores are reasonable
    for synced in &synced_moments {
      assert!(synced.sync_score >= 0.0 && synced.sync_score <= 100.0);
    }
  }

  #[test]
  fn test_sync_with_video_moments_no_matching_audio() {
    let analyzer = create_analyzer();
    let video_moments = vec![create_test_moment(1.0), create_test_moment(10.0)];
    let audio_analysis = create_test_audio_analysis();

    let synced_moments = analyzer.sync_with_video_moments(&audio_analysis, &video_moments);

    // Should still create synced moments with default audio features
    assert_eq!(synced_moments.len(), 2);

    for synced in &synced_moments {
      assert!(synced.sync_score >= 0.0);
    }
  }

  #[test]
  fn test_generate_audio_cues() {
    let analyzer = create_analyzer();
    let audio_analysis = create_test_audio_analysis();

    let cues = analyzer.generate_audio_cues(&audio_analysis);

    // Check cue properties if any are generated
    for cue in &cues {
      assert!(cue.timestamp >= 0.0);
      assert!(cue.confidence >= 0.0 && cue.confidence <= 1.0);
      assert!(!cue.description.is_empty());
    }
  }

  #[test]
  fn test_generate_audio_cues_speech_only() {
    let analyzer = create_analyzer();
    let mut audio_analysis = create_test_audio_analysis();
    audio_analysis.content_type = AudioContentType::Speech;
    audio_analysis.music_presence = 0.0;

    let cues = analyzer.generate_audio_cues(&audio_analysis);

    // Check cue properties if any are generated
    for cue in &cues {
      assert!(cue.timestamp >= 0.0);
      assert!(cue.confidence >= 0.0 && cue.confidence <= 1.0);
      assert!(!cue.description.is_empty());
    }
  }

  #[test]
  fn test_generate_audio_cues_music_only() {
    let analyzer = create_analyzer();
    let mut audio_analysis = create_test_audio_analysis();
    audio_analysis.content_type = AudioContentType::Music;
    audio_analysis.speech_presence = 0.0;

    let cues = analyzer.generate_audio_cues(&audio_analysis);

    // Should still generate cues for music
    assert!(!cues.is_empty());

    // Check for beat and music transition cues
    let has_music_cues = cues.iter().any(|c| {
      matches!(
        c.cue_type,
        AudioCueType::Beat | AudioCueType::MusicTransition
      )
    });
    assert!(has_music_cues);
  }

  #[test]
  fn test_audio_segment_analysis_structure() {
    let segment = create_test_audio_segment(2.5, 3.0);

    assert_eq!(segment.start_time, 2.5);
    assert_eq!(segment.duration, 3.0);
    assert_eq!(segment.rms_energy, 0.25);
    assert_eq!(segment.spectral_centroid, 2500.0);
    assert_eq!(segment.zero_crossing_rate, 0.1);
    assert_eq!(segment.mfcc.len(), 13);
    assert_eq!(segment.pitch, Some(440.0));
    assert_eq!(segment.speech_probability, 0.7);
    assert_eq!(segment.music_probability, 0.3);
  }

  #[test]
  fn test_audio_moment_features_calculation() {
    let analyzer = create_analyzer();

    // Test high energy segment
    let mut high_energy_segment = create_test_audio_segment(1.0, 2.0);
    high_energy_segment.rms_energy = 0.8;
    high_energy_segment.spectral_centroid = 4000.0;

    let high_energy_features = analyzer.extract_moment_features(&high_energy_segment);

    // Test low energy segment
    let mut low_energy_segment = create_test_audio_segment(1.0, 2.0);
    low_energy_segment.rms_energy = 0.1;
    low_energy_segment.spectral_centroid = 1000.0;

    let low_energy_features = analyzer.extract_moment_features(&low_energy_segment);

    // High energy should score higher
    assert!(high_energy_features.energy_level > low_energy_features.energy_level);
    assert!(high_energy_features.spectral_brightness > low_energy_features.spectral_brightness);
  }

  #[test]
  fn test_synced_audio_video_moment_structure() {
    let video_moment = create_test_moment(5.0);
    let audio_features = AudioMomentFeatures {
      energy_level: 75.0,
      spectral_brightness: 60.0,
      rhythmic_strength: 80.0,
      vocal_presence: 90.0,
      harmonic_content: 70.0,
      tempo_stability: 85.0,
    };

    let synced_moment = SyncedAudioVideoMoment {
      video_moment: video_moment.clone(),
      audio_features: audio_features.clone(),
      beat_alignment: vec![5.0, 5.5, 6.0, 6.5],
      sync_score: 92.5,
    };

    assert_eq!(synced_moment.video_moment.timestamp, 5.0);
    assert_eq!(synced_moment.audio_features.energy_level, 75.0);
    assert_eq!(synced_moment.beat_alignment.len(), 4);
    assert_eq!(synced_moment.sync_score, 92.5);
  }

  #[test]
  fn test_audio_cue_types() {
    let cue_types = vec![
      AudioCueType::Beat,
      AudioCueType::SpeechStart,
      AudioCueType::SpeechEnd,
      AudioCueType::MusicTransition,
      AudioCueType::SilenceStart,
      AudioCueType::SilenceEnd,
      AudioCueType::EnergyPeak,
      AudioCueType::EnergyDrop,
    ];

    for cue_type in cue_types {
      let cue = AudioCue {
        timestamp: 1.0,
        cue_type: cue_type.clone(),
        confidence: 0.8,
        description: "Test cue".to_string(),
      };

      // Should serialize/deserialize without error
      let serialized = serde_json::to_string(&cue).unwrap();
      let _deserialized: AudioCue = serde_json::from_str(&serialized).unwrap();
    }
  }

  #[test]
  fn test_audio_analysis_config_serialization() {
    let config = AudioAnalysisConfig {
      sample_rate: 48000,
      frame_size: 4096,
      hop_length: 1024,
      enable_speech_detection: false,
      enable_music_detection: true,
      enable_beat_detection: false,
      enable_emotion_detection: true,
    };

    let serialized = serde_json::to_string(&config).unwrap();
    let deserialized: AudioAnalysisConfig = serde_json::from_str(&serialized).unwrap();

    assert_eq!(config.sample_rate, deserialized.sample_rate);
    assert_eq!(config.frame_size, deserialized.frame_size);
    assert_eq!(config.hop_length, deserialized.hop_length);
    assert_eq!(
      config.enable_speech_detection,
      deserialized.enable_speech_detection
    );
    assert_eq!(
      config.enable_music_detection,
      deserialized.enable_music_detection
    );
    assert_eq!(
      config.enable_beat_detection,
      deserialized.enable_beat_detection
    );
    assert_eq!(
      config.enable_emotion_detection,
      deserialized.enable_emotion_detection
    );
  }

  #[test]
  fn test_audio_segment_analysis_serialization() {
    let segment = create_test_audio_segment(2.0, 3.0);
    let serialized = serde_json::to_string(&segment).unwrap();
    let deserialized: AudioSegmentAnalysis = serde_json::from_str(&serialized).unwrap();

    assert_eq!(segment.start_time, deserialized.start_time);
    assert_eq!(segment.duration, deserialized.duration);
    assert_eq!(segment.rms_energy, deserialized.rms_energy);
    assert_eq!(segment.spectral_centroid, deserialized.spectral_centroid);
    assert_eq!(segment.zero_crossing_rate, deserialized.zero_crossing_rate);
    assert_eq!(segment.mfcc, deserialized.mfcc);
    assert_eq!(segment.pitch, deserialized.pitch);
    assert_eq!(segment.speech_probability, deserialized.speech_probability);
    assert_eq!(segment.music_probability, deserialized.music_probability);
  }

  #[test]
  fn test_default_implementation() {
    let _analyzer1 = AudioAnalyzer::default();
    let _analyzer2 = AudioAnalyzer::new();

    // Both should create successfully
  }

  #[test]
  fn test_audio_features_edge_cases() {
    let analyzer = create_analyzer();

    // Test segment with no pitch
    let mut no_pitch_segment = create_test_audio_segment(1.0, 2.0);
    no_pitch_segment.pitch = None;

    let features = analyzer.extract_moment_features(&no_pitch_segment);
    assert!(features.harmonic_content >= 0.0);

    // Test segment with extreme values
    let mut extreme_segment = create_test_audio_segment(1.0, 2.0);
    extreme_segment.rms_energy = 0.0;
    extreme_segment.spectral_centroid = 0.0;
    extreme_segment.zero_crossing_rate = 1.0;

    let extreme_features = analyzer.extract_moment_features(&extreme_segment);
    assert!(extreme_features.energy_level >= 0.0);
    assert!(extreme_features.spectral_brightness >= 0.0);
  }

  #[test]
  fn test_beat_alignment_generation() {
    let analyzer = create_analyzer();
    let video_moments = vec![create_test_moment(2.0)];
    let _audio_segments = [create_test_audio_segment(1.8, 2.0)];

    let audio_analysis = create_test_audio_analysis();
    let synced_moments = analyzer.sync_with_video_moments(&audio_analysis, &video_moments);

    assert_eq!(synced_moments.len(), 1);
    let synced = &synced_moments[0];

    // Beat alignment should be generated around the video moment timestamp
    assert!(!synced.beat_alignment.is_empty());

    // Beats should be reasonably close to the video moment
    for &beat_time in &synced.beat_alignment {
      assert!((1.0..=4.0).contains(&beat_time)); // Within reasonable range
    }
  }

  #[test]
  fn test_audio_cue_confidence_levels() {
    let analyzer = create_analyzer();
    let mut audio_analysis = create_test_audio_analysis();

    // Test with high energy
    audio_analysis.energy_level = 0.9;
    let high_energy_cues = analyzer.generate_audio_cues(&audio_analysis);

    // Test with low energy
    audio_analysis.energy_level = 0.1;
    let low_energy_cues = analyzer.generate_audio_cues(&audio_analysis);

    // Both should generate cues
    assert!(!high_energy_cues.is_empty());
    assert!(!low_energy_cues.is_empty());

    // Check confidence values are within range
    for cue in high_energy_cues.iter().chain(low_energy_cues.iter()) {
      assert!(cue.confidence >= 0.0 && cue.confidence <= 1.0);
    }
  }

  #[test]
  fn test_tempo_based_beat_markers() {
    let analyzer = create_analyzer();
    let mut fast_tempo_analysis = create_test_audio_analysis();
    fast_tempo_analysis.tempo = Some(160.0); // Fast tempo

    let mut slow_tempo_analysis = create_test_audio_analysis();
    slow_tempo_analysis.tempo = Some(60.0); // Slow tempo

    let fast_cues = analyzer.generate_audio_cues(&fast_tempo_analysis);
    let slow_cues = analyzer.generate_audio_cues(&slow_tempo_analysis);

    // Both should generate beat cues
    let fast_beats = fast_cues
      .iter()
      .filter(|c| matches!(c.cue_type, AudioCueType::Beat))
      .count();
    let slow_beats = slow_cues
      .iter()
      .filter(|c| matches!(c.cue_type, AudioCueType::Beat))
      .count();

    // Fast tempo should generally have more beat markers in the same time period
    assert!(fast_beats > 0);
    assert!(slow_beats > 0);
  }
}
