# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![Frontend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=frontend&flag=frontend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![Backend Coverage](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=backend&flag=backend)](https://codecov.io/gh/chatman-media/timeline-studio)
[![GitHub commits](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=for-the-badge&label=commits)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=for-the-badge&label=npm%20downloads)](https://www.npmjs.com/package/timeline-studio)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)

[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

</div>

## 🎬 Project Overview

**Timeline Studio** - AI-powered video editor that transforms your videos, music, and favorite effects into dozens of ready-to-publish clips and automatically uploads them to all your social media platforms!

### 🚀 Imagine the Possibilities

**Upload your videos, photos, music once** → get:
- 📱 **TikTok** - vertical shorts with trending effects
- 📺 **YouTube** - full films, short clips, Shorts
- 📸 **Instagram** - Reels, Stories, posts of different lengths
- ✈️ **Telegram** - optimized versions for channels and chats

AI assistant will create the right number of versions for each platform! 🤖

### 💡 How It Works

> *"Create a video about my trip to Asia for all social media" - and within minutes you have options ready: dynamic shorts for TikTok, atmospheric vlog for YouTube, vibrant Stories for Instagram. AI will select the best moments, sync with music, and adapt for each platform.*

### ⚡ Why This Changes Everything

- **10x time savings** - no more manual adaptation for each video
- **AI understands trends** - knows what works on each social network
- **Professional quality** - using the same tools as major studios
- **Everything works locally** - your content stays private

![Timeline Interface #1](/public/screen3.png)

## 🏗️ Project Status

**Overall readiness: 74.5%** (weighted progress)  
**🎯 Alpha version: 80.7%** ready

✅ **Completed**: 45 core modules (27 frontend + 18 backend)  
🔄 **In progress**: Export (95%), Plugins (70%), Color Grading (25%)  
🔧 **Partially implemented**: Scene Analyzer (30%), Script Generator (20%)  
📋 **Planned**: 13 additional modules for DaVinci Resolve level

[→ Detailed Roadmap](docs-ru/10-roadmap/README.md)

## Key Features

- 🎬 Professional video editing with multi-track timeline
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🚀 GPU-accelerated video processing (NVENC, QuickSync, VideoToolbox)
- 🤖 AI-powered object/face recognition
- 🎨 100+ transitions, visual effects, and filters
- 📝 Advanced subtitle system with 72 styles and animations
- 🎵 Multi-track audio editing with effects
- 📤 Export to MP4/MOV/WebM with social media OAuth integration
- 🔐 YouTube/TikTok/Vimeo/Telegram OAuth support with secure token storage
- 📱 Device presets (iPhone, iPad, Android) for optimized exports
- 🌐 Internationalization support (11 languages)
- 💾 Smart caching and unified preview system
- 🎨 Modern UI using Tailwind CSS v4, shadcn-ui
- 📚 Complete documentation with more than 5,000 tests and over 80% code coverage
- 🧠 **NEW: Full AI Platform** - 82 Claude AI tools for video automation
- 🎤 **NEW: Whisper transcription** - Speech-to-text with OpenAI/local models
- 📱 **NEW: Platform optimization** - Auto-adapt for 4 social platforms
- 🤖 **NEW: Workflow automation** - 10 pre-built processes for quick editing

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

📚 **[Complete Installation Guide →](docs-ru/01-getting-started/README.md)**
🪟 **[Windows Setup →](docs-ru/06-deployment/platforms/windows-build.md)**

## Documentation

### 📚 Main Documentation

- 📚 [Обзор документации](docs-ru/README.md) - Полная карта документации
- 🚀 [Начало работы](docs-ru/01-getting-started/README.md) - Установка и первые шаги
- 🏗️ [Руководство по архитектуре](docs-ru/02-architecture/README.md) - Архитектура системы
- 🎯 [Руководство по функциям](docs-ru/03-features/README.md) - Обзор функций и статус
- 📡 [Справочник API](docs-ru/04-api-reference/README.md) - Справочник команд Tauri
- 🧪 [Руководство разработчика](docs-ru/05-development/README.md) - Тестирование и разработка
- 🚀 [Руководство по развертыванию](docs-ru/06-deployment/README.md) - Сборка и развертывание
- 📋 [Пользовательские руководства](docs-ru/07-guides/README.md) - Производительность и лучшие практики
- 🔌 [Руководство по плагинам](docs-ru/08-plugins/README.md) - Система плагинов и разработка
- 📊 [Телеметрия](docs-ru/09-telemetry/README.md) - Телеметрия и аналитика
- 🛣️ [Дорожная карта](docs-ru/10-roadmap/README.md) - Дорожная карта разработки
- 🔐 [Настройка OAuth](docs-ru/11-oauth-setup/oauth-setup-guide.md) - Интеграция с социальными сетями
- 🧪 [Руководство по тестированию](docs-ru/12-testing/README.md) - Документация по тестированию
- ⚠️ [Известные проблемы](docs-ru/13-known-issues/README.md) - Известные проблемы и обходные пути
- 📄 [Юридическая информация](docs-ru/14-legal/README.md) - Лицензия и правовая информация

### 📋 Project Documentation

- **`src/features/README.md`** - overview of all features with priorities and status
- **Language versions**: Available in 12 languages via the switcher above

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

## Documentation & Resources

- 📚 [**API Documentation**](https://chatman-media.github.io/timeline-studio/api-docs/) - Auto-generated TypeScript docs
- 🚀 [**Website**](https://chatman-media.github.io/timeline-studio/) - Project showcase
- 📖 [**Complete Documentation**](docs-ru/README.md) - Full guide in Russian

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

📄 **[Full License Details →](docs-ru/14-legal/license.md)** | 📧 **Commercial License**: ak.chatman.media@gmail.com
