import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EffectDetail } from "../../components/effect-detail"
import { VideoEffect } from "../../types"
import { prepareEffectForExport, saveUserEffect } from "../../utils/user-effects"

// Мокаем внешние зависимости
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
    i18n: { language: "ru" },
  }),
}))

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}))

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
}))

vi.mock("@/components/ui/separator", () => ({
  Separator: () => <div data-testid="separator" />,
}))

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => <button data-testid={`tab-trigger-${value}`}>{children}</button>,
  TabsContent: ({ children, value }: any) => <div data-testid={`tab-content-${value}`}>{children}</div>,
}))

vi.mock("lucide-react", () => ({
  Download: () => <span data-testid="download-icon">Download</span>,
  Pause: () => <span data-testid="pause-icon">Pause</span>,
  Play: () => <span data-testid="play-icon">Play</span>,
  RotateCcw: () => <span data-testid="reset-icon">Reset</span>,
  SplitSquareHorizontal: () => <span data-testid="split-icon">Split</span>,
  Upload: () => <span data-testid="upload-icon">Upload</span>,
  X: () => <span data-testid="close-icon">X</span>,
}))

// Мокаем дочерние компоненты
vi.mock("../../components/effect-comparison", () => ({
  EffectComparison: ({ effect, customParams, width, height }: any) => (
    <div
      data-testid="effect-comparison"
      data-effect-id={effect.id}
      data-custom-params={JSON.stringify(customParams)}
      data-width={width}
      data-height={height}
    >
      Effect Comparison
    </div>
  ),
}))

vi.mock("../../components/effect-indicators", () => ({
  EffectIndicators: ({ effect, size }: any) => (
    <div data-testid="effect-indicators" data-effect-id={effect.id} data-size={size}>
      Effect Indicators
    </div>
  ),
}))

vi.mock("../../components/effect-parameter-controls", () => ({
  EffectParameterControls: ({ effect, onParametersChange, selectedPreset, onSavePreset }: any) => (
    <div data-testid="effect-parameter-controls" data-effect-id={effect.id} data-selected-preset={selectedPreset}>
      <button data-testid="change-parameters" onClick={() => onParametersChange({ intensity: 75, brightness: 120 })}>
        Change Parameters
      </button>
      <button data-testid="save-preset" onClick={() => onSavePreset("Custom Preset", { intensity: 50 })}>
        Save Preset
      </button>
    </div>
  ),
}))

vi.mock("../../components/effect-presets", () => ({
  EffectPresets: ({ effect, onApplyPreset, selectedPreset }: any) => (
    <div data-testid="effect-presets" data-effect-id={effect.id} data-selected-preset={selectedPreset || ""}>
      <button data-testid="apply-preset" onClick={() => onApplyPreset("light", { intensity: 25, radius: 2 })}>
        Apply Preset
      </button>
    </div>
  ),
}))

vi.mock("../../components/effect-preview", () => ({
  EffectPreview: ({ effectType, onClick, size, customParams }: any) => (
    <div
      data-testid="effect-preview"
      data-effect-type={effectType}
      data-size={size}
      data-custom-params={JSON.stringify(customParams)}
      onClick={onClick}
    >
      Effect Preview
    </div>
  ),
}))

// Мокаем утилиты
vi.mock("../../utils/user-effects", () => ({
  prepareEffectForExport: vi.fn(),
  saveUserEffect: vi.fn(),
}))

describe("EffectDetail", () => {
  const mockEffect: VideoEffect = {
    id: "test-effect",
    name: "Test Effect",
    category: "artistic",
    complexity: "basic",
    type: "blur",
    tags: ["popular", "blur"],
    labels: {
      ru: "Тестовый эффект",
      en: "Test Effect",
    },
    description: {
      ru: "Описание тестового эффекта",
      en: "Test effect description",
    },
    params: {
      intensity: 50,
      radius: 5,
    },
    ffmpegCommand: (params) => `blur=${params.intensity || 50}`,
    previewPath: "/test-preview.mp4",
  }

  const mockProps = {
    effect: mockEffect,
    isOpen: true,
    onClose: vi.fn(),
    onApplyEffect: vi.fn(),
  }

  const mockLocalStorage = (() => {
    let store: Record<string, string> = {}
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value
      }),
      clear: vi.fn(() => {
        store = {}
      }),
    }
  })()

  beforeEach(() => {
    vi.clearAllMocks()

    // Мокаем localStorage
    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    })

    // Мокаем prompt
    window.prompt = vi.fn()

    // Мокаем console
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})

    // Сброс моков утилит
    vi.mocked(prepareEffectForExport).mockReturnValue(mockEffect)
    vi.mocked(saveUserEffect).mockResolvedValue("/path/to/exported/effect.json")
  })

  describe("Рендеринг", () => {
    it("должен отображать диалог когда isOpen=true", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByTestId("dialog")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-content")).toBeInTheDocument()
      expect(screen.getByTestId("dialog-header")).toBeInTheDocument()
    })

    it("не должен отображать диалог когда isOpen=false", () => {
      render(<EffectDetail {...mockProps} isOpen={false} />)

      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument()
    })

    it("должен отображать название эффекта", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByTestId("dialog-title")).toHaveTextContent("Тестовый эффект")
    })

    it("должен отображать fallback на английский при отсутствии русского названия", () => {
      const effectWithoutRuLabel = {
        ...mockEffect,
        labels: { en: "English Only" },
      }

      render(<EffectDetail {...mockProps} effect={effectWithoutRuLabel} />)

      expect(screen.getByTestId("dialog-title")).toHaveTextContent("English Only")
    })

    it("должен отображать индикаторы эффекта", () => {
      render(<EffectDetail {...mockProps} />)

      const indicators = screen.getByTestId("effect-indicators")
      expect(indicators).toBeInTheDocument()
      expect(indicators).toHaveAttribute("data-effect-id", "test-effect")
      expect(indicators).toHaveAttribute("data-size", "md")
    })

    it("должен отображать табы для превью и сравнения", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByTestId("tabs")).toBeInTheDocument()
      expect(screen.getByTestId("tab-trigger-preview")).toBeInTheDocument()
      expect(screen.getByTestId("tab-trigger-comparison")).toBeInTheDocument()
    })

    it("должен отображать описание эффекта", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByText("Описание тестового эффекта")).toBeInTheDocument()
    })

    it("должен отображать категорию и теги", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByText("artistic")).toBeInTheDocument()
      expect(screen.getByText("popular")).toBeInTheDocument()
      expect(screen.getByText("blur")).toBeInTheDocument()
    })

    it("должен отображать FFmpeg команду", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByText("blur=50")).toBeInTheDocument()
    })
  })

  describe("Компоненты", () => {
    it("должен рендерить EffectPreview с правильными пропсами", () => {
      render(<EffectDetail {...mockProps} />)

      const preview = screen.getByTestId("effect-preview")
      expect(preview).toBeInTheDocument()
      expect(preview).toHaveAttribute("data-effect-type", "blur")
      expect(preview).toHaveAttribute("data-size", "400")
    })

    it("должен рендерить EffectComparison с правильными пропсами", () => {
      render(<EffectDetail {...mockProps} />)

      const comparison = screen.getByTestId("effect-comparison")
      expect(comparison).toBeInTheDocument()
      expect(comparison).toHaveAttribute("data-effect-id", "test-effect")
      expect(comparison).toHaveAttribute("data-width", "400")
      expect(comparison).toHaveAttribute("data-height", "300")
    })

    it("должен рендерить EffectPresets", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByTestId("effect-presets")).toBeInTheDocument()
    })

    it("должен рендерить EffectParameterControls", () => {
      render(<EffectDetail {...mockProps} />)

      expect(screen.getByTestId("effect-parameter-controls")).toBeInTheDocument()
    })
  })

  describe("Обработчики событий", () => {
    it("должен закрывать диалог при клике на кнопку X", () => {
      render(<EffectDetail {...mockProps} />)

      const closeButton = screen.getByTestId("close-icon").closest("button")
      fireEvent.click(closeButton!)

      expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    })

    it("должен закрывать диалог при клике на кнопку Отмена", () => {
      render(<EffectDetail {...mockProps} />)

      const cancelButton = screen.getByText("Отмена")
      fireEvent.click(cancelButton)

      expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    })

    it("должен переключать воспроизведение при клике на превью", () => {
      render(<EffectDetail {...mockProps} />)

      const preview = screen.getByTestId("effect-preview")
      fireEvent.click(preview)

      // После клика иконка должна измениться на паузу
      expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
    })

    it("должен переключать воспроизведение при клике на кнопку play/pause", () => {
      render(<EffectDetail {...mockProps} />)

      const playButton = screen.getByTestId("play-icon").closest("button")
      fireEvent.click(playButton!)

      expect(screen.getByTestId("pause-icon")).toBeInTheDocument()
    })

    it("должен сбрасывать параметры при клике на reset", () => {
      render(<EffectDetail {...mockProps} />)

      // Сначала изменим параметры
      const changeButton = screen.getByTestId("change-parameters")
      fireEvent.click(changeButton)

      // Затем сбросим
      const resetButton = screen.getByTestId("reset-icon").closest("button")
      fireEvent.click(resetButton!)

      // Параметры должны сброситься
      const preview = screen.getByTestId("effect-preview")
      expect(preview).toHaveAttribute("data-custom-params", "{}")
    })

    it("должен применять эффект и закрывать диалог", () => {
      render(<EffectDetail {...mockProps} />)

      const applyButton = screen.getByText("Применить эффект")
      fireEvent.click(applyButton)

      expect(mockProps.onApplyEffect).toHaveBeenCalledWith(mockEffect, undefined, {})
      expect(mockProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe("Управление пресетами", () => {
    it("должен применять пресет и обновлять параметры", () => {
      render(<EffectDetail {...mockProps} />)

      const applyPresetButton = screen.getByTestId("apply-preset")
      fireEvent.click(applyPresetButton)

      // Проверяем что параметры обновились
      const preview = screen.getByTestId("effect-preview")
      expect(preview).toHaveAttribute("data-custom-params", '{"intensity":25,"radius":2}')

      // Проверяем что пресет выбран
      const presets = screen.getByTestId("effect-presets")
      expect(presets).toHaveAttribute("data-selected-preset", "light")
    })

    it("должен сбрасывать выбранный пресет при ручном изменении параметров", () => {
      render(<EffectDetail {...mockProps} />)

      // Сначала применим пресет
      const applyPresetButton = screen.getByTestId("apply-preset")
      fireEvent.click(applyPresetButton)

      // Затем изменим параметры вручную
      const changeButton = screen.getByTestId("change-parameters")
      fireEvent.click(changeButton)

      // Пресет должен сброситься
      const presets = screen.getByTestId("effect-presets")
      expect(presets).toHaveAttribute("data-selected-preset", "")
    })

    it("должен сохранять пользовательский пресет", () => {
      render(<EffectDetail {...mockProps} />)

      const saveButton = screen.getByTestId("save-preset")
      fireEvent.click(saveButton)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "effect_presets_test-effect",
        expect.stringContaining("Custom Preset"),
      )
      expect(console.log).toHaveBeenCalledWith("Custom preset saved:", "Custom Preset", { intensity: 50 })
    })

    it("должен обрабатывать ошибки при сохранении пресета", () => {
      // Мокаем ошибку localStorage
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error("Storage error")
      })

      render(<EffectDetail {...mockProps} />)

      const saveButton = screen.getByTestId("save-preset")
      fireEvent.click(saveButton)

      expect(console.error).toHaveBeenCalledWith("Error saving custom preset:", expect.any(Error))
    })
  })

  describe("Экспорт эффекта", () => {
    it("должен экспортировать эффект с пользовательскими параметрами", async () => {
      vi.mocked(window.prompt).mockReturnValue("My Effect")

      render(<EffectDetail {...mockProps} />)

      // Изменим параметры
      const changeButton = screen.getByTestId("change-parameters")
      fireEvent.click(changeButton)

      const exportButton = screen.getByTestId("download-icon").closest("button")
      fireEvent.click(exportButton!)

      await waitFor(() => {
        expect(prepareEffectForExport).toHaveBeenCalledWith(mockEffect, { intensity: 75, brightness: 120 }, undefined)
        expect(saveUserEffect).toHaveBeenCalledWith(mockEffect, "My Effect")
        expect(console.log).toHaveBeenCalledWith("Effect exported to:", "/path/to/exported/effect.json")
      })
    })

    it("должен отменять экспорт если пользователь не ввел название", async () => {
      vi.mocked(window.prompt).mockReturnValue(null)

      render(<EffectDetail {...mockProps} />)

      const exportButton = screen.getByTestId("download-icon").closest("button")
      fireEvent.click(exportButton!)

      await waitFor(() => {
        expect(prepareEffectForExport).not.toHaveBeenCalled()
        expect(saveUserEffect).not.toHaveBeenCalled()
      })
    })

    it("должен обрабатывать ошибки экспорта", async () => {
      vi.mocked(window.prompt).mockReturnValue("My Effect")
      vi.mocked(saveUserEffect).mockRejectedValue(new Error("Export error"))

      render(<EffectDetail {...mockProps} />)

      const exportButton = screen.getByTestId("download-icon").closest("button")
      fireEvent.click(exportButton!)

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith("Error exporting effect:", expect.any(Error))
      })
    })
  })

  describe("Обновление превью", () => {
    it("должен обновлять превью при изменении параметров", () => {
      render(<EffectDetail {...mockProps} />)

      const changeButton = screen.getByTestId("change-parameters")
      fireEvent.click(changeButton)

      const preview = screen.getByTestId("effect-preview")
      expect(preview).toHaveAttribute("data-custom-params", '{"intensity":75,"brightness":120}')

      const comparison = screen.getByTestId("effect-comparison")
      expect(comparison).toHaveAttribute("data-custom-params", '{"intensity":75,"brightness":120}')
    })

    it("должен обновлять FFmpeg команду при изменении параметров", () => {
      render(<EffectDetail {...mockProps} />)

      const changeButton = screen.getByTestId("change-parameters")
      fireEvent.click(changeButton)

      // FFmpeg команда должна обновиться с новыми параметрами
      expect(screen.getByText("blur=75")).toBeInTheDocument()
    })
  })

  describe("Локализация", () => {
    it("должен использовать fallback на английский при отсутствии русского описания", () => {
      const effectWithoutRuDescription = {
        ...mockEffect,
        description: { ru: "", en: "English description only" },
      }

      render(<EffectDetail {...mockProps} effect={effectWithoutRuDescription} />)

      expect(screen.getByText("English description only")).toBeInTheDocument()
    })

    it("должен корректно обрабатывать эффект без описания", () => {
      const effectWithoutDescription = {
        ...mockEffect,
        description: { ru: "", en: "" },
      }

      render(<EffectDetail {...mockProps} effect={effectWithoutDescription} />)

      // Компонент должен рендериться без ошибок
      expect(screen.getByTestId("dialog")).toBeInTheDocument()
    })
  })

  describe("Состояние компонента", () => {
    it("должен применять эффект с выбранным пресетом", () => {
      render(<EffectDetail {...mockProps} />)

      // Применяем пресет
      const applyPresetButton = screen.getByTestId("apply-preset")
      fireEvent.click(applyPresetButton)

      // Применяем эффект
      const applyButton = screen.getByText("Применить эффект")
      fireEvent.click(applyButton)

      expect(mockProps.onApplyEffect).toHaveBeenCalledWith(mockEffect, "light", { intensity: 25, radius: 2 })
    })

    it("должен правильно обрабатывать состояние с пустыми параметрами", () => {
      const effectWithoutParams = {
        ...mockEffect,
        params: undefined,
      }

      render(<EffectDetail {...mockProps} effect={effectWithoutParams} />)

      expect(screen.getByTestId("dialog")).toBeInTheDocument()
      expect(screen.getByText("blur=50")).toBeInTheDocument() // fallback значение
    })
  })
})
