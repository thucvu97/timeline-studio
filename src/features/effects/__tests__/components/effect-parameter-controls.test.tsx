import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { VideoEffect } from "@/types/effects";

import { EffectParameterControls } from "../../components/effect-parameter-controls";

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "en" },
  }),
}));

// Мокаем UI компоненты
vi.mock("@/components/ui/slider", () => ({
  Slider: () => <div data-testid="slider">Slider</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: any) => <button>{children}</button>,
}));

vi.mock("@/components/ui/label", () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: any) => <div>{children}</div>,
  Tooltip: ({ children }: any) => <div>{children}</div>,
  TooltipTrigger: ({ children }: any) => <div>{children}</div>,
  TooltipContent: ({ children }: any) => <div>{children}</div>,
}));

describe("EffectParameterControls", () => {
  const mockEffect: VideoEffect = {
    id: "test-effect",
    name: "Test Effect",
    type: "blur",
    duration: 1000,
    category: "artistic",
    complexity: "basic",
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test effect" },
    ffmpegCommand: (params) => `blur=${params.intensity || 50}`,
    params: {
      intensity: 50,
      radius: 5,
    },
    previewPath: "/test-preview.mp4",
    labels: {
      ru: "Тестовый эффект",
      en: "Test Effect",
      es: "Efecto de prueba",
      fr: "Effet de test",
      de: "Testeffekt",
    },
  };

  const mockOnParametersChange = vi.fn();

  it("should render parameter controls for effect with params", () => {
    const { container } = render(
      <EffectParameterControls
        effect={mockEffect}
        onParametersChange={mockOnParametersChange}
      />,
    );

    expect(container).toBeInTheDocument();
  });

  it("should not render when effect has no params", () => {
    const effectWithoutParams = { ...mockEffect, params: undefined };

    const renderResult = render(
      <EffectParameterControls
        effect={effectWithoutParams}
        onParametersChange={mockOnParametersChange}
      />,
    );

    expect(renderResult.container.firstChild).toBeNull();
  });

  it("should not render when effect has empty params", () => {
    const effectWithEmptyParams = { ...mockEffect, params: {} };

    const renderResult = render(
      <EffectParameterControls
        effect={effectWithEmptyParams}
        onParametersChange={mockOnParametersChange}
      />,
    );

    expect(renderResult.container.firstChild).toBeNull();
  });

  it("should render with save preset functionality when provided", () => {
    const mockOnSavePreset = vi.fn();

    const { container } = render(
      <EffectParameterControls
        effect={mockEffect}
        onParametersChange={mockOnParametersChange}
        onSavePreset={mockOnSavePreset}
      />,
    );

    expect(container).toBeInTheDocument();
  });

  it("should handle selectedPreset prop", () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: {
        light: {
          name: { ru: "Легкий", en: "Light" },
          params: { intensity: 25, radius: 2 },
          description: { ru: "Легкий эффект", en: "Light effect" },
        },
      },
    };

    const { container } = render(
      <EffectParameterControls
        effect={effectWithPresets}
        onParametersChange={mockOnParametersChange}
        selectedPreset="light"
      />,
    );

    expect(container).toBeInTheDocument();
  });

  it("should render multiple parameters", () => {
    const effectWithMultipleParams = {
      ...mockEffect,
      params: {
        intensity: 50,
        radius: 5,
        speed: 1.0,
        angle: 0,
      },
    };

    const { container } = render(
      <EffectParameterControls
        effect={effectWithMultipleParams}
        onParametersChange={mockOnParametersChange}
      />,
    );

    expect(container).toBeInTheDocument();
  });
});
