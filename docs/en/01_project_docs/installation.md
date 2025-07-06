# TIMELINE STUDIO INSTALLATION GUIDE

## 📋 System Requirements

### Minimum Requirements
- **OS**: Windows 10+, macOS 10.15+, Ubuntu 20.04+
- **RAM**: 8 GB
- **Storage**: 2 GB + project space
- **GPU**: DirectX 11 compatible

### Recommended Requirements
- **OS**: Latest version
- **RAM**: 16 GB (32 GB for 4K)
- **Storage**: SSD with 10 GB free
- **GPU**: NVIDIA RTX 3060 or better

## 🛠️ Installation Steps

### Step 1: Install Prerequisites

#### Node.js and Bun
```bash
# Install Node.js 18+ from https://nodejs.org
node --version  # Should show v18.0.0 or higher

# Install Bun
curl -fsSL https://bun.sh/install | bash
```

#### Rust
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Verify installation
rustc --version  # Should show 1.81.0 or higher
```

#### FFmpeg

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download FFmpeg from https://www.gyan.dev/ffmpeg/builds/
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

**Linux:**
```bash
sudo apt update
sudo apt install ffmpeg
```

### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/chatman-media/timeline-studio.git
cd timeline-studio

# Install dependencies
bun install

# Build the application
bun run tauri build
```

### Step 3: Platform-Specific Setup

#### macOS

1. **ONNX Runtime** (for AI features):
```bash
brew install onnxruntime

# Add to ~/.zshrc or ~/.bashrc
echo 'export ORT_DYLIB_PATH=/opt/homebrew/lib/libonnxruntime.dylib' >> ~/.zshrc
source ~/.zshrc
```

2. **Allow app to run**:
   - Open System Preferences → Security & Privacy
   - Click "Open Anyway" if macOS blocks the app

#### Windows

1. **Visual Studio 2022**:
   - Download from https://visualstudio.microsoft.com/
   - Install with "Desktop development with C++" workload

2. **Environment Setup**:
```powershell
# Run as Administrator
./scripts/setup-rust-env-windows.ps1
```

3. **Windows Defender**:
   - May need to add exception for Timeline Studio

#### Linux

1. **System Dependencies**:
```bash
sudo apt update
sudo apt install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libssl-dev
```

2. **GPU Drivers**:
   - NVIDIA: Install proprietary drivers for NVENC
   - AMD: Install AMDGPU-PRO for AMF

### Step 4: First Run

```bash
# Development mode
bun run tauri dev

# Or run the built application
# macOS: open target/release/bundle/macos/Timeline\ Studio.app
# Windows: target\release\Timeline Studio.exe
# Linux: target/release/timeline-studio
```

## 🔧 Troubleshooting

### Common Issues

#### "FFmpeg not found"
- Verify FFmpeg is in PATH: `ffmpeg -version`
- Reinstall FFmpeg for your platform
- Restart terminal/computer after installation

#### Build fails with Rust error
```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
bun install --force
```

#### App doesn't start
- Check console for errors: `bun run tauri dev`
- Verify all dependencies are installed
- Try running as administrator (Windows)

#### GPU acceleration not working
- Update GPU drivers
- Check GPU compatibility in Settings
- Disable GPU acceleration as fallback

### Getting Help

- 📖 [Documentation](https://chatman-media.github.io/timeline-studio/)
- 💬 [Discord Community](https://discord.gg/gwJUYxck)
- 📞 [Telegram Support](https://t.me/timelinestudio)
- 🐛 [Report Issues](https://github.com/chatman-media/timeline-studio/issues)

## ✅ Verification

After installation, verify everything works:

1. **Check versions**:
```bash
node --version      # 18.0.0+
bun --version       # Latest
rustc --version     # 1.81.0+
ffmpeg -version     # 6.0+
```

2. **Run tests**:
```bash
bun run test
bun run test:rust
```

3. **Check features**:
- Import a video file
- Apply an effect
- Export a short clip

---

*Installation typically takes 10-15 minutes depending on internet speed and system performance.*