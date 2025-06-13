import { resetDialogMocks } from "./dialog"
import { resetEventMocks } from "./event"
import { mockFileSystem } from "./fs"
import { resetPathMocks } from "./path"
import { resetStoreMocks } from "./store"

// Import all Tauri mocks to ensure they're initialized
import "./core"

// Tauri API mocks
// export * from './core';
// export * from './dialog';
// export * from './fs';
// export * from './path';
// export * from './store';

// Re-export commonly used mocks for convenience
export { mockInvoke, mockConvertFileSrc, setupTauriCommand, createTauriMock } from "./core"
export { mockOpen, mockSave, dialogPresets, resetDialogMocks } from "./dialog"
export { mockListen, mockEmit, mockOnce, simulateEvent, setupEventListener, resetEventMocks } from "./event"
export { mockFs, MockFileSystem, mockFileSystem } from "./fs"
export { mockPath, pathPresets, resetPathMocks } from "./path"
export { mockStore, MockStore, storePresets, resetStoreMocks } from "./store"

// Helper to reset all Tauri mocks
export function resetAllTauriMocks() {
  resetDialogMocks()
  resetEventMocks()
  resetPathMocks()
  resetStoreMocks()
  mockFileSystem.reset()
}
