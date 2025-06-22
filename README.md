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

## GitAds Sponsored
[![Sponsored by GitAds](https://gitads.dev/v1/ad-serve?source=chatman-media/timeline-studio@github)](https://gitads.dev/v1/ad-track?source=chatman-media/timeline-studio@github)

## 🎬 Project Overview

**Timeline Studio** - видеоредактор с AI, который превращает ваши видео, музыку и любимые эффекты в десятки готовых роликов для всех платформ!

### 🚀 Представьте возможности

**Загрузили свои видео, фото, музыку один раз** → получили:
- 📱 **TikTok** - вертикальные шортсы с трендовыми эффектами
- 📺 **YouTube** - полные фильмы, короткие ролики, Shorts
- 📸 **Instagram** - Reels, Stories, посты разной длительности
- ✈️ **Telegram** - оптимизированные версии для каналов и чатов

AI-ассистент сам создаст нужное количество версий под каждую платформу! 🤖

### 💡 Как это работает?

> *"Создай видео о моем путешествии по Азии для всех соцсетей" - и через несколько минут у вас готовы варианты: динамичные шортсы для TikTok, атмосферный влог для YouTube, яркие Stories для Instagram. AI сам подберет лучшие моменты, синхронизирует с музыкой и адаптирует под каждую платформу.*

### ⚡ Почему это меняет всё?

- **Экономия времени в 10 раз** - больше не нужно вручную адаптировать каждое видео
- **AI понимает тренды** - знает, что работает в каждой соцсети
- **Профессиональное качество** - используем те же инструменты, что и большие студии
- **Всё работает локально** - ваш контент остается приватным

![Timeline Interface #1](/public/screen2.png)

![Timeline Interface #2](/public/screen4.png)

### Project Status (June 2025)

**Overall Completion: 58%** ⬆️ (recalculated with API Keys Management at 100% and 14 new planned modules)
- **Completed**: 13 modules (100% readiness)
- **In development**: 7 modules (45-90% readiness)
- **Planned**: 4 modules (30-80% readiness)
- **New planned**: 14 modules (0% readiness) - [details in planned/](docs-ru/08-roadmap/planned/)

### Key Achievements:
- ✅ **Core Architecture** - Timeline, Video Compiler, Media Management (100%)
- ✅ **API Keys Management** - secure storage with AES-256-GCM encryption (100%)
- ✅ **Recognition** - YOLO v11 object and face recognition (100%)
- ✅ **Export** - OAuth integration for YouTube/TikTok/Vimeo (100%)
- 🚧 **Effects/Filters/Transitions** - rich library in progress (75-80%)
- 🚧 **Timeline AI** - automation with 41 Claude tools (90%)

### Current Tasks:
- 🔄 **OAuth callback handling** - completing social network integration
- ⏳ **HTTP API validation** - real-time connection testing
- ⏳ **Import from .env** - migration of existing keys

### Next Steps:
1. **Social Networks Integration** - full OAuth flow implementation
2. **Advanced Effects** - completing Filmora-style library
3. **Timeline AI** - intelligent video creation automation

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

## License

MIT License with Commons Clause - free for personal use, commercial use requires agreement.

📄 **[Full License Details →](docs-ru/10-legal/license.md)** | 📧 **Commercial License**: ak.chatman.media@gmail.com

<!-- GitAds-Verify: EIS875AHMQZGOHYNQFNPOUHHNSEXHVUR -->
