import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TransitionList } from "../components/transition-list";

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" }
  })
}));

// Простые моки для тестирования
const mockTransitions = [
  {
    id: "test-transition-1",
    type: "fade",
    labels: { ru: "Затухание", en: "Fade" },
    description: { ru: "Плавное затухание", en: "Smooth fade" },
    category: "basic",
    complexity: "basic",
    tags: ["popular"],
    duration: { min: 0.5, max: 2.0, default: 1.0 },
    parameters: { easing: "ease-in-out", intensity: 1.0 },
    ffmpegCommand: () => "fade=t=in:st=0:d=1.0"
  },
  {
    id: "test-transition-2",
    type: "zoom",
    labels: { ru: "Увеличение", en: "Zoom" },
    description: { ru: "Эффект увеличения", en: "Zoom effect" },
    category: "creative",
    complexity: "intermediate",
    tags: ["dynamic"],
    duration: { min: 0.5, max: 3.0, default: 1.5 },
    parameters: { easing: "ease-out", intensity: 0.8, scale: 2.0 },
    ffmpegCommand: () => "zoompan=z='zoom+0.002':d=125"
  }
];

// Простые моки
vi.mock("../hooks/use-transitions", () => ({
  useTransitions: () => ({
    transitions: mockTransitions,
    loading: false,
    error: null,
    reload: vi.fn(),
    isReady: true
  })
}));

vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false)
  })
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
      previewSizeIndex: 2
    }
  })
}));

vi.mock("@/features/project/settings", () => ({
  useProjectSettings: () => ({
    settings: { video: { aspectRatio: "16:9" } }
  })
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
  )
}));

vi.mock("../components/transition-preview", () => ({
  TransitionPreview: ({ transition }: any) => (
    <div data-testid={`transition-preview-${transition.id}`}>
      Transition Preview: {transition.labels.ru}
    </div>
  )
}));

describe("TransitionList", () => {
  it("should render transitions", () => {
    render(<TransitionList />);

    // Проверяем, что переходы отображаются
    expect(screen.getByTestId("transition-preview-test-transition-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-test-transition-2")).toBeInTheDocument();
  });

  it("should render transition previews with correct content", () => {
    render(<TransitionList />);

    // Проверяем содержимое превью переходов
    expect(screen.getByText("Transition Preview: Затухание")).toBeInTheDocument();
    expect(screen.getByText("Transition Preview: Увеличение")).toBeInTheDocument();
  });

  it("should render transitions in grid layout", () => {
    render(<TransitionList />);

    // Проверяем, что есть grid контейнер
    const gridContainer = screen.getByTestId("transition-preview-test-transition-1").parentElement;
    expect(gridContainer).toHaveClass("grid");
    expect(gridContainer).toHaveClass("gap-2");
  });
});

describe("TransitionList Loading States", () => {
  it("should render without errors", () => {
    render(<TransitionList />);

    // Проверяем, что компонент рендерится без ошибок
    expect(screen.getByTestId("transition-preview-test-transition-1")).toBeInTheDocument();
    expect(screen.getByTestId("transition-preview-test-transition-2")).toBeInTheDocument();
  });
});
