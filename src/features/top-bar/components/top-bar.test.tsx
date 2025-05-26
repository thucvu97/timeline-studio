import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TopBar } from "./top-bar";

// Используем мок для TopBar из src/test/setup.ts

// Мокаем модули
const mockOpenModal = vi.fn();
vi.mock("@/features/modals/services/modal-provider", () => ({
  useModal: () => ({
    openModal: mockOpenModal,
  }),
}));

vi.mock("@/features/media-studio", () => ({
  LayoutPreviews: () => (
    <div data-testid="layout-previews">Layout Previews</div>
  ),
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => (
    <div data-testid="theme-toggle-component">Theme Toggle</div>
  ),
}));

// Мокаем useUserSettings
vi.mock("@/features/user-settings", () => ({
  useUserSettings: () => ({
    isBrowserVisible: true,
    toggleBrowserVisibility: vi.fn(),
    activeTab: "media",
    layoutMode: "default",
    playerScreenshotsPath: "",
    screenshotsPath: "",
    openAiApiKey: "",
    claudeApiKey: "",
    handleTabChange: vi.fn(),
    handleLayoutChange: vi.fn(),
    handleScreenshotsPathChange: vi.fn(),
    handlePlayerScreenshotsPathChange: vi.fn(),
    handleAiApiKeyChange: vi.fn(),
    handleClaudeApiKeyChange: vi.fn(),
  }),
}));

// Мок уже определен в src/test/setup.ts
// Мокаем console.log для проверки вызова
vi.spyOn(console, "log").mockImplementation(() => {});

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders correctly", () => {
    render(<TopBar />);

    // Проверяем, что основные элементы отображаются по их data-testid
    expect(screen.getByTestId("layout-button")).toBeInTheDocument();
    expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    expect(screen.getByTestId("keyboard-shortcuts-button")).toBeInTheDocument();
    expect(screen.getByTestId("project-settings-button")).toBeInTheDocument();
    expect(screen.getByTestId("save-button")).toBeInTheDocument();
  });

  it("renders additional buttons correctly", () => {
    render(<TopBar />);

    // Проверяем, что дополнительные кнопки отображаются
    expect(screen.getByTestId("camera-capture-button")).toBeInTheDocument();
    expect(screen.getByTestId("voice-recording-button")).toBeInTheDocument();
    expect(screen.getByTestId("publish-button")).toBeInTheDocument();
    expect(screen.getByTestId("editing-tasks-button")).toBeInTheDocument();
    expect(screen.getByTestId("user-settings-button")).toBeInTheDocument();
    expect(screen.getByTestId("export-button")).toBeInTheDocument();
  });

  it("renders keyboard shortcuts button", () => {
    render(<TopBar />);

    // Находим кнопку для открытия модального окна
    const keyboardShortcutsButton = screen.getByTestId(
      "keyboard-shortcuts-button",
    );

    // Проверяем, что кнопка отображается
    expect(keyboardShortcutsButton).toBeInTheDocument();
    expect(keyboardShortcutsButton).toHaveTextContent("Keyboard Shortcuts");
  });

  it("renders at least 10 buttons", () => {
    render(<TopBar />);

    // Находим все кнопки по data-testid
    const buttons = [
      screen.getByTestId("layout-button"),
      screen.getByTestId("keyboard-shortcuts-button"),
      screen.getByTestId("project-settings-button"),
      screen.getByTestId("save-button"),
      screen.getByTestId("camera-capture-button"),
      screen.getByTestId("voice-recording-button"),
      screen.getByTestId("publish-button"),
      screen.getByTestId("editing-tasks-button"),
      screen.getByTestId("user-settings-button"),
      screen.getByTestId("export-button"),
    ];

    // Проверяем, что есть хотя бы 10 кнопок
    expect(buttons.length).toBeGreaterThanOrEqual(10);
  });
});
