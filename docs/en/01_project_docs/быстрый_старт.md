# QUICK START GUIDE

## 🚀 Getting Started with Timeline Studio

This guide will help you get Timeline Studio up and running in just a few minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **Bun** (latest version)
- **Rust** 1.81.0 or higher
- **FFmpeg** 6.0 or higher

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio
```

### 2. Install Dependencies

```bash
bun install
```

### 3. Platform-Specific Setup

#### macOS
```bash
# Install FFmpeg
brew install ffmpeg

# Install ONNX Runtime (for AI features)
brew install onnxruntime

# Set environment variable (add to ~/.zshrc or ~/.bashrc)
export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib
```

#### Windows
```powershell
# Run the setup script
./scripts/setup-rust-env-windows.ps1

# Or manually install FFmpeg
# Download from https://www.gyan.dev/ffmpeg/builds/
# Extract to C:\ffmpeg
# Add C:\ffmpeg\bin to PATH
```

#### Linux
```bash
# Install dependencies
sudo apt-get update
sudo apt-get install ffmpeg libavcodec-dev libavformat-dev \
  libavutil-dev libavfilter-dev libavdevice-dev
```

## 🎮 Running Timeline Studio

### Development Mode

```bash
bun run tauri dev
```

This will:
- Start the Next.js development server
- Launch the Tauri application window
- Enable hot reload for both frontend and backend

### Production Build

```bash
bun run tauri build
```

This creates an optimized production build for your platform.

## 🎬 Creating Your First Project

1. **Launch Timeline Studio**
   - Run `bun run tauri dev`
   - The application window will open

2. **Create a New Project**
   - Click "New Project" on the welcome screen
   - Choose project settings (resolution, framerate)
   - Click "Create"

3. **Import Media**
   - Click the "Import" button in the media browser
   - Select your video files
   - Wait for import to complete

4. **Edit Your Video**
   - Drag media from browser to timeline
   - Use the toolbar for cutting, transitions, effects
   - Preview your edits in the video player

5. **Export Your Project**
   - Click "Export" in the top menu
   - Choose format and quality settings
   - Select destination
   - Click "Start Export"

## 🤖 Using AI Features

### Claude/OpenAI Integration

1. **Set up API Keys**
   - Go to Settings → AI Configuration
   - Enter your Claude or OpenAI API key
   - Keys are securely stored in your system keychain

2. **Using AI Assistant**
   - Click the AI chat icon in the sidebar
   - Ask questions about editing techniques
   - Get suggestions for your project

3. **Automatic Features**
   - Scene detection
   - Object recognition
   - Auto-subtitles with Whisper

## 🔧 Common Issues

### FFmpeg Not Found
```bash
# Verify FFmpeg installation
ffmpeg -version

# If not found, reinstall FFmpeg for your platform
```

### Build Failures
- Ensure all prerequisites are installed
- Clear cache: `cargo clean && bun install --force`
- Check Rust version: `rustc --version`

### Performance Issues
- Enable GPU acceleration in Settings
- Use proxy files for 4K footage
- Close other resource-intensive applications

## 📚 Next Steps

- Read the [Architecture Overview](ARCHITECTURE_OVERVIEW.md)
- Explore [Features Documentation](../02_REQUIREMENTS/FUNCTIONAL_requirements.md)
- Join our [Discord Community](https://discord.gg/gwJUYxck)
- Check out [Video Tutorials](https://www.youtube.com/@chatman-media)

## 💡 Tips

- Use keyboard shortcuts for faster editing (press `?` to see all)
- Enable auto-save in Settings to prevent data loss
- GPU acceleration significantly improves export speed
- Regular backups of your projects are recommended

---

*Need help? Visit our [troubleshooting guide](../05_DEVELOPMENT/TROUBLESHOOTING.md) or ask in our [community chat](https://t.me/timelinestudio)*