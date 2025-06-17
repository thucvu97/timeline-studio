import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithTimeline } from "@/test/test-utils"

import { VideoClip } from "../../components/clip/video-clip"
import { createTimelineClip, createTimelineTrack } from "../../types/factories"

// Мокаем иконки Lucide
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    Copy: () => <div data-testid="copy-icon" />,
    Film: () => <div data-testid="film-icon" />,
    Scissors: () => <div data-testid="scissors-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />,
    Trash2: () => <div data-testid="trash2-icon" />,
    Volume2: () => <div data-testid="volume2-icon" />,
  }
})

// Мокаем VideoEffectsEditor
vi.mock("../../components/video-effects-editor", () => ({
  VideoEffectsEditor: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="video-effects-editor" /> : null
}))

describe("VideoClip", () => {
  const mockTrack = createTimelineTrack({ id: "track-1", type: "video" })
  const mockClip = createTimelineClip({
    id: "clip-1",
    name: "test-video.mp4",
    type: "video",
    filePath: "/path/to/test-video.mp4",
    duration: 60000,
    volume: 1.0,
    isSelected: false
  })

  const mockOnUpdate = vi.fn()
  const mockOnRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен корректно рендериться", () => {
    const { container } = renderWithTimeline(
      <VideoClip 
        clip={mockClip} 
        track={mockTrack}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен рендериться без ошибок с выбранным состоянием", () => {
    const selectedClip = { ...mockClip, isSelected: true }
    
    const { container } = renderWithTimeline(
      <VideoClip 
        clip={selectedClip} 
        track={mockTrack}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен рендериться с различными типами треков", () => {
    const audioTrack = createTimelineTrack({ id: "track-2", type: "audio" })
    
    const { container } = renderWithTimeline(
      <VideoClip 
        clip={mockClip} 
        track={audioTrack}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен обрабатывать различные значения громкости", () => {
    const clipWithDifferentVolume = { ...mockClip, volume: 0.7 }
    
    const { container } = renderWithTimeline(
      <VideoClip 
        clip={clipWithDifferentVolume} 
        track={mockTrack}
        onUpdate={mockOnUpdate}
        onRemove={mockOnRemove}
      />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })

  it("должен работать без обработчиков", () => {
    const { container } = renderWithTimeline(
      <VideoClip 
        clip={mockClip} 
        track={mockTrack}
      />
    )
    
    expect(container.firstChild).toBeInTheDocument()
  })
})