import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { resetTransitionsState } from "@/features/transitions/hooks/use-transitions"

import {
  useEffects,
  useFilters,
  useLoadingState,
  useResourceById,
  useResourcesByCategory,
  useResourcesByComplexity,
  useResourcesByTags,
  useResourcesSearch,
  useResourcesStats,
  useTransitions,
} from "../../hooks/use-resources"
import { EffectsProvider, resetEffectsProviderState } from "../../providers/effects-provider"

// Мокаем JSON файл с переходами
vi.mock("@/features/transitions/data/transitions.json", () => ({
  default: {
    transitions: [
      {
        id: "test-transition-1",
        type: "fade",
        labels: { ru: "Исчезновение", en: "Fade" },
        description: { ru: "Плавное исчезновение", en: "Smooth fade" },
        category: "basic",
        complexity: "basic",
        tags: ["smooth", "classic"],
        duration: { min: 0.1, max: 5, default: 1 },
      },
    ],
  },
}))

// Мокаем ленивые загрузчики ресурсов
vi.mock("../../services/resource-loaders", () => ({
  loadAllResourcesLazy: vi.fn().mockResolvedValue({
    effects: {
      success: true,
      data: [
        {
          id: "test-effect-1",
          name: "Test Effect 1",
          type: "blur",
          category: "artistic",
          complexity: "basic",
          tags: ["test", "popular"],
          description: { ru: "Тестовый эффект 1", en: "Test Effect 1" },
          ffmpegCommand: () => "blur=5",
          params: { intensity: 50 },
          previewPath: "/test1.mp4",
          labels: { en: "Test Effect 1", ru: "Тестовый эффект 1" },
        },
        {
          id: "test-effect-2",
          name: "Test Effect 2",
          type: "brightness",
          category: "color-correction",
          complexity: "intermediate",
          tags: ["test", "color"],
          description: { ru: "Тестовый эффект 2", en: "Test Effect 2" },
          ffmpegCommand: () => "brightness=0.1",
          params: { intensity: 75 },
          previewPath: "/test2.mp4",
          labels: { en: "Test Effect 2", ru: "Тестовый эффект 2" },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
    filters: {
      success: true,
      data: [
        {
          id: "test-filter-1",
          name: "Test Filter 1",
          category: "technical",
          complexity: "advanced",
          tags: ["log", "professional"],
          description: { ru: "Тестовый фильтр", en: "Test Filter" },
          labels: { en: "Test Filter", ru: "Тестовый фильтр" },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
    transitions: {
      success: true,
      data: [
        {
          id: "test-transition-1",
          type: "fade",
          labels: { ru: "Исчезновение", en: "Fade" },
          description: { ru: "Плавное исчезновение", en: "Smooth fade" },
          category: "basic",
          complexity: "basic",
          tags: ["smooth", "classic"],
          duration: { min: 0.1, max: 5, default: 1 },
        },
      ],
      source: "built-in",
      timestamp: Date.now(),
    },
  }),
}))

// Общая очистка состояния перед каждым тестом
beforeEach(async () => {
  vi.clearAllMocks()
  resetEffectsProviderState()
  resetTransitionsState()
  // Небольшая задержка для гарантии очистки состояния
  await new Promise(resolve => setTimeout(resolve, 10))
})

// Вспомогательная функция для ожидания загрузки провайдера
const waitForProviderReady = async () => {
  await waitFor(() => {
    expect(screen.getByTestId("loading")).toHaveTextContent("false")
  }, { timeout: 5000 })
  // Дополнительная задержка для стабильности
  await new Promise(resolve => setTimeout(resolve, 50))
}

describe("useEffects", () => {
  function TestComponent() {
    const { effects, loading } = useEffects()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="effects-count">{effects.length}</div>
        {effects.map((effect) => (
          <div key={effect.id} data-testid="effect-item">
            {effect.name}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать эффекты", async () => {
    render(
      <EffectsProvider key="useEffects-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("effects-count")).toHaveTextContent("2")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })
})

describe("useFilters", () => {
  function TestComponent() {
    const { filters, loading } = useFilters()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="filters-count">{filters.length}</div>
        {filters.map((filter) => (
          <div key={filter.id} data-testid="filter-item">
            {filter.name}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать фильтры", async () => {
    render(
      <EffectsProvider key="useFilters-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("filters-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Filter 1")).toBeInTheDocument()
  })
})

describe("useTransitions", () => {
  function TestComponent() {
    const { transitions, loading } = useTransitions()
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="transitions-count">{transitions.length}</div>
        {transitions.map((transition) => (
          <div key={transition.id} data-testid="transition-item">
            {transition.labels?.en}
          </div>
        ))}
      </div>
    )
  }

  it("должен загружать и возвращать переходы", async () => {
    render(
      <EffectsProvider key="useTransitions-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("transitions-count")).toHaveTextContent("1")
    expect(screen.getByText("Fade")).toBeInTheDocument()
  })
})

describe("useResourceById", () => {
  function TestComponent({ id }: { id: string }) {
    const { resource, loading } = useResourceById("effects", id)
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="resource-name">{resource?.name || "Not found"}</div>
      </div>
    )
  }

  it("должен находить ресурс по ID", async () => {
    render(
      <EffectsProvider key="useResourceById-found-test">
        <TestComponent id="test-effect-1" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resource-name")).toHaveTextContent("Test Effect 1")
  })

  it("должен возвращать null для несуществующего ID", async () => {
    render(
      <EffectsProvider key="useResourceById-notfound-test">
        <TestComponent id="non-existent" />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("resource-name")).toHaveTextContent("Not found")
  })
})

describe("useResourcesSearch", () => {
  function TestComponent({ options }: { options: any }) {
    const { results, loading } = useResourcesSearch("effects", options)
    return (
      <div>
        <div data-testid="loading">{String(loading)}</div>
        <div data-testid="results-count">{results.length}</div>
        {results.map((item) => (
          <div key={item.id} data-testid="search-result">
            {item.name}
          </div>
        ))}
      </div>
    )
  }


  it("должен выполнять поиск по запросу", async () => {
    render(
      <EffectsProvider key="search-query-test">
        <TestComponent options={{ query: "Effect 1" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по категории", async () => {
    render(
      <EffectsProvider key="search-category-test">
        <TestComponent options={{ category: "artistic" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по тегам", async () => {
    render(
      <EffectsProvider key="search-tags-test">
        <TestComponent options={{ tags: ["popular"] }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 1")).toBeInTheDocument()
  })

  it("должен фильтровать по сложности", async () => {
    render(
      <EffectsProvider key="search-complexity-test">
        <TestComponent options={{ complexity: "intermediate" }} />
      </EffectsProvider>,
    )

    await waitForProviderReady()

    expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    expect(screen.getByText("Test Effect 2")).toBeInTheDocument()
  })
})

describe("useResourcesByCategory", () => {
  function TestComponent({ category }: { category: string }) {
    const { results } = useResourcesByCategory("effects", category)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по категории", async () => {
    render(
      <EffectsProvider key="category-test">
        <TestComponent category="artistic" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useResourcesByTags", () => {
  function TestComponent({ tags }: { tags: string[] }) {
    const { results } = useResourcesByTags("effects", tags)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по тегам", async () => {
    render(
      <EffectsProvider key="tags-test">
        <TestComponent tags={["popular"]} />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useResourcesByComplexity", () => {
  function TestComponent({ complexity }: { complexity: string }) {
    const { results } = useResourcesByComplexity("effects", complexity)
    return (
      <div>
        <div data-testid="results-count">{results.length}</div>
      </div>
    )
  }

  it("должен возвращать ресурсы по сложности", async () => {
    render(
      <EffectsProvider key="complexity-test">
        <TestComponent complexity="basic" />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("results-count")).toHaveTextContent("1")
    })
  })
})

describe("useLoadingState", () => {
  function TestComponent() {
    const loadingState = useLoadingState()
    return (
      <div>
        <div data-testid="is-loading">{String(loadingState.isLoading)}</div>
        <div data-testid="progress">{loadingState.progress}</div>
        <div data-testid="loaded-sources">{loadingState.loadedSources.size}</div>
      </div>
    )
  }

  it("должен возвращать состояние загрузки", async () => {
    render(
      <EffectsProvider key="loading-state-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("is-loading")).toHaveTextContent("false")
    })

    expect(screen.getByTestId("loaded-sources")).toHaveTextContent("1")
  })
})

describe("useResourcesStats", () => {
  function TestComponent() {
    const stats = useResourcesStats()
    return (
      <div>
        <div data-testid="total">{stats.total}</div>
        <div data-testid="effects">{stats.byType.effects}</div>
        <div data-testid="filters">{stats.byType.filters}</div>
        <div data-testid="transitions">{stats.byType.transitions}</div>
      </div>
    )
  }

  it("должен возвращать статистику ресурсов", async () => {
    render(
      <EffectsProvider key="stats-test">
        <TestComponent />
      </EffectsProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("total")).toHaveTextContent("4")
    })

    expect(screen.getByTestId("effects")).toHaveTextContent("2")
    expect(screen.getByTestId("filters")).toHaveTextContent("1")
    expect(screen.getByTestId("transitions")).toHaveTextContent("1")
  })
})
