import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline } from "@/test/test-utils"

import { AudioClip } from "../../components/clip/audio-clip"
import { createTimelineClip, createTimelineTrack } from "../../types/factories"

// Мокаем иконки Lucide
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Copy: () => <div data-testid="copy-icon" />,
    Music: () => <div data-testid="music-icon" />,
    Scissors: () => <div data-testid="scissors-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Trash2: () => <div data-testid="trash2-icon" />,
    Volume2: () => <div data-testid="volume2-icon" />,
  }
})

// Мокаем Waveform компонент
vi.mock("../../components/track/waveform", () => ({
  default: ({ filePath }: { filePath: string }) => <div data-testid="waveform" data-filepath={filePath} />,
}))

// Мокаем AudioEffectsEditor
vi.mock("../../components/audio-effects-editor", () => ({
  AudioEffectsEditor: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div data-testid="audio-effects-editor" /> : null),
}))

describe("AudioClip", () => {
  const mockTrack = createTimelineTrack({ id: "track-1", type: "audio" })
  const mockClip = createTimelineClip({
    id: "clip-1",
    name: "test-audio.mp3",
    type: "audio",
    filePath: "/path/to/test-audio.mp3",
    duration: 30000,
    volume: 0.8,
    isSelected: false,
  })

  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен корректно рендериться", () => {
    const { container } = renderWithTimeline(
      <AudioClip clip={mockClip} track={mockTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен рендериться без ошибок с выбранным состоянием", () => {
    const selectedClip = { ...mockClip, isSelected: true }

    const { container } = renderWithTimeline(
      <AudioClip clip={selectedClip} track={mockTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен рендериться с различными типами треков", () => {
    const videoTrack = createTimelineTrack({ id: "track-2", type: "video" })

    const { container } = renderWithTimeline(
      <AudioClip clip={mockClip} track={videoTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен обрабатывать различные значения громкости", () => {
    const clipWithDifferentVolume = { ...mockClip, volume: 0.5 }

    const { container } = renderWithTimeline(
      <AudioClip clip={clipWithDifferentVolume} track={mockTrack} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />,
    )

    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен работать без обработчиков", () => {
    const { container } = renderWithTimeline(<AudioClip clip={mockClip} track={mockTrack} />)

    expect(container.firstChild).toBeInTheDocument()
  })
})
