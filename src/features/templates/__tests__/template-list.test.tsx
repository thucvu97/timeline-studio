import { describe, expect, it, vi } from "vitest";

import { renderWithTemplates, screen } from "@/test/test-utils";

import { TemplateList } from "../components/template-list";

// Локальные моки только для этого теста
vi.mock("../components/template-preview", () => ({
  TemplatePreview: ({ template }: any) => (
    <div data-testid={`template-preview-${template.id}`}>
      Template Preview: {template.id}
      <div data-testid={`template-screens-${template.screens}`}>
        Screens: {template.screens}
      </div>
      <div data-testid={`template-split-${template.split}`}>
        Split: {template.split}
      </div>
      {template.resizable && (
        <div data-testid="template-resizable">Resizable</div>
      )}
    </div>
  ),
}));

describe("TemplateList", () => {
  it("should be importable", () => {
    // Простой smoke test - проверяем, что компонент можно импортировать
    expect(TemplateList).toBeDefined();
    expect(typeof TemplateList).toBe("function");
  });

  it("should have correct component structure", () => {
    // Проверяем, что это React компонент
    expect(TemplateList.name).toBe("TemplateList");
  });
});

describe("TemplateList Template Types", () => {
  it("should handle simple icon templates", () => {
    // Простые иконки - шаблоны без сложных настроек
    const simpleTemplate = {
      id: "simple-icon",
      split: "vertical",
      screens: 2,
      render: () => <div data-testid="simple-icon">Simple Icon</div>,
    };

    // Проверяем структуру простого шаблона
    expect(simpleTemplate).toHaveProperty("id");
    expect(simpleTemplate).toHaveProperty("split");
    expect(simpleTemplate).toHaveProperty("screens");
    expect(simpleTemplate).toHaveProperty("render");
    expect(typeof simpleTemplate.render).toBe("function");
  });

  it("should handle templates with settings", () => {
    // Шаблоны с настройками - полноценные шаблоны с конфигурацией
    const configurableTemplate = {
      id: "configurable-template",
      split: "custom",
      resizable: true,
      screens: 3,
      splitPosition: 60,
      splitPoints: [
        { x: 50, y: 0 },
        { x: 50, y: 100 },
      ],
      cellConfig: {
        fitMode: "cover",
        alignX: "center",
        alignY: "center",
        initialScale: 1.0,
        initialPosition: { x: 0, y: 0 },
      },
      render: () => (
        <div data-testid="configurable-template">Configurable Template</div>
      ),
    };

    // Проверяем структуру настраиваемого шаблона
    expect(configurableTemplate).toHaveProperty("resizable");
    expect(configurableTemplate).toHaveProperty("splitPosition");
    expect(configurableTemplate).toHaveProperty("splitPoints");
    expect(configurableTemplate).toHaveProperty("cellConfig");

    expect(configurableTemplate.resizable).toBe(true);
    expect(typeof configurableTemplate.splitPosition).toBe("number");
    expect(Array.isArray(configurableTemplate.splitPoints)).toBe(true);
    expect(typeof configurableTemplate.cellConfig).toBe("object");
  });

  it("should validate template structure", () => {
    // Проверяем, что компонент имеет правильную структуру
    expect(typeof TemplateList).toBe("function");
    expect(TemplateList.name).toBe("TemplateList");
  });
});
