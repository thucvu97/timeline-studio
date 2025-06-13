pub mod commands;
pub mod recognition_service;
pub mod yolo_processor;

#[cfg(test)]
mod tests;

#[cfg(test)]
mod real_data_tests;

// Временно закомментировано, так как не используется в других модулях
// pub use yolo_processor::{YoloProcessor, YoloModel};
// pub use recognition_service::RecognitionService;
// pub use commands::RecognitionState;
