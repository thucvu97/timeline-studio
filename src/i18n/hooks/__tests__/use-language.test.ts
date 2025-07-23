import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useLanguage } from "@/features/language"

// Mock Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: (cmd: string, args?: any) => mockInvoke(cmd, args),
}))

// Mock react-i18next
const mockChangeLanguage = vi.fn()
const mockI18n = {
  language: "en",
  changeLanguage: mockChangeLanguage,
}

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: mockI18n,
  }),
}))

describe("useLanguage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockI18n.language = "en"
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with loading state", () => {
    mockInvoke.mockResolvedValue({
      language: "en",
      system_language: "en",
    })

    const { result } = renderHook(() => useLanguage())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it("should fetch language from backend on mount", async () => {
    mockInvoke.mockResolvedValue({
      language: "ru",
      system_language: "en",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockInvoke).toHaveBeenCalledWith("get_app_language_tauri", undefined)
    expect(mockChangeLanguage).toHaveBeenCalledWith("ru")
    expect(result.current.currentLanguage).toBe("en") // Still returns i18n.language
    expect(result.current.systemLanguage).toBe("en")
  })

  it("should handle unsupported languages", async () => {
    // Set current language to something else to test the fallback
    mockI18n.language = "ru"

    mockInvoke.mockResolvedValue({
      language: "unsupported",
      system_language: "invalid",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Check that it falls back to default language
    expect(mockChangeLanguage).toHaveBeenCalledWith("en") // Falls back to default
    expect(result.current.systemLanguage).toBe("en") // Falls back to default
  })

  it("should change language successfully", async () => {
    mockInvoke.mockResolvedValue({
      language: "en",
      system_language: "en",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Change language
    await act(async () => {
      await result.current.changeLanguage("es")
    })

    expect(mockChangeLanguage).toHaveBeenCalledWith("es")
    expect(localStorage.getItem("app-language")).toBe("es")
    expect(mockInvoke).toHaveBeenCalledWith("set_app_language_tauri", { lang: "es" })
  })

  it("should handle errors when fetching language", async () => {
    const error = new Error("Failed to fetch language")
    mockInvoke.mockRejectedValue(error)

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Failed to fetch language")
  })

  it("should fallback to localStorage on fetch error", async () => {
    const error = new Error("Failed to fetch language")
    mockInvoke.mockRejectedValue(error)
    localStorage.setItem("app-language", "fr")

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChangeLanguage).toHaveBeenCalledWith("fr")
  })

  it("should handle change language errors", async () => {
    mockInvoke
      .mockResolvedValueOnce({
        language: "en",
        system_language: "en",
      })
      .mockRejectedValueOnce(new Error("Failed to set language"))

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.changeLanguage("de")
    })

    expect(result.current.error).toBe("Failed to set language")
  })

  it("should not change language if already set", async () => {
    mockI18n.language = "ru"
    mockInvoke.mockResolvedValue({
      language: "ru",
      system_language: "en",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(mockChangeLanguage).not.toHaveBeenCalled()
  })

  it("should refresh language on demand", async () => {
    mockInvoke.mockResolvedValue({
      language: "en",
      system_language: "en",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    mockInvoke.mockClear()
    mockInvoke.mockResolvedValue({
      language: "ja",
      system_language: "ja",
    })

    await act(async () => {
      await result.current.refreshLanguage()
    })

    expect(mockInvoke).toHaveBeenCalledWith("get_app_language_tauri", undefined)
    expect(mockChangeLanguage).toHaveBeenCalledWith("ja")
  })

  it("should save language to localStorage", async () => {
    mockInvoke.mockResolvedValue({
      language: "ko",
      system_language: "ko",
    })

    const { result } = renderHook(() => useLanguage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(localStorage.getItem("app-language")).toBe("ko")
  })
})
