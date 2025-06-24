#!/bin/bash

# Minimal memory build script for Timeline Studio

echo "Starting minimal memory build..."

# Set strict memory limits
export NODE_OPTIONS="--max-old-space-size=512 --optimize-for-size --gc-interval=100"

# Clean previous builds
rm -rf .next dist

# Build with minimal memory usage
echo "Building Next.js app with memory constraints..."
next build --no-lint

echo "Build complete!"