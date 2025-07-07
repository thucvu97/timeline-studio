#!/bin/bash
# Script to clean up test binaries before Tauri build
# This prevents issues in CI/CD where test binaries might be bundled

set -e

echo "🧹 Cleaning up test binaries before build..."

# List of test binaries to remove
TEST_BINARIES=(
  "test_specta"
  "test_specta.exe"
)

# Target directories to check
TARGET_DIRS=(
  "src-tauri/target/debug"
  "src-tauri/target/release"
  "src-tauri/target/universal-apple-darwin/debug"
  "src-tauri/target/universal-apple-darwin/release"
  "src-tauri/target/x86_64-apple-darwin/debug"
  "src-tauri/target/x86_64-apple-darwin/release"
  "src-tauri/target/aarch64-apple-darwin/debug"
  "src-tauri/target/aarch64-apple-darwin/release"
)

CLEANED_COUNT=0

for target_dir in "${TARGET_DIRS[@]}"; do
  if [[ -d "$target_dir" ]]; then
    echo "📁 Checking $target_dir..."
    for binary in "${TEST_BINARIES[@]}"; do
      binary_path="$target_dir/$binary"
      if [[ -f "$binary_path" ]]; then
        echo "🗑️  Removing test binary: $binary_path"
        rm -f "$binary_path"
        CLEANED_COUNT=$((CLEANED_COUNT + 1))
      fi
    done
  fi
done

if [[ $CLEANED_COUNT -eq 0 ]]; then
  echo "✅ No test binaries found to clean"
else
  echo "✅ Cleaned up $CLEANED_COUNT test binaries"
fi

echo "🎯 Test binary cleanup completed"