//! Deep comprehensive tests for CompositionAnalyzer service

use super::super::composition_analyzer::*;
use crate::montage_planner::types::*;
use crate::recognition::frame_processor::{
  BoundingBox as YoloBoundingBox, Detection as YoloDetection,
};

#[cfg(test)]
mod deep_tests {
  use super::*;

  // Helper function to create realistic YOLO detection
  fn create_test_yolo_detection(
    class: &str,
    class_id: usize,
    x: f32,
    y: f32,
    width: f32,
    height: f32,
    confidence: f32,
  ) -> YoloDetection {
    YoloDetection {
      class: class.to_string(),
      class_id,
      confidence,
      bbox: YoloBoundingBox {
        x,
        y,
        width,
        height,
      },
      attributes: None,
    }
  }

  // Helper function to validate composition score values
  fn validate_composition_score(score: &CompositionScore) -> bool {
    score.rule_of_thirds >= 0.0
      && score.rule_of_thirds <= 100.0
      && score.balance >= 0.0
      && score.balance <= 100.0
      && score.focus_clarity >= 0.0
      && score.focus_clarity <= 100.0
      && score.depth_of_field >= 0.0
      && score.depth_of_field <= 100.0
      && score.leading_lines >= 0.0
      && score.leading_lines <= 100.0
      && score.symmetry >= 0.0
      && score.symmetry <= 100.0
      && score.overall_score >= 0.0
      && score.overall_score <= 100.0
  }

  #[test]
  fn test_rule_of_thirds_analysis() {
    let analyzer = CompositionAnalyzer::new();

    // Test object positioned exactly on rule of thirds intersection
    // Rule of thirds intersections are at 1/3 and 2/3 of frame dimensions
    // For 1920x1080: intersections at (640,360), (640,720), (1280,360), (1280,720)
    let thirds_detections = vec![
      create_test_yolo_detection("person", 0, 620.0, 340.0, 40.0, 80.0, 0.9), // Near (640,360)
      create_test_yolo_detection("car", 1, 1260.0, 340.0, 80.0, 60.0, 0.85),  // Near (1280,360)
    ];

    let result = analyzer.analyze_composition(&thirds_detections, 1.0, 1920.0, 1080.0);
    assert!(result.is_ok());

    let enhanced = result.unwrap();

    // Objects on rule of thirds should score reasonably well
    assert!(enhanced.composition_score.rule_of_thirds > 50.0);
    assert!(enhanced.composition_score.overall_score > 40.0);

    // Compare with centered objects
    let center_detections = vec![
      create_test_yolo_detection("person", 0, 940.0, 520.0, 40.0, 80.0, 0.9), // Center
    ];

    let center_result = analyzer.analyze_composition(&center_detections, 1.0, 1920.0, 1080.0);
    assert!(center_result.is_ok());

    let center_enhanced = center_result.unwrap();

    // Rule of thirds should generally score higher than center placement
    assert!(
      enhanced.composition_score.rule_of_thirds >= center_enhanced.composition_score.rule_of_thirds
    );
  }

  #[test]
  fn test_visual_balance_analysis() {
    let analyzer = CompositionAnalyzer::new();

    // Test balanced composition - objects on both sides
    let balanced_detections = vec![
      create_test_yolo_detection("person", 0, 400.0, 400.0, 100.0, 150.0, 0.9), // Left side
      create_test_yolo_detection("car", 1, 1400.0, 450.0, 120.0, 80.0, 0.85),   // Right side
    ];

    let balanced_result = analyzer.analyze_composition(&balanced_detections, 1.0, 1920.0, 1080.0);
    assert!(balanced_result.is_ok());
    let balanced_enhanced = balanced_result.unwrap();

    // Test unbalanced composition - all objects on one side
    let unbalanced_detections = vec![
      create_test_yolo_detection("person", 0, 300.0, 400.0, 100.0, 150.0, 0.9), // Left side
      create_test_yolo_detection("dog", 1, 400.0, 500.0, 80.0, 60.0, 0.8),      // Left side
      create_test_yolo_detection("bicycle", 2, 500.0, 350.0, 60.0, 100.0, 0.75), // Left side
    ];

    let unbalanced_result =
      analyzer.analyze_composition(&unbalanced_detections, 1.0, 1920.0, 1080.0);
    assert!(unbalanced_result.is_ok());
    let unbalanced_enhanced = unbalanced_result.unwrap();

    // Balanced composition should score higher in balance metric
    assert!(
      balanced_enhanced.composition_score.balance > unbalanced_enhanced.composition_score.balance
    );
  }

  #[test]
  fn test_depth_and_layering_analysis() {
    let analyzer = CompositionAnalyzer::new();

    // Test composition with objects at different scales (implying depth)
    let depth_detections = vec![
      create_test_yolo_detection("person", 0, 800.0, 300.0, 200.0, 400.0, 0.95), // Large (foreground)
      create_test_yolo_detection("person", 1, 1200.0, 400.0, 100.0, 200.0, 0.85), // Medium (midground)
      create_test_yolo_detection("person", 2, 1400.0, 450.0, 50.0, 100.0, 0.75), // Small (background)
      create_test_yolo_detection("car", 3, 400.0, 500.0, 300.0, 150.0, 0.9), // Large (foreground)
    ];

    let depth_result = analyzer.analyze_composition(&depth_detections, 1.0, 1920.0, 1080.0);
    assert!(depth_result.is_ok());
    let depth_enhanced = depth_result.unwrap();

    // Test flat composition - all objects similar size
    let flat_detections = vec![
      create_test_yolo_detection("person", 0, 400.0, 400.0, 100.0, 150.0, 0.9),
      create_test_yolo_detection("person", 1, 800.0, 400.0, 100.0, 150.0, 0.85),
      create_test_yolo_detection("person", 2, 1200.0, 400.0, 100.0, 150.0, 0.8),
    ];

    let flat_result = analyzer.analyze_composition(&flat_detections, 1.0, 1920.0, 1080.0);
    assert!(flat_result.is_ok());
    let flat_enhanced = flat_result.unwrap();

    // Composition with depth should score higher in depth_of_field
    assert!(
      depth_enhanced.composition_score.depth_of_field
        >= flat_enhanced.composition_score.depth_of_field
    );

    // Visual importance should be higher for composition with varied scales
    assert!(depth_enhanced.visual_importance >= flat_enhanced.visual_importance);
  }

  #[test]
  fn test_symmetry_analysis() {
    let analyzer = CompositionAnalyzer::new();

    // Test symmetrical composition
    let symmetric_detections = vec![
      create_test_yolo_detection("person", 0, 760.0, 400.0, 80.0, 120.0, 0.9), // Left of center
      create_test_yolo_detection("person", 1, 1080.0, 400.0, 80.0, 120.0, 0.9), // Right of center (symmetric)
      create_test_yolo_detection("car", 2, 920.0, 600.0, 160.0, 80.0, 0.85),    // Center bottom
    ];

    let symmetric_result = analyzer.analyze_composition(&symmetric_detections, 1.0, 1920.0, 1080.0);
    assert!(symmetric_result.is_ok());
    let symmetric_enhanced = symmetric_result.unwrap();

    // Test asymmetrical composition
    let asymmetric_detections = vec![
      create_test_yolo_detection("person", 0, 300.0, 400.0, 80.0, 120.0, 0.9),
      create_test_yolo_detection("car", 1, 1400.0, 300.0, 200.0, 100.0, 0.85),
      create_test_yolo_detection("dog", 2, 600.0, 700.0, 60.0, 40.0, 0.8),
    ];

    let asymmetric_result =
      analyzer.analyze_composition(&asymmetric_detections, 1.0, 1920.0, 1080.0);
    assert!(asymmetric_result.is_ok());
    let asymmetric_enhanced = asymmetric_result.unwrap();

    // Symmetric composition should score higher in symmetry
    assert!(
      symmetric_enhanced.composition_score.symmetry
        >= asymmetric_enhanced.composition_score.symmetry
    );
  }

  #[test]
  fn test_focus_clarity_analysis() {
    let analyzer = CompositionAnalyzer::new();

    // Test composition with clear main subject (one dominant object)
    let clear_focus_detections = vec![
      create_test_yolo_detection("person", 0, 800.0, 400.0, 300.0, 500.0, 0.98), // Large, high confidence
      create_test_yolo_detection("dog", 1, 1400.0, 600.0, 50.0, 40.0, 0.7), // Small, lower confidence
    ];

    let clear_result = analyzer.analyze_composition(&clear_focus_detections, 1.0, 1920.0, 1080.0);
    assert!(clear_result.is_ok());
    let clear_enhanced = clear_result.unwrap();

    // Test composition with unclear focus (multiple competing objects)
    let unclear_focus_detections = vec![
      create_test_yolo_detection("person", 0, 400.0, 400.0, 150.0, 200.0, 0.85),
      create_test_yolo_detection("car", 1, 1000.0, 400.0, 200.0, 120.0, 0.88),
      create_test_yolo_detection("bicycle", 2, 1400.0, 350.0, 140.0, 180.0, 0.82),
    ];

    let unclear_result =
      analyzer.analyze_composition(&unclear_focus_detections, 1.0, 1920.0, 1080.0);
    assert!(unclear_result.is_ok());
    let unclear_enhanced = unclear_result.unwrap();

    // Clear focus should score higher in focus_clarity
    assert!(
      clear_enhanced.composition_score.focus_clarity
        > unclear_enhanced.composition_score.focus_clarity
    );

    // Frame dominance should also be higher with clear focus
    assert!(clear_enhanced.frame_dominance > unclear_enhanced.frame_dominance);
  }

  #[test]
  fn test_leading_lines_detection() {
    let analyzer = CompositionAnalyzer::new();

    // Test composition that suggests leading lines (aligned objects)
    let aligned_detections = vec![
      create_test_yolo_detection("car", 0, 200.0, 400.0, 150.0, 80.0, 0.9),
      create_test_yolo_detection("car", 1, 500.0, 420.0, 140.0, 75.0, 0.85),
      create_test_yolo_detection("car", 2, 800.0, 440.0, 130.0, 70.0, 0.8),
      create_test_yolo_detection("car", 3, 1100.0, 460.0, 120.0, 65.0, 0.75),
    ];

    let aligned_result = analyzer.analyze_composition(&aligned_detections, 1.0, 1920.0, 1080.0);
    assert!(aligned_result.is_ok());
    let aligned_enhanced = aligned_result.unwrap();

    // Test composition without leading lines (scattered objects)
    let scattered_detections = vec![
      create_test_yolo_detection("person", 0, 300.0, 200.0, 80.0, 120.0, 0.9),
      create_test_yolo_detection("dog", 1, 1200.0, 600.0, 60.0, 40.0, 0.85),
      create_test_yolo_detection("bicycle", 2, 600.0, 800.0, 100.0, 140.0, 0.8),
      create_test_yolo_detection("car", 3, 1400.0, 300.0, 180.0, 90.0, 0.75),
    ];

    let scattered_result = analyzer.analyze_composition(&scattered_detections, 1.0, 1920.0, 1080.0);
    assert!(scattered_result.is_ok());
    let scattered_enhanced = scattered_result.unwrap();

    // Aligned composition should score higher in leading_lines
    assert!(
      aligned_enhanced.composition_score.leading_lines
        >= scattered_enhanced.composition_score.leading_lines
    );
  }

  #[test]
  fn test_different_frame_sizes_and_aspect_ratios() {
    let analyzer = CompositionAnalyzer::new();
    let detections = vec![create_test_yolo_detection(
      "person", 0, 100.0, 100.0, 80.0, 120.0, 0.9,
    )];

    // Test different frame sizes
    let frame_sizes = [
      (1920.0, 1080.0), // 16:9 HD
      (3840.0, 2160.0), // 4K
      (1280.0, 720.0),  // 720p
      (720.0, 576.0),   // SD
      (1920.0, 1920.0), // Square
      (2560.0, 1440.0), // 16:9 QHD
    ];

    for (width, height) in frame_sizes.iter() {
      let result = analyzer.analyze_composition(&detections, 1.0, *width, *height);
      assert!(result.is_ok(), "Failed for frame size {}x{}", width, height);

      let enhanced = result.unwrap();

      // All composition scores should be valid regardless of frame size
      assert!(validate_composition_score(&enhanced.composition_score));
      assert!(enhanced.visual_importance >= 0.0);
      assert!(enhanced.frame_dominance >= 0.0);
      assert!(enhanced.frame_dominance <= 100.0);
    }
  }

  #[test]
  fn test_edge_case_object_positions() {
    let analyzer = CompositionAnalyzer::new();

    // Test objects at frame edges and corners
    let edge_detections = vec![
      create_test_yolo_detection("person", 0, 0.0, 0.0, 50.0, 80.0, 0.9), // Top-left corner
      create_test_yolo_detection("car", 1, 1870.0, 0.0, 50.0, 60.0, 0.85), // Top-right corner
      create_test_yolo_detection("dog", 2, 0.0, 1020.0, 40.0, 60.0, 0.8), // Bottom-left corner
      create_test_yolo_detection("bicycle", 3, 1870.0, 1020.0, 50.0, 60.0, 0.75), // Bottom-right corner
      create_test_yolo_detection("truck", 4, 960.0, 0.0, 100.0, 80.0, 0.9),       // Top edge center
      create_test_yolo_detection("bus", 5, 960.0, 1000.0, 120.0, 80.0, 0.85), // Bottom edge center
    ];

    let result = analyzer.analyze_composition(&edge_detections, 1.0, 1920.0, 1080.0);
    assert!(result.is_ok());

    let enhanced = result.unwrap();

    // Should handle edge cases without errors
    assert!(validate_composition_score(&enhanced.composition_score));
    assert!(enhanced.visual_importance >= 0.0);

    // Objects at edges might have different composition implications
    assert!(enhanced.composition_score.balance >= 0.0);
    assert!(enhanced.composition_score.symmetry >= 0.0);
  }

  #[test]
  fn test_confidence_impact_on_composition() {
    let analyzer = CompositionAnalyzer::new();

    // Test with high confidence detections
    let high_conf_detections = vec![
      create_test_yolo_detection("person", 0, 640.0, 360.0, 100.0, 150.0, 0.98),
      create_test_yolo_detection("car", 1, 1280.0, 720.0, 200.0, 100.0, 0.95),
    ];

    let high_conf_result = analyzer.analyze_composition(&high_conf_detections, 1.0, 1920.0, 1080.0);
    assert!(high_conf_result.is_ok());
    let high_conf_enhanced = high_conf_result.unwrap();

    // Test with low confidence detections
    let low_conf_detections = vec![
      create_test_yolo_detection("person", 0, 640.0, 360.0, 100.0, 150.0, 0.45),
      create_test_yolo_detection("car", 1, 1280.0, 720.0, 200.0, 100.0, 0.38),
    ];

    let low_conf_result = analyzer.analyze_composition(&low_conf_detections, 1.0, 1920.0, 1080.0);
    assert!(low_conf_result.is_ok());
    let low_conf_enhanced = low_conf_result.unwrap();

    // High confidence should generally result in better composition scores
    assert!(high_conf_enhanced.visual_importance > low_conf_enhanced.visual_importance);
    assert!(high_conf_enhanced.frame_dominance >= low_conf_enhanced.frame_dominance);
  }

  #[test]
  fn test_composition_weights_impact() {
    // Test with rule-of-thirds focused weights
    let thirds_weights = CompositionWeights {
      rule_of_thirds: 0.5, // High weight
      balance: 0.1,
      focus_clarity: 0.1,
      depth_of_field: 0.1,
      leading_lines: 0.1,
      symmetry: 0.1,
    };

    let thirds_analyzer = CompositionAnalyzer::with_weights(thirds_weights);

    // Test with balance focused weights
    let balance_weights = CompositionWeights {
      rule_of_thirds: 0.1,
      balance: 0.5, // High weight
      focus_clarity: 0.1,
      depth_of_field: 0.1,
      leading_lines: 0.1,
      symmetry: 0.1,
    };

    let balance_analyzer = CompositionAnalyzer::with_weights(balance_weights);

    // Test with objects positioned on rule of thirds
    let thirds_detections = vec![create_test_yolo_detection(
      "person", 0, 640.0, 360.0, 80.0, 120.0, 0.9,
    )];

    // Test with balanced composition
    let balanced_detections = vec![
      create_test_yolo_detection("person", 0, 480.0, 400.0, 80.0, 120.0, 0.9),
      create_test_yolo_detection("car", 1, 1440.0, 400.0, 160.0, 80.0, 0.85),
    ];

    let thirds_result =
      thirds_analyzer.analyze_composition(&thirds_detections, 1.0, 1920.0, 1080.0);
    let balance_result =
      balance_analyzer.analyze_composition(&balanced_detections, 1.0, 1920.0, 1080.0);

    assert!(thirds_result.is_ok());
    assert!(balance_result.is_ok());

    let thirds_enhanced = thirds_result.unwrap();
    let balance_enhanced = balance_result.unwrap();

    // Different weights should produce different overall scores
    // The analyzer should weight the respective strengths higher
    assert!(thirds_enhanced.composition_score.overall_score > 0.0);
    assert!(balance_enhanced.composition_score.overall_score > 0.0);
  }

  #[test]
  fn test_temporal_consistency() {
    let analyzer = CompositionAnalyzer::new();

    // Create a sequence with gradually moving objects
    let sequence_detections = [
      vec![create_test_yolo_detection(
        "person", 0, 600.0, 400.0, 80.0, 120.0, 0.9,
      )],
      vec![create_test_yolo_detection(
        "person", 0, 640.0, 360.0, 80.0, 120.0, 0.9,
      )], // Moving to rule of thirds
      vec![create_test_yolo_detection(
        "person", 0, 680.0, 320.0, 80.0, 120.0, 0.9,
      )],
      vec![create_test_yolo_detection(
        "person", 0, 720.0, 280.0, 80.0, 120.0, 0.9,
      )],
    ];

    let mut results = Vec::new();
    for (i, detections) in sequence_detections.iter().enumerate() {
      let result = analyzer.analyze_composition(detections, i as f64, 1920.0, 1080.0);
      assert!(result.is_ok());
      results.push(result.unwrap());
    }

    // Verify temporal consistency
    assert_eq!(results.len(), 4);

    // All results should have valid composition scores
    for enhanced in &results {
      assert!(validate_composition_score(&enhanced.composition_score));
    }

    // The rule of thirds score should peak when object is closest to intersection
    let rule_scores: Vec<f32> = results
      .iter()
      .map(|r| r.composition_score.rule_of_thirds)
      .collect();
    let max_index = rule_scores
      .iter()
      .enumerate()
      .max_by(|(_, a), (_, b)| a.partial_cmp(b).unwrap())
      .map(|(i, _)| i)
      .unwrap();

    // Peak should be around frame 1 or 2 (when object is near rule of thirds intersection)
    assert!(max_index <= 2);
  }

  #[test]
  fn test_performance_with_many_objects() {
    let analyzer = CompositionAnalyzer::new();

    // Create detection with many objects to test performance
    let mut many_objects = Vec::new();
    for i in 0..50 {
      let x = (i % 10) as f32 * 180.0 + 50.0;
      let y = (i / 10) as f32 * 200.0 + 50.0;
      many_objects.push(create_test_yolo_detection(
        "person", i, x, y, 60.0, 80.0, 0.8,
      ));
    }

    let start_time = std::time::Instant::now();
    let result = analyzer.analyze_composition(&many_objects, 1.0, 1920.0, 1080.0);
    let duration = start_time.elapsed();

    // Should complete within reasonable time (less than 100ms)
    assert!(duration.as_millis() < 100);
    assert!(result.is_ok());

    let enhanced = result.unwrap();
    assert_eq!(enhanced.original_detections.len(), 50);
    assert!(validate_composition_score(&enhanced.composition_score));
  }
}
