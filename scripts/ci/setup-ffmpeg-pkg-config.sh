#!/bin/bash
# Alternative FFmpeg setup using pkg-config

echo "Setting up FFmpeg using pkg-config..."

# Check if pkg-config can find FFmpeg
if ! pkg-config --exists libavcodec libavformat libavutil libswscale; then
    echo "WARNING: FFmpeg libraries not found via pkg-config"
    echo "Trying to set up manually..."
    
    # Set PKG_CONFIG_PATH to common locations
    export PKG_CONFIG_PATH="/usr/lib/x86_64-linux-gnu/pkgconfig:/usr/lib/pkgconfig:/usr/share/pkgconfig:/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH"
    
    # Try again
    if ! pkg-config --exists libavcodec libavformat libavutil libswscale; then
        echo "ERROR: FFmpeg libraries still not found via pkg-config"
        echo "Checking what's available:"
        find /usr -name "*.pc" -path "*pkgconfig*" | grep -E "(libav|libsw)" | head -20
        exit 1
    fi
fi

# Get include paths from pkg-config
AVCODEC_CFLAGS=$(pkg-config --cflags libavcodec)
AVFORMAT_CFLAGS=$(pkg-config --cflags libavformat)
AVUTIL_CFLAGS=$(pkg-config --cflags libavutil)
SWSCALE_CFLAGS=$(pkg-config --cflags libswscale)

echo "pkg-config reports:"
echo "  libavcodec: $AVCODEC_CFLAGS"
echo "  libavformat: $AVFORMAT_CFLAGS"
echo "  libavutil: $AVUTIL_CFLAGS"
echo "  libswscale: $SWSCALE_CFLAGS"

# Extract include directories
INCLUDE_DIRS=""
for flag in $AVCODEC_CFLAGS $AVFORMAT_CFLAGS $AVUTIL_CFLAGS $SWSCALE_CFLAGS; do
    if [[ $flag == -I* ]]; then
        dir=${flag#-I}
        if [[ ! " $INCLUDE_DIRS " =~ " $dir " ]]; then
            INCLUDE_DIRS="$INCLUDE_DIRS $dir"
        fi
    fi
done

echo ""
echo "Include directories found: $INCLUDE_DIRS"

# Set BINDGEN_EXTRA_CLANG_ARGS with all include paths
CLANG_ARGS=""
for dir in $INCLUDE_DIRS; do
    CLANG_ARGS="$CLANG_ARGS -I$dir"
done

# Also add standard locations just in case
CLANG_ARGS="$CLANG_ARGS -I/usr/include -I/usr/include/x86_64-linux-gnu"

echo ""
echo "Setting BINDGEN_EXTRA_CLANG_ARGS=$CLANG_ARGS"

# Find the actual include directory containing FFmpeg headers
FFMPEG_BASE_INCLUDE=""
for dir in $INCLUDE_DIRS /usr/include /usr/include/x86_64-linux-gnu; do
    if [ -f "$dir/libavcodec/avcodec.h" ]; then
        FFMPEG_BASE_INCLUDE="$dir"
        break
    fi
done

if [ -z "$FFMPEG_BASE_INCLUDE" ]; then
    FFMPEG_BASE_INCLUDE="/usr/include"
fi

echo "Using FFmpeg base include directory: $FFMPEG_BASE_INCLUDE"

# Export for GitHub Actions
if [ -n "$GITHUB_ENV" ]; then
    echo "BINDGEN_EXTRA_CLANG_ARGS=$CLANG_ARGS" >> "$GITHUB_ENV"
    # Also set individual library paths
    echo "FFMPEG_AVCODEC_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_AVFORMAT_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_AVUTIL_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_SWSCALE_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_SWRESAMPLE_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_AVFILTER_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
    echo "FFMPEG_AVDEVICE_INCLUDE_DIR=$FFMPEG_BASE_INCLUDE" >> "$GITHUB_ENV"
fi