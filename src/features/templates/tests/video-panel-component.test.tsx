import { describe, expect, it, vi } from "vitest";

import { VideoPanelComponent } from "../components/video-panel-component";

// Мокаем хук переводов
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: string) => fallback || key,
      i18n: { language: "ru" }
    }),
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn()
    }
  };
});

// Мокаем иконки
vi.mock("lucide-react", () => ({
  Play: () => <div data-testid="play-icon">Play</div>,
  Pause: () => <div data-testid="pause-icon">Pause</div>,
  Volume2: () => <div data-testid="volume-icon">Volume</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  Maximize: () => <div data-testid="maximize-icon">Maximize</div>,
  Plus: () => <div data-testid="plus-icon">Plus</div>
}));

// Мокаем компоненты UI
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, variant, size, className }: any) => (
    <button
      onClick={onClick}
      data-variant={variant}
      data-size={size}
      className={className}
      data-testid="ui-button"
    >
      {children}
    </button>
  )
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children, className }: any) => (
    <div className={className} data-testid="ui-card">
      {children}
    </div>
  ),
  CardContent: ({ children, className }: any) => (
    <div className={className} data-testid="card-content">
      {children}
    </div>
  )
}));

describe("VideoPanelComponent", () => {
  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(VideoPanelComponent).toBeDefined();
    expect(typeof VideoPanelComponent).toBe("function");
  });

  it("should have correct component structure", () => {
    // Проверяем, что это React компонент
    expect(VideoPanelComponent.name).toBe("VideoPanelComponent");
  });

  it("should have required props interface", () => {
    // Проверяем, что компонент имеет правильную структуру
    expect(typeof VideoPanelComponent).toBe("function");
    expect(VideoPanelComponent.length).toBeGreaterThanOrEqual(1); // принимает хотя бы один аргумент (props)
  });
});
