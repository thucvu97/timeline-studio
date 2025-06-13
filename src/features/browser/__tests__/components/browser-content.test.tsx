import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { BrowserContent } from "../../components/browser-content"

// Мокаем браузер провайдер
vi.mock("../../services/browser-state-provider", () => ({
  useBrowserState: vi.fn(() => ({
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
  })),
}))

// Мокаем компонент прогресса

// Мокаем все хуки импорта
vi.mock("@/features/media/hooks/use-media-import", () => ({
  useMediaImport: () => ({
    importFile: vi.fn(),
    importFolder: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/music/hooks/use-music-import", () => ({
  useMusicImport: () => ({
    importFile: vi.fn(),
    importDirectory: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/effects/hooks/use-effects-import", () => ({
  useEffectsImport: () => ({
    importEffectsFile: vi.fn(),
    importEffectFile: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/filters/hooks/use-filters-import", () => ({
  useFiltersImport: () => ({
    importFiltersFile: vi.fn(),
    importFilterFile: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/subtitles/hooks/use-subtitles-import", () => ({
  useSubtitlesImport: () => ({
    importSubtitlesFile: vi.fn(),
    importSubtitleFile: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/transitions/hooks/use-transitions-import", () => ({
  useTransitionsImport: () => ({
    importTransitionsFile: vi.fn(),
    importTransitionFile: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/templates/hooks/use-templates-import", () => ({
  useTemplatesImport: () => ({
    importTemplatesFile: vi.fn(),
    importTemplateFile: vi.fn(),
    isImporting: false,
  }),
}))

vi.mock("@/features/style-templates/hooks/use-style-templates-import", () => ({
  useStyleTemplatesImport: () => ({
    importStyleTemplatesFile: vi.fn(),
    importStyleTemplateFile: vi.fn(),
    isImporting: false,
  }),
}))

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
  getToolbarConfigForContent: () => ({
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

describe("BrowserContent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен отображать содержимое вкладки media", () => {
    render(<BrowserContent />)

    expect(screen.getByTestId("tabs-content-media")).toBeInTheDocument()
    expect(screen.getByTestId("media-toolbar")).toBeInTheDocument()
    expect(screen.getByTestId("media-list")).toBeInTheDocument()
  })

  it("должен обрабатывать поиск", async () => {
    const mockSetSearchQuery = vi.fn()
    const { useBrowserState } = await import("../../services/browser-state-provider")
    vi.mocked(useBrowserState).mockReturnValue({
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
      setSearchQuery: mockSetSearchQuery,
      toggleFavorites: vi.fn(),
      setSort: vi.fn(),
      setGroupBy: vi.fn(),
      setFilter: vi.fn(),
      setViewMode: vi.fn(),
      setPreviewSize: vi.fn(),
    })

    render(<BrowserContent />)

    const searchInput = screen.getByTestId("search-input")
    fireEvent.change(searchInput, { target: { value: "test query" } })

    expect(mockSetSearchQuery).toHaveBeenCalledWith("test query", "media")
  })

  it("должен отображать разные вкладки", async () => {
    const { useBrowserState } = await import("../../services/browser-state-provider")

    // Тест для вкладки music
    vi.mocked(useBrowserState).mockReturnValue({
      activeTab: "music",
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        viewMode: "list",
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
    })

    render(<BrowserContent />)
    expect(screen.getByTestId("tabs-content-music")).toBeInTheDocument()
    expect(screen.getByTestId("music-list")).toBeInTheDocument()
  })
})
