# Media Studio Module

[🇷🇺 Русская версия](./README.ru.md) | [🇺🇸 English version](./README.md)

## 📋 Overview

Media Studio is the main module of the Timeline Studio application that combines all editor components into a unified interface. The module provides the root application component, layout system, and state providers.

## 🏗️ Architecture

### Module Structure

```
src/features/media-studio/
├── components/
│   ├── media-studio.tsx          # Root component
│   └── layout/
│       ├── default-layout.tsx    # Default layout
│       ├── vertical-layout.tsx   # Vertical layout
│       ├── options-layout.tsx    # Layout with options panel
│       ├── chat-layout.tsx       # Layout with AI chat
│       ├── layout-previews.tsx   # Layout selection component
│       └── layouts-markup.tsx    # Visual layout previews
├── hooks/
│   └── use-auto-load-user-data.ts # Auto-load user data
├── services/
│   └── providers.tsx             # Global providers
└── __tests__/                    # Component tests
```

## 🎯 Core Features

### MediaStudio Component

The root application component that:
- Initializes all providers via `Providers`
- Renders the selected layout based on user settings
- Manages automatic user data loading
- Displays loading state

### Layout System

#### DefaultLayout
- Classic layout with browser on the left, video in the center, timeline at the bottom
- Adaptive to panel visibility through `useUserSettings`

#### VerticalLayout
- Vertical arrangement with video on the right
- Optimized for working with vertical content

#### OptionsLayout
- Includes options panel on the right
- Adaptive show/hide for options panel

#### ChatLayout
- Integrates AI chat on the right
- Supports all panel visibility combinations

### Hooks

#### useAutoLoadUserData
- Automatic loading of media files on startup
- Project directory scanning (currently disabled, may be re-enabled later)
- Validation and addition of resources (effects, filters, transitions)
- Support for non-Tauri environments (web version)

### Providers

The `Providers` component combines all necessary context providers:
- `AppStateProvider` - global application state
- `UserSettingsProvider` - user preferences
- `ModalProvider` - modal dialog management
- `CommandProvider` - hotkey handling
- Other feature providers

## 🔌 Integration

### Used Modules
- `@/features/top-bar` - top control panel
- `@/features/browser` - media file browser
- `@/features/timeline` - timeline
- `@/features/video-player` - video player
- `@/features/ai-chat` - AI assistant
- `@/features/options` - options panel
- `@/features/user-settings` - user settings
- `@/features/modals` - modal windows

### API

```typescript
// Main component
export function MediaStudio(): JSX.Element

// Providers
export function Providers({ children }: PropsWithChildren): JSX.Element

// Hooks
export function useAutoLoadUserData(): {
  isLoading: boolean
  error: Error | null
  data: UserData | null
}
```

## 🧪 Testing

The module has complete test coverage:
- **65 tests** in 9 files
- Tests for components, layouts, hooks, and services
- Mocks for all external dependencies
- Integration tests for providers

## 📝 Usage Examples

```tsx
// In the application root
import { MediaStudio } from '@/features/media-studio'

function App() {
  return <MediaStudio />
}
```

## 🚀 Future Improvements

- [ ] Custom user layouts
- [ ] Save and restore layout states
- [ ] Layout switching animations
- [ ] Dynamic component loading for optimization
- [ ] Plugin architecture for extensions