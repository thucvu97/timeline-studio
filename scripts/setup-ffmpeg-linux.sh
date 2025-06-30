#!/bin/bash
# Script to setup FFmpeg headers for Linux builds
# This handles various installation locations across different Linux distributions

echo "Setting up FFmpeg headers for Linux..."

# Function to verify pkg-config works for FFmpeg libraries
verify_pkgconfig() {
    local libs=("libavcodec" "libavformat" "libavutil" "libswscale" "libavfilter" "libavdevice" "libswresample")
    local all_found=true
    
    for lib in "${libs[@]}"; do
        if ! pkg-config --exists "$lib" 2>/dev/null; then
            echo "❌ pkg-config cannot find $lib"
            all_found=false
        else
            echo "✅ pkg-config found $lib"
        fi
    done
    
    return $([ "$all_found" = true ] && echo 0 || echo 1)
}

# First check if pkg-config can find FFmpeg libraries
echo "Checking pkg-config for FFmpeg libraries..."
if verify_pkgconfig; then
    echo "✅ All FFmpeg libraries found via pkg-config - no manual setup needed"
    FFMPEG_INCLUDE_DIR=$(pkg-config --variable=includedir libavcodec 2>/dev/null || echo "/usr/include")
else
    echo "❌ pkg-config setup incomplete, attempting manual header discovery..."
    
    # Common header locations
    HEADER_LOCATIONS=(
        "/usr/include"
        "/usr/include/x86_64-linux-gnu"
        "/usr/include/aarch64-linux-gnu"
        "/usr/local/include"
        "/usr/include/ffmpeg"
        "/usr/local/include/ffmpeg"
    )

    # Find actual location of FFmpeg headers
    FFMPEG_INCLUDE_DIR=""
    for loc in "${HEADER_LOCATIONS[@]}"; do
        if [ -f "$loc/libavcodec/avcodec.h" ] && [ -f "$loc/libswscale/swscale.h" ]; then
            FFMPEG_INCLUDE_DIR="$loc"
            echo "Found complete FFmpeg headers in: $FFMPEG_INCLUDE_DIR"
            break
        fi
    done

    if [ -z "$FFMPEG_INCLUDE_DIR" ]; then
        echo "Searching for FFmpeg headers in system..."
        
        # Try to find FFmpeg headers anywhere in the system  
        AVCODEC_PATH=$(find /usr -name "avcodec.h" -path "*/libavcodec/*" 2>/dev/null | head -1)
        SWSCALE_PATH=$(find /usr -name "swscale.h" -path "*/libswscale/*" 2>/dev/null | head -1)
        
        if [ -n "$AVCODEC_PATH" ] && [ -n "$SWSCALE_PATH" ]; then
            # Extract the base directory (parent of libavcodec/libswscale)
            FFMPEG_INCLUDE_DIR=$(dirname $(dirname "$AVCODEC_PATH"))
            echo "Found FFmpeg headers in: $FFMPEG_INCLUDE_DIR"
        else
            echo "ERROR: FFmpeg headers not found anywhere in the system!"
            echo "Please install FFmpeg development packages:"
            echo "  sudo apt-get install libavcodec-dev libavformat-dev libavutil-dev libavfilter-dev libavdevice-dev libswscale-dev libswresample-dev"
            exit 1
        fi
    fi
fi

# Only create symlinks if headers are not in standard location and pkg-config failed
if [ "$FFMPEG_INCLUDE_DIR" != "/usr/include" ] && [ -d "$FFMPEG_INCLUDE_DIR" ] && ! verify_pkgconfig; then
    echo "Creating symlinks from $FFMPEG_INCLUDE_DIR to /usr/include..."
    
    # List of essential FFmpeg libraries (reduced to avoid unnecessary symlinks)
    FFMPEG_LIBS=(
        "libavcodec"
        "libavformat" 
        "libavutil"
        "libswscale"
        "libavfilter"
        "libavdevice"
        "libswresample"
    )
    
    for lib in "${FFMPEG_LIBS[@]}"; do
        if [ -d "$FFMPEG_INCLUDE_DIR/$lib" ] && [ ! -d "/usr/include/$lib" ]; then
            # Create new symlink only if it doesn't exist
            sudo ln -sfn "$FFMPEG_INCLUDE_DIR/$lib" "/usr/include/$lib"
            echo "✓ Created symlink for $lib"
        elif [ -d "/usr/include/$lib" ]; then
            echo "✓ $lib already exists in /usr/include"
        else
            echo "⚠ Warning: $lib not found in $FFMPEG_INCLUDE_DIR"
        fi
    done
else
    echo "✅ FFmpeg headers accessible via pkg-config or already in /usr/include, no symlinks needed"
fi

# Final verification
echo ""
echo "Final verification..."

# Check if we can use pkg-config (preferred) or direct header access
if verify_pkgconfig; then
    echo "✅ pkg-config setup successful - ffmpeg-sys-next will use pkg-config"
    # Set environment to force pkg-config usage
    export FFMPEG_USE_PKG_CONFIG=1
    export FFMPEG_NO_MANUAL_HEADER_SEARCH=1
    
    # For GitHub Actions
    if [ -n "$GITHUB_ENV" ]; then
        echo "FFMPEG_USE_PKG_CONFIG=1" >> "$GITHUB_ENV"
        echo "FFMPEG_NO_MANUAL_HEADER_SEARCH=1" >> "$GITHUB_ENV"
    fi
else
    # Check key headers manually
    CRITICAL_HEADERS=(
        "/usr/include/libavcodec/avcodec.h"
        "/usr/include/libswscale/swscale.h"
        "/usr/include/libavutil/avutil.h"
    )
    
    MISSING_HEADERS=0
    for header in "${CRITICAL_HEADERS[@]}"; do
        if [ -f "$header" ]; then
            echo "✅ Found: $header"
        else
            echo "❌ Missing: $header"
            MISSING_HEADERS=$((MISSING_HEADERS + 1))
        fi
    done
    
    if [ $MISSING_HEADERS -gt 0 ]; then
        echo "❌ $MISSING_HEADERS critical headers missing - build may fail"
        echo "Consider reinstalling FFmpeg development packages"
    else
        echo "✅ All critical headers found"
    fi
    
    # Export manual path configuration
    if [ -n "$GITHUB_ENV" ]; then
        echo "FFMPEG_INCLUDE_DIR=$FFMPEG_INCLUDE_DIR" >> "$GITHUB_ENV" 
        echo "BINDGEN_EXTRA_CLANG_ARGS=-I$FFMPEG_INCLUDE_DIR" >> "$GITHUB_ENV"
    fi
fi

echo "✅ FFmpeg setup complete"