import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"

import { VideoPreview } from "../../../components/preview/video-preview"

// Мокаем основные зависимости
vi.mock("@tauri-apps/api/core", () => ({
  convertFileSrc: vi.fn((path: string) => `asset://localhost/${path}`),
}))

vi.mock("@/features", () => ({
  useResources: vi.fn(() => ({
    isAdded: vi.fn(() => false),
  })),
}))

vi.mock("@/features/media/utils/video", () => ({
  calculateAdaptiveWidth: vi.fn((width: number) => width),
  calculateWidth: vi.fn(() => 200),
  parseRotation: vi.fn(() => 0),
}))

vi.mock("@/lib/date", () => ({
  formatDuration: vi.fn(() => "2:00"),
}))

vi.mock("@/lib/utils", () => ({
  cn: vi.fn((...classes) => classes.filter(Boolean).join(" ")),
  formatResolution: vi.fn(() => "1920x1080"),
}))

// Упрощенные моки компонентов
vi.mock("../../../components/layout", () => ({
  ApplyButton: () => <div data-testid="apply-button">Apply</div>,
}))

vi.mock("../../../components/layout/add-media-button", () => ({
  AddMediaButton: () => <div data-testid="add-media-button">Add</div>,
}))

vi.mock("../../../components/layout/favorite-button", () => ({
  FavoriteButton: () => <div data-testid="favorite-button">Favorite</div>,
}))

vi.mock("lucide-react", () => ({
  Film: () => <div data-testid="film-icon">Film</div>,
}))

const createMockMediaFile = (): MediaFile => ({
  id: "test-file-1",
  name: "test-video.mp4",
  path: "/test/path/test-video.mp4",
  size: 1024 * 1024 * 10,
  extension: "mp4",
  isLocal: true,
  isDirectory: false,
  isFavorite: false,
  isLoadingMetadata: false,
  lastModified: Date.now(),
  duration: 120,
  probeData: {
    format: {
      filename: "/test/path/test-video.mp4",
      nb_streams: 1,
      format_name: "mp4",
      duration: "120.000000",
      size: "10485760",
      bit_rate: "698905",
    },
    streams: [
      {
        index: 0,
        codec_type: "video",
        codec_name: "h264",
        width: 1920,
        height: 1080,
        display_aspect_ratio: "16:9",
        duration: "120.000000",
        bit_rate: "500000",
        nb_frames: "3600",
        streamKey: "stream-0",
      } as any,
    ],
  },
})

describe("VideoPreview - Simplified", () => {
  it("должен рендерить видео превью с основными элементами", () => {
    const file = createMockMediaFile()
    render(<VideoPreview file={file} />)

    // Проверяем наличие видео элемента
    const videos = document.querySelectorAll("video")
    expect(videos).toHaveLength(1)

    // Проверяем основные UI элементы
    expect(screen.getByTestId("film-icon")).toBeInTheDocument()
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument()
    expect(screen.getByTestId("apply-button")).toBeInTheDocument()

    // Проверяем отображение длительности
    expect(screen.getByText("2:00")).toBeInTheDocument()
  })

  it("должен отображать имя файла при showFileName = true", () => {
    const file = createMockMediaFile()
    render(<VideoPreview file={file} showFileName={true} />)

    expect(screen.getByText("test-video.mp4")).toBeInTheDocument()
  })

  it("должен применять правильный размер", () => {
    const file = createMockMediaFile()
    const { container } = render(<VideoPreview file={file} size={200} />)

    const videoContainer = container.querySelector(".relative.flex-shrink-0")
    expect(videoContainer).toHaveStyle({ height: "200px" })
  })

  it("должен отображать плейсхолдер при отсутствии видео потоков", () => {
    const file = createMockMediaFile()
    file.probeData = { format: {} as any, streams: [] }

    render(<VideoPreview file={file} />)

    // Все равно должны быть основные элементы
    const videos = document.querySelectorAll("video")
    expect(videos).toHaveLength(1)
    expect(screen.getByTestId("film-icon")).toBeInTheDocument()
  })
})
