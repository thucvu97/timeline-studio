import { vi } from "vitest"

export const mockUseHotkeys = vi.fn()

vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: mockUseHotkeys,
}))

// Helper to simulate hotkey trigger
export function simulateHotkey(key: string) {
  const calls = mockUseHotkeys.mock.calls
  for (const call of calls) {
    const [hotkey, handler] = call
    if (hotkey === key || (Array.isArray(hotkey) && hotkey.includes(key))) {
      if (typeof handler === "function") {
        handler()
      }
    }
  }
}

// Helper to check if hotkey is registered
export function isHotkeyRegistered(key: string): boolean {
  const calls = mockUseHotkeys.mock.calls
  return calls.some((call) => {
    const [hotkey] = call
    return hotkey === key || (Array.isArray(hotkey) && hotkey.includes(key))
  })
}

// Reset hotkeys mock
export function resetHotkeysMocks() {
  mockUseHotkeys.mockReset()
}
