import { render } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/types/media"

import { MediaPreview } from "./media-preview"

// Мокаем компоненты для разных типов медиа
vi.mock("./video-preview", () => ({
  VideoPreview: ({ file, size, showFileName, dimensions, ignoreRatio }: any) => (
    <div
      data-testid="video-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
      data-ignore-ratio={ignoreRatio}
    >
      Video Preview
    </div>
  ),
}))

vi.mock("./audio-preview", () => ({
  AudioPreview: ({ file, size, showFileName, dimensions }: any) => (
    <div
      data-testid="audio-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
    >
      Audio Preview
    </div>
  ),
}))

vi.mock("./image-preview", () => ({
  ImagePreview: ({ file, size, showFileName, dimensions }: any) => (
    <div
      data-testid="image-preview"
      data-file={file.name}
      data-size={size}
      data-show-filename={showFileName}
      data-dimensions={dimensions.join(",")}
    >
      Image Preview
    </div>
  ),
}))

describe("MediaPreview", () => {
  // Создаем моки для разных типов файлов
  const videoFile: MediaFile = {
    id: "video1",
    name: "video.mp4",
    path: "/path/to/video.mp4",
    isVideo: true,
    isAudio: false,
    isImage: false,
  }

  const audioFile: MediaFile = {
    id: "audio1",
    name: "audio.mp3",
    path: "/path/to/audio.mp3",
    isVideo: false,
    isAudio: true,
    isImage: false,
  }

  const imageFile: MediaFile = {
    id: "image1",
    name: "image.jpg",
    path: "/path/to/image.jpg",
    isVideo: false,
    isAudio: false,
    isImage: true,
  }

  it("should render VideoPreview for video files", () => {
    const { getByTestId } = render(<MediaPreview file={videoFile} />)

    const videoPreview = getByTestId("video-preview")
    expect(videoPreview).toBeInTheDocument()
    expect(videoPreview).toHaveAttribute("data-file", "video.mp4")
    expect(videoPreview).toHaveAttribute("data-size", "60") // Default size
    expect(videoPreview).toHaveAttribute("data-show-filename", "false") // Default showFileName
    expect(videoPreview).toHaveAttribute("data-dimensions", "16,9") // Default dimensions
    expect(videoPreview).toHaveAttribute("data-ignore-ratio", "false") // Default ignoreRatio
  })

  it("should render AudioPreview for audio files", () => {
    const { getByTestId } = render(<MediaPreview file={audioFile} />)

    const audioPreview = getByTestId("audio-preview")
    expect(audioPreview).toBeInTheDocument()
    expect(audioPreview).toHaveAttribute("data-file", "audio.mp3")
  })

  it("should render ImagePreview for image files", () => {
    const { getByTestId } = render(<MediaPreview file={imageFile} />)

    const imagePreview = getByTestId("image-preview")
    expect(imagePreview).toBeInTheDocument()
    expect(imagePreview).toHaveAttribute("data-file", "image.jpg")
  })

  it("should pass custom props to child components", () => {
    const onAddMedia = vi.fn()
    const { getByTestId } = render(
      <MediaPreview
        file={videoFile}
        onAddMedia={onAddMedia}
        isAdded={true}
        size={120}
        showFileName={true}
        dimensions={[4, 3]}
        ignoreRatio={true}
      />,
    )

    const videoPreview = getByTestId("video-preview")
    expect(videoPreview).toHaveAttribute("data-size", "120")
    expect(videoPreview).toHaveAttribute("data-show-filename", "true")
    expect(videoPreview).toHaveAttribute("data-dimensions", "4,3")
    expect(videoPreview).toHaveAttribute("data-ignore-ratio", "true")
  })
})
