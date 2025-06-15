# Preview System Cleanup

## Summary of Changes

### Removed Unused Code
1. **Deleted Files:**
   - `src/media/preview_manager.rs` - Unused preview manager implementation
   - `src/media/preview_data.rs` - Unused preview data structures 
   - `src/media/commands.rs` - Unused preview-related commands

2. **Updated Imports:**
   - Moved recognition-specific types from `preview_data.rs` to `src/recognition/types.rs`
   - Updated all imports in recognition module to use the new location

### Current Architecture

The preview system now has a clear single source of truth:

1. **Video Compiler Preview (`src/video_compiler/preview.rs`)**
   - Primary preview generation system
   - Used by frontend via commands like `generate_preview`, `generate_preview_batch`
   - Handles timeline previews and frame extraction
   - Integrated with caching system

2. **Simple Thumbnail Generator (`src/media/thumbnail.rs`)**
   - Basic thumbnail generation for media files
   - Currently unused but kept for potential future use

3. **Frame Extraction Service**
   - Part of video_compiler module
   - Handles extraction of frames for timeline preview strips
   - Used by frontend components

### Benefits of Cleanup

1. **Reduced Complexity:** Removed ~500 lines of unused code
2. **Clear Architecture:** Single preview system instead of duplicate implementations
3. **No More Warnings:** Eliminated all "function is never used" warnings for preview code
4. **Maintainability:** Easier to understand and modify the preview system

### Frontend Integration

Frontend components continue to work unchanged:
- `VideoPreview` component uses video element with poster
- `TimelinePreviewStrip` uses frame extraction service
- Preview generation commands from video_compiler module

### Future Considerations

If a unified preview manager is needed in the future:
1. Build on top of existing video_compiler preview system
2. Don't create duplicate implementations
3. Ensure proper integration with all consumers before adding new systems