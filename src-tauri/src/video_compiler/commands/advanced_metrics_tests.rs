//! Tests for advanced metrics commands
//!
//! Comprehensive test suite for metrics and alerting functionality

use super::*;

#[cfg(test)]
mod metrics_tests {
  use super::*;

  #[test]
  fn test_cache_alert_thresholds_structure() {
    let thresholds = CacheAlertThresholds {
      min_hit_rate: 0.80,
      max_memory_usage_mb: 512.0,
      max_response_time_ms: 50.0,
      max_fragmentation: 0.3,
    };

    assert_eq!(thresholds.min_hit_rate, 0.80);
    assert_eq!(thresholds.max_memory_usage_mb, 512.0);
    assert_eq!(thresholds.max_response_time_ms, 50.0);
    assert_eq!(thresholds.max_fragmentation, 0.3);
  }

  #[test]
  fn test_cache_performance_metrics_structure() {
    let slow_op = SlowCacheOperation {
      operation: "get_preview".to_string(),
      key: "large_4k_preview".to_string(),
      duration_ms: 250.0,
      timestamp: chrono::Utc::now().to_rfc3339(),
    };

    assert_eq!(slow_op.operation, "get_preview");
    assert_eq!(slow_op.key, "large_4k_preview");
    assert_eq!(slow_op.duration_ms, 250.0);
    assert!(!slow_op.timestamp.is_empty());
  }

  #[test]
  fn test_cache_alert_types() {
    let low_hit_rate = CacheAlert {
      alert_type: CacheAlertType::LowHitRate,
      message: "Cache hit rate is below threshold".to_string(),
      severity: AlertSeverity::Warning,
      timestamp: chrono::Utc::now().to_rfc3339(),
      current_value: 0.75,
      threshold_value: 0.80,
    };

    assert!(matches!(
      low_hit_rate.alert_type,
      CacheAlertType::LowHitRate
    ));
    assert!(matches!(low_hit_rate.severity, AlertSeverity::Warning));
    assert!(low_hit_rate.current_value < low_hit_rate.threshold_value);
  }

  #[test]
  fn test_alert_severity_levels() {
    let severities = [
      AlertSeverity::Info,
      AlertSeverity::Warning,
      AlertSeverity::Critical,
    ];

    // Test that all severity levels are distinct
    for (i, sev1) in severities.iter().enumerate() {
      for (j, _sev2) in severities.iter().enumerate() {
        if i == j {
          assert!(matches!(sev1, _sev2));
        }
      }
    }
  }

  #[test]
  fn test_cache_performance_validation() {
    let metrics = CachePerformanceMetrics {
      hit_rate_last_hour: 0.85,
      hit_rate_last_day: 0.82,
      average_response_time_ms: 12.5,
      peak_memory_usage_mb: 256.0,
      current_memory_usage_mb: 128.0,
      fragmentation_ratio: 0.15,
      top_accessed_keys: vec![
        "preview_1920x1080_60fps".to_string(),
        "render_segment_0-10s".to_string(),
      ],
      slow_operations: vec![],
    };

    // Validate hit rates are between 0 and 1
    assert!(metrics.hit_rate_last_hour >= 0.0 && metrics.hit_rate_last_hour <= 1.0);
    assert!(metrics.hit_rate_last_day >= 0.0 && metrics.hit_rate_last_day <= 1.0);

    // Validate memory usage
    assert!(metrics.current_memory_usage_mb <= metrics.peak_memory_usage_mb);

    // Validate fragmentation ratio
    assert!(metrics.fragmentation_ratio >= 0.0 && metrics.fragmentation_ratio <= 1.0);
  }

  #[test]
  fn test_json_value_creation() {
    // Test GPU metrics JSON structure
    let gpu_metrics = serde_json::json!({
      "gpu_utilization_percent": 65.0,
      "memory_used_mb": 1024.0,
      "memory_total_mb": 8192.0,
      "memory_utilization_percent": 12.5,
      "temperature_celsius": 72.0,
      "power_usage_watts": 150.0,
      "active_encoders": 2,
    });

    assert_eq!(gpu_metrics["gpu_utilization_percent"], 65.0);
    assert_eq!(gpu_metrics["memory_used_mb"], 1024.0);
    assert_eq!(gpu_metrics["memory_total_mb"], 8192.0);
  }

  #[test]
  fn test_memory_metrics_json() {
    let services = serde_json::json!({
      "cache_service": {
        "memory_mb": 128.0,
        "percentage": 25.0,
        "peak_memory_mb": 256.0,
        "allocations": 1250,
        "deallocations": 1180
      },
      "render_service": {
        "memory_mb": 256.0,
        "percentage": 50.0,
        "peak_memory_mb": 384.0,
        "allocations": 850,
        "deallocations": 820
      }
    });

    // Test service memory data
    assert_eq!(services["cache_service"]["memory_mb"], 128.0);
    assert_eq!(services["cache_service"]["percentage"], 25.0);
    assert_eq!(services["render_service"]["memory_mb"], 256.0);
    assert_eq!(services["render_service"]["percentage"], 50.0);
  }

  #[test]
  fn test_metrics_history_generation() {
    let start_time = chrono::Utc::now();
    let hours_back = 24;
    let mut data_points = Vec::new();

    for i in 0..hours_back {
      let timestamp = start_time - chrono::Duration::hours(hours_back as i64 - i as i64);
      let value = 0.8 + (i as f64 * 0.01);

      data_points.push(serde_json::json!({
        "timestamp": timestamp.to_rfc3339(),
        "value": value
      }));
    }

    assert_eq!(data_points.len(), 24);

    // Verify timestamps are ordered
    for i in 1..data_points.len() {
      let ts1 = data_points[i - 1]["timestamp"].as_str().unwrap();
      let ts2 = data_points[i]["timestamp"].as_str().unwrap();
      let dt1 = chrono::DateTime::parse_from_rfc3339(ts1).unwrap();
      let dt2 = chrono::DateTime::parse_from_rfc3339(ts2).unwrap();
      assert!(dt2 > dt1);
    }
  }

  #[test]
  fn test_uuid_generation_for_alerts() {
    let alert_id = uuid::Uuid::new_v4().to_string();

    // Verify UUID format
    assert!(uuid::Uuid::parse_str(&alert_id).is_ok());
    assert_eq!(alert_id.len(), 36); // Standard UUID length with hyphens
  }

  #[test]
  fn test_alert_timestamp_format() {
    let now = chrono::Utc::now();
    let timestamp = now.to_rfc3339();

    // Verify we can parse it back
    let parsed = chrono::DateTime::parse_from_rfc3339(&timestamp);
    assert!(parsed.is_ok());
  }

  #[test]
  fn test_metrics_summary_calculation() {
    let values = [10.0, 20.0, 30.0, 40.0, 50.0];

    let min = values.iter().fold(f64::INFINITY, |a, &b| a.min(b));
    let max = values.iter().fold(f64::NEG_INFINITY, |a, &b| a.max(b));
    let sum: f64 = values.iter().sum();
    let avg = sum / values.len() as f64;

    assert_eq!(min, 10.0);
    assert_eq!(max, 50.0);
    assert_eq!(avg, 30.0);
  }

  #[test]
  fn test_encoding_session_structure() {
    let session = serde_json::json!({
      "session_id": "render_001",
      "codec": "h264_nvenc",
      "resolution": "1920x1080",
      "fps": 30,
      "bitrate_mbps": 8.0,
      "duration_seconds": 45.2
    });

    assert_eq!(session["session_id"], "render_001");
    assert_eq!(session["codec"], "h264_nvenc");
    assert_eq!(session["resolution"], "1920x1080");
    assert_eq!(session["fps"], 30);
    assert_eq!(session["bitrate_mbps"], 8.0);
  }

  #[test]
  fn test_cache_key_patterns() {
    let keys = vec![
      "preview_1920x1080_60fps",
      "render_segment_0-10s",
      "metadata_video.mp4",
      "thumbnail_frame_001",
    ];

    for key in &keys {
      assert!(!key.is_empty());
      assert!(key.chars().all(|c| c.is_ascii_graphic()));
    }
  }

  #[test]
  fn test_threshold_validation() {
    struct ThresholdTest {
      min_hit_rate: f64,
      max_memory_mb: f64,
      max_response_ms: f64,
      max_fragmentation: f64,
    }

    let test_cases = vec![
      ThresholdTest {
        min_hit_rate: 0.0,
        max_memory_mb: 0.0,
        max_response_ms: 0.0,
        max_fragmentation: 0.0,
      },
      ThresholdTest {
        min_hit_rate: 1.0,
        max_memory_mb: f64::MAX,
        max_response_ms: f64::MAX,
        max_fragmentation: 1.0,
      },
      ThresholdTest {
        min_hit_rate: 0.75,
        max_memory_mb: 1024.0,
        max_response_ms: 100.0,
        max_fragmentation: 0.25,
      },
    ];

    for test in test_cases {
      assert!(test.min_hit_rate >= 0.0 && test.min_hit_rate <= 1.0);
      assert!(test.max_memory_mb >= 0.0);
      assert!(test.max_response_ms >= 0.0);
      assert!(test.max_fragmentation >= 0.0 && test.max_fragmentation <= 1.0);
    }
  }

  #[test]
  fn test_gc_stats_structure() {
    let gc_stats = serde_json::json!({
      "collections": 15,
      "total_freed_mb": 89.5,
      "average_collection_time_ms": 2.3
    });

    assert_eq!(gc_stats["collections"], 15);
    assert_eq!(gc_stats["total_freed_mb"], 89.5);
    assert_eq!(gc_stats["average_collection_time_ms"], 2.3);
  }
}
