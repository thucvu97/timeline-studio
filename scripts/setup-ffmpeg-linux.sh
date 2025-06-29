#!/bin/bash
# Script to setup FFmpeg headers for Linux builds
# This handles various installation locations across different Linux distributions

echo "Setting up FFmpeg headers for Linux..."

# Common header locations
HEADER_LOCATIONS=(
    "/usr/include"
    "/usr/include/x86_64-linux-gnu"
    "/usr/include/aarch64-linux-gnu"
    "/usr/local/include"
)

# Find actual location of FFmpeg headers
FFMPEG_INCLUDE_DIR=""
for loc in "${HEADER_LOCATIONS[@]}"; do
    if [ -f "$loc/libavcodec/avcodec.h" ]; then
        FFMPEG_INCLUDE_DIR="$loc"
        echo "Found FFmpeg headers in: $FFMPEG_INCLUDE_DIR"
        break
    fi
done

if [ -z "$FFMPEG_INCLUDE_DIR" ]; then
    echo "ERROR: FFmpeg headers not found in standard locations!"
    echo "Searched in: ${HEADER_LOCATIONS[*]}"
    echo "Please install FFmpeg development packages"
    exit 1
fi

# Create symlinks if headers are not in /usr/include
if [ "$FFMPEG_INCLUDE_DIR" != "/usr/include" ] && [ -d "$FFMPEG_INCLUDE_DIR" ]; then
    echo "Creating symlinks from $FFMPEG_INCLUDE_DIR to /usr/include..."
    
    # List of FFmpeg libraries
    FFMPEG_LIBS=(
        "libavcodec"
        "libavformat"
        "libavutil"
        "libavfilter"
        "libavdevice"
        "libswscale"
        "libswresample"
        "libpostproc"
    )
    
    for lib in "${FFMPEG_LIBS[@]}"; do
        if [ -d "$FFMPEG_INCLUDE_DIR/$lib" ]; then
            sudo ln -sfn "$FFMPEG_INCLUDE_DIR/$lib" "/usr/include/$lib"
            echo "✓ Created symlink for $lib"
        fi
    done
fi

# Verify installation
echo ""
echo "Verifying FFmpeg headers..."
for lib in libavcodec libavformat libavutil libswscale; do
    if [ -d "/usr/include/$lib" ]; then
        echo "✓ $lib headers found"
    else
        echo "✗ $lib headers missing"
    fi
done

# Export environment variables
echo ""
echo "Setting environment variables..."
echo "FFMPEG_INCLUDE_DIR=$FFMPEG_INCLUDE_DIR"
echo "BINDGEN_EXTRA_CLANG_ARGS=-I$FFMPEG_INCLUDE_DIR"

# For GitHub Actions
if [ -n "$GITHUB_ENV" ]; then
    echo "FFMPEG_INCLUDE_DIR=$FFMPEG_INCLUDE_DIR" >> "$GITHUB_ENV"
    echo "BINDGEN_EXTRA_CLANG_ARGS=-I$FFMPEG_INCLUDE_DIR" >> "$GITHUB_ENV"
fi