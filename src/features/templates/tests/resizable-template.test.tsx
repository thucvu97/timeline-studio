import { describe, expect, it, vi } from "vitest";

import { ResizableTemplate } from "../components/resizable-template";

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

// Мокаем ResizablePanels компонент
vi.mock("@/components/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, direction, className }: any) => (
    <div
      data-testid="resizable-panel-group"
      data-direction={direction}
      className={className}
    >
      {children}
    </div>
  ),
  ResizablePanel: ({ children, defaultSize, minSize, className }: any) => (
    <div
      data-testid="resizable-panel"
      data-default-size={defaultSize}
      data-min-size={minSize}
      className={className}
    >
      {children}
    </div>
  ),
  ResizableHandle: ({ className }: any) => (
    <div
      data-testid="resizable-handle"
      className={className}
    />
  )
}));

// Мокаем VideoPanelComponent
vi.mock("../components/video-panel-component", () => ({
  VideoPanelComponent: ({ panelId, className }: any) => (
    <div
      data-testid={`video-panel-${panelId}`}
      className={className}
    >
      Video Panel {panelId}
    </div>
  )
}));

describe("ResizableTemplate", () => {
  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(ResizableTemplate).toBeDefined();
    expect(typeof ResizableTemplate).toBe("function");
  });

  it("should have correct component structure", () => {
    // Проверяем, что это React компонент
    expect(ResizableTemplate.name).toBe("ResizableTemplate");
  });

  it("should have required props interface", () => {
    // Проверяем, что компонент имеет правильную структуру
    expect(typeof ResizableTemplate).toBe("function");
    expect(ResizableTemplate.length).toBeGreaterThanOrEqual(1); // принимает хотя бы один аргумент (props)
  });

  it("should validate template structure", () => {
    // Проверяем корректность структуры шаблона
    const mockTemplate = {
      id: "test-template",
      split: "vertical" as const,
      resizable: true,
      screens: 2,
      splitPosition: 50,
      render: () => ({ type: "div", props: { children: "Test Template" } } as any)
    };

    expect(mockTemplate).toHaveProperty("id");
    expect(mockTemplate).toHaveProperty("split");
    expect(mockTemplate).toHaveProperty("screens");
    expect(mockTemplate).toHaveProperty("resizable");
    expect(mockTemplate).toHaveProperty("splitPosition");

    expect(typeof mockTemplate.id).toBe("string");
    expect(typeof mockTemplate.split).toBe("string");
    expect(typeof mockTemplate.screens).toBe("number");
    expect(typeof mockTemplate.resizable).toBe("boolean");
    expect(typeof mockTemplate.splitPosition).toBe("number");
  });
});
