import { resetAllBrowserMocks, setupAllBrowserMocks } from "./browser"
import { resetAllLibraryMocks } from "./libraries"
import { resetAllTauriMocks } from "./tauri"
import "./dnd-kit" // Import dnd-kit mocks

// Main mocks exports
// export * from './tauri';
// export * from './browser';
// export * from './libraries';

export {
  resetAllBrowserMocks,
  setupAllBrowserMocks,
} from "./browser"
export { resetAllLibraryMocks } from "./libraries"
// Re-export commonly used mocks for convenience
export {
  createTauriMock,
  resetAllTauriMocks,
  setupTauriCommand,
} from "./tauri"

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
