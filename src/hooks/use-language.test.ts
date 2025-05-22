import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_LANGUAGE } from "@/i18n/constants"

import { useLanguage } from "./use-language"

// Импортируем замоканную функцию invoke

// Мокаем invoke из Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: {
      language: "ru",
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}))

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key]
    }),
  }
})()

// Мокаем console.log и console.error
vi.spyOn(console, "log").mockImplementation(() => {})
vi.spyOn(console, "error").mockImplementation(() => {})

// Мокаем window.localStorage
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

describe("useLanguage", () => {
  beforeEach(() => {
    // Очищаем моки перед каждым тестом
    vi.clearAllMocks()
    localStorageMock.clear()

    // Мокаем invoke по умолчанию
    vi.mocked(invoke).mockResolvedValue({
      language: "ru",
      system_language: "ru",
    })
  })

  it("should initialize with default language", async () => {
    const { result } = renderHook(() => useLanguage())

    // Проверяем начальное состояние
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что язык установлен правильно
    expect(result.current.currentLanguage).toBe("ru")
    expect(result.current.systemLanguage).toBe("ru")

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invoke).toHaveBeenCalledWith("get_app_language")
  })

  it("should change language", async () => {
    // Мокаем invoke для изменения языка
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        language: "ru",
        system_language: "ru",
      })
      .mockResolvedValueOnce({
        language: "en",
        system_language: "ru",
      })

    const { result } = renderHook(() => useLanguage())

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Изменяем язык
    await act(async () => {
      await result.current.changeLanguage("en")
    })

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invoke).toHaveBeenCalledWith("set_app_language", { lang: "en" })

    // Проверяем, что язык сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "en")
  })

  it("should handle error when fetching language", async () => {
    // Мокаем invoke для возврата ошибки
    vi.mocked(invoke).mockRejectedValueOnce(new Error("Failed to fetch language"))

    const { result } = renderHook(() => useLanguage())

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что ошибка обработана
    expect(result.current.error).toBe("Failed to fetch language")

    // Проверяем, что был вызван console.error
    expect(console.error).toHaveBeenCalled()

    // Проверяем, что была попытка получить язык из localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith("app-language")
  })

  it("should handle error when changing language", async () => {
    // Мокаем invoke для успешной инициализации
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        language: "ru",
        system_language: "ru",
      })
      .mockRejectedValueOnce(new Error("Failed to change language"))

    const { result } = renderHook(() => useLanguage())

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Изменяем язык
    await act(async () => {
      await result.current.changeLanguage("en")
    })

    // Проверяем, что ошибка обработана
    expect(result.current.error).toBe("Failed to change language")

    // Проверяем, что был вызван console.error
    expect(console.error).toHaveBeenCalled()
  })

  it("should handle unsupported language", async () => {
    // Мокаем invoke для возврата неподдерживаемого языка
    vi.mocked(invoke).mockResolvedValueOnce({
      language: "unsupported",
      system_language: "unsupported",
    })

    const { result } = renderHook(() => useLanguage())

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что язык установлен на язык по умолчанию
    expect(result.current.currentLanguage).toBe(DEFAULT_LANGUAGE)
    expect(result.current.systemLanguage).toBe(DEFAULT_LANGUAGE)
  })

  it("should refresh language", async () => {
    // Мокаем invoke для обновления языка
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        language: "ru",
        system_language: "ru",
      })
      .mockResolvedValueOnce({
        language: "en",
        system_language: "ru",
      })

    const { result } = renderHook(() => useLanguage())

    // Ждем завершения загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Очищаем моки
    vi.clearAllMocks()

    // Мокаем invoke для обновления языка
    vi.mocked(invoke).mockResolvedValueOnce({
      language: "en",
      system_language: "ru",
    })

    // Обновляем язык
    await act(async () => {
      await result.current.refreshLanguage()
    })

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invoke).toHaveBeenCalledWith("get_app_language")

    // Проверяем, что язык сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "en")
  })
})
