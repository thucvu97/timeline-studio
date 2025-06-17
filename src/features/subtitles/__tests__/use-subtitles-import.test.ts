import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useSubtitlesImport } from "../hooks/use-subtitles-import"

// Мокаем Tauri API
vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

describe("useSubtitlesImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy.mockClear()
    consoleErrorSpy.mockClear()
  })

  afterEach(async () => {
    // Ждем завершения всех промисов
    await vi.waitFor(
      () => {
        // Даем время для завершения всех асинхронных операций
        return true
      },
      { timeout: 100 },
    )

    // Очищаем все таймеры
    vi.clearAllTimers()
  })

  it("должен импортировать JSON файл со стилями", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    vi.mocked(open).mockResolvedValue("/path/to/styles.json")

    const { result } = renderHook(() => useSubtitlesImport())

    expect(result.current.isImporting).toBe(false)

    await act(async () => {
      await result.current.importSubtitlesFile()
    })

    expect(open).toHaveBeenCalledWith({
      multiple: false,
      filters: [
        {
          name: "Subtitles JSON",
          extensions: ["json"],
        },
      ],
    })

    expect(consoleSpy).toHaveBeenCalledWith("Импорт JSON файла со стилями субтитров:", "/path/to/styles.json")
    expect(result.current.isImporting).toBe(false)
  })

  it("должен импортировать отдельные файлы стилей", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    vi.mocked(open).mockResolvedValue(["/path/to/style1.css", "/path/to/style2.srt"])

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(open).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Subtitle Style Files",
          extensions: ["css", "json", "srt", "vtt", "ass"],
        },
      ],
    })

    expect(consoleSpy).toHaveBeenCalledWith("Импорт файлов стилей субтитров:", [
      "/path/to/style1.css",
      "/path/to/style2.srt",
    ])
  })

  it("должен обрабатывать отмену выбора файла", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    vi.mocked(open).mockResolvedValue(null)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitlesFile()
    })

    expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining("Импорт JSON файла"))
    expect(result.current.isImporting).toBe(false)
  })

  it.skip("должен обрабатывать ошибки при импорте", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    const testError = new Error("Dialog error")
    vi.mocked(open).mockRejectedValue(testError)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitlesFile()
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith("Ошибка при импорте стилей субтитров:", testError)
    expect(result.current.isImporting).toBe(false)
  })

  it("должен предотвращать двойной импорт", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    // Мокаем долгую операцию
    let resolveOpen: (value: string) => void
    const openPromise = new Promise<string>((resolve) => {
      resolveOpen = resolve
    })
    vi.mocked(open).mockReturnValue(openPromise)

    const { result } = renderHook(() => useSubtitlesImport())

    // Запускаем первый импорт без ожидания завершения
    act(() => {
      void result.current.importSubtitlesFile()
    })

    // Проверяем что isImporting установился в true
    expect(result.current.isImporting).toBe(true)

    // Пытаемся запустить второй импорт
    await act(async () => {
      await result.current.importSubtitlesFile()
    })

    // Проверяем что open вызван только один раз
    expect(open).toHaveBeenCalledTimes(1)

    // Завершаем первый импорт
    await act(async () => {
      resolveOpen!("/path/to/file.json")
      // Ждем пока промис разрешится
      await openPromise
    })

    // Убеждаемся что isImporting сбросился
    expect(result.current.isImporting).toBe(false)
  })

  it("должен обрабатывать единичный файл как массив", async () => {
    const { open } = await import("@tauri-apps/plugin-dialog")

    // Возвращаем единичный файл вместо массива
    vi.mocked(open).mockResolvedValue("/path/to/single.css")

    const { result } = renderHook(() => useSubtitlesImport())

    // Ждем пока хук инициализируется
    await vi.waitFor(() => {
      expect(result.current).not.toBeNull()
    })

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    // Проверяем что единичный файл преобразован в массив
    expect(consoleSpy).toHaveBeenCalledWith("Импорт файлов стилей субтитров:", ["/path/to/single.css"])
  })

  it("должен экспортировать правильные функции", async () => {
    const { result } = renderHook(() => useSubtitlesImport())

    // Ждем пока хук инициализируется
    await vi.waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current).not.toBeUndefined()
    })

    expect(result.current).toHaveProperty("importSubtitlesFile")
    expect(result.current).toHaveProperty("importSubtitleFile")
    expect(result.current).toHaveProperty("isImporting")

    expect(typeof result.current.importSubtitlesFile).toBe("function")
    expect(typeof result.current.importSubtitleFile).toBe("function")
    expect(typeof result.current.isImporting).toBe("boolean")
  })
})
