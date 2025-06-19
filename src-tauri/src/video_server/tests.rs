use super::server;
use super::{VideoRegistrationResponse, VideoServerState};
use axum::body::Body;
use axum::http::{Request, StatusCode};
use std::io::Write;
use std::path::PathBuf;
use tempfile::NamedTempFile;
use tower::ServiceExt;

#[tokio::test]
async fn test_video_server_state_new() {
  let state = VideoServerState::new();
  let registry = state.video_registry.lock().await;
  assert!(registry.is_empty());
}

#[tokio::test]
async fn test_register_video() {
  let state = VideoServerState::new();
  let path = PathBuf::from("/test/video.mp4");

  let id = state.register_video(path.clone()).await;

  assert!(!id.is_empty());

  let registry = state.video_registry.lock().await;
  assert_eq!(registry.get(&id), Some(&path));
}

#[tokio::test]
async fn test_register_same_video_returns_same_id() {
  let state = VideoServerState::new();
  let path = PathBuf::from("/test/video.mp4");

  let id1 = state.register_video(path.clone()).await;
  let id2 = state.register_video(path.clone()).await;

  assert_eq!(id1, id2);
}

#[tokio::test]
async fn test_health_check() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  let response = app
    .oneshot(
      Request::builder()
        .uri("/health")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
async fn test_register_video_endpoint() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  // Create a temporary file
  let temp_file = NamedTempFile::new().unwrap();
  let path = temp_file.path().to_str().unwrap();

  let response = app
    .oneshot(
      Request::builder()
        .uri(format!("/register?path={}", urlencoding::encode(path)))
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);

  // Check response body
  let body = axum::body::to_bytes(response.into_body(), usize::MAX)
    .await
    .unwrap();
  let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
  assert!(json["id"].is_string());
  assert!(json["url"].is_string());
  assert!(json["url"]
    .as_str()
    .unwrap()
    .starts_with("http://localhost:4567/video/"));
}

#[tokio::test]
async fn test_register_video_endpoint_missing_path() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  let response = app
    .oneshot(
      Request::builder()
        .uri("/register")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn test_register_video_endpoint_nonexistent_file() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  let response = app
    .oneshot(
      Request::builder()
        .uri("/register?path=/nonexistent/file.mp4")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_stream_video_not_found() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  let response = app
    .oneshot(
      Request::builder()
        .uri("/video/nonexistent")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn test_stream_video_with_range() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state.clone());

  // Create a temporary file with content
  let mut temp_file = NamedTempFile::new().unwrap();
  temp_file.write_all(b"test video content").unwrap();
  temp_file.flush().unwrap();
  let path = temp_file.path().to_path_buf();

  // Register the video
  let id = state.register_video(path).await;

  let response = app
    .oneshot(
      Request::builder()
        .uri(format!("/video/{}", id))
        .header("Range", "bytes=0-9")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::PARTIAL_CONTENT);
  assert_eq!(
    response.headers().get("content-range").unwrap(),
    "bytes 0-9/18"
  );
  assert_eq!(response.headers().get("content-length").unwrap(), "10");
}

#[tokio::test]
async fn test_stream_video_without_range() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state.clone());

  // Create a temporary file with content
  let mut temp_file = NamedTempFile::new().unwrap();
  temp_file.write_all(b"test video content").unwrap();
  temp_file.flush().unwrap();
  let path = temp_file.path().to_path_buf();

  // Register the video
  let id = state.register_video(path).await;

  let response = app
    .oneshot(
      Request::builder()
        .uri(format!("/video/{}", id))
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);
  assert_eq!(response.headers().get("content-length").unwrap(), "18");
  assert_eq!(
    response.headers().get("content-type").unwrap(),
    "video/mp4" // default content type
  );
  assert_eq!(response.headers().get("accept-ranges").unwrap(), "bytes");
}

#[tokio::test]
async fn test_stream_video_with_open_range() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state.clone());

  // Create a temporary file with content
  let mut temp_file = NamedTempFile::new().unwrap();
  temp_file.write_all(b"test video content").unwrap();
  temp_file.flush().unwrap();
  let path = temp_file.path().to_path_buf();

  // Register the video
  let id = state.register_video(path).await;

  let response = app
    .oneshot(
      Request::builder()
        .uri(format!("/video/{}", id))
        .header("Range", "bytes=5-")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::PARTIAL_CONTENT);
  assert_eq!(
    response.headers().get("content-range").unwrap(),
    "bytes 5-17/18"
  );
  assert_eq!(response.headers().get("content-length").unwrap(), "13");
}

#[tokio::test]
async fn test_parse_range_header() {
  assert_eq!(
    server::parse_range_header("bytes=0-99", 1000),
    Some((0, 99))
  );

  assert_eq!(
    server::parse_range_header("bytes=50-", 1000),
    Some((50, 999))
  );

  assert_eq!(
    server::parse_range_header("bytes=50-2000", 1000),
    Some((50, 999)) // Should cap at file_size - 1
  );

  assert_eq!(server::parse_range_header("invalid", 1000), None);
  assert_eq!(server::parse_range_header("bytes=", 1000), None);
  assert_eq!(server::parse_range_header("bytes=-100", 1000), None);
  assert_eq!(server::parse_range_header("bytes=a-b", 1000), None);
}

#[tokio::test]
async fn test_video_registration_response_serialization() {
  let response = VideoRegistrationResponse {
    id: "test123".to_string(),
    url: "http://localhost:4567/video/test123".to_string(),
  };

  let json = serde_json::to_string(&response).unwrap();
  assert!(json.contains("test123"));
  assert!(json.contains("http://localhost:4567/video/test123"));

  // Test deserialization
  let deserialized: VideoRegistrationResponse = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.id, response.id);
  assert_eq!(deserialized.url, response.url);
}

#[tokio::test]
async fn test_cors_headers() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state);

  let response = app
    .oneshot(
      Request::builder()
        .uri("/health")
        .header("Origin", "http://localhost:3000")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  assert_eq!(response.status(), StatusCode::OK);
  // CORS headers should be present due to CorsLayer::new().allow_origin(Any)
  assert!(response
    .headers()
    .contains_key("access-control-allow-origin"));
}

#[tokio::test]
async fn test_content_type_detection() {
  let state = VideoServerState::new();

  // Test various file extensions
  let test_cases = vec![
    ("video.mp4", "video/mp4"),
    ("video.webm", "video/webm"),
    ("video.mov", "video/quicktime"),
    ("video.avi", "video/x-msvideo"),
    ("video.mkv", "video/x-matroska"),
    ("video.unknown", "video/mp4"), // default
  ];

  for (filename, expected_content_type) in test_cases {
    let app = server::create_video_router(state.clone());

    // Create a temporary file
    let temp_file =
      NamedTempFile::with_suffix(format!(".{}", filename.split('.').next_back().unwrap())).unwrap();
    std::fs::write(&temp_file, b"test").unwrap();
    let path = temp_file.path().to_path_buf();

    // Register the video
    let id = state.register_video(path).await;

    let response = app
      .oneshot(
        Request::builder()
          .uri(format!("/video/{}", id))
          .body(Body::empty())
          .unwrap(),
      )
      .await
      .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(
      response.headers().get("content-type").unwrap(),
      expected_content_type
    );
  }
}

#[tokio::test]
async fn test_invalid_range_header() {
  let state = VideoServerState::new();
  let app = server::create_video_router(state.clone());

  // Create a temporary file
  let temp_file = NamedTempFile::new().unwrap();
  std::fs::write(&temp_file, b"test").unwrap();
  let path = temp_file.path().to_path_buf();

  // Register the video
  let id = state.register_video(path).await;

  // Test with invalid range header
  let response = app
    .oneshot(
      Request::builder()
        .uri(format!("/video/{}", id))
        .header("Range", "invalid-range")
        .body(Body::empty())
        .unwrap(),
    )
    .await
    .unwrap();

  // Should return full file when range is invalid
  assert_eq!(response.status(), StatusCode::OK);
  assert_eq!(response.headers().get("content-length").unwrap(), "4");
}

#[tokio::test]
async fn test_video_server_state_clone() {
  let state = VideoServerState::new();
  let state_clone = state.clone();

  // Register video in original state
  let path = PathBuf::from("/test/video.mp4");
  let id = state.register_video(path.clone()).await;

  // Check that cloned state has the same registry
  let registry = state_clone.video_registry.lock().await;
  assert_eq!(registry.get(&id), Some(&path));
}
