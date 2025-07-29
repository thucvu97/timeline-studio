use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Данные для создания новой персоны
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonData {
  pub name: String,
  pub alternative_names: Vec<String>,
  pub notes: Option<String>,
  pub tags: Vec<String>,
  pub metadata: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonProfile {
  pub id: String,
  pub name: String,
  pub description: Option<String>,
  pub tags: Vec<String>,
  pub is_verified: bool,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FaceEmbedding {
  pub id: String,
  pub person_id: String,
  pub embedding: Vec<f32>, // 512-dimensional vector
  pub quality: f32,
  pub source_clip_id: String,
  pub frame_number: i32,
  pub timestamp: f64,
  pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonAppearance {
  pub id: String,
  pub person_id: String,
  pub clip_id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub confidence: f32,
  pub frame_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PersonThumbnail {
  pub id: String,
  pub person_id: String,
  pub image_data: Vec<u8>, // JPEG/PNG data
  pub width: i32,
  pub height: i32,
  pub is_primary: bool,
  pub quality: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SimilaritySearchResult {
  pub person_id: String,
  pub similarity: f32,
  pub embedding_id: String,
  pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseStats {
  pub total_persons: i64,
  pub total_embeddings: i64,
  pub total_appearances: i64,
  pub average_embeddings_per_person: f64,
  pub storage_size_bytes: i64,
  pub last_updated: String,
}
