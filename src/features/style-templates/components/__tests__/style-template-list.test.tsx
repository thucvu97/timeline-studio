import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithBrowser } from "@/test/test-utils"

import { StyleTemplateList } from "../style-template-list"

// Mock template data
const mockTemplates = [
  {
    id: "modern-intro-1",
    name: { ru: "Современное интро", en: "Modern Intro" },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 3,
    hasText: true,
    hasAnimation: true,
    thumbnail: "intro1.jpg",
    tags: { ru: ["интро", "современный"], en: ["intro", "modern"] },
    elements: [],
  },
  {
    id: "minimal-outro-1",
    name: { ru: "Минималистичная концовка", en: "Minimal Outro" },
    category: "outro",
    style: "minimal",
    aspectRatio: "16:9",
    duration: 4,
    hasText: true,
    hasAnimation: true,
    thumbnail: "outro1.jpg",
    tags: { ru: ["концовка", "минимализм"], en: ["outro", "minimal"] },
    elements: [],
  },
  {
    id: "corporate-lower-third-1",
    name: { ru: "Корпоративная нижняя треть", en: "Corporate Lower Third" },
    category: "lower-third",
    style: "corporate",
    aspectRatio: "16:9",
    duration: 5,
    hasText: true,
    hasAnimation: true,
    thumbnail: "lower1.jpg",
    tags: { ru: ["нижняя треть", "корпоративный"], en: ["lower-third", "corporate"] },
    elements: [],
  },
]

// Mock the hooks
const mockUseStyleTemplates = vi.fn()
const mockUseFavorites = vi.fn()
const mockUseBrowserState = vi.fn()
const mockUseProjectSettings = vi.fn()

vi.mock("../../hooks", () => ({
  useStyleTemplates: () => mockUseStyleTemplates(),
}))

vi.mock("@/features/app-state", () => ({
  useFavorites: () => mockUseFavorites(),
  useCurrentProject: () => ({
    currentProject: {
      name: "Test Project",
      path: "/test/project.tlsp",
      timeline: { tracks: [], duration: 0 },
    },
    setProjectDirty: vi.fn(),
  }),
  useAppSettings: () => ({
    getUserSettings: vi.fn().mockReturnValue({
      browserSettings: null,
      theme: "light",
      language: "en",
    }),
    updateUserSettings: vi.fn(),
  }),
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: () => mockUseBrowserState(),
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => mockUseProjectSettings(),
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
}))

describe("StyleTemplateList", () => {
  beforeEach(() => {
    // Reset all mocks with default values
    mockUseStyleTemplates.mockReturnValue({
      templates: mockTemplates,
      loading: false,
      error: null,
      filteredTemplates: mockTemplates,
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    })

    mockUseFavorites.mockReturnValue({
      favorites: {
        "style-template": [],
      },
    })

    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    mockUseProjectSettings.mockReturnValue({
      settings: {
        aspectRatio: {
          value: { width: 1920, height: 1080 },
        },
      },
    })
  })

  it("should render the template list with all templates", () => {
    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText("Современное интро")).toBeInTheDocument()
    expect(screen.getByText("Минималистичная концовка")).toBeInTheDocument()
    expect(screen.getByText("Корпоративная нижняя треть")).toBeInTheDocument()
  })

  it("should show loading state", () => {
    mockUseStyleTemplates.mockReturnValue({
      templates: [],
      loading: true,
      error: null,
      filteredTemplates: [],
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText(/common.loading/i)).toBeInTheDocument()
  })

  it("should show error state", () => {
    mockUseStyleTemplates.mockReturnValue({
      templates: [],
      loading: false,
      error: "Failed to load templates",
      filteredTemplates: [],
      setFilter: vi.fn(),
      setSorting: vi.fn(),
      getTemplateById: vi.fn(),
      getTemplatesByCategory: vi.fn(),
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText(/styleTemplates.error/i)).toBeInTheDocument()
    expect(screen.getByText("Failed to load templates")).toBeInTheDocument()
  })

  it("should filter templates by search query", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "минимал",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText("Минималистичная концовка")).toBeInTheDocument()
    expect(screen.queryByText("Современное интро")).not.toBeInTheDocument()
  })

  it("should filter templates by category", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "intro",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText("Современное интро")).toBeInTheDocument()
    expect(screen.queryByText("Минималистичная концовка")).not.toBeInTheDocument()
    expect(screen.queryByText("Корпоративная нижняя треть")).not.toBeInTheDocument()
  })

  it("should filter templates by style", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "corporate",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText("Корпоративная нижняя треть")).toBeInTheDocument()
    expect(screen.queryByText("Современное интро")).not.toBeInTheDocument()
    expect(screen.queryByText("Минималистичная концовка")).not.toBeInTheDocument()
  })

  it("should show favorites only when enabled", async () => {
    mockUseFavorites.mockReturnValue({
      favorites: {
        template: [{ id: "modern-intro-1", path: "", name: "Современное интро" }],
      },
    })

    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: true,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText("Современное интро")).toBeInTheDocument()
    expect(screen.queryByText("Минималистичная концовка")).not.toBeInTheDocument()
  })

  it("should sort templates by duration", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "duration",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    const templateNames = screen.getAllByText(/интро|концовка|треть/).map((el) => el.textContent)
    expect(templateNames[0]).toContain("Современное интро") // 3s
    expect(templateNames[1]).toContain("Минималистичная концовка") // 4s
    expect(templateNames[2]).toContain("Корпоративная нижняя треть") // 5s
  })

  it("should group templates by category", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "category",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    // Check that category titles are shown
    expect(screen.getByText(/styleTemplates.categories.intro/)).toBeInTheDocument()
    expect(screen.getByText(/styleTemplates.categories.outro/)).toBeInTheDocument()
    expect(screen.getByText(/styleTemplates.categories.lower-third/)).toBeInTheDocument()
  })

  it("should group templates by style", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "style",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    // Check that style titles are shown
    expect(screen.getByText(/styleTemplates.styles.modern/)).toBeInTheDocument()
    expect(screen.getByText(/styleTemplates.styles.minimal/)).toBeInTheDocument()
    expect(screen.getByText(/styleTemplates.styles.corporate/)).toBeInTheDocument()
  })

  it("should group templates by duration", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "duration",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    // Check that duration group titles are shown
    expect(screen.getByText(/styleTemplates.duration.short/)).toBeInTheDocument()
    expect(screen.getByText(/styleTemplates.duration.medium/)).toBeInTheDocument()
  })

  it("should calculate preview dimensions based on aspect ratio", () => {
    mockUseProjectSettings.mockReturnValue({
      settings: {
        aspectRatio: {
          value: { width: 1080, height: 1920 }, // Vertical video
        },
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    // Component should render without errors with vertical aspect ratio
    expect(screen.getByText("Современное интро")).toBeInTheDocument()
  })

  it("should show no results message when filtered list is empty", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "nonexistent",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText(/common.noResults/)).toBeInTheDocument()
  })

  it("should show no favorites message when showing favorites only with empty list", async () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: true,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 2,
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    expect(screen.getByText(/browser.media.noFavorites/)).toBeInTheDocument()
  })

  it("should handle template selection", async () => {
    const user = userEvent.setup()
    const consoleSpy = vi.spyOn(console, "log")

    renderWithBrowser(<StyleTemplateList />)

    const firstTemplate = screen.getByText("Современное интро").closest("div[class*='flex-col']")
    expect(firstTemplate).toBeInTheDocument()

    // Click on the template preview area
    const previewArea = firstTemplate?.querySelector("div[class*='group relative cursor-pointer']")
    if (previewArea) {
      await user.click(previewArea)
    }

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Выбран стилистический шаблон:", "modern-intro-1")
    })

    consoleSpy.mockRestore()
  })

  it("should render with different preview sizes", () => {
    mockUseBrowserState.mockReturnValue({
      currentTabSettings: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        previewSizeIndex: 0, // Small size
      },
    })

    renderWithBrowser(<StyleTemplateList />)

    // Should render with smaller preview size
    expect(screen.getByText("Современное интро")).toBeInTheDocument()
  })
})
