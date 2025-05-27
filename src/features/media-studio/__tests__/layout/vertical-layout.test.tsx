import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUserSettings } from "@/features/user-settings";
import { renderWithBase, screen } from "@/test/test-utils";

import { VerticalLayout } from "../../components/layout";

// Мокаем зависимости
vi.mock("@/features/user-settings");

describe("VerticalLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with browser visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    } as any);

    // Рендерим компонент
    renderWithBase(<VerticalLayout />);

    // Проверяем, что основная группа панелей отрендерена
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toHaveAttribute("data-direction", "horizontal");

    // Проверяем, что вложенные группы панелей отрендерены
    expect(
      screen.getByTestId("resizable-panel-group-vertical-left-layout"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("resizable-panel-group-vertical-left-layout"),
    ).toHaveAttribute("data-direction", "vertical");

    expect(
      screen.getByTestId("resizable-panel-group-vertical-top-layout"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("resizable-panel-group-vertical-top-layout"),
    ).toHaveAttribute("data-direction", "horizontal");

    // Проверяем, что компоненты отрендерены
    expect(screen.getByTestId("browser")).toBeInTheDocument();
    expect(screen.getByTestId("options")).toBeInTheDocument();
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByTestId("video-player")).toBeInTheDocument();

    // Проверяем, что разделители отрендерены
    expect(screen.getAllByTestId("resizable-handle").length).toBe(3);
  });

  it("should render without browser when browser is not visible", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = false
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: false,
      toggleBrowserVisibility: vi.fn(),
    } as any);

    // Рендерим компонент
    renderWithBase(<VerticalLayout />);

    // Проверяем, что основная группа панелей отрендерена
    expect(
      screen.getByTestId("resizable-panel-group-vertical-main-layout"),
    ).toBeInTheDocument();

    // Проверяем, что компонент браузера не отрендерен
    expect(screen.queryByTestId("browser")).not.toBeInTheDocument();

    // Проверяем, что остальные компоненты отрендерены
    expect(screen.getByTestId("options")).toBeInTheDocument();
    expect(screen.getByTestId("timeline")).toBeInTheDocument();
    expect(screen.getByTestId("video-player")).toBeInTheDocument();

    // Проверяем, что разделителей меньше (на один меньше, так как браузер не отображается)
    expect(screen.getAllByTestId("resizable-handle").length).toBe(2);
  });

  it("should have correct panel sizes", () => {
    // Мокаем useUserSettings, чтобы вернуть isBrowserVisible = true
    vi.mocked(useUserSettings).mockReturnValue({
      isBrowserVisible: true,
      toggleBrowserVisibility: vi.fn(),
    } as any);

    // Рендерим компонент
    renderWithBase(<VerticalLayout />);

    // Получаем все панели
    const panels = screen.getAllByTestId("resizable-panel");

    // Проверяем, что у первой панели (левой) правильные размеры
    expect(panels[0]).toHaveAttribute("data-default-size", "67");
    expect(panels[0]).toHaveAttribute("data-min-size", "50");
    expect(panels[0]).toHaveAttribute("data-max-size", "80");

    // Проверяем, что у панели видеоплеера правильные размеры
    const videoPanel = panels[panels.length - 1];
    expect(videoPanel).toHaveAttribute("data-default-size", "33");
  });
});
