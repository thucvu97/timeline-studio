# Video Streaming Architecture for Tauri 2.0

## Problem
- `asset://localhost/` URLs have encoding issues with Cyrillic paths
- Double URL encoding causes video loading failures
- Direct file access from web context is limited

## Proposed Solutions

### 1. WebSocket/HTTP Streaming Server (Recommended)

**Architecture:**
```
Frontend (React) <---> WebSocket/HTTP <---> Rust Backend <---> File System
```

**Implementation Plan:**

#### Rust Side (src-tauri/src/video_server.rs):
```rust
use axum::{
    extract::{Path, Query},
    http::{header, StatusCode},
    response::IntoResponse,
    Router,
};
use tokio::fs::File;
use tokio_util::io::ReaderStream;

// Start local HTTP server on app launch
pub fn start_video_server() -> Router {
    Router::new()
        .route("/video/:id", get(stream_video))
        .route("/thumbnail/:id", get(get_thumbnail))
}

async fn stream_video(
    Path(id): Path<String>,
    Query(params): Query<VideoParams>,
) -> impl IntoResponse {
    // Decode file path from ID
    let file_path = decode_video_id(&id);
    
    // Support range requests for seeking
    let file = File::open(file_path).await?;
    let stream = ReaderStream::new(file);
    
    (
        StatusCode::OK,
        [
            (header::CONTENT_TYPE, "video/mp4"),
            (header::ACCEPT_RANGES, "bytes"),
        ],
        stream
    )
}
```

#### Frontend Side:
```typescript
// Video URL generator
export function getVideoUrl(filePath: string): string {
  // Generate stable ID from file path
  const videoId = btoa(filePath).replace(/[^a-zA-Z0-9]/g, '');
  return `http://localhost:3547/video/${videoId}`;
}

// React component
<video src={getVideoUrl(file.path)} />
```

### 2. Blob URL Approach (For Small Videos)

**For previews and small videos (<50MB):**

```typescript
// Tauri command to read video chunks
invoke('read_video_chunk', { 
  path: filePath,
  start: 0,
  end: 1024 * 1024 // 1MB chunks
}).then(data => {
  const blob = new Blob([data], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  setVideoUrl(url);
});
```

### 3. Custom Protocol Handler

Register custom protocol in Tauri:

```rust
// In tauri.conf.json
"protocol": {
  "asset": true,
  "custom": ["video"]
}

// Custom handler
fn video_protocol_handler(request: Request) -> Response {
  // Handle video:// URLs with proper encoding
}
```

### 4. WebRTC Local Streaming

For advanced features (real-time effects, low latency):

```typescript
// Create local WebRTC connection
const pc = new RTCPeerConnection();
const stream = await navigator.mediaDevices.getUserMedia({ video: true });

// Stream from Rust through WebRTC data channels
```

### 5. UDP Streaming (High Performance)

**For low-latency, high-performance streaming:**

```rust
// Rust UDP server
use tokio::net::UdpSocket;

pub async fn start_udp_streamer() {
    let socket = UdpSocket::bind("127.0.0.1:4567").await?;
    
    // Stream video packets
    loop {
        let mut buf = vec![0; 65535]; // Max UDP packet size
        let (len, addr) = socket.recv_from(&mut buf).await?;
        
        // Process video chunk and send
        let video_data = read_video_chunk(request);
        socket.send_to(&video_data, addr).await?;
    }
}
```

**Frontend WebRTC DataChannel for UDP-like behavior:**
```typescript
// Use WebRTC DataChannel for UDP-like unreliable transport
const pc = new RTCPeerConnection();
const dataChannel = pc.createDataChannel('video', {
  ordered: false,  // UDP-like behavior
  maxRetransmits: 0  // No retransmission
});

// Receive video chunks and reconstruct
dataChannel.onmessage = (event) => {
  const chunk = event.data;
  videoBuffer.append(chunk);
};
```

**Pros of UDP:**
- Lower latency than TCP/HTTP
- Better for real-time preview scrubbing
- No buffering delays

**Cons of UDP:**
- Need to implement reliability layer for critical data
- More complex client-side reassembly
- Browser limitations (need WebRTC DataChannel)

## Comparison Table

| Approach | Latency | Complexity | Browser Support | Use Case |
|----------|---------|------------|-----------------|----------|
| HTTP Server | Medium | Low | ✅ Excellent | General video playback |
| WebSocket | Low | Medium | ✅ Excellent | Real-time updates |
| UDP/WebRTC | Very Low | High | ⚠️ Limited | Preview scrubbing |
| Blob URLs | High | Low | ✅ Excellent | Small videos only |
| Custom Protocol | Medium | Medium | ✅ Good | Tauri-specific |

## Recommended Implementation Steps

1. **Phase 1: HTTP Server**
   - Implement basic HTTP server in Rust
   - Support range requests for seeking
   - Handle path encoding properly

2. **Phase 2: Optimization**
   - Add caching layer
   - Implement thumbnail generation
   - Support multiple video formats

3. **Phase 3: Advanced Features**
   - WebSocket for real-time updates
   - Transcoding support
   - Adaptive bitrate streaming

## Benefits

1. **No encoding issues** - IDs instead of paths in URLs
2. **Better performance** - Native streaming support
3. **Seek support** - HTTP range requests
4. **Cross-platform** - Works on all platforms
5. **Security** - Controlled access to files

## Example Usage

```typescript
// Simple video component
export function VideoPlayer({ file }: { file: MediaFile }) {
  const videoUrl = useVideoUrl(file.path);
  
  return (
    <video 
      src={videoUrl}
      controls
      preload="metadata"
    />
  );
}

// Hook for video URL
function useVideoUrl(filePath: string) {
  const [url, setUrl] = useState('');
  
  useEffect(() => {
    // Register file with backend and get streaming URL
    invoke('register_video', { path: filePath })
      .then(({ streamUrl }) => setUrl(streamUrl));
  }, [filePath]);
  
  return url;
}
```