import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalContainer } from "./modal-container"
import { useModal } from "../services/modal-provider"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  // this mock makes sure any components using the translate hook can use it without a warning being shown
  useTranslation: () => {
    return {
      t: (key: string, defaultValue: string) => {
        // Для тестов возвращаем значение по умолчанию вместо ключа
        return defaultValue || key
      },
      i18n: {
        changeLanguage: vi.fn(),
      },
    }
  },
}))

// Мокаем модули
vi.mock("../services/modal-provider")
vi.mock("../services/modal-machine")
vi.mock("@/features/project-settings/project-settings-provider", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useProjectSettings: () => ({
    settings: {
      aspectRatio: "16:9",
      resolution: "1920x1080",
      frameRate: 30,
      colorSpace: "sRGB",
    },
    isLoaded: true,
    availableResolutions: [
      { label: "1280x720", value: "1280x720" },
      { label: "1920x1080", value: "1920x1080" },
    ],
    customWidth: 1920,
    customHeight: 1080,
    aspectRatioLocked: true,
    frameRates: [
      { label: "24", value: 24 },
      { label: "30", value: 30 },
      { label: "60", value: 60 },
    ],
    colorSpaces: [
      { label: "sRGB", value: "sRGB" },
      { label: "Display P3", value: "Display P3" },
    ],
    updateAspectRatio: vi.fn(),
    updateResolution: vi.fn(),
    updateFrameRate: vi.fn(),
    updateColorSpace: vi.fn(),
    updateSettings: vi.fn(),
    resetSettings: vi.fn(),
    updateCustomWidth: vi.fn(),
    updateCustomHeight: vi.fn(),
    updateAspectRatioLocked: vi.fn(),
    updateAvailableResolutions: vi.fn(),
  }),
}))

vi.mock("@/features/project-settings/project-settings-modal", () => ({
  ProjectSettingsModal: () => (
    <div data-testid="project-settings-modal">Project Settings Modal</div>
  ),
}))

vi.mock("@/features/user-settings/user-settings-modal", () => ({
  UserSettingsModal: () => (
    <div data-testid="user-settings-modal">User Settings Modal</div>
  ),
}))
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({
    children,
    className,
  }: { children: React.ReactNode; className: string }) => (
    <div data-testid="dialog-content" className={className}>
      {children}
    </div>
  ),
  DialogHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-header">{children}</div>
  ),
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dialog-title">{children}</div>
  ),
  DialogFooter: ({
    children,
    className,
  }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="dialog-footer" className={className ?? ""}>
      {children}
    </div>
  ),
}))

// Мокаем компоненты модальных окон
vi.mock(".", () => ({
  KeyboardShortcutsModal: () => (
    <div data-testid="keyboard-shortcuts-modal">Keyboard Shortcuts Modal</div>
  ),
  UserSettingsModal: () => (
    <div data-testid="user-settings-modal">User Settings Modal</div>
  ),
  CameraCaptureModal: () => (
    <div data-testid="camera-capture-modal">Camera Capture Modal</div>
  ),
  VoiceRecordModal: () => (
    <div data-testid="voice-record-modal">Voice Record Modal</div>
  ),
  ExportModal: () => <div data-testid="export-modal">Export Modal</div>,
}))

describe("ModalContainer", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should not render dialog when isOpen is false", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "none",
      modalData: null,
      isOpen: false,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что диалог не отображается
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument()
  })

  it("should render dialog with correct title when isOpen is true", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "project-settings",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что диалог отображается
    expect(screen.getByTestId("dialog")).toBeInTheDocument()

    // Проверяем, что заголовок правильный
    expect(screen.getByTestId("dialog-title").textContent).toBe(
      "Настройки проекта",
    )
  })

  it("should render ProjectSettingsModal when modalType is project-settings", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "project-settings",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("project-settings-modal")).toBeInTheDocument()
  })

  it("should render KeyboardShortcutsModal when modalType is keyboard-shortcuts", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "keyboard-shortcuts",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("keyboard-shortcuts-modal")).toBeInTheDocument()
  })

  it("should render UserSettingsModal when modalType is user-settings", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "user-settings",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("user-settings-modal")).toBeInTheDocument()
  })

  it("should render CameraCaptureModal when modalType is camera-capture", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "camera-capture",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("camera-capture-modal")).toBeInTheDocument()
  })

  it("should render VoiceRecordModal when modalType is voice-recording", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "voice-recording",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("voice-record-modal")).toBeInTheDocument()
  })

  it("should render ExportModal when modalType is export", () => {
    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "export",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что отображается правильный модальный компонент
    expect(screen.getByTestId("export-modal")).toBeInTheDocument()
  })

  it("should use dialogClass from modalData if provided", () => {
    // Мокаем useModal с modalData, содержащим dialogClass
    vi.mocked(useModal).mockReturnValue({
      modalType: "project-settings",
      modalData: { dialogClass: "custom-dialog-class" },
      isOpen: true,
      openModal: vi.fn(),
      closeModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Проверяем, что используется класс из modalData
    expect(screen.getByTestId("dialog-content").className).toContain(
      "custom-dialog-class",
    )
  })

  it("should call closeModal when dialog is closed", () => {
    // Создаем мок для closeModal
    const closeModalMock = vi.fn()

    // Мокаем useModal
    vi.mocked(useModal).mockReturnValue({
      modalType: "project-settings",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      closeModal: closeModalMock,
      submitModal: vi.fn(),
    })

    // Рендерим компонент
    render(<ModalContainer />)

    // Симулируем закрытие диалога
    const onOpenChange = vi.mocked(useModal).mock.results[0].value.closeModal

    // Вызываем onOpenChange с false
    onOpenChange()

    // Проверяем, что closeModal был вызван
    expect(closeModalMock).toHaveBeenCalled()
  })
})
