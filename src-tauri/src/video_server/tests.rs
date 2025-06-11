#[cfg(test)]
mod tests {
  use super::super::*;
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

    assert_eq!(server::parse_range_header("invalid", 1000), None);
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
}
