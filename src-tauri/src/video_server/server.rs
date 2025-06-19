use axum::{
  extract::{Path, Query, State},
  http::{header, HeaderMap, StatusCode},
  response::{IntoResponse, Response},
  routing::get,
  Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs::File;
use tokio::io::{AsyncReadExt, AsyncSeekExt};
use tokio::sync::Mutex;
use tokio_util::io::ReaderStream;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
pub struct VideoServerState {
  // Map video ID to actual file path
  pub(crate) video_registry: Arc<Mutex<HashMap<String, PathBuf>>>,
}

#[derive(Serialize, Deserialize)]
pub struct VideoRegistrationResponse {
  pub id: String,
  pub url: String,
}

impl VideoServerState {
  pub fn new() -> Self {
    Self {
      video_registry: Arc::new(Mutex::new(HashMap::new())),
    }
  }

  pub async fn register_video(&self, path: PathBuf) -> String {
    // Generate unique ID for video
    let id = format!("{:x}", md5::compute(path.to_string_lossy().as_bytes()));

    let mut registry = self.video_registry.lock().await;
    registry.insert(id.clone(), path);

    id
  }
}

pub fn create_video_router(state: VideoServerState) -> Router {
  Router::new()
    .route("/video/:id", get(stream_video))
    .route("/register", get(register_video_endpoint))
    .route("/health", get(health_check))
    .layer(
      CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any),
    )
    .with_state(state)
}

async fn health_check() -> impl IntoResponse {
  (StatusCode::OK, "Video server is running")
}

async fn stream_video(
  Path(id): Path<String>,
  headers: HeaderMap,
  State(state): State<VideoServerState>,
) -> Result<Response, StatusCode> {
  let registry = state.video_registry.lock().await;
  let path = registry.get(&id).ok_or(StatusCode::NOT_FOUND)?;

  let mut file = File::open(path).await.map_err(|_| StatusCode::NOT_FOUND)?;
  let metadata = file
    .metadata()
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
  let file_size = metadata.len();

  // Determine content type based on file extension
  let content_type = match path.extension().and_then(|ext| ext.to_str()) {
    Some("mp4") => "video/mp4",
    Some("webm") => "video/webm",
    Some("mov") => "video/quicktime",
    Some("avi") => "video/x-msvideo",
    Some("mkv") => "video/x-matroska",
    _ => "video/mp4", // default
  };

  // Parse Range header
  if let Some(range_header) = headers.get(header::RANGE) {
    let range_str = range_header.to_str().map_err(|_| StatusCode::BAD_REQUEST)?;
    if let Some(range) = parse_range_header(range_str, file_size) {
      let (start, end) = range;

      // Seek to start position
      file
        .seek(std::io::SeekFrom::Start(start))
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

      // Create limited reader for the range
      let limited = file.take(end - start + 1);
      let stream = ReaderStream::new(limited);

      return Ok(
        Response::builder()
          .status(StatusCode::PARTIAL_CONTENT)
          .header(header::CONTENT_TYPE, content_type)
          .header(header::ACCEPT_RANGES, "bytes")
          .header(header::CONTENT_LENGTH, (end - start + 1).to_string())
          .header(
            header::CONTENT_RANGE,
            format!("bytes {}-{}/{}", start, end, file_size),
          )
          .body(axum::body::Body::from_stream(stream))
          .unwrap(),
      );
    }
  }

  // No range header, return entire file
  let stream = ReaderStream::new(file);

  Ok(
    Response::builder()
      .status(StatusCode::OK)
      .header(header::CONTENT_TYPE, content_type)
      .header(header::ACCEPT_RANGES, "bytes")
      .header(header::CONTENT_LENGTH, file_size.to_string())
      .body(axum::body::Body::from_stream(stream))
      .unwrap(),
  )
}

pub(crate) fn parse_range_header(range: &str, file_size: u64) -> Option<(u64, u64)> {
  if let Some(range) = range.strip_prefix("bytes=") {
    let parts: Vec<&str> = range.split('-').collect();
    if parts.len() == 2 {
      let start = parts[0].parse::<u64>().ok()?;
      let end = if parts[1].is_empty() {
        file_size - 1
      } else {
        parts[1].parse::<u64>().ok()?.min(file_size - 1)
      };
      return Some((start, end));
    }
  }
  None
}

async fn register_video_endpoint(
  Query(params): Query<HashMap<String, String>>,
  State(state): State<VideoServerState>,
) -> Result<impl IntoResponse, StatusCode> {
  let path = params.get("path").ok_or(StatusCode::BAD_REQUEST)?;
  let path = PathBuf::from(path);

  if !path.exists() {
    return Err(StatusCode::NOT_FOUND);
  }

  let id = state.register_video(path).await;

  Ok(axum::Json(VideoRegistrationResponse {
    id: id.clone(),
    url: format!("http://localhost:4567/video/{}", id),
  }))
}

// Start server function to be called from main.rs
pub async fn start_video_server(state: VideoServerState) {
  let app = create_video_router(state);

  match tokio::net::TcpListener::bind("127.0.0.1:4567").await {
    Ok(listener) => {
      log::info!("Video server listening on http://localhost:4567");
      if let Err(e) = axum::serve(listener, app).await {
        log::error!("Video server error: {}", e);
      }
    }
    Err(e) => {
      log::error!("Failed to bind video server: {}", e);
    }
  }
}
