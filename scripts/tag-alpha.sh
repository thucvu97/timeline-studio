#!/bin/bash

# Script to create alpha release tag
# Usage: ./scripts/tag-alpha.sh [version]

set -e

# Get version from package.json or argument
if [ -z "$1" ]; then
    VERSION=$(node -p "require('./package.json').version")
else
    VERSION=$1
fi

TAG_NAME="v${VERSION}-alpha"

echo "🏷️  Creating alpha release tag: $TAG_NAME"
echo ""

# Check if we're on alpha branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ ! "$CURRENT_BRANCH" == alpha-release-* ]]; then
    echo "⚠️  Warning: Not on alpha-release branch!"
    echo "Current branch: $CURRENT_BRANCH"
    echo ""
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ "$response" != "y" ]]; then
        exit 1
    fi
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes"
    echo "Please commit or stash them first"
    exit 1
fi

# Create and push tag
echo "Creating tag $TAG_NAME..."
git tag -a "$TAG_NAME" -m "Alpha Release $VERSION

- Ollama integration for local AI
- Basic video analysis
- Scene detection
- Subtitle generation
- JSON export

See ALPHA_RELEASE.md for details"

echo ""
echo "✅ Tag created locally"
echo ""
echo "Push tag to GitHub? (y/n)"
read -r response

if [[ "$response" == "y" ]]; then
    git push origin "$TAG_NAME"
    echo "✅ Tag pushed to GitHub"
    echo ""
    echo "🎉 Alpha release tag created!"
    echo "GitHub Actions will now build the release"
    echo ""
    echo "Check progress at:"
    echo "https://github.com/chatman-media/timeline-studio/actions"
else
    echo ""
    echo "Tag created locally. Push later with:"
    echo "  git push origin $TAG_NAME"
fi