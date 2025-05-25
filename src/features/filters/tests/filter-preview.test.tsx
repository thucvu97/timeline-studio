import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterPreview } from "../components/filter-preview";

// Мокаем зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

vi.mock("@/features/resources", () => ({
  useResources: () => ({
    addFilter: vi.fn(),
    isFilterAdded: () => false,
    removeResource: vi.fn(),
    filterResources: [],
  }),
}));

vi.mock("../../browser/components/layout/add-media-button", () => ({
  AddMediaButton: ({ onAddMedia, isAdded }: any) => (
    <button onClick={onAddMedia} data-testid="add-button">
      {isAdded ? "Remove" : "Add"}
    </button>
  ),
}));

vi.mock("../../browser/components/layout/favorite-button", () => ({
  FavoriteButton: () => <button data-testid="favorite-button">Favorite</button>,
}));

const mockFilter = {
  id: "test-filter",
  name: "Test Filter",
  category: "color-correction" as const,
  complexity: "basic" as const,
  tags: ["test"] as const,
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
    saturation: 1.2,
  },
};

describe("FilterPreview", () => {
  it("renders filter preview", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
        previewWidth={100}
        previewHeight={100}
      />
    );
    
    // Проверяем, что название фильтра отображается
    expect(screen.getByText("Test Filter")).toBeInTheDocument();
    
    // Проверяем, что видео элемент присутствует
    expect(screen.getByTestId("filter-video")).toBeInTheDocument();
    
    // Проверяем, что кнопки присутствуют
    expect(screen.getByTestId("add-button")).toBeInTheDocument();
    expect(screen.getByTestId("favorite-button")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
      />
    );
    
    // Кликаем на превью
    fireEvent.click(screen.getByText("Test Filter").closest("div")!);
    
    expect(mockOnClick).toHaveBeenCalled();
  });

  it("applies CSS filter on hover", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
      />
    );
    
    const video = screen.getByTestId("filter-video");
    const container = video.closest(".group");
    
    // Наводим мышь
    fireEvent.mouseEnter(container!);
    
    // Проверяем, что CSS фильтр применился
    expect(video).toHaveStyle("filter: brightness(1.1) contrast(1.1) saturate(1.2)");
  });

  it("removes CSS filter on mouse leave", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
      />
    );
    
    const video = screen.getByTestId("filter-video");
    const container = video.closest(".group");
    
    // Наводим мышь и убираем
    fireEvent.mouseEnter(container!);
    fireEvent.mouseLeave(container!);
    
    // Проверяем, что CSS фильтр убрался
    expect(video).toHaveStyle("filter: ");
  });

  it("displays complexity indicator", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
      />
    );
    
    // Проверяем, что индикатор сложности отображается
    const complexityIndicator = document.querySelector(".bg-green-500");
    expect(complexityIndicator).toBeInTheDocument();
  });

  it("displays category abbreviation", () => {
    const mockOnClick = vi.fn();
    
    render(
      <FilterPreview
        filter={mockFilter}
        onClick={mockOnClick}
        size={100}
      />
    );
    
    // Проверяем, что аббревиатура категории отображается
    expect(screen.getByText("CC")).toBeInTheDocument();
  });
});
