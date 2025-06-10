# Media Import Performance Optimizations

## Issues Identified

When loading folders with many videos, the application experienced significant lag due to:

1. **Excessive re-renders** - Each metadata update triggered a separate state update
2. **Synchronous processing** - Backend calls were made sequentially 
3. **No batching** - UI updates happened for every single file
4. **Heavy FFprobe calls** - Each file triggered a separate FFprobe process

## Optimizations Implemented

### 1. Batch Updates with Debouncing

Instead of updating state for each file, we now batch updates:

```typescript
// Batch pending updates
const pendingUpdates: MediaFile[] = []
let updateTimer: NodeJS.Timeout | null = null

// Queue update instead of immediate state change
const queueUpdate = (file: MediaFile) => {
  pendingUpdates.push(file)
  
  // Dynamic delay based on batch size
  const delay = pendingUpdates.length > 10 ? 100 : 50
  updateTimer = setTimeout(() => {
    requestAnimationFrame(batchUpdate)
  }, delay)
}
```

### 2. Increased Concurrent Processing

- Increased `MAX_CONCURRENT_REQUESTS` from 3 to 5
- Reduced `REQUEST_DELAY` from 50ms to 20ms
- This allows faster parallel processing of metadata

### 3. Progressive Loading for Large Folders

For folders with >100 files:
- First 50 files are processed immediately
- Remaining files are processed after a 100ms delay
- This ensures UI remains responsive

```typescript
if (mediaFiles.length > 100) {
  const firstBatch = mediaFiles.slice(0, 50)
  const remainingFiles = mediaFiles.slice(50)
  
  // Process first batch immediately
  const firstBatchProcessed = await processFiles(firstBatch)
  
  // Process remaining with delay
  setTimeout(async () => {
    const remainingProcessed = await processFiles(remainingFiles)
    await saveFilesToProject([...firstBatchProcessed, ...remainingProcessed])
  }, 100)
}
```

### 4. Existing Optimizations Maintained

- **Virtualization** - Only visible items are rendered
- **Memoization** - Components avoid unnecessary re-renders
- **Streaming video** - Videos aren't loaded into memory
- **Metadata preload** - Only metadata is loaded, not full video

## Performance Improvements

1. **Initial load time**: Faster for large folders due to progressive loading
2. **UI responsiveness**: Remains interactive during metadata loading
3. **Memory usage**: Reduced due to batching
4. **CPU usage**: More efficient with parallel processing

## Testing Recommendations

1. Test with folders containing 500+ videos
2. Monitor CPU usage during import
3. Check UI responsiveness while loading
4. Verify all files eventually load with metadata

## Future Improvements

1. **Metadata caching** - Cache FFprobe results for files
2. **Worker threads** - Move metadata processing to web workers
3. **Rust-side batching** - Batch FFprobe calls on backend
4. **Partial loading** - Only load metadata for visible items