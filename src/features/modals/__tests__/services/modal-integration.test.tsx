import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ModalContainer } from "../../components/modal-container"
import { ModalProvider } from "../../services/modal-provider"

// Mock translations
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, defaultValue?: string) => defaultValue || key),
  }),
}))

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

// Mock other required components
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

describe("Modal Integration", () => {
  it("should render modal provider with container", () => {
    render(
      <ModalProvider>
        <ModalContainer />
      </ModalProvider>
    )

    // Should render without errors
    expect(document.body).toBeInTheDocument()
  })

  it("should handle modal container render", () => {
    const { container } = render(
      <ModalProvider>
        <ModalContainer />
      </ModalProvider>
    )

    // Container should exist and be properly set up
    expect(container).toBeTruthy()
  })

  it("should integrate provider and container without errors", () => {
    // This test ensures the modal system can be rendered
    expect(() => 
      render(
        <ModalProvider>
          <ModalContainer />
        </ModalProvider>
      )
    ).not.toThrow()
  })
})