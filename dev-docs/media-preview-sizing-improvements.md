# Media Preview Sizing Improvements

## Changes Made

### 1. Use Project Settings for Aspect Ratio
**Problem**: Preview sizes were hardcoded to 16:9 aspect ratio and passed through props, not respecting the project's aspect ratio settings.

**Solution**: 
- Added `useProjectSettings` hook to `MediaItem` component
- Calculate aspect ratio from project settings: `settings.aspectRatio.value.width / height`
- Pass project dimensions to `MediaPreview` component

### 2. Fixed List View Height
**Problem**: In list view mode, preview items were too tall initially.

**Solution**:
- Introduced `listPreviewSize` with fixed height of 60px for list mode
- Set container height to `listPreviewSize + 8px` (68px total)
- Updated `VirtualizedContentGroup` to use consistent height of 68px for list items

### 3. Proper Handling of ignoreRatio Flag
**Changes**:
- **List mode**: Uses project aspect ratio (`ignoreRatio={false}`)
- **Grid mode**: Uses project aspect ratio
- **Thumbnails mode**: Shows original proportions (`ignoreRatio={true}`)

### 4. Dynamic Sizing Based on Project Settings
All preview dimensions now adapt to the project's aspect ratio setting:
```typescript
// Get aspect ratio from project settings
const projectAspectRatio = useMemo(() => {
  const { width, height } = settings.aspectRatio.value
  return width / height
}, [settings.aspectRatio])

// Apply to grid width calculation
const gridStyles = useMemo(
  () => ({
    width: `${(previewSize * projectAspectRatio).toFixed(0)}px`,
  }),
  [previewSize, projectAspectRatio],
)
```

## Benefits

1. **Consistent Aspect Ratios**: Previews now match the project's aspect ratio setting
2. **Better List View**: Fixed height prevents overly tall items in list view
3. **Flexible Thumbnails**: Thumbnail mode respects original media proportions
4. **No Props Drilling**: Preview sizes are derived from project settings, not passed through props

## Usage

The system automatically adapts to the current project settings. Users can change the project aspect ratio in Project Settings, and all media previews will update accordingly:

- **16:9** - Standard widescreen
- **9:16** - Portrait (TikTok, Shorts)
- **1:1** - Square (Instagram)
- **4:3** - Traditional TV
- **21:9** - Cinematic
- **Custom** - User-defined ratio

## View Modes

1. **List View**:
   - Fixed height of 68px
   - Shows media with project aspect ratio
   - Optimized for scanning many files

2. **Grid View**:
   - Dynamic sizing based on preview size setting
   - Maintains project aspect ratio
   - Good for visual browsing

3. **Thumbnails View**:
   - Shows original media proportions (`ignoreRatio=true`)
   - Best for seeing actual media dimensions
   - Includes filename overlay