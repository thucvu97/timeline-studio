//! Tauri commands for Smart Montage Planner module
//!
//! This module provides the Tauri command interface for montage planning functionality.

use crate::command_registry::CommandRegistry;
use crate::montage_planner::services::*;
use crate::montage_planner::types::*;
use crate::recognition::commands::run_yolo_detection;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{command, Builder, Runtime};
use tokio::sync::RwLock;

/// Global state for montage planner services
pub struct MontageState {
  pub composition_analyzer: Arc<RwLock<CompositionAnalyzer>>,
  pub moment_detector: Arc<RwLock<MomentDetector>>,
  pub quality_analyzer: Arc<RwLock<VideoQualityAnalyzer>>,
  pub activity_calculator: Arc<RwLock<ActivityCalculator>>,
  pub emotion_detector: Arc<RwLock<EmotionDetector>>,
  pub plan_generator: Arc<RwLock<PlanGenerator>>,
  pub audio_analyzer: Arc<RwLock<AudioAnalyzer>>,
}

impl MontageState {
  pub fn new() -> Self {
    Self {
      composition_analyzer: Arc::new(RwLock::new(CompositionAnalyzer::new())),
      moment_detector: Arc::new(RwLock::new(MomentDetector::new())),
      quality_analyzer: Arc::new(RwLock::new(VideoQualityAnalyzer::new())),
      activity_calculator: Arc::new(RwLock::new(ActivityCalculator::new())),
      emotion_detector: Arc::new(RwLock::new(EmotionDetector::new())),
      plan_generator: Arc::new(RwLock::new(PlanGenerator::new())),
      audio_analyzer: Arc::new(RwLock::new(AudioAnalyzer::new())),
    }
  }
}

/// Analyze video file and generate enhanced YOLO results with composition analysis
#[command]
pub async fn analyze_video_composition(
  file_path: String,
  analysis_options: AnalysisOptions,
  state: tauri::State<'_, MontageState>,
) -> Result<Vec<CompositionEnhancedDetection>, String> {
  let path = PathBuf::from(&file_path);

  // Validate file exists
  if !path.exists() {
    return Err(format!("File not found: {}", file_path));
  }

  // Get frame dimensions (simplified - in real implementation would extract from video)
  let frame_width = 1920.0; // TODO: Extract from video metadata
  let frame_height = 1080.0;

  // Run YOLO detection first
  let yolo_results = run_yolo_detection(
    file_path.clone(),
    analysis_options.enable_object_detection,
    analysis_options.enable_face_detection,
    None, // Use default confidence threshold
  )
  .await
  .map_err(|e| format!("YOLO detection failed: {}", e))?;

  // Enhance with composition analysis
  let composition_analyzer = state.composition_analyzer.read().await;
  let mut enhanced_results = Vec::new();

  for yolo_result in yolo_results {
    match composition_analyzer.analyze_composition(&yolo_result, frame_width, frame_height) {
      Ok(enhanced) => enhanced_results.push(enhanced),
      Err(e) => {
        eprintln!(
          "Composition analysis failed for frame at {}: {:?}",
          yolo_result.timestamp, e
        );
        // Continue processing other frames
      }
    }
  }

  Ok(enhanced_results)
}

/// Detect key moments in video based on enhanced YOLO analysis
#[command]
pub async fn detect_key_moments(
  enhanced_detections: Vec<CompositionEnhancedDetection>,
  config: MontageConfig,
  state: tauri::State<'_, MontageState>,
) -> Result<Vec<DetectedMoment>, String> {
  let moment_detector = state.moment_detector.read().await;

  // Convert enhanced detections to moments
  let mut moments = Vec::new();

  for detection in enhanced_detections {
    // Create moment from detection
    let moment_scores = MomentScores {
      visual: detection.composition_score.overall_score,
      technical: detection
        .original_detection
        .v11_detections
        .first()
        .map(|d| match d {
          crate::recognition::types::YoloV11Detection::Object(obj) => obj.confidence * 100.0,
          crate::recognition::types::YoloV11Detection::Face(face) => face.confidence * 100.0,
        })
        .unwrap_or(0.0),
      emotional: 50.0, // TODO: Implement emotion analysis
      narrative: detection.visual_importance * 100.0,
      action: detection.frame_dominance,
      composition: detection.composition_score.overall_score,
    };

    let total_score = (moment_scores.visual * 0.3
      + moment_scores.technical * 0.2
      + moment_scores.emotional * 0.2
      + moment_scores.narrative * 0.15
      + moment_scores.action * 0.1
      + moment_scores.composition * 0.05);

    // Only include moments above quality threshold
    if total_score >= config.quality_threshold {
      let category = if detection.frame_dominance > 80.0 {
        MomentCategory::Action
      } else if !detection.original_detection.v11_detections.is_empty() {
        MomentCategory::Highlight
      } else {
        MomentCategory::BRoll
      };

      moments.push(DetectedMoment {
        timestamp: detection.original_detection.timestamp,
        duration: 2.0, // Default 2-second moments
        category,
        scores: moment_scores,
        total_score,
        description: format!(
          "Detected {} objects with {:.1}% composition score",
          detection.original_detection.v11_detections.len()
            + detection.original_detection.v8_detections.len(),
          detection.composition_score.overall_score
        ),
        tags: vec![
          format!(
            "composition_{:.0}",
            detection.composition_score.overall_score
          ),
          format!("activity_{:.0}", detection.frame_dominance),
        ],
      });
    }
  }

  // Sort by score and limit if specified
  moments.sort_by(|a, b| b.total_score.partial_cmp(&a.total_score).unwrap());

  if let Some(max_moments) = config.max_cuts_per_minute {
    let max_total = (config.target_duration / 60.0 * max_moments as f64) as usize;
    moments.truncate(max_total);
  }

  Ok(moments)
}

/// Generate montage plan from detected moments
#[command]
pub async fn generate_montage_plan(
  moments: Vec<DetectedMoment>,
  config: MontageConfig,
  source_files: Vec<String>,
  state: tauri::State<'_, MontageState>,
) -> Result<MontagePlan, String> {
  let plan_generator = state.plan_generator.read().await;

  // Generate clips from moments
  let mut clips = Vec::new();

  for (index, moment) in moments.iter().enumerate() {
    // Find corresponding source file (simplified)
    let source_file = source_files.first().ok_or("No source files provided")?;

    let clip = MontageClip {
      id: format!("clip_{}", index),
      source_file: source_file.clone(),
      start_time: moment.timestamp,
      end_time: moment.timestamp + moment.duration,
      duration: moment.duration,
      moment: moment.clone(),
      adjustments: ClipAdjustments {
        speed_multiplier: None,
        color_correction: None,
        stabilization: false,
        crop: None,
        fade_in: Some(0.2),
        fade_out: Some(0.2),
      },
      order: index as u32,
    };

    clips.push(clip);
  }

  // Generate transitions
  let mut transitions = Vec::new();

  for i in 0..clips.len().saturating_sub(1) {
    let transition = TransitionPlan {
      from_clip: clips[i].id.clone(),
      to_clip: clips[i + 1].id.clone(),
      transition_type: match config.style {
        MontageStyle::DynamicAction => TransitionType::Cut,
        MontageStyle::CinematicDrama => TransitionType::Dissolve,
        MontageStyle::MusicVideo => TransitionType::Cut,
        _ => TransitionType::Fade,
      },
      duration: 0.5,
      easing: EasingType::EaseInOut,
    };

    transitions.push(transition);
  }

  // Calculate plan statistics
  let total_duration: f64 = clips.iter().map(|c| c.duration).sum();
  let avg_score = if !moments.is_empty() {
    moments.iter().map(|m| m.total_score).sum::<f32>() / moments.len() as f32
  } else {
    0.0
  };

  let plan = MontagePlan {
    id: format!("plan_{}", chrono::Utc::now().timestamp()),
    name: format!("{:?} Montage Plan", config.style),
    style: config.style,
    total_duration,
    clips,
    transitions,
    quality_score: avg_score,
    engagement_score: avg_score * 0.8, // Simplified calculation
    created_at: chrono::Utc::now().to_rfc3339(),
  };

  Ok(plan)
}

/// Get analysis progress for long-running operations
#[command]
pub async fn get_analysis_progress(operation_id: String) -> Result<AnalysisProgress, String> {
  // TODO: Implement progress tracking
  Ok(AnalysisProgress {
    stage: "Analyzing composition".to_string(),
    progress: 75.0,
    current_file: Some("video.mp4".to_string()),
    eta_seconds: Some(30),
    message: "Processing frame analysis...".to_string(),
  })
}

/// Update composition analysis weights
#[command]
pub async fn update_composition_weights(
  weights: CompositionWeights,
  state: tauri::State<'_, MontageState>,
) -> Result<(), String> {
  let mut analyzer = state.composition_analyzer.write().await;
  *analyzer = CompositionAnalyzer::with_weights(weights);
  Ok(())
}

/// Command registry implementation for Montage Planner module
pub struct MontageCommandRegistry;

impl CommandRegistry for MontageCommandRegistry {
  fn register_commands<R: Runtime>(builder: Builder<R>) -> Builder<R> {
    builder.invoke_handler(tauri::generate_handler![
      analyze_video_composition,
      detect_key_moments,
      generate_montage_plan,
      get_analysis_progress,
      update_composition_weights
    ])
  }
}
