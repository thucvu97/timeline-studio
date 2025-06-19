#!/bin/bash

# Script to upload coverage reports to Codecov locally

echo "📊 Uploading coverage reports to Codecov..."

# Check if CODECOV_TOKEN is set
if [ -z "$CODECOV_TOKEN" ]; then
    echo "❌ Error: CODECOV_TOKEN environment variable is not set"
    echo "Please set it with: export CODECOV_TOKEN=your_token_here"
    exit 1
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if coverage files exist
if [ ! -f "coverage/lcov.info" ]; then
    echo -e "${YELLOW}⚠️  Frontend coverage file not found${NC}"
    echo "Run 'bun run test:coverage' to generate it"
else
    echo -e "${GREEN}✅ Frontend coverage file found${NC}"
fi

if [ ! -f "src-tauri/coverage.info" ]; then
    echo -e "${YELLOW}⚠️  Backend coverage file not found${NC}"
    echo "Run 'bun run test:coverage:rust' to generate it"
else
    echo -e "${GREEN}✅ Backend coverage file found${NC}"
fi

# Install codecov uploader if not already installed
if ! command -v codecov &> /dev/null; then
    echo "📥 Installing Codecov CLI..."
    # Download the latest Codecov uploader
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        curl -Os https://uploader.codecov.io/latest/macos/codecov
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        curl -Os https://uploader.codecov.io/latest/linux/codecov
    else
        echo "❌ Unsupported OS: $OSTYPE"
        exit 1
    fi
    
    chmod +x codecov
    echo -e "${GREEN}✅ Codecov CLI installed${NC}"
fi

# Upload frontend coverage
if [ -f "coverage/lcov.info" ]; then
    echo ""
    echo "📤 Uploading frontend coverage..."
    ./codecov \
        --token="$CODECOV_TOKEN" \
        --file="coverage/lcov.info" \
        --flags="frontend" \
        --name="frontend-coverage-local" \
        --slug="chatman-media/timeline-studio" \
        --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Frontend coverage uploaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to upload frontend coverage${NC}"
    fi
fi

# Upload backend coverage
if [ -f "src-tauri/coverage.info" ]; then
    echo ""
    echo "📤 Uploading backend coverage..."
    ./codecov \
        --token="$CODECOV_TOKEN" \
        --file="src-tauri/coverage.info" \
        --flags="backend" \
        --name="backend-coverage-local" \
        --slug="chatman-media/timeline-studio" \
        --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backend coverage uploaded successfully${NC}"
    else
        echo -e "${RED}❌ Failed to upload backend coverage${NC}"
    fi
fi

echo ""
echo "🔗 View your coverage at: https://codecov.io/gh/chatman-media/timeline-studio"
echo ""
echo "📝 Note: It may take a few minutes for the coverage to appear on Codecov"