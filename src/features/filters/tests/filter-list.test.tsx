import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterList } from "../components/filter-list";

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

vi.mock("@/components/common/browser-state-provider", () => ({
  useBrowserState: () => ({
    currentTabSettings: {
      searchQuery: "",
      showFavoritesOnly: false,
      sortBy: "name",
      sortOrder: "asc",
      groupBy: "none",
      filterType: "all",
      viewMode: "grid",
      previewSizeIndex: 2,
    },
  }),
}));

vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: () => false,
  }),
}));

vi.mock("@/features/project-settings", () => ({
  useProjectSettings: () => ({
    settings: {
      aspectRatio: {
        value: { width: 16, height: 9 },
      },
    },
  }),
}));

vi.mock("../hooks/use-filters", () => ({
  useFilters: () => ({
    filters: [
      {
        id: "test-filter",
        name: "Test Filter",
        category: "color-correction",
        complexity: "basic",
        tags: ["test"],
        description: {
          ru: "Тестовый фильтр",
          en: "Test filter",
        },
        labels: {
          ru: "Тестовый фильтр",
          en: "Test Filter",
        },
        params: {
          brightness: 0.1,
          contrast: 1.1,
        },
      },
    ],
    loading: false,
    error: null,
  }),
}));

describe("FilterList", () => {
  it("renders filter list", () => {
    render(<FilterList />);
    
    // Проверяем, что компонент рендерится
    expect(screen.getByText("Test Filter")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    // Мокаем состояние загрузки
    vi.doMock("../hooks/use-filters", () => ({
      useFilters: () => ({
        filters: [],
        loading: true,
        error: null,
      }),
    }));

    render(<FilterList />);
    
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("shows error state", () => {
    // Мокаем состояние ошибки
    vi.doMock("../hooks/use-filters", () => ({
      useFilters: () => ({
        filters: [],
        loading: false,
        error: "Test error",
      }),
    }));

    render(<FilterList />);
    
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("shows no results message when no filters match", () => {
    // Мокаем пустой результат
    vi.doMock("../hooks/use-filters", () => ({
      useFilters: () => ({
        filters: [],
        loading: false,
        error: null,
      }),
    }));

    render(<FilterList />);
    
    expect(screen.getByText("common.noResults")).toBeInTheDocument();
  });
});
