import { act, render, renderHook, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VideoEffect } from "@/features/effects/types"
import { VideoFilter } from "@/features/filters/types/filters"
import { MediaFile } from "@/features/media/types/media"
import { MediaTemplate } from "@/features/templates/lib/templates"
import { Transition } from "@/features/transitions/types/transitions"

import { ResourcesProvider, useResources } from "../../services/resources-provider"

// Мокаем backend-sync
const mockSendCommand = vi.fn()
const mockExecuteCommand = vi.fn().mockResolvedValue({ success: true })
vi.mock("@/features/app-state/services/backend-sync", () => ({
  getBackendSync: () => ({
    onStateChange: vi.fn(() => () => {}),
    sendCommand: mockSendCommand,
    executeCommand: mockExecuteCommand,
  }),
}))

// Мокаем console.log, console.error и console.warn
const logSpy = vi.spyOn(console, "log").mockImplementation(() => {})
const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

beforeEach(() => {
  vi.clearAllMocks()
  mockExecuteCommand.mockClear()
})

// Компонент-обертка для тестирования хука useResources
function ResourcesWrapper({ children }: { children: React.ReactNode }) {
  return <ResourcesProvider>{children}</ResourcesProvider>
}

// Тестовый компонент, который использует хук useResources
function TestComponent() {
  const {
    resources,
    effectResources,
    filterResources,
    transitionResources,
    templateResources,
    musicResources,
    mediaResources,
  } = useResources()

  return (
    <div>
      <div data-testid="resources-count">{resources.length}</div>
      <div data-testid="media-resources-count">{mediaResources.length}</div>
      <div data-testid="effect-resources-count">{effectResources.length}</div>
      <div data-testid="filter-resources-count">{filterResources.length}</div>
      <div data-testid="transition-resources-count">{transitionResources.length}</div>
      <div data-testid="template-resources-count">{templateResources.length}</div>
      <div data-testid="music-resources-count">{musicResources.length}</div>
    </div>
  )
}

describe("ResourcesProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExecuteCommand.mockClear()
  })

  it("should provide initial context values", () => {
    render(
      <ResourcesWrapper>
        <TestComponent />
      </ResourcesWrapper>,
    )

    expect(screen.getByTestId("resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("media-resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("effect-resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("filter-resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("transition-resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("template-resources-count")).toHaveTextContent("0")
    expect(screen.getByTestId("music-resources-count")).toHaveTextContent("0")
  })

  it("should have useResources hook", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    expect(result.current).toBeDefined()
    expect(result.current.resources).toBeDefined()
    expect(result.current.mediaResources).toBeDefined()
    expect(result.current.effectResources).toBeDefined()
    expect(result.current.filterResources).toBeDefined()
    expect(result.current.transitionResources).toBeDefined()
    expect(result.current.templateResources).toBeDefined()
    expect(result.current.musicResources).toBeDefined()
  })

  it("should provide correct methods for adding resources", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    expect(typeof result.current.addMedia).toBe("function")
    expect(typeof result.current.addEffect).toBe("function")
    expect(typeof result.current.addFilter).toBe("function")
    expect(typeof result.current.addTransition).toBe("function")
    expect(typeof result.current.addTemplate).toBe("function")
    expect(typeof result.current.addMusic).toBe("function")
  })

  it("should provide correct utility methods", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    expect(typeof result.current.getResourceById).toBe("function")
    expect(typeof result.current.getResourcesByType).toBe("function")
  })

  it("should have addEffect method", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    expect(result.current.addEffect).toBeDefined()
    expect(typeof result.current.addEffect).toBe("function")
  })

  it("should have addMusic method", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    expect(result.current.addMusic).toBeDefined()
    expect(typeof result.current.addMusic).toBe("function")
  })

  it("should call send with correct parameters when adding an effect", async () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    const mockEffect: VideoEffect = {
      id: "effect-1",
      name: "Test Effect",
      category: "color",
      description: "Test effect description",
      parameters: {},
      defaultIntensity: 1,
      preview: "test-preview.jpg",
      isPremium: false,
    }

    await act(async () => {
      await result.current.addEffect(mockEffect)
    })

    expect(console.warn).toHaveBeenCalledWith("Effect resources not yet integrated with backend")
  })

  it("should call send with correct parameters when adding a filter", async () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    const mockFilter: VideoFilter = {
      id: "filter-1",
      name: "Test Filter",
      category: "color",
      description: "Test filter description",
      value: "grayscale(100%)",
      preview: "test-preview.jpg",
    }

    await act(async () => {
      await result.current.addFilter(mockFilter)
    })

    expect(console.warn).toHaveBeenCalledWith("Filter resources not yet integrated with backend")
  })

  it("should call send with correct parameters when adding a transition", async () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    const mockTransition: Transition = {
      id: "transition-1",
      name: "Test Transition",
      type: "fade",
      durationMin: 500,
      durationMax: 2000,
      defaultDuration: 1000,
      easing: "linear",
      category: "basic",
      isPremium: false,
    }

    await act(async () => {
      await result.current.addTransition(mockTransition)
    })

    expect(console.warn).toHaveBeenCalledWith("Transition resources not yet integrated with backend")
  })

  it("should call send with correct parameters when adding a template", async () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    const mockTemplate: MediaTemplate = {
      id: "template-1",
      name: "Test Template",
      category: "basic",
      thumbnail: "test-thumbnail.jpg",
      minVideos: 2,
      maxVideos: 4,
      layout: {
        id: "layout-1",
        name: "Test Layout",
        type: "grid",
        positions: [],
      },
      preview: "test-preview.jpg",
    }

    await act(async () => {
      await result.current.addTemplate(mockTemplate)
    })

    expect(console.warn).toHaveBeenCalledWith("Template resources not yet integrated with backend")
  })

  it("should call send with correct parameters when adding a music file", async () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    const mockMusicFile: MediaFile = {
      id: "music-1",
      name: "Test Music.mp3",
      path: "/path/to/music.mp3",
      size: 1024,
      duration: 180,
      isVideo: false,
    }

    await act(async () => {
      await result.current.addMusic(mockMusicFile)
    })

    expect(mockExecuteCommand).toHaveBeenCalledWith({
      type: "AddMedia",
      params: { path: mockMusicFile.path, media_type: "Audio" },
    })
  })

  it("should provide resource arrays", () => {
    const { result } = renderHook(() => useResources(), {
      wrapper: ResourcesWrapper,
    })

    // Проверяем, что массивы ресурсов существуют
    expect(Array.isArray(result.current.effectResources)).toBe(true)
    expect(Array.isArray(result.current.filterResources)).toBe(true)
    expect(Array.isArray(result.current.transitionResources)).toBe(true)
    expect(Array.isArray(result.current.templateResources)).toBe(true)
    expect(Array.isArray(result.current.musicResources)).toBe(true)
  })
})
