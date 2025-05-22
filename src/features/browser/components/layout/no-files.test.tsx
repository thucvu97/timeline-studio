import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { NoFiles } from "./no-files"

// Мокаем react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "browser.noFiles.title": "No files found",
        "browser.noFiles.addFilesPrompt": "Add files to the following directories:",
        "browser.noFiles.mediaTypes": "Video and image files",
        "browser.noFiles.musicType": "Audio files",
        "browser.noFiles.supportedVideoFormats": "Supported video formats: MP4, MOV, AVI, MKV",
        "browser.noFiles.supportedAudioFormats": "Supported audio formats: MP3, WAV, OGG, FLAC",
      }
      return translations[key] || key
    },
  }),
}))

describe("NoFiles", () => {
  it("should render the component with correct translations", () => {
    render(<NoFiles />)

    // Проверяем, что заголовок отображается
    expect(screen.getByText("No files found")).toBeInTheDocument()

    // Проверяем, что подсказка отображается
    expect(screen.getByText("Add files to the following directories:")).toBeInTheDocument()

    // Проверяем, что пути к директориям отображаются
    expect(screen.getByText("/public/media/")).toBeInTheDocument()
    expect(screen.getByText("/public/music/")).toBeInTheDocument()

    // Проверяем, что типы файлов отображаются
    expect(screen.getByText("Video and image files")).toBeInTheDocument()
    expect(screen.getByText("Audio files")).toBeInTheDocument()

    // Проверяем, что поддерживаемые форматы отображаются
    // Используем регулярное выражение для поиска текста, так как он может быть разбит на несколько элементов
    expect(screen.getByText(/Supported video formats/)).toBeInTheDocument()
    expect(screen.getByText(/Supported audio formats/)).toBeInTheDocument()
  })

  it("should have the correct structure", () => {
    render(<NoFiles />)

    // Проверяем, что контейнер существует
    const container = screen.getByText("No files found").closest("div")?.parentElement
    expect(container).toBeInTheDocument()

    // Проверяем, что заголовок существует
    const title = screen.getByText("No files found")
    expect(title).toBeInTheDocument()

    // Проверяем, что подсказка существует
    const prompt = screen.getByText("Add files to the following directories:")
    expect(prompt).toBeInTheDocument()

    // Проверяем, что директории существуют
    const mediaPath = screen.getByText("/public/media/")
    expect(mediaPath).toBeInTheDocument()

    const musicPath = screen.getByText("/public/music/")
    expect(musicPath).toBeInTheDocument()

    // Проверяем, что типы файлов существуют
    expect(screen.getByText("Video and image files")).toBeInTheDocument()
    expect(screen.getByText("Audio files")).toBeInTheDocument()

    // Проверяем, что поддерживаемые форматы существуют
    const videoFormats = screen.getByText(/Supported video formats/)
    expect(videoFormats).toBeInTheDocument()

    const audioFormats = screen.getByText(/Supported audio formats/)
    expect(audioFormats).toBeInTheDocument()
  })
})
