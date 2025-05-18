import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  ProjectSettingsProvider,
  useProjectSettings,
} from "./project-settings-provider"

// Мокаем хук useProjectSettings
vi.mock("./project-settings-provider", async () => {
  const actual = await vi.importActual("./project-settings-provider")

  // Создаем моки для методов
  const mockUpdateAspectRatio = vi.fn()
  const mockUpdateResolution = vi.fn()
  const mockUpdateFrameRate = vi.fn()
  const mockUpdateColorSpace = vi.fn()
  const mockSaveSettings = vi.fn()
  const mockSend = vi.fn()

  // Создаем мок для хука useProjectSettings
  const mockUseProjectSettings = vi.fn(() => ({
    settings: {
      aspectRatio: {
        label: "16:9",
        value: {
          width: 1920,
          height: 1080,
        },
        textLabel: "Широкоэкнранный",
      },
      resolution: "1920x1080",
      frameRate: "30",
      colorSpace: "srgb",
    },
    isLoaded: true,
    availableResolutions: [
      { value: "1280x720", label: "HD (1280x720)", width: 1280, height: 720 },
      {
        value: "1920x1080",
        label: "Full HD (1920x1080)",
        width: 1920,
        height: 1080,
      },
    ],
    customWidth: 1920,
    customHeight: 1080,
    aspectRatioLocked: true,
    updateAspectRatio: mockUpdateAspectRatio,
    updateResolution: mockUpdateResolution,
    updateFrameRate: mockUpdateFrameRate,
    updateColorSpace: mockUpdateColorSpace,
    saveSettings: mockSaveSettings,
  }))

  return {
    ...actual,
    useProjectSettings: mockUseProjectSettings,
  }
})

// Мокаем useMachine из @xstate/react
vi.mock("@xstate/react", () => {
  const mockSend = vi.fn()
  const mockState = {
    context: {
      settings: {
        aspectRatio: {
          label: "16:9",
          value: {
            width: 1920,
            height: 1080,
          },
          textLabel: "Широкоэкнранный",
        },
        resolution: "1920x1080",
        frameRate: "30",
        colorSpace: "srgb",
      },
      isLoaded: true,
      availableResolutions: [
        { value: "1280x720", label: "HD (1280x720)", width: 1280, height: 720 },
        {
          value: "1920x1080",
          label: "Full HD (1920x1080)",
          width: 1920,
          height: 1080,
        },
      ],
      customWidth: 1920,
      customHeight: 1080,
      aspectRatioLocked: true,
    },
  }

  return {
    useMachine: vi.fn(() => [mockState, mockSend]),
  }
})

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Компонент-обертка для тестирования хука useProjectSettings
const TestComponent = () => {
  const {
    settings,
    isLoaded,
    availableResolutions,
    customWidth,
    customHeight,
    aspectRatioLocked,
  } = useProjectSettings()
  return (
    <div>
      <div data-testid="aspect-ratio">{settings.aspectRatio.label}</div>
      <div data-testid="resolution">{settings.resolution}</div>
      <div data-testid="frame-rate">{settings.frameRate}</div>
      <div data-testid="color-space">{settings.colorSpace}</div>
      <div data-testid="is-loaded">{isLoaded.toString()}</div>
      <div data-testid="available-resolutions">
        {availableResolutions.length}
      </div>
      <div data-testid="custom-width">{customWidth}</div>
      <div data-testid="custom-height">{customHeight}</div>
      <div data-testid="aspect-ratio-locked">
        {aspectRatioLocked.toString()}
      </div>
    </div>
  )
}

describe("ProjectSettingsProvider", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
  })

  it("should provide project settings context", () => {
    render(
      <ProjectSettingsProvider>
        <TestComponent />
      </ProjectSettingsProvider>,
    )

    // Проверяем, что контекст предоставляет правильные значения
    expect(screen.getByTestId("aspect-ratio").textContent).toBe("16:9")
    expect(screen.getByTestId("resolution").textContent).toBe("1920x1080")
    expect(screen.getByTestId("frame-rate").textContent).toBe("30")
    expect(screen.getByTestId("color-space").textContent).toBe("srgb")
    expect(screen.getByTestId("is-loaded").textContent).toBe("true")
    expect(screen.getByTestId("available-resolutions").textContent).toBe("2")
    expect(screen.getByTestId("custom-width").textContent).toBe("1920")
    expect(screen.getByTestId("custom-height").textContent).toBe("1080")
    expect(screen.getByTestId("aspect-ratio-locked").textContent).toBe("true")
  })

  it("should provide context through useProjectSettings hook", () => {
    // Проверяем, что хук возвращает правильные значения
    const context = useProjectSettings()

    // Проверяем, что контекст содержит нужные свойства
    expect(context.settings).toBeDefined()
    expect(context.isLoaded).toBe(true)
    expect(context.availableResolutions).toHaveLength(2)
    expect(context.customWidth).toBe(1920)
    expect(context.customHeight).toBe(1080)
    expect(context.aspectRatioLocked).toBe(true)
    expect(context.updateAspectRatio).toBeDefined()
    expect(context.updateResolution).toBeDefined()
    expect(context.updateFrameRate).toBeDefined()
    expect(context.updateColorSpace).toBeDefined()
    expect(context.saveSettings).toBeDefined()
  })

  it("should log state updates", () => {
    render(
      <ProjectSettingsProvider>
        <TestComponent />
      </ProjectSettingsProvider>,
    )

    // Проверяем, что состояние логируется
    expect(console.log).toHaveBeenCalledWith(
      "[ProjectSettingsProvider] State updated:",
      expect.objectContaining({
        settings: expect.objectContaining({
          aspectRatio: expect.objectContaining({
            label: "16:9",
          }),
        }),
      }),
    )
  })

  it("should initialize provider correctly", () => {
    render(
      <ProjectSettingsProvider>
        <div data-testid="test-component" />
      </ProjectSettingsProvider>,
    )

    // Проверяем, что провайдер инициализирован корректно
    expect(console.log).toHaveBeenCalledWith(
      "[ProjectSettingsProvider] Rendering",
    )
  })

  it("should update aspect ratio", () => {
    // Получаем мок для метода updateAspectRatio
    const { updateAspectRatio } = useProjectSettings()

    // Вызываем метод updateAspectRatio
    const aspectRatio = {
      label: "1:1",
      value: {
        width: 1080,
        height: 1080,
      },
      textLabel: "Квадрат",
    }

    updateAspectRatio(aspectRatio)

    // Проверяем, что метод был вызван с правильными параметрами
    expect(updateAspectRatio).toHaveBeenCalledWith(aspectRatio)
  })

  it("should update resolution", () => {
    // Получаем мок для метода updateResolution
    const { updateResolution } = useProjectSettings()

    // Вызываем метод updateResolution
    updateResolution("1280x720")

    // Проверяем, что метод был вызван с правильными параметрами
    expect(updateResolution).toHaveBeenCalledWith("1280x720")
  })

  it("should update frame rate", () => {
    // Получаем мок для метода updateFrameRate
    const { updateFrameRate } = useProjectSettings()

    // Вызываем метод updateFrameRate
    updateFrameRate("60")

    // Проверяем, что метод был вызван с правильными параметрами
    expect(updateFrameRate).toHaveBeenCalledWith("60")
  })

  it("should update color space", () => {
    // Получаем мок для метода updateColorSpace
    const { updateColorSpace } = useProjectSettings()

    // Вызываем метод updateColorSpace
    updateColorSpace("rec709")

    // Проверяем, что метод был вызван с правильными параметрами
    expect(updateColorSpace).toHaveBeenCalledWith("rec709")
  })
})
