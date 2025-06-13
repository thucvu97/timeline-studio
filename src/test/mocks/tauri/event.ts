import { vi } from "vitest"

// Mock window.__TAURI_INTERNALS__ before importing anything
if (typeof window !== "undefined") {
  ;(window as any).__TAURI_INTERNALS__ = {
    transformCallback: vi.fn((callback, once) => {
      const id = Math.random().toString(36).slice(2)
      return { callback, once, id }
    }),
    invoke: vi.fn(() => Promise.resolve()),
  }
}

export const mockListen = vi.fn(() => Promise.resolve(() => {}))
export const mockEmit = vi.fn(() => Promise.resolve())
export const mockOnce = vi.fn(() => Promise.resolve(() => {}))

vi.mock("@tauri-apps/api/event", () => ({
  listen: mockListen,
  emit: mockEmit,
  once: mockOnce,
  TauriEvent: {
    WINDOW_RESIZED: "tauri://resize",
    WINDOW_MOVED: "tauri://move",
    WINDOW_CLOSE_REQUESTED: "tauri://close-requested",
    WINDOW_CREATED: "tauri://window-created",
    WINDOW_DESTROYED: "tauri://destroyed",
    WINDOW_FOCUS: "tauri://focus",
    WINDOW_BLUR: "tauri://blur",
    WINDOW_SCALE_FACTOR_CHANGED: "tauri://scale-change",
    WINDOW_THEME_CHANGED: "tauri://theme-changed",
    WINDOW_FILE_DROP: "tauri://file-drop",
    WINDOW_FILE_DROP_HOVER: "tauri://file-drop-hover",
    WINDOW_FILE_DROP_CANCELLED: "tauri://file-drop-cancelled",
    MENU: "tauri://menu",
    CHECK_UPDATE: "tauri://update",
    UPDATE_AVAILABLE: "tauri://update-available",
    INSTALL_UPDATE: "tauri://update-install",
    STATUS_UPDATE: "tauri://update-status",
    DOWNLOAD_PROGRESS: "tauri://update-download-progress",
  },
}))

// Helper for simulating events
export function simulateEvent(event: string, payload: any) {
  const listeners = (mockListen as any).mock.calls.filter((call: any) => call[0] === event)
  listeners.forEach((call: any) => {
    const callback = call[1]
    if (callback) {
      callback({ event, payload })
    }
  })
}

// Helper for setting up event listeners
export function setupEventListener(event: string, handler: (payload: any) => void) {
  mockListen.mockImplementation(() => {
    return Promise.resolve(() => {})
  })
}

export function resetEventMocks() {
  mockListen.mockReset()
  mockEmit.mockReset()
  mockOnce.mockReset()
}
