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

## 🎬 About the Project

### What is Timeline Studio?

**Timeline Studio** is a next-generation professional video editor with AI integration that automates content creation for social media. Built on modern technologies (Tauri + Next.js), it combines the power of desktop applications with the convenience of web interfaces.

### 🎯 Key Advantages

- **🤖 82 AI Claude Tools** - complete video production automation
- **⚡ GPU Acceleration** - hardware encoding NVENC, QuickSync, VideoToolbox
- **🔌 Plugin System** - extend functionality without changing code
- **🌐 13 Language Interface** - complete localization for global audience
- **🔒 Local Processing** - your content stays private
- **📊 80%+ Test Coverage** - professional-level reliability

### 🚀 Problems We Solve

**One upload → dozens of ready versions:**
- 📱 **TikTok** - vertical shorts with trending effects
- 📺 **YouTube** - full movies, short clips, Shorts
- 📸 **Instagram** - Reels, Stories, posts of different lengths
- ✈️ **Telegram** - optimized versions for channels and chats

### 💡 How It Works

> *"Create a video about my trip to Asia for all social media" - and in minutes you have ready variants: dynamic shorts for TikTok, atmospheric vlog for YouTube, bright Stories for Instagram. AI selects the best moments, syncs with music and adapts for each platform.*

### ⚡ Why This Changes Everything

- **10x Time Savings** - no more manual adaptation for each video
- **AI Understands Trends** - knows what works on each social network
- **Professional Quality** - using the same tools as major studios
- **Modular Architecture** - easily add new features through plugins
- **Open Source** - transparency and ability to participate in development

![Timeline Interface #1](/public/screen3.png)

## 🏗️ Architecture

Timeline Studio is built on modern modular architecture:

### Frontend (Next.js 15 + React 19)
- **Feature-based organization** - each function in `/src/features/` is self-contained
- **State Management** - XState v5 for complex states
- **UI Components** - shadcn/ui + Radix UI + Tailwind CSS v4
- **TypeScript** - strict typing and safety

### Backend (Rust + Tauri v2)
- **Modular structure** - Core, Security, Media, Compiler, Plugins
- **Service layer** - DI container, EventBus, Telemetry
- **FFmpeg integration** - advanced video processing
- **Security** - API key encryption, OAuth, Keychain

📚 **[Detailed Frontend Architecture →](docs/en/03_architecture/frontend/)**  
📚 **[Detailed Backend Architecture →](docs/en/03_architecture/backend/)**  
📚 **[Plugin System →](docs/en/07_integrations/)**

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

### Performance Benchmarks
- **Startup Time**: < 2 seconds on modern hardware
- **Memory Usage**: ~200MB base, scales with project size
- **Export Speed**: 2-3x realtime with GPU acceleration
- **Test Coverage**: 80%+ across frontend and backend
- **Build Size**: ~50MB compressed installer

## 🏗️ Project Status

**Overall readiness: 94%+** 
**🚀 Alpha version: 97.5% ready** 🎯

✅ **Completed**: 55+ modules (100% ready) - 30+ frontend + 25+ backend  
🔄 **In progress**: Advanced Timeline Features  
✅ **Smart Montage Planner**: 100% ready - Full UI-Backend integration! 🎉  
📋 **Recently Completed**: Smart Montage Planner, Timeline Integration, Backend Testing  

[→ Detailed Roadmap](docs/en/10_project_state/)

## 🎯 Key Features

### 🎬 Video Editing Core
- **Multi-track Timeline** - Professional non-linear editing `Stable`
- **GPU Acceleration** - NVENC, QuickSync, VideoToolbox support `Stable`
- **100+ Transitions** - Smooth transitions and effects library `Stable`
- **Device Presets** - Optimized exports for iPhone, iPad, Android `Stable`
- **Cross-platform** - Windows, macOS, Linux support `Stable`

### 🤖 AI-Powered Features
- **82 Claude AI Tools** - Complete video automation platform `Beta` 🔥
- **Smart Montage Planner** - AI-powered automatic montage plan generation `Stable` ✅
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

📚 **[Complete Installation Guide →](docs/en/02_getting_started/)**  
🪟 **[Windows Setup →](docs/en/06_deployment/platforms/)**  
🎥 **[Video Tutorial →](https://www.youtube.com/@chatman-media)**

## 📚 Documentation Center

### 🚀 Getting Started
- 📌 [Installation and Setup](docs/en/02_getting_started/)
- 🎬 [First Project](docs/en/02_getting_started/)
- 🤔 [Project Structure](docs/en/01_project_docs/project-structure.md)
- 🪟 [Windows Setup](docs/en/06_deployment/platforms/)

### 🏗️ Architecture
- 📄 [Architecture Overview](docs/en/03_architecture/)
- 🌐 [Frontend Architecture](docs/en/03_architecture/frontend/)
- ⚙️ [Backend Architecture](docs/en/03_architecture/backend/)
- 🔄 [State Management](docs/en/03_architecture/frontend/state-management.md)
- 📡 [Communication](docs/en/03_architecture/communication.md)

### 🎯 Features and Capabilities
- 📈 [Features Overview](docs/en/10_advanced_features/)
- 📝 [All Modules Description](docs/en/08_tasks/)
- 🎨 [Color Grading](docs/en/08_tasks/completed/)
- 🎧 [Fairlight Audio](docs/en/08_tasks/completed/)

### 👨‍💻 Development
- 🧪 [Developer Guide](docs/en/05_development/)
- 🧪 [Testing](docs/en/12_testing/)
- 📡 [API Reference](docs/en/04_api_reference/)
- 🔌 [Plugin System](docs/en/07_integrations/)
- 🔧 [Development Commands](docs/en/05_development/)

### 🚀 Deployment
- 📦 [Building Application](docs/en/06_deployment/)
- 🤖 [CI/CD Setup](docs/en/13_ci_cd/)
- 🔐 [OAuth Setup](docs/en/07_integrations/)
- 📊 [Codecov Integration](docs/en/13_ci_cd/codecov-components.md)

### 📚 Additional Resources
- 🌟 [Complete Documentation](docs/en/)
- 📊 [Development Progress](docs/en/10_project_state/)
- 🌐 [API Documentation](https://chatman-media.github.io/timeline-studio/api-docs/)
- 🌐 [Project Website](https://chatman-media.github.io/timeline-studio/)
- 🏗️ [TDF Methodology](docs/en/18_marketing_strategies/)

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

📚 **[Complete Development Guide →](docs/en/05_development/)**

## CI/CD & Code Quality

### Automated Workflows
- ✅ **Linting**: ESLint, Stylelint, Clippy
- ✅ **Testing**: Frontend (Vitest), Backend (Rust), E2E (Playwright)
- ✅ **Coverage**: Codecov integration
- ✅ **Build**: Cross-platform builds

📚 **[Detailed CI/CD Guide →](docs/en/13_ci_cd/)**  
🔧 **[Linting & Formatting →](docs/en/05_development/linting-and-formatting.md)**

## 👨‍💻 Developer Resources

### Contributing to Timeline Studio
- 🤝 **[Contributing Guide](CONTRIBUTING.md)** - How to contribute to the project
- 🐛 **[Report Issues](https://github.com/chatman-media/timeline-studio/issues)** - Found a bug? Let us know!
- 💡 **[Feature Requests](https://github.com/chatman-media/timeline-studio/discussions)** - Suggest new features

### Plugin Development
- 🔌 **[Plugin System Guide](docs/en/07_integrations/)** - Build your own plugins
- 🚀 **[Plugin Quickstart](docs/en/05_development/)** - Get started in 5 minutes
- 📦 **[Plugin API Reference](docs/en/04_api_reference/)** - Complete API documentation

### Testing & Quality
- 🧪 **[Testing Guide](docs/en/12_testing/)** - Unit, integration, E2E testing
- 📊 **[Test Utils](docs/en/12_testing/)** - Audio and Tauri component testing
- ✅ **[Code Style](CLAUDE.md#code-style-guidelines)** - Coding standards
- 🔍 **[Performance Guide](docs/en/11_performance/)** - Optimization tips

## 🏗️ Timeline Documentation Framework (TDF)

Timeline Studio pioneered the **Timeline Documentation Framework (TDF)** - an innovative methodology for organizing technical documentation:

✅ **18 specialized sections** for complete project coverage  
✅ **Bilingual support out of the box** (ru/en structure)  
✅ **Media-First architecture** for multimedia projects  
✅ **Enterprise-ready organization** with professional standards  

**TDF is already used for:**
- Documentation consulting ($5,000-50,000 per project)
- Certification programs ($500-2,000 per course)
- Enterprise tools ($1,000-10,000/year)

📚 **[Learn more about TDF →](docs/en/18_marketing_strategies/)**

## 🌐 Community & Support

### Join Our Community
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

### Get Help
- 📚 **[FAQ](docs/en/09_troubleshooting/)** - Frequently asked questions
- 💬 **[Discussions](https://github.com/chatman-media/timeline-studio/discussions)** - Ask questions, share ideas
- 🐛 **[Issue Tracker](https://github.com/chatman-media/timeline-studio/issues)** - Report bugs
- 📧 **Email Support** - ak.chatman.media@gmail.com

### Project Roadmap
- 🗺️ **[Development Roadmap](docs/en/10_project_state/)** - See what's coming next
- ✨ **[Completed Features](docs/en/08_tasks/completed/)** - Recently shipped features
- 🎯 **[Alpha Release Progress](docs/en/17_releases/)** - 97.5% complete!
- 📊 **[Project Status](#project-status)** - Current development stats

### Support the Project
- ⭐ **[Star on GitHub](https://github.com/chatman-media/timeline-studio)** - Show your support
- 🤝 **[Contribute](CONTRIBUTING.md)** - Join the development
- 💼 **[Commercial License](docs/en/11_legal/)** - For business use

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

📄 **[Full License Details →](docs/en/11_legal/)** | 📧 **Commercial License**: ak.chatman.media@gmail.com