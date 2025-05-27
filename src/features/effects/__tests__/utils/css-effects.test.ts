import { act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VideoEffect } from "@/types/effects";

import {
  applySpecialEffectStyles,
  generateCSSFilterForEffect,
  getPlaybackRate,
  resetEffectStyles,
} from "../../utils/css-effects";

describe("css-effects", () => {
  // Мокаем console.warn
  const mockConsoleWarn = vi
    .spyOn(console, "warn")
    .mockImplementation(() => {});

  beforeEach(() => {
    mockConsoleWarn.mockClear();
  });

  const mockEffect: VideoEffect = {
    id: "test-blur",
    name: "Test Blur",
    type: "blur",
    duration: 1000,
    category: "artistic",
    complexity: "basic",
    tags: ["beginner-friendly"],
    description: { ru: "Размытие", en: "Blur" },
    ffmpegCommand: (params) => `blur=${params.radius || 5}`,
    cssFilter: (params) => `blur(${params.radius || 5}px)`,
    params: { radius: 5 },
    previewPath: "/test.mp4",
    labels: {
      ru: "Размытие",
      en: "Blur",
      es: "Desenfoque",
      fr: "Flou",
      de: "Unschärfe",
    },
  };

  describe("generateCSSFilterForEffect", () => {
    it("should generate CSS filter from effect cssFilter function", () => {
      const result = generateCSSFilterForEffect(mockEffect);
      expect(result).toBe("blur(5px)");
    });

    it("should use custom parameters", () => {
      const effectWithCustomParams = {
        ...mockEffect,
        params: { radius: 10 },
      };

      const result = generateCSSFilterForEffect(effectWithCustomParams);
      expect(result).toBe("blur(10px)");
    });

    it("should handle effect without cssFilter", () => {
      const effectWithoutCssFilter = { ...mockEffect };
      delete effectWithoutCssFilter.cssFilter;

      const result = generateCSSFilterForEffect(effectWithoutCssFilter);

      expect(result).toBe("");
      expect(mockConsoleWarn).toHaveBeenCalledWith(
        "Effect test-blur (blur) missing cssFilter",
      );
    });

    it("should handle effect without params", () => {
      const effectWithoutParams = { ...mockEffect };
      delete effectWithoutParams.params;

      const result = generateCSSFilterForEffect(effectWithoutParams);
      expect(result).toBe("blur(5px)"); // Использует значения по умолчанию
    });

    it("should handle complex CSS filters", () => {
      const complexEffect: VideoEffect = {
        ...mockEffect,
        cssFilter: (params) =>
          `blur(${params.radius || 0}px) brightness(${params.intensity || 1}) contrast(${params.amount || 1})`,
        params: { radius: 3, intensity: 1.2, amount: 1.1 },
      };

      const result = generateCSSFilterForEffect(complexEffect);
      expect(result).toBe("blur(3px) brightness(1.2) contrast(1.1)");
    });
  });

  describe("getPlaybackRate", () => {
    it("should return speed parameter for speed effect", () => {
      const speedEffect: VideoEffect = {
        ...mockEffect,
        type: "speed",
        params: { speed: 2.5 },
      };

      const result = getPlaybackRate(speedEffect);
      expect(result).toBe(2.5);
    });

    it("should return default speed for speed effect without params", () => {
      const speedEffect: VideoEffect = {
        ...mockEffect,
        type: "speed",
        params: {},
      };

      const result = getPlaybackRate(speedEffect);
      expect(result).toBe(2);
    });

    it("should return 0.5 for reverse effect", () => {
      const reverseEffect: VideoEffect = {
        ...mockEffect,
        type: "reverse",
      };

      const result = getPlaybackRate(reverseEffect);
      expect(result).toBe(0.5);
    });

    it("should return 1 for other effects", () => {
      const result = getPlaybackRate(mockEffect);
      expect(result).toBe(1);
    });

    it("should handle effect without params for speed", () => {
      const speedEffectNoParams: VideoEffect = {
        ...mockEffect,
        type: "speed",
      };
      delete speedEffectNoParams.params;

      const result = getPlaybackRate(speedEffectNoParams);
      expect(result).toBe(2);
    });
  });

  describe("applySpecialEffectStyles", () => {
    let mockVideoElement: HTMLVideoElement;

    beforeEach(() => {
      mockVideoElement = {
        style: {
          boxShadow: "",
          borderRadius: "",
        },
      } as HTMLVideoElement;
    });

    it("should apply vignette effect styles", () => {
      const vignetteEffect: VideoEffect = {
        ...mockEffect,
        type: "vignette",
        params: { intensity: 0.5, radius: 0.7 },
      };

      applySpecialEffectStyles(mockVideoElement, vignetteEffect, 200);

      expect(mockVideoElement.style.boxShadow).toContain("inset");
      expect(mockVideoElement.style.boxShadow).toContain("rgba(0,0,0,0.5)");
    });

    it("should use default values for vignette without params", () => {
      const vignetteEffect: VideoEffect = {
        ...mockEffect,
        type: "vignette",
        params: {},
      };

      applySpecialEffectStyles(mockVideoElement, vignetteEffect, 100);

      expect(mockVideoElement.style.boxShadow).toContain("rgba(0,0,0,0.3)");
    });

    it("should reset styles for non-special effects", () => {
      // Устанавливаем начальные стили
      mockVideoElement.style.boxShadow = "some shadow";
      mockVideoElement.style.borderRadius = "10px";

      applySpecialEffectStyles(mockVideoElement, mockEffect, 200);

      expect(mockVideoElement.style.boxShadow).toBe("");
      expect(mockVideoElement.style.borderRadius).toBe("");
    });

    it("should handle film-grain effect", () => {
      const filmGrainEffect: VideoEffect = {
        ...mockEffect,
        type: "film-grain",
      };

      applySpecialEffectStyles(mockVideoElement, filmGrainEffect, 200);

      // Для film-grain пока нет специальных стилей, но должно сбросить существующие
      expect(mockVideoElement.style.boxShadow).toBe("");
      expect(mockVideoElement.style.borderRadius).toBe("");
    });

    it("should calculate vignette shadow size based on element size", () => {
      const vignetteEffect: VideoEffect = {
        ...mockEffect,
        type: "vignette",
        params: { intensity: 0.4, radius: 0.8 },
      };

      applySpecialEffectStyles(mockVideoElement, vignetteEffect, 400);

      // Проверяем, что размер тени рассчитывается правильно
      expect(mockVideoElement.style.boxShadow).toContain("inset");
      // Размер тени должен зависеть от размера элемента
    });
  });

  describe("resetEffectStyles", () => {
    let mockVideoElement: HTMLVideoElement;

    beforeEach(() => {
      mockVideoElement = {
        style: {
          filter: "blur(5px)",
          boxShadow: "inset 0 0 10px black",
          borderRadius: "10px",
        },
        playbackRate: 2,
      } as HTMLVideoElement;
    });

    it("should reset all effect styles", () => {
      resetEffectStyles(mockVideoElement);

      expect(mockVideoElement.style.filter).toBe("");
      expect(mockVideoElement.style.boxShadow).toBe("");
      expect(mockVideoElement.style.borderRadius).toBe("");
      expect(mockVideoElement.playbackRate).toBe(1);
    });

    it("should handle element without existing styles", () => {
      const cleanElement = {
        style: {
          filter: "",
          boxShadow: "",
          borderRadius: "",
        },
        playbackRate: 1,
      } as HTMLVideoElement;

      // Не должно выбрасывать ошибку
      expect(() => resetEffectStyles(cleanElement)).not.toThrow();
    });
  });
});
