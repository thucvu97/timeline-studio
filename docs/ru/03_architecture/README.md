# Архитектура

## 📋 Содержание

Этот раздел содержит подробную архитектурную документацию Timeline Studio.

### 🔄 Основные документы
- [**communication.md**](communication.md) - Взаимодействие Frontend-Backend через Tauri IPC
- [**data-flow.md**](data-flow.md) - Поток данных в приложении

### 🎨 Frontend архитектура
- [**frontend/**](frontend/) - Обзор Frontend архитектуры
- [**frontend/state-management.md**](frontend/state-management.md) - Управление состоянием с XState

### 🦀 Backend архитектура
- [**backend/**](backend/) - Обзор Backend архитектуры на Rust
- [**backend/rust-architecture.md**](backend/rust-architecture.md) - Архитектура Rust приложения
- [**backend/type-mapping.md**](backend/type-mapping.md) - Сопоставление типов Frontend и Backend
- [**backend/service-layer.md**](backend/service-layer.md) - Сервисный слой
- [**backend/error-handling.md**](backend/error-handling.md) - Обработка ошибок

### 🎬 Интеграции
- [**backend/ffmpeg-integration.md**](backend/ffmpeg-integration.md) - Интеграция с FFmpeg
- [**backend/plugin-system.md**](backend/plugin-system.md) - Система плагинов

### 📊 Мониторинг
- [**backend/telemetry.md**](backend/telemetry.md) - Телеметрия и метрики
- [**backend/monitoring-and-metrics.md**](backend/monitoring-and-metrics.md) - Мониторинг производительности

### 🔒 Безопасность
- [**backend/security-architecture.md**](backend/security-architecture.md) - Архитектура безопасности

### 📈 Диаграммы
- [**backend/architecture-diagram.md**](backend/architecture-diagram.md) - Архитектурные диаграммы

## 🏗️ Ключевые принципы

### Frontend (React + TypeScript)
- **State Management**: XState для сложных состояний
- **Component Architecture**: Feature-based организация
- **Type Safety**: Строгая типизация с TypeScript
- **Performance**: React 19 с оптимизациями

### Backend (Rust + Tauri)
- **Type Safety**: Spekta для синхронизации типов
- **Performance**: Zero-copy операции, многопоточность
- **Security**: Sandboxed плагины, шифрование
- **GPU Acceleration**: NVENC, AMF, QuickSync, VideoToolbox

### Коммуникация
- **IPC**: Tauri команды и события
- **Type Safety**: Автогенерация типов
- **Error Handling**: Структурированные ошибки
- **Streaming**: Потоковая передача данных

## 🔗 Связанные разделы

- [Требования](../02_requirements/) - Функциональные и технические требования
- [API Reference](../04_api_reference/) - Справочник по API
- [Разработка](../05_development/) - Руководство разработчика

---

*Последнее обновление: 31 июля 2025*