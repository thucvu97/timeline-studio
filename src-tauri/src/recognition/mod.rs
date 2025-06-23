pub mod commands;
pub mod recognition_service;
pub mod registry;
pub mod types;
pub mod yolo_processor;

// Новые модули после рефакторинга
pub mod frame_processor;
pub mod model_manager;
pub mod result_aggregator;
pub mod yolo_processor_refactored;

#[cfg(test)]
mod tests;

#[cfg(test)]
mod real_data_tests;

#[cfg(test)]
mod commands_test;

pub use commands::RecognitionState;
