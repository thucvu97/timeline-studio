import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/types/media"

import { ImagePreview } from "./image-preview"

// Мокаем компоненты, которые используются в ImagePreview
vi.mock("../layout/add-media-button", () => ({
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

vi.mock("../layout/favorite-button", () => ({
  FavoriteButton: ({ file, size, type }: any) => (
    <button data-testid="favorite-button" data-file={file.name} data-size={size} data-type={type}>
      Favorite
    </button>
  ),
}))

vi.mock("lucide-react", () => ({
  Image: ({ path, className, size }: any) => (
    <div data-testid="lucide-image" data-path={path} data-class-name={className} data-size={size}>
      Image Icon
    </div>
  ),
}))

describe("ImagePreview", () => {
  const imageFile: MediaFile = {
    id: "image1",
    name: "image.jpg",
    path: "/path/to/image.jpg",
    isVideo: false,
    isAudio: false,
    isImage: true,
  }

  it("should render correctly with default props", () => {
    render(<ImagePreview file={imageFile} />)

    // Проверяем, что иконка изображения отображается
    const imageIcons = screen.getAllByTestId("lucide-image")
    expect(imageIcons.length).toBeGreaterThanOrEqual(1)

    // Проверяем, что имя файла не отображается
    expect(screen.queryByText("image.jpg")).not.toBeInTheDocument()

    // Проверяем, что кнопка избранного отображается
    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toBeInTheDocument()
    expect(favoriteButton).toHaveAttribute("data-file", "image.jpg")
    expect(favoriteButton).toHaveAttribute("data-size", "60")
    expect(favoriteButton).toHaveAttribute("data-type", "media")

    // Проверяем, что кнопка добавления не отображается
    expect(screen.queryByTestId("add-media-button")).not.toBeInTheDocument()
  })

  it("should show filename when showFileName is true", () => {
    render(<ImagePreview file={imageFile} showFileName />)

    // Проверяем, что имя файла отображается
    expect(screen.getByText("image.jpg")).toBeInTheDocument()
  })

  it("should render with custom size and dimensions", () => {
    render(<ImagePreview file={imageFile} size={120} dimensions={[4, 3]} />)

    // Проверяем, что иконка имеет больший размер
    const imageIcons = screen.getAllByTestId("lucide-image")
    const smallIcon = imageIcons.find((icon) => icon.getAttribute("data-size") === "16")
    expect(smallIcon).toBeDefined()

    // Проверяем, что кнопка избранного имеет правильный размер
    const favoriteButton = screen.getByTestId("favorite-button")
    expect(favoriteButton).toHaveAttribute("data-size", "120")
  })

  it("should render add media button when onAddMedia is provided", () => {
    const onAddMedia = vi.fn()
    render(<ImagePreview file={imageFile} onAddMedia={onAddMedia} isAdded={false} />)

    // Проверяем, что кнопка добавления отображается
    const addButton = screen.getByTestId("add-media-button")
    expect(addButton).toBeInTheDocument()
    expect(addButton).toHaveAttribute("data-file", "image.jpg")
    expect(addButton).toHaveAttribute("data-is-added", "false")

    // Проверяем, что при клике вызывается onAddMedia
    fireEvent.click(addButton)
    expect(onAddMedia).toHaveBeenCalledWith(expect.anything(), imageFile)
  })
})
