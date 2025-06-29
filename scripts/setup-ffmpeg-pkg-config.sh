#!/bin/bash
# Alternative FFmpeg setup using pkg-config

echo "Setting up FFmpeg using pkg-config..."

# Check if pkg-config can find FFmpeg
if ! pkg-config --exists libavcodec libavformat libavutil libswscale; then
    echo "ERROR: FFmpeg libraries not found via pkg-config"
    exit 1
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

# Export for GitHub Actions
if [ -n "$GITHUB_ENV" ]; then
    echo "BINDGEN_EXTRA_CLANG_ARGS=$CLANG_ARGS" >> "$GITHUB_ENV"
    # Also set individual library paths
    echo "FFMPEG_AVCODEC_INCLUDE_DIR=/usr/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVFORMAT_INCLUDE_DIR=/usr/include" >> "$GITHUB_ENV"
    echo "FFMPEG_AVUTIL_INCLUDE_DIR=/usr/include" >> "$GITHUB_ENV"
    echo "FFMPEG_SWSCALE_INCLUDE_DIR=/usr/include" >> "$GITHUB_ENV"
fi