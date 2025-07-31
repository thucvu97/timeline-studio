# Architecture

## 📋 Contents

This section contains detailed architectural documentation for Timeline Studio.

### 🔄 Core Documents
- [**communication.md**](communication.md) - Frontend-Backend interaction via Tauri IPC
- [**data-flow.md**](data-flow.md) - Application data flow

### 🎨 Frontend Architecture
- [**frontend/**](frontend/) - Frontend architecture overview
- [**frontend/state-management.md**](frontend/state-management.md) - State management with XState

### 🦀 Backend Architecture
- [**backend/**](backend/) - Rust backend architecture overview
- [**backend/rust-architecture.md**](backend/rust-architecture.md) - Rust application architecture
- [**backend/type-mapping.md**](backend/type-mapping.md) - Frontend and Backend type mapping
- [**backend/service-layer.md**](backend/service-layer.md) - Service layer
- [**backend/error-handling.md**](backend/error-handling.md) - Error handling

### 🎬 Integrations
- [**backend/ffmpeg-integration.md**](backend/ffmpeg-integration.md) - FFmpeg integration
- [**backend/plugin-system.md**](backend/plugin-system.md) - Plugin system

### 📊 Monitoring
- [**backend/telemetry.md**](backend/telemetry.md) - Telemetry and metrics
- [**backend/monitoring-and-metrics.md**](backend/monitoring-and-metrics.md) - Performance monitoring

### 🔒 Security
- [**backend/security-architecture.md**](backend/security-architecture.md) - Security architecture

### 📈 Diagrams
- [**backend/architecture-diagram.md**](backend/architecture-diagram.md) - Architecture diagrams

## 🏗️ Key Principles

### Frontend (React + TypeScript)
- **State Management**: XState for complex states
- **Component Architecture**: Feature-based organization
- **Type Safety**: Strict typing with TypeScript
- **Performance**: React 19 with optimizations

### Backend (Rust + Tauri)
- **Type Safety**: Spekta for type synchronization
- **Performance**: Zero-copy operations, multi-threading
- **Security**: Sandboxed plugins, encryption
- **GPU Acceleration**: NVENC, AMF, QuickSync, VideoToolbox

### Communication
- **IPC**: Tauri commands and events
- **Type Safety**: Auto-generated types
- **Error Handling**: Structured errors
- **Streaming**: Stream data transfer

## 🔗 Related Sections

- [Requirements](../02_requirements/) - Functional and technical requirements
- [API Reference](../04_api_reference/) - API reference guide
- [Development](../05_development/) - Developer guide

---

*Last updated: July 31, 2025*