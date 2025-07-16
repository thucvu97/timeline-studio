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

![Timeline Interface #1](/public/screen5.png)

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
📚 **[Plugin System →](docs/en/08_tasks/planned/plugin-system.md)**
🛠️ **[Technical Stack Details →](docs/en/03_architecture/backend/rust-architecture.md#technology-overview)**

## 📚 Backend Module Documentation

Timeline Studio uses a modular Rust backend architecture. Each module provides specific functionality:

### Core Modules
🔧 **[Core System](src-tauri/src/core/README.md)** - DI container, EventBus, Performance monitoring
🔌 **[Plugin System](src-tauri/src/core/plugins/README.md)** - Modular plugin architecture with sandbox security
🎬 **[Video Compiler](src-tauri/src/video_compiler/README.md)** - FFmpeg integration and video processing
📁 **[Media Management](src-tauri/src/media/README.md)** - File scanning, metadata extraction, thumbnails

### AI & Recognition
🧠 **[Smart Montage Planner](src-tauri/src/montage_planner/README.md)** - AI-powered video montage generation
👁️ **[Recognition System](src-tauri/src/recognition/README.md)** - YOLO object detection and scene analysis
📝 **[Subtitles Engine](src-tauri/src/subtitles/README.md)** - Subtitle generation, parsing, synchronization

### Security & Services
🔒 **[Security Module](src-tauri/src/security/README.md)** - API validation, OAuth, secure storage

*All modules include comprehensive test suites and detailed API documentation.*

## 🏗️ Project Status

**Overall readiness: 94%+**
**🚀 Alpha version: 97.5% ready** 🎯

✅ **Completed**: 55+ modules (100% ready) - 30+ frontend + 25+ backend
🔄 **In progress**: Advanced Timeline Features
✅ **Smart Montage Planner**: 100% ready - Full UI-Backend integration! 🎉
📋 **Recently Completed**: Smart Montage Planner, Timeline Integration, Backend Testing

[→ Detailed Roadmap](docs/en/10_project_state/)

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

📚 **[Complete Installation Guide →](docs/en/02_requirements/)**
🪟 **[Windows Setup →](docs/en/06_deployment/platforms/)**
🎥 **[Video Tutorial →](https://www.youtube.com/@chatman-media)**
📖 **[Full Documentation →](docs/en/)** - Complete documentation with 18+ sections

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
- 🔌 **[Plugin System Guide](docs/en/08_tasks/planned/plugin-system.md)** - Build your own plugins
- 🚀 **[Plugin Quickstart](docs/en/05_development/)** - Get started in 5 minutes
- 📦 **[Plugin API Reference](docs/en/04_api_reference/)** - Complete API documentation

### Testing & Quality
- 🧪 **[Testing Guide](docs/en/12_testing/)** - Unit, integration, E2E testing
- 📊 **[Test Utils](docs/en/12_testing/)** - Audio and Tauri component testing
- ✅ **[Code Style](CLAUDE.md#code-style-guidelines)** - Coding standards
- 🔍 **[Performance Guide](docs/en/08_tasks/planned/performance-optimization.md)** - Optimization tips

## 🌐 Community & Support

### Join Our Community
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

### Get Help
- 📚 **[FAQ](docs/en/09_architectural_decisions/)** - Frequently asked questions
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

## 🤝 Contributors

Thank you to all the amazing people who have contributed to Timeline Studio:

<a href="https://github.com/chatman-media/timeline-studio/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=chatman-media/timeline-studio" />
</a>

## 💎 Sponsors

Timeline Studio is supported by these amazing sponsors:

<div align="center">

[![Open Collective](https://img.shields.io/badge/Open%20Collective-Support%20Us-7FADF2?style=for-the-badge&logo=opencollective&logoColor=white)](https://opencollective.com/timeline-studio)

### 🌟 Gold Sponsors

<a href="https://github.com/alagiz">
  <img src="https://github.com/alagiz.png" width="80" height="80" alt="alagiz" style="border-radius: 50%; margin: 10px;" />
</a>
<a href="https://github.com/alexk984">
  <img src="https://github.com/alexk984.png" width="80" height="80" alt="alexk984" style="border-radius: 50%; margin: 10px;" />
</a>

Special thanks to our generous sponsors who have contributed $5,000+ to the project development!

[Become a sponsor →](https://opencollective.com/timeline-studio)

</div>

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
