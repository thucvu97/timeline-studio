import { act, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type { EffectTag, VideoEffect } from "@/types/effects"

import { EffectIndicators } from "../../components/effect-indicators"

// Мокаем хук переводов
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}))

describe("EffectIndicators", () => {
  const baseEffect: VideoEffect = {
    id: "test-effect",
    name: "Test Effect",
    type: "blur",
    category: "artistic",
    complexity: "basic",
    tags: ["popular"],
    description: { ru: "Тестовый эффект", en: "Test Effect" },
    labels: {
      ru: "Тест",
      en: "Test",
      es: "Prueba",
      fr: "Test",
      de: "Test",
    },
    params: {},
    ffmpegCommand: () => "test",
    previewPath: "/effects/test.mp4",
    duration: 0,
  }

  it("should render category indicator", () => {
    render(<EffectIndicators effect={baseEffect} />)

    const categoryIndicator = screen.getByText("ART")
    expect(categoryIndicator).toBeInTheDocument()
    expect(categoryIndicator).toHaveClass("bg-black/70")
    expect(categoryIndicator).toHaveClass("text-white")
    expect(categoryIndicator).toHaveClass("font-medium")
  })

  it("should render tag indicators when present", () => {
    const effectWithTags: VideoEffect = {
      ...baseEffect,
      tags: ["popular", "professional", "experimental"],
    }

    render(<EffectIndicators effect={effectWithTags} />)

    // Проверяем индикаторы тегов
    expect(screen.getByText("POP")).toBeInTheDocument()
    expect(screen.getByText("PRO")).toBeInTheDocument()
    expect(screen.getByText("EXP")).toBeInTheDocument()
  })

  it("should not render tag indicators when tags are not present", () => {
    const effectWithoutTags = { ...baseEffect, tags: [] }

    render(<EffectIndicators effect={effectWithoutTags} />)

    // Должна быть только категория
    expect(screen.getByText("ART")).toBeInTheDocument()
    expect(screen.queryByText("POP")).not.toBeInTheDocument()
    expect(screen.queryByText("PRO")).not.toBeInTheDocument()
    expect(screen.queryByText("EXP")).not.toBeInTheDocument()
  })

  it("should handle different categories", () => {
    const categories = [
      { category: "artistic", expected: "ART" },
      { category: "vintage", expected: "VIN" },
      { category: "color-correction", expected: "CC" },
      { category: "motion", expected: "MOT" },
      { category: "distortion", expected: "DIS" },
      { category: "cinematic", expected: "CIN" },
      { category: "creative", expected: "CRE" },
      { category: "technical", expected: "TEC" },
      { category: "unknown", expected: "EFF" },
    ]

    categories.forEach(({ category, expected }) => {
      const effect = { ...baseEffect, category: category as any }
      const renderResult = render(<EffectIndicators effect={effect} />)

      const categoryIndicator = screen.getByText(expected)
      expect(categoryIndicator).toBeInTheDocument()
      expect(categoryIndicator).toHaveClass("bg-black/70")

      renderResult.unmount()
    })
  })

  it("should have correct styling for indicators", () => {
    render(<EffectIndicators effect={baseEffect} />)

    const categoryIndicator = screen.getByText("ART")
    expect(categoryIndicator).toHaveClass(
      "bg-black/70",
      "text-white",
      "font-medium",
      "text-[11px]",
      "px-1",
      "py-0.5",
      "rounded",
    )
  })

  it("should handle missing or undefined category gracefully", () => {
    const incompleteEffect = {
      ...baseEffect,
      category: undefined as any,
    }

    render(<EffectIndicators effect={incompleteEffect} />)

    // Должен отображаться fallback EFF
    expect(screen.getByText("EFF")).toBeInTheDocument()
  })

  it("should be accessible with proper titles", () => {
    render(<EffectIndicators effect={baseEffect} />)

    // Проверяем accessibility атрибуты
    expect(screen.getByTitle("effects.categories.artistic")).toBeInTheDocument()
  })

  it("should support different sizes", () => {
    const renderResult = render(<EffectIndicators effect={baseEffect} size="md" />)

    const categoryIndicator = screen.getByText("ART")
    expect(categoryIndicator).toHaveClass("text-[12px]", "px-1.5")

    renderResult.unmount()

    render(<EffectIndicators effect={baseEffect} size="sm" />)

    const smallCategoryIndicator = screen.getByText("ART")
    expect(smallCategoryIndicator).toHaveClass("text-[11px]", "px-1")
  })
})
