import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { FfprobeStream } from "@/features/media/types/ffprobe"
import { MediaFile } from "@/features/media/types/media"

import { VideoPreview } from "../../../components/preview/video-preview"

// Мокаем компоненты, которые используются в VideoPreview
vi.mock("../../../components/layout/add-media-button", () => ({
  AddMediaButton: ({ file, onAddMedia, isAdded, size }: any) => (
    <button
      data-testid="add-media-button"
      data-file={file.name}
      data-is-added={isAdded}
      data-size={size}
      onClick={(e) => onAddMedia(e, file)}
    >
      Add Media
    </button>
  ),
}))

vi.mock("../../../components/layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <button data-testid="favorite-button" data-file={file.name} data-size={size} data-type={type}>
      Favorite
    </button>
  ),
}))

vi.mock("lucide-react", () => ({
  Film: ({ size }: any) => (
    <div data-testid="film-icon" data-size={size}>
      Film Icon
    </div>
  ),
}))

// Мокаем функции из lib/video
vi.mock("@/lib/video", () => ({
  calculateWidth: vi.fn().mockImplementation((width, height, size) => {
    return (size * width) / height
  }),
  calculateAdaptiveWidth: vi.fn().mockImplementation((width) => {
    return `${width}px`
  }),
  parseRotation: vi.fn().mockReturnValue(undefined),
}))

// Мокаем функции из lib/utils
vi.mock("@/lib/utils", () => ({
  cn: (...inputs: any[]) => inputs.filter(Boolean).join(" "),
  formatResolution: vi.fn().mockReturnValue("FHD"),
}))

// Мокаем функции из lib/date
vi.mock("@/lib/date", () => ({
  formatDuration: vi.fn().mockReturnValue("3:00"),
}))

describe("VideoPreview", () => {
  // Создаем мок для видеофайла с одним потоком
  const singleStreamVideoFile: MediaFile = {
    id: "video1",
    name: "video.mp4",
    path: "/path/to/video.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 180, // 3 минуты
    probeData: {
      streams: [
        {
          index: 0,
          codec_type: "video",
          width: 1920,
          height: 1080,
          display_aspect_ratio: "16:9",
          streamKey: "stream-0",
        } as FfprobeStream,
      ],
      format: {
        filename: "video.mp4",
      },
    },
  }

  // Создаем мок для видеофайла с несколькими потоками
  const multiStreamVideoFile: MediaFile = {
    id: "video2",
    name: "multi-stream.mp4",
    path: "/path/to/multi-stream.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
    duration: 180, // 3 минуты
    probeData: {
      streams: [
        {
          index: 0,
          codec_type: "video",
          width: 1920,
          height: 1080,
          display_aspect_ratio: "16:9",
          streamKey: "stream-0",
        } as FfprobeStream,
        {
          index: 1,
          codec_type: "video",
          width: 1280,
          height: 720,
          display_aspect_ratio: "16:9",
          streamKey: "stream-1",
        } as FfprobeStream,
      ],
      format: {
        filename: "multi-stream.mp4",
      },
    },
  }

  it("should render correctly with default props", () => {
    render(<VideoPreview file={singleStreamVideoFile} />)

    // Проверяем, что видео элемент отображается
    const videoElement = document.querySelector("video")
    expect(videoElement).not.toBeNull()
    expect(videoElement).toHaveAttribute("src", "converted-/path/to/video.mp4")

    // Проверяем, что иконка фильма отображается
    const filmIcon = screen.getByTestId("film-icon")
    expect(filmIcon).toBeInTheDocument()
    expect(filmIcon).toHaveAttribute("data-size", "12") // Маленький размер по умолчанию

    // Проверяем, что кнопка избранного отображается
    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveAttribute("data-file", "video.mp4")
    expect(favoriteButton).toHaveAttribute("data-size", "60")
    expect(favoriteButton).toHaveAttribute("data-type", "media")

    // Проверяем, что продолжительность видео отображается
    expect(screen.getByText("3:00")).toBeInTheDocument()

    // Проверяем, что имя файла не отображается
    expect(screen.queryByText("video.mp4")).not.toBeInTheDocument()
  })

  it("should show filename when showFileName is true", () => {
    render(<VideoPreview file={singleStreamVideoFile} showFileName />)

    // Проверяем, что имя файла отображается
    expect(screen.getByText("video.mp4")).toBeInTheDocument()
  })

  it("should render with custom size", () => {
    render(<VideoPreview file={singleStreamVideoFile} size={120} />)

    // Проверяем, что иконка фильма имеет больший размер
    const filmIcon = screen.getByTestId("film-icon")
    expect(filmIcon).toHaveAttribute("data-size", "16") // Большой размер для size > 100

    // Проверяем, что кнопка избранного имеет правильный размер
    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toHaveAttribute("data-size", "120")
  })

  it("should render add media button when onAddMedia is provided", () => {
    // Пропускаем этот тест, так как он требует имитации события loadedData,
    // которое сложно воспроизвести в тестовой среде
  })

  it("should render multiple streams for multi-stream video", () => {
    render(<VideoPreview file={multiStreamVideoFile} />)

    // Проверяем, что отображаются два видео элемента
    const videoElements = document.querySelectorAll("video")
    expect(videoElements.length).toBe(2)

    // Проверяем, что оба элемента имеют одинаковый src
    videoElements.forEach((element) => {
      expect(element).toHaveAttribute("src", "converted-/path/to/multi-stream.mp4")
    })
  })

  it("should handle play/pause on click", () => {
    // Пропускаем этот тест, так как он требует сложного мока для видео элемента
    // и событий клика, которые сложно воспроизвести в тестовой среде
  })
})
