import { resetDOMMocks, setupDOMMocks } from "./dom"
import { resetMediaMocks, setupAudioMocks, setupVideoMocks } from "./media"

// Browser API mocks
// export * from './dom';
// export * from './media';

// Re-export commonly used functions
export {
  setupDOMMocks,
  setMediaQuery,
  simulateResize,
  triggerResizeObserver,
  triggerIntersectionObserver,
  resetDOMMocks,
} from "./dom"

export {
  MockHTMLVideoElement,
  MockHTMLAudioElement,
  setupVideoMocks,
  setupAudioMocks,
  createMockVideo,
  createMockAudio,
  resetMediaMocks,
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
