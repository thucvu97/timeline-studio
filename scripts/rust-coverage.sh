#!/bin/bash

# Script to run Rust tests with coverage locally

echo "🦀 Running Rust tests with coverage..."

# Navigate to src-tauri directory
cd src-tauri || exit 1

# Source cargo environment if it exists
if [ -f "$HOME/.cargo/env" ]; then
    source "$HOME/.cargo/env"
fi

# Check if cargo-llvm-cov is installed
if ! command -v cargo-llvm-cov &> /dev/null; then
    echo "📦 Installing cargo-llvm-cov..."
    cargo install cargo-llvm-cov --locked
fi

# Run tests with coverage
echo "🧪 Running tests..."
cargo llvm-cov --lcov --output-path coverage.info

if [ $? -eq 0 ]; then
    echo "✅ Coverage report generated at src-tauri/coverage.info"
else
    echo "❌ Failed to generate coverage report"
    exit 1
fi