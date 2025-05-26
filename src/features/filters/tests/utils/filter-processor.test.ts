import { describe, expect, it } from "vitest";

import { VideoFilter } from "@/types/filters";

import {
  createFallbackFilter,
  groupFilters,
  processFilters,
  searchFilters,
  sortFilters,
  validateFiltersData,
} from "../../utils/filter-processor";

describe("filter-processor", () => {
  const mockRawFilter = {
    id: "test-brightness",
    name: "Test Brightness",
    category: "color-correction",
    complexity: "basic",
    tags: ["professional", "standard"],
    description: {
      ru: "Тестовая яркость",
      en: "Test brightness",
    },
    labels: {
      ru: "Яркость",
      en: "Brightness",
      es: "Brillo",
      fr: "Luminosité",
      de: "Helligkeit",
    },
    params: {
      brightness: 0.1,
      contrast: 1.0,
    },
  };

  const mockVideoFilter: VideoFilter = {
    id: "brightness-1",
    name: "Brightness Filter",
    category: "color-correction",
    complexity: "basic",
    tags: ["professional", "standard"],
    description: {
      ru: "Фильтр яркости",
      en: "Brightness filter",
    },
    labels: {
      ru: "Яркость",
      en: "Brightness",
    },
    params: {
      brightness: 0.2,
      contrast: 1.1,
    },
  };

  describe("processFilters", () => {
    it("should convert raw filter data to VideoFilter array", () => {
      const rawFilters = [mockRawFilter];
      const result = processFilters(rawFilters);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockRawFilter.id);
      expect(result[0].name).toBe(mockRawFilter.name);
      expect(result[0].category).toBe(mockRawFilter.category);
      expect(result[0].complexity).toBe(mockRawFilter.complexity);
      expect(result[0].tags).toEqual(mockRawFilter.tags);
      expect(result[0].description).toEqual(mockRawFilter.description);
      expect(result[0].labels).toEqual(mockRawFilter.labels);
      expect(result[0].params).toEqual(mockRawFilter.params);
    });

    it("should handle multiple filters", () => {
      const rawFilters = [
        mockRawFilter,
        {
          ...mockRawFilter,
          id: "test-contrast",
          name: "Test Contrast",
          category: "color-correction",
        },
      ];

      const result = processFilters(rawFilters);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("test-brightness");
      expect(result[1].id).toBe("test-contrast");
    });

    it("should handle empty array", () => {
      const result = processFilters([]);
      expect(result).toEqual([]);
    });
  });

  describe("validateFiltersData", () => {
    it("should validate correct filters data structure", () => {
      const validData = {
        version: "1.0.0",
        lastUpdated: "2024-01-01",
        totalFilters: 1,
        categories: ["color-correction"],
        filters: [mockRawFilter],
      };

      const result = validateFiltersData(validData);
      expect(result).toBe(true);
    });

    it("should reject data without filters array", () => {
      const invalidData = {
        version: "1.0.0",
        totalFilters: 0,
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject data with invalid filters", () => {
      const invalidData = {
        filters: [
          { id: "invalid" }, // Отсутствуют обязательные поля
        ],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject null or undefined data", () => {
      expect(validateFiltersData(null)).toBe(false);
      expect(validateFiltersData(undefined)).toBe(false);
    });

    it("should reject filter missing required fields", () => {
      const invalidFilter = { ...mockRawFilter };
      delete (invalidFilter as any).id;

      const invalidData = {
        filters: [invalidFilter],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject filter missing name", () => {
      const invalidFilter = { ...mockRawFilter };
      delete (invalidFilter as any).name;

      const invalidData = {
        filters: [invalidFilter],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject filter missing description", () => {
      const invalidFilter = { ...mockRawFilter };
      delete (invalidFilter as any).description;

      const invalidData = {
        filters: [invalidFilter],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject filter missing labels", () => {
      const invalidFilter = { ...mockRawFilter };
      delete (invalidFilter as any).labels;

      const invalidData = {
        filters: [invalidFilter],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });

    it("should reject filter with invalid tags", () => {
      const invalidFilter = { ...mockRawFilter, tags: "not-an-array" };

      const invalidData = {
        filters: [invalidFilter],
      };

      const result = validateFiltersData(invalidData);
      expect(result).toBe(false);
    });
  });

  describe("createFallbackFilter", () => {
    it("should create valid fallback filter", () => {
      const fallback = createFallbackFilter("test-fallback");

      expect(fallback.id).toBe("test-fallback");
      expect(fallback.name).toBe("Test-fallback");
      expect(fallback.category).toBe("color-correction");
      expect(fallback.complexity).toBe("basic");
      expect(fallback.tags).toEqual(["fallback"]);
      expect(fallback.description.ru).toBe("Базовый фильтр test-fallback");
      expect(fallback.description.en).toBe("Basic filter test-fallback");
      expect(fallback.labels.ru).toBe("Test-fallback");
      expect(fallback.labels.en).toBe("Test-fallback");
      expect(fallback.params).toEqual({
        brightness: 0,
        contrast: 1,
        saturation: 1,
      });
    });

    it("should capitalize first letter of id", () => {
      const fallback = createFallbackFilter("lowercase");
      expect(fallback.name).toBe("Lowercase");
      expect(fallback.labels.ru).toBe("Lowercase");
      expect(fallback.labels.en).toBe("Lowercase");
    });
  });

  describe("searchFilters", () => {
    const filters: VideoFilter[] = [
      mockVideoFilter,
      {
        id: "contrast-1",
        name: "Contrast Filter",
        category: "color-correction",
        complexity: "intermediate",
        tags: ["professional", "standard"],
        description: {
          ru: "Фильтр контрастности",
          en: "Contrast filter",
        },
        labels: {
          ru: "Контраст",
          en: "Contrast",
        },
        params: { contrast: 1.5 },
      },
      {
        id: "vintage-1",
        name: "Vintage Filter",
        category: "creative",
        complexity: "advanced",
        tags: ["vintage", "warm"],
        description: {
          ru: "Винтажный фильтр",
          en: "Vintage filter",
        },
        labels: {
          ru: "Винтаж",
          en: "Vintage",
        },
        params: { temperature: 0.8 },
      },
    ];

    it("should return all filters when query is empty", () => {
      const result = searchFilters(filters, "");
      expect(result).toEqual(filters);
    });

    it("should return all filters when query is whitespace", () => {
      const result = searchFilters(filters, "   ");
      expect(result).toEqual(filters);
    });

    it("should search by labels", () => {
      const result = searchFilters(filters, "Яркость", "ru");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("brightness-1");
    });

    it("should search by labels (ru)", () => {
      const result = searchFilters(filters, "контраст", "ru");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("contrast-1");
    });

    it("should search by labels (en)", () => {
      const result = searchFilters(filters, "vintage", "en");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vintage-1");
    });

    it("should search by description", () => {
      const result = searchFilters(filters, "винтажный", "ru");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vintage-1");
    });

    it("should search by tags", () => {
      const result = searchFilters(filters, "warm");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("vintage-1");
    });

    it("should be case insensitive", () => {
      const result = searchFilters(filters, "ЯРКОСТЬ", "ru");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("brightness-1");
    });

    it("should return empty array when no matches", () => {
      const result = searchFilters(filters, "nonexistent");
      expect(result).toEqual([]);
    });
  });

  describe("groupFilters", () => {
    const filters: VideoFilter[] = [
      {
        id: "brightness-1",
        name: "Brightness",
        category: "color-correction",
        complexity: "basic",
        tags: ["professional"],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
      {
        id: "contrast-1",
        name: "Contrast",
        category: "color-correction",
        complexity: "intermediate",
        tags: ["standard"],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
      {
        id: "vintage-1",
        name: "Vintage",
        category: "creative",
        complexity: "advanced",
        tags: ["vintage", "warm"],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
    ];

    it("should return all filters when groupBy is 'none'", () => {
      const result = groupFilters(filters, "none");
      expect(result).toEqual({ all: filters });
    });

    it("should group by category", () => {
      const result = groupFilters(filters, "category");

      expect(result["color-correction"]).toHaveLength(2);
      expect(result.creative).toHaveLength(1);
      expect(result["color-correction"][0].id).toBe("brightness-1");
      expect(result["color-correction"][1].id).toBe("contrast-1");
      expect(result.creative[0].id).toBe("vintage-1");
    });

    it("should group by complexity", () => {
      const result = groupFilters(filters, "complexity");

      expect(result.basic).toHaveLength(1);
      expect(result.intermediate).toHaveLength(1);
      expect(result.advanced).toHaveLength(1);
      expect(result.basic[0].id).toBe("brightness-1");
      expect(result.intermediate[0].id).toBe("contrast-1");
      expect(result.advanced[0].id).toBe("vintage-1");
    });

    it("should group by tags (first tag)", () => {
      const result = groupFilters(filters, "tags");

      expect(result.professional).toHaveLength(1);
      expect(result.standard).toHaveLength(1);
      expect(result.vintage).toHaveLength(1);
    });

    it("should handle filters without category", () => {
      const filtersWithoutCategory = [
        { ...filters[0], category: undefined as any },
      ];

      const result = groupFilters(
        filtersWithoutCategory as VideoFilter[],
        "category",
      );
      expect(result.other).toHaveLength(1);
    });

    it("should handle filters without complexity", () => {
      const filtersWithoutComplexity = [
        { ...filters[0], complexity: undefined as any },
      ];

      const result = groupFilters(
        filtersWithoutComplexity as VideoFilter[],
        "complexity",
      );
      expect(result.basic).toHaveLength(1);
    });

    it("should handle filters without tags", () => {
      const filtersWithoutTags = [{ ...filters[0], tags: undefined as any }];

      const result = groupFilters(filtersWithoutTags as VideoFilter[], "tags");
      expect(result.untagged).toHaveLength(1);
    });

    it("should handle filters with empty tags", () => {
      const filtersWithEmptyTags = [
        { ...filters[0], tags: [] },
      ] as VideoFilter[];

      const result = groupFilters(filtersWithEmptyTags, "tags");
      expect(result.untagged).toHaveLength(1);
    });
  });

  describe("sortFilters", () => {
    const filters: VideoFilter[] = [
      {
        id: "z-filter",
        name: "Z Filter",
        category: "creative",
        complexity: "advanced",
        tags: [],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
      {
        id: "a-filter",
        name: "A Filter",
        category: "color-correction",
        complexity: "basic",
        tags: [],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
      {
        id: "m-filter",
        name: "M Filter",
        category: "artistic",
        complexity: "intermediate",
        tags: [],
        description: { ru: "", en: "" },
        labels: { ru: "", en: "" },
        params: {},
      },
    ];

    it("should sort by name ascending", () => {
      const result = sortFilters(filters, "name", "asc");

      expect(result[0].name).toBe("A Filter");
      expect(result[1].name).toBe("M Filter");
      expect(result[2].name).toBe("Z Filter");
    });

    it("should sort by name descending", () => {
      const result = sortFilters(filters, "name", "desc");

      expect(result[0].name).toBe("Z Filter");
      expect(result[1].name).toBe("M Filter");
      expect(result[2].name).toBe("A Filter");
    });

    it("should sort by complexity ascending", () => {
      const result = sortFilters(filters, "complexity", "asc");

      expect(result[0].complexity).toBe("basic");
      expect(result[1].complexity).toBe("intermediate");
      expect(result[2].complexity).toBe("advanced");
    });

    it("should sort by complexity descending", () => {
      const result = sortFilters(filters, "complexity", "desc");

      expect(result[0].complexity).toBe("advanced");
      expect(result[1].complexity).toBe("intermediate");
      expect(result[2].complexity).toBe("basic");
    });

    it("should sort by category ascending", () => {
      const result = sortFilters(filters, "category", "asc");

      expect(result[0].category).toBe("artistic");
      expect(result[1].category).toBe("color-correction");
      expect(result[2].category).toBe("creative");
    });

    it("should sort by category descending", () => {
      const result = sortFilters(filters, "category", "desc");

      expect(result[0].category).toBe("creative");
      expect(result[1].category).toBe("color-correction");
      expect(result[2].category).toBe("artistic");
    });

    it("should handle missing complexity", () => {
      const filtersWithMissingComplexity = [
        { ...filters[0], complexity: undefined },
        filters[1],
      ] as VideoFilter[];

      const result = sortFilters(
        filtersWithMissingComplexity,
        "complexity",
        "asc",
      );

      // Фильтр без complexity должен считаться как "basic"
      expect(result[0].complexity).toBeUndefined();
      expect(result[1].complexity).toBe("basic");
    });

    it("should handle missing category", () => {
      const filtersWithMissingCategory = [
        { ...filters[0], category: undefined },
        filters[1],
      ] as VideoFilter[];

      const result = sortFilters(filtersWithMissingCategory, "category", "asc");

      // Фильтр без category должен быть в начале (пустая строка)
      expect(result[0].category).toBeUndefined();
      expect(result[1].category).toBe("color-correction");
    });

    it("should not mutate original array", () => {
      const originalOrder = filters.map((f) => f.name);
      sortFilters(filters, "name", "asc");

      // Проверяем, что исходный массив не изменился
      expect(filters.map((f) => f.name)).toEqual(originalOrder);
    });

    it("should default to ascending order", () => {
      const resultAsc = sortFilters(filters, "name");
      const resultExplicitAsc = sortFilters(filters, "name", "asc");

      expect(resultAsc).toEqual(resultExplicitAsc);
    });
  });
});
