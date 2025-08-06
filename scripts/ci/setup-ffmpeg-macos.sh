#!/bin/bash
# Script to setup FFmpeg for macOS builds

echo "Setting up FFmpeg for macOS..."

# Determine Homebrew prefix (different for Intel vs Apple Silicon)
if [ -d "/opt/homebrew" ]; then
    BREW_PREFIX="/opt/homebrew"
    echo "Detected Apple Silicon Mac (homebrew at /opt/homebrew)"
elif [ -d "/usr/local/Homebrew" ]; then
    BREW_PREFIX="/usr/local"
    echo "Detected Intel Mac (homebrew at /usr/local)"
else
    echo "ERROR: Homebrew not found!"
    exit 1
fi

# Check if FFmpeg is installed
if [ ! -d "$BREW_PREFIX/opt/ffmpeg" ]; then
    echo "ERROR: FFmpeg not found. Please install with: brew install ffmpeg"
    exit 1
fi

echo "FFmpeg found at: $BREW_PREFIX/opt/ffmpeg"

# Set up environment variables
export PKG_CONFIG_PATH="$BREW_PREFIX/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH"
export FFMPEG_DIR="$BREW_PREFIX/opt/ffmpeg"
export FFMPEG_INCLUDE_DIR="$BREW_PREFIX/opt/ffmpeg/include"
export FFMPEG_LIB_DIR="$BREW_PREFIX/opt/ffmpeg/lib"

# For bindgen
export BINDGEN_EXTRA_CLANG_ARGS="-I$BREW_PREFIX/opt/ffmpeg/include"

# Additional paths that might be needed
export DYLD_FALLBACK_LIBRARY_PATH="$BREW_PREFIX/opt/ffmpeg/lib:$DYLD_FALLBACK_LIBRARY_PATH"

echo ""
echo "Environment variables set:"
echo "  PKG_CONFIG_PATH=$PKG_CONFIG_PATH"
echo "  FFMPEG_DIR=$FFMPEG_DIR"
echo "  FFMPEG_INCLUDE_DIR=$FFMPEG_INCLUDE_DIR"
echo "  FFMPEG_LIB_DIR=$FFMPEG_LIB_DIR"
echo "  BINDGEN_EXTRA_CLANG_ARGS=$BINDGEN_EXTRA_CLANG_ARGS"

# Verify installation
echo ""
echo "Verifying FFmpeg installation..."

# Check for headers
if [ -f "$FFMPEG_INCLUDE_DIR/libavutil/avutil.h" ]; then
    echo "✓ Found libavutil/avutil.h"
else
    echo "✗ ERROR: libavutil/avutil.h not found at $FFMPEG_INCLUDE_DIR/libavutil/avutil.h"
    ls -la "$FFMPEG_INCLUDE_DIR/" | head -10
    exit 1
fi

# Check pkg-config
echo ""
echo "Testing pkg-config..."
if pkg-config --exists libavutil; then
    echo "✓ pkg-config can find libavutil"
    echo "  Cflags: $(pkg-config --cflags libavutil)"
    echo "  Libs: $(pkg-config --libs libavutil)"
else
    echo "✗ pkg-config cannot find libavutil"
    echo "  Current PKG_CONFIG_PATH: $PKG_CONFIG_PATH"
fi

# Export for GitHub Actions
if [ -n "$GITHUB_ENV" ]; then
    echo "" >> "$GITHUB_ENV"
    echo "PKG_CONFIG_PATH=$BREW_PREFIX/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH" >> "$GITHUB_ENV"
    echo "FFMPEG_DIR=$BREW_PREFIX/opt/ffmpeg" >> "$GITHUB_ENV"
    echo "FFMPEG_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_LIB_DIR=$BREW_PREFIX/opt/ffmpeg/lib" >> "$GITHUB_ENV"
    echo "BINDGEN_EXTRA_CLANG_ARGS=-I$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "DYLD_FALLBACK_LIBRARY_PATH=$BREW_PREFIX/opt/ffmpeg/lib:$DYLD_FALLBACK_LIBRARY_PATH" >> "$GITHUB_ENV"
    
    # Also set individual library paths for ffmpeg-sys-next
    echo "FFMPEG_AVCODEC_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVFORMAT_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVUTIL_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVDEVICE_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVFILTER_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_SWSCALE_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
    echo "FFMPEG_SWRESAMPLE_INCLUDE_DIR=$BREW_PREFIX/opt/ffmpeg/include" >> "$GITHUB_ENV"
fi

echo ""
echo "FFmpeg setup completed for macOS!"