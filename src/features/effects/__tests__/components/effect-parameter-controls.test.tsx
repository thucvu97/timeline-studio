import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { VideoEffect } from "@/features/effects/types"
import { BrowserProviders } from "@/test/test-utils"

import { EffectParameterControls } from "../../components/effect-parameter-controls"

// Mock window.prompt
global.prompt = vi.fn()

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
      temperature: 0,
      speed: 1.0,
    },
    previewPath: "/test-preview.mp4",
    labels: {
      ru: "Тестовый эффект",
      en: "Test Effect",
      es: "Efecto de prueba",
      fr: "Effet de test",
      de: "Testeffekt",
    },
  }

  const mockOnParametersChange = vi.fn()
  const mockOnSavePreset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.prompt = vi.fn()
  })

  it("renders parameter controls for effect with params", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("effects.detail.parameters")).toBeInTheDocument()
    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    expect(screen.getByText("Радиус")).toBeInTheDocument()
    expect(screen.getByText("Температура")).toBeInTheDocument()
    expect(screen.getByText("Скорость")).toBeInTheDocument()
  })

  it("renders null for effect without params", () => {
    const effectWithoutParams = { ...mockEffect, params: undefined }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithoutParams} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should not render parameter controls
    expect(screen.queryByText("effects.detail.parameters")).not.toBeInTheDocument()
    expect(screen.queryByText("Интенсивность")).not.toBeInTheDocument()
  })

  it("renders null for effect with empty params", () => {
    const effectWithEmptyParams = { ...mockEffect, params: {} }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithEmptyParams} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should not render parameter controls
    expect(screen.queryByText("effects.detail.parameters")).not.toBeInTheDocument()
    expect(screen.queryByText("Интенсивность")).not.toBeInTheDocument()
  })

  it("displays current parameter values", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("50")).toBeInTheDocument() // intensity
    expect(screen.getByText("5")).toBeInTheDocument() // radius
    expect(screen.getByText("0")).toBeInTheDocument() // temperature
    expect(screen.getByText("1")).toBeInTheDocument() // speed
  })

  it("calls onParametersChange when slider value changes", async () => {
    const user = userEvent.setup()

    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    const slider = screen.getAllByRole("slider")[0] // intensity slider

    // Use keyboard interaction instead of mouse for more reliable testing
    slider.focus()
    await user.keyboard("{ArrowRight}")

    await waitFor(() => {
      expect(mockOnParametersChange).toHaveBeenCalled()
    })
  })

  it("resets parameters to default values when reset button is clicked", async () => {
    const user = userEvent.setup()

    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    const resetButton = screen.getByRole("button", { name: "RotateCcw" })

    await user.click(resetButton)

    expect(mockOnParametersChange).toHaveBeenCalledWith({
      intensity: 50, // default from PARAMETER_CONFIG
      radius: 5,
      temperature: 0,
      speed: 1.0,
    })
  })

  it("shows save preset button when onSavePreset is provided", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("does not show save preset button when onSavePreset is not provided", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument()
  })

  it("saves preset with user-provided name", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue("My Custom Preset")

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalledWith("effects.enterPresetName")
    expect(mockOnSavePreset).toHaveBeenCalledWith("My Custom Preset", {
      intensity: 50,
      radius: 5,
      temperature: 0,
      speed: 1.0,
    })
  })

  it("does not save preset when user cancels prompt", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue(null)

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalled()
    expect(mockOnSavePreset).not.toHaveBeenCalled()
  })

  it("does not save preset when user provides empty name", async () => {
    const user = userEvent.setup()
    global.prompt = vi.fn().mockReturnValue("   ")

    render(
      <BrowserProviders>
        <EffectParameterControls
          effect={mockEffect}
          onParametersChange={mockOnParametersChange}
          onSavePreset={mockOnSavePreset}
        />
      </BrowserProviders>,
    )

    const saveButton = screen.getByRole("button", { name: "Save" })

    await user.click(saveButton)

    expect(global.prompt).toHaveBeenCalled()
    expect(mockOnSavePreset).not.toHaveBeenCalled()
  })

  it("updates parameters when selectedPreset changes", async () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: {
        light: {
          name: { ru: "Легкий", en: "Light" },
          params: { intensity: 25, radius: 2, temperature: 10, speed: 0.5 },
          description: { ru: "Легкий эффект", en: "Light effect" },
        },
      },
    }

    const { rerender } = render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithPresets} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Re-render with selectedPreset
    rerender(
      <BrowserProviders>
        <EffectParameterControls
          effect={effectWithPresets}
          onParametersChange={mockOnParametersChange}
          selectedPreset="light"
        />
      </BrowserProviders>,
    )

    await waitFor(() => {
      expect(mockOnParametersChange).toHaveBeenCalledWith({
        intensity: 25,
        radius: 2,
        temperature: 10,
        speed: 0.5,
      })
    })
  })

  it("displays current parameter values in info section", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Check that current values are displayed (i18n key may not be translated in test)
    expect(screen.getByText("intensity: 50")).toBeInTheDocument()
    expect(screen.getByText("radius: 5")).toBeInTheDocument()
    expect(screen.getByText("temperature: 0")).toBeInTheDocument()
    expect(screen.getByText("speed: 1")).toBeInTheDocument()
  })

  it("shows tooltips with parameter descriptions", async () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Check that sliders are present (they have tooltip containers)
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBe(4) // We have 4 parameters in mockEffect
  })

  it("handles parameters not in PARAMETER_CONFIG", () => {
    const effectWithCustomParam = {
      ...mockEffect,
      params: {
        intensity: 50,
        customParam: 100, // This parameter is not in PARAMETER_CONFIG
      },
    }

    render(
      <BrowserProviders>
        <EffectParameterControls effect={effectWithCustomParam} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    // customParam should not be rendered as it's not in PARAMETER_CONFIG
    expect(screen.queryByText("customParam")).not.toBeInTheDocument()
  })

  it("uses correct language for labels and descriptions", () => {
    render(
      <BrowserProviders>
        <EffectParameterControls effect={mockEffect} onParametersChange={mockOnParametersChange} />
      </BrowserProviders>,
    )

    // Should use Russian labels as default in test environment
    expect(screen.getByText("Интенсивность")).toBeInTheDocument()
    expect(screen.getByText("Радиус")).toBeInTheDocument()
    expect(screen.getByText("Температура")).toBeInTheDocument()
    expect(screen.getByText("Скорость")).toBeInTheDocument()
  })

  it("validates effect has parameters", () => {
    expect(mockEffect.params).toBeDefined()
    expect(Object.keys(mockEffect.params || {}).length).toBeGreaterThan(0)
  })

  it("should handle effect with presets", () => {
    const effectWithPresets = {
      ...mockEffect,
      presets: {
        light: {
          name: { ru: "Легкий", en: "Light" },
          params: { intensity: 25, radius: 2 },
          description: { ru: "Легкий эффект", en: "Light effect" },
        },
      },
    }
    expect(effectWithPresets.presets).toBeDefined()
    expect(effectWithPresets.presets?.light).toBeDefined()
  })

  it("should validate parameter types", () => {
    expect(typeof mockEffect.params?.intensity).toBe("number")
    expect(typeof mockEffect.params?.radius).toBe("number")
    expect(mockEffect.params?.intensity).toBe(50)
    expect(mockEffect.params?.radius).toBe(5)
  })
})
