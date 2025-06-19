import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalContainer } from "../../components/modal-container"
import { ModalType } from "../../services/modal-machine"

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}))

// Mock UI components
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    <div data-testid="dialog" data-open={open}>
      {open && children}
      <button onClick={() => onOpenChange(false)} data-testid="close-dialog">
        Close
      </button>
    </div>
  ),
  DialogContent: ({ children, className }: any) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children, className }: any) => (
    <div data-testid="dialog-header" className={className}>
      {children}
    </div>
  ),
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}))

// Mock modal components
vi.mock("@/features/camera-capture", () => ({
  CameraCaptureModal: () => <div data-testid="camera-capture-modal">Camera Capture Modal</div>,
}))

vi.mock("@/features/export", () => ({
  ExportModal: () => <div data-testid="export-modal">Export Modal</div>,
}))

vi.mock("@/features/keyboard-shortcuts", () => ({
  KeyboardShortcutsModal: () => <div data-testid="keyboard-shortcuts-modal">Keyboard Shortcuts Modal</div>,
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsModal: () => <div data-testid="project-settings-modal">Project Settings Modal</div>,
}))

vi.mock("@/features/user-settings", () => ({
  UserSettingsModal: () => <div data-testid="user-settings-modal">User Settings Modal</div>,
}))

vi.mock("@/features/voice-recording", () => ({
  VoiceRecordModal: () => <div data-testid="voice-recording-modal">Voice Recording Modal</div>,
}))

// Mock useModal hook
const mockUseModal = {
  modalType: "none" as ModalType,
  modalData: null,
  isOpen: false,
  closeModal: vi.fn(),
}

vi.mock("../../services", () => ({
  useModal: () => mockUseModal,
}))

describe("ModalContainer", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock to default state
    mockUseModal.modalType = "none"
    mockUseModal.modalData = null
    mockUseModal.isOpen = false
  })

  it("should not render dialog when modal is closed", () => {
    render(<ModalContainer />)

    const dialog = screen.getByTestId("dialog")
    expect(dialog).toHaveAttribute("data-open", "false")
  })

  it("should render dialog when modal is open", () => {
    mockUseModal.isOpen = true
    mockUseModal.modalType = "project-settings"

    render(<ModalContainer />)

    const dialog = screen.getByTestId("dialog")
    expect(dialog).toHaveAttribute("data-open", "true")
  })

  describe("Modal Types", () => {
    it("should render project settings modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "project-settings"

      render(<ModalContainer />)

      expect(screen.getByTestId("project-settings-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Настройки проекта")
    })

    it("should render keyboard shortcuts modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "keyboard-shortcuts"

      render(<ModalContainer />)

      expect(screen.getByTestId("keyboard-shortcuts-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Горячие клавиши")
    })

    it("should render user settings modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "user-settings"

      render(<ModalContainer />)

      expect(screen.getByTestId("user-settings-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Настройки пользователя")
    })

    it("should render camera capture modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "camera-capture"

      render(<ModalContainer />)

      expect(screen.getByTestId("camera-capture-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Запись с камеры")
    })

    it("should render voice recording modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "voice-recording"

      render(<ModalContainer />)

      expect(screen.getByTestId("voice-recording-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Запись голоса")
    })

    it("should render export modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "export"

      render(<ModalContainer />)

      expect(screen.getByTestId("export-modal")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Экспорт")
    })

    it("should render nothing for unknown modal type", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "none"

      render(<ModalContainer />)

      // Check that no modal content is rendered
      expect(screen.queryByTestId("project-settings-modal")).not.toBeInTheDocument()
      expect(screen.queryByTestId("keyboard-shortcuts-modal")).not.toBeInTheDocument()
      expect(screen.queryByTestId("user-settings-modal")).not.toBeInTheDocument()
      expect(screen.queryByTestId("camera-capture-modal")).not.toBeInTheDocument()
      expect(screen.queryByTestId("voice-recording-modal")).not.toBeInTheDocument()
      expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument()
    })
  })

  describe("Dialog Classes", () => {
    it("should apply correct class for camera capture modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "camera-capture"

      render(<ModalContainer />)

      const dialogContent = screen.getByTestId("dialog-content")
      expect(dialogContent.className).toContain("h-[max(600px,min(70vh,800px))]")
      expect(dialogContent.className).toContain("w-[max(700px,min(80vw,900px))]")
    })

    it("should apply correct class for voice recording modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "voice-recording"

      render(<ModalContainer />)

      const dialogContent = screen.getByTestId("dialog-content")
      expect(dialogContent.className).toContain("h-[max(500px,min(60vh,700px))]")
      expect(dialogContent.className).toContain("w-[max(600px,min(70vw,800px))]")
    })

    it("should apply correct class for export modal", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "export"

      render(<ModalContainer />)

      const dialogContent = screen.getByTestId("dialog-content")
      expect(dialogContent.className).toContain("h-[max(700px,min(80vh,900px))]")
      expect(dialogContent.className).toContain("w-[max(800px,min(90vw,1200px))]")
    })

    it("should apply custom dialog class from modal data", () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "project-settings"
      mockUseModal.modalData = { dialogClass: "custom-class-test" }

      render(<ModalContainer />)

      const dialogContent = screen.getByTestId("dialog-content")
      expect(dialogContent.className).toContain("custom-class-test")
    })
  })

  describe("Modal Close", () => {
    it("should call closeModal when dialog is closed", async () => {
      mockUseModal.isOpen = true
      mockUseModal.modalType = "project-settings"

      render(<ModalContainer />)

      const closeButton = screen.getByTestId("close-dialog")
      await user.click(closeButton)

      expect(mockUseModal.closeModal).toHaveBeenCalled()
    })
  })
})
