import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { SubtitleList } from "../components/subtitle-list"

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}))

// Простые моки для тестирования
const mockSubtitles = [
  {
    id: "test-subtitle-1",
    name: "Basic White",
    labels: { ru: "Базовый белый", en: "Basic White" },
    description: { ru: "Простой белый текст", en: "Simple white text" },
    category: "basic",
    complexity: "basic",
    tags: ["popular", "minimal"],
    style: {
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
      color: "#ffffff",
      backgroundColor: "transparent",
      textAlign: "center",
      fontWeight: "normal",
      textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
    },
  },
  {
    id: "test-subtitle-2",
    name: "Creative Bold",
    labels: { ru: "Креативный жирный", en: "Creative Bold" },
    description: { ru: "Жирный креативный стиль", en: "Bold creative style" },
    category: "creative",
    complexity: "intermediate",
    tags: ["bold", "modern"],
    style: {
      fontSize: "28px",
      fontFamily: "Impact, sans-serif",
      color: "#ffff00",
      backgroundColor: "rgba(0,0,0,0.8)",
      textAlign: "center",
      fontWeight: "bold",
      textShadow: "3px 3px 6px rgba(0,0,0,1)",
      padding: "8px 16px",
      borderRadius: "4px",
    },
  },
]

// Простые моки
vi.mock("../hooks/use-subtitle-styles", () => ({
  useSubtitles: () => ({
    subtitles: mockSubtitles,
    loading: false,
    error: null,
    reload: vi.fn(),
    isReady: true,
  }),
}))

vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
  }),
}))

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
}))

vi.mock("@/features/project/settings", () => ({
  useProjectSettings: () => ({
    settings: { video: { aspectRatio: "16:9" } },
  }),
}))

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
}))

vi.mock("../components/subtitle-preview", () => ({
  SubtitlePreview: ({ style }: any) => (
    <div data-testid={`subtitle-preview-${style.id}`}>Subtitle Preview: {style.labels.ru}</div>
  ),
}))

describe("SubtitleList", () => {
  it("should render subtitles", () => {
    render(<SubtitleList />)

    // Проверяем, что субтитры отображаются
    expect(screen.getByTestId("subtitle-preview-test-subtitle-1")).toBeInTheDocument()
    expect(screen.getByTestId("subtitle-preview-test-subtitle-2")).toBeInTheDocument()
  })

  it("should render subtitle previews with correct content", () => {
    render(<SubtitleList />)

    // Проверяем содержимое превью субтитров
    expect(screen.getByText("Subtitle Preview: Базовый белый")).toBeInTheDocument()
    expect(screen.getByText("Subtitle Preview: Креативный жирный")).toBeInTheDocument()
  })

  it("should render subtitles in grid layout", () => {
    render(<SubtitleList />)

    // Проверяем, что субтитры отрендерились
    expect(screen.getByTestId("subtitle-preview-test-subtitle-1")).toBeInTheDocument()
    expect(screen.getByTestId("subtitle-preview-test-subtitle-2")).toBeInTheDocument()

    // Проверяем, что есть контейнер с группами
    expect(screen.getByTestId("content-group")).toBeInTheDocument()
  })
})

describe("SubtitleList Loading States", () => {
  it("should render without errors when data is available", () => {
    render(<SubtitleList />)

    // Проверяем, что компонент рендерится без ошибок
    expect(screen.getByTestId("subtitle-preview-test-subtitle-1")).toBeInTheDocument()
    expect(screen.getByTestId("subtitle-preview-test-subtitle-2")).toBeInTheDocument()
  })
})
