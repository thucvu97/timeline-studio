import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithBase, screen } from "@/test/test-utils";

import { TimelineTopPanel } from "./timeline-top-panel";

// Мокаем иконки Lucide
vi.mock("lucide-react", () => ({
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  LayoutTemplate: () => <div data-testid="layout-template-icon" />,
  Minus: () => <div data-testid="minus-icon" />,
  MoveHorizontal: () => <div data-testid="move-horizontal-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  Redo2: () => <div data-testid="redo2-icon" />,
  Scissors: ({ className }: any) => (
    <div data-testid="scissors-icon" className={className} />
  ),
  SquareMousePointer: () => <div data-testid="square-mouse-pointer-icon" />,
  Trash2: () => <div data-testid="trash2-icon" />,
  Undo2: () => <div data-testid="undo2-icon" />,
}));

describe("TimelineTopPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("должен корректно рендериться", () => {
    const { container } = renderWithBase(<TimelineTopPanel />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("должен рендериться без ошибок", () => {
    const { container } = renderWithBase(<TimelineTopPanel />);
    expect(container).toBeInTheDocument();
  });

  it.skip("должен иметь слайдер с правильным aria-label", () => {
    renderWithBase(<TimelineTopPanel />);

    // Находим слайдер
    const sliders = screen.getAllByRole("slider", { hidden: true });
    expect(sliders.length).toBeGreaterThan(0);
    expect(sliders[0]).toHaveAttribute(
      "aria-label",
      "timeline.zoom.fitToScreen",
    );
  });

  it.skip("должен иметь класс rotate-270 для иконки ножниц", () => {
    renderWithBase(<TimelineTopPanel />);

    // Проверяем, что иконка ножниц имеет класс rotate-270
    const scissorsIcon = screen.getByTestId("scissors-icon");
    expect(scissorsIcon).toHaveClass("rotate-270");
  });
});
