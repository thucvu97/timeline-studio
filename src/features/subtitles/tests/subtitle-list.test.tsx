import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubtitleList } from "../components/subtitle-list";

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

vi.mock("../hooks/use-subtitle-styles", () => ({
  useSubtitleStyles: () => ({
    styles: [
      {
        id: "test-style",
        name: "Test Style",
        category: "basic",
        complexity: "basic",
        tags: ["test"],
        description: {
          ru: "Тестовый стиль",
          en: "Test style",
        },
        labels: {
          ru: "Тестовый стиль",
          en: "Test Style",
        },
        style: {
          fontFamily: "Arial, sans-serif",
          fontSize: 24,
          color: "#ffffff",
        },
      },
    ],
    loading: false,
    error: null,
  }),
}));

describe("SubtitleList", () => {
  it("renders subtitle list", () => {
    render(<SubtitleList />);
    
    // Проверяем, что компонент рендерится
    expect(screen.getByText("Test Style")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    // Мокаем состояние загрузки
    vi.doMock("../hooks/use-subtitle-styles", () => ({
      useSubtitleStyles: () => ({
        styles: [],
        loading: true,
        error: null,
      }),
    }));

    render(<SubtitleList />);
    
    expect(screen.getByText("common.loading")).toBeInTheDocument();
  });

  it("shows error state", () => {
    // Мокаем состояние ошибки
    vi.doMock("../hooks/use-subtitle-styles", () => ({
      useSubtitleStyles: () => ({
        styles: [],
        loading: false,
        error: "Test error",
      }),
    }));

    render(<SubtitleList />);
    
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("shows no results message when no styles match", () => {
    // Мокаем пустой результат
    vi.doMock("../hooks/use-subtitle-styles", () => ({
      useSubtitleStyles: () => ({
        styles: [],
        loading: false,
        error: null,
      }),
    }));

    render(<SubtitleList />);
    
    expect(screen.getByText("common.noResults")).toBeInTheDocument();
  });
});
