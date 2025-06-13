#!/bin/bash

# Script to generate test media files for E2E tests
# Requires ffmpeg to be installed

echo "Generating test media files..."

# Create directories
mkdir -p media-folder

# Generate basic test video (5 seconds, 16:9)
ffmpeg -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -pix_fmt yuv420p -y test-video.mp4

# Generate multiple test videos for batch operations
for i in {0..4}; do
  ffmpeg -f lavfi -i testsrc=duration=3:size=1920x1080:rate=30 -pix_fmt yuv420p -y test-video-$i.mp4
done

# Generate videos with different aspect ratios
ffmpeg -f lavfi -i testsrc=duration=3:size=1920x1080:rate=30 -pix_fmt yuv420p -y video-16-9.mp4
ffmpeg -f lavfi -i testsrc=duration=3:size=640x480:rate=30 -pix_fmt yuv420p -y video-4-3.mp4
ffmpeg -f lavfi -i testsrc=duration=3:size=1080x1920:rate=30 -pix_fmt yuv420p -y video-vertical.mp4

# Generate test audio (5 seconds)
ffmpeg -f lavfi -i sine=frequency=1000:duration=5 -c:a mp3 -y test-audio.mp3

# Generate multiple test audio files
for i in {0..2}; do
  ffmpeg -f lavfi -i sine=frequency=$((440 + i * 100)):duration=3 -c:a mp3 -y test-audio-$i.mp3
done

# Generate test images
ffmpeg -f lavfi -i testsrc=size=1920x1080:rate=1 -frames:v 1 -y test-image.jpg
ffmpeg -f lavfi -i testsrc=size=1080x1080:rate=1 -frames:v 1 -y image-square.jpg

# Generate corrupted file
echo "corrupted data" > corrupted-file.mp4
echo "corrupted data" > corrupted.mp4

# Generate files for media-folder
ffmpeg -f lavfi -i testsrc=duration=3:size=1920x1080:rate=30 -pix_fmt yuv420p -y media-folder/video1.mp4
ffmpeg -f lavfi -i testsrc=duration=3:size=1920x1080:rate=30 -pix_fmt yuv420p -y media-folder/video2.mp4
ffmpeg -f lavfi -i testsrc=size=1920x1080:rate=1 -frames:v 1 -y media-folder/image1.jpg
ffmpeg -f lavfi -i sine=frequency=880:duration=3 -c:a mp3 -y media-folder/audio1.mp3

echo "Test files generated successfully!"
echo "Total files created:"
ls -la *.mp4 *.mp3 *.jpg 2>/dev/null | wc -l
echo "Files in media-folder:"
ls -la media-folder/ | wc -l