import { ReactNode } from "react"

import { act, renderHook } from "@testing-library/react"
import { useHotkeys } from "react-hotkeys-hook"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { EditModeProvider, useEditMode, useEditModeContext } from "../../hooks/use-edit-mode"
import { EDIT_MODE_CONFIGS, EDIT_MODES } from "../../types/edit-modes"

// Мок для react-hotkeys-hook
vi.mock("react-hotkeys-hook", () => ({
  useHotkeys: vi.fn(),
}))

const mockUseHotkeys = vi.mocked(useHotkeys)

describe("use-edit-mode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Сохраняем оригинальный cursor
    document.body.style.cursor = ""
  })

  afterEach(() => {
    // Очищаем cursor после теста
    document.body.style.cursor = ""
  })

  describe("useEditMode", () => {
    it("инициализируется с режимом SELECT по умолчанию", () => {
      const { result } = renderHook(() => useEditMode())

      expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
      expect(result.current.cursor).toBe("default")
    })

    it("инициализируется с указанным режимом", () => {
      const { result } = renderHook(() => useEditMode(EDIT_MODES.TRIM))

      expect(result.current.editMode).toBe(EDIT_MODES.TRIM)
      expect(result.current.cursor).toBe("col-resize")
    })

    it("изменяет режим редактирования", () => {
      const { result } = renderHook(() => useEditMode())

      act(() => {
        result.current.setEditMode(EDIT_MODES.RIPPLE)
      })

      expect(result.current.editMode).toBe(EDIT_MODES.RIPPLE)
      expect(result.current.cursor).toBe("ew-resize")
    })

    it("проверяет текущий режим с помощью isEditMode", () => {
      const { result } = renderHook(() => useEditMode())

      expect(result.current.isEditMode(EDIT_MODES.SELECT)).toBe(true)
      expect(result.current.isEditMode(EDIT_MODES.TRIM)).toBe(false)

      act(() => {
        result.current.setEditMode(EDIT_MODES.TRIM)
      })

      expect(result.current.isEditMode(EDIT_MODES.SELECT)).toBe(false)
      expect(result.current.isEditMode(EDIT_MODES.TRIM)).toBe(true)
    })

    it("обновляет cursor документа при изменении режима", () => {
      const { result } = renderHook(() => useEditMode())

      expect(document.body.style.cursor).toBe("default")

      act(() => {
        result.current.setEditMode(EDIT_MODES.SPLIT)
      })

      expect(document.body.style.cursor).toBe("crosshair")
    })

    it("восстанавливает предыдущий cursor при unmount", () => {
      document.body.style.cursor = "pointer"
      const { unmount } = renderHook(() => useEditMode())

      expect(document.body.style.cursor).toBe("default")

      unmount()

      expect(document.body.style.cursor).toBe("pointer")
    })

    it("регистрирует горячие клавиши для всех режимов", () => {
      renderHook(() => useEditMode())

      // Проверяем, что useHotkeys вызван для каждого режима + Escape
      const totalModes = Object.values(EDIT_MODE_CONFIGS).length
      expect(mockUseHotkeys).toHaveBeenCalledTimes(totalModes + 1)

      // Проверяем регистрацию горячих клавиш для каждого режима
      Object.values(EDIT_MODE_CONFIGS).forEach((config, index) => {
        expect(mockUseHotkeys).toHaveBeenNthCalledWith(
          index + 1,
          config.hotkey.toLowerCase(),
          expect.any(Function),
          {
            preventDefault: true,
            enableOnFormTags: false,
          },
          [expect.any(Function)],
        )
      })

      // Проверяем регистрацию Escape
      expect(mockUseHotkeys).toHaveBeenLastCalledWith(
        "escape",
        expect.any(Function),
        {
          preventDefault: true,
          enableOnFormTags: false,
        },
        [expect.any(Function)],
      )
    })

    it("переключает режимы при вызове горячих клавиш", () => {
      const { result } = renderHook(() => useEditMode())

      // Получаем callback для горячей клавиши T (Trim)
      const trimHotkeyCall = mockUseHotkeys.mock.calls.find((call) => call[0] === "t")
      const trimCallback = trimHotkeyCall?.[1]

      act(() => {
        if (trimCallback) {
          trimCallback({} as KeyboardEvent, { keys: ["t"], scope: "", element: null } as any)
        }
      })

      expect(result.current.editMode).toBe(EDIT_MODES.TRIM)
    })

    it("возвращается в режим SELECT при нажатии Escape", () => {
      const { result } = renderHook(() => useEditMode())

      // Устанавливаем другой режим
      act(() => {
        result.current.setEditMode(EDIT_MODES.SPLIT)
      })

      // Находим callback для Escape
      const escapeCall = mockUseHotkeys.mock.calls.find((call) => call[0] === "escape")
      const escapeCallback = escapeCall?.[1]

      act(() => {
        if (escapeCallback) {
          escapeCallback({} as KeyboardEvent, { keys: ["escape"], scope: "", element: null } as any)
        }
      })

      expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
    })
  })

  describe("EditModeContext", () => {
    const wrapper = ({ children }: { children: ReactNode }) => <EditModeProvider>{children}</EditModeProvider>

    it("предоставляет контекст режима редактирования", () => {
      const { result } = renderHook(() => useEditModeContext(), { wrapper })

      expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
      expect(result.current.cursor).toBe("default")
      expect(typeof result.current.setEditMode).toBe("function")
      expect(typeof result.current.isEditMode).toBe("function")
    })

    it("выбрасывает ошибку при использовании вне провайдера", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

      expect(() => {
        renderHook(() => useEditModeContext())
      }).toThrow("useEditModeContext must be used within EditModeProvider")

      consoleError.mockRestore()
    })

    it("синхронизирует состояние между компонентами", () => {
      // Создаём общий wrapper для обоих хуков
      const TestComponent = () => {
        const context1 = useEditModeContext()
        const context2 = useEditModeContext()
        return { context1, context2 }
      }

      const { result } = renderHook(() => TestComponent(), { wrapper })

      expect(result.current.context1.editMode).toBe(EDIT_MODES.SELECT)
      expect(result.current.context2.editMode).toBe(EDIT_MODES.SELECT)

      act(() => {
        result.current.context1.setEditMode(EDIT_MODES.RATE)
      })

      expect(result.current.context1.editMode).toBe(EDIT_MODES.RATE)
      expect(result.current.context2.editMode).toBe(EDIT_MODES.RATE)
    })
  })

  describe("Интеграционные тесты", () => {
    it("полный цикл работы с режимами редактирования", () => {
      const { result } = renderHook(() => useEditMode())

      // Начальное состояние
      expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
      expect(document.body.style.cursor).toBe("default")

      // Переключение через setEditMode
      act(() => {
        result.current.setEditMode(EDIT_MODES.SLIP)
      })

      expect(result.current.editMode).toBe(EDIT_MODES.SLIP)
      expect(result.current.cursor).toBe("grab")
      expect(document.body.style.cursor).toBe("grab")

      // Переключение через горячую клавишу
      const rollHotkeyCall = mockUseHotkeys.mock.calls.find((call) => call[0] === "w")
      const rollCallback = rollHotkeyCall?.[1]

      act(() => {
        if (rollCallback) {
          rollCallback({} as KeyboardEvent, { keys: ["w"], scope: "", element: null } as any)
        }
      })

      expect(result.current.editMode).toBe(EDIT_MODES.ROLL)
      expect(document.body.style.cursor).toBe("col-resize")

      // Возврат в SELECT через Escape
      const escapeCall = mockUseHotkeys.mock.calls.find((call) => call[0] === "escape")
      const escapeCallback = escapeCall?.[1]

      act(() => {
        if (escapeCallback) {
          escapeCallback({} as KeyboardEvent, { keys: ["escape"], scope: "", element: null } as any)
        }
      })

      expect(result.current.editMode).toBe(EDIT_MODES.SELECT)
      expect(document.body.style.cursor).toBe("default")
    })

    it("корректно обрабатывает быстрое переключение режимов", () => {
      const { result } = renderHook(() => useEditMode())

      // Быстрое переключение между режимами
      act(() => {
        result.current.setEditMode(EDIT_MODES.TRIM)
        result.current.setEditMode(EDIT_MODES.RIPPLE)
        result.current.setEditMode(EDIT_MODES.ROLL)
      })

      expect(result.current.editMode).toBe(EDIT_MODES.ROLL)
      expect(document.body.style.cursor).toBe("col-resize")
    })

    it("проверяет все режимы редактирования", () => {
      const { result } = renderHook(() => useEditMode())

      Object.values(EDIT_MODES).forEach((mode) => {
        act(() => {
          result.current.setEditMode(mode)
        })

        expect(result.current.editMode).toBe(mode)
        expect(result.current.cursor).toBe(EDIT_MODE_CONFIGS[mode].cursor)
        expect(result.current.isEditMode(mode)).toBe(true)
      })
    })
  })
})
