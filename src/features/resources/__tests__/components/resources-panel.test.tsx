import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ResourcesPanel } from "../../components/resources-panel"

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: vi.fn((key: string, fallback?: string) => {
      const translations: Record<string, string> = {
        "browser.tabs.media": "Media",
        "browser.tabs.music": "Music",
        "browser.tabs.subtitles": "Subtitles",
        "browser.tabs.effects": "Effects",
        "browser.tabs.filters": "Filters",
        "browser.tabs.transitions": "Transitions",
        "browser.tabs.templates": "Templates",
        "browser.tabs.styleTemplates": "Style Templates",
        "timeline.resources.title": "Resources",
        "timeline.resources.noResources": "No resources added",
        "templates.templateLabels.splitScreen": "Split Screen",
        "styleTemplates.modernIntro": "Modern Intro",
      }
      return translations[key] || fallback || key
    }),
  }),
}))

// Mock lucide-react icons
vi.mock("lucide-react", () => ({
  Blend: ({ className }: any) => <div data-testid="blend-icon" className={className} />,
  Clapperboard: ({ className }: any) => <div data-testid="clapperboard-icon" className={className} />,
  FlipHorizontal2: ({ className }: any) => <div data-testid="flip-horizontal-icon" className={className} />,
  Music: ({ className }: any) => <div data-testid="music-icon" className={className} />,
  Package: ({ className }: any) => <div data-testid="package-icon" className={className} />,
  Palette: ({ className }: any) => <div data-testid="palette-icon" className={className} />,
  Scissors: ({ className }: any) => <div data-testid="scissors-icon" className={className} />,
  Sparkles: ({ className }: any) => <div data-testid="sparkles-icon" className={className} />,
  Sticker: ({ className }: any) => <div data-testid="sticker-icon" className={className} />,
  Subtitles: ({ className }: any) => <div data-testid="subtitles-icon" className={className} />,
  Type: ({ className }: any) => <div data-testid="type-icon" className={className} />,
  Video: ({ className }: any) => <div data-testid="video-icon" className={className} />,
  X: ({ className }: any) => <div data-testid="x-icon" className={className} />,
}))

// Mock useResources hook
vi.mock("@/features/resources", () => ({
  useResources: vi.fn(),
}))

describe("ResourcesPanel", () => {
  const mockRemoveResource = vi.fn()

  const mockResources = {
    effectResources: [
      {
        id: "effect-1",
        type: "effect",
        name: "Blur Effect",
        resourceId: "blur-1",
        addedAt: Date.now(),
      },
      {
        id: "effect-2",
        type: "effect",
        name: "Glow Effect",
        resourceId: "glow-1",
        addedAt: Date.now(),
      },
    ],
    filterResources: [
      {
        id: "filter-1",
        type: "filter",
        name: "Vintage Filter",
        resourceId: "vintage-1",
        addedAt: Date.now(),
      },
    ],
    transitionResources: [],
    templateResources: [
      {
        id: "template-1",
        type: "template",
        name: "splitScreen",
        resourceId: "split-1",
        addedAt: Date.now(),
      },
    ],
    styleTemplateResources: [
      {
        id: "style-1",
        type: "styleTemplate",
        name: "modernIntro",
        resourceId: "modern-1",
        addedAt: Date.now(),
      },
    ],
    mediaResources: [],
    musicResources: [],
    subtitleResources: [],
    removeResource: mockRemoveResource,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { useResources } = vi.mocked(await import("@/features/resources"))
    useResources.mockReturnValue(mockResources)
  })

  describe("Basic rendering", () => {
    it("should render without crashing", () => {
      render(<ResourcesPanel />)

      expect(screen.getByText("Media")).toBeInTheDocument()
    })

    it("should render all resource categories", () => {
      render(<ResourcesPanel />)

      expect(screen.getByText("Media")).toBeInTheDocument()
      expect(screen.getByText("Music")).toBeInTheDocument()
      expect(screen.getByText("Subtitles")).toBeInTheDocument()
      expect(screen.getByText("Effects")).toBeInTheDocument()
      expect(screen.getByText("Filters")).toBeInTheDocument()
      expect(screen.getByText("Transitions")).toBeInTheDocument()
      expect(screen.getByText("Templates")).toBeInTheDocument()
      expect(screen.getByText("Style Templates")).toBeInTheDocument()
    })

    it("should render category icons", () => {
      render(<ResourcesPanel />)

      expect(screen.getByTestId("clapperboard-icon")).toBeInTheDocument() // Media category
      expect(screen.getByTestId("music-icon")).toBeInTheDocument()
      expect(screen.getByTestId("type-icon")).toBeInTheDocument()
      expect(screen.getByTestId("sparkles-icon")).toBeInTheDocument()
      expect(screen.getByTestId("blend-icon")).toBeInTheDocument()
      expect(screen.getByTestId("flip-horizontal-icon")).toBeInTheDocument()
      expect(screen.getAllByTestId("video-icon")).toHaveLength(2) // Templates category + template resource
      expect(screen.getAllByTestId("sticker-icon")).toHaveLength(2) // Style Templates category + style resource
    })
  })

  describe("Resource display", () => {
    it("should display resources with their names", () => {
      render(<ResourcesPanel />)

      expect(screen.getByText("Blur Effect")).toBeInTheDocument()
      expect(screen.getByText("Glow Effect")).toBeInTheDocument()
      expect(screen.getByText("Vintage Filter")).toBeInTheDocument()
      expect(screen.getByText("Split Screen")).toBeInTheDocument() // Translated template name
      expect(screen.getByText("Modern Intro")).toBeInTheDocument() // Translated style template name
    })

    it("should show resource count for categories with resources", () => {
      render(<ResourcesPanel />)

      expect(screen.getByText("(2)")).toBeInTheDocument() // Effects count
      expect(screen.getAllByText("(1)")).toHaveLength(3) // Filters, Templates, Style Templates count
    })

    it("should display appropriate icons for each resource type", () => {
      render(<ResourcesPanel />)

      // Effect resources should have package icons
      expect(screen.getAllByTestId("package-icon")).toHaveLength(2)

      // Filter resources should have palette icons
      expect(screen.getByTestId("palette-icon")).toBeInTheDocument()

      // Template resources should have video icons (1 for category + 1 for resource)
      expect(screen.getAllByTestId("video-icon")).toHaveLength(2)

      // Style template resources should have sticker icons
      expect(screen.getAllByTestId("sticker-icon")).toHaveLength(2)
    })

    it("should show 'no resources' message for empty categories", () => {
      render(<ResourcesPanel />)

      // Should show "No resources added" for categories with no resources
      const noResourcesMessages = screen.getAllByText("No resources added")
      expect(noResourcesMessages.length).toBeGreaterThan(0)
    })
  })

  describe("Empty state", () => {
    it("should handle all empty categories", async () => {
      const emptyResources = {
        effectResources: [],
        filterResources: [],
        transitionResources: [],
        templateResources: [],
        styleTemplateResources: [],
        mediaResources: [],
        musicResources: [],
        subtitleResources: [],
        removeResource: mockRemoveResource,
      }

      const { useResources } = vi.mocked(await import("@/features/resources"))
      useResources.mockReturnValue(emptyResources)

      render(<ResourcesPanel />)

      // All categories should show "No resources added"
      const noResourcesMessages = screen.getAllByText("No resources added")
      expect(noResourcesMessages).toHaveLength(8) // One for each category
    })

    it("should not show resource count for empty categories", async () => {
      const emptyResources = {
        effectResources: [],
        filterResources: [],
        transitionResources: [],
        templateResources: [],
        styleTemplateResources: [],
        mediaResources: [],
        musicResources: [],
        subtitleResources: [],
        removeResource: mockRemoveResource,
      }

      const { useResources } = vi.mocked(await import("@/features/resources"))
      useResources.mockReturnValue(emptyResources)

      render(<ResourcesPanel />)

      // Should not show any count indicators like (0), (1), etc.
      expect(screen.queryByText("(0)")).not.toBeInTheDocument()
      expect(screen.queryByText("(1)")).not.toBeInTheDocument()
      expect(screen.queryByText("(2)")).not.toBeInTheDocument()
    })
  })

  describe("Resource name translation", () => {
    it("should translate template names correctly", () => {
      render(<ResourcesPanel />)

      // Should translate template name using templates.templateLabels key
      expect(screen.getByText("Split Screen")).toBeInTheDocument()
    })

    it("should translate style template names correctly", () => {
      render(<ResourcesPanel />)

      // Should translate style template name using styleTemplates key
      expect(screen.getByText("Modern Intro")).toBeInTheDocument()
    })

    it("should show raw names for non-template resources", () => {
      render(<ResourcesPanel />)

      // Effect and filter names should not be translated
      expect(screen.getByText("Blur Effect")).toBeInTheDocument()
      expect(screen.getByText("Vintage Filter")).toBeInTheDocument()
    })
  })

  describe("Mixed resource states", () => {
    it("should handle mix of populated and empty categories", async () => {
      const mixedResources = {
        effectResources: [
          {
            id: "effect-1",
            type: "effect",
            name: "Test Effect",
            resourceId: "test-1",
            addedAt: Date.now(),
          },
        ],
        filterResources: [],
        transitionResources: [],
        templateResources: [],
        styleTemplateResources: [],
        mediaResources: [],
        musicResources: [],
        subtitleResources: [],
        removeResource: mockRemoveResource,
      }

      const { useResources } = vi.mocked(await import("@/features/resources"))
      useResources.mockReturnValue(mixedResources)

      render(<ResourcesPanel />)

      // Should show resource for effects
      expect(screen.getByText("Test Effect")).toBeInTheDocument()
      expect(screen.getByText("(1)")).toBeInTheDocument()

      // Should show "No resources added" for other categories
      const noResourcesMessages = screen.getAllByText("No resources added")
      expect(noResourcesMessages).toHaveLength(7) // 7 empty categories
    })
  })

  describe("Component structure", () => {
    it("should have correct CSS classes for styling", () => {
      render(<ResourcesPanel />)

      // Check main container structure exists
      const container = document.querySelector(".flex.h-full.flex-col.bg-background")
      expect(container).toBeInTheDocument()
    })

    it("should render scrollable container", () => {
      render(<ResourcesPanel />)

      // Should have scrollable container for resources
      const scrollContainer = document.querySelector(".overflow-y-auto")
      expect(scrollContainer).toBeInTheDocument()
    })

    it("should render resource items with proper styling", () => {
      render(<ResourcesPanel />)

      // Resource items should have specific styling classes
      const resourceItems = document.querySelectorAll(".cursor-pointer")
      expect(resourceItems.length).toBeGreaterThan(0)
    })
  })

  describe("Accessibility", () => {
    it("should have proper semantic structure", () => {
      render(<ResourcesPanel />)

      // Component should render categories
      expect(screen.getByText("Media")).toBeInTheDocument()
      expect(screen.getByText("Effects")).toBeInTheDocument()
    })

    it("should have readable text sizes", () => {
      render(<ResourcesPanel />)

      // Resource names should be visible
      expect(screen.getByText("Blur Effect")).toBeInTheDocument()
      expect(screen.getByText("Glow Effect")).toBeInTheDocument()
    })
  })

  describe("Resource deletion", () => {
    it("should show delete button on hover", () => {
      render(<ResourcesPanel />)

      // Delete buttons should exist but be hidden initially (opacity-0)
      const deleteButtons = screen.getAllByTestId("x-icon")
      expect(deleteButtons.length).toBeGreaterThan(0)

      // Check that delete buttons have the parent button element
      deleteButtons.forEach((icon) => {
        const button = icon.closest("button")
        expect(button).toBeInTheDocument()
        expect(button).toHaveClass("opacity-0")
      })
    })

    it("should call removeResource when delete button is clicked", () => {
      const { container } = render(<ResourcesPanel />)

      // Find first resource delete button
      const firstDeleteButton = container.querySelector("button.opacity-0")
      expect(firstDeleteButton).toBeInTheDocument()

      // Click the delete button
      if (firstDeleteButton) {
        firstDeleteButton.click()

        // Should have called removeResource with the correct ID
        expect(mockRemoveResource).toHaveBeenCalledTimes(1)
        expect(mockRemoveResource).toHaveBeenCalledWith("effect-1")
      }
    })

    it("should handle delete button clicks properly", () => {
      render(<ResourcesPanel />)

      // Find all delete buttons
      const deleteButtons = screen.getAllByTestId("x-icon")
      expect(deleteButtons.length).toBeGreaterThan(0)

      // Get the parent button of the first X icon
      const firstDeleteButton = deleteButtons[0].closest("button")
      expect(firstDeleteButton).toBeInTheDocument()

      // Reset mock
      mockRemoveResource.mockClear()

      // Click should work
      if (firstDeleteButton) {
        firstDeleteButton.click()
        expect(mockRemoveResource).toHaveBeenCalledTimes(1)
      }
    })
  })
})
