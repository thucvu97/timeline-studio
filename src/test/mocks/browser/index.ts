import { resetDOMMocks, setupDOMMocks } from "./dom"
import { resetMediaMocks, setupAudioMocks, setupVideoMocks } from "./media"

// Browser API mocks
// export * from './dom';
// export * from './media';

// Re-export commonly used functions
export {
  resetDOMMocks,
  setMediaQuery,
  setupDOMMocks,
  simulateResize,
  triggerIntersectionObserver,
  triggerResizeObserver,
} from "./dom"

export {
  createMockAudio,
  createMockVideo,
  MockHTMLAudioElement,
  MockHTMLVideoElement,
  resetMediaMocks,
  setupAudioMocks,
  setupVideoMocks,
} from "./media"

// Helper to setup all browser mocks
export function setupAllBrowserMocks() {
  setupDOMMocks()
  setupVideoMocks()
  setupAudioMocks()
}

// Helper to reset all browser mocks
export function resetAllBrowserMocks() {
  resetDOMMocks()
  resetMediaMocks()
}

// Setup browser mocks automatically when imported
setupAllBrowserMocks()
