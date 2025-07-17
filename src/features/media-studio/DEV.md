# Media Studio - Technical Documentation

[🇷🇺 Русская версия](./DEV.ru.md) | [🇺🇸 English version](./DEV.md)

## 📁 File Structure

### ✅ Complete Implemented Structure
```
src/features/media-studio/
├── components/
│   ├── layout/
│   │   ├── __tests__/
│   │   │   ├── chat-layout.test.tsx ✅
│   │   │   ├── default-layout.test.tsx ✅
│   │   │   ├── layout-previews.test.tsx ✅
│   │   │   ├── layouts-markup.test.tsx ✅
│   │   │   ├── options-layout.test.tsx ✅
│   │   │   └── vertical-layout.test.tsx ✅
│   │   ├── chat-layout.tsx ✅
│   │   ├── default-layout.tsx ✅
│   │   ├── options-layout.tsx ✅
│   │   ├── vertical-layout.tsx ✅
│   │   ├── layout-previews.tsx ✅
│   │   ├── layouts-markup.tsx ✅
│   │   └── index.ts ✅
│   ├── media-studio.test.tsx ✅
│   ├── media-studio.tsx ✅
│   └── index.ts ✅
├── hooks/
│   ├── __tests__/
│   │   ├── use-auto-load-user-data.test.ts ✅
│   │   ├── use-auto-load-user-data-hook.test.ts ✅
│   │   └── use-auto-load-user-data-validation.test.ts ✅
│   ├── use-auto-load-user-data.ts ✅
│   ├── use-auto-load-media.ts ✅
│   ├── use-auto-load-resources.ts ✅
│   └── index.ts ✅
├── services/
│   ├── __tests__/
│   │   └── providers.test.tsx ✅
│   ├── providers.tsx ✅
│   ├── tauri-mock-provider.tsx ✅
│   └── index.ts ✅
├── utils/
│   └── validation.ts ✅
└── index.ts ✅
```


## 🏗️ Component Architecture

### MediaStudio (Root Component)
**File**: `components/media-studio.tsx`
**Status**: ✅ Fully implemented

**Functionality**:
- Root application component
- Layout management (default, options, vertical, chat)
- TopBar and ModalContainer integration
- Automatic user data loading via useAutoLoadUserData

### Providers
**File**: `services/providers.tsx`
**Status**: ✅ Fully implemented

**Functionality**:
- Global context providers
- Application-wide wrapper

### TauriMockProvider
**File**: `services/tauri-mock-provider.tsx`
**Status**: ✅ Fully implemented

**Functionality**:
- Mock implementation for Tauri API
- Enables development without Tauri runtime

## 🪝 Hooks

### useAutoLoadUserData
**File**: `hooks/use-auto-load-user-data.ts`
**Status**: ✅ Fully implemented

**Functionality**:
- Automatic media file loading (videos, images)
- Music file loading
- Directory scanning for resources (effects, transitions, filters) - currently disabled
- File type validation
- Batch processing for improved performance
- Scan result caching
- Integration with state management hooks (useMediaFiles, useMusicFiles)

### useAutoLoadMedia
**File**: `hooks/use-auto-load-media.ts`
**Status**: ✅ Fully implemented

**Functionality**:
- Dedicated media file loading logic
- Integration with media file state

### useAutoLoadResources
**File**: `hooks/use-auto-load-resources.ts`
**Status**: ✅ Fully implemented

**Functionality**:
- Resource loading (effects, filters, transitions)
- Template loading

## 📦 Layouts

### DefaultLayout
**File**: `components/layout/default-layout.tsx`
**Status**: ✅ Fully implemented

### VerticalLayout
**File**: `components/layout/vertical-layout.tsx`
**Status**: ✅ Fully implemented

### OptionsLayout
**File**: `components/layout/options-layout.tsx`
**Status**: ✅ Fully implemented

### ChatLayout
**File**: `components/layout/chat-layout.tsx`
**Status**: ✅ Fully implemented

## 🔗 Component Integration

### Core Components
- TopBar
- Browser
- Timeline
- VideoPlayer
- Options
- ModalContainer

### Layout System
```typescript
{layoutMode === "default" && <DefaultLayout />}
{layoutMode === "options" && <OptionsLayout />}
{layoutMode === "vertical" && <VerticalLayout />}
{layoutMode === "chat" && <ChatLayout />}
```

## 📋 Recent Changes

### Structure Refactoring (2025)
- Moved layout components to `components/layout/`
- Created `hooks/` directory and moved `use-auto-load-user-data` from `services/`
- Added new `ChatLayout` for AI assistant integration
- Improved test structure with separation by type (components, hooks, services)
- Added utility functions in `utils/validation.ts`

### useAutoLoadUserData Improvements
- Support for media and music file loading
- Integration with state management hooks
- Directory scanning for various resource types (currently disabled)
- Caching and batch processing mechanism
- Separated into multiple specialized hooks

### Test Coverage
- Complete coverage of all layout components
- Tests for useAutoLoadUserData hook and related functionality
- Test reorganization: all tests moved to co-located `__tests__/` directories
- `media-studio.test.tsx` placed in `components/` directory
- Layout tests in `components/layout/__tests__/` directory
- Hook tests in `hooks/__tests__/` directory
- Service tests in `services/__tests__/` directory
- Fixed mock dependencies and context providers
- Additional validation tests
