#!/usr/bin/env fish
# Script to setup FFmpeg for macOS builds (Fish shell version)

echo "Setting up FFmpeg for macOS..."

# Determine Homebrew prefix (different for Intel vs Apple Silicon)
if test -d "/opt/homebrew"
    set BREW_PREFIX "/opt/homebrew"
    echo "Detected Apple Silicon Mac (homebrew at /opt/homebrew)"
else if test -d "/usr/local/Homebrew"
    set BREW_PREFIX "/usr/local"
    echo "Detected Intel Mac (homebrew at /usr/local)"
else
    echo "ERROR: Homebrew not found!"
    exit 1
end

# Check if FFmpeg is installed
if not test -d "$BREW_PREFIX/opt/ffmpeg"
    echo "ERROR: FFmpeg not found. Please install with: brew install ffmpeg"
    exit 1
end

echo "FFmpeg found at: $BREW_PREFIX/opt/ffmpeg"

# Set up environment variables
set -gx PKG_CONFIG_PATH "$BREW_PREFIX/opt/ffmpeg/lib/pkgconfig:$PKG_CONFIG_PATH"
set -gx FFMPEG_DIR "$BREW_PREFIX/opt/ffmpeg"
set -gx FFMPEG_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_LIB_DIR "$BREW_PREFIX/opt/ffmpeg/lib"

# For bindgen
set -gx BINDGEN_EXTRA_CLANG_ARGS "-I$BREW_PREFIX/opt/ffmpeg/include"

# Additional paths that might be needed
set -gx DYLD_FALLBACK_LIBRARY_PATH "$BREW_PREFIX/opt/ffmpeg/lib:$DYLD_FALLBACK_LIBRARY_PATH"

# Individual library paths for ffmpeg-sys-next
set -gx FFMPEG_AVCODEC_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_AVFORMAT_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_AVUTIL_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_AVDEVICE_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_AVFILTER_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_SWSCALE_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"
set -gx FFMPEG_SWRESAMPLE_INCLUDE_DIR "$BREW_PREFIX/opt/ffmpeg/include"

# ONNX Runtime
set -gx ORT_DYLIB_PATH /opt/homebrew/lib/libonnxruntime.dylib

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
if test -f "$FFMPEG_INCLUDE_DIR/libavutil/avutil.h"
    echo "✓ Found libavutil/avutil.h"
else
    echo "✗ ERROR: libavutil/avutil.h not found at $FFMPEG_INCLUDE_DIR/libavutil/avutil.h"
    ls -la "$FFMPEG_INCLUDE_DIR/" | head -10
    exit 1
end

# Check pkg-config
echo ""
echo "Testing pkg-config..."
if pkg-config --exists libavutil
    echo "✓ pkg-config can find libavutil"
    echo "  Cflags: "(pkg-config --cflags libavutil)
    echo "  Libs: "(pkg-config --libs libavutil)
else
    echo "✗ pkg-config cannot find libavutil"
    echo "  Current PKG_CONFIG_PATH: $PKG_CONFIG_PATH"
end

echo ""
echo "FFmpeg setup completed for macOS!"