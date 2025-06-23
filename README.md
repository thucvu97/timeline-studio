# [Timeline Studio](https://chatman-media.github.io/timeline-studio/)

<div align="center">

[Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Русский](README.ru.md) | [中文](README.zh.md) | [Português](README.pt.md) | [日本語](README.ja.md) | [한국어](README.ko.md) | [Türkçe](README.tr.md) | [ไทย](README.th.md) | [العربية](README.ar.md) | [فارسی](README.fa.md)

[![npm version](https://img.shields.io/npm/v/timeline-studio.svg?style=for-the-badge)](https://www.npmjs.com/package/timeline-studio)
[![Build Status](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/build.yml?style=for-the-badge&label=build)](https://github.com/chatman-media/timeline-studio/actions/workflows/build.yml)
[![Tests](https://img.shields.io/github/actions/workflow/status/chatman-media/timeline-studio/test-coverage.yml?style=for-the-badge&label=tests)](https://github.com/chatman-media/timeline-studio/actions/workflows/test-coverage.yml)
[![codecov](https://img.shields.io/codecov/c/github/chatman-media/timeline-studio?style=for-the-badge&label=coverage)](https://codecov.io/gh/chatman-media/timeline-studio)
[![GitHub commit activity](https://img.shields.io/github/commit-activity/m/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/graphs/commit-activity)
[![GitHub stars](https://img.shields.io/github/stars/chatman-media/timeline-studio?style=for-the-badge)](https://github.com/chatman-media/timeline-studio/stargazers)
[![npm downloads](https://img.shields.io/npm/dm/timeline-studio?style=for-the-badge&label=npm%20downloads)](https://www.npmjs.com/package/timeline-studio)
[![Open Collective](https://img.shields.io/opencollective/all/timeline-studio?style=for-the-badge&label=sponsors)](https://opencollective.com/timeline-studio)
[![Documentation](https://img.shields.io/badge/read-docs-blue?style=for-the-badge)](https://chatman-media.github.io/timeline-studio/api-docs/)
[![Website](https://img.shields.io/badge/visit-website-brightgreen?style=for-the-badge&logo=globe&logoColor=white)](https://chatman-media.github.io/timeline-studio/)
[![Telegram](https://img.shields.io/badge/Join%20Group-Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/timelinestudio)
[![Discord](https://img.shields.io/badge/Chat-on%20Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/gwJUYxck)
[![X](https://img.shields.io/badge/Follow-@chatman-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/chatman_media)
[![YouTube](https://img.shields.io/badge/Subscribe-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://www.youtube.com/@chatman-media)

</div>

## 🎬 Project Overview

**Timeline Studio** - AI-powered video editor that transforms your videos, music, and favorite effects into dozens of ready-to-publish clips for all platforms!

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

![Timeline Interface #1](/public/screen2.png)

![Timeline Interface #2](/public/screen4.png)

### Project Status (23 June 2025)

**Overall Completion: 62%** ⬆️ (recalculated with API Keys Management at 100% and 14 new planned modules)
- **Completed**: 13 modules (100% readiness)
- **In development**: 7 modules (45-90% readiness)
- **Planned**: 4 modules (30-80% readiness)
- **New planned**: 14 modules (0% readiness) - [details in planned/](docs-ru/08-roadmap/planned/)

## Key Features

- 🎬 Professional video editing with multi-track timeline
- 🖥️ Cross-platform (Windows, macOS, Linux)
- 🚀 GPU-accelerated video processing (NVENC, QuickSync, VideoToolbox)
- 🤖 AI-powered object/face recognition (YOLO v11)
- 🎨 30+ transitions, visual effects, and filters
- 📝 Advanced subtitle system with 12 styles and animations
- 🎵 Multi-track audio editing with effects
- 📤 Export to MP4/MOV/WebM with social media OAuth integration
- 🔐 YouTube/TikTok/Vimeo/Telegram OAuth support with secure token storage
- 📱 Device presets (iPhone, iPad, Android) for optimized exports
- 🌐 Internationalization support (11 languages)
- 💾 Smart caching and unified preview system
- 🎨 Modern UI using Tailwind CSS v4, shadcn-ui
- 📚 Complete documentation with more than 5,000 tests and over 80% code coverage

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

- 📚 [Documentation Overview](docs-ru/README.md) - Complete documentation map
- 🚀 [Getting Started](docs-ru/01-getting-started/README.md) - Installation and first steps
- 🏗️ [Architecture Guide](docs-ru/02-architecture/README.md) - System architecture
- 🎯 [Features Guide](docs-ru/03-features/README.md) - Feature overview and status
- 📡 [API Reference](docs-ru/04-api-reference/README.md) - Tauri commands reference
- 🧪 [Development Guide](docs-ru/05-development/README.md) - Testing and development
- 🚀 [Deployment Guide](docs-ru/06-deployment/README.md) - Build and deployment
- 📋 [User Guides](docs-ru/07-guides/README.md) - Performance and best practices
- 🛣️ [Roadmap](docs-ru/08-roadmap/README.md) - Development roadmap
- 🔐 [OAuth Setup](docs-ru/09-oauth-setup/oauth-setup-guide.md) - Social media integration

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

## GitAds Sponsored
[![Sponsored by GitAds](https://gitads.dev/v1/ad-serve?source=chatman-media/timeline-studio@github)](https://gitads.dev/v1/ad-track?source=chatman-media/timeline-studio@github)

## License

MIT License with Commons Clause - free for personal use, commercial use requires agreement.

📄 **[Full License Details →](docs-ru/10-legal/license.md)** | 📧 **Commercial License**: ak.chatman.media@gmail.com

<!-- GitAds-Verify: EIS875AHMQZGOHYNQFNPOUHHNSEXHVUR -->
