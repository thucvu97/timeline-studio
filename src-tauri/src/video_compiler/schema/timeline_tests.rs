//! Тесты для модуля timeline

#[cfg(test)]
use super::*;
use std::path::PathBuf;

#[test]
fn test_timeline_default() {
    let timeline = Timeline::default();
    assert_eq!(timeline.duration, 0.0);
    assert_eq!(timeline.fps, 30);
    assert_eq!(timeline.resolution, (1920, 1080));
    assert_eq!(timeline.sample_rate, 48000);
    assert_eq!(timeline.aspect_ratio, AspectRatio::Ratio16x9);
}

#[test]
fn test_timeline_serialization() {
    let timeline = Timeline {
        duration: 120.5,
        fps: 60,
        resolution: (3840, 2160),
        sample_rate: 44100,
        aspect_ratio: AspectRatio::Ratio16x9,
    };
    
    let json = serde_json::to_string(&timeline).unwrap();
    let deserialized: Timeline = serde_json::from_str(&json).unwrap();
    
    assert_eq!(deserialized.duration, timeline.duration);
    assert_eq!(deserialized.fps, timeline.fps);
    assert_eq!(deserialized.resolution, timeline.resolution);
    assert_eq!(deserialized.sample_rate, timeline.sample_rate);
    assert_eq!(deserialized.aspect_ratio, timeline.aspect_ratio);
}

#[test]
fn test_track_new() {
    let track = Track::new(TrackType::Video, "Video Track 1".to_string());
    
    assert!(!track.id.is_empty());
    assert_eq!(track.track_type, TrackType::Video);
    assert_eq!(track.name, "Video Track 1");
    assert!(track.enabled);
    assert_eq!(track.volume, 1.0);
    assert!(!track.locked);
    assert!(track.clips.is_empty());
    assert!(track.effects.is_empty());
    assert!(track.filters.is_empty());
}

#[test]
fn test_track_validation_empty_name() {
    let mut track = Track::new(TrackType::Audio, "".to_string());
    track.name = String::new();
    
    let result = track.validate();
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Название трека не может быть пустым");
}

#[test]
fn test_track_validation_invalid_volume() {
    let mut track = Track::new(TrackType::Audio, "Audio Track".to_string());
    
    // Test negative volume
    track.volume = -0.1;
    let result = track.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Громкость трека"));
    
    // Test volume too high
    track.volume = 2.1;
    let result = track.validate();
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Громкость трека"));
    
    // Test valid volume range
    track.volume = 0.0;
    assert!(track.validate().is_ok());
    
    track.volume = 1.5;
    assert!(track.validate().is_ok());
    
    track.volume = 2.0;
    assert!(track.validate().is_ok());
}

#[test]
fn test_track_add_and_remove_clip() {
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    
    let clip1 = Clip::new(PathBuf::from("/video1.mp4"), 0.0, 5.0);
    let clip2 = Clip::new(PathBuf::from("/video2.mp4"), 10.0, 5.0);
    let clip3 = Clip::new(PathBuf::from("/video3.mp4"), 5.0, 5.0);
    
    let clip1_id = clip1.id.clone();
    let clip2_id = clip2.id.clone();
    
    // Add clips
    track.add_clip(clip1);
    track.add_clip(clip2);
    track.add_clip(clip3);
    
    // Check clips are sorted by start time
    assert_eq!(track.clips.len(), 3);
    assert_eq!(track.clips[0].start_time, 0.0);
    assert_eq!(track.clips[1].start_time, 5.0);
    assert_eq!(track.clips[2].start_time, 10.0);
    
    // Remove clip
    track.remove_clip(&clip1_id);
    assert_eq!(track.clips.len(), 2);
    assert!(!track.clips.iter().any(|c| c.id == clip1_id));
    
    // Remove another clip
    track.remove_clip(&clip2_id);
    assert_eq!(track.clips.len(), 1);
}

#[test]
fn test_clip_new() {
    let clip = Clip::new(PathBuf::from("/path/to/video.mp4"), 10.0, 5.0);
    
    assert!(!clip.id.is_empty());
    assert_eq!(clip.start_time, 10.0);
    assert_eq!(clip.end_time, 15.0);
    assert_eq!(clip.source_start, 0.0);
    assert_eq!(clip.source_end, 5.0);
    assert_eq!(clip.speed, 1.0);
    assert_eq!(clip.opacity, 1.0);
    assert!(clip.effects.is_empty());
    assert!(clip.filters.is_empty());
    assert!(clip.template_id.is_none());
    assert!(clip.template_position.is_none());
}

#[test]
fn test_clip_validation() {
    // Test empty file path
    let mut clip = Clip::new(PathBuf::from(""), 0.0, 5.0);
    clip.source = ClipSource::File(String::new());
    assert!(clip.validate().is_err());
    
    // Test negative start time
    clip.source = ClipSource::File("/video.mp4".to_string());
    clip.start_time = -1.0;
    assert!(clip.validate().is_err());
    
    // Test invalid time range
    clip.start_time = 10.0;
    clip.end_time = 5.0;
    assert!(clip.validate().is_err());
    
    // Test invalid speed
    clip.end_time = 15.0;
    clip.speed = 0.0;
    assert!(clip.validate().is_err());
    
    clip.speed = -1.0;
    assert!(clip.validate().is_err());
    
    // Test invalid opacity
    clip.speed = 1.0;
    clip.opacity = -0.1;
    assert!(clip.validate().is_err());
    
    clip.opacity = 1.1;
    assert!(clip.validate().is_err());
    
    // Test valid clip
    clip.opacity = 0.5;
    assert!(clip.validate().is_ok());
}

#[test]
fn test_clip_timeline_duration() {
    let clip = Clip::new(PathBuf::from("/video.mp4"), 10.0, 5.0);
    assert_eq!(clip.get_timeline_duration(), 5.0);
    
    let mut custom_clip = clip.clone();
    custom_clip.start_time = 0.0;
    custom_clip.end_time = 20.0;
    assert_eq!(custom_clip.get_timeline_duration(), 20.0);
}

#[test]
fn test_clip_source_duration() {
    let mut clip = Clip::new(PathBuf::from("/video.mp4"), 0.0, 10.0);
    
    // Normal speed
    assert_eq!(clip.get_source_duration(), 10.0);
    
    // Double speed
    clip.speed = 2.0;
    assert_eq!(clip.get_source_duration(), 5.0);
    
    // Half speed
    clip.speed = 0.5;
    assert_eq!(clip.get_source_duration(), 20.0);
}

#[test]
fn test_clip_contains_time() {
    let clip = Clip::new(PathBuf::from("/video.mp4"), 10.0, 5.0);
    
    assert!(!clip.contains_time(9.9));
    assert!(clip.contains_time(10.0));
    assert!(clip.contains_time(12.5));
    assert!(clip.contains_time(14.9));
    assert!(!clip.contains_time(15.0));
    assert!(!clip.contains_time(20.0));
}

#[test]
fn test_clip_source_serialization() {
    let sources = vec![
        ClipSource::File("/path/to/video.mp4".to_string()),
        ClipSource::Generated,
        ClipSource::Stream("rtmp://example.com/stream".to_string()),
        ClipSource::Device("camera:0".to_string()),
    ];
    
    for source in sources {
        let json = serde_json::to_string(&source).unwrap();
        let deserialized: ClipSource = serde_json::from_str(&json).unwrap();
        match (&source, &deserialized) {
            (ClipSource::File(a), ClipSource::File(b)) => assert_eq!(a, b),
            (ClipSource::Generated, ClipSource::Generated) => {},
            (ClipSource::Stream(a), ClipSource::Stream(b)) => assert_eq!(a, b),
            (ClipSource::Device(a), ClipSource::Device(b)) => assert_eq!(a, b),
            _ => panic!("Serialization mismatch"),
        }
    }
}

#[test]
fn test_track_type_equality() {
    assert_eq!(TrackType::Video, TrackType::Video);
    assert_eq!(TrackType::Audio, TrackType::Audio);
    assert_eq!(TrackType::Subtitle, TrackType::Subtitle);
    assert_ne!(TrackType::Video, TrackType::Audio);
    assert_ne!(TrackType::Audio, TrackType::Subtitle);
    assert_ne!(TrackType::Video, TrackType::Subtitle);
}

#[test]
fn test_color_correction_default() {
    let cc = ColorCorrection::default();
    assert_eq!(cc.brightness, 0.0);
    assert_eq!(cc.contrast, 1.0);
    assert_eq!(cc.saturation, 1.0);
    assert_eq!(cc.hue, 0.0);
    assert_eq!(cc.gamma, 1.0);
    assert_eq!(cc.highlights, 0.0);
    assert_eq!(cc.shadows, 0.0);
    assert_eq!(cc.whites, 0.0);
    assert_eq!(cc.blacks, 0.0);
}

#[test]
fn test_transform_settings_default() {
    let transform = TransformSettings::default();
    assert_eq!(transform.scale_x, 1.0);
    assert_eq!(transform.scale_y, 1.0);
    assert_eq!(transform.position_x, 0.0);
    assert_eq!(transform.position_y, 0.0);
    assert_eq!(transform.rotation, 0.0);
    assert_eq!(transform.anchor_x, 0.5);
    assert_eq!(transform.anchor_y, 0.5);
}

#[test]
fn test_clip_properties_default() {
    let props = ClipProperties::default();
    assert!(props.notes.is_none());
    assert!(props.tags.is_empty());
    assert!(props.custom_metadata.is_empty());
}

#[test]
fn test_clip_with_custom_properties() {
    let mut clip = Clip::new(PathBuf::from("/video.mp4"), 0.0, 10.0);
    
    // Add color correction
    clip.color_correction = Some(ColorCorrection {
        brightness: 0.2,
        contrast: 1.1,
        saturation: 0.9,
        ..ColorCorrection::default()
    });
    
    // Add transform
    clip.transform = Some(TransformSettings {
        scale_x: 1.5,
        scale_y: 1.5,
        rotation: 45.0,
        ..TransformSettings::default()
    });
    
    // Add properties
    clip.properties.notes = Some("Important scene".to_string());
    clip.properties.tags = vec!["intro".to_string(), "highlight".to_string()];
    clip.properties.custom_metadata.insert("rating".to_string(), serde_json::json!(5));
    
    // Serialize and deserialize
    let json = serde_json::to_string(&clip).unwrap();
    let deserialized: Clip = serde_json::from_str(&json).unwrap();
    
    assert_eq!(deserialized.color_correction.as_ref().unwrap().brightness, 0.2);
    assert_eq!(deserialized.transform.as_ref().unwrap().rotation, 45.0);
    assert_eq!(deserialized.properties.notes, Some("Important scene".to_string()));
    assert_eq!(deserialized.properties.tags.len(), 2);
    assert_eq!(deserialized.properties.custom_metadata.get("rating"), Some(&serde_json::json!(5)));
}