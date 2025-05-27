import { act } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StyleTemplate } from "../../types";
import {
  filterTemplates,
  generateTemplateId,
  getCategoryAbbreviation,
  getCategoryName,
  getStyleAbbreviation,
  getStyleName,
  groupTemplates,
  searchTemplates,
  sortTemplates,
  validateTemplate,
} from "../../utils/style-template-utils";

const mockTemplates: StyleTemplate[] = [
  {
    id: "template-1",
    name: {
      ru: "Современное интро",
      en: "Modern Intro",
    },
    category: "intro",
    style: "modern",
    aspectRatio: "16:9",
    duration: 3,
    hasText: true,
    hasAnimation: true,
    tags: {
      ru: ["интро", "современный"],
      en: ["intro", "modern"],
    },
    description: {
      ru: "Современное интро",
      en: "Modern intro",
    },
    elements: [],
  },
  {
    id: "template-2",
    name: {
      ru: "Минималистичная концовка",
      en: "Minimal Outro",
    },
    category: "outro",
    style: "minimal",
    aspectRatio: "16:9",
    duration: 5,
    hasText: false,
    hasAnimation: true,
    tags: {
      ru: ["концовка", "минимализм"],
      en: ["outro", "minimal"],
    },
    description: {
      ru: "Минималистичная концовка",
      en: "Minimal outro",
    },
    elements: [],
  },
  {
    id: "template-3",
    name: {
      ru: "Элегантный переход",
      en: "Elegant Transition",
    },
    category: "transition",
    style: "creative",
    aspectRatio: "16:9",
    duration: 2,
    hasText: true,
    hasAnimation: false,
    tags: {
      ru: ["переход", "элегантный"],
      en: ["transition", "elegant"],
    },
    description: {
      ru: "Элегантный переход",
      en: "Elegant transition",
    },
    elements: [],
  },
];

describe("style-template-utils", () => {
  describe("getCategoryAbbreviation", () => {
    it("должен возвращать правильные сокращения для категорий", () => {
      expect(getCategoryAbbreviation("intro")).toBe("ИНТ");
      expect(getCategoryAbbreviation("outro")).toBe("КОН");
      expect(getCategoryAbbreviation("transition")).toBe("ПЕР");
      expect(getCategoryAbbreviation("title")).toBe("ТИТ");
      expect(getCategoryAbbreviation("lower-third")).toBe("НИЖ");
    });

    it("должен возвращать пустую строку для неизвестной категории", () => {
      expect(getCategoryAbbreviation("unknown" as any)).toBe("");
    });
  });

  describe("getStyleAbbreviation", () => {
    it("должен возвращать правильные сокращения для стилей", () => {
      expect(getStyleAbbreviation("modern")).toBe("СОВ");
      expect(getStyleAbbreviation("vintage")).toBe("ВИН");
      expect(getStyleAbbreviation("minimal")).toBe("МИН");
      expect(getStyleAbbreviation("corporate")).toBe("КОР");
      expect(getStyleAbbreviation("creative")).toBe("КРЕ");
      expect(getStyleAbbreviation("cinematic")).toBe("КИН");
    });

    it("должен возвращать пустую строку для неизвестного стиля", () => {
      expect(getStyleAbbreviation("unknown" as any)).toBe("");
    });
  });

  describe("filterTemplates", () => {
    it("должен возвращать все шаблоны без фильтров", () => {
      const result = filterTemplates(mockTemplates, {});
      expect(result).toEqual(mockTemplates);
    });

    it("должен фильтровать по категории", () => {
      const result = filterTemplates(mockTemplates, { category: "intro" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-1");
    });

    it("должен фильтровать по стилю", () => {
      const result = filterTemplates(mockTemplates, { style: "minimal" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-2");
    });

    it("должен фильтровать по наличию текста", () => {
      const result = filterTemplates(mockTemplates, { hasText: true });
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(["template-1", "template-3"]);
    });

    it("должен фильтровать по наличию анимации", () => {
      const result = filterTemplates(mockTemplates, { hasAnimation: false });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-3");
    });

    it("должен фильтровать по длительности", () => {
      const result = filterTemplates(mockTemplates, {
        duration: { min: 3, max: 5 },
      });
      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(["template-1", "template-2"]);
    });

    it("должен применять комбинированные фильтры", () => {
      const result = filterTemplates(mockTemplates, {
        hasText: true,
        hasAnimation: true,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-1");
    });
  });

  describe("sortTemplates", () => {
    it("должен сортировать по названию (по возрастанию)", () => {
      const result = sortTemplates(mockTemplates, "name", "asc");
      expect(result[0].name.ru).toBe("Минималистичная концовка");
      expect(result[1].name.ru).toBe("Современное интро");
      expect(result[2].name.ru).toBe("Элегантный переход");
    });

    it("должен сортировать по названию (по убыванию)", () => {
      const result = sortTemplates(mockTemplates, "name", "desc");
      expect(result[0].name.ru).toBe("Элегантный переход");
      expect(result[1].name.ru).toBe("Современное интро");
      expect(result[2].name.ru).toBe("Минималистичная концовка");
    });

    it("должен сортировать по длительности (по возрастанию)", () => {
      const result = sortTemplates(mockTemplates, "duration", "asc");
      expect(result[0].duration).toBe(2);
      expect(result[1].duration).toBe(3);
      expect(result[2].duration).toBe(5);
    });

    it("должен сортировать по длительности (по убыванию)", () => {
      const result = sortTemplates(mockTemplates, "duration", "desc");
      expect(result[0].duration).toBe(5);
      expect(result[1].duration).toBe(3);
      expect(result[2].duration).toBe(2);
    });

    it("должен сортировать по категории (по возрастанию)", () => {
      const result = sortTemplates(mockTemplates, "category", "asc");
      expect(result[0].category).toBe("intro");
      expect(result[1].category).toBe("outro");
      expect(result[2].category).toBe("transition");
    });

    it("должен сортировать по стилю (по возрастанию)", () => {
      const result = sortTemplates(mockTemplates, "style", "asc");
      expect(result[0].style).toBe("creative");
      expect(result[1].style).toBe("minimal");
      expect(result[2].style).toBe("modern");
    });

    it("должен возвращать исходный массив для неизвестного поля сортировки", () => {
      const result = sortTemplates(mockTemplates, "unknown" as any, "asc");
      expect(result).toEqual(mockTemplates);
    });
  });

  describe("getCategoryName", () => {
    it("должен возвращать русские названия категорий", () => {
      expect(getCategoryName("intro", "ru")).toBe("Интро");
      expect(getCategoryName("outro", "ru")).toBe("Концовка");
      expect(getCategoryName("transition", "ru")).toBe("Переход");
    });

    it("должен возвращать английские названия категорий", () => {
      expect(getCategoryName("intro", "en")).toBe("Intro");
      expect(getCategoryName("outro", "en")).toBe("Outro");
      expect(getCategoryName("transition", "en")).toBe("Transition");
    });

    it("должен возвращать русские названия по умолчанию", () => {
      expect(getCategoryName("intro")).toBe("Интро");
    });
  });

  describe("getStyleName", () => {
    it("должен возвращать русские названия стилей", () => {
      expect(getStyleName("modern", "ru")).toBe("Современный");
      expect(getStyleName("minimal", "ru")).toBe("Минимализм");
      expect(getStyleName("creative", "ru")).toBe("Креативный");
    });

    it("должен возвращать английские названия стилей", () => {
      expect(getStyleName("modern", "en")).toBe("Modern");
      expect(getStyleName("minimal", "en")).toBe("Minimal");
      expect(getStyleName("creative", "en")).toBe("Creative");
    });
  });

  describe("groupTemplates", () => {
    it("должен группировать по категориям", () => {
      const result = groupTemplates(mockTemplates, "category");
      expect(Object.keys(result)).toEqual(["intro", "outro", "transition"]);
      expect(result.intro).toHaveLength(1);
      expect(result.outro).toHaveLength(1);
      expect(result.transition).toHaveLength(1);
    });

    it("должен группировать по стилям", () => {
      const result = groupTemplates(mockTemplates, "style");
      expect(Object.keys(result)).toEqual(["modern", "minimal", "creative"]);
    });

    it("должен возвращать все шаблоны в одной группе для 'none'", () => {
      const result = groupTemplates(mockTemplates, "none");
      expect(result.all).toEqual(mockTemplates);
    });
  });

  describe("searchTemplates", () => {
    it("должен искать по названию", () => {
      const result = searchTemplates(mockTemplates, "современное");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-1");
    });

    it("должен искать по тегам", () => {
      const result = searchTemplates(mockTemplates, "интро");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-1");
    });

    it("должен возвращать все шаблоны для пустого запроса", () => {
      const result = searchTemplates(mockTemplates, "");
      expect(result).toEqual(mockTemplates);
    });

    it("должен искать на английском языке", () => {
      const result = searchTemplates(mockTemplates, "modern", "en");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("template-1");
    });
  });

  describe("validateTemplate", () => {
    it("должен валидировать корректный шаблон", () => {
      const result = validateTemplate(mockTemplates[0]);
      expect(result).toBe(true);
    });

    it("должен отклонять некорректный шаблон", () => {
      const invalidTemplate = { id: "test" };
      const result = validateTemplate(invalidTemplate);
      expect(result).toBe(false);
    });

    it("должен отклонять null", () => {
      const result = validateTemplate(null);
      expect(result).toBe(false);
    });
  });

  describe("generateTemplateId", () => {
    it("должен генерировать ID на основе свойств шаблона", () => {
      const template = {
        name: { en: "Test Template", ru: "Тестовый шаблон" },
        category: "intro" as const,
        style: "modern" as const,
      };

      const id = generateTemplateId(template);
      expect(id).toMatch(/^intro-modern-test-template-[a-z0-9]+$/);
    });

    it("должен обрабатывать отсутствующие свойства", () => {
      const template = {};
      const id = generateTemplateId(template);
      expect(id).toMatch(/^unknown-default-template-[a-z0-9]+$/);
    });
  });
});
