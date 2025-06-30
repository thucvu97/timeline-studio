#!/bin/bash
# Rust coverage generation for macOS - version 2
# This script works around the mutex error by using direct LLVM instrumentation

set -euo pipefail

echo "🔧 Setting up Rust coverage generation for macOS..."

# Set FFmpeg environment variables
export PKG_CONFIG_PATH="/opt/homebrew/opt/ffmpeg/lib/pkgconfig:/opt/homebrew/lib/pkgconfig"
export FFMPEG_DIR="/opt/homebrew/opt/ffmpeg"
export FFMPEG_INCLUDE_DIR="/opt/homebrew/opt/ffmpeg/include"
export FFMPEG_LIB_DIR="/opt/homebrew/opt/ffmpeg/lib"

# Find LLVM tools
LLVM_COV=$(find /opt/homebrew/Cellar/llvm/*/bin/llvm-cov 2>/dev/null | head -1)
LLVM_PROFDATA=$(find /opt/homebrew/Cellar/llvm/*/bin/llvm-profdata 2>/dev/null | head -1)

if [ -z "$LLVM_COV" ] || [ -z "$LLVM_PROFDATA" ]; then
    echo "❌ LLVM tools not found. Please install: brew install llvm"
    exit 1
fi

echo "✅ Found LLVM tools:"
echo "  LLVM_COV: $LLVM_COV"
echo "  LLVM_PROFDATA: $LLVM_PROFDATA"

# Save current directory and change to src-tauri
ORIGINAL_DIR=$(pwd)
cd src-tauri

# Clean previous coverage data
echo "🧹 Cleaning previous coverage data..."
rm -f *.profraw *.profdata coverage.info
# Also clean any profraw files that might have been created in parent directory
rm -f ../*.profraw ../*.profdata
cargo clean

# Build with coverage instrumentation
echo "🔨 Building with coverage instrumentation..."
RUSTFLAGS="-C instrument-coverage" cargo build --lib

# Run tests with coverage instrumentation
echo "🧪 Running tests with coverage..."
# Make sure profile files are created in current directory (src-tauri)
RUSTFLAGS="-C instrument-coverage" \
LLVM_PROFILE_FILE="$(pwd)/timeline-studio-%p-%m.profraw" \
cargo test --lib --no-fail-fast 2>&1 | tee test-output.log || {
    echo "⚠️ Tests completed with errors (likely mutex issue)"
}

# Wait a bit for profile data to be written
sleep 2

# Find all profraw files only in current directory (src-tauri)
echo "📊 Processing coverage data..."
PROFRAW_FILES=$(find . -maxdepth 1 -name "*.profraw" 2>/dev/null)

if [ -z "$PROFRAW_FILES" ]; then
    echo "❌ No profraw files found"
    exit 1
fi

echo "Found profraw files:"
echo "$PROFRAW_FILES"

# Merge profraw files
echo "🔀 Merging profile data..."
$LLVM_PROFDATA merge -sparse $PROFRAW_FILES -o timeline-studio.profdata || {
    echo "❌ Failed to merge profraw files"
    exit 1
}

# Find the test binary
echo "🔍 Finding test binary..."
TEST_BINARY=$(find target/debug/deps -name "timeline_studio-*" -type f -perm +111 | grep -v "\.d$" | grep -v "\.dSYM" | head -1)

if [ -z "$TEST_BINARY" ]; then
    echo "❌ Test binary not found"
    exit 1
fi

echo "Found test binary: $TEST_BINARY"

# Generate lcov report
echo "📈 Generating coverage report..."
$LLVM_COV export \
    --format=lcov \
    --instr-profile=timeline-studio.profdata \
    --ignore-filename-regex='/.cargo/|/rustc/' \
    "$TEST_BINARY" \
    > coverage.info || {
    echo "❌ Failed to generate coverage report"
    exit 1
}

# Check if coverage file was created
if [ -f "coverage.info" ] && [ -s "coverage.info" ]; then
    echo "✅ Coverage file generated successfully!"
    echo "📊 Coverage report: src-tauri/coverage.info"
    
    # Show coverage summary
    echo ""
    echo "📈 Coverage summary:"
    # Count lines
    TOTAL_LINES=$(grep -c "^DA:" coverage.info || echo "0")
    COVERED_LINES=$(grep "^DA:" coverage.info | grep -v ",0$" | wc -l || echo "0")
    
    if [ "$TOTAL_LINES" -gt 0 ]; then
        COVERAGE_PCT=$(( COVERED_LINES * 100 / TOTAL_LINES ))
        echo "  Total lines: $TOTAL_LINES"
        echo "  Covered lines: $COVERED_LINES"
        echo "  Coverage: $COVERAGE_PCT%"
    fi
    
    # Show first few files
    echo ""
    echo "📁 Files in coverage report:"
    grep "^SF:" coverage.info | head -10
    
    # Generate HTML report if genhtml is available
    if command -v genhtml >/dev/null 2>&1; then
        echo ""
        echo "📊 Generating HTML coverage report..."
        genhtml coverage.info --output-directory coverage-html --quiet
        echo "✅ HTML report generated: src-tauri/coverage-html/index.html"
    fi
else
    echo "❌ Coverage file is empty or not created"
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up temporary files..."
rm -f *.profraw timeline-studio.profdata

echo ""
echo "✅ Coverage generation completed successfully!"

# Final cleanup - make sure no profraw files in parent directory
cd "$ORIGINAL_DIR"
rm -f *.profraw *.profdata 2>/dev/null || true

echo ""
echo "📤 To upload coverage to Codecov, run:"
echo "   npm run test:coverage:upload"