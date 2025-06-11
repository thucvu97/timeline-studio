import { vi } from "vitest"

export const mockOpen = vi.fn()
export const mockSave = vi.fn()
export const mockMessage = vi.fn()
export const mockAsk = vi.fn()
export const mockConfirm = vi.fn()

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: mockOpen,
  save: mockSave,
  message: mockMessage,
  ask: mockAsk,
  confirm: mockConfirm,
}))

// Preset responses for common scenarios
export const dialogPresets = {
  selectFile: (path = "/path/to/file.mp4") => mockOpen.mockResolvedValue(path),

  selectMultipleFiles: (paths: string[] = ["/path/to/file1.mp4", "/path/to/file2.mp4"]) =>
    mockOpen.mockResolvedValue(paths),

  selectDirectory: (path = "/path/to/directory") => mockOpen.mockResolvedValue(path),

  cancel: () => mockOpen.mockResolvedValue(null),

  saveFile: (path = "/path/to/save.json") => mockSave.mockResolvedValue(path),

  confirmYes: () => mockConfirm.mockResolvedValue(true),

  confirmNo: () => mockConfirm.mockResolvedValue(false),

  askResponse: (response: string) => mockAsk.mockResolvedValue(response),
}

// Helper to reset all dialog mocks
export function resetDialogMocks() {
  mockOpen.mockReset()
  mockSave.mockReset()
  mockMessage.mockReset()
  mockAsk.mockReset()
  mockConfirm.mockReset()
}
