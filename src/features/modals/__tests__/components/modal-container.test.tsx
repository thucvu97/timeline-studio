import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ModalContainer } from "../../components/modal-container"

// Mock all modal components
vi.mock("@/features/export/components/export-modal", () => ({
  ExportModal: () => <div data-testid="export-modal">Export Modal</div>,
}))

vi.mock("@/features/user-settings/components/user-settings-modal", () => ({
  UserSettingsModal: () => <div data-testid="user-settings-modal">User Settings Modal</div>,
}))

vi.mock("@/features/project-settings/components/project-settings-modal", () => ({
  ProjectSettingsModal: () => <div data-testid="project-settings-modal">Project Settings Modal</div>,
}))

vi.mock("@/features/keyboard-shortcuts/components/keyboard-shortcuts-modal", () => ({
  KeyboardShortcutsModal: () => <div data-testid="keyboard-shortcuts-modal">Keyboard Shortcuts Modal</div>,
}))

vi.mock("@/features/camera-capture/components/camera-capture-modal", () => ({
  CameraCaptureModal: () => <div data-testid="camera-capture-modal">Camera Capture Modal</div>,
}))

vi.mock("@/features/voice-recording", () => ({
  VoiceRecordModal: () => <div data-testid="voice-recording-modal">Voice Recording Modal</div>,
}))

vi.mock("@/features/timeline/components/subtitle-editor-modal", () => ({
  SubtitleEditorModal: () => <div data-testid="subtitle-editor-modal">Subtitle Editor Modal</div>,
}))

vi.mock("@/features/timeline/components/audio-effects-editor-modal", () => ({
  AudioEffectsEditorModal: () => <div data-testid="audio-effects-editor-modal">Audio Effects Editor Modal</div>,
}))

vi.mock("@/features/person-identification/components/person-form-modal", () => ({
  PersonFormModal: () => <div data-testid="person-form-modal">Person Form Modal</div>,
}))

vi.mock("@/features/subtitles/components/subtitle-ai-tools-modal", () => ({
  SubtitleAIToolsModal: () => <div data-testid="subtitle-ai-tools-modal">Subtitle AI Tools Modal</div>,
}))

vi.mock("@/features/media/components/cache-settings-modal", () => ({
  CacheSettingsModal: () => <div data-testid="cache-settings-modal">Cache Settings Modal</div>,
}))

vi.mock("@/features/video-compiler/components/cache-statistics-modal", () => ({
  CacheStatisticsModal: () => <div data-testid="cache-statistics-modal">Cache Statistics Modal</div>,
}))

vi.mock("@/features/app-state/components/missing-files-modal", () => ({
  MissingFilesModal: () => <div data-testid="missing-files-modal">Missing Files Modal</div>,
}))

vi.mock("@/features/effects/components/effect-detail-modal", () => ({
  EffectDetailModal: () => <div data-testid="effect-detail-modal">Effect Detail Modal</div>,
}))

// Mock additional modal components that exist in the real ModalContainer
vi.mock("@/features/color-grading/components/controls/color-grading-save-preset-modal", () => ({
  ColorGradingSavePresetModal: () => <div data-testid="color-grading-modal">Color Grading Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-configuration-modal-component", () => ({
  MidiConfigurationModalComponent: () => <div data-testid="midi-configuration-modal">MIDI Configuration Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-learn-modal", () => ({
  MidiLearnModal: () => <div data-testid="midi-learn-modal">MIDI Learn Modal</div>,
}))

vi.mock("@/features/fairlight-audio/components/midi/midi-mapping-editor-modal", () => ({
  MidiMappingEditorModal: () => <div data-testid="midi-mapping-modal">MIDI Mapping Modal</div>,
}))

vi.mock("@/features/timeline/components/ai-markers/ai-marker-settings-modal", () => ({
  AIMarkerSettingsModal: () => <div data-testid="ai-marker-settings-modal">AI Marker Settings Modal</div>,
}))

// Mock i18n
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, defaultValue?: string) => defaultValue || key),
  }),
}))

// Mock modal service with different modal types
const mockModalService = {
  modalType: "none" as any,
  isOpen: false,
  closeModal: vi.fn(),
}

vi.mock("@/features/modals/services", () => ({
  useModal: () => mockModalService,
}))

describe("ModalContainer", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockModalService.modalType = "none"
    mockModalService.isOpen = false
  })

  it("should not render any modal when closed", () => {
    render(<ModalContainer />)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("should render export modal", () => {
    mockModalService.modalType = "export"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("export-modal")).toBeInTheDocument()
  })

  it("should render user settings modal", () => {
    mockModalService.modalType = "user-settings"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("user-settings-modal")).toBeInTheDocument()
  })

  it("should render project settings modal", () => {
    mockModalService.modalType = "project-settings"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("project-settings-modal")).toBeInTheDocument()
  })

  it("should render keyboard shortcuts modal", () => {
    mockModalService.modalType = "keyboard-shortcuts"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("keyboard-shortcuts-modal")).toBeInTheDocument()
  })

  it("should render camera capture modal", () => {
    mockModalService.modalType = "camera-capture"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("camera-capture-modal")).toBeInTheDocument()
  })

  it("should render voice recording modal", () => {
    mockModalService.modalType = "voice-recording"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("voice-recording-modal")).toBeInTheDocument()
  })

  it("should render subtitle editor modal", () => {
    mockModalService.modalType = "subtitle-editor"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("subtitle-editor-modal")).toBeInTheDocument()
  })

  it("should render audio effects editor modal", () => {
    mockModalService.modalType = "audio-effects"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("audio-effects-editor-modal")).toBeInTheDocument()
  })

  it("should render person form modal", () => {
    mockModalService.modalType = "person-form"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("person-form-modal")).toBeInTheDocument()
  })

  it("should render subtitle AI tools modal", () => {
    mockModalService.modalType = "subtitle-ai-tools"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("subtitle-ai-tools-modal")).toBeInTheDocument()
  })

  it("should render cache settings modal", () => {
    mockModalService.modalType = "cache-settings"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("cache-settings-modal")).toBeInTheDocument()
  })

  it("should render cache statistics modal", () => {
    mockModalService.modalType = "cache-statistics"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("cache-statistics-modal")).toBeInTheDocument()
  })

  it("should render missing files modal", () => {
    mockModalService.modalType = "missing-files"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("missing-files-modal")).toBeInTheDocument()
  })

  it("should render effect detail modal", () => {
    mockModalService.modalType = "effect-detail"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("effect-detail-modal")).toBeInTheDocument()
  })

  it("should render color grading modal", () => {
    mockModalService.modalType = "color-grading"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("color-grading-modal")).toBeInTheDocument()
  })

  it("should render MIDI configuration modal", () => {
    mockModalService.modalType = "midi-configuration"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("midi-configuration-modal")).toBeInTheDocument()
  })

  it("should render MIDI learn modal", () => {
    mockModalService.modalType = "midi-learn"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("midi-learn-modal")).toBeInTheDocument()
  })

  it("should render MIDI mapping modal", () => {
    mockModalService.modalType = "midi-mapping"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("midi-mapping-modal")).toBeInTheDocument()
  })

  it("should render AI marker settings modal", () => {
    mockModalService.modalType = "ai-marker-settings"
    mockModalService.isOpen = true

    render(<ModalContainer />)

    expect(screen.getByTestId("ai-marker-settings-modal")).toBeInTheDocument()
  })

  it("should render empty content for unknown modal type", () => {
    mockModalService.modalType = "unknown-modal" as any
    mockModalService.isOpen = true

    render(<ModalContainer />)

    // Dialog should be open but with empty content
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    // Should not have any specific modal content
    expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument()
    expect(screen.queryByTestId("user-settings-modal")).not.toBeInTheDocument()
  })

  it("should handle modal type changes", () => {
    mockModalService.modalType = "export"
    mockModalService.isOpen = true

    const { rerender } = render(<ModalContainer />)

    expect(screen.getByTestId("export-modal")).toBeInTheDocument()

    // Change modal type
    mockModalService.modalType = "user-settings"
    rerender(<ModalContainer />)

    expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument()
    expect(screen.getByTestId("user-settings-modal")).toBeInTheDocument()
  })

  it("should handle modal close state", () => {
    mockModalService.modalType = "export"
    mockModalService.isOpen = true

    const { rerender } = render(<ModalContainer />)

    expect(screen.getByTestId("export-modal")).toBeInTheDocument()

    // Close modal
    mockModalService.isOpen = false
    rerender(<ModalContainer />)

    expect(screen.queryByTestId("export-modal")).not.toBeInTheDocument()
  })
})