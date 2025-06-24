import { vi } from "vitest"

// Мокаем зависимости для тестов фильтров
vi.mock("@/features/app-state", () => ({
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn((item: any, type: string) => type === "filter" && item.id === "favorite-filter"),
  })),
}))

vi.mock("@/features/filters/components/filter-preview", () => ({
  FilterPreview: ({ filter, onClick, size, previewWidth, previewHeight }: any) => (
    <div 
      data-testid="filter-preview" 
      onClick={onClick}
      style={{ width: previewWidth || size, height: previewHeight || size }}
    >
      {filter.name}
    </div>
  ),
}))

vi.mock("@/features/filters/hooks/use-filters", () => ({
  useFilters: vi.fn(() => ({
    filters: [],
    loading: false,
    error: null,
  })),
}))