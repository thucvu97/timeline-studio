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
    
    # Also remove any cache files that reference test_specta
    if find "$target_dir" -name "*test_specta*" -type f 2>/dev/null | grep -q .; then
      echo "🧹 Removing test_specta cache files from $target_dir..."
      find "$target_dir" -name "*test_specta*" -type f -exec rm -f {} \; 2>/dev/null || true
      CLEANED_COUNT=$((CLEANED_COUNT + 1))
    fi
  fi
done

# Also clean up any potential Cargo.lock references (regenerate if needed)
if [[ -f "src-tauri/Cargo.lock" ]] && grep -q "test_specta" "src-tauri/Cargo.lock" 2>/dev/null; then
  echo "🔒 Found test_specta references in Cargo.lock, will clean and regenerate..."
  cd src-tauri
  cargo generate-lockfile
  cd ..
  CLEANED_COUNT=$((CLEANED_COUNT + 1))
fi

# Clean any potential .d dependency files
echo "🧹 Cleaning dependency files..."
find src-tauri/target -name "*.d" -exec grep -l "test_specta" {} \; 2>/dev/null | xargs rm -f 2>/dev/null || true

# Ensure test_specta.rs is disabled (rename it if it exists)
if [[ -f "src-tauri/src/bin/test_specta.rs" ]]; then
  echo "🔒 Disabling test_specta.rs source file..."
  mv "src-tauri/src/bin/test_specta.rs" "src-tauri/src/bin/test_specta.rs.disabled"
  CLEANED_COUNT=$((CLEANED_COUNT + 1))
fi

if [[ $CLEANED_COUNT -eq 0 ]]; then
  echo "✅ No test binaries found to clean"
else
  echo "✅ Cleaned up $CLEANED_COUNT test-related items"
fi

echo "🎯 Test binary cleanup completed"