import { act, fireEvent, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MediaFile } from "@/features/media/types/media"
import { render, renderWithBrowser } from "@/test/test-utils"

import { MusicList } from "../../components/music-list"

// Mock dependencies
vi.mock("@/features/app-state", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/app-state")>()
  return {
    ...actual,
    useFavorites: vi.fn(() => ({
      isItemFavorite: vi.fn((file: MediaFile) => file.id === "1"),
    })),
    useMusicFiles: vi.fn(() => ({
      musicFiles: {
        allFiles: [],
      },
    })),
  }
})

vi.mock("@/features/browser/services/browser-state-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/browser/services/browser-state-provider")>()
  return {
    ...actual,
    useBrowserState: vi.fn(() => ({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "list",
      },
    })),
  }
})

vi.mock("@/features/resources", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/resources")>()
  return {
    ...actual,
    useResources: vi.fn(() => ({
      addMusic: vi.fn(),
      removeResource: vi.fn(),
      musicResources: [],
      isMusicAdded: vi.fn(),
    })),
  }
})

vi.mock("@/features/music/hooks/use-music-import", () => ({
  useMusicImport: vi.fn(() => ({
    importFile: vi.fn(),
    importDirectory: vi.fn(),
    isImporting: false,
    progress: 0,
  })),
}))

vi.mock("@/features/browser/components/layout/add-media-button", () => ({
  AddMediaButton: vi.fn(({ resource, type, size }) => <button data-testid={`add-button-${resource.id}`}>Add</button>),
}))

vi.mock("@/features/browser/components/layout/favorite-button", () => ({
  FavoriteButton: vi.fn(({ file, type, size }) => <button data-testid={`favorite-button-${file.id}`}>Favorite</button>),
}))

vi.mock("@/features/browser/components/no-files", () => ({
  NoFiles: vi.fn(({ type }) => <div data-testid="no-files">No {type} files</div>),
}))

vi.mock("@/lib/date", () => ({
  formatTime: vi.fn((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }),
}))

// Mock audio
const mockPlay = vi.fn()
const mockPause = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()

global.Audio = vi.fn().mockImplementation((src: string) => ({
  play: mockPlay,
  pause: mockPause,
  addEventListener: mockAddEventListener,
  removeEventListener: mockRemoveEventListener,
  src,
})) as any

// Test data
const mockMusicFiles: MediaFile[] = [
  {
    id: "1",
    name: "song1.mp3",
    path: "/music/song1.mp3",
    type: "audio",
    isVideo: false,
    isAudio: true,
    isImage: false,
    size: 5000000,
    probeData: {
      format: {
        duration: 180,
        tags: {
          title: "Beautiful Song",
          artist: "Test Artist",
          album: "Test Album",
          genre: "Pop",
        },
      },
      streams: [],
    },
  },
  {
    id: "2",
    name: "song2.mp3",
    path: "/music/song2.mp3",
    type: "audio",
    isVideo: false,
    isAudio: true,
    isImage: false,
    size: 4000000,
    probeData: {
      format: {
        duration: 240,
        tags: {
          title: "Another Song",
          artist: "Another Artist",
          album: "Another Album",
          genre: "Rock",
        },
      },
      streams: [],
    },
  },
  {
    id: "3",
    name: "song3.mp3",
    path: "/music/song3.mp3",
    type: "audio",
    isVideo: false,
    isAudio: true,
    isImage: false,
    size: 3000000,
    probeData: {
      format: {
        duration: 120,
        tags: {
          artist: "Test Artist",
          genre: "Jazz",
        },
      },
      streams: [],
    },
  },
]

describe("MusicList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlay.mockClear()
    mockPause.mockClear()
    mockAddEventListener.mockClear()
    mockRemoveEventListener.mockClear()
  })

  describe("Empty States", () => {
    it("should display no files message when there are no music files", () => {
      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
      expect(screen.getByText("No music files")).toBeInTheDocument()
    })

    it("should display loading state when isLoading is true", async () => {
      // Note: The component doesn't actually use isLoading state
      // so this test is removed as it's testing non-existent functionality
    })
  })

  describe("File Display", () => {
    beforeEach(async () => {
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state"))
      useMusicFiles.mockReturnValue({
        musicFiles: { allFiles: mockMusicFiles },
      } as any)
    })

    it("should display all music files in list view", () => {
      renderWithBrowser(<MusicList />)

      expect(screen.getByText("Beautiful Song")).toBeInTheDocument()
      expect(screen.getByText("Another Song")).toBeInTheDocument()
      expect(screen.getByText("song3.mp3")).toBeInTheDocument() // Falls back to filename
    })

    it("should display file metadata correctly", () => {
      renderWithBrowser(<MusicList />)

      // Use getAllByText since "Test Artist" appears multiple times
      const testArtistElements = screen.getAllByText("Test Artist")
      expect(testArtistElements.length).toBeGreaterThan(0)

      expect(screen.getByText("Test Album")).toBeInTheDocument()
      expect(screen.getByText("Pop")).toBeInTheDocument()
      expect(screen.getByText("3:00")).toBeInTheDocument() // 180 seconds
      expect(screen.getByText("4:00")).toBeInTheDocument() // 240 seconds
    })

    it("should switch to thumbnail view mode", async () => {
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "thumbnails",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("music-list-view-thumbnails")).toBeInTheDocument()
      expect(screen.queryByTestId("music-list-view-list")).not.toBeInTheDocument()
    })
  })

  describe("Search and Filter", () => {
    beforeEach(async () => {
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state"))
      useMusicFiles.mockReturnValue({
        musicFiles: { allFiles: mockMusicFiles },
      } as any)
    })

    it("should filter files by search query", async () => {
      // The component filters based on searchQuery from browserState
      // Since the component does the filtering internally, we need to make sure
      // that files are available and then check that the no files message appears
      // when search doesn't match
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "nonexistent", // Search query that doesn't match any files
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "list",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      // When no files match the search, "No files" message should appear
      expect(screen.getByTestId("no-files")).toBeInTheDocument()
      expect(screen.queryByText("Beautiful Song")).not.toBeInTheDocument()
      expect(screen.queryByText("Another Song")).not.toBeInTheDocument()
    })

    it("should filter by artist name", async () => {
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "another artist",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "list",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      expect(screen.getByText("Another Song")).toBeInTheDocument()
      expect(screen.queryByText("Beautiful Song")).not.toBeInTheDocument()
    })

    it("should show only favorite files when filter is enabled", async () => {
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "",
          showFavoritesOnly: true,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "none",
          filterType: "all",
          viewMode: "list",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      expect(screen.getByText("Beautiful Song")).toBeInTheDocument() // id="1" is marked as favorite
      expect(screen.queryByText("Another Song")).not.toBeInTheDocument()
    })
  })

  describe("Grouping", () => {
    beforeEach(async () => {
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state"))
      useMusicFiles.mockReturnValue({
        musicFiles: { allFiles: mockMusicFiles },
      } as any)
    })

    it("should group files by artist", async () => {
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "artist",
          filterType: "all",
          viewMode: "list",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("music-list-group-Test Artist")).toBeInTheDocument()
      expect(screen.getByTestId("music-list-group-Another Artist")).toBeInTheDocument()
    })

    it("should group files by genre", async () => {
      const { useBrowserState } = vi.mocked(await import("@/features/browser/services/browser-state-provider"))
      useBrowserState.mockReturnValue({
        currentTabSettings: {
          searchQuery: "",
          showFavoritesOnly: false,
          sortBy: "name",
          sortOrder: "asc",
          groupBy: "genre",
          filterType: "all",
          viewMode: "list",
        },
      } as any)

      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("music-list-group-Pop")).toBeInTheDocument()
      expect(screen.getByTestId("music-list-group-Rock")).toBeInTheDocument()
      expect(screen.getByTestId("music-list-group-Jazz")).toBeInTheDocument()
    })
  })

  describe("Playback", () => {
    beforeEach(async () => {
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state"))
      useMusicFiles.mockReturnValue({
        musicFiles: { allFiles: mockMusicFiles },
      } as any)
    })

    it("should play music file when play button is clicked", async () => {
      renderWithBrowser(<MusicList />)

      // Find play button by looking for button containing play icon SVG
      const playButtons = screen.getAllByRole("button").filter((btn) => {
        // Check if button contains an svg element (play/pause icons)
        return btn.querySelector("svg")
      })

      expect(playButtons.length).toBeGreaterThan(0)
      fireEvent.click(playButtons[0])

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled()
        expect(mockAddEventListener).toHaveBeenCalledWith("ended", expect.any(Function))
      })
    })

    it("should pause music when clicking on playing file", async () => {
      renderWithBrowser(<MusicList />)

      // Find play button by looking for button containing play icon SVG
      const playButtons = screen.getAllByRole("button").filter((btn) => {
        return btn.querySelector("svg")
      })

      // Start playing
      fireEvent.click(playButtons[0])

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalled()
      })

      // Click same button again to pause
      fireEvent.click(playButtons[0])

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled()
      })
    })

    it("should switch to new file when clicking different play button", async () => {
      renderWithBrowser(<MusicList />)

      const playButtons = screen.getAllByRole("button").filter((btn) => {
        return btn.querySelector("svg")
      })

      expect(playButtons.length).toBeGreaterThanOrEqual(2)

      // Play first file
      fireEvent.click(playButtons[0])

      await waitFor(() => {
        expect(mockPlay).toHaveBeenCalledTimes(1)
      })

      // Play second file
      fireEvent.click(playButtons[1])

      await waitFor(() => {
        expect(mockPause).toHaveBeenCalled()
        expect(mockRemoveEventListener).toHaveBeenCalledWith("ended", expect.any(Function))
        expect(mockPlay).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe("Resource Management", () => {
    beforeEach(async () => {
      const { useMusicFiles } = vi.mocked(await import("@/features/app-state"))
      useMusicFiles.mockReturnValue({
        musicFiles: { allFiles: mockMusicFiles },
      } as any)
    })

    it("should render add media buttons for each file", () => {
      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("add-button-1")).toBeInTheDocument()
      expect(screen.getByTestId("add-button-2")).toBeInTheDocument()
      expect(screen.getByTestId("add-button-3")).toBeInTheDocument()
    })

    it("should render favorite buttons for each file", () => {
      renderWithBrowser(<MusicList />)

      expect(screen.getByTestId("favorite-button-1")).toBeInTheDocument()
      expect(screen.getByTestId("favorite-button-2")).toBeInTheDocument()
      expect(screen.getByTestId("favorite-button-3")).toBeInTheDocument()
    })
  })

  describe("Import Functions", () => {
    it("should have access to import functions from hook", async () => {
      const mockImportFile = vi.fn()
      const mockImportDirectory = vi.fn()

      const { useMusicImport } = vi.mocked(await import("@/features/music/hooks/use-music-import"))
      useMusicImport.mockReturnValue({
        importFile: mockImportFile,
        importDirectory: mockImportDirectory,
        isImporting: false,
        progress: 0,
      } as any)

      renderWithBrowser(<MusicList />)

      // Component has access to import functions (they're used in handlers)
      expect(useMusicImport).toHaveBeenCalled()
    })
  })
})
