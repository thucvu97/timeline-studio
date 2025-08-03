# Timeline Studio v0.60.0-alpha

First public alpha release with local AI capabilities powered by Ollama.

## ✨ Highlights

- 🤖 **100% Local AI Processing** - All AI operations run on your device using Ollama
- 🎬 **Basic Video Editor** - Timeline, trimming, transitions, and effects  
- 🌍 **10 Languages** - Full localization (EN, RU, ES, FR, DE, PT, ZH, JA, KO, TR)
- 🚀 **Fast Performance** - Optimized with Tauri v2 and Biome

## 🔧 System Requirements

### Minimum
- **OS**: Windows 10/11, macOS 12+, or Ubuntu 22.04+
- **RAM**: 8GB
- **CPU**: 4 cores, 2.5GHz
- **Disk**: 10GB free space
- **Ollama**: v0.1.45+ (for AI features)

### Recommended
- **RAM**: 16GB
- **CPU**: 8 cores, 3.0GHz
- **GPU**: Any with 4GB VRAM
- **Disk**: 20GB free space

## 🚀 Quick Start

### 1. Install Ollama
```bash
# macOS
brew install ollama

# Linux  
curl -fsSL https://ollama.ai/install.sh | sh

# Windows
# Download from https://ollama.ai/download/windows
```

### 2. Download AI Model
```bash
# Recommended model (1.6GB)
ollama pull gemma2:2b

# Start Ollama server
ollama serve
```

### 3. Install Timeline Studio
Download the appropriate installer from the releases below and run it.

### 4. Create Your First Project!
Launch Timeline Studio, select your language, and start editing.

## 📦 Downloads

- **Windows**: `Timeline-Studio-Setup-0.60.0.exe` (142 MB)
- **macOS**: `Timeline-Studio-0.60.0.dmg` (156 MB)  
- **Linux**: `timeline-studio_0.60.0_amd64.deb` (138 MB)

## ✅ What Works

### Core Features
- Timeline editor with multiple tracks
- Media browser with tabbed interface
- Video player with frame-accurate control
- Project saving and loading
- Basic effects and transitions
- Export to MP4 (1080p)

### AI Features (via Ollama)
- Video content analysis
- Scene detection
- Key moment identification
- Basic subtitle generation
- Export results to JSON

## 🐛 Known Issues

### Non-Blocking
- ~1860 TypeScript errors (doesn't affect functionality, will be fixed in Beta)
- First Ollama request is slow (model loading)
- No GPU acceleration for Ollama (CPU only)

### Needs Attention
- High memory usage with large projects
- Limited codec support on some platforms
- Possible stability issues during extended use

## 📝 Testing Scenarios

### Scenario 1: Basic Video Analysis
1. Load a video file (< 5 minutes)
2. Open AI Content Intelligence
3. Click "Analyze"
4. Wait for results (1-3 minutes)
5. Export to JSON

### Scenario 2: Subtitle Generation
1. Load video with clear speech
2. Use AI for transcription
3. Generate subtitles
4. Export to SRT format

## 🤖 Recommended Ollama Models

| Model | Size | Description |
|-------|------|-------------|
| **gemma2:2b** | **1.6GB** | **Best balance** (recommended) |
| llama3.2 | 2GB | Good performance |
| phi3 | 2.3GB | Microsoft model |
| qwen2.5:0.5b | 400MB | Fastest, smallest |

## 🔗 Links

- **Documentation**: [GitHub Wiki](https://github.com/chatman-media/timeline-studio/wiki)
- **Report Issues**: [GitHub Issues](https://github.com/chatman-media/timeline-studio/issues)
- **Testing Guide**: [Alpha Testing Guide](docs/en/14_quality_assurance/alpha-testing-guide.md)
- **Discord**: [Join Community](https://discord.gg/timeline-studio)

## 🙏 Acknowledgments

Thanks to:
- Tauri team for the amazing framework
- Ollama team for local AI models
- Early testers for feedback
- All contributors and maintainers

## ⚠️ Important Notes

This is an **alpha release** for early testing:
- Expect bugs and incomplete features
- Not suitable for production use
- Your feedback is crucial for improvement
- Data loss is possible - backup your projects

## 📊 Release Stats

- **Commits since v0.59.8**: 47
- **Files changed**: 312
- **New features**: 12
- **Bugs fixed**: 23
- **Test coverage**: 80%

---

**Version**: 0.60.0-alpha  
**Branch**: alpha-release-v0.60.0  
**Date**: August 3, 2025  
**Contact**: ak.chatman.media@gmail.com