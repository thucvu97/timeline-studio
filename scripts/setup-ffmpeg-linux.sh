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

# Debug: show what's in /usr/include
echo "Checking current /usr/include structure:"
ls -la /usr/include/ | grep -E "lib(av|sw)" || echo "No FFmpeg libs found in /usr/include"

# Find actual location of FFmpeg headers
FFMPEG_INCLUDE_DIR=""
for loc in "${HEADER_LOCATIONS[@]}"; do
    echo "Checking $loc..."
    if [ -f "$loc/libavcodec/avcodec.h" ] && [ -f "$loc/libswscale/swscale.h" ]; then
        FFMPEG_INCLUDE_DIR="$loc"
        echo "Found complete FFmpeg headers in: $FFMPEG_INCLUDE_DIR"
        break
    elif [ -f "$loc/libavcodec/avcodec.h" ]; then
        echo "Found partial FFmpeg headers in $loc (missing swscale)"
    fi
done

if [ -z "$FFMPEG_INCLUDE_DIR" ]; then
    echo "ERROR: FFmpeg headers not found in standard locations!"
    echo "Searched in: ${HEADER_LOCATIONS[*]}"
    echo "Please install FFmpeg development packages"
    exit 1
fi

# Always create symlinks if headers are not in /usr/include
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
            # Remove existing symlink if present
            sudo rm -f "/usr/include/$lib" 2>/dev/null || true
            # Create new symlink
            sudo ln -sfn "$FFMPEG_INCLUDE_DIR/$lib" "/usr/include/$lib"
            echo "✓ Created symlink for $lib"
        else
            echo "⚠ Warning: $lib not found in $FFMPEG_INCLUDE_DIR"
        fi
    done
else
    echo "FFmpeg headers already in /usr/include, no symlinks needed"
fi

# Verify installation
echo ""
echo "Verifying FFmpeg headers..."
MISSING_LIBS=0
for lib in libavcodec libavformat libavutil libswscale libavfilter libavdevice libswresample; do
    if [ -d "/usr/include/$lib" ]; then
        echo "✓ $lib headers found"
        # Check for specific problematic file
        if [ "$lib" = "libswscale" ] && [ ! -f "/usr/include/libswscale/swscale.h" ]; then
            echo "  ✗ ERROR: swscale.h not found in /usr/include/libswscale/"
            MISSING_LIBS=$((MISSING_LIBS + 1))
        fi
    else
        echo "✗ $lib headers missing at /usr/include/$lib"
        MISSING_LIBS=$((MISSING_LIBS + 1))
    fi
done

if [ $MISSING_LIBS -gt 0 ]; then
    echo ""
    echo "ERROR: Some FFmpeg headers are still missing!"
    echo "Attempting to find swscale.h specifically:"
    find /usr -name "swscale.h" -type f 2>/dev/null | head -5
    exit 1
fi

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