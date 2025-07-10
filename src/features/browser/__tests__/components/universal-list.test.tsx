import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { UniversalList } from "../../components/universal-list"

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "ru" },
  }),
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      viewMode: "grid",
      sortBy: "name",
      filterType: "all",
      groupBy: null,
      sortOrder: "asc",
      previewSizeIndex: 1,
    },
  }),
}))

vi.mock("@/features/media/utils/preview-sizes", () => ({
  PREVIEW_SIZES: [
    { key: "small", width: 160, height: 90 },
    { key: "medium", width: 240, height: 135 },
    { key: "large", width: 320, height: 180 },
  ],
}))

vi.mock("../../utils", () => ({
  filterItems: (items: any[]) => items,
  sortItems: (items: any[]) => items,
  groupItems: (_items: any[]) => [],
}))

vi.mock("../../components/content-group", () => ({
  ContentGroup: () => <div data-testid="content-group">Content Group</div>,
}))

vi.mock("../../components/no-files", () => ({
  NoFiles: ({ contentType }: any) => <div data-testid="no-files">No files for {contentType}</div>,
}))

describe("UniversalList", () => {
  const mockAdapter = {
    useData: () => ({ items: [], loading: false, error: null }),
    getSearchableText: (item: any) => [item.name],
    getSortValue: (item: any) => item.name,
    matchesFilter: () => true,
    isFavorite: () => false,
    getGroupValue: () => "default",
    favoriteType: "media",
    importHandlers: undefined,
    PreviewComponent: () => null,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Состояния рендеринга", () => {
    it("должен показывать индикатор загрузки", () => {
      const loadingAdapter = {
        ...mockAdapter,
        useData: () => ({ items: [], loading: true, error: null }),
      }

      render(<UniversalList adapter={loadingAdapter} />)

      expect(screen.getByText("common.loading")).toBeInTheDocument()
    })

    it("должен показывать ошибку", () => {
      const errorAdapter = {
        ...mockAdapter,
        useData: () => ({
          items: [],
          loading: false,
          error: new Error("Test error"),
        }),
      }

      render(<UniversalList adapter={errorAdapter} />)

      expect(screen.getByText(/common.error/)).toBeInTheDocument()
      expect(screen.getByText(/Test error/)).toBeInTheDocument()
    })

    it("должен показывать NoFiles когда список пуст", () => {
      render(<UniversalList adapter={mockAdapter} />)

      expect(screen.getByTestId("no-files")).toBeInTheDocument()
    })
  })
})
