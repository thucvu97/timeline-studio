import { fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useModal } from "@/features/modals/services/modal-provider"
import { useProjectSettings } from "@/features/project-settings/project-settings-provider"
import { DEFAULT_PROJECT_SETTINGS } from "@/types/project"

import { ProjectSettingsModal } from "./project-settings-modal"

// Мокаем хуки
vi.mock("@/features/project-settings/project-settings-provider")
vi.mock("@/features/modals/services/modal-provider")
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

describe("ProjectSettingsModal", () => {
  const mockUpdateSettings = vi.fn()
  const mockCloseModal = vi.fn()

  beforeEach(() => {
    // Настраиваем таймеры для тестирования setTimeout
    vi.useFakeTimers()
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()

    // Мокаем setTimeout
    vi.spyOn(global, "setTimeout")

    // Устанавливаем моки по умолчанию
    vi.mocked(useProjectSettings).mockReturnValue({
      settings: DEFAULT_PROJECT_SETTINGS,
      updateSettings: mockUpdateSettings,
      resetSettings: vi.fn(),
    })

    vi.mocked(useModal).mockReturnValue({
      closeModal: mockCloseModal,
      modalType: "project-settings",
      modalData: null,
      isOpen: true,
      openModal: vi.fn(),
      submitModal: vi.fn(),
    })

    // Мокаем window.dispatchEvent
    window.dispatchEvent = vi.fn()
  })

  it("should render correctly", () => {
    render(<ProjectSettingsModal />)

    // Проверяем, что компонент отрендерился
    expect(screen.getByText("dialogs.projectSettings.aspectRatio")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.resolution")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.customSize")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.frameRate")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.colorSpace")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.cancel")).toBeInTheDocument()
    expect(screen.getByText("dialogs.projectSettings.save")).toBeInTheDocument()
  })

  it("should handle aspect ratio change", () => {
    render(<ProjectSettingsModal />)

    // Находим селект соотношения сторон
    const aspectRatioSelect = screen.getByText("dialogs.projectSettings.aspectRatio").nextSibling as HTMLElement

    // Симулируем выбор нового соотношения сторон
    fireEvent.click(aspectRatioSelect)

    // Находим опцию 9:16 и кликаем по ней
    const option = screen.getByText("9:16 (dialogs.projectSettings.aspectRatioLabels.portrait)")
    fireEvent.click(option)

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.objectContaining({
          label: "9:16",
        }),
      }),
    )
  })

  it("should handle resolution change", () => {
    render(<ProjectSettingsModal />)

    // Находим селект разрешения
    const resolutionSelect = screen.getByText("dialogs.projectSettings.resolution").nextSibling as HTMLElement

    // Симулируем выбор нового разрешения
    fireEvent.click(resolutionSelect)

    // Находим опцию 2560x1440 и кликаем по ней
    const option = screen.getByText("2560x1440 (2K QHD)")
    fireEvent.click(option)

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        resolution: "2560x1440",
        aspectRatio: expect.objectContaining({
          value: expect.objectContaining({
            width: 2560,
            height: 1440,
          }),
        }),
      }),
    )
  })

  it("should handle custom width change", () => {
    render(<ProjectSettingsModal />)

    // Находим инпут ширины
    const widthInput = screen.getAllByRole("spinbutton")[0]

    // Вводим новую ширину
    fireEvent.change(widthInput, { target: { value: "2560" } })

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.objectContaining({
          value: expect.objectContaining({
            width: 2560,
            height: expect.any(Number),
          }),
        }),
      }),
    )
  })

  it("should handle custom height change", () => {
    render(<ProjectSettingsModal />)

    // Находим инпут высоты
    const heightInput = screen.getAllByRole("spinbutton")[1]

    // Вводим новую высоту
    fireEvent.change(heightInput, { target: { value: "1440" } })

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        aspectRatio: expect.objectContaining({
          value: expect.objectContaining({
            width: expect.any(Number),
            height: 1440,
          }),
        }),
      }),
    )
  })

  it("should handle aspect ratio lock/unlock", () => {
    render(<ProjectSettingsModal />)

    // Находим кнопку блокировки соотношения сторон
    const lockButton = screen.getByTitle("dialogs.projectSettings.unlockAspectRatio")

    // Кликаем по кнопке, чтобы разблокировать соотношение сторон
    fireEvent.click(lockButton)

    // Проверяем, что кнопка изменила свой title
    expect(screen.getByTitle("dialogs.projectSettings.lockAspectRatio")).toBeInTheDocument()

    // Кликаем по кнопке еще раз, чтобы заблокировать соотношение сторон
    fireEvent.click(screen.getByTitle("dialogs.projectSettings.lockAspectRatio"))

    // Проверяем, что кнопка вернула свой title
    expect(screen.getByTitle("dialogs.projectSettings.unlockAspectRatio")).toBeInTheDocument()
  })

  it("should handle frame rate change", () => {
    render(<ProjectSettingsModal />)

    // Находим селект частоты кадров
    const frameRateSelect = screen.getByText("dialogs.projectSettings.frameRate").nextSibling as HTMLElement

    // Симулируем выбор новой частоты кадров
    fireEvent.click(frameRateSelect)

    // Находим опцию 60 fps и кликаем по ней
    const option = screen.getByText("60 fps")
    fireEvent.click(option)

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        frameRate: "60",
      }),
    )
  })

  it("should handle color space change", () => {
    render(<ProjectSettingsModal />)

    // Находим селект цветового пространства
    const colorSpaceSelect = screen.getByText("dialogs.projectSettings.colorSpace").nextSibling as HTMLElement

    // Симулируем выбор нового цветового пространства
    fireEvent.click(colorSpaceSelect)

    // Находим опцию HDR - Rec.2100HLG и кликаем по ней
    const option = screen.getByText("HDR - Rec.2100HLG")
    fireEvent.click(option)

    // Проверяем, что updateSettings был вызван с правильными параметрами
    expect(mockUpdateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        colorSpace: "hdr-hlg",
      }),
    )
  })

  it("should handle cancel button click", () => {
    render(<ProjectSettingsModal />)

    // Находим кнопку "Отмена"
    const cancelButton = screen.getByText("dialogs.projectSettings.cancel")

    // Кликаем по кнопке
    fireEvent.click(cancelButton)

    // Проверяем, что closeModal был вызван
    expect(mockCloseModal).toHaveBeenCalled()
  })

  it("should handle save button click", () => {
    render(<ProjectSettingsModal />)

    // Находим кнопку "Сохранить"
    const saveButton = screen.getByText("dialogs.projectSettings.save")

    // Кликаем по кнопке
    fireEvent.click(saveButton)

    // Проверяем, что updateSettings был вызван
    expect(mockUpdateSettings).toHaveBeenCalled()

    // Проверяем, что был вызван setTimeout
    expect(setTimeout).toHaveBeenCalled()

    // Вызываем колбэк setTimeout
    vi.runAllTimers()

    // Проверяем, что closeModal был вызван
    expect(mockCloseModal).toHaveBeenCalled()

    // Проверяем, что было вызвано событие resize
    expect(window.dispatchEvent).toHaveBeenCalledWith(expect.any(Event))
  })

  afterEach(() => {
    // Восстанавливаем реальные таймеры после тестов
    vi.useRealTimers()
  })
})
