# Test Fixtures

This directory should contain test media files for E2E tests:

## Required Files

### Videos
- `test-video.mp4` - Basic test video (16:9 aspect ratio)
- `test-video-0.mp4` to `test-video-4.mp4` - Multiple test videos for batch operations
- `video-16-9.mp4` - Video with 16:9 aspect ratio
- `video-4-3.mp4` - Video with 4:3 aspect ratio
- `video-vertical.mp4` - Vertical video (9:16 aspect ratio)
- `corrupted-file.mp4` - Corrupted video file for error testing

### Images
- `test-image.jpg` - Basic test image
- `image-square.jpg` - Square image (1:1 aspect ratio)

### Audio
- `test-audio.mp3` - Basic test audio file

### Folder Structure
- `media-folder/` - Directory with mixed media files
  - `video1.mp4`
  - `video2.mp4`
  - `image1.jpg`
  - `audio1.mp3`

## Generating Test Files

You can generate test files using FFmpeg:

```bash
# Generate a test video (5 seconds, 16:9)
ffmpeg -f lavfi -i testsrc=duration=5:size=1920x1080:rate=30 -pix_fmt yuv420p test-video.mp4

# Generate a test audio (5 seconds)
ffmpeg -f lavfi -i sine=frequency=1000:duration=5 -c:a mp3 test-audio.mp3

# Generate a test image
ffmpeg -f lavfi -i testsrc=size=1920x1080:rate=1 -frames:v 1 test-image.jpg

# Generate corrupted file
echo "corrupted data" > corrupted-file.mp4
```