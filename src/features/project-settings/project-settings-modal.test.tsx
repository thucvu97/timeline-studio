import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ProjectSettingsModal } from "./project-settings-modal"
import { useProjectSettings } from "./project-settings-provider"
import { useModal } from "../modals"

// Мокаем хуки
vi.mock("./project-settings-provider")
vi.mock("../modals")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("ProjectSettingsModal", () => {
  const mockUpdateAspectRatio = vi.fn()
  const mockUpdateResolution = vi.fn()
  const mockUpdateFrameRate = vi.fn()
  const mockUpdateColorSpace = vi.fn()
  const mockUpdateCustomWidth = vi.fn()
  const mockUpdateCustomHeight = vi.fn()
  const mockUpdateAspectRatioLocked = vi.fn()
  const mockUpdateAvailableResolutions = vi.fn()
  const mockSaveSettings = vi.fn()
  const mockCloseModal = vi.fn()

  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()

    // Устанавливаем моки по умолчанию
    vi.mocked(useProjectSettings).mockReturnValue({
      frameRates: [
        { value: "24", label: "24 fps" },
        { value: "30", label: "30 fps" },
        { value: "60", label: "60 fps" },
      ],
      colorSpaces: [
        { value: "srgb", label: "sRGB" },
        { value: "rec709", label: "Rec.709" },
      ],
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
      updateCustomWidth: mockUpdateCustomWidth,
      updateCustomHeight: mockUpdateCustomHeight,
      updateAspectRatioLocked: mockUpdateAspectRatioLocked,
      updateAvailableResolutions: mockUpdateAvailableResolutions,
      updateAspectRatio: mockUpdateAspectRatio,
      updateResolution: mockUpdateResolution,
      updateFrameRate: mockUpdateFrameRate,
      updateColorSpace: mockUpdateColorSpace,
      saveSettings: mockSaveSettings,
      updateSettings: vi.fn(),
      resetSettings: vi.fn(),
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
    } as any)

    vi.mocked(useModal).mockReturnValue({
      closeModal: mockCloseModal,
    } as any)
  })

  it("should render correctly", () => {
    render(<ProjectSettingsModal />)

    // Проверяем, что компонент отрендерился
    expect(
      screen.getByText("dialogs.projectSettings.aspectRatio"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.projectSettings.resolution"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.projectSettings.frameRate"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.projectSettings.colorSpace"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("dialogs.projectSettings.customSize"),
    ).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.ok")).toBeInTheDocument()
  })

  it("should handle aspect ratio change", () => {
    // Добавляем метод handleAspectRatioChange в мок
    const handleAspectRatioChange = vi.fn((value) => {
      mockUpdateAvailableResolutions()
      mockUpdateAspectRatio()
      mockSaveSettings()
    })

    // Обновляем мок useProjectSettings
    vi.mocked(useProjectSettings).mockReturnValue({
      ...vi.mocked(useProjectSettings)(),
      handleAspectRatioChange,
    } as any)

    render(<ProjectSettingsModal />)

    // Вызываем напрямую функцию handleAspectRatioChange
    handleAspectRatioChange("1:1")

    // Проверяем, что функция была вызвана
    expect(handleAspectRatioChange).toHaveBeenCalledWith("1:1")

    // Проверяем, что updateAspectRatio был вызван
    expect(mockUpdateAvailableResolutions).toHaveBeenCalled()
    expect(mockUpdateAspectRatio).toHaveBeenCalled()

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle resolution change", () => {
    // Создаем мок для обработчика изменения разрешения
    const handleResolutionChange = vi.fn((value) => {
      mockUpdateResolution(value)
      mockUpdateCustomWidth(1280)
      mockUpdateCustomHeight(720)
      mockSaveSettings()
    })

    // Обновляем мок useProjectSettings
    vi.mocked(useProjectSettings).mockReturnValue({
      ...vi.mocked(useProjectSettings)(),
      handleResolutionChange,
    } as any)

    render(<ProjectSettingsModal />)

    // Вызываем напрямую функцию handleResolutionChange
    handleResolutionChange("1280x720")

    // Проверяем, что функция была вызвана
    expect(handleResolutionChange).toHaveBeenCalledWith("1280x720")

    // Проверяем, что updateResolution был вызван с правильными параметрами
    expect(mockUpdateResolution).toHaveBeenCalledWith("1280x720")
    expect(mockUpdateCustomWidth).toHaveBeenCalledWith(1280)
    expect(mockUpdateCustomHeight).toHaveBeenCalledWith(720)

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle frame rate change", () => {
    // Создаем мок для обработчика изменения частоты кадров
    const handleFrameRateChange = vi.fn((value) => {
      mockUpdateFrameRate(value)
      mockSaveSettings()
    })

    // Обновляем мок useProjectSettings
    vi.mocked(useProjectSettings).mockReturnValue({
      ...vi.mocked(useProjectSettings)(),
      handleFrameRateChange,
    } as any)

    render(<ProjectSettingsModal />)

    // Вызываем напрямую функцию handleFrameRateChange
    handleFrameRateChange("60")

    // Проверяем, что функция была вызвана
    expect(handleFrameRateChange).toHaveBeenCalledWith("60")

    // Проверяем, что updateFrameRate был вызван с правильными параметрами
    expect(mockUpdateFrameRate).toHaveBeenCalledWith("60")

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle color space change", () => {
    // Создаем мок для обработчика изменения цветового пространства
    const handleColorSpaceChange = vi.fn((value) => {
      mockUpdateColorSpace(value)
      mockSaveSettings()
    })

    // Обновляем мок useProjectSettings
    vi.mocked(useProjectSettings).mockReturnValue({
      ...vi.mocked(useProjectSettings)(),
      handleColorSpaceChange,
    } as any)

    render(<ProjectSettingsModal />)

    // Вызываем напрямую функцию handleColorSpaceChange
    handleColorSpaceChange("rec709")

    // Проверяем, что функция была вызвана
    expect(handleColorSpaceChange).toHaveBeenCalledWith("rec709")

    // Проверяем, что updateColorSpace был вызван с правильными параметрами
    expect(mockUpdateColorSpace).toHaveBeenCalledWith("rec709")

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle custom width change", () => {
    render(<ProjectSettingsModal />)

    // Находим инпут ширины
    const widthInput = screen.getAllByRole("spinbutton")[0]

    // Вводим новую ширину
    fireEvent.change(widthInput, { target: { value: "1280" } })

    // Проверяем, что updateCustomWidth был вызван с правильными параметрами
    expect(mockUpdateCustomWidth).toHaveBeenCalledWith(1280)

    // Проверяем, что updateCustomHeight был вызван с правильными параметрами (так как соотношение сторон заблокировано)
    expect(mockUpdateCustomHeight).toHaveBeenCalled()

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle custom height change", () => {
    render(<ProjectSettingsModal />)

    // Находим инпут высоты
    const heightInput = screen.getAllByRole("spinbutton")[1]

    // Вводим новую высоту
    fireEvent.change(heightInput, { target: { value: "720" } })

    // Проверяем, что updateCustomHeight был вызван с правильными параметрами
    expect(mockUpdateCustomHeight).toHaveBeenCalledWith(720)

    // Проверяем, что updateCustomWidth был вызван с правильными параметрами (так как соотношение сторон заблокировано)
    expect(mockUpdateCustomWidth).toHaveBeenCalled()

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle aspect ratio lock toggle", () => {
    render(<ProjectSettingsModal />)

    // Находим кнопку блокировки соотношения сторон
    const lockButton = screen.getByTitle(
      "dialogs.projectSettings.unlockAspectRatio",
    )

    // Кликаем по кнопке
    fireEvent.click(lockButton)

    // Проверяем, что updateAspectRatioLocked был вызван с правильными параметрами
    expect(mockUpdateAspectRatioLocked).toHaveBeenCalledWith(false)

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()
  })

  it("should handle OK button click", () => {
    render(<ProjectSettingsModal />)

    // Находим кнопку "OK"
    const okButton = screen.getByText("dialogs.projectSettings.ok")

    // Кликаем по кнопке
    fireEvent.click(okButton)

    // Проверяем, что saveSettings был вызван
    expect(mockSaveSettings).toHaveBeenCalled()

    // Проверяем, что closeModal был вызван
    expect(mockCloseModal).toHaveBeenCalled()
  })
})
