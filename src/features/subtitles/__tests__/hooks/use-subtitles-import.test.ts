import { invoke } from "@tauri-apps/api/core"
import { open } from "@tauri-apps/plugin-dialog"
import { act, renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// import { createWrapper } from "@/test/test-utils"

import { useSubtitlesImport } from "../../hooks/use-subtitles-import"

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
}))

vi.mock("@/features/timeline/hooks/use-timeline", () => ({
  useTimeline: () => ({}),
}))

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

describe("useSubtitlesImport", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should import single subtitle file", async () => {
    const mockFilePath = "/path/to/subtitle.srt"
    const mockContent = `1
00:00:00,000 --> 00:00:02,000
Test subtitle`

    vi.mocked(open).mockResolvedValueOnce(mockFilePath)
    vi.mocked(invoke).mockResolvedValueOnce({
      content: mockContent,
      format: "srt",
      file_name: "subtitle.srt",
    })

    const { result } = renderHook(() => useSubtitlesImport())

    expect(result.current.isImporting).toBe(false)

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(open).toHaveBeenCalledWith({
      multiple: false,
      filters: [
        {
          name: "Subtitle Files",
          extensions: ["srt", "vtt", "ass", "ssa"],
        },
      ],
    })

    expect(invoke).toHaveBeenCalledWith("read_subtitle_file", {
      file_path: mockFilePath,
    })
  })

  it("should import multiple subtitle files", async () => {
    const mockFilePaths = ["/path/to/subtitle1.srt", "/path/to/subtitle2.vtt"]
    const mockContent1 = `1
00:00:00,000 --> 00:00:02,000
First subtitle`
    const mockContent2 = `WEBVTT

00:00:03.000 --> 00:00:05.000
Second subtitle`

    vi.mocked(open).mockResolvedValueOnce(mockFilePaths)
    vi.mocked(invoke)
      .mockResolvedValueOnce({
        content: mockContent1,
        format: "srt",
        file_name: "subtitle1.srt",
      })
      .mockResolvedValueOnce({
        content: mockContent2,
        format: "vtt",
        file_name: "subtitle2.vtt",
      })

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFiles()
    })

    expect(open).toHaveBeenCalledWith({
      multiple: true,
      filters: [
        {
          name: "Subtitle Files",
          extensions: ["srt", "vtt", "ass", "ssa"],
        },
      ],
    })

    expect(invoke).toHaveBeenCalledTimes(2)
  })

  it("should handle import errors gracefully", async () => {
    const mockError = new Error("Failed to read file")
    vi.mocked(open).mockResolvedValueOnce("/path/to/subtitle.srt")
    vi.mocked(invoke).mockRejectedValueOnce(mockError)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(result.current.isImporting).toBe(false)
  })

  it("should handle cancelled file dialog", async () => {
    vi.mocked(open).mockResolvedValueOnce(null)

    const { result } = renderHook(() => useSubtitlesImport())

    await act(async () => {
      await result.current.importSubtitleFile()
    })

    expect(invoke).not.toHaveBeenCalled()
  })

  it("should set isImporting state correctly", async () => {
    let resolveOpen: (value: any) => void
    const openPromise = new Promise((resolve) => {
      resolveOpen = resolve
    })
    vi.mocked(open).mockReturnValueOnce(openPromise)

    const { result } = renderHook(() => useSubtitlesImport())

    expect(result.current.isImporting).toBe(false)

    // Запускаем импорт
    const importPromise = result.current.importSubtitleFile()

    // Проверяем что состояние изменилось на true
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1))
    })
    expect(result.current.isImporting).toBe(true)

    // Заканчиваем операцию
    resolveOpen!(null)
    await act(async () => {
      await importPromise
    })

    expect(result.current.isImporting).toBe(false)
  })
})
