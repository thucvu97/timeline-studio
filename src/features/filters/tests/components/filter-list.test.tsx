import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterList } from "../../filter-list";

// Мокаем useResources хук
vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addFilter: vi.fn(),
    removeResource: vi.fn(),
    isFilterAdded: vi.fn().mockReturnValue(false),
    filterResources: [],
  }),
}));

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}));

// Мокаем lucide-react иконки
vi.mock("lucide-react", () => ({
  Star: ({ className, strokeWidth }: any) => (
    <div data-testid="star-icon" data-classname={className} data-stroke-width={strokeWidth}>
      Star Icon
    </div>
  ),
  Plus: ({ className, strokeWidth }: any) => (
    <div data-testid="plus-icon" data-classname={className} data-stroke-width={strokeWidth}>
      Plus Icon
    </div>
  ),
}));

// Простые моки для тестирования
const mockFilters = [
  {
    id: "test-filter-1",
    name: "Test Filter 1",
    category: "color-correction",
    complexity: "basic",
    tags: ["professional"],
    labels: { ru: "Тест 1", en: "Test 1" },
    params: {},
  },
  {
    id: "test-filter-2",
    name: "Test Filter 2",
    category: "creative",
    complexity: "intermediate",
    tags: ["standard"],
    labels: { ru: "Тест 2", en: "Test 2" },
    params: {},
  },
];

// Простые моки
vi.mock("../../hooks/use-filters", () => ({
  useFilters: () => ({
    filters: mockFilters,
    loading: false,
    error: null,
    reload: vi.fn(),
    isReady: true,
  }),
}));

vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
  }),
}));

vi.mock("@/features/browser/state", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      previewSizeIndex: 2,
    },
  }),
}));

vi.mock("@/features/project/settings", () => ({
  useProjectSettings: () => ({
    settings: { video: { aspectRatio: "16:9" } },
  }),
}));

vi.mock("@/features/browser/components/layout/content-group", () => ({
  ContentGroup: ({ items, renderItem }: any) => (
    <div data-testid="content-group">
      {items.map((item: any, index: number) => (
        <div key={item.id} data-testid={`group-item-${item.id}`}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  ),
}));

vi.mock("../../components/filter-preview", () => ({
  FilterPreview: ({ filter }: any) => (
    <div data-testid={`filter-preview-${filter.id}`}>
      Filter Preview: {filter.name}
    </div>
  ),
}));

describe("FilterList", () => {
  it("should render filters", () => {
    render(<FilterList />);

    // Проверяем, что фильтры отображаются
    expect(
      screen.getByTestId("filter-preview-test-filter-1"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("filter-preview-test-filter-2"),
    ).toBeInTheDocument();
  });

  it("should render filter previews with correct content", () => {
    render(<FilterList />);

    // Проверяем содержимое превью фильтров
    expect(
      screen.getByText("Filter Preview: Test Filter 1"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Filter Preview: Test Filter 2"),
    ).toBeInTheDocument();
  });

  it("should render filters in grid layout", () => {
    render(<FilterList />);

    // Проверяем, что есть grid контейнер
    const gridContainer = screen.getByTestId(
      "filter-preview-test-filter-1",
    ).parentElement;
    expect(gridContainer).toHaveClass("grid");
    expect(gridContainer).toHaveClass("gap-2");
  });
});
