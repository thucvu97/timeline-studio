import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"

import { MediaGroup } from "../../components/media-group"
import { MediaFile } from "../../types"

// Мокаем MediaItem
vi.mock("../../components/media-item", () => ({
  MediaItem: ({
    file,
    viewMode,
    previewSize,
    index,
  }: {
    file: MediaFile
    viewMode: string
    previewSize: number
    index: number
  }) => (
    <div
      data-testid="media-item"
      data-file-id={file.id}
      data-view-mode={viewMode}
      data-preview-size={previewSize}
      data-index={index}
    >
      {file.name}
    </div>
  ),
}))

// Мокаем VirtualizedContentGroup
vi.mock("@/features/browser/components/virtualized-content-group", () => ({
  VirtualizedContentGroup: ({
    title,
    items,
    viewMode,
    renderItem,
    onAddAll,
    areAllItemsAdded,
    previewSize,
  }: {
    title: string
    items: any[]
    viewMode: string
    renderItem: (item: any, index: number) => React.ReactNode
    onAddAll: (items: any[]) => void
    areAllItemsAdded: (items: any[]) => boolean
    previewSize: number
  }) => {
    const allAdded = areAllItemsAdded ? areAllItemsAdded(items) : false
    const itemHeight = viewMode === "list" ? 48 : previewSize

    return (
      <div className="mb-4" data-testid="virtualized-content-group">
        {title && (
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {title} ({items.length})
            </h3>
            {onAddAll && (
              <button onClick={() => onAddAll(items)} disabled={allAdded} data-testid="add-all-button">
                {allAdded ? "browser.media.added" : "browser.media.add"}
              </button>
            )}
          </div>
        )}
        <div
          data-testid="virtual-list"
          data-item-height={itemHeight}
          data-view-mode={viewMode}
          className={viewMode === "list" ? "flex flex-col" : "flex flex-wrap"}
        >
          {items.map((item, index) => (
            <div key={item.id || index} data-testid="virtual-item">
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    )
  },
}))

// Мокаем useAppSettings и AppSettingsProvider
vi.mock("@/features/app-state", () => ({
  useAppSettings: vi.fn(() => ({
    getMediaFiles: vi.fn(() => ({ allFiles: [] })),
    getUserSettings: vi.fn().mockReturnValue({
      browserSettings: null,
      theme: "light",
      language: "en",
    }),
    updateUserSettings: vi.fn(),
  })),
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      path: "/test/project.tlsp",
      timeline: { tracks: [], duration: 0 },
    },
    setProjectDirty: vi.fn(),
  }),
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Мокаем react-i18next
vi.mock("react-i18next", async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => key,
    }),
  }
})

describe("MediaGroup", () => {
  const mockFiles: MediaFile[] = [
    {
      id: "file-1",
      name: "video1.mp4",
      path: "/path/to/video1.mp4",
      isVideo: true,
      isAudio: false,
      isImage: false,
      size: 1024 * 1024 * 50,
      duration: 120,
      createdAt: "2023-01-01T00:00:00.000Z",
      isLoadingMetadata: false,
    },
    {
      id: "file-2",
      name: "audio1.mp3",
      path: "/path/to/audio1.mp3",
      isVideo: false,
      isAudio: true,
      isImage: false,
      size: 1024 * 1024 * 5,
      duration: 180,
      createdAt: "2023-01-02T00:00:00.000Z",
      isLoadingMetadata: false,
    },
    {
      id: "file-3",
      name: "image1.jpg",
      path: "/path/to/image1.jpg",
      isVideo: false,
      isAudio: false,
      isImage: true,
      size: 1024 * 1024 * 2,
      createdAt: "2023-01-03T00:00:00.000Z",
      isLoadingMetadata: false,
    },
  ]

  const mockAddFilesToTimeline = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render media group with title", () => {
    renderWithProviders(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем заголовок с количеством файлов
    expect(screen.getByText("Test Group (3)")).toBeInTheDocument()
  })

  it("should render all media items", () => {
    renderWithProviders(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем, что все файлы отображаются
    const mediaItems = screen.getAllByTestId("media-item")
    expect(mediaItems).toHaveLength(3)

    // Проверяем атрибуты каждого элемента
    expect(mediaItems[0]).toHaveAttribute("data-file-id", "file-1")
    expect(mediaItems[1]).toHaveAttribute("data-file-id", "file-2")
    expect(mediaItems[2]).toHaveAttribute("data-file-id", "file-3")
  })

  it("should pass correct props to media items", () => {
    renderWithProviders(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="list"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    const mediaItems = screen.getAllByTestId("media-item")

    // Проверяем, что правильные пропсы переданы
    mediaItems.forEach((item, index) => {
      expect(item).toHaveAttribute("data-view-mode", "list")
      expect(item).toHaveAttribute("data-preview-size", "100")
      expect(item).toHaveAttribute("data-index", index.toString())
    })
  })

  it("should handle empty files array", () => {
    renderWithProviders(
      <MediaGroup
        title="Empty Group"
        files={[]}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем заголовок с количеством файлов
    expect(screen.getByText("Empty Group (0)")).toBeInTheDocument()

    // Проверяем, что нет медиа элементов
    expect(screen.queryAllByTestId("media-item")).toHaveLength(0)
  })

  it("should render without title", () => {
    renderWithProviders(
      <MediaGroup
        title="Untitled Group"
        files={mockFiles}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем, что конкретный заголовок не отображается
    expect(screen.queryByText("Test Group (3)")).not.toBeInTheDocument()

    // Но файлы все равно отображаются
    expect(screen.getAllByTestId("media-item")).toHaveLength(3)
  })

  it("should handle different view modes", () => {
    const viewModes = ["list", "grid", "thumbnails"]

    viewModes.forEach((viewMode) => {
      const { rerender } = renderWithProviders(
        <MediaGroup
          title={`${viewMode} View`}
          files={mockFiles}
          viewMode={viewMode}
          previewSize={150}
          addFilesToTimeline={mockAddFilesToTimeline}
        />,
      )

      const mediaItems = screen.getAllByTestId("media-item")
      mediaItems.forEach((item) => {
        expect(item).toHaveAttribute("data-view-mode", viewMode)
      })

      // Очищаем для следующей итерации
      rerender(<div />)
    })
  })

  it("should handle different preview sizes", () => {
    const { rerender } = renderWithProviders(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="grid"
        previewSize={200}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    let mediaItems = screen.getAllByTestId("media-item")
    mediaItems.forEach((item) => {
      expect(item).toHaveAttribute("data-preview-size", "200")
    })

    // Изменяем размер превью
    rerender(
      <MediaGroup
        title="Test Group"
        files={mockFiles}
        viewMode="grid"
        previewSize={100}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    mediaItems = screen.getAllByTestId("media-item")
    mediaItems.forEach((item) => {
      expect(item).toHaveAttribute("data-preview-size", "100")
    })
  })

  it("should use virtual list for large file sets", () => {
    const manyFiles = Array.from({ length: 100 }, (_, i) => ({
      id: `file-${i}`,
      name: `file-${i}.mp4`,
      path: `/path/to/file-${i}.mp4`,
      isVideo: true,
      isAudio: false,
      isImage: false,
      size: 1024 * 1024,
      duration: 60,
      createdAt: "2023-01-01T00:00:00.000Z",
      isLoadingMetadata: false,
    }))

    renderWithProviders(
      <MediaGroup
        title="Large Group"
        files={manyFiles}
        viewMode="list"
        previewSize={40}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем, что используется виртуальный список
    const virtualList = screen.getByTestId("virtual-list")
    expect(virtualList).toBeInTheDocument()

    // Проверяем правильную высоту элемента для list view
    expect(virtualList).toHaveAttribute("data-item-height", "48")
  })

  it("should calculate correct item height for different view modes", () => {
    const testCases = [
      { viewMode: "list", previewSize: 40, expectedHeight: 48 },
      { viewMode: "grid", previewSize: 150, expectedHeight: 150 },
      { viewMode: "thumbnails", previewSize: 200, expectedHeight: 200 },
    ]

    testCases.forEach(({ viewMode, previewSize, expectedHeight }) => {
      const { rerender } = renderWithProviders(
        <MediaGroup
          title="Test Group"
          files={Array.from({ length: 50 }, (_, i) => ({
            ...mockFiles[0],
            id: `file-${i}`,
          }))}
          viewMode={viewMode}
          previewSize={previewSize}
          addFilesToTimeline={mockAddFilesToTimeline}
        />,
      )

      const virtualList = screen.getByTestId("virtual-list")
      expect(virtualList).toHaveAttribute("data-item-height", expectedHeight.toString())

      rerender(<div />)
    })
  })

  it("should handle files with loading metadata", () => {
    const filesWithLoading = [
      { ...mockFiles[0], isLoadingMetadata: true },
      { ...mockFiles[1], isLoadingMetadata: false },
      { ...mockFiles[2], isLoadingMetadata: true },
    ]

    renderWithProviders(
      <MediaGroup
        title="Loading Group"
        files={filesWithLoading}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Все файлы должны отображаться, независимо от состояния загрузки
    const mediaItems = screen.getAllByTestId("media-item")
    expect(mediaItems).toHaveLength(3)
  })

  it("should handle mixed file types", () => {
    renderWithProviders(
      <MediaGroup
        title="Mixed Files"
        files={mockFiles}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем, что отображаются файлы разных типов
    expect(screen.getByText("video1.mp4")).toBeInTheDocument()
    expect(screen.getByText("audio1.mp3")).toBeInTheDocument()
    expect(screen.getByText("image1.jpg")).toBeInTheDocument()
  })

  it("should maintain consistent spacing", () => {
    renderWithProviders(
      <MediaGroup
        title="Spacing Test"
        files={mockFiles}
        viewMode="grid"
        previewSize={150}
        addFilesToTimeline={mockAddFilesToTimeline}
      />,
    )

    // Проверяем, что контейнер имеет правильный класс
    const container = screen.getByText("Spacing Test (3)").closest("div")?.parentElement
    expect(container).toHaveClass("mb-4")
  })
})
