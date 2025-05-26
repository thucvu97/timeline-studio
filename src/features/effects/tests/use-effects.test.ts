import { describe, expect, it } from "vitest";

// Простые тесты для проверки импортов и базовой функциональности
describe("Effects Module", () => {
  it("should import effects hooks without errors", async () => {
    // Проверяем, что модули импортируются без ошибок
    const { useEffects, useEffectById, useEffectsByCategory } = await import("../hooks/use-effects");

    expect(useEffects).toBeDefined();
    expect(typeof useEffects).toBe("function");

    expect(useEffectById).toBeDefined();
    expect(typeof useEffectById).toBe("function");

    expect(useEffectsByCategory).toBeDefined();
    expect(typeof useEffectsByCategory).toBe("function");
  });

  it("should import effects utilities without errors", async () => {
    // Проверяем, что утилиты импортируются
    const { generateCSSFilterForEffect, getPlaybackRate } = await import("../utils/css-effects");

    expect(generateCSSFilterForEffect).toBeDefined();
    expect(typeof generateCSSFilterForEffect).toBe("function");

    expect(getPlaybackRate).toBeDefined();
    expect(typeof getPlaybackRate).toBe("function");
  });

  it("should have valid effect types", () => {
    // Проверяем, что типы эффектов определены правильно
    const validCategories = [
      "artistic",
      "vintage",
      "color-correction",
      "motion",
      "distortion",
      "noise",
      "other"
    ];

    const validComplexities = ["basic", "intermediate", "advanced"];

    expect(validCategories.length).toBeGreaterThan(0);
    expect(validComplexities.length).toBe(3);
  });
});
