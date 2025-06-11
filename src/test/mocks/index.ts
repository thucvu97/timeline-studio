import { resetAllBrowserMocks, setupAllBrowserMocks } from "./browser"
import { resetAllLibraryMocks } from "./libraries"
import { resetAllTauriMocks } from "./tauri"

// Main mocks exports
// export * from './tauri';
// export * from './browser';
// export * from './libraries';

// Re-export commonly used mocks for convenience
export {
  setupTauriCommand,
  createTauriMock,
  resetAllTauriMocks,
} from "./tauri"

export {
  setupAllBrowserMocks,
  resetAllBrowserMocks,
} from "./browser"

export { resetAllLibraryMocks } from "./libraries"

// Master reset function for all mocks
export function resetAllMocks() {
  resetAllTauriMocks()
  resetAllBrowserMocks()
  resetAllLibraryMocks()
}

// Setup function for essential mocks
export function setupEssentialMocks() {
  setupAllBrowserMocks()
  // Tauri mocks are setup automatically via vi.mock()
  // Library mocks are setup automatically via vi.mock()
}
