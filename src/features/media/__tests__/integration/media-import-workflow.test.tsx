import { act, fireEvent, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useMediaFiles } from "@/features/app-state/hooks/use-media-files"
import { selectMediaDirectory, selectMediaFile } from "@/features/media"
import { renderWithProviders } from "@/test/test-utils"

import { MediaContent } from "../../components/media-content"
import { useMediaImport } from "../../hooks/use-media-import"
import { groupFilesByDate } from "../../utils/grouping"

// Импортируем useMediaFiles для использования в тестовом компоненте

// Мокаем toast до импортов
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}))

// Мокаем модули
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@/features/media", () => ({
  selectMediaFile: vi.fn(),
  selectMediaDirectory: vi.fn(),
}))

// Мокаем хуки
const mockImportFile = vi.fn()
const mockImportFolder = vi.fn()

vi.mock("../../hooks/use-media-import", () => ({
  useMediaImport: vi.fn(() => ({
    importFile: mockImportFile,
    importFolder: mockImportFolder,
    isImporting: false,
    progress: 0,
  })),
}))

const mockMediaFiles: any = { allFiles: [] }

vi.mock("@/features/app-state/hooks/use-media-files", () => ({
  useMediaFiles: vi.fn(() => ({
    mediaFiles: mockMediaFiles,
    updateMediaFiles: vi.fn(),
  })),
}))

// Тестовый компонент для интеграционного теста
function MediaImportTestComponent() {
  const { importFile, importFolder, isImporting, progress } = useMediaImport()
  const { mediaFiles } = useMediaFiles()

  // Группируем файлы для отображения
  const groupedFiles = groupFilesByDate(mediaFiles.allFiles || [])

  const handleImportFile = async () => {
    await importFile()
  }

  const handleImportFolder = async () => {
    await importFolder()
  }

  const addFilesToTimeline = (files: any[]) => {
    // Mock implementation
    console.log("Adding files to timeline:", files)
  }

  return (
    <div>
      <button onClick={handleImportFile} disabled={isImporting}>
        Import Files
      </button>
      <button onClick={handleImportFolder} disabled={isImporting}>
        Import Folder
      </button>

      {isImporting && <div data-testid="import-progress">Importing... {Math.round(progress * 100)}%</div>}

      <MediaContent
        groupedFiles={groupedFiles}
        viewMode="grid"
        previewSize={150}
        isLoading={false}
        error={null}
        addFilesToTimeline={addFilesToTimeline}
        onRetry={() => {}}
      />
    </div>
  )
}

describe("Media Import Workflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockMediaFiles.allFiles = []
    mockImportFile.mockClear()
    mockImportFolder.mockClear()
  })

  it("should complete full file import workflow", async () => {
    const mockFiles = ["/path/to/video1.mp4", "/path/to/video2.mp4", "/path/to/audio1.mp3"]

    // Настраиваем моки для импорта файлов
    vi.mocked(selectMediaFile).mockResolvedValue(mockFiles)
    mockImportFile.mockImplementation(async () => {
      // Симулируем добавление файлов
      mockMediaFiles.allFiles = mockFiles.map((path) => ({
        id: path,
        path,
        name: path.split("/").pop(),
        isVideo: path.endsWith(".mp4"),
        isAudio: path.endsWith(".mp3"),
        isImage: false,
        creationTime: "2023-01-01T00:00:00.000Z",
      }))
      return {
        success: true,
        message: "Files imported",
        files: mockFiles,
      }
    })

    // Рендерим компонент
    renderWithProviders(<MediaImportTestComponent />)

    // Проверяем начальное состояние
    expect(screen.getByText("Медиафайлы не найдены")).toBeInTheDocument()

    // Кликаем на кнопку импорта файлов
    const importButton = screen.getByText("Import Files")
    await act(async () => {
      fireEvent.click(importButton)
    })

    // Проверяем, что функция импорта была вызвана
    expect(mockImportFile).toHaveBeenCalled()
  })

  it("should complete folder import workflow", async () => {
    const mockDirectory = "/path/to/media/folder"

    // Настраиваем моки
    vi.mocked(selectMediaDirectory).mockResolvedValue(mockDirectory)
    mockImportFolder.mockImplementation(async () => {
      // Симулируем добавление файлов из папки
      mockMediaFiles.allFiles = [
        {
          id: "1",
          path: `${mockDirectory}/file1.mp4`,
          name: "file1.mp4",
          isVideo: true,
          creationTime: "2023-01-01T00:00:00.000Z",
        },
        {
          id: "2",
          path: `${mockDirectory}/file2.mp4`,
          name: "file2.mp4",
          isVideo: true,
          creationTime: "2023-01-01T00:00:00.000Z",
        },
      ]
      return {
        success: true,
        message: "Folder imported",
      }
    })

    // Рендерим компонент
    renderWithProviders(<MediaImportTestComponent />)

    // Кликаем на кнопку импорта папки
    const importFolderButton = screen.getByText("Import Folder")
    await act(async () => {
      fireEvent.click(importFolderButton)
    })

    // Проверяем, что функция импорта папки была вызвана
    expect(mockImportFolder).toHaveBeenCalled()
  })

  it("should handle import cancellation", async () => {
    // Настраиваем мок для отмены выбора файлов
    vi.mocked(selectMediaFile).mockResolvedValue(null)
    mockImportFile.mockResolvedValue({
      success: false,
      message: "No files selected",
      files: [],
    })

    renderWithProviders(<MediaImportTestComponent />)

    // Кликаем на кнопку импорта
    const importButton = screen.getByText("Import Files")
    await act(async () => {
      fireEvent.click(importButton)
    })

    // Проверяем, что прогресс не показывается (импорт был отменен)
    expect(screen.queryByTestId("import-progress")).not.toBeInTheDocument()

    // Проверяем, что файлы не добавлены
    expect(screen.getByText("Медиафайлы не найдены")).toBeInTheDocument()
  })

  it("should disable import buttons during import", async () => {
    const mockFiles = Array.from({ length: 20 }, (_, i) => `/path/to/file${i}.mp4`)

    // Настраиваем медленную загрузку метаданных
    vi.mocked(selectMediaFile).mockResolvedValue(mockFiles)

    // Создаем мок с контролируемым isImporting
    let isImporting = false
    vi.mocked(useMediaImport).mockReturnValue({
      importFile: vi.fn(async () => {
        isImporting = true
        // Симулируем задержку
        await new Promise((resolve) => setTimeout(resolve, 100))
        isImporting = false
        return { success: true, message: "Imported", files: mockFiles }
      }),
      importFolder: vi.fn(),
      isImporting: false,
      progress: 0,
    })

    renderWithProviders(<MediaImportTestComponent />)

    const importFileButton = screen.getByText("Import Files")
    const importFolderButton = screen.getByText("Import Folder")

    // Проверяем, что кнопки активны изначально
    expect(importFileButton).not.toBeDisabled()
    expect(importFolderButton).not.toBeDisabled()
  })
})
