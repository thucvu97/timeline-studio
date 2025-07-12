import { resetCanvasMocks, setupCanvasMocks } from "./canvas"
import { resetDOMMocks, setupDOMMocks } from "./dom"
import { resetMediaMocks, setupAudioMocks, setupVideoMocks } from "./media"

// Browser API mocks
// export * from './dom';
// export * from './media';
// export * from './canvas';

export {
  canvasTestHelpers,
  mockCanvas,
  mockCanvasContext2D,
  mockWebGLContext,
  resetCanvasMocks,
  setupCanvasMocks,
} from "./canvas"
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
  setupCanvasMocks()
}

// Helper to reset all browser mocks
export function resetAllBrowserMocks() {
  resetDOMMocks()
  resetMediaMocks()
  resetCanvasMocks()
}

// Setup browser mocks automatically when imported
setupAllBrowserMocks()
