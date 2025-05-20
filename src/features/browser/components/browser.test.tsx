import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { Browser } from "./browser"

// Мокаем xstate
vi.mock("xstate", () => ({
  createMachine: vi.fn(),
  createActor: vi.fn(),
  setup: vi.fn(),
  fromPromise: vi.fn().mockReturnValue({
    onDone: vi.fn().mockReturnValue({
      run: vi.fn(),
    }),
  }),
  assign: vi.fn().mockImplementation((fn) => fn),
}))

// Мокаем useMachine
vi.mock("@xstate/react", () => ({
  useMachine: () => [
    {
      context: {
        musicFiles: [],
        filteredFiles: [],
        searchQuery: "",
        sortBy: "name",
        sortOrder: "asc",
        filterType: "all",
        viewMode: "list",
        groupBy: "none",
        availableExtensions: [],
        showFavoritesOnly: false,
      },
      matches: vi.fn().mockReturnValue(true),
      can: vi.fn().mockReturnValue(true),
    },
    vi.fn(),
  ],
}))

// Мокаем ResourcesProvider
vi.mock("@/features/browser/resources/resources-provider", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useResources: () => ({
    getResourcePath: vi.fn(),
    getResourceUrl: vi.fn(),
    getResourceThumbnail: vi.fn(),
    getResourceMetadata: vi.fn(),
    addMusic: vi.fn(),
    removeResource: vi.fn(),
    mediaResources: [],
    musicResources: [],
    effectsResources: [],
    filtersResources: [],
    transitionsResources: [],
    templatesResources: [],
    isMusicFileAdded: vi.fn().mockReturnValue(false),
  }),
}))

// Мокаем resources-machine
vi.mock("@/features/browser/resources/resources-machine", () => ({
  resourcesMachine: {
    createMachine: vi.fn(),
  },
}))

// Мокаем MediaProvider
vi.mock("@/features/browser/media", () => ({
  MediaProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
    toggleFavorite: vi.fn(),
    currentAudio: null,
    isPlaying: false,
    playAudio: vi.fn(),
    pauseAudio: vi.fn(),
  }),
}))

// Мокаем компоненты preview
vi.mock("@/features/browser/components/preview/audio-preview", () => ({
  AudioPreview: vi.fn(() => (
    <div data-testid="audio-preview">AudioPreview</div>
  )),
}))

vi.mock("@/features/browser/components/preview/video-preview", () => ({
  VideoPreview: vi.fn(() => (
    <div data-testid="video-preview">VideoPreview</div>
  )),
}))

vi.mock("@/features/browser/components/preview/image-preview", () => ({
  ImagePreview: vi.fn(() => (
    <div data-testid="image-preview">ImagePreview</div>
  )),
}))

// Мокаем компоненты Lucide
vi.mock("lucide-react", () => ({
  Image: vi.fn(() => <div data-testid="image-icon">Image</div>),
  Music: vi.fn(() => <div data-testid="music-icon">Music</div>),
  Sparkles: vi.fn(() => <div data-testid="sparkles-icon">Sparkles</div>),
  Blend: vi.fn(() => <div data-testid="blend-icon">Blend</div>),
  FlipHorizontal2: vi.fn(() => (
    <div data-testid="flip-horizontal-icon">FlipHorizontal2</div>
  )),
  Grid2X2: vi.fn(() => <div data-testid="grid-icon">Grid2X2</div>),
  File: vi.fn(() => <div data-testid="file-icon">File</div>),
  Mic: vi.fn(() => <div data-testid="mic-icon">Mic</div>),
  Play: vi.fn(() => <div data-testid="play-icon">Play</div>),
  Pause: vi.fn(() => <div data-testid="pause-icon">Pause</div>),
  Heart: vi.fn(() => <div data-testid="heart-icon">Heart</div>),
  Search: vi.fn(() => <div data-testid="search-icon">Search</div>),
  SortAsc: vi.fn(() => <div data-testid="sort-asc-icon">SortAsc</div>),
  SortDesc: vi.fn(() => <div data-testid="sort-desc-icon">SortDesc</div>),
  Grid: vi.fn(() => <div data-testid="grid-icon">Grid</div>),
  List: vi.fn(() => <div data-testid="list-icon">List</div>),
  Folder: vi.fn(() => <div data-testid="folder-icon">Folder</div>),
  FolderOpen: vi.fn(() => <div data-testid="folder-open-icon">FolderOpen</div>),
  Plus: vi.fn(() => <div data-testid="plus-icon">Plus</div>),
  X: vi.fn(() => <div data-testid="x-icon">X</div>),
  ChevronDown: vi.fn(() => (
    <div data-testid="chevron-down-icon">ChevronDown</div>
  )),
  ChevronUp: vi.fn(() => <div data-testid="chevron-up-icon">ChevronUp</div>),
  ChevronLeft: vi.fn(() => (
    <div data-testid="chevron-left-icon">ChevronLeft</div>
  )),
  ChevronRight: vi.fn(() => (
    <div data-testid="chevron-right-icon">ChevronRight</div>
  )),
  Star: vi.fn(() => <div data-testid="star-icon">Star</div>),
  Grid2x2: vi.fn(() => <div data-testid="grid2x2-icon">Grid2x2</div>),
  Check: vi.fn(() => <div data-testid="check-icon">Check</div>),
  Filter: vi.fn(() => <div data-testid="filter-icon">Filter</div>),
  ListFilterPlus: vi.fn(() => (
    <div data-testid="list-filter-plus-icon">ListFilterPlus</div>
  )),
  ArrowDownUp: vi.fn(() => (
    <div data-testid="arrow-down-up-icon">ArrowDownUp</div>
  )),
  ArrowUpDown: vi.fn(() => (
    <div data-testid="arrow-up-down-icon">ArrowUpDown</div>
  )),
}))

// Мокаем modal-machine
vi.mock("@/features/modals/services/modal-machine", () => ({
  modalMachine: {
    createMachine: vi.fn(),
  },
}))

// Мокаем modal-provider
const mockOpenModal = vi.fn()
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}))

// Мокаем компоненты UI
vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, value, onValueChange }: any) => (
    <div data-testid="tabs" data-value={value}>
      {children}
      <div
        data-testid="tabs-value-change"
        onClick={() => onValueChange("music")}
      >
        Change Value
      </div>
    </div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, className }: any) => (
    <div
      data-testid={`tab-trigger-${value}`}
      data-value={value}
      className={className}
    >
      {children}
    </div>
  ),
  TabsContent: ({ children, value, className }: any) => (
    <div
      data-testid={`tab-content-${value}`}
      data-value={value}
      className={className}
    >
      {children}
    </div>
  ),
}))

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.tabs.media": "Media",
        "browser.tabs.music": "Music",
        "browser.tabs.effects": "Effects",
        "browser.tabs.filters": "Filters",
        "browser.tabs.transitions": "Transitions",
        "browser.tabs.templates": "Templates",
      }
      return translations[key] || key
    },
    i18n: {
      changeLanguage: vi.fn(),
      language: "ru",
    },
  }),
  // Добавляем initReactI18next
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
  // Добавляем I18nextProvider
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Мокаем компоненты вкладок
vi.mock("./tabs", () => ({
  MusicList: () => <div data-testid="music-list">Music List</div>,
  TransitionsList: () => (
    <div data-testid="transitions-list">Transitions List</div>
  ),
  EffectsList: () => <div data-testid="effects-list">Effects List</div>,
  EffectList: () => <div data-testid="effect-list">Effect List</div>,
  FiltersList: () => <div data-testid="filters-list">Filters List</div>,
  FilterList: () => <div data-testid="filter-list">Filter List</div>,
  SubtitlesList: () => <div data-testid="subtitles-list">Subtitles List</div>,
  TemplateList: () => <div data-testid="template-list">Template List</div>,
  MediaList: () => <div data-testid="media-list">Media List</div>,
  MediaListProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}))

describe("Browser", () => {
  // Очищаем моки перед каждым тестом
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should render all tabs", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все вкладки отображаются
    expect(screen.getByTestId("tab-trigger-media")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-music")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tab-trigger-templates")).toBeInTheDocument()

    // Проверяем, что все содержимое вкладок отображается
    expect(screen.getByTestId("tab-content-media")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-music")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-transitions")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-effects")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-subtitles")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-filters")).toBeInTheDocument()
    expect(screen.getByTestId("tab-content-templates")).toBeInTheDocument()
  })

  it("should render tab labels correctly", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все метки вкладок отображаются правильно
    // Используем getAllByText, так как текст может встречаться несколько раз
    expect(screen.getAllByText("Media").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Music").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Effects").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Filters").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Transitions").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Templates").length).toBeGreaterThan(0)
  })

  it("should render tab icons correctly", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все иконки вкладок отображаются
    expect(screen.getByTestId("image-icon")).toBeInTheDocument()
    expect(screen.getByTestId("music-icon")).toBeInTheDocument()
    expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument()
    expect(screen.getByTestId("blend-icon")).toBeInTheDocument()
    expect(screen.getByTestId("flip-horizontal-icon")).toBeInTheDocument()
    expect(screen.getByTestId("grid-icon")).toBeInTheDocument()
  })

  it('should have "media" as default active tab', () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что вкладка "media" активна по умолчанию
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")
  })

  it("should change active tab when tab is clicked", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем начальное значение
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "media")

    // Кликаем на элемент, который вызывает onValueChange с 'music'
    fireEvent.click(screen.getByTestId("tabs-value-change"))

    // Проверяем, что активная вкладка изменилась
    expect(screen.getByTestId("tabs")).toHaveAttribute("data-value", "music")
  })

  it("should apply correct styles to tab triggers", () => {
    // Рендерим компонент
    render(<Browser />)

    // Проверяем, что все триггеры вкладок имеют правильные стили
    const expectedStyles =
      "text-xs text-gray-800 dark:bg-[#1b1a1f] border-none " +
      "bg-gray-200 data-[state=active]:bg-secondary data-[state=active]:text-[#38dacac3] " +
      "dark:data-[state=active]:bg-secondary dark:data-[state=active]:text-[#35d1c1] " +
      "hover:text-gray-800 dark:text-gray-400 dark:hover:bg-secondary dark:hover:text-gray-100 " +
      "border-1 border-transparent flex flex-col items-center justify-center gap-1 py-2 " +
      "[&>svg]:data-[state=active]:text-[#38dacac3] cursor-pointer data-[state=active]:cursor-default rounded-none"

    expect(screen.getByTestId("tab-trigger-media")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-music")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-effects")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-filters")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-transitions")).toHaveAttribute(
      "class",
      expectedStyles,
    )
    expect(screen.getByTestId("tab-trigger-templates")).toHaveAttribute(
      "class",
      expectedStyles,
    )
  })
})
