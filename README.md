# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md) | [हिन्दी](README.hi.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=flat-square)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=flat-square&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=flat-square&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=flat-square&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Last Commit](https://img.shields.io/github/last-commit/chatman-media/timeline-studio?style=flat-square&label=last%20commit)](https://github.com/chatman-media/timeline-studio/commits/main)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=flat-square&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=flat-square&label=downloads)](https://www.npmjs.com/package/timeline-studio)

[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)

</div>

## 🎬 О проекте

### Что такое Timeline Studio?

**Timeline Studio** - это профессиональный видеоредактор нового поколения с AI-интеграцией, который автоматизирует создание контента для социальных сетей. Построенный на современных технологиях (Tauri + Next.js), он сочетает мощность десктопных приложений с удобством веб-интерфейсов.

### 🎯 Ключевые преимущества

- **🤖 82 AI-инструмента Claude** - полная автоматизация видеопроизводства
- **⚡ GPU-ускорение** - аппаратное кодирование NVENC, QuickSync, VideoToolbox
- **🔌 Система плагинов** - расширяйте функциональность без изменения кода
- **🌐 13 языков интерфейса** - полная локализация для глобальной аудитории
- **🔒 Локальная обработка** - ваш контент остается приватным
- **📊 80%+ покрытие тестами** - надежность профессионального уровня

### 🚀 Решаемые задачи

**Одна загрузка → десятки готовых версий:**
- 📱 **TikTok** - вертикальные шортсы с трендовыми эффектами
- 📺 **YouTube** - полные фильмы, короткие ролики, Shorts
- 📸 **Instagram** - Reels, Stories, посты разной длительности
- ✈️ **Telegram** - оптимизированные версии для каналов и чатов

### 💡 Как это работает

> *"Создай видео о моей поездке в Азию для всех соцсетей" - и через минуты у вас готовы варианты: динамичные шортсы для TikTok, атмосферный влог для YouTube, яркие Stories для Instagram. AI подберет лучшие моменты, синхронизирует с музыкой и адаптирует под каждую платформу.*

### ⚡ Почему это меняет всё

- **10x экономия времени** - больше никакой ручной адаптации под каждое видео
- **AI понимает тренды** - знает, что работает в каждой социальной сети
- **Профессиональное качество** - используем те же инструменты, что и крупные студии
- **Модульная архитектура** - легко добавлять новые функции через плагины
- **Open Source** - прозрачность и возможность участия в разработке

![Timeline Interface #1](/public/screen3.png)

## 🏗️ Архитектура

Timeline Studio построен на современной модульной архитектуре:

### Frontend (Next.js 15 + React 19)
- **Feature-based организация** - каждая функция в `/src/features/` самодостаточна
- **State Management** - XState v5 для сложных состояний
- **UI Components** - shadcn/ui + Radix UI + Tailwind CSS v4
- **TypeScript** - строгая типизация и безопасность

### Backend (Rust + Tauri v2)
- **Модульная структура** - Core, Безопасность, Медиа, Компилятор, Плагины
- **Сервисный слой** - DI контейнер, EventBus, Телеметрия
- **FFmpeg интеграция** - продвинутая обработка видео
- **Безопасность** - шифрование API ключей, OAuth, Keychain

📚 **[Подробная архитектура Frontend →](docs-ru/02-architecture/frontend.md)**  
📚 **[Подробная архитектура Backend →](src-tauri/docs/architecture.md)**  
📚 **[Система плагинов →](src-tauri/docs/plugin-system-design.md)**

## 🛠️ Technical Stack Details

### Frontend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.1.3 | React framework with App Router |
| **React** | 19.0.0 | UI library with concurrent features |
| **TypeScript** | 5.7.2 | Type safety and DX |
| **XState** | 5.19.0 | State machines for complex logic |
| **Tailwind CSS** | 4.0.0-beta.3 | Utility-first styling |
| **shadcn/ui** | Latest | Component library |
| **Radix UI** | Latest | Accessible UI primitives |
| **i18next** | 24.2.0 | Internationalization (13 languages) |

### Backend Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **Rust** | 1.81.0+ | Systems programming language |
| **Tauri** | 2.2.0 | Desktop app framework |
| **FFmpeg** | 6.0+ | Video/audio processing |
| **tokio** | 1.42.0 | Async runtime |
| **serde** | 1.0.217 | Serialization framework |
| **keyring** | 3.6.1 | Secure credential storage |
| **tracing** | 0.1.41 | Structured logging |

### AI & ML Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| **ONNX Runtime** | 0.21.0 | ML inference engine |
| **Whisper** | Latest | Speech-to-text |
| **YOLO** | v8/v11 | Object detection |
| **Claude API** | Latest | AI assistant integration |
| **OpenAI API** | Latest | GPT & Whisper models |

### Development Tools
| Tool | Purpose |
|------|---------|
| **Bun** | Fast JavaScript runtime & package manager |
| **Vitest** | Unit testing framework |
| **Playwright** | E2E testing |
| **ESLint** | JavaScript linting |
| **Clippy** | Rust linting |
| **GitHub Actions** | CI/CD pipeline |
| **Codecov** | Code coverage tracking |

### Performance Benchmarks
- **Startup Time**: < 2 seconds on modern hardware
- **Memory Usage**: ~200MB base, scales with project size
- **Export Speed**: 2-3x realtime with GPU acceleration
- **Test Coverage**: 80%+ across frontend and backend
- **Build Size**: ~50MB compressed installer

## 🔮 Vision of the Future

### What's Being Born from This Trend

🎬 **"DocuDrama-You" - Personal Cinema**  
AI editor creates movies from your life (or someone else's) in your chosen format - "thriller", "romantic comedy", "urban fantasy". Monetization: TikTok, YouTube, streaming.

📺 **"Living Series" About Ordinary People's Lives**  
Weekly 10-minute episodes about one character from any country. AI translates speech, enhances narrative, adds atmosphere, facial expressions, editing. People follow like a TV series.

🎭 **"Cinema Without Screenwriters"**  
You upload your videos - AI finds story arcs, crises, resolutions, emotional peaks. This is a revolution in editing and storytelling.

## 🏗️ Project Status

**Overall readiness: 78.2%** 
**🚀 Alpha version: 91.0% ready** 🎯

✅ **Completed**: 51 modules (100% ready) - 30 frontend + 21 backend (including Fairlight Audio, Color Grading, AI Chat)  
🔄 **In progress**: 3 modules for Alpha - Scene Analyzer (30%), Script Generator (20%), Person ID (0%)
📋 **Remaining for Alpha**: Smart Montage Planner + completing 3 AI modules = 28.9 weight units
📋 **Planned**: 9 modules (0% ready) for future versions (excluding plugins)

[→ Detailed Roadmap](docs-ru/10-roadmap/README.md)

## 🎯 Key Features

### 🎬 Video Editing Core
- **Multi-track Timeline** - Professional non-linear editing `Stable`
- **GPU Acceleration** - NVENC, QuickSync, VideoToolbox support `Stable`
- **100+ Transitions** - Smooth transitions and effects library `Stable`
- **Device Presets** - Optimized exports for iPhone, iPad, Android `Stable`
- **Cross-platform** - Windows, macOS, Linux support `Stable`

### 🤖 AI-Powered Features
- **82 Claude AI Tools** - Complete video automation platform `Beta` 🔥
- **Whisper Transcription** - Speech-to-text with OpenAI/local models `Beta`
- **Object/Face Recognition** - YOLO-based detection and tracking `Beta`
- **Scene Analysis** - Automatic scene detection and classification `Alpha`
- **Workflow Automation** - 10 pre-built AI editing workflows `Beta`

### 🎨 Professional Tools
- **Advanced Color Grading** - Wheels, curves, LUT, scopes `Stable` ✨
- **Fairlight Audio** - Professional mixing and mastering `Stable` ✨
- **Subtitle System** - 72 styles with animations `Stable`
- **Visual Effects** - 100+ filters and effects `Stable`
- **Multi-track Audio** - Advanced audio editing with effects `Stable`

### 📤 Export & Integration
- **Social Media OAuth** - YouTube, TikTok, Vimeo, Telegram `Stable`
- **Platform Optimization** - Auto-adapt for 4 social platforms `Beta`
- **Format Support** - MP4, MOV, WebM with custom settings `Stable`
- **Secure Token Storage** - Keychain integration for API keys `Stable`

### 🛠️ Developer Experience
- **Plugin System** - Extend functionality without core changes `Beta`
- **Modern Tech Stack** - Tauri v2, Next.js 15, React 19 `Stable`
- **TypeScript** - Full type safety across the codebase `Stable`
- **80%+ Test Coverage** - 9,000+ tests for reliability `Stable`
- **13 Languages** - Complete internationalization `Stable`

## Getting Started

### Quick Setup

```bash
# Clone and install
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
bun install

# Run development mode
bun run tauri dev
```

### Requirements
- Node.js v18+, Rust, Bun, FFmpeg

### 🚑 Troubleshooting Common Issues

#### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib

# Windows - use setup script
./scripts/setup-rust-env-windows.ps1

# Linux
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev
```

#### Build Failures
- **Windows**: Ensure Visual Studio 2022 with C++ tools is installed
- **macOS**: Install Xcode Command Line Tools: `xcode-select --install`
- **Linux**: Install build essentials: `sudo apt-get install build-essential`

#### Tauri Development Issues
```bash
# Clear Rust cache
cargo clean

# Reinstall dependencies
bun install --force

# Check Rust version (need 1.81.0+)
rustc --version
```

📚 **[Complete Installation Guide →](docs-ru/01-getting-started/README.md)**
🪟 **[Windows Setup →](docs-ru/06-deployment/platforms/windows-build.md)**
🎥 **[Video Tutorial →](https://www.youtube.com/@chatman-media)**

## 📚 Центр документации

### 🚀 Начало работы
- 📌 [Установка и настройка](docs-ru/01-getting-started/installation.md)
- 🎬 [Первый проект](docs-ru/01-getting-started/first-project.md)
- 🤔 [Структура проекта](docs-ru/01-getting-started/project-structure.md)
- 🪟 [Настройка Windows](docs-ru/06-deployment/platforms/windows-build.md)

### 🏗️ Архитектура
- 📄 [Обзор архитектуры](docs-ru/02-architecture/README.md)
- 🌐 [Frontend архитектура](docs-ru/02-architecture/frontend.md)
- ⚙️ [Backend архитектура](src-tauri/docs/architecture.md)
- 🔄 [State Management](docs-ru/02-architecture/state-management.md)
- 📡 [Коммуникация](docs-ru/02-architecture/communication.md)

### 🎯 Функции и возможности
- 📈 [Обзор функций](docs-ru/03-features/README.md)
- 📝 [Описание всех модулей](src/features/README.md)
- 🎨 [Цветокоррекция](docs-ru/10-roadmap/completed/color-grading-system.md)
- 🎧 [Fairlight Audio](docs-ru/10-roadmap/completed/fairlight-audio-completion.md)

### 👨‍💻 Разработка
- 🧪 [Руководство разработчика](docs-ru/05-development/README.md)
- 🧪 [Тестирование](docs-ru/05-development/testing.md)
- 📡 [API Reference](docs-ru/04-api-reference/README.md)
- 🔌 [Система плагинов](src-tauri/docs/plugin-system-design.md)
- 🔧 [Команды разработки](docs-ru/05-development/development-commands.md)

### 🚀 Развертывание
- 📦 [Сборка приложения](docs-ru/06-deployment/build.md)
- 🤖 [CI/CD настройка](docs-ru/05-development/ci-cd-setup.md)
- 🔐 [OAuth настройка](docs-ru/11-oauth-setup/oauth-setup-guide.md)
- 📊 [Codecov интеграция](docs-ru/06-deployment/codecov-setup.md)

### 🔧 Backend документация
- 🔒 [Архитектура безопасности](src-tauri/docs/security-architecture.md)
- 🎥 [FFmpeg интеграция](src-tauri/docs/ffmpeg-integration.md)
- 🏭 [Сервисный слой](src-tauri/docs/service-layer.md)
- 📊 [Мониторинг и метрики](src-tauri/docs/monitoring-and-metrics.md)
- ⚠️ [Обработка ошибок](src-tauri/docs/error-handling-guide.md)

### 📚 Дополнительные ресурсы
- 🌟 [Полная документация](docs-ru/README.md)
- 📊 [Прогресс разработки](docs-ru/10-roadmap/README.md)
- 🌐 [API документация](https://chatman-media.github.io/timeline-studio/api-docs/)
- 🌐 [Веб-сайт проекта](https://chatman-media.github.io/timeline-studio/)

## Development

### Quick Start

```bash
# Development mode
bun run tauri dev

# Run tests
bun run test && bun run test:rust

# Check code quality
bun run check:all
```

📚 **[Complete Development Guide →](docs-ru/05-development/README.md)**

## CI/CD & Code Quality

### Automated Workflows
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testing**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Coverage**: Codecov integration
- ✅ **Build**: Cross-platform builds

📚 **[Detailed CI/CD Guide →](docs-ru/06-deployment/README.md)**
🔧 **[Linting & Formatting →](docs-ru/05-development/linting-and-formatting.md)**

## 👨‍💻 Developer Resources

### Contributing to Timeline Studio
- 🤝 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- 🐛 **[Report Issues](https://github.com/chatman-media/timeline-studio/issues)** - Found a bug? Let us know!
- 💡 **[Feature Requests](https://github.com/chatman-media/timeline-studio/discussions)** - Suggest new features

### Plugin Development
- 🔌 **[Plugin System Guide](src-tauri/docs/plugin-system-design.md)** - Build your own plugins
- 🚀 **[Plugin Quickstart](docs-ru/05-development/plugin-quickstart.md)** - Get started in 5 minutes
- 📦 **[Plugin API Reference](src-tauri/docs/plugin-api.md)** - Complete API documentation

### Backend Command Reference
- 📡 **[Tauri Commands](src-tauri/docs/commands.md)** - All available backend commands
- 🔒 **[Security API](src-tauri/docs/security-architecture.md)** - Authentication and encryption
- 🎥 **[Media Processing](src-tauri/docs/ffmpeg-integration.md)** - FFmpeg command reference
- 📊 **[Telemetry API](src-tauri/docs/monitoring-and-metrics.md)** - Monitoring integration

### Testing & Quality
- 🧪 **[Testing Guide](docs-ru/05-development/testing.md)** - Unit, integration, E2E testing
- 📊 **[Test Utils](src/test/utils/README.md)** - Audio and Tauri component testing
- ✅ **[Code Style](CLAUDE.md#code-style-guidelines)** - Coding standards
- 🔍 **[Performance Guide](docs-ru/05-development/performance.md)** - Optimization tips

## Documentation & Resources

- 📚 [**API Documentation**](https://chatman-media.github.io/timeline-studio/api-docs/) - Auto-generated TypeScript docs
- 🚀 [**Website**](https://chatman-media.github.io/timeline-studio/) - Project showcase
- 📖 [**Complete Documentation**](docs-ru/README.md) - Full guide in Russian

## 🌐 Community & Support

### Join Our Community
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

### Get Help
- 📚 **[FAQ](docs-ru/faq.md)** - Frequently asked questions
- 💬 **[Discussions](https://github.com/chatman-media/timeline-studio/discussions)** - Ask questions, share ideas
- 🐛 **[Issue Tracker](https://github.com/chatman-media/timeline-studio/issues)** - Report bugs
- 📧 **Email Support** - ak.chatman.media@gmail.com

### Project Roadmap
- 🗺️ **[Development Roadmap](docs-ru/10-roadmap/README.md)** - See what's coming next
- ✨ **[Completed Features](docs-ru/10-roadmap/completed/)** - Recently shipped features
- 🎯 **[Alpha Release Progress](docs-ru/10-roadmap/alpha-release.md)** - 91% complete!
- 📊 **[Project Status](#project-status)** - Current development stats

### Support the Project
- ⭐ **[Star on GitHub](https://github.com/chatman-media/timeline-studio)** - Show your support
- 🤝 **[Contribute](CONTRIBUTING.md)** - Join the development
- 💼 **[Commercial License](docs-ru/10-legal/license.md)** - For business use

## Star History
<a href="https://www.star-history.com/#chatman-media/timeline-studio&Date">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date&theme=dark" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=chatman-media/timeline-studio&type=Date" />
 </picture>
</a>

## License

MIT License with Commons Clause - free for personal use, commercial use requires agreement.

📄 **[Full License Details →](docs-ru/10-legal/license.md)** | 📧 **Commercial License**: ak.chatman.media@gmail.com
