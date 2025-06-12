import { fireEvent, render, screen } from "@testing-library/react"
import { MockedFunction, beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserContent } from "../../components/browser-content"
import { useBrowserState } from "../../services/browser-state-provider"

// Мокаем все зависимости
vi.mock("../../services/browser-state-provider")
vi.mock("@/features/media/hooks/use-media-import")
vi.mock("@/features/music/hooks/use-music-import")
vi.mock("@/features/effects/hooks/use-effects-import")
vi.mock("@/features/filters/hooks/use-filters-import")
vi.mock("@/features/subtitles/hooks/use-subtitles-import")
vi.mock("@/features/transitions/hooks/use-transitions-import")
vi.mock("@/features/templates/hooks/use-templates-import")
vi.mock("@/features/style-templates/hooks/use-style-templates-import")

// Мокаем компоненты списков
vi.mock("@/features", () => ({
  MediaList: () => <div data-testid="media-list">Media List</div>,
  MusicList: () => <div data-testid="music-list">Music List</div>,
  TransitionList: () => <div data-testid="transition-list">Transition List</div>,
  EffectList: () => <div data-testid="effect-list">Effect List</div>,
  SubtitleList: () => <div data-testid="subtitle-list">Subtitle List</div>,
  FilterList: () => <div data-testid="filter-list">Filter List</div>,
  TemplateList: () => <div data-testid="template-list">Template List</div>,
}))

vi.mock("@/features/style-templates", () => ({
  StyleTemplateList: () => <div data-testid="style-template-list">Style Template List</div>,
}))

// Мокаем MediaToolbar
vi.mock("../../components/media-toolbar", () => ({
  MediaToolbar: (props: any) => (
    <div data-testid="media-toolbar">
      <input data-testid="search-input" value={props.searchQuery} onChange={(e) => props.onSearch(e.target.value)} />
      <button data-testid="toggle-favorites" onClick={props.onToggleFavorites}>
        Favorites: {props.showFavoritesOnly ? "on" : "off"}
      </button>
      <button data-testid="zoom-in" onClick={props.onZoomIn} disabled={!props.canZoomIn}>
        Zoom In
      </button>
      <button data-testid="zoom-out" onClick={props.onZoomOut} disabled={!props.canZoomOut}>
        Zoom Out
      </button>
      <button data-testid="import-file" onClick={props.onImportFile}>
        Import File
      </button>
      <button data-testid="import-folder" onClick={props.onImportFolder}>
        Import Folder
      </button>
    </div>
  ),
}))

// Мокаем TabsContent
vi.mock("@/components/ui/tabs", () => ({
  TabsContent: ({ children, value, className }: any) => (
    <div data-testid={`tabs-content-${value}`} className={className} style={{ display: "block" }}>
      {children}
    </div>
  ),
}))

// Мокаем getToolbarConfigForContent
vi.mock("../../components/media-toolbar-configs", () => ({
  getToolbarConfigForContent: (tab: string) => ({
    sortOptions: [
      { value: "name", label: "Name" },
      { value: "date", label: "Date" },
    ],
    groupOptions: [
      { value: "none", label: "None" },
      { value: "type", label: "Type" },
    ],
    filterOptions: [
      { value: "all", label: "All" },
      { value: "video", label: "Video" },
    ],
    viewModes: ["list", "grid", "thumbnails"],
    showGroupBy: true,
    showZoom: true,
  }),
}))

const mockBrowserState = {
  activeTab: "media",
  currentTabSettings: {
    searchQuery: "",
    showFavoritesOnly: false,
    viewMode: "thumbnails",
    sortBy: "name",
    filterType: "all",
    groupBy: "none",
    sortOrder: "asc",
    previewSizeIndex: 2,
  },
  setSearchQuery: vi.fn(),
  toggleFavorites: vi.fn(),
  setSort: vi.fn(),
  setGroupBy: vi.fn(),
  setFilter: vi.fn(),
  setViewMode: vi.fn(),
  setPreviewSize: vi.fn(),
}

// Мокаем хуки импорта
const mockImportFile = vi.fn()
const mockImportFolder = vi.fn()

vi.mocked(await import("@/features/media/hooks/use-media-import")).useMediaImport = vi.fn(() => ({
  importFile: mockImportFile,
  importFolder: mockImportFolder,
  isImporting: false,
}))

vi.mocked(await import("@/features/music/hooks/use-music-import")).useMusicImport = vi.fn(() => ({
  importFile: mockImportFile,
  importDirectory: mockImportFolder,
  isImporting: false,
}))

// Повторяем для остальных хуков импорта
const importHooks = [
  "@/features/effects/hooks/use-effects-import",
  "@/features/filters/hooks/use-filters-import",
  "@/features/subtitles/hooks/use-subtitles-import",
  "@/features/transitions/hooks/use-transitions-import",
  "@/features/templates/hooks/use-templates-import",
  "@/features/style-templates/hooks/use-style-templates-import",
]

for (const hook of importHooks) {
  const importedModule = await import(hook)
  const hookName = Object.keys(importedModule)[0]
  importedModule[hookName] = vi.fn(() => ({
    importFile: mockImportFile,
    importEffectsFile: mockImportFile,
    importFiltersFile: mockImportFile,
    importSubtitlesFile: mockImportFile,
    importTransitionsFile: mockImportFile,
    importTemplatesFile: mockImportFile,
    importStyleTemplatesFile: mockImportFile,
    importEffectFile: mockImportFolder,
    importFilterFile: mockImportFolder,
    importSubtitleFile: mockImportFolder,
    importTransitionFile: mockImportFolder,
    importTemplateFile: mockImportFolder,
    importStyleTemplateFile: mockImportFolder,
    isImporting: false,
  }))
}

describe("BrowserContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue(mockBrowserState as any)
  })

  it("должен рендерить MediaToolbar и все TabsContent", () => {
    render(<BrowserContent />)

    expect(screen.getByTestId("media-toolbar")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-media")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-music")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-subtitles")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-templates")).toBeInTheDocument()
    expect(screen.getByTestId("tabs-content-style-templates")).toBeInTheDocument()
  })

  it("должен рендерить правильные списки в каждой вкладке", () => {
    render(<BrowserContent />)

    expect(screen.getByTestId("media-list")).toBeInTheDocument()
    expect(screen.getByTestId("music-list")).toBeInTheDocument()
    expect(screen.getByTestId("transition-list")).toBeInTheDocument()
    expect(screen.getByTestId("effect-list")).toBeInTheDocument()
    expect(screen.getByTestId("subtitle-list")).toBeInTheDocument()
    expect(screen.getByTestId("filter-list")).toBeInTheDocument()
    expect(screen.getByTestId("template-list")).toBeInTheDocument()
    expect(screen.getByTestId("style-template-list")).toBeInTheDocument()
  })

  describe("поиск", () => {
    it("должен обновлять поисковый запрос", () => {
      render(<BrowserContent />)

      const searchInput = screen.getByTestId("search-input")
      fireEvent.change(searchInput, { target: { value: "test query" } })

      expect(mockBrowserState.setSearchQuery).toHaveBeenCalledWith("test query", "media")
    })
  })

  describe("избранное", () => {
    it("должен переключать отображение избранного", () => {
      render(<BrowserContent />)

      const favoritesButton = screen.getByTestId("toggle-favorites")
      fireEvent.click(favoritesButton)

      expect(mockBrowserState.toggleFavorites).toHaveBeenCalledWith("media")
    })

    it("должен показывать текущее состояние избранного", () => {
      render(<BrowserContent />)

      expect(screen.getByTestId("toggle-favorites")).toHaveTextContent("Favorites: off")

      // Обновляем состояние
      ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue({
        ...mockBrowserState,
        currentTabSettings: {
          ...mockBrowserState.currentTabSettings,
          showFavoritesOnly: true,
        },
      } as any)

      render(<BrowserContent />)
      expect(screen.getByText("Favorites: on")).toBeInTheDocument()
    })
  })

  describe("масштабирование", () => {
    it("должен увеличивать масштаб", () => {
      render(<BrowserContent />)

      const zoomInButton = screen.getByTestId("zoom-in")
      fireEvent.click(zoomInButton)

      expect(mockBrowserState.setPreviewSize).toHaveBeenCalledWith(3, "media")
    })

    it("должен уменьшать масштаб", () => {
      render(<BrowserContent />)

      const zoomOutButton = screen.getByTestId("zoom-out")
      fireEvent.click(zoomOutButton)

      expect(mockBrowserState.setPreviewSize).toHaveBeenCalledWith(1, "media")
    })

    it("должен отключать кнопку увеличения на максимальном масштабе", () => {
      ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue({
        ...mockBrowserState,
        currentTabSettings: {
          ...mockBrowserState.currentTabSettings,
          previewSizeIndex: 6, // Максимальный индекс (PREVIEW_SIZES.length - 1)
        },
      } as any)

      render(<BrowserContent />)

      const zoomInButton = screen.getByTestId("zoom-in")
      expect(zoomInButton).toBeDisabled()
    })

    it("должен отключать кнопку уменьшения на минимальном масштабе", () => {
      ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue({
        ...mockBrowserState,
        currentTabSettings: {
          ...mockBrowserState.currentTabSettings,
          previewSizeIndex: 0, // Минимальный индекс
        },
      } as any)

      render(<BrowserContent />)

      const zoomOutButton = screen.getByTestId("zoom-out")
      expect(zoomOutButton).toBeDisabled()
    })
  })

  describe("импорт файлов", () => {
    it("должен вызывать правильную функцию импорта для вкладки media", async () => {
      render(<BrowserContent />)

      const importButton = screen.getByTestId("import-file")
      fireEvent.click(importButton)

      expect(mockImportFile).toHaveBeenCalled()
    })

    it("должен вызывать правильную функцию импорта папки", async () => {
      render(<BrowserContent />)

      const importFolderButton = screen.getByTestId("import-folder")
      fireEvent.click(importFolderButton)

      expect(mockImportFolder).toHaveBeenCalled()
    })

    it("должен логировать ошибку для неподдерживаемых вкладок", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
      ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue({
        ...mockBrowserState,
        activeTab: "unknown" as any,
      } as any)

      render(<BrowserContent />)

      const importButton = screen.getByTestId("import-file")
      fireEvent.click(importButton)

      expect(consoleLogSpy).toHaveBeenCalledWith("Импорт файлов не поддерживается для вкладки:", "unknown")

      consoleLogSpy.mockRestore()
    })
  })

  describe("передача настроек в MediaToolbar", () => {
    it("должен передавать все настройки текущей вкладки", () => {
      const customSettings = {
        searchQuery: "test",
        showFavoritesOnly: true,
        viewMode: "list" as const,
        sortBy: "date",
        filterType: "video",
        groupBy: "type",
        sortOrder: "desc" as const,
        previewSizeIndex: 3,
      }
      ;(useBrowserState as MockedFunction<typeof useBrowserState>).mockReturnValue({
        ...mockBrowserState,
        currentTabSettings: customSettings,
      } as any)

      const { container } = render(<BrowserContent />)

      const searchInput = container.querySelector('input[data-testid="search-input"]')!
      expect(searchInput.value).toBe("test")
      expect(screen.getByText("Favorites: on")).toBeInTheDocument()
    })
  })

  it("должен применять правильные классы к TabsContent", () => {
    render(<BrowserContent />)

    const mediaContent = screen.getByTestId("tabs-content-media")
    expect(mediaContent).toHaveClass("bg-background", "m-0", "flex-1", "overflow-auto")
  })
})
