import { invoke } from "@tauri-apps/api/core"
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_LANGUAGE, LanguageCode } from "@/i18n/constants"

import { useLanguage } from "./use-language"

// Мокаем модули
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "ru",
      changeLanguage: vi.fn().mockResolvedValue(undefined),
    },
  }),
}))

describe("useLanguage", () => {
  // Получаем мок для invoke
  const invokeMock = vi.mocked(invoke)

  // Мокаем localStorage
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }

  // Мокаем console.error
  const consoleErrorMock = vi.fn()

  beforeEach(() => {
    // Мокаем localStorage
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    })

    // Мокаем console.error
    vi.spyOn(console, "error").mockImplementation(consoleErrorMock)

    // Очищаем моки
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("should return the correct interface", () => {
    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Проверяем, что хук возвращает правильный интерфейс
    expect(result.current).toHaveProperty("currentLanguage")
    expect(result.current).toHaveProperty("systemLanguage")
    expect(result.current).toHaveProperty("isLoading")
    expect(result.current).toHaveProperty("error")
    expect(result.current).toHaveProperty("changeLanguage")
    expect(result.current).toHaveProperty("refreshLanguage")

    // Проверяем типы возвращаемых значений
    expect(typeof result.current.currentLanguage).toBe("string")
    expect(typeof result.current.systemLanguage).toBe("string")
    expect(typeof result.current.isLoading).toBe("boolean")
    expect(
      result.current.error === null || typeof result.current.error === "string",
    ).toBe(true)
    expect(typeof result.current.changeLanguage).toBe("function")
    expect(typeof result.current.refreshLanguage).toBe("function")
  })

  it("should fetch language from Tauri backend on mount", async () => {
    // Мокаем успешный ответ от Tauri
    invokeMock.mockResolvedValueOnce({
      language: "en",
      system_language: "fr",
    })

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Проверяем начальное состояние
    expect(result.current.isLoading).toBe(true)

    // Ждем завершения асинхронных операций
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invokeMock).toHaveBeenCalledWith("get_app_language")

    // Проверяем, что язык был сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "en")

    // Проверяем, что системный язык был установлен
    expect(result.current.systemLanguage).toBe("fr")
  })

  it("should use default language if backend returns unsupported language", async () => {
    // Мокаем ответ с неподдерживаемым языком
    invokeMock.mockResolvedValueOnce({
      language: "unsupported",
      system_language: "unsupported",
    })

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения асинхронных операций
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что язык по умолчанию был сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "app-language",
      DEFAULT_LANGUAGE,
    )

    // Проверяем, что системный язык был установлен на значение по умолчанию
    expect(result.current.systemLanguage).toBe(DEFAULT_LANGUAGE)
  })

  it("should handle error when fetching language from backend", async () => {
    // Мокаем ошибку при вызове invoke
    const errorMessage = "Failed to fetch language"
    invokeMock.mockRejectedValueOnce(new Error(errorMessage))

    // Мокаем успешное получение языка из localStorage
    localStorageMock.getItem.mockReturnValueOnce("fr")

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения асинхронных операций
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что ошибка была установлена
    expect(result.current.error).toBe(errorMessage)

    // Проверяем, что была попытка получить язык из localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith("app-language")

    // Проверяем, что ошибка была залогирована
    expect(consoleErrorMock).toHaveBeenCalled()
  })

  it("should change language when changeLanguage is called", async () => {
    // Мокаем успешный ответ от Tauri
    invokeMock.mockResolvedValueOnce({
      language: "en",
      system_language: "fr",
    })

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения начальной загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Сбрасываем моки
    vi.clearAllMocks()

    // Мокаем успешный ответ от Tauri для изменения языка
    invokeMock.mockResolvedValueOnce({
      language: "de",
      system_language: "fr",
    })

    // Вызываем changeLanguage в act
    act(() => {
      void result.current.changeLanguage("de" as LanguageCode)
    })

    // Ждем завершения изменения языка
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invokeMock).toHaveBeenCalledWith("set_app_language", { lang: "de" })

    // Проверяем, что язык был сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "de")
  })

  it("should handle error when changing language", async () => {
    // Мокаем успешный ответ от Tauri для начальной загрузки
    invokeMock.mockResolvedValueOnce({
      language: "en",
      system_language: "fr",
    })

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения начальной загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Сбрасываем моки
    vi.clearAllMocks()

    // Мокаем ошибку при изменении языка
    const errorMessage = "Failed to change language"
    invokeMock.mockRejectedValueOnce(new Error(errorMessage))

    // Вызываем changeLanguage в act
    act(() => {
      void result.current.changeLanguage("es" as LanguageCode)
    })

    // Ждем завершения изменения языка
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что ошибка была установлена
    expect(result.current.error).toBe(errorMessage)

    // Проверяем, что язык был сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "es")

    // Проверяем, что ошибка была залогирована
    expect(consoleErrorMock).toHaveBeenCalled()
  })

  it("should refresh language when refreshLanguage is called", async () => {
    // Мокаем успешный ответ от Tauri для начальной загрузки
    invokeMock.mockResolvedValueOnce({
      language: "en",
      system_language: "fr",
    })

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения начальной загрузки
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Сбрасываем моки
    vi.clearAllMocks()

    // Мокаем успешный ответ от Tauri для обновления языка
    invokeMock.mockResolvedValueOnce({
      language: "ru",
      system_language: "fr",
    })

    // Вызываем refreshLanguage в act
    act(() => {
      void result.current.refreshLanguage()
    })

    // Ждем завершения обновления языка
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что invoke был вызван с правильными параметрами
    expect(invokeMock).toHaveBeenCalledWith("get_app_language")

    // Проверяем, что язык был сохранен в localStorage
    expect(localStorageMock.setItem).toHaveBeenCalledWith("app-language", "ru")
  })

  it("should use language from localStorage if available", async () => {
    // Мокаем успешное получение языка из localStorage
    localStorageMock.getItem.mockReturnValueOnce("fr")

    // Мокаем ошибку при вызове invoke
    invokeMock.mockRejectedValueOnce(new Error("Failed to fetch language"))

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения асинхронных операций
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что была попытка получить язык из localStorage
    expect(localStorageMock.getItem).toHaveBeenCalledWith("app-language")

    // Проверяем, что текущий язык установлен из localStorage
    expect(result.current.currentLanguage).toBe("ru") // Мок i18n.language всегда возвращает "ru"
  })

  it("should handle localStorage errors gracefully", async () => {
    // Мокаем ошибку при доступе к localStorage
    const originalGetItem = localStorageMock.getItem
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("localStorage is not available")
    })

    // Мокаем ошибку при вызове invoke
    invokeMock.mockRejectedValueOnce(new Error("Failed to fetch language"))

    // Рендерим хук
    const { result } = renderHook(() => useLanguage())

    // Ждем завершения асинхронных операций
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Проверяем, что ошибка была установлена
    expect(result.current.error).toBe("Failed to fetch language")

    // Проверяем, что ошибка была залогирована
    expect(consoleErrorMock).toHaveBeenCalled()

    // Восстанавливаем оригинальную реализацию
    localStorageMock.getItem = originalGetItem
  })
})
