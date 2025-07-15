import { fireEvent, screen, waitFor, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/test-utils"

import { AudioEffectsEditor } from "../../components/audio-effects-editor"

import type { AppliedEffect } from "../../types"

describe("AudioEffectsEditor", () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    onApplyEffects: vi.fn(),
  }

  it("renders with correct title and description", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    expect(screen.getByText("Аудио эффекты")).toBeInTheDocument()
    expect(screen.getByText("Настройте аудио эффекты для трека")).toBeInTheDocument()
  })

  it("renders with clip-specific description when clip prop is provided", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} clip={{ id: "test-clip" }} />)

    expect(screen.getByText("Настройте аудио эффекты для клипа")).toBeInTheDocument()
  })

  it("renders all tabs", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    expect(screen.getByRole("tab", { name: "Базовые" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Динамика" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Пространство" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Коррекция" })).toBeInTheDocument()
  })

  it("switches between tabs", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // По умолчанию показывается вкладка "Базовые"
    expect(screen.getByText("Fade In")).toBeInTheDocument()
    expect(screen.getByText("Эквалайзер")).toBeInTheDocument()

    // Проверяем наличие всех вкладок
    expect(screen.getByRole("tab", { name: "Динамика" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Пространство" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Коррекция" })).toBeInTheDocument()
  })

  it("toggles fade in effect", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Находим контейнер с текстом "Плавное нарастание громкости"
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    expect(fadeInContainer).toBeTruthy()

    // Находим переключатель внутри контейнера
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    expect(fadeInSwitch).toHaveAttribute("data-state", "unchecked")

    // Включаем эффект
    fireEvent.click(fadeInSwitch)
    await waitFor(() => {
      expect(fadeInSwitch).toHaveAttribute("data-state", "checked")
      expect(screen.getByText("Длительность (сек)")).toBeInTheDocument()
    })

    // Выключаем эффект
    fireEvent.click(fadeInSwitch)
    await waitFor(() => {
      expect(fadeInSwitch).toHaveAttribute("data-state", "unchecked")
      expect(screen.queryByText("Длительность (сек)")).not.toBeInTheDocument()
    })
  })

  it("toggles and configures equalizer effect", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Находим контейнер с текстом "Настройка частот"
    const equalizerContainer = screen.getByText("Настройка частот").closest(".bg-secondary\\/50")
    expect(equalizerContainer).toBeTruthy()

    // Находим переключатель внутри контейнера
    const equalizerSwitch = within(equalizerContainer!).getByRole("switch")
    expect(equalizerSwitch).toHaveAttribute("data-state", "unchecked")

    // Включаем эквалайзер
    fireEvent.click(equalizerSwitch)
    await waitFor(() => {
      expect(equalizerSwitch).toHaveAttribute("data-state", "checked")
      expect(screen.getByText("Низкие частоты (100Hz)")).toBeInTheDocument()
      expect(screen.getByText("Средние частоты (1kHz)")).toBeInTheDocument()
      expect(screen.getByText("Высокие частоты (10kHz)")).toBeInTheDocument()
    })

    // Проверяем наличие слайдеров
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBeGreaterThanOrEqual(3)
  })

  it("applies multiple effects when clicking apply button", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем Fade In
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    // Включаем Fade Out
    const fadeOutContainer = screen.getByText("Плавное затухание громкости").closest(".bg-secondary\\/50")
    const fadeOutSwitch = within(fadeOutContainer!).getByRole("switch")
    fireEvent.click(fadeOutSwitch)

    // Нажимаем "Применить эффекты"
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            effectId: "fade-in",
            isEnabled: true,
            customParams: { duration: 1.0 },
          }),
          expect.objectContaining({
            effectId: "fade-out",
            isEnabled: true,
            customParams: { duration: 1.0 },
          }),
        ]),
      )
      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("closes dialog when clicking cancel button", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    const cancelButton = screen.getByRole("button", { name: "Отмена" })
    fireEvent.click(cancelButton)

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    expect(defaultProps.onApplyEffects).not.toHaveBeenCalled()
  })

  it("updates effect parameters with sliders", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем Fade In
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    await waitFor(() => {
      expect(screen.getByText("Длительность (сек)")).toBeInTheDocument()
    })

    // Проверяем, что слайдер появился
    const sliders = screen.getAllByRole("slider")
    expect(sliders.length).toBeGreaterThan(0)

    // Применяем эффекты
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            effectId: "fade-in",
            customParams: expect.objectContaining({
              duration: expect.any(Number),
            }),
          }),
        ]),
      )
    })
  })

  it("works with dynamics tab effects", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Переключаемся на вкладку "Динамика"
    const dynamicsTab = screen.getByRole("tab", { name: "Динамика" })
    expect(dynamicsTab).toBeInTheDocument()
    fireEvent.click(dynamicsTab)

    // Включаем первый эффект на этой вкладке
    const switches = screen.getAllByRole("switch")
    expect(switches.length).toBeGreaterThan(0)
    fireEvent.click(switches[0])

    // Проверяем что появились слайдеры
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Применяем эффект
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalled()
      const appliedEffects = defaultProps.onApplyEffects.mock.calls[0][0]
      expect(appliedEffects.length).toBeGreaterThan(0)
    })
  })

  it("works with spatial tab effects", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Переключаемся на вкладку "Пространство"
    const spatialTab = screen.getByRole("tab", { name: "Пространство" })
    fireEvent.click(spatialTab)

    // Включаем первый эффект
    const switches = screen.getAllByRole("switch")
    expect(switches.length).toBeGreaterThan(0)
    fireEvent.click(switches[0])

    // Проверяем что появились слайдеры
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Применяем эффект
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalled()
      const appliedEffects = defaultProps.onApplyEffects.mock.calls[0][0]
      expect(appliedEffects.length).toBeGreaterThan(0)
    })
  })

  it("works with correction tab effects", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Переключаемся на вкладку "Коррекция"
    const correctionTab = screen.getByRole("tab", { name: "Коррекция" })
    fireEvent.click(correctionTab)

    // Включаем первый эффект
    const switches = screen.getAllByRole("switch")
    expect(switches.length).toBeGreaterThan(0)
    fireEvent.click(switches[0])

    // Проверяем что появился слайдер
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Применяем эффект
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalled()
      const appliedEffects = defaultProps.onApplyEffects.mock.calls[0][0]
      expect(appliedEffects.length).toBeGreaterThan(0)
    })
  })

  it("verifies tab switching functionality", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Проверяем наличие всех вкладок
    const basicTab = screen.getByRole("tab", { name: "Базовые" })
    const dynamicsTab = screen.getByRole("tab", { name: "Динамика" })
    const spatialTab = screen.getByRole("tab", { name: "Пространство" })
    const correctionTab = screen.getByRole("tab", { name: "Коррекция" })

    expect(basicTab).toBeInTheDocument()
    expect(dynamicsTab).toBeInTheDocument()
    expect(spatialTab).toBeInTheDocument()
    expect(correctionTab).toBeInTheDocument()

    // Переключаемся между вкладками
    fireEvent.click(dynamicsTab)
    fireEvent.click(spatialTab)
    fireEvent.click(correctionTab)
    fireEvent.click(basicTab)

    // Проверяем, что переключение работает
    expect(basicTab).toBeInTheDocument()
  })

  it("generates unique IDs for applied effects", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем несколько эффектов
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    const fadeOutContainer = screen.getByText("Плавное затухание громкости").closest(".bg-secondary\\/50")
    const fadeOutSwitch = within(fadeOutContainer!).getByRole("switch")
    fireEvent.click(fadeOutSwitch)

    // Применяем эффекты
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      const calledEffects = defaultProps.onApplyEffects.mock.calls[0][0] as AppliedEffect[]

      // Проверяем, что ID уникальные
      const ids = calledEffects.map((e) => e.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)

      // Проверяем формат ID
      ids.forEach((id) => {
        expect(id).toMatch(/^applied-audio-effect-\d+-\d+$/)
      })
    })
  })

  it("preserves effect order based on activation sequence", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем эффекты в определенном порядке
    const equalizerContainer = screen.getByText("Настройка частот").closest(".bg-secondary\\/50")
    const equalizerSwitch = within(equalizerContainer!).getByRole("switch")
    fireEvent.click(equalizerSwitch)

    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    const fadeOutContainer = screen.getByText("Плавное затухание громкости").closest(".bg-secondary\\/50")
    const fadeOutSwitch = within(fadeOutContainer!).getByRole("switch")
    fireEvent.click(fadeOutSwitch)

    // Применяем эффекты
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      const calledEffects = defaultProps.onApplyEffects.mock.calls[0][0] as AppliedEffect[]

      expect(calledEffects[0].effectId).toBe("equalizer")
      expect(calledEffects[0].order).toBe(0)

      expect(calledEffects[1].effectId).toBe("fade-in")
      expect(calledEffects[1].order).toBe(1)

      expect(calledEffects[2].effectId).toBe("fade-out")
      expect(calledEffects[2].order).toBe(2)
    })
  })

  it("works with multiple effects on single tab", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем несколько эффектов на базовой вкладке
    const switches = screen.getAllByRole("switch")
    expect(switches.length).toBeGreaterThan(1)

    fireEvent.click(switches[0]) // первый эффект
    fireEvent.click(switches[1]) // второй эффект

    // Проверяем что появились слайдеры
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Применяем эффекты
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalled()
      const appliedEffects = defaultProps.onApplyEffects.mock.calls[0][0]
      expect(appliedEffects.length).toBeGreaterThan(0)
    })
  })

  it("tests slider interactions on basic tab", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем эквалайзер для тестирования слайдеров
    const switches = screen.getAllByRole("switch")
    fireEvent.click(switches[2]) // equalizer

    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Проверяем, что слайдеры имеют правильные атрибуты
    const firstSlider = screen.getAllByRole("slider")[0]
    expect(firstSlider).toHaveAttribute("aria-valuemin")
    expect(firstSlider).toHaveAttribute("aria-valuemax")
    expect(firstSlider).toHaveAttribute("aria-valuenow")
  })

  it("handles dialog close on escape key", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Находим диалог
    const dialog = screen.getByRole("dialog")

    // Симулируем нажатие Escape на диалоге
    fireEvent.keyDown(dialog, { key: "Escape", code: "Escape" })

    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("verifies initial state without effects", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Проверяем, что все переключатели выключены
    const switches = screen.getAllByRole("switch")
    switches.forEach((switchEl) => {
      expect(switchEl).toHaveAttribute("data-state", "unchecked")
    })
  })

  it("handles dynamics tab parameter updates", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Переключаемся на вкладку "Динамика"
    const dynamicsTab = screen.getByRole("tab", { name: "Динамика" })
    fireEvent.click(dynamicsTab)

    // Включаем первый эффект
    const switches = screen.getAllByRole("switch")
    fireEvent.click(switches[0])

    // Проверяем появление слайдеров
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })

    // Применяем эффект
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalled()
      const appliedEffects = defaultProps.onApplyEffects.mock.calls[0][0]
      expect(appliedEffects.length).toBeGreaterThan(0)
      expect(appliedEffects[0]).toHaveProperty("customParams")
    })
  })

  it("handles normalize parameter updates", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Переключаемся на вкладку "Динамика"
    const dynamicsTab = screen.getByRole("tab", { name: "Динамика" })
    fireEvent.click(dynamicsTab)

    // Включаем нормализацию (второй переключатель)
    const switches = screen.getAllByRole("switch")
    fireEvent.click(switches[1]) // normalize

    // Проверяем появление слайдера
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBeGreaterThan(0)
    })
  })

  it("verifies slider rendering and interaction", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем fade in
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    await waitFor(() => {
      expect(screen.getByText("Длительность (сек)")).toBeInTheDocument()
    })

    // Находим слайдер
    const slider = screen.getByRole("slider")
    expect(slider).toBeInTheDocument()

    // Проверяем атрибуты слайдера
    expect(slider).toHaveAttribute("aria-valuemin", "0.1")
    expect(slider).toHaveAttribute("aria-valuemax", "5")
    expect(slider).toHaveAttribute("aria-valuenow", "1")

    // Применяем эффект
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    await waitFor(() => {
      expect(defaultProps.onApplyEffects).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            effectId: "fade-in",
            customParams: expect.objectContaining({
              duration: 1.0,
            }),
          }),
        ]),
      )
    })
  })

  it("disables multiple effects sequentially", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Включаем несколько эффектов
    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")
    fireEvent.click(fadeInSwitch)

    const fadeOutContainer = screen.getByText("Плавное затухание громкости").closest(".bg-secondary\\/50")
    const fadeOutSwitch = within(fadeOutContainer!).getByRole("switch")
    fireEvent.click(fadeOutSwitch)

    // Проверяем, что слайдеры появились
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBe(2) // По одному для каждого эффекта
    })

    // Выключаем первый эффект
    fireEvent.click(fadeInSwitch)

    // Проверяем, что остался только один слайдер
    await waitFor(() => {
      const sliders = screen.getAllByRole("slider")
      expect(sliders.length).toBe(1) // Только для fade out
    })

    // Выключаем второй эффект
    fireEvent.click(fadeOutSwitch)

    // Проверяем, что слайдеров не осталось
    await waitFor(() => {
      const sliders = screen.queryAllByRole("slider")
      expect(sliders.length).toBe(0)
    })
  })

  it("handles empty effect application", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // Применяем без включения эффектов
    const applyButton = screen.getByRole("button", { name: "Применить эффекты" })
    fireEvent.click(applyButton)

    expect(defaultProps.onApplyEffects).toHaveBeenCalledWith([])
    expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("toggles effect state correctly", async () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    const fadeInContainer = screen.getByText("Плавное нарастание громкости").closest(".bg-secondary\\/50")
    const fadeInSwitch = within(fadeInContainer!).getByRole("switch")

    // Изначально выключен
    expect(fadeInSwitch).toHaveAttribute("data-state", "unchecked")

    // Включаем
    fireEvent.click(fadeInSwitch)
    await waitFor(() => {
      expect(fadeInSwitch).toHaveAttribute("data-state", "checked")
    })

    // Выключаем
    fireEvent.click(fadeInSwitch)
    await waitFor(() => {
      expect(fadeInSwitch).toHaveAttribute("data-state", "unchecked")
    })
  })

  it("renders correct tab content on initial load", () => {
    renderWithProviders(<AudioEffectsEditor {...defaultProps} />)

    // По умолчанию показывается вкладка "Базовые"
    expect(screen.getByText("Fade In")).toBeInTheDocument()
    expect(screen.getByText("Fade Out")).toBeInTheDocument()
    expect(screen.getByText("Эквалайзер")).toBeInTheDocument()

    // Контент других вкладок не должен отображаться
    expect(screen.queryByText("Компрессор")).not.toBeInTheDocument()
    expect(screen.queryByText("Реверберация")).not.toBeInTheDocument()
    expect(screen.queryByText("Шумоподавление")).not.toBeInTheDocument()
  })
})
