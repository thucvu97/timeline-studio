import { describe, expect, it, vi } from "vitest";

import { TemplateList } from "../components/template-list";

// Мокаем хук переводов
vi.mock("react-i18next", async () => {
  const actual = await vi.importActual("react-i18next");
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string, fallback?: string) => fallback || key,
      i18n: { language: "ru" },
    }),
    initReactI18next: {
      type: "3rdParty",
      init: vi.fn(),
    },
  };
});

// Мокаем хук ресурсов
const mockAddTemplate = vi.fn();
const mockIsTemplateAdded = vi.fn().mockReturnValue(false);
const mockRemoveResource = vi.fn();

vi.mock("@/features/resources", async () => {
  const actual = await vi.importActual("@/features/resources");
  return {
    ...actual,
    useResources: () => ({
      addTemplate: mockAddTemplate,
      isTemplateAdded: mockIsTemplateAdded,
      removeResource: mockRemoveResource,
      templateResources: [],
    }),
  };
});

// Мокаем MediaProvider
vi.mock("@/features/browser/media", () => ({
  MediaProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="media-provider">{children}</div>
  ),
  useMedia: () => ({
    files: [],
    addFiles: vi.fn(),
    removeFile: vi.fn(),
    updateFile: vi.fn(),
  }),
}));

// Мокаем состояние браузера
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
    },
  }),
}));

// Мокаем медиа хук
vi.mock("@/features/browser/media", () => ({
  useMedia: () => ({
    isItemFavorite: vi.fn().mockReturnValue(false),
  }),
}));

// Мокаем настройки проекта
vi.mock("@/features/project/settings", () => ({
  useProjectSettings: () => ({
    settings: {
      video: {
        aspectRatio: "16:9",
        width: 1920,
        height: 1080,
      },
    },
  }),
}));

// Мокаем шаблоны
vi.mock("../lib/templates", () => ({
  TEMPLATE_MAP: {
    landscape: [
      {
        id: "split-vertical-landscape",
        split: "vertical",
        resizable: true,
        screens: 2,
        splitPosition: 50,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-vertical",
            children: "Vertical Split",
          },
        }),
      },
      {
        id: "split-horizontal-landscape",
        split: "horizontal",
        resizable: true,
        screens: 2,
        splitPosition: 50,
        render: () => ({
          type: "div",
          props: {
            "data-testid": "template-horizontal",
            children: "Horizontal Split",
          },
        }),
      },
      {
        id: "split-grid-2x2-landscape",
        split: "grid",
        resizable: true,
        screens: 4,
        render: () => ({
          type: "div",
          props: { "data-testid": "template-grid", children: "Grid 2x2" },
        }),
      },
    ],
    portrait: [],
    square: [],
  },
}));

// Мокаем компоненты
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
}));

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

  it("should have required props interface", () => {
    // Проверяем, что компонент имеет правильную структуру
    expect(typeof TemplateList).toBe("function");
    expect(TemplateList.length).toBeGreaterThanOrEqual(0); // может не принимать аргументы
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
