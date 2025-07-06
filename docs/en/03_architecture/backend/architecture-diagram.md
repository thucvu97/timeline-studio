# Backend Architecture Diagram

## Module Interactions

```mermaid
graph TB
    subgraph "Frontend (React/Next.js)"
        FE[Frontend Application]
    end
    
    subgraph "Tauri Runtime"
        CMD[Command Registry<br/>280+ commands]
        IPC[IPC Layer]
    end
    
    subgraph "Core Infrastructure"
        DI[DI Container]
        EB[Event Bus]
        PM[Plugin Manager]
        TM[Telemetry]
        PERF[Performance<br/>Cache/Workers]
    end
    
    subgraph "Business Modules"
        VC[Video Compiler<br/>400+ commands]
        MED[Media Module]
        REC[Recognition<br/>YOLO]
        SEC[Security Module]
        FS[Filesystem]
        LANG[Language]
        SUB[Subtitles]
    end
    
    subgraph "External Services"
        FFM[FFmpeg]
        ONNX[ONNX Runtime]
        API[External APIs]
        KS[Keychain/Storage]
    end
    
    FE -.->|invoke| IPC
    IPC --> CMD
    CMD --> DI
    
    DI --> VC
    DI --> MED
    DI --> REC
    DI --> SEC
    DI --> FS
    DI --> LANG
    DI --> SUB
    
    EB -.->|events| VC
    EB -.->|events| MED
    EB -.->|events| REC
    
    PM --> VC
    PM --> MED
    
    TM --> VC
    TM --> MED
    TM --> REC
    
    PERF --> VC
    PERF --> MED
    
    VC --> FFM
    MED --> FFM
    REC --> ONNX
    SEC --> API
    SEC --> KS
    
    style DI fill:#f9f,stroke:#333,stroke-width:4px
    style VC fill:#bbf,stroke:#333,stroke-width:2px
    style CMD fill:#bfb,stroke:#333,stroke-width:2px
```

## Data Flow

### 1. Command Processing
```
Frontend → Tauri IPC → Command Registry → DI Container → Module → Service
```

### 2. Event Processing
```
Service → Event Bus → Subscribers → Frontend (via Tauri events)
```

### 3. Media Processing
```
Media Module → FFmpeg → Processing → Cache → Result → Frontend
```

### 4. Video Rendering
```
Video Compiler → Pipeline Stages → FFmpeg Builder → FFmpeg Executor → Progress Events
```

## Key Components

### Core Infrastructure
- **DI Container**: Dependency management and service lifecycle
- **Event Bus**: Asynchronous communication between components
- **Plugin Manager**: WASM-based plugin system with sandbox isolation
- **Telemetry**: OpenTelemetry metrics, tracing and health checks
- **Performance**: Caching (LRU/LFU/FIFO), worker pools, zero-copy

### Video Compiler
- **Pipeline Architecture**: Step-by-step video processing
- **GPU Acceleration**: NVENC, QuickSync, VideoToolbox, AMF
- **Cache System**: LRU cache for previews and metadata
- **FFmpeg Integration**: Builder pattern for command construction

### Security Module
- **Secure Storage**: AES-GCM encryption for API keys
- **System Integration**: Keychain (macOS), Credential Manager (Windows)
- **OAuth Support**: YouTube, Instagram, TikTok
- **API Validation**: OpenAI, Anthropic, Google key verification

### Media Module
- **Parallel Processing**: Up to 4 files simultaneously
- **Metadata Cache**: Caching with TTL
- **Preview Generation**: Asynchronous thumbnail generation
- **Format Support**: MP4, MOV, AVI, MKV, MP3, WAV, JPG, PNG and more

### Recognition Module
- **YOLO Integration**: ONNX Runtime for model execution
- **Batch Processing**: Video processing in batches
- **Result Aggregation**: Aggregation of results by time and classes

## Design Principles

1. **Modularity**: Each module is self-contained
2. **Asynchrony**: All I/O operations are non-blocking
3. **Safety**: Type-safe code without unsafe blocks
4. **Performance**: Caching, GPU acceleration, parallelism
5. **Observability**: Metrics, logs, tracing, health checks

## Scaling

### Horizontal
- Worker pools for parallel processing
- Independent services through DI
- Event-driven architecture

### Vertical
- GPU acceleration for video
- Zero-copy operations
- Memory pooling for frequent allocations

## Extension Points

1. **New modules**: Registration through DI container
2. **New commands**: Adding to app_builder.rs
3. **New plugins**: WASM plugins through Plugin Manager
4. **New formats**: Extension through FFmpeg
5. **New services**: Integration through Service Container