# Timeline Studio Mobile App on Tauri

## Overview
Adapting the existing Tauri Timeline Studio application for iOS and Android mobile platforms. Tauri v2 already supports mobile platforms, making the process relatively simple.

## Goals
- Adapt existing Tauri application for iOS and Android
- Minimal code changes - mainly CSS adaptation
- Reuse 95% of existing code
- Retain all desktop version features

## Technical Stack (already in place!)

### What already works
- **Frontend**: Next.js + React - fully reusable
- **Backend**: Rust via Tauri - works on mobile
- **FFmpeg**: Need mobile builds (Tauri will help)
- **UI**: shadcn/ui + Tailwind CSS - needs style adaptation

### What needs to be added
- **iOS**: Configure Tauri iOS target
- **Android**: Configure Tauri Android target
- **Styles**: Responsive CSS for mobile screens
- **Gestures**: Touch events instead of mouse

## Simple Steps for Mobile Version

### 1. Setting up Tauri for mobile platforms
```bash
# Add mobile targets
cargo tauri ios init
cargo tauri android init

# Check dependencies
cargo tauri ios dev       # Run on iOS
cargo tauri android dev   # Run on Android
```

### 2. What will work out of the box
- ✅ All React components
- ✅ XState state machines
- ✅ Rust backend functions
- ✅ Tauri commands and IPC
- ✅ Most UI components

### 3. Minimal CSS changes

```css
/* Adapting existing components */
@media (max-width: 768px) {
  /* Timeline - horizontal scroll */
  .timeline-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  /* Sidebars - hide or make modal */
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
  }
  
  /* Buttons - increase for touch */
  .btn {
    min-height: 44px; /* iOS guideline */
    min-width: 44px;
  }
}
```

### 4. Touch events (minimal changes)
```typescript
// Add to existing components
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// Use existing handlers
onMouseDown={!isMobile ? handleMouseDown : undefined}
onTouchStart={isMobile ? handleTouchStart : undefined}
```

## What needs to be adapted

### 1. FFmpeg for mobile platforms
```toml
# Cargo.toml - add conditional compilation
[target.'cfg(target_os = "ios")'.dependencies]
ffmpeg-next = { version = "6.0", features = ["build"] }

[target.'cfg(target_os = "android")'.dependencies]
ffmpeg-next = { version = "6.0", features = ["build"] }
```

### 2. File system
```rust
// Use Tauri API for mobile paths
#[cfg(mobile)]
let documents_dir = app.path_resolver().app_documents_dir()?;

#[cfg(not(mobile))]
let documents_dir = app.path_resolver().app_data_dir()?;
```

### 3. Permissions
```xml
<!-- iOS Info.plist -->
<key>NSPhotoLibraryUsageDescription</key>
<string>To import videos from gallery</string>
<key>NSCameraUsageDescription</key>
<string>To record video</string>

<!-- Android AndroidManifest.xml -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Simple Development Plan

### Week 1-2: Basic setup
```bash
# 1. Update Tauri to v2
cargo install tauri-cli --version "^2.0.0"

# 2. Initialize mobile projects
cargo tauri ios init
cargo tauri android init

# 3. Install dependencies
# iOS: Xcode
# Android: Android Studio
```

### Week 3-4: UI adaptation
- [ ] Add media queries to globals.css
- [ ] Adapt Timeline for touch
- [ ] Make modals fullscreen on mobile
- [ ] Increase button sizes for touch

### Week 5-6: Testing and optimization
- [ ] Test on real devices
- [ ] Optimize performance
- [ ] Fix platform-specific bugs

### Week 7-8: Release preparation
- [ ] Set up CI/CD for mobile builds
- [ ] Prepare assets (icons, splash screens)
- [ ] Create store listings

## Code Adaptation Examples

### Responsive Timeline
```tsx
// src/features/timeline/components/timeline.tsx
const Timeline = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className={cn(
      "timeline-container",
      isMobile && "timeline-mobile"
    )}>
      {/* Existing timeline code */}
    </div>
  );
};
```

### Mobile Navigation
```tsx
// src/components/layout/mobile-nav.tsx
const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        {/* Navigation */}
      </SheetContent>
    </Sheet>
  );
};
```

## GitHub Actions for Mobile Builds

```yaml
# .github/workflows/mobile-build.yml
name: Mobile Build

on:
  push:
    branches: [main]

jobs:
  ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: |
          rustup target add aarch64-apple-ios
          cargo install tauri-cli
      - name: Build iOS
        run: cargo tauri ios build

  android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup
        run: |
          rustup target add aarch64-linux-android
          cargo install tauri-cli
      - name: Build Android
        run: cargo tauri android build
```

## Advantages of Tauri Approach

1. **One code for all platforms** - 95% reuse
2. **Native performance** - Rust backend
3. **Small size** - ~30-50MB instead of 150MB+
4. **Security** - Tauri process isolation
5. **Simple maintenance** - one codebase

## Realistic Time Estimate

- **2 weeks**: Basic working version
- **1 month**: Optimized UI/UX
- **2 months**: Production-ready with stores

This is realistically achievable by a single developer thanks to Tauri v2!