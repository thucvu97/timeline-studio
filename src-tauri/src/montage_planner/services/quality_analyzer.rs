//! Video Quality Analyzer Service
//!
//! Analyzes video quality using FFmpeg for montage planning.

use crate::montage_planner::types::*;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Service for analyzing video quality
pub struct VideoQualityAnalyzer {
  /// Configuration for quality analysis
  config: QualityAnalysisConfig,
}

/// Configuration for quality analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityAnalysisConfig {
  pub sample_rate: f32, // Frames per second to analyze
  pub enable_sharpness: bool,
  pub enable_stability: bool,
  pub enable_exposure: bool,
  pub enable_noise: bool,
  pub enable_color: bool,
}

impl Default for QualityAnalysisConfig {
  fn default() -> Self {
    Self {
      sample_rate: 1.0,
      enable_sharpness: true,
      enable_stability: true,
      enable_exposure: true,
      enable_noise: true,
      enable_color: true,
    }
  }
}

impl VideoQualityAnalyzer {
  /// Create new quality analyzer
  pub fn new() -> Self {
    Self {
      config: QualityAnalysisConfig::default(),
    }
  }

  /// Create analyzer with custom configuration
  pub fn with_config(config: QualityAnalysisConfig) -> Self {
    Self { config }
  }

  /// Analyze video quality
  pub async fn analyze_quality<P: AsRef<Path>>(
    &self,
    video_path: P,
  ) -> Result<VideoQualityAnalysis, MontageError> {
    let path = video_path.as_ref();

    if !path.exists() {
      return Err(MontageError::FileNotFound(
        path.to_string_lossy().to_string(),
      ));
    }

    // TODO: Implement actual FFmpeg integration
    // For now, return mock data
    Ok(VideoQualityAnalysis {
      resolution: Resolution {
        width: 1920,
        height: 1080,
      },
      frame_rate: 30.0,
      bitrate: 8_000_000,
      sharpness: 85.0,
      stability: 92.0,
      exposure: 5.0,
      color_grading: 88.0,
      noise_level: 15.0,
      dynamic_range: 75.0,
    })
  }

  /// Analyze quality at specific timestamp
  pub async fn analyze_frame_quality<P: AsRef<Path>>(
    &self,
    video_path: P,
    timestamp: f64,
  ) -> Result<FrameQualityAnalysis, MontageError> {
    let path = video_path.as_ref();

    if !path.exists() {
      return Err(MontageError::FileNotFound(
        path.to_string_lossy().to_string(),
      ));
    }

    // TODO: Implement actual frame analysis
    Ok(FrameQualityAnalysis {
      timestamp,
      sharpness: 82.0 + (timestamp * 3.0) % 20.0, // Mock variation
      brightness: 45.0 + (timestamp * 2.0) % 30.0,
      contrast: 60.0 + (timestamp * 1.5) % 25.0,
      saturation: 70.0 + (timestamp * 2.5) % 15.0,
      noise_level: 10.0 + (timestamp * 0.5) % 10.0,
      motion_blur: 5.0 + (timestamp * 1.0) % 15.0,
      overall_quality: 80.0 + (timestamp * 1.0) % 15.0,
    })
  }

  /// Batch analyze quality for multiple timestamps
  pub async fn batch_analyze_quality<P: AsRef<Path>>(
    &self,
    video_path: P,
    timestamps: &[f64],
  ) -> Result<Vec<FrameQualityAnalysis>, MontageError> {
    let mut results = Vec::new();

    for &timestamp in timestamps {
      let quality = self.analyze_frame_quality(&video_path, timestamp).await?;
      results.push(quality);
    }

    Ok(results)
  }

  /// Get quality score for moment selection
  pub fn calculate_quality_score(
    &self,
    frame_quality: &FrameQualityAnalysis,
    video_quality: &VideoQualityAnalysis,
  ) -> f32 {
    let mut score = 0.0;

    // Frame-specific metrics (60% weight)
    score += frame_quality.sharpness * 0.15;
    score += (100.0 - frame_quality.noise_level) * 0.10;
    score += (100.0 - frame_quality.motion_blur) * 0.10;
    score += self.normalize_brightness(frame_quality.brightness) * 0.10;
    score += frame_quality.contrast * 0.10;
    score += frame_quality.saturation * 0.05;

    // Video-wide metrics (40% weight)
    score += video_quality.stability * 0.15;
    score += video_quality.color_grading * 0.10;
    score += (100.0 - video_quality.noise_level) * 0.10;
    score += video_quality.dynamic_range * 0.05;

    score.min(100.0).max(0.0)
  }

  /// Normalize brightness score (penalize over/under exposure)
  fn normalize_brightness(&self, brightness: f32) -> f32 {
    let optimal = 50.0;
    let diff = (brightness - optimal).abs();
    (100.0 - diff * 2.0).max(0.0)
  }

  /// Identify quality issues in a frame
  pub fn identify_quality_issues(&self, frame_quality: &FrameQualityAnalysis) -> Vec<QualityIssue> {
    let mut issues = Vec::new();

    if frame_quality.sharpness < 50.0 {
      issues.push(QualityIssue {
        issue_type: QualityIssueType::LowSharpness,
        severity: if frame_quality.sharpness < 30.0 {
          QualityIssueSeverity::High
        } else {
          QualityIssueSeverity::Medium
        },
        description: format!("Low sharpness detected: {:.1}%", frame_quality.sharpness),
        timestamp: frame_quality.timestamp,
      });
    }

    if frame_quality.noise_level > 50.0 {
      issues.push(QualityIssue {
        issue_type: QualityIssueType::HighNoise,
        severity: if frame_quality.noise_level > 75.0 {
          QualityIssueSeverity::High
        } else {
          QualityIssueSeverity::Medium
        },
        description: format!("High noise level: {:.1}%", frame_quality.noise_level),
        timestamp: frame_quality.timestamp,
      });
    }

    if frame_quality.motion_blur > 30.0 {
      issues.push(QualityIssue {
        issue_type: QualityIssueType::MotionBlur,
        severity: if frame_quality.motion_blur > 60.0 {
          QualityIssueSeverity::High
        } else {
          QualityIssueSeverity::Medium
        },
        description: format!("Motion blur detected: {:.1}%", frame_quality.motion_blur),
        timestamp: frame_quality.timestamp,
      });
    }

    if frame_quality.brightness < 20.0 || frame_quality.brightness > 80.0 {
      issues.push(QualityIssue {
        issue_type: if frame_quality.brightness < 20.0 {
          QualityIssueType::Underexposed
        } else {
          QualityIssueType::Overexposed
        },
        severity: QualityIssueSeverity::Medium,
        description: format!(
          "Exposure issue: {:.1}% brightness",
          frame_quality.brightness
        ),
        timestamp: frame_quality.timestamp,
      });
    }

    if frame_quality.contrast < 30.0 {
      issues.push(QualityIssue {
        issue_type: QualityIssueType::LowContrast,
        severity: QualityIssueSeverity::Low,
        description: format!("Low contrast: {:.1}%", frame_quality.contrast),
        timestamp: frame_quality.timestamp,
      });
    }

    issues
  }

  /// Filter moments based on quality criteria
  pub fn filter_by_quality(
    &self,
    moments: Vec<DetectedMoment>,
    quality_analyses: &[FrameQualityAnalysis],
    min_quality: f32,
  ) -> Vec<DetectedMoment> {
    moments
      .into_iter()
      .filter(|moment| {
        // Find quality analysis for this moment
        if let Some(quality) = quality_analyses
          .iter()
          .find(|q| (q.timestamp - moment.timestamp).abs() < 1.0)
        {
          quality.overall_quality >= min_quality
        } else {
          true // Keep if no quality data available
        }
      })
      .collect()
  }
}

/// Frame-specific quality analysis
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameQualityAnalysis {
  pub timestamp: f64,
  pub sharpness: f32,       // 0-100
  pub brightness: f32,      // 0-100
  pub contrast: f32,        // 0-100
  pub saturation: f32,      // 0-100
  pub noise_level: f32,     // 0-100 (higher = more noise)
  pub motion_blur: f32,     // 0-100 (higher = more blur)
  pub overall_quality: f32, // 0-100 (computed score)
}

/// Quality issue detection
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityIssue {
  pub issue_type: QualityIssueType,
  pub severity: QualityIssueSeverity,
  pub description: String,
  pub timestamp: f64,
}

/// Types of quality issues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QualityIssueType {
  LowSharpness,
  HighNoise,
  MotionBlur,
  Underexposed,
  Overexposed,
  LowContrast,
  ColorCast,
  Instability,
}

/// Severity levels for quality issues
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QualityIssueSeverity {
  Low,
  Medium,
  High,
  Critical,
}

impl Default for VideoQualityAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}
